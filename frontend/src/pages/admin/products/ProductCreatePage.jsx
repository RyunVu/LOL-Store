import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { productsApi } from '@/api/products.api'
import { categoriesApi } from '@/api/categories.api'
import { suppliersApi } from '@/api/suppliers.api'
import ProductForm from './ProductForm'

export default function ProductCreatePage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      categoriesApi.getCategories(),
      suppliersApi.getSuppliers(),
    ]).then(([categoryRes, supplierRes]) => {
      setCategories(categoryRes?.result?.items ?? [])
      setSuppliers(supplierRes?.items ?? [])
    }).catch(err => {
      console.error('Failed to fetch data:', err)
      alert('Failed to load categories and suppliers')
    })
  }, [])

  const handleCreate = async ({ formData, newImages }) => {
    setLoading(true)
    try {
      // Create product
      const product = await productsApi.createProduct(formData)

      // Upload images if any
      if (newImages.length > 0) {
        await productsApi.uploadProductImages(product.id, newImages)
      }

      navigate('/admin/products')
    } catch (error) {
      console.error('Failed to create product:', error)
      alert('Failed to create product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/products')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create Product</h1>
        <p className="text-gray-600 mt-1">Add a new product to your catalog</p>
      </div>

      <ProductForm
        initialData={{
          name: '',
          sku: '',
          urlSlug: '',
          description: '',
          note: '',
          price: 0,
          quantity: 0,
          discount: 0,
          supplierId: '',
          active: true,
          categoryIds: [],
        }}
        categories={categories}
        suppliers={suppliers}
        existingImages={[]}
        onSubmit={handleCreate}
        submitText="Create Product"
        requireEditReason={false}
        loading={loading}
      />
    </div>
  )
}