import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { productsApi } from '../../api/products.api'
import ProductGallery from '../../components/products/ProductGallery'
import ProductHeader from '../../components/products/ProductHeader'
import ProductTabs from '../../components/products/ProductTabs'
import RelatedProducts from '../../components/products/RelatedProducts'

const ProductDetail = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const data = await productsApi.getProductById(id)
        console.log('Fetched product data:', data)
        console.log('Product pictures:', data.pictures)
        setProduct(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  // This will log after product state is updated
  useEffect(() => {
    if (product) {
      console.log('Product state updated:', product)
      console.log('Pictures in state:', product.pictures)
    }
  }, [product])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Product not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProductGallery pictures={product.pictures || []} />
        <div>
          <ProductHeader product={product} />
          <ProductTabs 
            description={product.description}
            productId={product.id}
          />
        </div>
      </div>

      {/* Related Products Section */}
      <RelatedProducts 
        productSlug={product.urlSlug} 
        currentProductId={product.id}
      />
    </div>
  )
}

export default ProductDetail