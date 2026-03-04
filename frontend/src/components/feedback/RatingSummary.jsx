import StarDisplay from './ui/StarDisplay'

const RatingSummary = ({ feedbacks }) => {
  if (!feedbacks.length) return null

  const avg = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: feedbacks.filter((f) => f.rating === star).length,
  }))

  return (
    <div className="flex flex-col sm:flex-row gap-6 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 mb-6">
      <div className="flex flex-col items-center justify-center shrink-0">
        <span className="text-5xl font-black text-gray-900 dark:text-white">{avg.toFixed(1)}</span>
        <StarDisplay rating={Math.round(avg)} />
        <span className="text-xs text-gray-500 mt-1">{feedbacks.length} review(s)</span>
      </div>
      <div className="flex-1 space-y-2">
        {counts.map(({ star, count }) => {
          const pct = feedbacks.length > 0 ? (count / feedbacks.length) * 100 : 0
          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-4 shrink-0">{star}</span>
              <span className="text-yellow-400 text-xs shrink-0">★</span>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-gray-400 text-xs w-6 text-right shrink-0">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RatingSummary