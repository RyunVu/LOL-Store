import axios from 'axios'
import { getAccessToken, setAccessToken, clearAccessToken } from './token'
import refreshClient from './refreshClient'

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
    error ? promise.reject(error) : promise.resolve(token)
  })
  failedQueue = []
}

// --------------------
// REQUEST INTERCEPTOR
// --------------------
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// --------------------
// RESPONSE INTERCEPTOR
// --------------------
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }

    // Prevent infinite retry
    if (originalRequest._retry) {
      return Promise.reject(error)
    }

    // Refresh failed → force logout
    if (originalRequest.url?.includes('/account/refreshToken')) {
      clearAccessToken()
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
      // 🔥 IMPORTANT: use refreshClient (NO Authorization header)
      const { data } = await refreshClient.get('/account/refreshToken')

      const newAccessToken = data?.result?.token
      if (!newAccessToken) {
        throw new Error('No access token returned')
      }

      setAccessToken(newAccessToken)
      processQueue(null, newAccessToken)

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return apiClient(originalRequest)

    } catch (refreshError) {
      processQueue(refreshError, null)
      clearAccessToken()
      window.location.href = '/login?session=expired'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default apiClient
