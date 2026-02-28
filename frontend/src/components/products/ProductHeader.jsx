import { useState } from 'react'
import { useCartStore } from '@/stores/useCartStore'

const ProductHeader = ({ product }) => {
  const addItem = useCartStore((s) => s.addItem)
  const [quantity, setQuantity] = useState(1)

  const isOutOfStock = (product.quantity ?? 0) === 0
  const hasDiscount  = (product.discount ?? 0) > 0
  const finalPrice   = hasDiscount
    ? product.price * (1 - product.discount / 100)
    : product.price

  const handleAddToCart = () => {
    addItem(product, quantity)
  }

  return (
    <div className="space-y-5 mb-8">
      {/* Name + SKU */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {product.name}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
          SKU: {product.sku}
        </p>
      </div>

      {/* Price */}
      <div className="flex items-center gap-3">
        <span className="text-3xl font-black text-primary-600 dark:text-primary-400">
          ${finalPrice.toFixed(2)}
        </span>
        {hasDiscount && (
          <>
            <span className="text-lg text-gray-400 line-through">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-sm bg-red-500/15 text-red-500 px-2 py-0.5 rounded-lg font-bold">
              -{product.discount}%
            </span>
          </>
        )}
      </div>

      {/* Stock + Status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          product.isActive
            ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
          {product.isActive ? 'Available' : 'Unavailable'}
        </span>

        {isOutOfStock && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400">
            Out of Stock
          </span>
        )}

        {!isOutOfStock && product.quantity <= 5 && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
            Only {product.quantity} left
          </span>
        )}
      </div>

      {/* Quantity + Add to Cart */}
      {!isOutOfStock && product.isActive && (
        <div className="flex items-center gap-3 pt-2">
          {/* Qty stepper */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-700 rounded-xl p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-lg
                hover:bg-white dark:hover:bg-dark-600
                text-text-primary-light dark:text-text-primary-dark
                font-black text-lg transition-colors"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(product.quantity ?? 99, q + 1))}
              className="w-9 h-9 flex items-center justify-center rounded-lg
                hover:bg-white dark:hover:bg-dark-600
                text-text-primary-light dark:text-text-primary-dark
                font-black text-lg transition-colors"
            >
              +
            </button>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            className="flex-1 py-3 bg-gold-500 hover:bg-gold-400 text-dark-900
              font-black rounded-xl transition-colors
              shadow-lg shadow-gold-500/20 text-sm"
          >
            Add to Cart
          </button>
        </div>
      )}

      {/* Out of stock CTA */}
      {isOutOfStock && (
        <div className="pt-2">
          <div className="w-full py-3 bg-gray-100 dark:bg-dark-700 text-gray-400 dark:text-gray-500
            font-bold rounded-xl text-center text-sm cursor-not-allowed">
            Out of Stock
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductHeader