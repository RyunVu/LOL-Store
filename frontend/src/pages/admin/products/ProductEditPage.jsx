import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { productsApi } from '@/api/products.api'
import { categoriesApi } from '@/api/categories.api'
import { suppliersApi } from '@/api/suppliers.api'
import ProductForm from './ProductForm'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function ProductEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  useEffect(() => {
    setFetchLoading(true)
    Promise.all([
      productsApi.getProductById(id),
      categoriesApi.getCategories(),
      suppliersApi.getSuppliers(),
    ]).then(([p, categoryRes, supplierRes]) => {
      
      console.log('PRODUCT DETAIL RESPONSE:', p)
      setProduct({
        ...p,
        categoryIds: p.categories?.map((x) => x.id) || [],
        editReason: '',
      })
      setCategories(categoryRes?.result?.items ?? [])
      setSuppliers(supplierRes?.items ?? [])
    }).catch(err => {
      console.error('Failed to fetch data:', err)
      alert('Failed to load product')
      navigate('/admin/products')

      
    }).finally(() => {
      setFetchLoading(false)
    })
  }, [id, navigate])

  const handleUpdate = async ({ formData, newImages }) => {
    setLoading(true)
    try {
      // Update product
      await productsApi.updateProduct(id, formData)

      // Upload new images if any
      if (newImages.length > 0) {
        await productsApi.uploadProductImages(id, newImages)
      }

      navigate('/admin/products')
    } catch (error) {
      console.error('Failed to update product:', error)
      alert('Failed to update product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Product not found</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-8 space-y-3">
      {/* Back button */}
      <button
          onClick={() => navigate('/admin/products')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </button>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-white leading-tight">
          Edit Product
        </h1>
        <p className="text-gray-400 mt-1">
          Update product information
        </p>
      </div>
    </div>

      <ProductForm
        initialData={product}
        categories={categories}
        suppliers={suppliers}
        existingImages={product.pictures || []}
        onSubmit={handleUpdate}
        submitText="Update Product"
        requireEditReason={true}
        loading={loading}
      />
    </div>
  )
}