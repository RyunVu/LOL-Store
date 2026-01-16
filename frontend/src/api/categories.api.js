import apiClient from './client'

export const categoriesApi = {
  // Get all categories
  getCategories: async () => {
    const response = await apiClient.get('/categories')
    return response.data
  },

  // Get category by slug
  getCategoryBySlug: async (slug) => {
    const response = await apiClient.get(`/categories/slug/${slug}`)
    return response.data
  },

  // Get category by ID
  getCategoryById: async (id) => {
    const response = await apiClient.get(`/categories/${id}`)
    return response.data
  },
}