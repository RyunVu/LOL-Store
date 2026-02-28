import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ordersApi } from '@/api/orders.api'
import { useDebounce } from '@/hooks/useDebounce'
import AdminPagination from '../../../components/pagination/AdminPagination'

export default function OrdersManagePage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)

  const [selectedOrders, setSelectedOrders] = useState([])

  const [statusModal, setStatusModal] = useState({
    show: false,
    order: null,
    newStatus: null,
    isMultiple: false
  })

  const [filters, setFilters] = useState({
    keyword: '',           
    status: '',            
    year: '',              
    month: '',             
    day: '',               
    sortColumn: 'OrderDate',
    sortOrder: 'Desc',
    pageNumber: 1,
    pageSize: 10,
  })

  const debouncedKeyword = useDebounce(filters.keyword, 300)

  const { pageNumber, pageSize, status, year, month, day, sortColumn, sortOrder } = filters

  const getStatusString = (statusValue) => {
    const statusMap = {
      0: 'None',
      1: 'New',
      2: 'Pending',
      3: 'Processing',
      4: 'Shipped',
      5: 'Delivered',
      6: 'Cancelled'
    }
    return statusMap[statusValue] || 'None'
  }

  const getStatusNumber = (statusString) => {
    const statusMap = {
      'None': 0,
      'New': 1,
      'Pending': 2,
      'Processing': 3,
      'Shipped': 4,
      'Delivered': 5,
      'Cancelled': 6
    }
    return statusMap[statusString]
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        pageNumber,
        pageSize,
        status: status || undefined,
        year: year || undefined,
        month: month || undefined,
        day: day || undefined,
        keyword: debouncedKeyword || undefined,
        sortColumn,
        sortOrder,
      }

      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === undefined || params[key] === null) {
          delete params[key]
        }
      })

      const res = await ordersApi.getOrdersByManager(params)
      
  
      const transformedOrders = (res?.items ?? []).map(order => ({
        ...order,
        status: getStatusString(order.status)
      }))
      
      setOrders(transformedOrders)
      setTotalItems(res?.metadata?.totalItemCount ?? 0)
      setSelectedOrders([])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      setOrders([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, pageNumber, pageSize, status, year, month, day, sortColumn, sortOrder])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map((o) => o.id))
    } else {
      setSelectedOrders([])
    }
  }

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    )
  }

  const canChangeToStatus = (targetStatus) => {
    if (selectedOrders.length === 0) return false
    
    return selectedOrders.every((id) => {
      const order = orders.find((o) => o.id === id)
      if (!order) return false
      
      const currentStatus = order.status
      
      switch (targetStatus) {
        case 'Pending':
          return currentStatus === 'New'
        case 'Processing':
          return currentStatus === 'Pending'
        case 'Shipped':  
          return currentStatus === 'Processing'
        case 'Delivered':
          return currentStatus === 'Shipped'  
        case 'Cancelled':
          return ['New', 'Pending', 'Processing'].includes(currentStatus)
        default:
          return false
      }
    })
  }

  const handleBulkStatusChange = (newStatus) => {
    setStatusModal({
      show: true,
      order: null,
      newStatus,
      isMultiple: true,
    })
  }

  const handleStatusChange = async () => {
    if (!statusModal.newStatus) return

    try {
  
      const numericStatus = getStatusNumber(statusModal.newStatus)

      if (statusModal.isMultiple) {
        const statusPromises = selectedOrders.map((orderId) => {
          return ordersApi.updateOrderStatus(orderId, numericStatus)
        })
        await Promise.all(statusPromises)
        setSelectedOrders([])
      } else {
        await ordersApi.updateOrderStatus(statusModal.order.id, numericStatus)
      }
      setStatusModal({ show: false, order: null, newStatus: null, isMultiple: false })
      fetchOrders()
    } catch (error) {
      console.error('Status change failed:', error)
      alert('Failed to update order status: ' + (error.response?.data?.message || error.message))
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '--/--/----'
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00'
    return `$${amount.toFixed(2)}`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'New':
        return 'bg-cyan-900/30 text-cyan-400 border border-cyan-800'
      case 'Pending':
        return 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
      case 'Processing':
        return 'bg-blue-900/30 text-blue-400 border border-blue-800'
      case 'Shipped': 
        return 'bg-purple-900/30 text-purple-400 border border-purple-800'
      case 'Delivered':
        return 'bg-green-900/30 text-green-400 border border-green-800'
      case 'Cancelled':
        return 'bg-red-900/30 text-red-400 border border-red-800'
      default:
        return 'bg-gray-700 text-gray-400 border border-gray-600'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'New':
        return '🆕'
      case 'Pending':
        return '⏳'
      case 'Processing':
        return '⚙️'
      case 'Shipped': 
        return '🚚'
      case 'Delivered':
        return '✅'
      case 'Cancelled':
        return '❌'
      default:
        return '📦'
    }
  }

  const getItemCount = (order) => {
    return order.orderItems?.length || 0
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Orders Management</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Manage customer orders and shipments
          </p>
        </div>

        <div className="flex gap-2 text-sm">
          <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            <span className="text-gray-400">Total Orders: </span>
            <span className="text-white font-semibold">{totalItems}</span>
          </div>

          <Link
            to="/admin/orders/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
            + Add Order
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Filter Orders</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
              {/* Search Keyword */}
              <input
                type="text"
                placeholder="Search order code or customer name..."
                className="w-72 bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                value={filters.keyword}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    keyword: e.target.value,
                    pageNumber: 1,
                  }))
                }
              />

              {/* Status Filter - Updated with numeric values */}
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
                <option value="">All Status</option>
                <option value="1">🆕 New</option>
                <option value="2">⏳ Pending</option>
                <option value="3">⚙️ Processing</option>
                <option value="4">🚚 Shipped</option>
                <option value="5">✅ Delivered</option>
                <option value="6">❌ Cancelled</option>
              </select>

              {/* Sort Order */}
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

              {/* Clear Filters */}
              <button
                onClick={() =>
                  setFilters({
                    keyword: '',
                    status: '',
                    year: '',
                    month: '',
                    day: '',
                    sortColumn: 'OrderDate',
                    sortOrder: 'Desc',
                    pageNumber: 1,
                    pageSize: 10,
                  })
                }
                className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="h-11 flex justify-end items-center">
              {/* Bulk Action Buttons */}
              {selectedOrders.length > 0 && (
                <div className="ml-auto flex items-center gap-3 bg-gray-900 px-3 py-2 rounded-lg border border-gray-600">
                  <span className="text-sm text-blue-400 font-medium">
                    {selectedOrders.length} selected
                  </span>

                  <div className="h-4 w-px bg-gray-600"></div>

                  {/* Status Change Buttons */}
                  {canChangeToStatus('Pending') && (
                    <button
                      onClick={() => handleBulkStatusChange('Pending')}
                      className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>⏳</span>
                      <span>Pending</span>
                    </button>
                  )}

                  {canChangeToStatus('Processing') && (
                    <button
                      onClick={() => handleBulkStatusChange('Processing')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>⚙️</span>
                      <span>Processing</span>
                    </button>
                  )}

                  {canChangeToStatus('Shipped') && (
                    <button
                      onClick={() => handleBulkStatusChange('Shipped')}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>🚚</span>
                      <span>Shipped</span>
                    </button>
                  )}

                  {canChangeToStatus('Delivered') && (
                    <button
                      onClick={() => handleBulkStatusChange('Delivered')}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>✅</span>
                      <span>Delivered</span>
                    </button>
                  )}

                  {canChangeToStatus('Cancelled') && (
                    <button
                      onClick={() => handleBulkStatusChange('Cancelled')}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>❌</span>
                      <span>Cancel</span>
                    </button>
                  )}

                  <div className="h-4 w-px bg-gray-600"></div>

                  <button
                    onClick={() => setSelectedOrders([])}
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
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg mb-2">No orders found</p>
            <p className="text-sm">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-900">
                  <tr>
                    {/* Checkbox Column */}
                    <th className="px-6 py-4 whitespace-nowrap text-left">
                      <input
                        type="checkbox"
                        checked={
                          orders.length > 0 &&
                          selectedOrders.length === orders.length
                        }
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Order Code
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Order Date
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-700">
                  {orders.map((order, i) => {
                    const itemCount = getItemCount(order)
                    
                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-gray-700/40 transition-colors ${
                          selectedOrders.includes(order.id) ? 'bg-gray-700/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => handleSelectOrder(order.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                          />
                        </td>

                        {/* Row Number */}
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                          {(filters.pageNumber - 1) * filters.pageSize + i + 1}
                        </td>

                        {/* Order Code */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="text-blue-400 hover:text-blue-300 font-medium font-mono transition-colors"
                          >
                            {order.codeOrder}
                          </Link>
                        </td>

                        {/* Customer Name */}
                        <td className="px-6 py-4 whitespace-nowrap text-white">
                          {order.name}
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                          {order.email}
                        </td>

                        {/* Phone */}
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                          {order.phone}
                        </td>

                        {/* Item Count */}
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </td>

                        {/* Total Amount */}
                        <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                          {formatCurrency(order.totalAmount)}
                        </td>

                        {/* Discount */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {order.discountAmount > 0 ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-green-400 font-medium">
                                -{formatCurrency(order.discountAmount)}
                              </span>
                              {order.discount && (
                                <span className="text-gray-500 text-xs font-mono">
                                  {order.discount.code}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>

                        {/* Status Badge - Updated with icon + text */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(order.status)}`}
                          >
                            <span className="text-base">{getStatusIcon(order.status)}</span>
                            <span>{order.status}</span>
                          </span>
                        </td>

                        {/* Order Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm font-mono">
                          {formatDate(order.orderDate)}
                        </td>

                        {/* Action Buttons */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center gap-3">
                            <Link
                              to={`/admin/orders/edit/${order.id}`}
                              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                            >
                              View
                            </Link>
                            {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                              <button
                                onClick={() =>
                                  setStatusModal({
                                    show: true,
                                    order,
                                    newStatus: null,
                                    isMultiple: false,
                                  })
                                }
                                className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
                              >
                                Update
                              </button>
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

      {/* Status Change Modal */}
      {statusModal.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-3">
                Update Order Status
              </h3>

              <div className="mb-6 space-y-4">
                <p className="text-gray-300">
                  {statusModal.isMultiple
                    ? `Update status for ${selectedOrders.length} order${selectedOrders.length === 1 ? '' : 's'}?`
                    : `Update status for order ${statusModal.order?.codeOrder}?`}
                </p>

                {!statusModal.isMultiple && statusModal.order && (
                  <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
                    <p className="text-sm text-gray-400">Current status:</p>
                    <p className="text-white font-medium mt-1 flex items-center gap-2">
                      <span className="text-lg">{getStatusIcon(statusModal.order.status)}</span>
                      <span>{statusModal.order.status}</span>
                    </p>
                  </div>
                )}

                {!statusModal.newStatus && !statusModal.isMultiple && statusModal.order && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400 mb-3">Select new status:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {/* New → Pending */}
                      {statusModal.order?.status === 'New' && (
                        <button
                          onClick={() =>
                            setStatusModal((prev) => ({ ...prev, newStatus: 'Pending' }))
                          }
                          className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors text-left flex items-center gap-2"
                        >
                          <span className="text-lg">⏳</span>
                          <span>Pending</span>
                        </button>
                      )}

                      {/* Pending → Processing or Cancelled */}
                      {statusModal.order?.status === 'Pending' && (
                        <>
                          <button
                            onClick={() =>
                              setStatusModal((prev) => ({ ...prev, newStatus: 'Processing' }))
                            }
                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-left flex items-center gap-2"
                          >
                            <span className="text-lg">⚙️</span>
                            <span>Processing</span>
                          </button>
                          <button
                            onClick={() =>
                              setStatusModal((prev) => ({ ...prev, newStatus: 'Cancelled' }))
                            }
                            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-left flex items-center gap-2"
                          >
                            <span className="text-lg">❌</span>
                            <span>Cancelled</span>
                          </button>
                        </>
                      )}

                      {/* Processing → Shipped or Cancelled */}
                      {statusModal.order?.status === 'Processing' && (
                        <>
                          <button
                            onClick={() =>
                              setStatusModal((prev) => ({ ...prev, newStatus: 'Shipped' }))
                            }
                            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-left flex items-center gap-2"
                          >
                            <span className="text-lg">🚚</span>
                            <span>Shipped</span>
                          </button>
                          <button
                            onClick={() =>
                              setStatusModal((prev) => ({ ...prev, newStatus: 'Cancelled' }))
                            }
                            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-left flex items-center gap-2"
                          >
                            <span className="text-lg">❌</span>
                            <span>Cancelled</span>
                          </button>
                        </>
                      )}

                      {/* Shipped → Delivered */}
                      {statusModal.order?.status === 'Shipped' && (
                        <button
                          onClick={() =>
                            setStatusModal((prev) => ({ ...prev, newStatus: 'Delivered' }))
                          }
                          className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-left flex items-center gap-2"
                        >
                          <span className="text-lg">✅</span>
                          <span>Delivered</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {statusModal.newStatus && (
                  <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                    <p className="text-sm text-gray-400">New status:</p>
                    <p className="text-white font-medium mt-1 flex items-center gap-2">
                      <span className="text-lg">{getStatusIcon(statusModal.newStatus)}</span>
                      <span>{statusModal.newStatus}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() =>
                    setStatusModal({ show: false, order: null, newStatus: null, isMultiple: false })
                  }
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                {(statusModal.newStatus || statusModal.isMultiple) && (
                  <button
                    onClick={handleStatusChange}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                  >
                    Update Status
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}