import { createBrowserRouter } from 'react-router-dom'
import { lazy } from 'react'

import RootLayout from '@/layouts/RootLayout'
import DefaultLayout from '@/layouts/DefaultLayout'
import AdminLayout from '@/layouts/AdminLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import SuspenseWrapper from '@/components/common/SuspenseWrapper'
import DiscountsManagePage from '../pages/admin/discounts/DiscountManagePage'

// =====================
// Public pages
// =====================
const HomePage = lazy(() => import('@/pages/public/HomePage'))
const ShopPage = lazy(() => import('@/pages/public/ShopPage'))

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
const ProductsManagePage = lazy(() => import('@/pages/admin/products/ProductManagePage')
)
const ProductCreatePage = lazy(() => import('@/pages/admin/products/ProductCreatePage')
)
const ProductEditPage = lazy(() => import('@/pages/admin/products/ProductEditPage')
)

// Categories
const CategoryPage = lazy(() => import('@/pages/admin/categories/CategoryPage'))
const CategoryCreatePage = lazy(() => import('@/pages/admin/categories/CategoryCreatePage'))
const CategoryEditPage = lazy(() => import('@/pages/admin/categories/CategoryEditPage'))

// Discounts
const DiscountPage = lazy(() => import('@/pages/admin/discounts/DiscountManagePage'))
const DiscountCreatePage = lazy(() => import('@/pages/admin/discounts/DiscountCreatePage'))
const DiscountEditPage = lazy(() => import('@/pages/admin/discounts/DiscountEditPage'))

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
          {
            path: 'shop',
            element: (
              <SuspenseWrapper>
                <ShopPage />
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
           {
              path: 'categories/create',
              element: (
                <SuspenseWrapper>
                  <CategoryCreatePage />
                </SuspenseWrapper>
              ),
            },
            {
              path: 'categories/edit/:id',
              element: (
                <SuspenseWrapper>
                  <CategoryEditPage />
                </SuspenseWrapper>
              ),
            },

            // Discounts
          {
            path: 'discounts',
            element: (
              <SuspenseWrapper>
                <DiscountsManagePage />
              </SuspenseWrapper>
            ),
          },
           {
              path: 'discounts/create',
              element: (
                <SuspenseWrapper>
                  <DiscountCreatePage />
                </SuspenseWrapper>
              ),
            },
            {
              path: 'discounts/edit/:id',
              element: (
                <SuspenseWrapper>
                  <DiscountEditPage />
                </SuspenseWrapper>
              ),
            },
        ],
      },
    ],
  },
])
