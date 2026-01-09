import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-dark-900 text-gray-400 border-t border-dark-700">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-gold-500 mb-3">
              LoL Store
            </h3>
            <p className="text-sm leading-relaxed">
              Premium League of Legends items, skins, and collectibles.
              Built for fans, by fans.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-gold-500 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-gold-500 transition">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-gold-500 transition">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">
              Account
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/login" className="hover:text-gold-500 transition">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-gold-500 transition">
                  Register
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-gold-500 transition">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">
              Contact
            </h4>
            <ul className="space-y-2 text-sm">
              <li>Email: support@lolstore.com</li>
              <li>Hotline: +84 123 456 789</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-dark-700 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <span>
            © {year} LoL Store. All rights reserved.
          </span>

          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-gold-500 transition">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-gold-500 transition">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
