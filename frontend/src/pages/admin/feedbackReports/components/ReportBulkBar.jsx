/**
 * ReportBulkBar
 * Shown inside ReportFilters when selectedReports.length > 0.
 * Bulk actions:
 *  - Mark as Reviewed   (only if any selected are Pending)
 *  - Mark as Actioned   (only if any selected are Pending)
 *  - Show Feedback      (only if any linked feedback is hidden)
 *  - Hide Feedback      (only if any linked feedback is visible)
 *  - Delete Reports
 */
export default function ReportBulkBar({
  selectedReports,
  setSelectedReports,
  reports,
  onBulkReview,
  onBulkToggleFeedback,
  onBulkDelete,
}) {
  const selected = reports.filter((r) => selectedReports.includes(r.id))

  const anyPending      = selected.some((r) => r.status === 'Pending')
  const anyHidden       = selected.some((r) => r.feedbackIsHidden)
  const anyVisible      = selected.some((r) => !r.feedbackIsHidden)

  return (
    <div className="flex items-center gap-3 bg-gray-900 px-4 py-2 rounded-lg border border-gray-600 flex-wrap">
      <span className="text-sm text-blue-400 font-medium whitespace-nowrap">
        {selectedReports.length} selected
      </span>

      <div className="h-4 w-px bg-gray-600" />

      {/* Mark as Reviewed */}
      {anyPending && (
        <button
          onClick={() => onBulkReview('Reviewed')}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          👁 Mark Reviewed
        </button>
      )}

      {/* Mark as Actioned */}
      {anyPending && (
        <button
          onClick={() => onBulkReview('Actioned')}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          ✅ Mark Actioned
        </button>
      )}

      {(anyPending) && <div className="h-4 w-px bg-gray-600" />}

      {/* Show linked feedback */}
      {anyHidden && (
        <button
          onClick={() => onBulkToggleFeedback(false)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          👁 Show Feedback
        </button>
      )}

      {/* Hide linked feedback */}
      {anyVisible && (
        <button
          onClick={() => onBulkToggleFeedback(true)}
          className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          🙈 Hide Feedback
        </button>
      )}

      {(anyHidden || anyVisible) && <div className="h-4 w-px bg-gray-600" />}

      {/* Delete reports */}
      <button
        onClick={onBulkDelete}
        className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
      >
        🗑 Delete
      </button>

      <div className="h-4 w-px bg-gray-600" />

      <button
        onClick={() => setSelectedReports([])}
        className="text-gray-400 hover:text-white text-sm transition-colors"
      >
        ✕
      </button>
    </div>
  )
}