export function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-9 w-36 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
            <div className="h-7 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        ))}
      </div>

      {/* List skeleton */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
            <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-800 mr-3 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/5 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-2.5 w-2/5 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
            <div className="h-5 w-18 bg-gray-200 dark:bg-gray-800 rounded-full ml-3" />
          </div>
        ))}
      </div>
    </div>
  )
}
