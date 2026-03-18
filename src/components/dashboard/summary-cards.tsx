import { Complaint, STATUS_STYLES } from './types'

interface SummaryCardsProps {
  complaints: Complaint[]
}

export function SummaryCards({ complaints }: SummaryCardsProps) {
  const total = complaints.length
  const byStatus = complaints.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {})
  const generated = (byStatus['generated'] || 0) + (byStatus['reviewed'] || 0) + (byStatus['delivered'] || 0)
  const timeSaved = generated * 2
  const delivered = byStatus['delivered'] || 0
  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Complaints</p>
        <p className="text-2xl font-bold">{total}</p>
        <div className="flex gap-2 flex-wrap mt-2">
          {Object.entries(byStatus).map(([status, count]) => (
            <span
              key={status}
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}
            >
              {count} {status}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-900 p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Time Saved</p>
        <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{timeSaved} hours</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">~2 hrs per generated complaint</p>
      </div>

      <div className="hidden md:block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Delivery Rate</p>
        <p className="text-2xl font-bold">{deliveryRate}%</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{delivered} of {total} complaints delivered</p>
      </div>
    </div>
  )
}
