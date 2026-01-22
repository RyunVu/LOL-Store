import { Outlet } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-primary-900 to-dark-900">
        <Outlet />
        <Footer />
    </div>
  )
}
