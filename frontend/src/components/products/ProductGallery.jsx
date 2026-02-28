import { useState, useEffect } from 'react'

const ProductGallery = ({ pictures = [] }) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (pictures.length > 0) {
      setSelectedIndex(0)
    }
  }, [pictures])

  const handleImageChange = (index) => {
    if (index === selectedIndex) return
    
    setIsTransitioning(true)
    setTimeout(() => {
      setSelectedIndex(index)
      setIsTransitioning(false)
    }, 150)
  }

  const goToNext = () => {
    const nextIndex = (selectedIndex + 1) % pictures.length
    handleImageChange(nextIndex)
  }

  const goToPrevious = () => {
    const prevIndex = (selectedIndex - 1 + pictures.length) % pictures.length
    handleImageChange(prevIndex)
  }

  if (!pictures || pictures.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No images available</p>
      </div>
    )
  }

  const currentPicture = pictures[selectedIndex]

  return (
    <div className="space-y-4">
      {/* Main Image with Navigation Arrows */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
        <img
          src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${currentPicture?.path}`}
          alt={`Product image ${selectedIndex + 1}`}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Navigation Arrows - Only show if more than 1 image */}
        {pictures.length > 1 && (
          <>
            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10"
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
              {selectedIndex + 1} / {pictures.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {pictures.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {pictures.map((picture, index) => (
            <button
              key={picture.id}
              onClick={() => handleImageChange(index)}
              className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                selectedIndex === index
                  ? 'border-blue-500 scale-105 shadow-md'
                  : 'border-gray-300 hover:border-gray-400 hover:scale-102'
              }`}
            >
              <img
                src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${picture.path}`}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductGallery