import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { feedbacksApi } from '@/api/feedbacks.api'
import { useDebounce } from '@/hooks/useDebounce'

import FeedbackFilters from './components/FeedbackFilters'
import FeedbackTable from './components/FeedbackTable'
import FeedbackDetailModal from './components/FeedbackDetailModal'
import FeedbackDeleteModal from './components/FeedbackDeleteModal'
import FeedbackReportsModal from './components/FeedbackReportsModal'

export default function FeedbackManagePage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)

  const [selectedFeedbacks, setSelectedFeedbacks] = useState([])

  const [deleteModal, setDeleteModal] = useState({ show: false, feedback: null, isMultiple: false })
  const [reportsModal, setReportsModal] = useState({ show: false, feedback: null })
  const [detailModal, setDetailModal] = useState({ show: false, feedback: null })

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

  // ─── Fetch ────────────────────────────────────────────────────────────────
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
      setSelectedFeedbacks([])
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

  // ─── Selection helpers ────────────────────────────────────────────────────
  const handleSelectAll = (e) => {
    setSelectedFeedbacks(e.target.checked ? feedbacks.map((f) => f.id) : [])
  }

  const handleSelectFeedback = (id) => {
    setSelectedFeedbacks((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    )
  }

  const allSelectedAreHidden = () =>
    selectedFeedbacks.length > 0 &&
    selectedFeedbacks.every((id) => feedbacks.find((f) => f.id === id)?.isHidden)

  const allSelectedAreVisible = () =>
    selectedFeedbacks.length > 0 &&
    selectedFeedbacks.every((id) => !feedbacks.find((f) => f.id === id)?.isHidden)

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handleToggleHide = async (feedback) => {
    try {
      await feedbacksApi.toggleHideFeedback(feedback.id)
      fetchFeedbacks()
    } catch (err) {
      console.error('Failed to toggle hide:', err)
      alert('Failed to update feedback visibility')
    }
  }

  const handleBulkToggleHide = async (setHidden) => {
    try {
      const toToggle = selectedFeedbacks.filter(
        (id) => feedbacks.find((f) => f.id === id)?.isHidden !== setHidden
      )
      if (toToggle.length === 0) {
        alert('All selected feedbacks are already in the desired state')
        return
      }
      await Promise.all(toToggle.map((id) => feedbacksApi.toggleHideFeedback(id)))
      setSelectedFeedbacks([])
      fetchFeedbacks()
    } catch (err) {
      console.error('Bulk toggle hide failed:', err)
      alert('Failed to update feedback visibility')
    }
  }

  const handleDelete = async () => {
    try {
      if (deleteModal.isMultiple) {
        await Promise.all(selectedFeedbacks.map((id) => feedbacksApi.deleteFeedback(id)))
        setSelectedFeedbacks([])
      } else {
        await feedbacksApi.deleteFeedback(deleteModal.feedback.id)
      }
      setDeleteModal({ show: false, feedback: null, isMultiple: false })
      fetchFeedbacks()
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete feedback(s)')
    }
  }

  // ─── Detail modal helpers ─────────────────────────────────────────────────
  const handleDetailToggleHide = () => {
    handleToggleHide(detailModal.feedback)
    setDetailModal((prev) => ({
      ...prev,
      feedback: { ...prev.feedback, isHidden: !prev.feedback.isHidden },
    }))
  }

  const handleDetailDelete = () => {
    setDetailModal({ show: false, feedback: null })
    setDeleteModal({ show: true, feedback: detailModal.feedback, isMultiple: false })
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

      <FeedbackFilters
        filters={filters}
        setFilters={setFilters}
        selectedFeedbacks={selectedFeedbacks}
        setSelectedFeedbacks={setSelectedFeedbacks}
        onBulkToggleHide={handleBulkToggleHide}
        onBulkDelete={() => setDeleteModal({ show: true, feedback: null, isMultiple: true })}
        allSelectedAreHidden={allSelectedAreHidden}
        allSelectedAreVisible={allSelectedAreVisible}
      />

      <FeedbackTable
        feedbacks={feedbacks}
        loading={loading}
        filters={filters}
        setFilters={setFilters}
        totalItems={totalItems}
        selectedFeedbacks={selectedFeedbacks}
        onSelectAll={handleSelectAll}
        onSelectFeedback={handleSelectFeedback}
        onToggleHide={handleToggleHide}
        onOpenDetail={(feedback) => setDetailModal({ show: true, feedback })}
        onOpenReports={(feedback) => setReportsModal({ show: true, feedback })}
        onOpenDelete={(feedback) => setDeleteModal({ show: true, feedback, isMultiple: false })}
      />

      {detailModal.show && (
        <FeedbackDetailModal
          feedback={detailModal.feedback}
          onClose={() => setDetailModal({ show: false, feedback: null })}
          onToggleHide={handleDetailToggleHide}
          onDelete={handleDetailDelete}
        />
      )}

      {deleteModal.show && (
        <FeedbackDeleteModal
          deleteModal={deleteModal}
          selectedCount={selectedFeedbacks.length}
          onConfirm={handleDelete}
          onClose={() => setDeleteModal({ show: false, feedback: null, isMultiple: false })}
        />
      )}

      {reportsModal.show && (
        <FeedbackReportsModal
          feedback={reportsModal.feedback}
          onClose={() => setReportsModal({ show: false, feedback: null })}
        />
      )}
    </div>
  )
}