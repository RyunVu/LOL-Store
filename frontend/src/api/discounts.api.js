import apiClient from './client'

export const discountsApi = {
  getDiscounts: async (params = {}) => {
    const { data } = await apiClient.get('/discounts', { params })
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

  createDiscount: async (payload) => {
    const { data } = await apiClient.post('/discounts', payload)
    return data.result
  },

  updateDiscount: async (id, payload) => {
    const { data } = await apiClient.put(`/discounts/${id}`, payload)
    return data.result
  },

  toggleActive: async (id) => {
    const { data } = await apiClient.patch(`/discounts/${id}/toggle`)
    return data.result
  },

  validateDiscount: async (payload) => {
    const { data } = await apiClient.post('/discounts/validate', payload)
    return data.result
  },

  previewDiscount: async (payload) => {
    const { data } = await apiClient.post('/discounts/preview', payload)
    return data.result
  },
}
