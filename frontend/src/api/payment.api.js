import apiClient from './client'

export const paymentApi = {
  createVnpayUrl: async (orderId) => {
    const { data } = await apiClient.post(`/payment/create/${orderId}`)
    return data.result.paymentUrl
  }
}