import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productsApi } from '../../api/products.api'

const RelatedProducts = ({ productSlug, currentProductId }) => {
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!productSlug) return

      try {
        setLoading(true)
        const data = await productsApi.getRelatedProducts(productSlug, 4)
        // Filter out the current product if it's included
        const filtered = data.filter(p => p.id !== currentProductId)
        setRelatedProducts(filtered)
      } catch (err) {
        console.error('Failed to fetch related products:', err)
        setRelatedProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedProducts()
  }, [productSlug, currentProductId])

  if (loading) {
    return (
      <div className="py-12">
        <h2 className="text-2xl font-bold mb-6">Related Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!relatedProducts || relatedProducts.length === 0) {
    return null
  }

  return (
    <div className="py-12 border-t">
      <h2 className="text-2xl font-bold mb-6">Related Products</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {relatedProducts.map((product) => {
          const primaryImage = product.pictures?.[0]
          const imageUrl = primaryImage
            ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${primaryImage.path}`
            : '/placeholder-product.png'

          const discountedPrice = product.discount > 0
            ? product.price * (1 - product.discount / 100)
            : null

          return (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="group block"
            >
              {/* Image Container */}
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Discount Badge */}
                {product.discount > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    -{product.discount}%
                  </span>
                )}

                {/* Out of Stock Overlay */}
                {product.quantity === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-white text-gray-800 px-3 py-1 rounded font-semibold text-sm">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div>
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                  {product.name}
                </h3>
                
                {/* Price */}
                <div className="flex items-center gap-2">
                  {discountedPrice ? (
                    <>
                      <span className="text-lg font-bold text-red-600">
                        ${discountedPrice.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        ${product.price.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default RelatedProducts