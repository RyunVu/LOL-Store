import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { feedbacksApi } from '@/api/feedbacks.api'
import { useDebounce } from '@/hooks/useDebounce'
import AdminPagination from '../../../components/pagination/AdminPagination'

export default function FeedbackManagePage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)

  const [deleteModal, setDeleteModal] = useState({ show: false, feedback: null })
  const [reportsModal, setReportsModal] = useState({ show: false, feedback: null })

  const [filters, setFilters] = useState({
    keyword: '',
    isHidden: '',
    hasReports: false,
    minRating: '',
    maxRating: '',
    pageNumber: 1,
    pageSize: 10,
  })

  const debouncedKeyword = useDebounce(filters.keyword, 300)

  const { pageNumber, pageSize, isHidden, hasReports, minRating, maxRating } = filters

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        pageNumber,
        pageSize,
        keyword: debouncedKeyword || undefined,
        isHidden: isHidden !== '' ? isHidden : undefined,
        hasReports: hasReports || undefined,
        minRating: minRating || undefined,
        maxRating: maxRating || undefined,
      }

      Object.keys(params).forEach((key) => {
        if (params[key] === undefined || params[key] === '') delete params[key]
      })

      const res = await feedbacksApi.getFeedbacksForAdmin(params)
      setFeedbacks(res?.items ?? [])
      setTotalItems(res?.metadata?.totalItemCount ?? 0)
    } catch (err) {
      console.error('Failed to fetch feedbacks:', err)
      setFeedbacks([])
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, pageNumber, pageSize, isHidden, hasReports, minRating, maxRating])

  useEffect(() => {
    fetchFeedbacks()
  }, [fetchFeedbacks])

  const handleToggleHide = async (feedback) => {
    try {
      await feedbacksApi.toggleHideFeedback(feedback.id)
      fetchFeedbacks()
    } catch (err) {
      console.error('Failed to toggle hide:', err)
      alert('Failed to update feedback visibility')
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.feedback) return
    try {
      await feedbacksApi.deleteFeedback(deleteModal.feedback.id)
      setDeleteModal({ show: false, feedback: null })
      fetchFeedbacks()
    } catch (err) {
      console.error('Failed to delete feedback:', err)
      alert('Failed to delete feedback')
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-600'}>
        ★
      </span>
    ))
  }

  const formatDate = (dateString) => {
    if (!dateString) return '--/--/----'
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Feedbacks</h1>
          <p className="text-gray-400 mt-1 text-sm">Manage customer reviews and reports</p>
        </div>

        <div className="flex gap-2">
          <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 text-sm">
            <span className="text-gray-400">Total: </span>
            <span className="text-white font-semibold">{totalItems}</span>
          </div>
          <Link
            to="/admin/feedbacks/reports"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors"
          >
            🚩 View Reports
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 shadow-lg">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white">Filter Feedbacks</h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search by username or content..."
              className="w-72 bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={filters.keyword}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, keyword: e.target.value, pageNumber: 1 }))
              }
            />

            {/* Visibility Filter */}
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

            {/* Min Rating */}
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

            {/* Max Rating */}
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

            {/* Has Reports Toggle */}
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

            {/* Clear */}
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

      {/* Table */}
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">No</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Rating</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Content</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Pictures</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Reports</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Visibility</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-700">
                  {feedbacks.map((feedback, i) => (
                    <tr
                      key={feedback.id}
                      className={`hover:bg-gray-700/40 transition-colors ${
                        feedback.isHidden ? 'opacity-60' : ''
                      }`}
                    >
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
                        <div className="flex text-base">{renderStars(feedback.rating)}</div>
                      </td>

                      {/* Content */}
                      <td className="px-6 py-4">
                        <p className="text-gray-300 text-sm max-w-xs line-clamp-2">
                          {feedback.content}
                        </p>
                      </td>

                      {/* Pictures */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {feedback.pictureUrls?.length > 0 ? (
                          <span className="text-blue-400">{feedback.pictureUrls.length} photo(s)</span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>

                      {/* Reports */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {feedback.reportCount > 0 ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-orange-400 text-sm font-medium">
                              {feedback.reportCount} report(s)
                            </span>
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
                          {/* Toggle Hide */}
                          <button
                            onClick={() => handleToggleHide(feedback)}
                            className={`text-sm font-medium transition-colors ${
                              feedback.isHidden
                                ? 'text-green-400 hover:text-green-300'
                                : 'text-yellow-400 hover:text-yellow-300'
                            }`}
                          >
                            {feedback.isHidden ? 'Show' : 'Hide'}
                          </button>

                          {/* View Reports */}
                          {feedback.reportCount > 0 && (
                            <button
                              onClick={() => setReportsModal({ show: true, feedback })}
                              className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
                            >
                              Reports
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteModal({ show: true, feedback })}
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

      {/* Delete Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-3">⚠️ Delete Feedback</h3>
              <div className="mb-6 space-y-3">
                <p className="text-gray-300">
                  Are you sure you want to <span className="text-red-400 font-semibold">permanently delete</span> this feedback?
                </p>
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 space-y-1">
                  <p className="text-white font-medium text-sm">{deleteModal.feedback?.userName}</p>
                  <p className="text-gray-400 text-sm line-clamp-2">{deleteModal.feedback?.content}</p>
                </div>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal({ show: false, feedback: null })}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 rounded-lg text-white font-medium transition-colors"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Preview Modal */}
      {reportsModal.show && reportsModal.feedback && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  🚩 Reports for this Feedback
                </h3>
                <button
                  onClick={() => setReportsModal({ show: false, feedback: null })}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 mb-4">
                <p className="text-gray-400 text-xs mb-1">Feedback by {reportsModal.feedback.userName}</p>
                <p className="text-white text-sm">{reportsModal.feedback.content}</p>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Reports</span>
                  <span className="text-orange-400 font-semibold">{reportsModal.feedback.reportCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Pending</span>
                  <span className="text-red-400 font-semibold">{reportsModal.feedback.pendingReportCount}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setReportsModal({ show: false, feedback: null })}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <Link
                  to={`/admin/feedbacks/reports?feedbackId=${reportsModal.feedback.id}`}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-medium transition-colors"
                  onClick={() => setReportsModal({ show: false, feedback: null })}
                >
                  View Full Reports
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}