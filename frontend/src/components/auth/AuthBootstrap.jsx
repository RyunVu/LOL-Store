import { useEffect } from 'react'
import { authApi } from '@/api/auth.api'
import { setAccessToken } from '@/api/client/token'
import { useAuthStore } from '@/store/authStore'

export default function AuthBootstrap({ children }) {
  const setAuth = useAuthStore(s => s.setAuth)
  const finishInit = useAuthStore(s => s.finishInit)

  useEffect(() => {
    authApi.refreshToken()
      .then(res => {
        const data = res.result
        setAccessToken(data.token)
        setAuth({ user: data.userDto })
      })
      .catch(() => {
        finishInit()
      })
  }, [setAuth, finishInit])

  return children
}
