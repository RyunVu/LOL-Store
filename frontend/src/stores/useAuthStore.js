import { create } from 'zustand'
import { setAccessToken, clearAccessToken } from '@/api/client/token'

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  setAuth: ({ user, token }) => {
    if (token) setAccessToken(token)  
    set({
      user,
      isAuthenticated: true,
      isInitializing: false,
    })
  },

  finishInit: () => set({
    isInitializing: false,
  }),

  logout: () => {
    clearAccessToken()               
    set({
      user: null,
      isAuthenticated: false,
      isInitializing: false,
    })
  },

  isAdmin: () => get().user?.roles?.some(r => r.name === 'Admin'),
  isManager: () =>
    get().user?.roles?.some(r =>
      r.name === 'Admin' || r.name === 'Manager'
    ),
}))