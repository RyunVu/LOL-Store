import { renderStars, formatDate } from '../utils/FeedbackHelpers'
import AdminPagination from '../../../../components/pagination/AdminPagination'

export default function FeedbackTable({
  feedbacks,
  loading,
  filters,
  setFilters,
  totalItems,
  selectedFeedbacks,
  onSelectAll,
  onSelectFeedback,
  onToggleHide,
  onOpenDetail,
  onOpenReports,
  onOpenDelete,
}) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
      {loading ? (
        <div className="p-12 text-center text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
          <p>Loading feedbacks...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          <p className="text-lg mb-2">No feedbacks found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={
                        feedbacks.length > 0 &&
                        selectedFeedbacks.length === feedbacks.length
                      }
                      onChange={onSelectAll}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                    />
                  </th>
                  {['No', 'User', 'Rating', 'Content', 'Pictures', 'Reports', 'Visibility', 'Date', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap ${h === 'Actions' ? 'text-center' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-700">
                {feedbacks.map((feedback, i) => (
                  <tr
                    key={feedback.id}
                    className={`hover:bg-gray-700/40 transition-colors ${
                      selectedFeedbacks.includes(feedback.id) ? 'bg-gray-700/20' : ''
                    } ${feedback.isHidden ? 'opacity-60' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedFeedbacks.includes(feedback.id)}
                        onChange={() => onSelectFeedback(feedback.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                    </td>

                    {/* No */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                      {(filters.pageNumber - 1) * filters.pageSize + i + 1}
                    </td>

                    {/* User */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white font-medium text-sm">{feedback.userName}</span>
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex">{renderStars(feedback.rating)}</div>
                    </td>

                    {/* Content */}
                    <td className="px-6 py-4">
                      <button onClick={() => onOpenDetail(feedback)} className="text-left group">
                        <p className="text-gray-300 text-sm max-w-xs line-clamp-2 group-hover:text-blue-400 transition-colors">
                          {feedback.content}
                        </p>
                        <span className="text-xs text-blue-500 group-hover:text-blue-400 mt-0.5 block">
                          View full ↗
                        </span>
                      </button>
                    </td>

                    {/* Pictures */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {feedback.pictureUrls?.length > 0 ? (
                        <button
                          onClick={() => onOpenDetail(feedback)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {feedback.pictureUrls.length} photo(s)
                        </button>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>

                    {/* Reports */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {feedback.reportCount > 0 ? (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => onOpenDetail(feedback)}
                            className="text-orange-400 hover:text-orange-300 text-sm font-medium text-left transition-colors"
                          >
                            {feedback.reportCount} report(s)
                          </button>
                          {feedback.pendingReportCount > 0 && (
                            <span className="text-xs text-red-400">
                              {feedback.pendingReportCount} pending
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-sm">—</span>
                      )}
                    </td>

                    {/* Visibility */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          feedback.isHidden
                            ? 'bg-gray-700 text-gray-400 border border-gray-600'
                            : 'bg-green-900/30 text-green-400 border border-green-800'
                        }`}
                      >
                        {feedback.isHidden ? '🙈 Hidden' : '👁 Visible'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm font-mono">
                      {formatDate(feedback.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => onOpenDetail(feedback)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                        >
                          View
                        </button>

                        <button
                          onClick={() => onToggleHide(feedback)}
                          className={`text-sm font-medium transition-colors ${
                            feedback.isHidden
                              ? 'text-green-400 hover:text-green-300'
                              : 'text-yellow-400 hover:text-yellow-300'
                          }`}
                        >
                          {feedback.isHidden ? 'Show' : 'Hide'}
                        </button>

                        {feedback.reportCount > 0 && (
                          <button
                            onClick={() => onOpenReports(feedback)}
                            className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
                          >
                            Reports
                          </button>
                        )}

                        <button
                          onClick={() => onOpenDelete(feedback)}
                          className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminPagination
            filters={filters}
            totalItems={totalItems}
            setFilters={setFilters}
          />
        </>
      )}
    </div>
  )
}