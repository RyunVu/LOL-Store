import { createBrowserRouter } from 'react-router-dom'
import { lazy } from 'react'

import RootLayout from '@/layouts/RootLayout'
import DefaultLayout from '@/layouts/DefaultLayout'
import AdminLayout from '@/layouts/AdminLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import SuspenseWrapper from '@/components/common/SuspenseWrapper'

// =====================
// Public pages
// =====================
const HomePage = lazy(() => import('@/pages/public/HomePage'))

// =====================
// Auth pages
// =====================
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))

// =====================
// Admin pages
// =====================
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'))

// Products
const ProductsManagePage = lazy(() =>
  import('@/pages/admin/products/ProductManagePage')
)
const ProductCreatePage = lazy(() =>
  import('@/pages/admin/products/ProductCreatePage')
)
const ProductEditPage = lazy(() =>
  import('@/pages/admin/products/ProductEditPage')
)

// Categories
const CategoryPage = lazy(() => import('@/pages/admin/CategoryPage'))


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

      // Admin routes
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
                <DashboardPage />
              </SuspenseWrapper>
            ),
          },

          // Products
          {
            path: 'products',
            element: (
              <SuspenseWrapper>
                <ProductsManagePage />
              </SuspenseWrapper>
            ),
          },
         {
            path: 'products/create',
            element: (
              <SuspenseWrapper>
                <ProductCreatePage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'products/edit/:id',
            element: (
              <SuspenseWrapper>
                <ProductEditPage />
              </SuspenseWrapper>
            ),
          },

          // Categories
          {
            path: 'categories',
            element: (
              <SuspenseWrapper>
                <CategoryPage />
              </SuspenseWrapper>
            ),
          },
        ],
      },
    ],
  },
])
