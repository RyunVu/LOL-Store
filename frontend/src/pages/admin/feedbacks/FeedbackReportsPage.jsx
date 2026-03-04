import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { feedbacksApi } from '@/api/feedbacks.api'
import { useDebounce } from '@/hooks/useDebounce'
import AdminPagination from '../../../components/pagination/AdminPagination'

const REPORT_STATUS = {
  Pending: 'Pending',
  Reviewed: 'Reviewed',
  Actioned: 'Actioned',
}

const statusColors = {
  Pending: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800',
  Reviewed: 'bg-blue-900/30 text-blue-400 border border-blue-800',
  Actioned: 'bg-green-900/30 text-green-400 border border-green-800',
}

const statusIcons = {
  Pending: '⏳',
  Reviewed: '👁',
  Actioned: '✅',
}

export default function FeedbackReportsPage() {
  const [searchParams] = useSearchParams()
  const feedbackIdFromUrl = searchParams.get('feedbackId') || ''

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)

  const [reviewModal, setReviewModal] = useState({
    show: false,
    report: null,
    status: '',
    adminNote: '',
    hideFeedback: false,
  })

  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    feedbackId: feedbackIdFromUrl,
    pageNumber: 1,
    pageSize: 10,
  })

  const debouncedKeyword = useDebounce(filters.keyword, 300)

  const { pageNumber, pageSize, status, feedbackId } = filters

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        pageNumber,
        pageSize,
        keyword: debouncedKeyword || undefined,
        status: status || undefined,
        feedbackId: feedbackId || undefined,
      }

      Object.keys(params).forEach((key) => {
        if (params[key] === undefined || params[key] === '') delete params[key]
      })

      const res = await feedbacksApi.getReports(params)
      setReports(res?.items ?? [])
      setTotalItems(res?.metadata?.totalItemCount ?? 0)
    } catch (err) {
      console.error('Failed to fetch reports:', err)
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, pageNumber, pageSize, status, feedbackId])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleReview = async () => {
    if (!reviewModal.report || !reviewModal.status) return
    try {
      await feedbacksApi.reviewReport(reviewModal.report.id, {
        status: reviewModal.status,
        adminNote: reviewModal.adminNote || null,
        hideFeedback: reviewModal.hideFeedback,
      })
      setReviewModal({ show: false, report: null, status: '', adminNote: '', hideFeedback: false })
      fetchReports()
    } catch (err) {
      console.error('Failed to review report:', err)
      alert('Failed to review report')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
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
          <div className="flex items-center gap-3 mb-1">
            <Link
              to="/admin/feedbacks"
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
            >
              ← Back to Feedbacks
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Feedback Reports</h1>
          <p className="text-gray-400 mt-1 text-sm">Review and action user-submitted reports</p>
        </div>

        <div className="flex gap-2 text-sm">
          <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            <span className="text-gray-400">Total: </span>
            <span className="text-white font-semibold">{totalItems}</span>
          </div>
          {/* Pending count badge */}
          <div className="bg-yellow-900/30 border border-yellow-800 px-4 py-2 rounded-lg">
            <span className="text-yellow-400 font-semibold">
              ⏳ {reports.filter(r => r.status === 'Pending').length} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by reporter, reason, or feedback content..."
            className="w-80 bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={filters.keyword}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, keyword: e.target.value, pageNumber: 1 }))
            }
          />

          {/* Status Filter */}
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

          {/* FeedbackId filter (pre-filled from URL) */}
          {filters.feedbackId && (
            <div className="flex items-center gap-2 bg-orange-900/20 border border-orange-800 rounded-lg px-3 py-2">
              <span className="text-orange-400 text-sm">Filtered by Feedback</span>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, feedbackId: '', pageNumber: 1 }))}
                className="text-orange-400 hover:text-white text-sm transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {/* Clear */}
          <button
            onClick={() =>
              setFilters({
                keyword: '',
                status: '',
                feedbackId: '',
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

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
            <p>Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg mb-2">No reports found</p>
            <p className="text-sm">All clear! No pending reports at the moment.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">No</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Reporter</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Reason</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Feedback</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Admin Note</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Reported At</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Reviewed At</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-700">
                  {reports.map((report, i) => (
                    <tr
                      key={report.id}
                      className="hover:bg-gray-700/40 transition-colors"
                    >
                      {/* No */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                        {(filters.pageNumber - 1) * filters.pageSize + i + 1}
                      </td>

                      {/* Reporter */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white text-sm font-medium">{report.reporterName}</span>
                      </td>

                      {/* Reason */}
                      <td className="px-6 py-4">
                        <p className="text-gray-300 text-sm max-w-xs line-clamp-2">{report.reason}</p>
                      </td>

                      {/* Feedback Content */}
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-gray-500 text-xs mb-0.5">by {report.feedbackUserName}</p>
                          <p className="text-gray-300 text-sm line-clamp-2">{report.feedbackContent}</p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusColors[report.status] ?? 'bg-gray-700 text-gray-400'}`}>
                          <span>{statusIcons[report.status] ?? '?'}</span>
                          <span>{report.status}</span>
                        </span>
                      </td>

                      {/* Admin Note */}
                      <td className="px-6 py-4">
                        {report.adminNote ? (
                          <p className="text-gray-400 text-sm max-w-xs line-clamp-2 italic">
                            "{report.adminNote}"
                          </p>
                        ) : (
                          <span className="text-gray-600 text-sm">—</span>
                        )}
                      </td>

                      {/* Reported At */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm font-mono">
                        {formatDate(report.createdAt)}
                      </td>

                      {/* Reviewed At */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm font-mono">
                        {report.reviewedAt ? formatDate(report.reviewedAt) : <span className="text-gray-600">—</span>}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {report.status === 'Pending' ? (
                          <button
                            onClick={() =>
                              setReviewModal({
                                show: true,
                                report,
                                status: '',
                                adminNote: '',
                                hideFeedback: false,
                              })
                            }
                            className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
                          >
                            Review
                          </button>
                        ) : (
                          <span className="text-gray-600 text-sm">Reviewed</span>
                        )}
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

      {/* Review Modal */}
      {reviewModal.show && reviewModal.report && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700 shadow-2xl">
            <div className="p-6 space-y-5">
              <h3 className="text-lg font-bold text-white">Review Report</h3>

              {/* Feedback Preview */}
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-1">
                <p className="text-xs text-gray-500">Feedback by {reviewModal.report.feedbackUserName}</p>
                <p className="text-gray-200 text-sm">{reviewModal.report.feedbackContent}</p>

                {reviewModal.report.feedbackPictureUrls?.length > 0 && (
                <div className="flex gap-2 flex-wrap pt-2">
                    {reviewModal.report.feedbackPictureUrls.map((url, i) => (
                      <img
                        key={i}
                        src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${url}`}
                        alt={`Feedback photo ${i + 1}`}
                        className="w-16 h-16 rounded-lg object-cover border border-gray-600"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Report Reason */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Report Reason</p>
                <p className="text-orange-300 text-sm">{reviewModal.report.reason}</p>
                <p className="text-xs text-gray-500">Reported by: {reviewModal.report.reporterName}</p>
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

              {/* Hide feedback toggle — only show when Actioned */}
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
                  onClick={() =>
                    setReviewModal({ show: false, report: null, status: '', adminNote: '', hideFeedback: false })
                  }
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReview}
                  disabled={!reviewModal.status}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}