export default function FeedbackDeleteModal({ deleteModal, selectedCount, onConfirm, onClose }) {
  const { feedback, isMultiple } = deleteModal

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-3">
            ⚠️ Delete Feedback{isMultiple ? 's' : ''}
          </h3>
          <div className="mb-6 space-y-3">
            <p className="text-gray-300">
              Are you sure you want to{' '}
              <span className="text-red-400 font-semibold">permanently delete</span>{' '}
              {isMultiple ? `${selectedCount} feedback(s)` : 'this feedback'}?
            </p>
            {!isMultiple && feedback && (
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 space-y-1">
                <p className="text-white font-medium text-sm">{feedback.userName}</p>
                <p className="text-gray-400 text-sm line-clamp-2">{feedback.content}</p>
              </div>
            )}
            <p className="text-xs text-gray-500">This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 rounded-lg text-white font-medium transition-colors"
            >
              Delete Forever
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}