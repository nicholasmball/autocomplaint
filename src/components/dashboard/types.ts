export interface Complaint {
  id: string
  recipient_name: string
  recipient_type: string
  recipient_email: string
  category: string
  status: string
  delivery_method: string | null
  generated_subject: string | null
  generated_letter: string | null
  created_at: string
}

export const CATEGORY_ICONS: Record<string, string> = {
  'billing': '£',
  'poor-service': '★',
  'faulty-product': '⚠',
  'delivery': '▣',
  'contract-dispute': '⚖',
  'data-privacy': '⛿',
  'unfair-treatment': '✖',
  'accessibility': '♿',
}

export const CATEGORY_LABELS: Record<string, string> = {
  'billing': 'Billing',
  'poor-service': 'Poor Service',
  'faulty-product': 'Faulty Product',
  'delivery': 'Delivery',
  'contract-dispute': 'Contract Dispute',
  'data-privacy': 'Data Privacy',
  'unfair-treatment': 'Unfair Treatment',
  'accessibility': 'Accessibility',
}

export const STATUS_STYLES: Record<string, string> = {
  'draft': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  'generated': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'reviewed': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'delivered': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export const CATEGORIES = Object.keys(CATEGORY_LABELS)
export const STATUSES = ['draft', 'generated', 'reviewed', 'delivered'] as const
export const RECIPIENT_TYPES = ['company', 'mp', 'regulator'] as const

export type SortOption = 'newest' | 'oldest' | 'status' | 'recipient'

export function relativeDate(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Date unavailable'
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 0) return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const diffWeeks = Math.floor(diffDays / 7)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
