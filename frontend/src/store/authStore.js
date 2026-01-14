import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  setAuth: ({ user }) => set({
    user,
    isAuthenticated: true,
    isInitializing: false,
  }),

  finishInit: () => set({
    isInitializing: false,
  }),

  logout: () => set({
    user: null,
    isAuthenticated: false,
    isInitializing: false,
  }),

  isAdmin: () => {
    const user = get().user
    return user?.roles?.some(r => r.name === 'Admin') || false
  },
}))
