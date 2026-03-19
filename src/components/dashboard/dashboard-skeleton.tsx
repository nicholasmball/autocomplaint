export function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-56 bg-slate-100 dark:bg-slate-700 rounded-lg mb-2" />
          <div className="h-4 w-40 bg-slate-100 dark:bg-slate-700 rounded" />
        </div>
        <div className="h-10 w-40 bg-slate-100 dark:bg-slate-700 rounded-xl" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm shadow-slate-900/5 dark:border dark:border-slate-700/50 p-6">
            <div className="h-4 w-24 bg-slate-100 dark:bg-slate-700 rounded mb-4" />
            <div className="h-8 w-16 bg-slate-100 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* List skeleton */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm shadow-slate-900/5 dark:border dark:border-slate-700/50 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center px-6 py-5 border-b border-slate-100/80 dark:border-slate-700/50 last:border-b-0">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 mr-4 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/5 bg-slate-100 dark:bg-slate-700 rounded" />
              <div className="h-3 w-2/5 bg-slate-100 dark:bg-slate-700 rounded" />
            </div>
            <div className="h-6 w-16 bg-slate-100 dark:bg-slate-700 rounded-full ml-3" />
          </div>
        ))}
      </div>
    </div>
  )
}
