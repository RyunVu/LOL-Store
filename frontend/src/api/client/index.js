import axios from 'axios'
import { getAccessToken, setAccessToken, clearAccessToken } from './token'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5132/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // send refresh-token cookie
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(token)
    }
  })
  failedQueue = []
}

// read token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }

    // Prevent infinite loop
    if (originalRequest._retry) {
      return Promise.reject(error)
    }

    // If refresh itself failed → force logout
    if (originalRequest.url?.includes('/account/refreshToken')) {
      localStorage.removeItem('accessToken')
      window.location.href = '/login?session=expired'
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return apiClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await apiClient.get('/account/refreshToken')

      const newAccessToken = data?.result?.token
      if (!newAccessToken) {
        throw new Error('No access token returned')
      }

      localStorage.setItem('accessToken', newAccessToken)
      processQueue(null, newAccessToken)

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return apiClient(originalRequest)

    } catch (refreshError) {
      processQueue(refreshError, null)
      localStorage.removeItem('accessToken')
      window.location.href = '/login?session=expired'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default apiClient
