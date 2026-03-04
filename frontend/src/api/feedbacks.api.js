import apiClient from './client'

export const feedbacksApi = {
  // ===========================
  // Public
  // ===========================
  getFeedbacksByProduct: async (productId, params = {}) => {
    if (!productId) throw new Error('Product id is required')
    const { data } = await apiClient.get(`/feedbacks/product/${productId}`, { params })
    return data.result
  },

  createFeedback: async (feedbackData) => {
    const { data } = await apiClient.post('/feedbacks', feedbackData)
    return data.result
  },

  // Upload images first, get back URLs, then pass into createFeedback
  uploadFeedbackPictures: async (files = []) => {
    if (!files.length) return []

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    const { data } = await apiClient.post('/feedbacks/upload-pictures', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    return data.result // string[] of relative URLs
  },

  reportFeedback: async (feedbackId, reportData) => {
    if (!feedbackId) throw new Error('Feedback id is required')
    const { data } = await apiClient.post(`/feedbacks/${feedbackId}/report`, reportData)
    return data.result
  },

  // ===========================
  // Admin - Feedbacks
  // ===========================
  getFeedbacksForAdmin: async (params = {}) => {
    const { data } = await apiClient.get('/feedbacks/admin', { params })
    return data.result
  },

  toggleHideFeedback: async (id) => {
    if (!id) throw new Error('Feedback id is required')
    await apiClient.put(`/feedbacks/${id}/toggle-hide`)
  },

  deleteFeedback: async (id) => {
    if (!id) throw new Error('Feedback id is required')
    await apiClient.delete(`/feedbacks/${id}`)
  },

  // ===========================
  // Admin - Reports
  // ===========================
  getReports: async (params = {}) => {
    const { data } = await apiClient.get('/feedbacks/reports', { params })
    return data.result
  },

  reviewReport: async (reportId, reviewData) => {
    if (!reportId) throw new Error('Report id is required')
    const { data } = await apiClient.put(`/feedbacks/reports/${reportId}/review`, reviewData)
    return data.result
  },
}