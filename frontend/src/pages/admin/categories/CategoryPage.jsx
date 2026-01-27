import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { categoriesApi } from '@/api/categories.api'
import { useDebounce } from '@/hooks/useDebounce'
import AdminPagination from '../../../components/pagination/AdminPagination'

export default function CategoryPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [deleteModal, setDeleteModal] = useState({
    show: false,
    category: null,
  })

  const [filters, setFilters] = useState({
    keyword: '',
    isDeleted: '',
    pageNumber: 1,
    pageSize: 10,
  })

  const [totalItems, setTotalItems] = useState(0)

  const debouncedKeyword = useDebounce(filters.keyword, 300)

  const { pageNumber, pageSize, isDeleted } = filters

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        pageNumber,
        pageSize,
        isDeleted,
        keyword: debouncedKeyword,
      }

      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] == null) {
          delete params[key]
        }
      })

    const res = await categoriesApi.getCategoriesByManager(params)

    setCategories(res?.items ?? [])
    setTotalItems(res?.totalItems ?? 0)

    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, pageNumber, pageSize, isDeleted])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleDelete = async () => {
    if (!deleteModal.category) return

    try {
      await categoriesApi.deleteCategory(deleteModal.category.id)
      setDeleteModal({ show: false, category: null })
      fetchCategories()
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete category')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Categories</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Manage product categories
          </p>
        </div>

        <Link
          to="/admin/categories/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Add Category
        </Link>
      </div>

      {/* Filters Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title */}
          <h2 className="text-lg font-semibold text-white">Category List</h2>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search category..."
              className="w-64 bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={filters.keyword}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  keyword: e.target.value,
                  pageNumber: 1,
                }))
              }
            />

            {/* Status */}
            <select
              className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={filters.isDeleted}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  isDeleted: e.target.value,
                  pageNumber: 1,
                }))
              }
            >
              <option value="">All Status</option>
              <option value="false">Active</option>
              <option value="true">Deleted</option>
            </select>

            {/* Clear */}
            <button
              onClick={() =>
                setFilters((prev) => ({
                  keyword: '',
                  isDeleted: '',
                  pageNumber: 1,
                  pageSize: prev.pageSize,
                }))
              }
              className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No categories found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 w-20 whitespace-nowrap text-left text-xs text-gray-400">
                      No
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs text-gray-400">
                      Category Name
                    </th>
                    <th className="px-6 py-4 w-32 whitespace-nowrap text-left text-xs text-gray-400">
                      Products
                    </th>
                    <th className="px-6 py-4 w-32 whitespace-nowrap text-left text-xs text-gray-400">
                      Menu
                    </th>
                    <th className="px-6 py-4 w-32 whitespace-nowrap text-left text-xs text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-4 w-40 whitespace-nowrap text-center text-xs text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-700">
                  {categories.map((category, i) => (
                    <tr key={category.id} className="hover:bg-gray-700/40">
                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-gray-300">
                        {(filters.pageNumber - 1) * filters.pageSize + i + 1}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-white font-medium">
                        {category.name}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-gray-300">
                        {category.productCount ?? 0}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                            category.showOnMenu
                              ? 'bg-blue-900/30 text-blue-400'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {category.showOnMenu ? 'Visible' : 'Hidden'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                            !category.isDeleted
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {!category.isDeleted ? 'Active' : 'Deleted'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-center">
                        <div className="flex justify-center gap-5">
                          <Link
                            to={`/admin/categories/edit/${category.id}`}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            Edit
                          </Link>
                          {!category.isDeleted && (
                            <button
                              onClick={() =>
                                setDeleteModal({ show: true, category })
                              }
                              className="text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <AdminPagination
              filters={filters}
              totalItems={totalItems}
              setFilters={setFilters}
            />
          </>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg text-white mb-3">Delete Category</h3>
            <p className="text-gray-400 mb-6">
              Delete{' '}
              <span className="text-white font-medium">
                {deleteModal.category?.name}
              </span>
              ?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, category: null })}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 rounded text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}