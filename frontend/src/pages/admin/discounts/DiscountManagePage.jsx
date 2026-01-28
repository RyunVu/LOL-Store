import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { discountsApi } from '@/api/discounts.api'
import { useDebounce } from '@/hooks/useDebounce'
import AdminPagination from '../../../components/pagination/AdminPagination'

export default function DiscountsManagePage() {
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)

  const [deleteModal, setDeleteModal] = useState({
    show: false,
    discount: null,
  })

  const [filters, setFilters] = useState({
    code: '',
    isActive: '',
    isPercentage: '',
    pageNumber: 1,
    pageSize: 10,
  })

  const [totalItems, setTotalItems] = useState(0)

  const debouncedCode = useDebounce(filters.code, 300)

  const { pageNumber, pageSize, isActive, isPercentage } = filters

  const fetchDiscounts = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        pageNumber,
        pageSize,
        isActive,
        isPercentage,
        code: debouncedCode,
      }

      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] == null) {
          delete params[key]
        }
      })

      const res = await discountsApi.getDiscounts(params)
      setDiscounts(res?.items ?? [])
      setTotalItems(res?.metadata?.totalItemCount ?? 0)
    } catch (error) {
      console.error('Failed to fetch discounts:', error)
    } finally {
      setLoading(false)
    }
  }, [debouncedCode, pageNumber, pageSize, isActive, isPercentage])

  useEffect(() => {
    fetchDiscounts()
  }, [fetchDiscounts])

  const handleDelete = async () => {
    if (!deleteModal.discount) return

    try {
      // Since there's no delete endpoint shown in your API, 
      // you might need to implement a soft delete by updating isActive to false
      await discountsApi.updateDiscount(deleteModal.discount.id, {
        ...deleteModal.discount,
        isActive: false,
      })
      setDeleteModal({ show: false, discount: null })
      fetchDiscounts()
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete discount')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatus = (discount) => {
    const now = new Date()
    const start = new Date(discount.startDate)
    const end = new Date(discount.endDate)

    if (!discount.isActive) return 'Inactive'
    if (now < start) return 'Scheduled'
    if (now > end) return 'Expired'
    return 'Active'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-900/30 text-green-400'
      case 'Scheduled':
        return 'bg-blue-900/30 text-blue-400'
      case 'Expired':
        return 'bg-red-900/30 text-red-400'
      case 'Inactive':
        return 'bg-gray-700 text-gray-400'
      default:
        return 'bg-gray-700 text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Discounts</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Manage discount codes and promotions
          </p>
        </div>

        <Link
          to="/admin/discounts/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Add Discount
        </Link>
      </div>

      {/* Filters Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title */}
          <h2 className="text-lg font-semibold text-white">
            Discount List
          </h2>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search discount code..."
              className="w-64 bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={filters.code}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  code: e.target.value,
                  pageNumber: 1,
                }))
              }
            />

            {/* Status */}
            <select
              className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={filters.isActive}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  isActive: e.target.value,
                  pageNumber: 1,
                }))
              }
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            {/* Type */}
            <select
              className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={filters.isPercentage}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  isPercentage: e.target.value,
                  pageNumber: 1,
                }))
              }
            >
              <option value="">All Types</option>
              <option value="true">Percentage</option>
              <option value="false">Fixed</option>
            </select>

            {/* Clear */}
            <button
              onClick={() =>
                setFilters((prev) => ({
                  code: '',
                  isActive: '',
                  isPercentage: '',
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
            Loading discounts...
          </div>
        ) : discounts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No discounts found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 w-15 whitespace-nowrap text-left text-xs text-gray-400">No</th>
                    <th className="px-6 py-4 w-40 whitespace-nowrap text-left text-xs text-gray-400">Code</th>
                    <th className="px-6 py-4 w-30 whitespace-nowrap text-left text-xs text-gray-400">Value</th>
                    <th className="px-6 py-4 w-30 whitespace-nowrap text-left text-xs text-gray-400">Type</th>
                    <th className="px-6 py-4 w-30 whitespace-nowrap text-left text-xs text-gray-400">Uses</th>
                    <th className="px-6 py-4 w-40 whitespace-nowrap text-left text-xs text-gray-400">Valid Until</th>
                    <th className="px-6 py-4 w-30 whitespace-nowrap text-left text-xs text-gray-400">Status</th>
                    <th className="px-6 py-4 w-30 whitespace-nowrap text-center text-xs text-gray-400">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-700">
                  {discounts.map((d, i) => {
                    const status = getStatus(d)
                    return (
                      <tr key={d.id} className="hover:bg-gray-700/40">
                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-gray-300">
                          {(filters.pageNumber - 1) * filters.pageSize + i + 1}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-white font-medium font-mono">
                          {d.code}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-white">
                          {d.isPercentage
                            ? `${d.discountValue}%`
                            : `$${d.discountValue.toFixed(2)}`}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-gray-300">
                          {d.isPercentage ? 'Percentage' : 'Fixed'}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-gray-300">
                          {d.maxUses ? `${d.timesUsed}/${d.maxUses}` : `${d.timesUsed}/∞`}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-gray-300">
                          {formatDate(d.endDate)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs whitespace-nowrap ${getStatusColor(status)}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-center">
                          <div className="flex justify-center gap-5">
                            <Link
                              to={`/admin/discounts/edit/${d.id}`}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() =>
                                setDeleteModal({ show: true, discount: d })
                              }
                              className="text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
            <h3 className="text-lg text-white mb-3">Delete Discount</h3>
            <p className="text-gray-400 mb-6">
              Delete discount code{' '}
              <span className="text-white font-medium font-mono">
                {deleteModal.discount?.code}
              </span>
              ?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, discount: null })}
                className="px-4 py-2 border border-gray-600 text-white rounded hover:bg-gray-700"
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