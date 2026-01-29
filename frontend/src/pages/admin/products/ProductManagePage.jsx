import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { productsApi } from '@/api/products.api'
import { categoriesApi } from '@/api/categories.api'
import { useDebounce } from '@/hooks/useDebounce'
import AdminPagination from '../../../components/pagination/AdminPagination'

export default function ProductsManagePage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [deleteModal, setDeleteModal] = useState({
    show: false,
    product: null,
  })

  const [filters, setFilters] = useState({
    keyword: '',
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    active: '',
    pageNumber: 1,
    pageSize: 10,
  })

  const [totalItems, setTotalItems] = useState(0)

  //   Fetch categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
      const res = await categoriesApi.getCategoriesByManager()
      setCategories(res?.items ?? [])
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }
    loadCategories()
  }, [])

  
  //   Fetch products

  const debouncedKeyword = useDebounce(filters.keyword, 300)

  const {
    pageNumber,
    pageSize,
    categoryId,
    active,
  } = filters

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        pageNumber,
        pageSize,
        categoryId,
        active,
        keyword: debouncedKeyword,
      }

      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] == null) {
          delete params[key]
        }
      })

      const res = await productsApi.getProducts(params)
      setProducts(res?.items ?? [])
      setTotalItems(res?.metadata?.totalItemCount ?? 0)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }, [
    debouncedKeyword,
    pageNumber,
    pageSize,
    categoryId,
    active,
  ])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  //   Delete product
  const handleDelete = async () => {
    if (!deleteModal.product) return

    try {
      await productsApi.toggleDelete(
        deleteModal.product.id,
        'Deleted from admin panel'
      )
      setDeleteModal({ show: false, product: null })
      fetchProducts()
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete product')
    }
  }
  
  return (
    
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Products</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Manage your product catalog
          </p>
        </div>

        <Link
          to="/admin/products/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Add Product
        </Link>
      </div>

      {/* Filters Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title */}
          <h2 className="text-lg font-semibold text-white">
            Product List
          </h2>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search product..."
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

            {/* Category */}
            <select
              className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={filters.categoryId}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  categoryId: e.target.value,
                  pageNumber: 1,
                }))
              }
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={filters.active}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  active: e.target.value,
                  pageNumber: 1,
                }))
              }
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            {/* Clear */}
            <button
              onClick={() =>
                setFilters((prev) => ({
                  keyword: '',
                  categoryId: '',
                  minPrice: '',
                  maxPrice: '',
                  active: '',
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
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No products found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 w-15 whitespace-nowrap text-left text-xs text-gray-400">No</th>
                    <th className="px-6 py-4 w-80 whitespace-nowrap text-left text-xs text-gray-400">Product</th>
                    <th className="px-6 py-4 w-40 whitespace-nowrap text-left text-xs text-gray-400">SKU</th>
                    <th className="px-6 py-4 w-30 whitespace-nowrap text-left text-xs text-gray-400">Price</th>
                    <th className="px-6 py-4 w-30 whitespace-nowrap text-left text-xs text-gray-400">Stock</th>
                    <th className="px-6 py-4 w-30 whitespace-nowrap text-left text-xs text-gray-400">Status</th>
                    <th className="px-6 py-4 w-30 whitespace-nowrap text-center text-xs text-gray-400">Actions</th>
                  </tr>
                </thead>


                <tbody className="divide-y divide-gray-700">
                  {products.map((p, i) => (
                    <tr key={p.id} className="hover:bg-gray-700/40">
                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-gray-300">
                        {(filters.pageNumber - 1) * filters.pageSize + i + 1}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-white font-medium">
                        {p.name}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-gray-400 font-mono">
                        {p.sku}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-white">
                        ${p.price?.toFixed(2) ?? '0.00'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-gray-300">
                        {p.quantity ?? 0}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                            p.active
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {p.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-center">
                        <div className="flex justify-center gap-5">
                          <Link
                            to={`/admin/products/edit/${p.id}`}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() =>
                              setDeleteModal({ show: true, product: p })
                            }
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
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
            <h3 className="text-lg text-white mb-3">Delete Product</h3>
            <p className="text-gray-400 mb-6">
              Delete{' '}
              <span className="text-white font-medium">
                {deleteModal.product?.name}
              </span>
              ?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, product: null })}
                className="px-4 py-2 border border-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 rounded text-white"
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
