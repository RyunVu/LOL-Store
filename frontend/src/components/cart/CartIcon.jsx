import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '@/stores/useCartStore'

export default function CartIcon() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const leaveTimer = useRef(null)

  const items      = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const getItemCount = useCartStore((s) => s.getItemCount)
  const getSubtotal  = useCartStore((s) => s.getSubtotal)
  const getItemPrice = useCartStore((s) => s.getItemPrice)

  const count    = getItemCount()
  const subtotal = getSubtotal()

  const onEnter = () => {
    clearTimeout(leaveTimer.current)
    setOpen(true)
  }
  const onLeave = () => {
    leaveTimer.current = setTimeout(() => setOpen(false), 150)
  }

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>

      {/* ── Trigger Button ── */}
      <button
        onClick={() => navigate('/cart')}
        aria-label={`Cart, ${count} items`}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl
          text-gray-600 dark:text-gray-300
          hover:text-gold-500 dark:hover:text-gold-400
          hover:bg-gray-100 dark:hover:bg-dark-800
          transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>

        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1
            bg-gold-500 text-dark-900 text-[10px] font-black
            rounded-full flex items-center justify-center leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          className="absolute right-0 top-full mt-2 w-80
            bg-white dark:bg-dark-900
            border border-gray-200 dark:border-dark-700
            rounded-2xl shadow-2xl shadow-black/20
            z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              Cart{count > 0 ? ` (${count})` : ''}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Empty state */}
          {items.length === 0 && (
            <div className="px-4 py-8 text-center">
              <div className="text-4xl mb-3">🛒</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Your cart is empty</p>
              <Link
                to="/shop"
                onClick={() => setOpen(false)}
                className="text-sm text-primary-500 hover:text-primary-400 font-semibold"
              >
                Browse Shop →
              </Link>
            </div>
          )}

          {/* Item list */}
          {items.length > 0 && (
            <>
              <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-dark-700/60">
                {items.map((item) => {
                  const price = getItemPrice(item)
                  const img   = item.pictures?.find((p) => p.isActive)?.path
                             ?? item.pictures?.[0]?.path
                             ?? null

                  return (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3
                      hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors group">

                      {/* Image */}
                      <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-700">
                        {img
                          ? <img src={img} alt={item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-lg">🎮</div>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {item.quantity} × <span className="font-semibold">${price.toFixed(2)}</span>
                        </p>
                        <p className="text-xs font-bold text-primary-500 mt-0.5">
                          ${(price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label="Remove"
                        className="w-6 h-6 flex items-center justify-center text-lg leading-none
                          text-gray-300 dark:text-gray-600 hover:text-red-400
                          opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      >
                        ×
                      </button>
                    </li>
                  )
                })}
              </ul>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-800/60">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Subtotal</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <Link
                  to="/cart"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center py-2.5
                    bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold
                    rounded-xl transition-colors"
                >
                  Go to Cart →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}