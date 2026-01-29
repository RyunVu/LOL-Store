import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { categoriesApi } from '@/api/categories.api'
import { useDebounce } from '@/hooks/useDebounce'
import AdminPagination from '../../../components/pagination/AdminPagination'

export default function CategoryManagePage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [deleteModal, setDeleteModal] = useState({
    show: false,
    category: null,
    isPermanent: false,
  })

  const [restoreModal, setRestoreModal] = useState({
    show: false,
    category: null,
  })

  const [filters, setFilters] = useState({
    keyword: '',
    isActive: '',
    isDeleted: '',
    dateFilter: '',
    sortOrder: '',
    pageNumber: 1,
    pageSize: 10,
  })

  const [totalItems, setTotalItems] = useState(0)

  const debouncedKeyword = useDebounce(filters.keyword, 300)

  const { pageNumber, pageSize, isActive, isDeleted, dateFilter, sortOrder } = filters


  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        pageNumber,
        pageSize,
        isActive,
        isDeleted,
        keyword: debouncedKeyword,
        dateFilter,
        sortOrder,
      }

      // Remove empty parameters
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
  }, [debouncedKeyword, pageNumber, pageSize, isActive, isDeleted, dateFilter, sortOrder])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleDelete = async () => {
    if (!deleteModal.category) return

    try {
      if (deleteModal.isPermanent) {
        // Permanent delete - endpoint: DELETE /api/categories/{id}
        await categoriesApi.deleteCategoryPermanently(deleteModal.category.id)
      } else {
        // Soft delete toggle - endpoint: DELETE /api/categories/SoftDeleteToggle/{id}
        await categoriesApi.toggleSoftDeleteCategory(deleteModal.category.id)
      }
      setDeleteModal({ show: false, category: null, isPermanent: false })
      fetchCategories()
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete category')
    }
  }

  const handleRestore = async () => {
    if (!restoreModal.category) return

    try {
      // Toggle soft delete (will restore if deleted)
      await categoriesApi.toggleSoftDeleteCategory(restoreModal.category.id)
      setRestoreModal({ show: false, category: null })
      fetchCategories()
    } catch (error) {
      console.error('Restore failed:', error)
      alert('Failed to restore category')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '--/--/----'
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
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
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          + Add Category
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 shadow-lg">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white">Category List</h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search category..."
              className="w-64 bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
              value={filters.keyword}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  keyword: e.target.value,
                  pageNumber: 1,
                }))
              }
            />

            {/* Active Status Filter */}
            <select
              className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-shadow"
              value={filters.isActive}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  isActive: e.target.value,
                  pageNumber: 1,
                }))
              }
            >
              <option value="">All Active Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            {/* Deleted Status Filter */}
            <select
              className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-shadow"
              value={filters.isDeleted}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  isDeleted: e.target.value,
                  pageNumber: 1,
                }))
              }
            >
              <option value="">All Delete Status</option>
              <option value="false">Not Deleted</option>
              <option value="true">Deleted</option>
            </select>

            {/* Date Filter Type */}
            <select
              className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-shadow"
              value={filters.dateFilter}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  dateFilter: e.target.value,
                  sortOrder: 'Desc',
                  pageNumber: 1,
                }))
              }
            >
              <option value="">Filter by Date</option>
              <option value="Created">Created Date</option>
              <option value="Updated">Updated Date</option>
              <option value="Deleted">Deleted Date</option>
            </select>

            {/* Date Sort Order - Only show when date filter is selected */}
            {filters.dateFilter && (
              <select
                className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-shadow"
                value={filters.sortOrder}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortOrder: e.target.value,
                    pageNumber: 1,
                  }))
                }
              >
                <option value="Desc">Newest First</option>
                <option value="Asc">Oldest First</option>
              </select>
            )}

            {/* Clear Filters */}
            <button
              onClick={() =>
                setFilters((prev) => ({
                  keyword: '',
                  isActive: '',
                  isDeleted: '',
                  dateFilter: '',
                  sortOrder: '',
                  pageNumber: 1,
                  pageSize: prev.pageSize,
                }))
              }
              className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <p>Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg mb-2">No categories found</p>
            <p className="text-sm">Try adjusting your filters or create a new category</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Category Name
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Deleted
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-700">
                  {categories.map((category, i) => (
                    <tr 
                      key={category.id} 
                      className="hover:bg-gray-700/40 transition-colors"
                    >
                      {/* Row Number */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                        {(filters.pageNumber - 1) * filters.pageSize + i + 1}
                      </td>

                      {/* Category Name */}
                      <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                        <div className="flex flex-col">
                          <span>{category.name}</span>
                          <span className="text-xs text-gray-500 mt-1">
                            /{category.urlSlug}
                          </span>
                        </div>
                      </td>

                      {/* Product Count */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                        {category.productCount ?? 0}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {/* Active/Inactive Badge */}
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap w-fit ${
                              category.isActive
                                ? 'bg-green-900/30 text-green-400 border border-green-800'
                                : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                            }`}
                          >
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                          
                          {/* Deleted Badge */}
                          {category.isDeleted && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap w-fit bg-red-900/30 text-red-400 border border-red-800">
                              Deleted
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm font-mono">
                        {formatDate(category.createdAt)}
                      </td>

                      {/* Updated Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm font-mono">
                        {formatDate(category.updatedAt)}
                      </td>

                      {/* Deleted Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm font-mono">
                        {formatDate(category.deletedAt)}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-3">
                          {!category.isDeleted ? (
                            <>
                              <Link
                                to={`/admin/categories/edit/${category.id}`}
                                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() =>
                                  setDeleteModal({
                                    show: true,
                                    category,
                                    isPermanent: false,
                                  })
                                }
                                className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  setRestoreModal({
                                    show: true,
                                    category,
                                  })
                                }
                                className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                              >
                                Restore
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteModal({
                                    show: true,
                                    category,
                                    isPermanent: true,
                                  })
                                }
                                className="text-red-600 hover:text-red-500 text-sm font-semibold transition-colors"
                              >
                                Delete Forever
                              </button>
                            </>
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-3">
                {deleteModal.isPermanent
                  ? '⚠️ Permanently Delete Category'
                  : 'Delete Category'}
              </h3>
              
              <div className="mb-6">
                {deleteModal.isPermanent ? (
                  <div className="space-y-3">
                    <p className="text-gray-300">
                      Are you sure you want to{' '}
                      <span className="text-red-400 font-semibold">
                        permanently delete
                      </span>{' '}
                      this category?
                    </p>
                    <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                      <p className="text-red-300 font-medium">
                        "{deleteModal.category?.name}"
                      </p>
                    </div>
                    <p className="text-sm text-gray-400">
                      ⚠️ This action cannot be undone and will remove all data associated with this category.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-300">
                      Are you sure you want to delete this category?
                    </p>
                    <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
                      <p className="text-white font-medium">
                        "{deleteModal.category?.name}"
                      </p>
                    </div>
                    <p className="text-sm text-gray-400">
                      The category will be marked as deleted and can be restored later.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() =>
                    setDeleteModal({ show: false, category: null, isPermanent: false })
                  }
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                    deleteModal.isPermanent
                      ? 'bg-red-700 hover:bg-red-800'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {deleteModal.isPermanent ? 'Delete Forever' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {restoreModal.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-3">
                ♻️ Restore Category
              </h3>
              
              <div className="mb-6 space-y-2">
                <p className="text-gray-300">
                  Are you sure you want to restore this category?
                </p>
                <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
                  <p className="text-green-300 font-medium">
                    "{restoreModal.category?.name}"
                  </p>
                </div>
                <p className="text-sm text-gray-400">
                  The category will be restored and unmarked as deleted.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() =>
                    setRestoreModal({ show: false, category: null })
                  }
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestore}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
                >
                  Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}