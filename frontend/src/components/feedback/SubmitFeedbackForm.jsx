import { useState } from 'react'
import { feedbacksApi } from '@/api/feedbacks.api'
import StarRatingInput from './ui/StarRatingInput'

const MAX_IMAGES = 5

const SubmitFeedbackForm = ({ productId, userName, onSubmitted }) => {
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const allowed = files.slice(0, MAX_IMAGES - imageFiles.length)
    setImageFiles((prev) => [...prev, ...allowed])
    setImagePreviews((prev) => [...prev, ...allowed.map((f) => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index])
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (rating === 0) { setError('Please select a rating.'); return }
    if (!content.trim()) { setError('Please write a review.'); return }

    setSubmitting(true)
    try {
      let pictureUrls = []
      if (imageFiles.length > 0) {
        pictureUrls = await feedbacksApi.uploadFeedbackPictures(imageFiles)
      }
      await feedbacksApi.createFeedback({
        productId,
        userName,
        content: content.trim(),
        rating,
        pictureUrls,
      })
      setRating(0)
      setContent('')
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))
      setImageFiles([])
      setImagePreviews([])
      onSubmitted()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4"
    >
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Write a Review</h3>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Rating *</label>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Review *</label>
        <textarea
          rows={4}
          placeholder="Share your experience with this product..."
          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Photos <span className="text-gray-400 font-normal">(optional, up to {MAX_IMAGES})</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {imagePreviews.map((preview, index) => (
            <div
              key={index}
              className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group"
            >
              <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-lg font-bold"
              >
                ×
              </button>
            </div>
          ))}
          {imageFiles.length < MAX_IMAGES && (
            <>
              <input
                type="file"
                id="feedback-images"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="feedback-images"
                className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-white dark:bg-gray-800"
              >
                <span className="text-2xl text-gray-400 leading-none">+</span>
                <span className="text-xs text-gray-400 mt-0.5">Photo</span>
              </label>
            </>
          )}
        </div>
        {imageFiles.length > 0 && (
          <p className="text-xs text-gray-400">{imageFiles.length}/{MAX_IMAGES} photo(s) selected</p>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
      >
        {submitting ? 'Uploading & Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}

export default SubmitFeedbackForm