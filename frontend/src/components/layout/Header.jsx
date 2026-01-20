import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/store/cartStore'

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth()
  const itemCount = useCartStore((state) => state.getItemCount())

  return (
    <header className="bg-dark-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-gold-500 hover:text-gold-400 transition">
            LoL Store
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="hover:text-gold-500 transition">
              Home
            </Link>
            <Link to="/shop" className="hover:text-gold-500 transition">
              Shop
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <button className="relative hover:text-gold-500 transition">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold-500 text-dark-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Auth buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm">Hi, {user?.name || user?.email || 'User'}</span>
                <button
                  onClick={logout}
                  className="text-sm hover:text-gold-500 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm hover:text-gold-500 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-gold-500 text-dark-900 px-4 py-2 rounded hover:bg-gold-600 transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}