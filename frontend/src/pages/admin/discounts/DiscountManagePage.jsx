import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { discountsApi } from '@/api/discounts.api'
import { useDebounce } from '@/hooks/useDebounce'
import AdminPagination from '../../../components/pagination/AdminPagination'

export default function DiscountsManagePage() {
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedDiscounts, setSelectedDiscounts] = useState([])

  const [deleteModal, setDeleteModal] = useState({
    show: false,
    discount: null,
    isPermanent: false,
  })

  const [restoreModal, setRestoreModal] = useState({
    show: false,
    discount: null,
  })

  const [filters, setFilters] = useState({
    code: '',
    isActive: '',
    isPercentage: '',
    isDeleted: '',
    status: '', 
    dateFilter: '', 
    sortOrder: '',
    pageNumber: 1,
    pageSize: 10,
  })

  const [totalItems, setTotalItems] = useState(0)

  const debouncedCode = useDebounce(filters.code, 300)

  const { pageNumber, pageSize, isActive, isPercentage, isDeleted, status, dateFilter, sortOrder } = filters

  const fetchDiscounts = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        pageNumber,
        pageSize,
        isActive,
        isPercentage,
        isDeleted,
        status,
        dateFilter,
        sortOrder,
        code: debouncedCode,
      }

      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] == null) {
          delete params[key]
        }
      })

      const res = await discountsApi.getDiscountsByManager(params)
      setDiscounts(res?.items ?? [])
      setTotalItems(res?.metadata?.totalItemCount ?? 0)
      setSelectedDiscounts([])
    } catch (error) {
      console.error('Failed to fetch discounts:', error)
      setDiscounts([])
    } finally {
      setLoading(false)
    }
  }, [debouncedCode, pageNumber, pageSize, isActive, isPercentage, isDeleted, status, dateFilter, sortOrder])

  useEffect(() => {
    fetchDiscounts()
  }, [fetchDiscounts])

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedDiscounts(discounts.map((d) => d.id))
    } else {
      setSelectedDiscounts([])
    }
  }

  const handleSelectDiscount = (discountId) => {
    setSelectedDiscounts((prev) =>
      prev.includes(discountId)
        ? prev.filter((id) => id !== discountId)
        : [...prev, discountId]
    )
  }

  const allSelectedAreDeleted = () => {
    if (selectedDiscounts.length === 0) return false
    return selectedDiscounts.every((id) => {
      const discount = discounts.find((d) => d.id === id)
      return discount?.isDeleted
    })
  }

  const anySelectedNotDeleted = () => {
    return selectedDiscounts.some((id) => {
      const discount = discounts.find((d) => d.id === id)
      return !discount?.isDeleted
    })
  }

  const allSelectedAreActive = () => {
    if (selectedDiscounts.length === 0) return false
    return selectedDiscounts.every((id) => {
      const discount = discounts.find((d) => d.id === id)
      return discount?.isActive
    })
  }

  const allSelectedAreInactive = () => {
    if (selectedDiscounts.length === 0) return false
    return selectedDiscounts.every((id) => {
      const discount = discounts.find((d) => d.id === id)
      return !discount?.isActive
    })
  }

  const handleBulkToggleActive = async (setActive) => {
    try {
      // Only toggle discounts that need to change
      const discountsToToggle = selectedDiscounts.filter((discountId) => {
        const discount = discounts.find((d) => d.id === discountId)
        return discount?.isActive !== setActive
      })

      if (discountsToToggle.length === 0) {
        alert('All selected discounts are already in the desired state')
        return
      }

      const togglePromises = discountsToToggle.map((discountId) => {
        return discountsApi.toggleActive(discountId, setActive)
      })
      await Promise.all(togglePromises)
      setSelectedDiscounts([])
      fetchDiscounts()
    } catch (error) {
      console.error('Toggle active failed:', error)
      alert('Failed to update discount status')
    }
  }

  const handleBulkDelete = () => {
    const isPermanent = allSelectedAreDeleted()
    setDeleteModal({
      show: true,
      discount: null,
      isPermanent,
      isMultiple: true,
    })
  }

  const handleBulkRestore = () => {
    setRestoreModal({
      show: true,
      discount: null,
      isMultiple: true,
    })
  }

  // Delete discount (single or multiple)
  const handleDelete = async () => {
    if (!deleteModal.discount && !deleteModal.isMultiple) return

    try {
      if (deleteModal.isMultiple) {
        // Bulk delete
        const deletePromises = selectedDiscounts.map((discountId) => {
          if (deleteModal.isPermanent) {
            return discountsApi.deleteDiscountPermanently(discountId)
          } else {
            return discountsApi.toggleSoftDeleteDiscount(discountId)
          }
        })
        await Promise.all(deletePromises)
        setSelectedDiscounts([])
      } else {
        // Single delete
        if (deleteModal.isPermanent) {
          await discountsApi.deleteDiscountPermanently(deleteModal.discount.id)
        } else {
          await discountsApi.toggleSoftDeleteDiscount(deleteModal.discount.id)
        }
      }
      setDeleteModal({ show: false, discount: null, isPermanent: false, isMultiple: false })
      fetchDiscounts()
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete discount(s)')
    }
  }

  // Restore discount (single or multiple)
  const handleRestore = async () => {
    if (!restoreModal.discount && !restoreModal.isMultiple) return

    try {
      if (restoreModal.isMultiple) {
        // Bulk restore
        const restorePromises = selectedDiscounts.map((discountId) => {
          return discountsApi.toggleSoftDeleteDiscount(discountId)
        })
        await Promise.all(restorePromises)
        setSelectedDiscounts([])
      } else {
        // Single restore
        await discountsApi.toggleSoftDeleteDiscount(restoreModal.discount.id)
      }
      setRestoreModal({ show: false, discount: null, isMultiple: false })
      fetchDiscounts()
    } catch (error) {
      console.error('Restore failed:', error)
      alert('Failed to restore discount(s)')
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
        return 'bg-green-900/30 text-green-400 border border-green-800'
      case 'Scheduled':
        return 'bg-blue-900/30 text-blue-400 border border-blue-800'
      case 'Expired':
        return 'bg-red-900/30 text-red-400 border border-red-800'
      case 'Inactive':
        return 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
      default:
        return 'bg-gray-700 text-gray-400 border border-gray-600'
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
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          + Add Discount
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Discount List</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
              {/* Search */}
              <input
                type="text"
                placeholder="Search discount code..."
                className="w-64 bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                value={filters.code}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    code: e.target.value,
                    pageNumber: 1,
                  }))
                }
              />

              {/* Type Filter */}
              <select
                className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-shadow"
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

              {/* Discount Status Filter */}
              <select
                className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-shadow"
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                    pageNumber: 1,
                  }))
                }
              >
                <option value="">All Discount Status</option>
                <option value="Active">Active</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Expired">Expired</option>
                <option value="Inactive">Inactive</option>
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
                    code: '',
                    isActive: '',
                    isPercentage: '',
                    isDeleted: '',
                    status: '',
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

            <div className="h-11 flex justify-end items-center">
              {/* Bulk Action Buttons */}
              {selectedDiscounts.length > 0 && (
                <div className="ml-auto flex items-center gap-3 bg-gray-900 px-3 py-2 rounded-lg border border-gray-600">
                  <span className="text-sm text-blue-400 font-medium">
                    {selectedDiscounts.length} selected
                  </span>

                  <div className="h-4 w-px bg-gray-600"></div>

                  {/* Active/Inactive Toggle Buttons */}
                  {!allSelectedAreDeleted() && (
                    <>
                      {!allSelectedAreActive() && (
                        <button
                          onClick={() => handleBulkToggleActive(true)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Set Active
                        </button>
                      )}

                      {!allSelectedAreInactive() && (
                        <button
                          onClick={() => handleBulkToggleActive(false)}
                          className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Set Inactive
                        </button>
                      )}

                      <div className="h-4 w-px bg-gray-600"></div>
                    </>
                  )}

                  {/* Show Restore if all selected are soft-deleted */}
                  {allSelectedAreDeleted() && (
                    <button
                      onClick={handleBulkRestore}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Restore
                    </button>
                  )}

                  {/* Show Delete if any selected are NOT deleted */}
                  {anySelectedNotDeleted() && (
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  )}

                  {/* Show Delete Forever if all selected are soft-deleted */}
                  {allSelectedAreDeleted() && (
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      Delete Forever
                    </button>
                  )}

                  <div className="h-4 w-px bg-gray-600"></div>

                  <button
                    onClick={() => setSelectedDiscounts([])}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <p>Loading discounts...</p>
          </div>
        ) : discounts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg mb-2">No discounts found</p>
            <p className="text-sm">Try adjusting your filters or create a new discount</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-900">
                  <tr>
                    {/* NEW: Checkbox Column */}
                    <th className="px-6 py-4 whitespace-nowrap text-left">
                      <input
                        type="checkbox"
                        checked={
                          discounts.length > 0 &&
                          selectedDiscounts.length === discounts.length
                        }
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Uses
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      End Date
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
                  {discounts.map((discount, i) => {
                    const status = getStatus(discount)
                    return (
                      <tr
                        key={discount.id}
                        className={`hover:bg-gray-700/40 transition-colors ${
                          selectedDiscounts.includes(discount.id) ? 'bg-gray-700/20' : ''
                        }`}
                      >
                        {/* NEW: Checkbox */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedDiscounts.includes(discount.id)}
                            onChange={() => handleSelectDiscount(discount.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                          />
                        </td>

                        {/* Row Number */}
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                          {(filters.pageNumber - 1) * filters.pageSize + i + 1}
                        </td>

                        {/* Code */}
                        <td className="px-6 py-4 whitespace-nowrap text-white font-medium font-mono">
                          {discount.code}
                        </td>

                        {/* Value */}
                        <td className="px-6 py-4 whitespace-nowrap text-white">
                          {discount.isPercentage
                            ? `${discount.discountValue}%`
                            : `$${discount.discountValue.toFixed(2)}`}
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                          {discount.isPercentage ? 'Percentage' : 'Fixed'}
                        </td>

                        {/* Uses */}
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                          {discount.maxUses ? `${discount.timesUsed}/${discount.maxUses}` : `${discount.timesUsed}/∞`}
                        </td>

                        {/* Start Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm font-mono">
                          {formatDate(discount.startDate)}
                        </td>

                        {/* End Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm font-mono">
                          {formatDate(discount.endDate)}
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap w-fit ${getStatusColor(status)}`}
                            >
                              {status}
                            </span>

                            {/* Deleted Badge */}
                            {discount.isDeleted && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap w-fit bg-red-900/30 text-red-400 border border-red-800">
                                Deleted
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm font-mono">
                          {formatDate(discount.createdAt)}
                        </td>

                        {/* Updated Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm font-mono">
                          {formatDate(discount.updatedAt)}
                        </td>

                        {/* Deleted Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm font-mono">
                          {formatDate(discount.deletedAt)}
                        </td>

                        {/* Action Buttons */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center gap-3">
                            {!discount.isDeleted ? (
                              <>
                                <Link
                                  to={`/admin/discounts/edit/${discount.id}`}
                                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                                >
                                  Edit
                                </Link>
                                <button
                                  onClick={() =>
                                    setDeleteModal({
                                      show: true,
                                      discount,
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
                                      discount,
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
                                      discount,
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-3">
                {deleteModal.isPermanent
                  ? '⚠️ Permanently Delete ' + (deleteModal.isMultiple ? 'Discounts' : 'Discount')
                  : 'Delete ' + (deleteModal.isMultiple ? 'Discounts' : 'Discount')}
              </h3>

              <div className="mb-6">
                {deleteModal.isPermanent ? (
                  <div className="space-y-3">
                    <p className="text-gray-300">
                      Are you sure you want to{' '}
                      <span className="text-red-400 font-semibold">
                        permanently delete
                      </span>{' '}
                      {deleteModal.isMultiple
                        ? `${selectedDiscounts.length} discount${selectedDiscounts.length === 1 ? '' : 's'}`
                        : 'this discount'}?
                    </p>
                    {!deleteModal.isMultiple && (
                      <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                        <p className="text-red-300 font-medium font-mono">
                          "{deleteModal.discount?.code}"
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-gray-400">
                      ⚠️ This action cannot be undone and will remove all data associated with {deleteModal.isMultiple ? 'these discounts' : 'this discount'}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-300">
                      Are you sure you want to delete{' '}
                      {deleteModal.isMultiple
                        ? `${selectedDiscounts.length} discount${selectedDiscounts.length === 1 ? '' : 's'}`
                        : 'this discount'}?
                    </p>
                    {!deleteModal.isMultiple && (
                      <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
                        <p className="text-white font-medium font-mono">
                          "{deleteModal.discount?.code}"
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-gray-400">
                      {deleteModal.isMultiple ? 'The discounts' : 'The discount'} will be marked as deleted and can be restored later.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() =>
                    setDeleteModal({ show: false, discount: null, isPermanent: false, isMultiple: false })
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
                ♻️ Restore {restoreModal.isMultiple ? 'Discounts' : 'Discount'}
              </h3>

              <div className="mb-6 space-y-2">
                <p className="text-gray-300">
                  Are you sure you want to restore{' '}
                  {restoreModal.isMultiple
                    ? `${selectedDiscounts.length} discount${selectedDiscounts.length === 1 ? '' : 's'}`
                    : 'this discount'}?
                </p>
                {!restoreModal.isMultiple && (
                  <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
                    <p className="text-green-300 font-medium font-mono">
                      "{restoreModal.discount?.code}"
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-400">
                  {restoreModal.isMultiple ? 'The discounts' : 'The discount'} will be restored and unmarked as deleted.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() =>
                    setRestoreModal({ show: false, discount: null, isMultiple: false })
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