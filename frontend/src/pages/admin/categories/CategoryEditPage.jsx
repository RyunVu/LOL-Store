import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { categoriesApi } from '@/api/categories.api'
import CategoryForm from './CategoryForm'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function CategoryEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  useEffect(() => {
    const fetchCategory = async () => {
      setFetchLoading(true)
      try {
        const response = await categoriesApi.getCategoryById(id)
        setCategory(response?.result ?? response)
      } catch (err) {
        console.error('Failed to fetch category:', err)
        alert('Failed to load category')
        navigate('/admin/categories')
      } finally {
        setFetchLoading(false)
      }
    }

    fetchCategory()
  }, [id, navigate])

  const handleUpdate = async (formData) => {
    setLoading(true)
    try {
      await categoriesApi.updateCategory(id, formData)
      navigate('/admin/categories')
    } catch (error) {
      console.error('Failed to update category:', error)
      alert('Failed to update category. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <LoadingSpinner />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Category not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/categories')}
            className="text-gray-400 hover:text-white flex items-center gap-2 mb-4"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Categories
          </button>
          <h1 className="text-3xl font-bold text-white">Edit Category</h1>
          <p className="text-gray-400 mt-1">Update category information</p>
        </div>

        <CategoryForm
          initialData={category}
          onSubmit={handleUpdate}
          submitText="Update Category"
          loading={loading}
        />
      </div>
    </div>
  )
}