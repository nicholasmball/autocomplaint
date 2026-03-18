import Anthropic from '@anthropic-ai/sdk'

export interface ScrapeResult {
  companyId: string
  companyName: string
  currentEmail: string
  foundEmail: string | null
  sourceUrl: string | null
  confidence: 'high' | 'medium' | 'low' | 'none'
  status: 'verified' | 'updated' | 'not_found' | 'error'
  diff: boolean
  error?: string
}

const anthropic = new Anthropic()

const SEARCH_PATHS = ['/complaints', '/contact', '/contact-us', '/help/complaints', '/help/contact']

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AutoComplaint Contact Validator/1.0 (complaint email lookup)',
        'Accept': 'text/html',
      },
    })

    clearTimeout(timeout)

    if (!res.ok) return null

    const html = await res.text()
    // Strip to text content — remove scripts, styles, and HTML tags
    const stripped = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Limit to first 8000 chars to fit in context
    return stripped.slice(0, 8000)
  } catch {
    return null
  }
}

async function findContactPage(companyName: string): Promise<{ content: string; url: string } | null> {
  // Try common URL patterns based on company name
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

  const domains = [
    `https://www.${slug}.co.uk`,
    `https://www.${slug}.com`,
    `https://${slug}.co.uk`,
  ]

  for (const domain of domains) {
    for (const path of SEARCH_PATHS) {
      const url = `${domain}${path}`
      const content = await fetchPage(url)
      if (content && content.length > 200) {
        return { content, url }
      }
      // Rate limit: 1 req/sec
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  return null
}

async function extractEmail(companyName: string, pageContent: string): Promise<{ email: string | null; confidence: 'high' | 'medium' | 'low' | 'none' }> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Extract the complaint email address for "${companyName}" from this webpage text. Return ONLY a JSON object with two fields:
- "email": the complaint/customer service email address (or null if not found)
- "confidence": "high" if explicitly labelled as complaints email, "medium" if it's a general customer service email, "low" if you're guessing, "none" if not found

Webpage text:
${pageContent}`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) return { email: null, confidence: 'none' }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      email: parsed.email || null,
      confidence: parsed.confidence || 'none',
    }
  } catch {
    return { email: null, confidence: 'none' }
  }
}

export async function validateCompany(company: {
  id: string
  name: string
  complaint_email: string
}): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    companyId: company.id,
    companyName: company.name,
    currentEmail: company.complaint_email,
    foundEmail: null,
    sourceUrl: null,
    confidence: 'none',
    status: 'not_found',
    diff: false,
  }

  try {
    const page = await findContactPage(company.name)

    if (!page) {
      result.status = 'not_found'
      return result
    }

    result.sourceUrl = page.url
    const extracted = await extractEmail(company.name, page.content)
    result.foundEmail = extracted.email
    result.confidence = extracted.confidence

    if (!extracted.email) {
      result.status = 'not_found'
    } else if (extracted.email.toLowerCase() === company.complaint_email.toLowerCase()) {
      result.status = 'verified'
      result.diff = false
    } else {
      result.status = 'updated'
      result.diff = true
    }
  } catch (err) {
    result.status = 'error'
    result.error = err instanceof Error ? err.message : 'Unknown error'
  }

  return result
}
