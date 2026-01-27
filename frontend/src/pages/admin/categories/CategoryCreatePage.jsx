import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categoriesApi } from '@/api/categories.api'
import CategoryForm from './CategoryForm'

export default function CategoryCreatePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleCreate = async (formData) => {
    setLoading(true)
    try {
      await categoriesApi.createCategory(formData)
      navigate('/admin/categories')
    } catch (error) {
      console.error('Failed to create category:', error)
      alert('Failed to create category. Please try again.')
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-white">Create Category</h1>
          <p className="text-gray-400 mt-1">Add a new category to organize products</p>
        </div>

        <CategoryForm
          initialData={{
            name: '',
            urlSlug: '',
            description: '',
            showOnMenu: true,
          }}
          onSubmit={handleCreate}
          submitText="Create Category"
          loading={loading}
        />
      </div>
    </div>
  )
}