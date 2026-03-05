import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { feedbacksApi } from '@/api/feedbacks.api'
import { useDebounce } from '@/hooks/useDebounce'
import ReportFilters from './components/ReportFilters'
import ReportTable from './components/ReportTable'
import ReportReviewModal from './components/ReportReviewModal'
import ReportDetailModal from './components/ReportDetailModal'
import ReportDeleteModal from './components/ReportDeleteModal'

const EMPTY_REVIEW = { show: false, report: null, status: '', adminNote: '', hideFeedback: false }
const EMPTY_DELETE = { show: false, report: null, isMultiple: false }

export default function FeedbackReportsPage() {
  const [searchParams] = useSearchParams()
  const feedbackIdFromUrl = searchParams.get('feedbackId') || ''

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)

  // Selection
  const [selectedReports, setSelectedReports] = useState([])

  // Modals
  const [reviewModal, setReviewModal] = useState(EMPTY_REVIEW)
  const [detailModal, setDetailModal] = useState({ show: false, report: null })
  const [deleteModal, setDeleteModal] = useState(EMPTY_DELETE)

  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    feedbackId: feedbackIdFromUrl,
    pageNumber: 1,
    pageSize: 10,
  })

  const debouncedKeyword = useDebounce(filters.keyword, 300)
  const { pageNumber, pageSize, status, feedbackId } = filters

  // ─── Fetch ────────────────────────────────────────────────────────────────
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
      setSelectedReports([])
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

  // ─── Selection helpers ────────────────────────────────────────────────────
  const handleSelectAll = (e) => {
    setSelectedReports(e.target.checked ? reports.map((r) => r.id) : [])
  }

  const handleSelectReport = (id) => {
    setSelectedReports((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    )
  }

  // ─── Single actions ───────────────────────────────────────────────────────
  const handleReview = async () => {
    if (!reviewModal.report || !reviewModal.status) return
    try {
      await feedbacksApi.reviewReport(reviewModal.report.id, {
        status: reviewModal.status,
        adminNote: reviewModal.adminNote || null,
        hideFeedback: reviewModal.hideFeedback,
      })
      setReviewModal(EMPTY_REVIEW)
      fetchReports()
    } catch (err) {
      console.error('Failed to review report:', err)
      alert('Failed to review report')
    }
  }

  const handleToggleFeedbackVisibility = async (feedbackId) => {
    try {
      await feedbacksApi.toggleHideFeedback(feedbackId)
      fetchReports()
    } catch (err) {
      console.error('Failed to toggle feedback visibility:', err)
      alert('Failed to update feedback visibility')
    }
  }

  const handleDelete = async () => {
    try {
      if (deleteModal.isMultiple) {
        await Promise.all(selectedReports.map((id) => feedbacksApi.deleteReport(id)))
        setSelectedReports([])
      } else {
        await feedbacksApi.deleteReport(deleteModal.report.id)
      }
      setDeleteModal(EMPTY_DELETE)
      fetchReports()
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete report(s)')
    }
  }

  // ─── Bulk actions ─────────────────────────────────────────────────────────
  const handleBulkReview = async (newStatus) => {
    try {
      const toReview = selectedReports.filter((id) => {
        const r = reports.find((rep) => rep.id === id)
        return r?.status === 'Pending'
      })
      if (toReview.length === 0) {
        alert('No pending reports in selection')
        return
      }
      await Promise.all(
        toReview.map((id) =>
          feedbacksApi.reviewReport(id, {
            status: newStatus,
            adminNote: null,
            hideFeedback: newStatus === 'Actioned',
          })
        )
      )
      setSelectedReports([])
      fetchReports()
    } catch (err) {
      console.error('Bulk review failed:', err)
      alert('Failed to review reports')
    }
  }

  const handleBulkToggleFeedback = async (hide) => {
    try {
      // Get unique feedback IDs from selected reports that need toggling
      const feedbackIds = [
        ...new Set(
          selectedReports
            .map((id) => reports.find((r) => r.id === id))
            .filter((r) => r && r.feedbackIsHidden !== hide)
            .map((r) => r.feedbackId)
            .filter(Boolean)
        ),
      ]
      if (feedbackIds.length === 0) {
        alert('All selected feedbacks are already in the desired state')
        return
      }
      await Promise.all(feedbackIds.map((fid) => feedbacksApi.toggleHideFeedback(fid)))
      setSelectedReports([])
      fetchReports()
    } catch (err) {
      console.error('Bulk toggle feedback failed:', err)
      alert('Failed to update feedback visibility')
    }
  }

  // ─── Detail modal helpers ─────────────────────────────────────────────────
  const handleDetailToggleFeedback = () => {
    handleToggleFeedbackVisibility(detailModal.report.feedbackId)
    setDetailModal((prev) => ({
      ...prev,
      report: { ...prev.report, feedbackIsHidden: !prev.report.feedbackIsHidden },
    }))
  }

  const handleDetailReview = () => {
    setDetailModal({ show: false, report: null })
    setReviewModal({ show: true, report: detailModal.report, status: '', adminNote: '', hideFeedback: false })
  }

  const handleDetailDelete = () => {
    setDetailModal({ show: false, report: null })
    setDeleteModal({ show: true, report: detailModal.report, isMultiple: false })
  }

  const pendingCount = reports.filter((r) => r.status === 'Pending').length

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
          <div className="bg-yellow-900/30 border border-yellow-800 px-4 py-2 rounded-lg">
            <span className="text-yellow-400 font-semibold">⏳ {pendingCount} Pending</span>
          </div>
        </div>
      </div>

      <ReportFilters
        filters={filters}
        setFilters={setFilters}
        selectedReports={selectedReports}
        setSelectedReports={setSelectedReports}
        reports={reports}
        onBulkReview={handleBulkReview}
        onBulkToggleFeedback={handleBulkToggleFeedback}
        onBulkDelete={() => setDeleteModal({ show: true, report: null, isMultiple: true })}
      />

      <ReportTable
        reports={reports}
        loading={loading}
        filters={filters}
        setFilters={setFilters}
        totalItems={totalItems}
        selectedReports={selectedReports}
        onSelectAll={handleSelectAll}
        onSelectReport={handleSelectReport}
        onOpenReview={(report) =>
          setReviewModal({ show: true, report, status: '', adminNote: '', hideFeedback: false })
        }
        onOpenDetail={(report) => setDetailModal({ show: true, report })}
        onOpenDelete={(report) =>
          setDeleteModal({ show: true, report, isMultiple: false })
        }
      />

      {reviewModal.show && (
        <ReportReviewModal
          reviewModal={reviewModal}
          setReviewModal={setReviewModal}
          onSubmit={handleReview}
        />
      )}

      {detailModal.show && (
        <ReportDetailModal
          report={detailModal.report}
          onClose={() => setDetailModal({ show: false, report: null })}
          onReview={handleDetailReview}
          onToggleFeedback={handleDetailToggleFeedback}
          onDelete={handleDetailDelete}
        />
      )}

      {deleteModal.show && (
        <ReportDeleteModal
          deleteModal={deleteModal}
          selectedCount={selectedReports.length}
          onConfirm={handleDelete}
          onClose={() => setDeleteModal(EMPTY_DELETE)}
        />
      )}
    </div>
  )
}