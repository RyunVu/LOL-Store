export default function FeedbackFilters({ filters, setFilters, selectedFeedbacks, setSelectedFeedbacks, onBulkToggleHide, onBulkDelete, allSelectedAreHidden, allSelectedAreVisible }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 shadow-lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-white">Filter Feedbacks</h2>

          {/* Bulk Action Bar */}
          {selectedFeedbacks.length > 0 && (
            <div className="flex items-center gap-3 bg-gray-900 px-4 py-2 rounded-lg border border-gray-600">
              <span className="text-sm text-blue-400 font-medium">
                {selectedFeedbacks.length} selected
              </span>

              <div className="h-4 w-px bg-gray-600" />

              {!allSelectedAreVisible() && (
                <button
                  onClick={() => onBulkToggleHide(false)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  👁 Show
                </button>
              )}

              {!allSelectedAreHidden() && (
                <button
                  onClick={() => onBulkToggleHide(true)}
                  className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  🙈 Hide
                </button>
              )}

              <div className="h-4 w-px bg-gray-600" />

              <button
                onClick={onBulkDelete}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                🗑 Delete
              </button>

              <div className="h-4 w-px bg-gray-600" />

              <button
                onClick={() => setSelectedFeedbacks([])}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by username or content..."
            className="w-72 bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={filters.keyword}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, keyword: e.target.value, pageNumber: 1 }))
            }
          />

          <select
            className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            value={filters.isHidden}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, isHidden: e.target.value, pageNumber: 1 }))
            }
          >
            <option value="">All Visibility</option>
            <option value="false">Visible</option>
            <option value="true">Hidden</option>
          </select>

          <select
            className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            value={filters.minRating}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, minRating: e.target.value, pageNumber: 1 }))
            }
          >
            <option value="">Min Rating</option>
            {[1, 2, 3, 4, 5].map((r) => (
              <option key={r} value={r}>
                {'★'.repeat(r)} ({r}+)
              </option>
            ))}
          </select>

          <select
            className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            value={filters.maxRating}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, maxRating: e.target.value, pageNumber: 1 }))
            }
          >
            <option value="">Max Rating</option>
            {[1, 2, 3, 4, 5].map((r) => (
              <option key={r} value={r}>
                {'★'.repeat(r)} (up to {r})
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.hasReports}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, hasReports: e.target.checked, pageNumber: 1 }))
              }
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-sm text-gray-300">Has Reports Only</span>
          </label>

          <button
            onClick={() =>
              setFilters({
                keyword: '',
                isHidden: '',
                hasReports: false,
                minRating: '',
                maxRating: '',
                pageNumber: 1,
                pageSize: 10,
              })
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