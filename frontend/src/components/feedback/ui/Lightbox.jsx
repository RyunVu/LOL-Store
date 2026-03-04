import { useState, useEffect } from 'react'

const BASE_URL = () => import.meta.env.VITE_API_BASE_URL?.replace('/api', '')

const Lightbox = ({ urls, startIndex, onClose }) => {
  const [current, setCurrent] = useState(startIndex)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setCurrent((i) => (i - 1 + urls.length) % urls.length)
      if (e.key === 'ArrowRight') setCurrent((i) => (i + 1) % urls.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [urls.length, onClose])

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-5 text-white/70 hover:text-white text-4xl font-light leading-none transition-colors z-10"
        aria-label="Close"
      >
        ×
      </button>

      {/* Counter */}
      {urls.length > 1 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          {current + 1} / {urls.length}
        </div>
      )}

      {/* Prev */}
      {urls.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent((i) => (i - 1 + urls.length) % urls.length) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white text-2xl flex items-center justify-center transition-colors z-10"
          aria-label="Previous"
        >
          ‹
        </button>
      )}

      {/* Image */}
      <img
        src={`${BASE_URL()}/${urls[current]}`}
        alt={`Photo ${current + 1}`}
        className="max-w-full max-h-[90vh] object-contain rounded-lg select-none"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {urls.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent((i) => (i + 1) % urls.length) }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white text-2xl flex items-center justify-center transition-colors z-10"
          aria-label="Next"
        >
          ›
        </button>
      )}

      {/* Dots */}
      {urls.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {urls.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === current ? 'bg-white' : 'bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Lightbox