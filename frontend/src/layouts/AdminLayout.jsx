import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import './AdminLayout.css'
import ScrollToTop from '../components/common/ScrollToTop'

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [sidebarHidden, setSidebarHidden] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setSidebarHidden(window.innerWidth <= 576)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.notification') && !e.target.closest('.profile')) {
        setShowNotifications(false)
        setShowProfile(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Dark mode
  useEffect(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved) setDarkMode(saved === 'true')
  }, [])

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: 'bxs-dashboard' },
    { path: '/admin/products', label: 'Products', icon: 'bxs-shopping-bag-alt' },
    { path: '/admin/categories', label: 'Categories', icon: 'bxs-category' },
    { path: '/admin/orders', label: 'Orders', icon: 'bxs-cart' },
    { path: '/admin/discounts', label: 'Discounts', icon: 'bxs-offer' },
    { path: '/admin/users', label: 'Users', icon: 'bxs-group' },
  ]

  const bottomMenuItems = [
    { path: '/admin/settings', label: 'Settings', icon: 'bxs-cog' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => {
  const current = location.pathname

  if (path === '/admin') {
    return current === '/admin'
  }

  return current === path || current.startsWith(path + '/')
}

  return (
    <div>
      {/* SIDEBAR */}
      <section id="sidebar" className={sidebarHidden ? 'hide' : ''}>
        <Link to="/admin" className="brand">
          <i className="bx bxs-store-alt"></i>
          <span className="text">LoL Store</span>
        </Link>

        <ul className="side-menu top">
          {menuItems.map((item) => (
              <li
                key={item.path}
                className={isActive(item.path) ? 'active' : ''}
              >
              <Link 
                to={item.path} 
                data-tooltip={sidebarHidden ? item.label : undefined}
              >
                <i className={`bx ${item.icon}`}></i>
                <span className="text">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <ul className="side-menu bottom">
          {bottomMenuItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path}
                data-tooltip={sidebarHidden ? item.label : undefined}
              >
                <i className={`bx ${item.icon}`}></i>
                <span className="text">{item.label}</span>
              </Link>
            </li>
          ))}
          <li>
            <a 
              href="#" 
              className="logout" 
              onClick={(e) => {
                e.preventDefault()
                handleLogout()
              }}
              data-tooltip={sidebarHidden ? "Logout" : undefined}
            >
              <i className="bx bx-power-off"></i>
              <span className="text">Logout</span>
            </a>
          </li>
        </ul>
      </section>

      {/* CONTENT */}
      <section id="content">
        {/* NAVBAR */}
        <nav>
          <i
            className="bx bx-menu"
            onClick={() => setSidebarHidden(!sidebarHidden)}
            title={sidebarHidden ? "Expand Sidebar" : "Collapse Sidebar"}
          ></i>

          <Link to="/" className="nav-link flex items-center gap-2">
            <i className="bx bx-store"></i>
            <span>View Store</span>
          </Link>

          {/* RIGHT SIDE */}
          <div className="nav-right">
            {/* Dark mode */}
            <input
              type="checkbox"
              id="switch-mode"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
              hidden
            />
            <label className="switch-lm" htmlFor="switch-mode" title="Toggle Dark Mode">
              <i className="bx bxs-moon"></i>
              <i className="bx bx-sun"></i>
              <span className="ball"></span>
            </label>

            {/* Notification */}
            <a
              href="#"
              className="notification"
              onClick={(e) => {
                e.preventDefault()
                setShowNotifications(!showNotifications)
                setShowProfile(false)
              }}
              title="Notifications"
            >
              <i className="bx bxs-bell"></i>
              <span className="num">3</span>
            </a>

            {/* Profile */}
            <a
              href="#"
              className="profile"
              onClick={(e) => {
                e.preventDefault()
                setShowProfile(!showProfile)
                setShowNotifications(false)
              }}
              title="Profile Menu"
            >
              <div className="profile-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </a>
          </div>

          {/* DROPDOWNS */}
          <div className={`notification-menu ${showNotifications ? 'show' : ''}`}>
            <ul>
              <li>New order received</li>
              <li>Low stock warning</li>
              <li>New user registered</li>
              <li>System update available</li>
              <li>Payment processed successfully</li>
            </ul>
          </div>

          <div className={`profile-menu ${showProfile ? 'show' : ''}`}>
            <ul>
              <li>{user?.name || 'Admin'}</li>
              <li onClick={() => navigate('/admin/settings')}>
                <i className="bx bxs-cog"></i> Settings
              </li>
              <li onClick={() => navigate('/admin/profile')}>
                <i className="bx bxs-user"></i> Profile
              </li>
              <li onClick={handleLogout}>
                <i className="bx bx-power-off"></i> Logout
              </li>
            </ul>
          </div>
        </nav>

        {/* MAIN */}
        <main>
          <ScrollToTop />
          <Outlet />
        </main>
      </section>
    </div>
  )
}