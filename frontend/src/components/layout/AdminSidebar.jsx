import { Link, useLocation } from 'react-router-dom'

export default function AdminSidebar() {
  const location = useLocation()

  const menuItems = [
    { path: '/admin', label: 'Dashboard'},
    { path: '/admin/products', label: 'Products'},
    { path: '/admin/categories', label: 'Categories'},
    { path: '/admin/orders', label: 'Orders'},
    { path: '/admin/discounts', label: 'Discounts'},
    { path: '/admin/suppliers', label: 'Suppliers'},
    { path: '/admin/users', label: 'Users'},
  ]

  return (
    <aside className="w-64 bg-dark-900 text-white">
      <div className="p-6">
        <Link to="/" className="text-2xl font-bold text-gold-500">
          LoL Store
        </Link>
        <p className="text-sm text-gray-400 mt-1">Admin Panel</p>
      </div>

      <nav className="mt-6">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-6 py-3 transition ${
              location.pathname === item.path
                ? 'bg-primary-600 text-white'
                : 'text-gray-300 hover:bg-dark-800'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}