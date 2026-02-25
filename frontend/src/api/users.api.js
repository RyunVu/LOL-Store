import apiClient from './client'

export const usersApi = {
  // ─── List & Detail ───────────────────────────────────────────────────────
  getUsersByManager: async (params = {}) => {
    const { data } = await apiClient.get('/account/getUsers', { params })
    return data.result
  },

  getUserById: async (userId) => {
    if (!userId) throw new Error('User id is required')
    const { data } = await apiClient.get(`/account/${userId}`)
    return data.result
  },

  // ─── Edit ─────────────────────────────────────────────────────────────────
  updateUser: async (userId, userData) => {
    if (!userId) throw new Error('User id is required')
    const { data } = await apiClient.put(`/account/users/${userId}`, userData)
    return data.result
  },

  // ─── Role Management ─────────────────────────────────────────────────────
  getRoles: async () => {
    const { data } = await apiClient.get('/account/roles')
    return data.result
  },

  updateUserRoles: async (userId, rolesId) => {
    if (!userId) throw new Error('User id is required')
    const { data } = await apiClient.put('/account/updateUserRoles', { userId, rolesId })
    return data.result
  },

  // ─── Security ────────────────────────────────────────────────────────────
  banUser: async (userId, isPermanent, durationDays = null, reason = null) => {
    if (!userId) throw new Error('User id is required')
    const { data } = await apiClient.put('/account/ban', {
      userId,
      isPermanent,
      durationDays,
      banReason: reason,   
    })
    return data.result
  },

  unbanUser: async (userId) => {
    if (!userId) throw new Error('User id is required')
    const { data } = await apiClient.put(`/account/unban/${userId}`)
    return data.result
  },

  resetPassword: async (userId, newPassword) => {
    if (!userId) throw new Error('User id is required')
    const { data } = await apiClient.put(`/account/users/${userId}/resetPassword`, { newPassword })
    return data.result
  },

  forceLogout: async (userId) => {
    if (!userId) throw new Error('User id is required')
    const { data } = await apiClient.delete(`/account/users/${userId}/sessions`)
    return data.result
  },

  // ─── Activity ────────────────────────────────────────────────────────────
  getUserOrders: async (userId, params = {}) => {
    if (!userId) throw new Error('User id is required')
    const { data } = await apiClient.get(`/account/users/${userId}/orders`, { params })
    return data.result
  },

  // ─── Delete ───────────────────────────────────────────────────────────────
  softDeleteUser: async (userId) => {
    if (!userId) throw new Error('User id is required')
    const { data } = await apiClient.delete(`/account/users/${userId}/soft`)
    return data.result
  },
}