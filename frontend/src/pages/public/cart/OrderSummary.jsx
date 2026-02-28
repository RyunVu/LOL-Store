import { Link } from 'react-router-dom'

const FREE_SHIPPING_THRESHOLD = 50

export function OrderSummary({
  items,
  getItemPrice,
  subtotal,
  discountAmount,
  discountCode,
  total,
  step,
  onCheckout,
}) {
  const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm sticky top-20">
      <div className="px-5 py-4 border-b border-border-light dark:border-border-dark">
        <h2 className="font-bold text-text-primary-light dark:text-text-primary-dark">Order Summary</h2>
      </div>

      <div className="p-5 space-y-4 text-sm">
        {/* Line items */}
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {items.map((item) => {
            const price = getItemPrice(item)
            return (
              <div
                key={item.id}
                className="flex justify-between text-text-secondary-light dark:text-text-secondary-dark"
              >
                <span className="truncate mr-2">
                  {item.name} ×{item.quantity}
                </span>
                <span className="shrink-0 font-medium">
                  ${(price * item.quantity).toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Totals */}
        <div className="border-t border-border-light dark:border-border-dark pt-4 space-y-2">
          <div className="flex justify-between text-text-secondary-light dark:text-text-secondary-dark">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-500">
              <span>Discount ({discountCode})</span>
              <span>−${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-text-secondary-light dark:text-text-secondary-dark">
            <span>Shipping</span>
            <span className={hasFreeShipping ? 'text-green-500 font-semibold' : ''}>
              {hasFreeShipping ? 'Free 🚚' : 'Calculated at delivery'}
            </span>
          </div>
        </div>

        <div className="border-t border-border-light dark:border-border-dark pt-4 flex justify-between font-black text-base text-text-primary-light dark:text-text-primary-dark">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        {/* Free shipping nudge */}
        {step === 'cart' && !hasFreeShipping && subtotal > 0 && (
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark bg-gray-50 dark:bg-dark-800 rounded-xl px-3 py-2.5">
            Add{' '}
            <span className="font-bold text-primary-500">
              ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)}
            </span>{' '}
            more for free shipping — or proceed and shipping will be calculated at delivery.
          </p>
        )}

        {step === 'cart' && (
          <button
            onClick={onCheckout}
            disabled={items.length === 0}
            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-xl transition-colors shadow-lg shadow-primary-900/20 text-sm disabled:opacity-50"
          >
            Checkout →
          </button>
        )}

        <Link
          to="/shop"
          className="block text-center text-xs text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-500 transition-colors py-0.5"
        >
          ← Continue Shopping
        </Link>
      </div>
    </div>
  )
}