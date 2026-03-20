import { STATUS_STYLES } from './types'

interface SummaryCardsProps {
  complaints: { status: string }[]
}

export function SummaryCards({ complaints }: SummaryCardsProps) {
  const total = complaints.length
  const byStatus = complaints.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {})
  const sent = (byStatus['delivered'] || 0) + (byStatus['sent'] || 0)
  const drafts = (byStatus['draft'] || 0) + (byStatus['generated'] || 0) + (byStatus['reviewed'] || 0)
  const timeSaved = (total - (byStatus['draft'] || 0)) * 2

  const cardBase = "bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm shadow-slate-900/5 dark:border dark:border-slate-700/50 p-6 transition-transform duration-200 hover:-translate-y-0.5"

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <div className={cardBase}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-400">Total Complaints</span>
          <div className="w-10 h-10 bg-slate-900/5 dark:bg-white/5 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
        </div>
        <div className="text-3xl font-semibold text-slate-900 dark:text-white">{total}</div>
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

      <div className={cardBase}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-400">Sent</span>
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
        </div>
        <div className="text-3xl font-semibold text-slate-900 dark:text-white">{sent}</div>
        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">{total > 0 ? Math.round((sent / total) * 100) : 0}% delivery rate</p>
      </div>

      <div className={cardBase}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-400">Drafts</span>
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
        </div>
        <div className="text-3xl font-semibold text-slate-900 dark:text-white">{drafts}</div>
        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">{byStatus['generated'] || 0} ready to send</p>
      </div>

      <div className={cardBase}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-400">Time Saved</span>
          <div className="w-10 h-10 bg-slate-900/5 dark:bg-white/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
        </div>
        <div className="text-3xl font-semibold text-slate-900 dark:text-white">{timeSaved} hrs</div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">~2 hrs per complaint</p>
      </div>
    </div>
  )
}
