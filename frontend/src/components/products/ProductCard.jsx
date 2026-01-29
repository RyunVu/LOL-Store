import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useCartStore } from '@/store/cartStore'

export default function ProductCard({ product }) {
  const addItem = useCartStore((state) => state.addItem)

  /* =======================
     SAFE FALLBACK
     ======================= */
  const safeProduct = product ?? {}

  /* =======================
     PRICE
     ======================= */
  const discountedPrice = useMemo(() => {
    const price = safeProduct.price ?? 0
    const discount = safeProduct.discount ?? 0

    if (discount <= 0) return price
    return price * (1 - discount / 100)
  }, [safeProduct.price, safeProduct.discount])

  /* =======================
     IMAGE
     ======================= */
  const imageUrl = useMemo(() => {
    if (safeProduct.pictures?.length > 0 && safeProduct.pictures[0]?.path) {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || ''
      return `${baseUrl}/${safeProduct.pictures[0].path}`
    }
    return 'https://via.placeholder.com/400x400?text=No+Image'
  }, [safeProduct.pictures])

  const isOutOfStock = (safeProduct.quantity ?? 0) === 0

  /* =======================
     EARLY RETURN (OK)
     ======================= */
  if (!product) return null

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1)
  }

  return (
    <Link
      to={`/product/${safeProduct.urlSlug}`}
      className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all"
    >
      {/* IMAGE */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={safeProduct.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />

        {safeProduct.discount > 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded">
            -{safeProduct.discount}%
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold">OUT OF STOCK</span>
          </div>
        )}

        {!isOutOfStock && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gold-500 px-6 py-2 rounded-lg
                       opacity-0 group-hover:opacity-100 transition-all"
          >
            Add to Cart
          </button>
        )}
      </div>

      {/* INFO */}
      <div className="p-4">
        <h3 className="text-lg font-semibold line-clamp-2">
          {safeProduct.name}
        </h3>

        <div className="flex gap-2 mt-2">
          {safeProduct.discount > 0 ? (
            <>
              <span className="font-bold">
                ${discountedPrice.toFixed(2)}
              </span>
              <span className="line-through text-gray-400">
                ${safeProduct.price?.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="font-bold">
              ${safeProduct.price?.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
