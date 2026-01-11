import apiClient from './client'

export const getProducts = async (params) => {
  const res = await apiClient.get('/products', { params })

  const data = res.data
  
  if (Array.isArray(data?.result?.items)) {
    console.log('Products array:', data.result.items)
    return data.result.items
  }

  return []
}