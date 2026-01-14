import { createBrowserRouter } from 'react-router-dom'
import { lazy } from 'react'
import RootLayout from '../layouts/RootLayout'
import DefaultLayout from '@/layouts/DefaultLayout'
import SuspenseWrapper from '@/components/common/SuspenseWrapper'
import AdminLayout from '../layouts/AdminLayout'
import ProtectedRoute from '../components/auth/ProtectedRoute'

// Public pages
const HomePage = lazy(() => import('@/pages/public/HomePage'))

// Auth pages
const LoginPage = lazy(() => import('@/pages/admin/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/admin/RegisterPage'))

// Admin pages
const AdminPage = lazy(() => import('@/pages/admin/AdminPage'))
const ProductsPage = lazy(() => import('@/pages/admin/ProductsPage'))
const CategorysPage = lazy(() => import('@/pages/admin/CategorysPage'))

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <DefaultLayout />,
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <HomePage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'login',
            element: (
              <SuspenseWrapper>
                <LoginPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'register',
            element: (
              <SuspenseWrapper>
                <RegisterPage />
              </SuspenseWrapper>
            ),
          },
        ],
      },
      {
        path: '/admin',
        element: (
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <AdminPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'products',
            element: (
              <SuspenseWrapper>
                <ProductsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'categories',
            element: (
              <SuspenseWrapper>
                <CategorysPage />
              </SuspenseWrapper>
            ),
          },
        ],
      },
    ],
  },
])