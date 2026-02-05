import apiClient from './client'

export const categoriesApi = {
  getCategories: async (params = {}) => {
    const { data } = await apiClient.get('/categories', { params })
    return data.result
  },

  getCategoriesByManager: async (params = {}) => {
    const { data } = await apiClient.get('/categories/byManager', { params })
    return data.result
  },

  getCategoryBySlug: async (slug) => {
    if (!slug) throw new Error('Category slug is required')
    const { data } = await apiClient.get(`/categories/slug/${slug}`)
    return data.result
  },

  getCategoryById: async (id) => {
    if (!id) throw new Error('Category id is required')
    const { data } = await apiClient.get(`/categories/${id}`)
    return data.result
  },

  getRelatedCategories: async (params = {}) => {
    const { data } = await apiClient.get('/categories/RelatedCategories', {
      params,
    })
    return data.result
  },

  createCategory: async (categoryData) => {
    const { data } = await apiClient.post('/categories', categoryData)
    // backend returns Guid
    return data.result
  },

  updateCategory: async (id, categoryData) => {
    if (!id) throw new Error('Category id is required')
    await apiClient.put(`/categories/${id}`, categoryData)
    // no return value
  },

  toggleActive: async (id) => {
    if (!id) throw new Error('Category id is required')
    await apiClient.put(`/categories/toggleShowOnMenu/${id}`)
  },

  toggleSoftDeleteCategory: async (id) => {
    if (!id) throw new Error('Category id is required')
    await apiClient.delete(`/categories/SoftDeleteToggle/${id}`)
  },

  deleteCategoryPermanently: async (id) => {
    if (!id) throw new Error('Category id is required')
    await apiClient.delete(`/categories/${id}`)
  },
}
