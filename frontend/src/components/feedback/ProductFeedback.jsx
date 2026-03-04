import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { feedbacksApi } from '@/api/feedbacks.api'
import { useAuthStore } from '@/stores/useAuthStore'
import PaginationBase from '../pagination/PaginationBase'
import FeedbackList from './FeedbackList'
import RatingSummary from './RatingSummary'
import SubmitFeedbackForm from './SubmitFeedbackForm'

const PAGE_SIZE = 5

const ProductFeedback = ({ productId }) => {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [successMessage, setSuccessMessage] = useState('')

  const fetchFeedbacks = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await feedbacksApi.getFeedbacksByProduct(productId, {
        pageNumber: page,
        pageSize: PAGE_SIZE,
      })
      setFeedbacks(res?.items ?? [])
      setTotalItems(res?.metadata?.totalItemCount ?? 0)
    } catch (err) {
      console.error('Failed to fetch feedbacks:', err)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    if (productId) fetchFeedbacks(pageNumber)
  }, [fetchFeedbacks, pageNumber, productId])

  const showSuccess = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  const handleReport = async (feedbackId, reason) => {
    try {
      await feedbacksApi.reportFeedback(feedbackId, {
        reporterName: user?.name ?? user?.userName,
        reason,
      })
      showSuccess('Report submitted. Thank you!')
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to submit report.')
    }
  }

  const handleDelete = async (feedbackId) => {
    try {
      await feedbacksApi.deleteFeedback(feedbackId)
      showSuccess('Your review has been deleted.')
      fetchFeedbacks(pageNumber)
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to delete review.')
    }
  }

  const handleSubmitted = () => {
    showSuccess('Your review has been submitted!')
    setPageNumber(1)
    fetchFeedbacks(1)
  }

  const totalPages = Math.ceil(totalItems / PAGE_SIZE)
  const currentUserName = user?.name ?? user?.userName

  return (
    <div className="space-y-6">
      {/* Success toast */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm font-medium">
          ✅ {successMessage}
        </div>
      )}

      {/* Rating summary */}
      {feedbacks.length > 0 && <RatingSummary feedbacks={feedbacks} />}

      {/* Feedback list */}
      <FeedbackList
        feedbacks={feedbacks}
        loading={loading}
        onReport={handleReport}
        onDelete={handleDelete}
        currentUserName={currentUserName}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <PaginationBase
          page={pageNumber}
          pageSize={PAGE_SIZE}
          totalItems={totalItems}
          onPageChange={setPageNumber}
        />
      )}

      {/* Submit form or sign in prompt */}
      {isAuthenticated ? (
        <SubmitFeedbackForm
          productId={productId}
          userName={currentUserName}
          onSubmitted={handleSubmitted}
        />
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">Want to leave a review?</p>
          <Link
            to="/login"
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Sign in to write a review
          </Link>
        </div>
      )}
    </div>
  )
}

export default ProductFeedback