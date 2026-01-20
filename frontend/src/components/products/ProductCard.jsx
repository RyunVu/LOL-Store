import { Link } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'

export default function ProductCard({ product }) {
  const addItem = useCartStore((state) => state.addItem)
  
  const handleAddToCart = (e) => {
    e.preventDefault()
    addItem(product, 1)
  }

  const discountedPrice = product.discount > 0 
    ? product.price * (1 - product.discount / 100)
    : product.price

  const imageUrl = product.pictures?.[0]?.path 
    ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${product.pictures[0].path}`
    : 'https://via.placeholder.com/400x400?text=No+Image'

  return (
    <Link 
      to={`/product/${product.urlSlug}`}
      className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img 
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Discount Badge */}
        {product.discount > 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{product.discount}%
          </div>
        )}

        {/* Out of Stock Overlay */}
        {product.quantity === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">OUT OF STOCK</span>
          </div>
        )}

        {/* Quick Add Button - Shows on Hover */}
        {product.quantity > 0 && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gold-500 text-dark-900 px-6 py-2 rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-gold-600 transform translate-y-2 group-hover:translate-y-0"
          >
            Add to Cart
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Categories */}
        {product.categories && product.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {product.categories.slice(0, 2).map((category) => (
              <span 
                key={category.id}
                className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
              >
                {category.name}
              </span>
            ))}
          </div>
        )}

        {/* Product Name */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2">
          {product.discount > 0 ? (
            <>
              <span className="text-xl font-bold text-gray-900">
                ${discountedPrice.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 line-through">
                ${product.price.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {product.quantity > 0 && product.quantity <= 10 && (
          <p className="text-xs text-orange-600 mt-2">
            Only {product.quantity} left!
          </p>
        )}
      </div>
    </Link>
  )
}