import React, { useEffect, useState, useCallback } from 'react'
import { categoriesApi } from '@/api/categories.api'

export default function CategoryPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await categoriesApi.getCategories()
 
      const items = response?.result?.items ?? []

      setCategories(items)
    } catch (err) {
      console.error('Fetch categories error:', err)
      setError(
        err?.response?.data?.message ||
        'Failed to load categories'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  if (loading) {
    return <p className="text-gray-500">Loading categories...</p>
  }

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Manage Categories</h2>

      <div className="bg-white p-6 rounded-lg shadow">
        {categories.length === 0 ? (
          <p className="text-gray-600">No categories found</p>
        ) : (
          <ul className="divide-y">
            {categories.map((category) => (
              <li
                key={category.id}
                className="py-3 flex items-center justify-between"
              >
                <span className="font-medium">
                  {category.name}
                </span>

                {/* Optional future actions */}
                {/* <button className="text-blue-600 hover:underline">
                  Edit
                </button> */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
