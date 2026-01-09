import { createBrowserRouter } from 'react-router-dom'
import { lazy } from 'react'
import DefaultLayout from '@/layouts/DefaultLayout'
import SuspenseWrapper from '@/components/common/SuspenseWrapper'

// Lazy load pages
const HomePage = lazy(() => import('@/pages/public/HomePage'))

export const router = createBrowserRouter([
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
    ],
  },
])
