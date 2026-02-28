export function CartSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 flex gap-4"
        >
          <div className="w-20 h-20 bg-gray-200 dark:bg-dark-700 rounded-xl shrink-0" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/4" />
            <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/3" />
          </div>
          <div className="w-24 space-y-3 pt-1">
            <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded" />
            <div className="h-8 bg-gray-200 dark:bg-dark-700 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}