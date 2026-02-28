import { useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import CartIcon from '@/components/cart/CartIcon'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
]

const PROFILE_MENU = [
  { to: '/profile',              label: 'Profile',         icon: '👤' },
  { to: '/profile?tab=orders',   label: 'My Orders',       icon: '📦' },
  { to: '/profile?tab=password', label: 'Change Password', icon: '🔑' },
]

export default function Header() {
  const navigate     = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()

  const [dropOpen,   setDropOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on resize
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMobileOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const handleLogout = () => {
    logout()
    setDropOpen(false)
    setMobileOpen(false)
    navigate('/')
  }

  const avatarLetter =
    user?.name?.[0]?.toUpperCase() ??
    user?.userName?.[0]?.toUpperCase() ??
    '?'

  const isAdminOrManager = user?.roles?.some(
    (r) => r.name === 'Admin' || r.name === 'Manager'
  )

  return (
    <header className="bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ────────────────────────────────────────────── */}
          <Link
            to="/"
            className="text-2xl font-black text-gold-500 hover:text-gold-400 transition-colors tracking-tight shrink-0"
          >
            LoL Store
          </Link>

          {/* ── Desktop Nav ─────────────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="px-3 py-2 rounded-lg text-sm font-medium
                  text-gray-700 dark:text-gray-200
                  hover:text-gold-500 dark:hover:text-gold-400
                  hover:bg-gray-100 dark:hover:bg-dark-800
                  transition-all"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* ── Right Side ──────────────────────────────────────── */}
          <div className="flex items-center gap-1.5">

            {/* Cart icon with mini-cart dropdown */}
            <CartIcon />

            {/* Guest: Login / Register */}
            {!isAuthenticated && (
              <div className="hidden md:flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-3 py-2 text-sm font-medium
                    text-gray-700 dark:text-gray-200
                    hover:text-gold-500 dark:hover:text-gold-400
                    rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800
                    transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold
                    bg-gold-500 hover:bg-gold-400
                    text-dark-900 rounded-lg transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Authenticated: Avatar Dropdown */}
            {isAuthenticated && (
              <div className="relative hidden md:block" ref={dropRef}>
                <button
                  onClick={() => setDropOpen((p) => !p)}
                  aria-expanded={dropOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl
                    hover:bg-gray-100 dark:hover:bg-dark-800 transition-all"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary-500 to-gold-500
                    flex items-center justify-center
                    text-sm font-black text-white shadow-sm shrink-0">
                    {avatarLetter}
                  </div>

                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-25 truncate">
                    {user?.name ?? user?.userName}
                  </span>

                  {/* Chevron */}
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {dropOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56
                    bg-white dark:bg-dark-900
                    border border-gray-200 dark:border-dark-700
                    rounded-2xl shadow-2xl shadow-black/15
                    z-50 overflow-hidden">

                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-700">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {user?.name ?? user?.userName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {user?.email}
                      </p>
                    </div>

                    {/* Menu items */}
                    <nav className="py-1">
                      {PROFILE_MENU.map(({ to, label, icon }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm
                            text-gray-700 dark:text-gray-200
                            hover:bg-gray-50 dark:hover:bg-dark-800
                            hover:text-primary-600 dark:hover:text-primary-400
                            transition-colors"
                        >
                          <span className="text-base">{icon}</span>
                          {label}
                        </Link>
                      ))}
                    </nav>

                    {/* Admin link */}
                    {isAdminOrManager && (
                      <div className="py-1 border-t border-gray-100 dark:border-dark-700">
                        <Link
                          to="/admin"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm
                            text-purple-600 dark:text-purple-400
                            hover:bg-purple-50 dark:hover:bg-purple-900/20
                            transition-colors"
                        >
                          <span className="text-base">⚙️</span>
                          Admin Panel
                        </Link>
                      </div>
                    )}

                    {/* Logout */}
                    <div className="py-1 border-t border-gray-100 dark:border-dark-700">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                          text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                          transition-colors"
                      >
                        <span className="text-base">🚪</span>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Mobile Hamburger ──────────────────────────────── */}
            <button
              onClick={() => setMobileOpen((p) => !p)}
              aria-label="Toggle menu"
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl
                text-gray-700 dark:text-gray-200
                hover:bg-gray-100 dark:hover:bg-dark-800
                transition-all"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ───────────────────────────────────────── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-dark-700 py-3 space-y-0.5">

            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium
                  text-gray-700 dark:text-gray-200
                  hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
              >
                {label}
              </Link>
            ))}

            <div className="pt-2 border-t border-gray-100 dark:border-dark-700 mt-2 space-y-0.5">
              {!isAuthenticated ? (
                <div className="flex gap-2 p-1">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center py-2.5 text-sm font-medium
                      text-gray-700 dark:text-gray-200
                      border border-gray-200 dark:border-dark-600
                      rounded-xl hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center py-2.5 text-sm font-bold
                      bg-gold-500 hover:bg-gold-400 text-dark-900 rounded-xl transition-colors"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <>
                  {/* Mobile user info */}
                  <div className="flex items-center gap-3 px-3 py-2 mb-1">
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary-500 to-gold-500
                      flex items-center justify-center text-sm font-black text-white shrink-0">
                      {avatarLetter}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {user?.name ?? user?.userName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </div>
                  </div>

                  {PROFILE_MENU.map(({ to, label, icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                        text-gray-700 dark:text-gray-200
                        hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                    >
                      <span>{icon}</span>{label}
                    </Link>
                  ))}

                  {isAdminOrManager && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                        text-purple-600 dark:text-purple-400
                        hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                    >
                      <span>⚙️</span>Admin Panel
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                      text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <span>🚪</span>Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}