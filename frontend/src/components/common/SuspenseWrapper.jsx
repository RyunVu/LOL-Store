import { Suspense } from 'react'
import LoadingSpinner from './LoadingSpinner'

export default function SuspenseWrapper({ children }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
}