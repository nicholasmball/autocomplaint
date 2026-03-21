import Anthropic from '@anthropic-ai/sdk'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export type RecipientTable = 'companies' | 'councils' | 'regulators'

export interface ScrapeResult {
  companyId: string
  companyName: string
  currentEmail: string
  foundEmail: string | null
  sourceUrl: string | null
  confidence: 'high' | 'medium' | 'low' | 'none'
  status: 'verified' | 'updated' | 'not_found' | 'error'
  diff: boolean
  jsRendered?: boolean
  error?: string
}

const anthropic = new Anthropic()

const SEARCH_PATHS = ['/complaints', '/contact', '/contact-us', '/help/complaints', '/help/contact']

function getLocalChromePath(): string | null {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
  ]
  // In non-serverless environments, try common paths
  for (const p of paths) {
    try {
      require('fs').accessSync(p)
      return p
    } catch { /* not found */ }
  }
  return null
}

async function fetchPageWithBrowser(url: string): Promise<string | null> {
  let browser = null
  try {
    const isServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL

    const executablePath = isServerless
      ? await chromium.executablePath()
      : getLocalChromePath()

    if (!executablePath) return null

    browser = await puppeteer.launch({
      args: isServerless ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 },
      executablePath,
      headless: true,
    })

    const page = await browser.newPage()
    await page.setUserAgent('AutoComplaint Contact Validator/1.0 (complaint email lookup)')
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 })

    const text = await page.evaluate(() => document.body.innerText)
    const trimmed = text.replace(/\s+/g, ' ').trim().slice(0, 8000)

    return trimmed.length > 50 ? trimmed : null
  } catch {
    return null
  } finally {
    if (browser) await browser.close().catch(() => {})
  }
}

async function fetchPage(url: string, useJsRendering = true): Promise<{ content: string | null; jsRendered: boolean }> {
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

    if (!res.ok) return { content: null, jsRendered: false }

    const html = await res.text()
    const stripped = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const content = stripped.slice(0, 8000)

    // If static HTML has enough content, use it
    if (content.length > 200) {
      return { content, jsRendered: false }
    }

    // Fallback: try JS rendering (if enabled)
    if (useJsRendering) {
      const jsContent = await fetchPageWithBrowser(url)
      if (jsContent) {
        return { content: jsContent, jsRendered: true }
      }
    }

    return { content: content.length > 0 ? content : null, jsRendered: false }
  } catch {
    // Static fetch failed entirely — try browser as last resort
    if (useJsRendering) {
      const jsContent = await fetchPageWithBrowser(url)
      return { content: jsContent, jsRendered: !!jsContent }
    }
    return { content: null, jsRendered: false }
  }
}

function getDomainsForTable(slug: string, table: RecipientTable): string[] {
  switch (table) {
    case 'councils':
      return [
        `https://www.${slug}.gov.uk`,
        `https://${slug}.gov.uk`,
        `https://www.${slug}.co.uk`,
      ]
    case 'regulators':
      return [
        `https://www.${slug}.org.uk`,
        `https://${slug}.org.uk`,
        `https://www.${slug}.gov.uk`,
        `https://www.${slug}.co.uk`,
      ]
    default:
      return [
        `https://www.${slug}.co.uk`,
        `https://www.${slug}.com`,
        `https://${slug}.co.uk`,
      ]
  }
}

async function findContactPage(
  name: string,
  { useJsRendering = true, website, table = 'companies' }: { useJsRendering?: boolean; website?: string; table?: RecipientTable } = {}
): Promise<{ content: string; url: string; jsRendered: boolean } | null> {
  // If website is provided, use it directly as the base domain
  if (website) {
    const base = website.startsWith('http') ? website : `https://${website}`
    // Try the website root and common contact paths
    for (const path of ['', ...SEARCH_PATHS]) {
      const url = path ? `${base.replace(/\/$/, '')}${path}` : base
      const result = await fetchPage(url, useJsRendering)
      if (result.content && result.content.length > 200) {
        return { content: result.content, url, jsRendered: result.jsRendered }
      }
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  // Fallback: guess domains from name with table-specific patterns
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

  const domains = getDomainsForTable(slug, table)

  for (const domain of domains) {
    for (const path of SEARCH_PATHS) {
      const url = `${domain}${path}`
      const result = await fetchPage(url, useJsRendering)
      if (result.content && result.content.length > 200) {
        return { content: result.content, url, jsRendered: result.jsRendered }
      }
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

export async function validateRecipient(recipient: {
  id: string
  name: string
  complaint_email: string
  website?: string
}, { useJsRendering = true, table = 'companies' as RecipientTable }: { useJsRendering?: boolean; table?: RecipientTable } = {}): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    companyId: recipient.id,
    companyName: recipient.name,
    currentEmail: recipient.complaint_email,
    foundEmail: null,
    sourceUrl: null,
    confidence: 'none',
    status: 'not_found',
    diff: false,
  }

  try {
    const page = await findContactPage(recipient.name, {
      useJsRendering,
      website: recipient.website,
      table,
    })

    if (!page) {
      result.status = 'not_found'
      return result
    }

    result.sourceUrl = page.url
    result.jsRendered = page.jsRendered
    const extracted = await extractEmail(recipient.name, page.content)
    result.foundEmail = extracted.email
    result.confidence = extracted.confidence

    if (!extracted.email) {
      result.status = 'not_found'
    } else if (extracted.email.toLowerCase() === recipient.complaint_email.toLowerCase()) {
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

// Backward compatibility alias
export const validateCompany = validateRecipient
