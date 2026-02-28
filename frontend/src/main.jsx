import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './routes'
import AuthBootstrap from './components/auth/AuthBootstrap.jsx'
import '@/assets/styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>
        <div className="min-h-screen font-sans antialiased">
          <RouterProvider router={router} />
        </div>
      </AuthBootstrap>
    </QueryClientProvider>
  </React.StrictMode>
)
