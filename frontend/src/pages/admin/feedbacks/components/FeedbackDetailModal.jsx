import { Link } from 'react-router-dom'
import { renderStars, formatDate } from '../utils/FeedbackHelpers'

const getBaseUrl = () => import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? ''

export default function FeedbackDetailModal({ feedback, onClose, onToggleHide, onDelete }) {
  if (!feedback) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-white">💬 Feedback Detail</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* User + Meta */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-white font-semibold text-base">{feedback.userName}</p>
              <p className="text-gray-500 text-xs mt-0.5 font-mono">
                {formatDate(feedback.createdAt)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex">{renderStars(feedback.rating, 'text-lg')}</div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  feedback.isHidden
                    ? 'bg-gray-700 text-gray-400 border border-gray-600'
                    : 'bg-green-900/30 text-green-400 border border-green-800'
                }`}
              >
                {feedback.isHidden ? '🙈 Hidden' : '👁 Visible'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="bg-gray-700/40 border border-gray-600 rounded-lg p-4 mb-4">
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
              {feedback.content}
            </p>
          </div>

          {/* Images */}
          {feedback.pictureUrls?.length > 0 && (
            <div className="mb-4">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Photos ({feedback.pictureUrls.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {feedback.pictureUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={`${getBaseUrl()}/${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={`${getBaseUrl()}/${url}`}
                      alt={`Feedback photo ${idx + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-600 hover:border-blue-500 transition-colors"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Reports */}
          {feedback.reportCount > 0 && (
            <div className="mb-5">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                🚩 Reports
              </p>
              <div className="bg-orange-900/20 border border-orange-800/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Reports</span>
                  <span className="text-orange-400 font-semibold">{feedback.reportCount}</span>
                </div>
                {feedback.pendingReportCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pending</span>
                    <span className="text-red-400 font-semibold">{feedback.pendingReportCount}</span>
                  </div>
                )}

                {feedback.reports?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-gray-400 text-xs font-semibold">Report Reasons:</p>
                    {feedback.reports.map((report, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-800/60 border border-gray-700 rounded-md p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white text-xs font-medium">
                            {report.reporterName ?? 'Anonymous'}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              report.status === 'Pending'
                                ? 'bg-red-900/40 text-red-400 border border-red-800'
                                : 'bg-gray-700 text-gray-400 border border-gray-600'
                            }`}
                          >
                            {report.status}
                          </span>
                        </div>
                        <p className="text-gray-300 text-xs">{report.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
            <button
              onClick={onToggleHide}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                feedback.isHidden
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }`}
            >
              {feedback.isHidden ? '👁 Make Visible' : '🙈 Hide'}
            </button>

            {feedback.reportCount > 0 && (
              <Link
                to={`/admin/feedbacks/reports?feedbackId=${feedback.id}`}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white text-sm font-medium transition-colors"
                onClick={onClose}
              >
                View Full Reports
              </Link>
            )}

            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Delete
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}