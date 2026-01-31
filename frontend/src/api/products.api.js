import apiClient from './client'

export const productsApi = {
  // Public endpoint - forces IsActive=true, IsDeleted=false
  getProducts: async (params = {}) => {
    const { data } = await apiClient.get('/products', { params })
    return data.result
  },

  // Admin endpoint - can see deleted products
  getProductsByManager: async (params = {}) => {
    const { data } = await apiClient.get('/products/byManager', { params })
    return data.result
  },

  getProductById: async (id) => {
    if (!id) throw new Error('Product id is required')
    const { data } = await apiClient.get(`/products/${id}`)
    return data.result
  },

  getProductBySlug: async (slug) => {
    if (!slug) throw new Error('Product slug is required')
    const { data } = await apiClient.get(`/products/bySlug/${slug}`)
    return data.result
  },

  getTopSales: async (count = 10) => {
    const { data } = await apiClient.get(`/products/TopSales/${count}`)
    return data.result
  },

  getRelatedProducts: async (slug, count = 4) => {
    if (!slug) throw new Error('Product slug is required')
    const { data } = await apiClient.get(`/products/Related/${slug}/${count}`)
    return data.result
  },

  createProduct: async (productData) => {
    const { data } = await apiClient.post('/products', productData)
    return data.result
  },

  updateProduct: async (id, productData) => {
    if (!id) throw new Error('Product id is required')
    const { data } = await apiClient.put(`/products/${id}`, productData)
    return data.result
  },

  toggleActive: async (id) => {
    if (!id) throw new Error('Product id is required')
    await apiClient.put(`/products/toggle-active/${id}`)
  },

  toggleSoftDelete: async (id, editReason) => {
    if (!id) throw new Error('Product id is required')
    await apiClient.delete(`/products/toggleDelete/${id}`, {
      data: { editReason },
    })
  },

  deleteProductPermanently: async (id) => {
    if (!id) throw new Error('Product id is required')
    await apiClient.delete(`/products/${id}`)
  },

  uploadProductImages: async (productId, files = []) => {
    if (!productId) throw new Error('Product id is required')
    if (!files.length) return []

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    const { data } = await apiClient.post(
      `/products/${productId}/pictures`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )

    return data.result
  },

  getProductHistories: async (params = {}) => {
    const { data } = await apiClient.get('/products/histories', { params })
    return data.result
  },
}