import { useState, useEffect, useRef } from 'react'
import StarDisplay from './ui/StarDisplay'
import Lightbox from './ui/Lightbox'
import DeleteModal from './modals/DeleteModal'
import ReportModal from './modals/ReportModal'

const BASE_URL = () => import.meta.env.VITE_API_BASE_URL?.replace('/api', '')

const FeedbackCard = ({ feedback, onReport, onDelete, currentUserName }) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const menuRef = useRef(null)

  const isOwner = currentUserName && currentUserName === feedback.userName
  const canReport = currentUserName && currentUserName !== feedback.userName
  const showEllipsis = isOwner || canReport

  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  return (
    <>
      <div className="border-b border-gray-100 dark:border-gray-800 pb-6 last:border-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                {feedback.userName?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{feedback.userName}</p>
              <p className="text-xs text-gray-400">{formatDate(feedback.createdAt)}</p>
            </div>
          </div>

          {/* Ellipsis menu */}
          {showEllipsis && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="More options"
              >
                ⋮
              </button>

              {showMenu && (
                <div className="absolute right-0 top-9 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 overflow-hidden">
                  {isOwner && (
                    <button
                      onClick={() => { setShowMenu(false); setShowDeleteModal(true) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                    >
                      🗑️ Delete
                    </button>
                  )}
                  {canReport && (
                    <button
                      onClick={() => { setShowMenu(false); setShowReportModal(true) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      🚩 Report
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="mt-3 flex items-center gap-2">
          <StarDisplay rating={feedback.rating} size="sm" />
          <span className="text-sm text-gray-500">{feedback.rating}/5</span>
        </div>

        {/* Content */}
        <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          {feedback.content}
        </p>

        {/* Pictures */}
        {feedback.pictureUrls?.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {feedback.pictureUrls.map((url, i) => (
              <img
                key={i}
                src={`${BASE_URL()}/${url}`}
                alt={`Review photo ${i + 1}`}
                onClick={() => setLightboxIndex(i)}
                className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700 cursor-zoom-in hover:opacity-85 transition-opacity"
              />
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          urls={feedback.pictureUrls}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={async () => {
            await onDelete(feedback.id)
            setShowDeleteModal(false)
          }}
        />
      )}

      {showReportModal && (
        <ReportModal
          feedback={feedback}
          onClose={() => setShowReportModal(false)}
          onSubmit={async (feedbackId, reason) => {
            await onReport(feedbackId, reason)
            setShowReportModal(false)
          }}
        />
      )}
    </>
  )
}

export default FeedbackCard