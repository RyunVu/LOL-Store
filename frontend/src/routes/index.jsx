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
const ShopPage = lazy(() => import('@/pages/public/ShopPage'))
const ProfilePage = lazy(() => import('@/pages/public/profile/ProfilePage'))
const CartPage = lazy(() => import('@/pages/public/cart/CartPage'))
const UserOrderDetailPage = lazy(() => import('@/pages/public/profile/UserOrderDetailPage'))

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
const ProductsManagePage = lazy(() => import('@/pages/admin/products/ProductManagePage'))
const ProductCreatePage = lazy(() => import('@/pages/admin/products/ProductCreatePage'))
const ProductEditPage = lazy(() => import('@/pages/admin/products/ProductEditPage'))

const ProductDetailPage = lazy(() => import('@/pages/public/ProductDetail'))

// Categories
const CategoryPage = lazy(() => import('@/pages/admin/categories/CategoryManagePage'))
const CategoryCreatePage = lazy(() => import('@/pages/admin/categories/CategoryCreatePage'))
const CategoryEditPage = lazy(() => import('@/pages/admin/categories/CategoryEditPage'))

// Discounts
const DiscountPage = lazy(() => import('@/pages/admin/discounts/DiscountManagePage'))
const DiscountCreatePage = lazy(() => import('@/pages/admin/discounts/DiscountCreatePage'))
const DiscountEditPage = lazy(() => import('@/pages/admin/discounts/DiscountEditPage'))

// Orders
const OrderPage = lazy(() => import('@/pages/admin/orders/OrderManagePage'))
const OrderCreatePage = lazy(() => import('@/pages/admin/orders/OrderCreatePage'))
const OrderEditPage = lazy(() => import('@/pages/admin/orders/OrderEditPage'))

// Users
const UserPage = lazy(() => import('@/pages/admin/users/UserManagePage'))
const UserDetailPage = lazy(() => import('@/pages/admin/users/UserDetailPage'))
const UserEditPage = lazy(() => import('@/pages/admin/users/UserEditPage'))

// Feedbacks
const FeedbackManagePage = lazy(() => import('@/pages/admin/feedbacks/FeedbackManagePage'))
const FeedbackReportsPage = lazy(() => import('@/pages/admin/feedbacks/FeedbackReportsPage'))

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
          {
            path: '/product/:id',
            element: (
              <SuspenseWrapper>
                <ProductDetailPage />
              </SuspenseWrapper>
            ),
          },
          { 
            path: 'profile', 
            element: (
              <SuspenseWrapper>
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              </SuspenseWrapper>
            ), 
          },
          { 
            path: 'cart', 
            element: (
              <SuspenseWrapper>
                  <CartPage />
              </SuspenseWrapper> 
            ),
          },
          {
            path: 'orders/:orderCode',
            element: (
              <SuspenseWrapper>
                <UserOrderDetailPage />
              </SuspenseWrapper>
            ),
          }
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
                <DiscountPage />
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

          // Orders
          {
            path: 'orders',
            element: (
              <SuspenseWrapper>
                <OrderPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'orders/create',
            element: (
              <SuspenseWrapper>
                <OrderCreatePage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'orders/edit/:id',
            element: (
              <SuspenseWrapper>
                <OrderEditPage />
              </SuspenseWrapper>
            ),
          },

          // Users
          {
            path: 'users',
            element: (
              <SuspenseWrapper>
                <UserPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'users/detail/:id',
            element: (
              <SuspenseWrapper>
                <UserDetailPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'users/edit/:id',
            element: (
              <SuspenseWrapper>
                <UserEditPage />
              </SuspenseWrapper>
            ),
          },

          // Feedbacks
          {
            path: 'feedbacks',
            element: (
              <SuspenseWrapper>
                <FeedbackManagePage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'feedbacks/reports',
            element: (
              <SuspenseWrapper>
                <FeedbackReportsPage />
              </SuspenseWrapper>
            ),
          },
        ],
      },
    ],
  },
])
