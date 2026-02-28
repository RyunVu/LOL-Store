import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isInitializing, user } = useAuthStore()

  if (isInitializing) {
    return null 
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin) {
    const isAdmin = user?.roles?.some(r => r.name === 'Admin')
    if (!isAdmin) {
      return <Navigate to="/" replace />
    }
  }

  return children
}
