import apiClient from './client'

export const ordersApi = {

  getOrders: async (params = {}) => {
    const { data } = await apiClient.get('/orders', { params })
    return data.result
  },

  updateOrderStatus: async (orderId, newStatus) => {
    if (!orderId) throw new Error('Order id is required')
    if (!newStatus) throw new Error('New status is required')

    const { data } = await apiClient.put(
      `/orders/${orderId}/status`,
      null,
      { params: { newStatus } }
    )

    return data.result
  },

  getOrdersByUser: async (params = {}) => {
    const { data } = await apiClient.get('/orders/byUser', { params })
    return data.result
  },

  getOrderById: async (orderId) => {
    if (!orderId) throw new Error('Order id is required')

    const { data } = await apiClient.get(`/orders/${orderId}`)
    return data.result
  },

  getOrderByCode: async (orderCode) => {
    if (!orderCode) throw new Error('Order code is required')

    const { data } = await apiClient.get(`/orders/code/${orderCode}`)
    return data.result
  },

  checkout: async (orderData) => {
    if (!orderData) throw new Error('Order data is required')

    const { data } = await apiClient.post('/orders/checkout', orderData)
    return data.result
  },

  cancelOrder: async (orderId) => {
    if (!orderId) throw new Error('Order id is required')

    const { data } = await apiClient.delete(`/orders/${orderId}/cancel`)
    return data.result
  },
}
