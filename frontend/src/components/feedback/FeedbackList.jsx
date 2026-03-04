import FeedbackCard from './FeedbackCard'

const FeedbackSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse space-y-2 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="space-y-1 flex-1">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
          </div>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      </div>
    ))}
  </div>
)

const FeedbackList = ({ feedbacks, loading, onReport, onDelete, currentUserName }) => {
  if (loading) return <FeedbackSkeleton />

  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-sm">No reviews yet. Be the first to review!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {feedbacks.map((feedback) => (
        <FeedbackCard
          key={feedback.id}
          feedback={feedback}
          onReport={onReport}
          onDelete={onDelete}
          currentUserName={currentUserName}
        />
      ))}
    </div>
  )
}

export default FeedbackList