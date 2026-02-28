import { Link } from 'react-router-dom'

export function OrderSuccess({ placedOrder }) {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full py-20">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center text-5xl">
          ✓
        </div>
        <h1 className="text-3xl font-black text-text-primary-light dark:text-text-primary-dark mb-2">
          Order Placed!
        </h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark">
          Thank you for your purchase.
        </p>
        {placedOrder?.codeOrder && (
          <div className="inline-block mt-5 mb-8 px-6 py-3 bg-gray-100 dark:bg-dark-800 rounded-2xl">
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1 uppercase tracking-wider">
              Order Code
            </p>
            <p className="font-mono font-black text-primary-500 text-2xl">
              {placedOrder.codeOrder}
            </p>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <Link
            to="/profile?tab=orders"
            className="px-5 py-2.5 border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark rounded-xl font-medium text-sm hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            My Orders
          </Link>
          <Link
            to="/shop"
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-primary-900/20"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}