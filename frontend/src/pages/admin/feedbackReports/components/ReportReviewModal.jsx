import { getBaseUrl } from '../utils/ReportHelpers'

const EMPTY_MODAL = { show: false, report: null, status: '', adminNote: '', hideFeedback: false }

export default function ReportReviewModal({ reviewModal, setReviewModal, onSubmit }) {
  const { report } = reviewModal
  if (!report) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700 shadow-2xl">
        <div className="p-6 space-y-5">
          <h3 className="text-lg font-bold text-white">Review Report</h3>

          {/* Feedback Preview */}
          <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-1">
            <p className="text-xs text-gray-500">Feedback by {report.feedbackUserName}</p>
            <p className="text-gray-200 text-sm">{report.feedbackContent}</p>

            {report.feedbackPictureUrls?.length > 0 && (
              <div className="flex gap-2 flex-wrap pt-2">
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
                      className="w-16 h-16 rounded-lg object-cover border border-gray-600 hover:border-blue-500 transition-colors cursor-zoom-in"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Report Reason */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Report Reason</p>
            <p className="text-orange-300 text-sm">{report.reason}</p>
            <p className="text-xs text-gray-500">Reported by: {report.reporterName}</p>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Decision *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  setReviewModal((prev) => ({ ...prev, status: 'Reviewed', hideFeedback: false }))
                }
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border ${
                  reviewModal.status === 'Reviewed'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>👁</span>
                <span>Reviewed (Keep)</span>
              </button>
              <button
                onClick={() =>
                  setReviewModal((prev) => ({ ...prev, status: 'Actioned', hideFeedback: true }))
                }
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border ${
                  reviewModal.status === 'Actioned'
                    ? 'bg-green-600 border-green-500 text-white'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>✅</span>
                <span>Actioned (Hide)</span>
              </button>
            </div>
          </div>

          {/* Hide feedback toggle — only when Actioned */}
          {reviewModal.status === 'Actioned' && (
            <label className="flex items-center gap-3 cursor-pointer bg-gray-700/40 px-4 py-3 rounded-lg border border-gray-600">
              <input
                type="checkbox"
                checked={reviewModal.hideFeedback}
                onChange={(e) =>
                  setReviewModal((prev) => ({ ...prev, hideFeedback: e.target.checked }))
                }
                className="w-4 h-4 accent-green-500"
              />
              <div>
                <p className="text-sm text-white font-medium">Hide the feedback</p>
                <p className="text-xs text-gray-400">Feedback will be hidden from public view</p>
              </div>
            </label>
          )}

          {/* Admin Note */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Admin Note <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Add a note about your decision..."
              className="w-full bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              value={reviewModal.adminNote}
              onChange={(e) =>
                setReviewModal((prev) => ({ ...prev, adminNote: e.target.value }))
              }
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setReviewModal(EMPTY_MODAL)}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={!reviewModal.status}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
            >
              Submit Review
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}