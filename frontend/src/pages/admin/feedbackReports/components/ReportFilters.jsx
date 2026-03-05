import ReportBulkBar from './ReportBulkBar'

export default function ReportFilters({
  filters,
  setFilters,
  selectedReports,
  setSelectedReports,
  reports,
  onBulkReview,
  onBulkToggleFeedback,
  onBulkDelete,
}) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 shadow-lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-white">Filter Reports</h2>

          {selectedReports.length > 0 && (
            <ReportBulkBar
              selectedReports={selectedReports}
              setSelectedReports={setSelectedReports}
              reports={reports}
              onBulkReview={onBulkReview}
              onBulkToggleFeedback={onBulkToggleFeedback}
              onBulkDelete={onBulkDelete}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by reporter, reason, or feedback content..."
            className="w-80 bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={filters.keyword}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, keyword: e.target.value, pageNumber: 1 }))
            }
          />

          <select
            className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value, pageNumber: 1 }))
            }
          >
            <option value="">All Status</option>
            <option value="Pending">⏳ Pending</option>
            <option value="Reviewed">👁 Reviewed</option>
            <option value="Actioned">✅ Actioned</option>
          </select>

          {filters.feedbackId && (
            <div className="flex items-center gap-2 bg-orange-900/20 border border-orange-800 rounded-lg px-3 py-2">
              <span className="text-orange-400 text-sm">Filtered by Feedback</span>
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, feedbackId: '', pageNumber: 1 }))
                }
                className="text-orange-400 hover:text-white text-sm transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          <button
            onClick={() =>
              setFilters({ keyword: '', status: '', feedbackId: '', pageNumber: 1, pageSize: 10 })
            }
            className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}