import { getBaseUrl, statusColors, statusIcons, formatDate } from '../utils/ReportHelpers'

export default function ReportDetailModal({ report, onClose, onReview, onToggleFeedback, onDelete }) {
  if (!report) return null

  const isPending = report.status === 'Pending'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-white">🚩 Report Detail</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Reporter + Status */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-white font-semibold text-base">{report.reporterName}</p>
              <p className="text-gray-500 text-xs mt-0.5 font-mono">{formatDate(report.createdAt)}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                statusColors[report.status] ?? 'bg-gray-700 text-gray-400'
              }`}
            >
              <span>{statusIcons[report.status] ?? '?'}</span>
              <span>{report.status}</span>
            </span>
          </div>

          {/* Report Reason */}
          <div className="mb-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Report Reason
            </p>
            <div className="bg-orange-900/20 border border-orange-800/50 rounded-lg p-3">
              <p className="text-orange-300 text-sm leading-relaxed">{report.reason}</p>
            </div>
          </div>

          {/* Linked Feedback */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                Linked Feedback
              </p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  report.feedbackIsHidden
                    ? 'bg-gray-700 text-gray-400 border border-gray-600'
                    : 'bg-green-900/30 text-green-400 border border-green-800'
                }`}
              >
                {report.feedbackIsHidden ? '🙈 Hidden' : '👁 Visible'}
              </span>
            </div>

            <div className="bg-gray-700/40 border border-gray-600 rounded-lg p-4">
              <p className="text-gray-500 text-xs mb-1">by {report.feedbackUserName}</p>
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                {report.feedbackContent}
              </p>

              {/* Feedback images */}
              {report.feedbackPictureUrls?.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-3">
                  {report.feedbackPictureUrls.map((url, i) => (
                    <a
                      key={i}
                      href={`${getBaseUrl()}/${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={`${getBaseUrl()}/${url}`}
                        alt={`Feedback photo ${i + 1}`}
                        className="w-20 h-20 rounded-lg object-cover border border-gray-600 hover:border-blue-500 transition-colors cursor-zoom-in"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Admin Note (if already reviewed) */}
          {report.adminNote && (
            <div className="mb-4">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Admin Note
              </p>
              <div className="bg-gray-700/40 border border-gray-600 rounded-lg p-3">
                <p className="text-gray-300 text-sm italic">"{report.adminNote}"</p>
                {report.reviewedAt && (
                  <p className="text-gray-500 text-xs mt-1 font-mono">
                    Reviewed at {formatDate(report.reviewedAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-gray-700">
            {/* Toggle feedback visibility */}
            <button
              onClick={onToggleFeedback}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                report.feedbackIsHidden
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }`}
            >
              {report.feedbackIsHidden ? '👁 Show Feedback' : '🙈 Hide Feedback'}
            </button>

            {/* Review (only if pending) */}
            {isPending && (
              <button
                onClick={onReview}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors"
              >
                Review
              </button>
            )}

            {/* Delete report */}
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