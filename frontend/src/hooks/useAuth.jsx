import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth.api'
import { setAccessToken, clearAccessToken } from '@/api/client/token'

export function useAuth() {
  const navigate = useNavigate()
  const { setAuth, logout: clearAuth, isAdmin, user, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = async (credentials) => {
    try {
      setLoading(true)
      setError(null)

      const res = await authApi.login(credentials)
      const data = res.result

      setAccessToken(data.token)
      setAuth({ user: data.userDto })

      navigate(
        data.userDto.roles?.some(r => r.name === 'Admin')
          ? '/admin'
          : '/'
      )

      return { success: true }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        'Login failed'

      setError(message)
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  const register = async (payload) => {
    setLoading(true)
    try {
      await authApi.register(payload)
      return await login({
        identifier: payload.userName,
        password: payload.password,
      })
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      clearAccessToken()
      clearAuth()
      navigate('/login')
    }
  }

  return {
    user,
    isAuthenticated,
    isAdmin: isAdmin(),
    loading,
    error,
    login,
    register,
    logout,
    setError,
  }
}
