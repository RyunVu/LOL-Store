import apiClient from './client'

export const discountsApi = {
  getDiscounts: async (params = {}) => {
    const { data } = await apiClient.get('/discounts', { params })
    return data.result
  },

  getDiscountsByManager: async (params = {}) => {
    const { data } = await apiClient.get('/discounts/byManager', { params })
    return data.result
  },

  getDiscountById: async (id) => {
    if (!id) throw new Error('Discount id is required')
    const { data } = await apiClient.get(`/discounts/${id}`)
    return data.result
  },

  getDiscountByCode: async (code) => {
    if (!code) throw new Error('Discount code is required')
    const { data } = await apiClient.get(`/discounts/byCode/${code}`)
    return data.result
  },

  createDiscount: async (discountData) => {
    const { data } = await apiClient.post('/discounts', discountData)
    return data.result
  },

  updateDiscount: async (id, discountData) => {
    if (!id) throw new Error('Discount id is required')
    const { data } = await apiClient.put(`/discounts/${id}`, discountData)
    return data.result
  },

  toggleActive: async (id) => {
    if (!id) throw new Error('Discount id is required')
    const { data } = await apiClient.put(`/discounts/toggleShowOnMenu/${id}`)
    return data.result
  },

  validateDiscount: async (discountData) => {
    const { data } = await apiClient.post('/validateDiscount', discountData)
    return data.result
  },

  toggleSoftDeleteDiscount: async (id) => {
    if (!id) throw new Error('Discount id is required')
    await apiClient.delete(`/discounts/toggleDelete/${id}`)
  },

  deleteDiscountPermanently: async (id) => {
    if (!id) throw new Error('Discount id is required')
    await apiClient.delete(`/discounts/${id}`)
  },
}
