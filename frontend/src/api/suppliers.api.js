import apiClient from './client'

export const suppliersApi = {
  getSuppliers: async (params = {}) => {
    const { data } = await apiClient.get('/suppliers', { params })
    return data.result
  },

  createSupplier: async (supplierData) => {
    const { data } = await apiClient.post('/suppliers', supplierData)
    return data.result
  },

  updateSupplier: async (supplierId, supplierData) => {
    if (!supplierId) throw new Error('Supplier id is required')
    const { data } = await apiClient.put(
      `/suppliers/${supplierId}`,
      supplierData
    )
    return data.result
  },

  toggleDelete: async (supplierId) => {
    if (!supplierId) throw new Error('Supplier id is required')
    const { data } = await apiClient.delete(
      `/suppliers/toggleDelete/${supplierId}`
    )
    return data.result
  },
}
