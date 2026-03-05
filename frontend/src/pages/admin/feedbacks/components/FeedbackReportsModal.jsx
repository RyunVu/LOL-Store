import { Link } from 'react-router-dom'

export default function FeedbackReportsModal({ feedback, onClose }) {
  if (!feedback) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700 shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">🚩 Reports for this Feedback</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 mb-4">
            <p className="text-gray-400 text-xs mb-1">Feedback by {feedback.userName}</p>
            <p className="text-white text-sm">{feedback.content}</p>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Reports</span>
              <span className="text-orange-400 font-semibold">{feedback.reportCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Pending</span>
              <span className="text-red-400 font-semibold">{feedback.pendingReportCount}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
            <Link
              to={`/admin/feedbacks/reports?feedbackId=${feedback.id}`}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-medium transition-colors"
              onClick={onClose}
            >
              View Full Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}