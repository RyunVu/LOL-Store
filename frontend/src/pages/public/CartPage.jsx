import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/useCartStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { ordersApi } from '@/api/orders.api'

// ─── Constants ───────────────────────────────────────────────────
const STEP = { CART: 'cart', CHECKOUT: 'checkout', SUCCESS: 'success' }
const FREE_SHIPPING_THRESHOLD = 50

// ─── Small pure components ────────────────────────────────────────
function CartSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 flex gap-4">
          <div className="w-20 h-20 bg-gray-200 dark:bg-dark-700 rounded-xl shrink-0" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/4" />
            <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/3" />
          </div>
          <div className="w-24 space-y-3 pt-1">
            <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded" />
            <div className="h-8 bg-gray-200 dark:bg-dark-700 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ConfirmModal({ open, title, message, onConfirm, onCancel, danger = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-dark-700 shadow-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">{title}</h3>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 dark:border-dark-600 text-text-primary-light dark:text-text-primary-dark rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

function inputCls(hasError) {
  return [
    'w-full px-4 py-2.5 rounded-xl border text-sm transition-all',
    'bg-white dark:bg-dark-800',
    'text-text-primary-light dark:text-text-primary-dark',
    'placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark',
    'focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-400 focus:ring-red-400/30'
      : 'border-border-light dark:border-border-dark focus:ring-primary-500/30 focus:border-primary-500',
  ].join(' ')
}

// ─── Main Component ───────────────────────────────────────────────
export default function CartPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const {
    items, removeItem, updateQuantity, clearCart,
    getSubtotal, getItemPrice,
  } = useCartStore()

  // Hydration guard — avoid skeleton flash on SSR or instant load
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { setHydrated(true) }, [])

  const [step,          setStep]          = useState(STEP.CART)
  const [placedOrder,   setPlacedOrder]   = useState(null)
  const [clearConfirm,  setClearConfirm]  = useState(false)

  // Discount
  const [discountInput,   setDiscountInput]   = useState('')
  const [discountCode,    setDiscountCode]    = useState('')
  const [discountData,    setDiscountData]    = useState(null)
  const [discountError,   setDiscountError]   = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)

  // Checkout form
  const [form, setForm] = useState({
    name:        user?.name        || '',
    email:       user?.email       || '',
    phone:       user?.phone       || '',
    shipAddress: user?.address     || '',
    note:        '',
  })
  const [formErrors,      setFormErrors]      = useState({})
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Sync form with user when auth changes
  useEffect(() => {
    if (user) {
      setForm((p) => ({
        ...p,
        name:        p.name        || user.name        || '',
        email:       p.email       || user.email       || '',
        phone:       p.phone       || user.phone       || '',
        shipAddress: p.shipAddress || user.address     || '',
      }))
    }
  }, [user])

  // ─── Derived ────────────────────────────────────────────────────
  const subtotal       = getSubtotal()
  const discountAmount = (() => {
    if (!discountData) return 0
    if (discountData.minimumOrderAmount && subtotal < discountData.minimumOrderAmount) return 0
    return discountData.isPercentage
      ? Math.min((subtotal * discountData.discountValue) / 100, subtotal)
      : Math.min(discountData.discountValue, subtotal)
  })()
  const total     = Math.max(0, subtotal - discountAmount)
  const itemCount = items.reduce((n, i) => n + i.quantity, 0)

  // ─── Discount ───────────────────────────────────────────────────
  const applyDiscount = async () => {
    const code = discountInput.trim().toUpperCase()
    if (!code) return
    setDiscountLoading(true)
    setDiscountError('')
    try {
      const { discountsApi } = await import('@/api/discounts.api')
      const discount = await discountsApi.getDiscountByCode(code)

      const now       = new Date()
      const startDate = new Date(discount.startDate)
      const endDate   = new Date(discount.endDate)

      if (!discount.isActive) {
        setDiscountError('This discount code is not active.')
        setDiscountData(null)
        return
      }
      if (now < startDate) {
        setDiscountError('This discount code is not yet valid.')
        setDiscountData(null)
        return
      }
      if (now > endDate) {
        setDiscountError('This discount code has expired.')
        setDiscountData(null)
        return
      }
      if (discount.maxUses && discount.timesUsed >= discount.maxUses) {
        setDiscountError('This discount code has reached its maximum usage limit.')
        setDiscountData(null)
        return
      }

      setDiscountData(discount)
      setDiscountCode(code)
      toast.success('Discount applied!')
    } catch (err) {
      setDiscountError(err.response?.data?.message ?? 'Invalid discount code.')
      setDiscountData(null)
      setDiscountCode('')
    } finally {
      setDiscountLoading(false)
    }
  }

  const removeDiscount = () => {
    setDiscountData(null)
    setDiscountCode('')
    setDiscountInput('')
    setDiscountError('')
    toast.info('Discount removed')
  }

  // ─── Checkout ───────────────────────────────────────────────────
  const validateForm = () => {
    const errs = {}
    if (!form.name.trim())        errs.name        = 'Name is required'
    if (!form.email.trim())       errs.email       = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                  errs.email       = 'Invalid email address'
    if (!form.phone.trim())       errs.phone       = 'Phone is required'
    if (!form.shipAddress.trim()) errs.shipAddress = 'Shipping address is required'
    return errs
  }

  const handleCheckout = async (e) => {
    e.preventDefault()
    const errs = validateForm()
    if (Object.keys(errs).length) { setFormErrors(errs); return }

    if (!isAuthenticated) {
      toast.error('Please log in to place an order.')
      navigate('/login?redirect=/cart')
      return
    }

    setCheckoutLoading(true)
    try {
      const placed = await ordersApi.checkout({
        name:         form.name.trim(),
        email:        form.email.trim(),
        phone:        form.phone.trim(),
        shipAddress:  form.shipAddress.trim(),
        note:         form.note.trim() || null,
        discountCode: discountCode     || null,
        detail:       items.map((i) => ({ id: i.id, quantity: i.quantity })),
      })
      setPlacedOrder(placed)
      clearCart()
      toast.success('Order placed successfully!')
      setStep(STEP.SUCCESS)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to place order. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  // ─── Screens ────────────────────────────────────────────────────

  if (step === STEP.SUCCESS) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
        <div className="text-center max-w-sm w-full py-20">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full
            bg-green-500/10 border-2 border-green-500/30
            flex items-center justify-center text-5xl">
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
              className="px-5 py-2.5 border border-border-light dark:border-border-dark
                text-text-primary-light dark:text-text-primary-dark
                rounded-xl font-medium text-sm
                hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
            >
              My Orders
            </Link>
            <Link
              to="/shop"
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700
                text-white rounded-xl font-bold text-sm transition-colors
                shadow-lg shadow-primary-900/20"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="container mx-auto px-4 py-8">
          <CartSkeleton />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
        <div className="text-center max-w-sm w-full py-20">
          <div className="text-8xl mb-6">🛒</div>
          <h1 className="text-2xl font-black text-text-primary-light dark:text-text-primary-dark mb-2">
            Your cart is empty
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8">
            Looks like you haven't added anything yet.
          </p>
          <Link
            to="/shop"
            className="inline-block px-8 py-3.5 bg-primary-600 hover:bg-primary-700
              text-white rounded-xl font-bold transition-colors
              shadow-lg shadow-primary-900/20"
          >
            Browse Shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">

      <ConfirmModal
        open={clearConfirm}
        title="Clear cart?"
        message="This will remove all items from your cart. This cannot be undone."
        danger
        onConfirm={() => { clearCart(); setClearConfirm(false); toast.info('Cart cleared') }}
        onCancel={() => setClearConfirm(false)}
      />

      {/* ── Page header ───────────────────────────────────────── */}
      <div className="bg-linear-to-r from-primary-900 to-dark-900 text-white py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-black">
            {step === STEP.CART ? `Your Cart (${itemCount})` : 'Checkout'}
          </h1>
          {/* Step breadcrumb */}
          <div className="flex items-center gap-2 mt-3 text-sm">
            {[
              { key: STEP.CART,     label: '1. Cart'     },
              { key: STEP.CHECKOUT, label: '2. Checkout' },
            ].map(({ key, label }, idx) => (
              <span key={key} className="flex items-center gap-2">
                {idx > 0 && <span className="text-gray-600">›</span>}
                <span className={step === key ? 'text-white font-semibold' : 'text-gray-500'}>
                  {label}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left column ───────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* ───── STEP: CART ───── */}
            {step === STEP.CART && (
              <>
                {/* Items card */}
                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                    <h2 className="font-bold text-text-primary-light dark:text-text-primary-dark">
                      Items ({items.length})
                    </h2>
                    <button
                      onClick={() => setClearConfirm(true)}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
                    >
                      Clear All
                    </button>
                  </div>

                  <ul className="divide-y divide-border-light dark:divide-border-dark">
                    {items.map((item) => {
                      const price = getItemPrice(item)
                      const img   = item.pictures?.find((p) => p.isActive)?.path
                                 ?? item.pictures?.[0]?.path
                                 ?? null

                      return (
                        <li
                          key={item.id}
                          className="p-5 flex gap-4 hover:bg-gray-50 dark:hover:bg-dark-800/40 transition-colors"
                        >
                          {/* Image */}
                          <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-dark-700">
                            {img
                              ? <img src={img} alt={item.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>
                            }
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/product/${item.id}`}
                              className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark hover:text-primary-500 transition-colors line-clamp-2"
                            >
                              {item.name}
                            </Link>
                            {item.sku && (
                              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono mt-0.5">
                                {item.sku}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {item.discount > 0 && (
                                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark line-through">
                                  ${item.price.toFixed(2)}
                                </span>
                              )}
                              <span className="text-sm font-bold text-primary-500">
                                ${price.toFixed(2)}
                              </span>
                              {item.discount > 0 && (
                                <span className="text-xs bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-md font-semibold">
                                  -{item.discount}%
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="shrink-0 flex flex-col items-end justify-between gap-2">
                            {/* Remove */}
                            <button
                              onClick={() => removeItem(item.id)}
                              aria-label="Remove item"
                              className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors text-2xl leading-none"
                            >
                              ×
                            </button>

                            {/* Qty stepper */}
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-700 rounded-xl p-1">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg
                                  hover:bg-white dark:hover:bg-dark-600
                                  text-text-primary-light dark:text-text-primary-dark
                                  font-black text-base transition-colors"
                              >
                                −
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg
                                  hover:bg-white dark:hover:bg-dark-600
                                  text-text-primary-light dark:text-text-primary-dark
                                  font-black text-base transition-colors"
                              >
                                +
                              </button>
                            </div>

                            {/* Line total */}
                            <p className="text-sm font-black text-text-primary-light dark:text-text-primary-dark">
                              ${(price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {/* Discount card */}
                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm p-5">
                  <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                    🏷️ Discount Code
                  </h3>
                  {discountData ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                        <div>
                          <span className="font-mono font-black text-green-400">{discountCode}</span>
                          <span className="text-green-400 text-sm ml-2">
                            {discountData.isPercentage
                              ? `${discountData.discountValue}% off`
                              : `$${discountData.discountValue.toFixed(2)} off`}
                          </span>
                        </div>
                        <button
                          onClick={removeDiscount}
                          className="text-green-400 hover:text-red-400 text-2xl leading-none transition-colors"
                        >
                          ×
                        </button>
                      </div>
                      {discountData.minimumOrderAmount > 0 && subtotal < discountData.minimumOrderAmount && (
                        <p className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-xl px-3 py-2">
                          Add <span className="font-bold">${(discountData.minimumOrderAmount - subtotal).toFixed(2)}</span> more to unlock this discount (min. ${discountData.minimumOrderAmount.toFixed(2)})
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          value={discountInput}
                          onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
                          placeholder="Enter code..."
                          className="flex-1 px-4 py-2.5 text-sm border border-border-light dark:border-border-dark rounded-xl
                            bg-white dark:bg-dark-800 text-text-primary-light dark:text-text-primary-dark
                            placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark
                            font-mono uppercase tracking-widest
                            focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                        />
                        <button
                          onClick={applyDiscount}
                          disabled={discountLoading || !discountInput.trim()}
                          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 shrink-0"
                        >
                          {discountLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                      {discountError && (
                        <p className="text-red-400 text-xs mt-2">{discountError}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Proceed button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(STEP.CHECKOUT)}
                    className="px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-xl transition-colors shadow-lg shadow-primary-900/30 text-sm"
                  >
                    Proceed to Checkout →
                  </button>
                </div>
              </>
            )}

            {/* ───── STEP: CHECKOUT ───── */}
            {step === STEP.CHECKOUT && (
              <form
                onSubmit={handleCheckout}
                noValidate
                className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm"
              >
                <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(STEP.CART)}
                    className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
                  >
                    ← Back
                  </button>
                  <h2 className="font-bold text-text-primary-light dark:text-text-primary-dark">
                    Shipping & Contact
                  </h2>
                </div>

                <div className="p-6 space-y-5">
                  {!isAuthenticated && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-sm rounded-xl px-4 py-3">
                      <Link to="/login?redirect=/cart" className="underline font-bold">Log in</Link>
                      {' '}to track this order in your account.
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField label="Full Name" required error={formErrors.name}>
                      <input
                        value={form.name}
                        onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setFormErrors((p) => ({ ...p, name: undefined })) }}
                        placeholder="John Doe"
                        className={inputCls(formErrors.name)}
                      />
                    </FormField>

                    <FormField label="Email" required error={formErrors.email}>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setFormErrors((p) => ({ ...p, email: undefined })) }}
                        placeholder="john@example.com"
                        className={inputCls(formErrors.email)}
                      />
                    </FormField>

                    <FormField label="Phone" required error={formErrors.phone}>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => { setForm((p) => ({ ...p, phone: e.target.value })); setFormErrors((p) => ({ ...p, phone: undefined })) }}
                        placeholder="+1 234 567 8900"
                        className={inputCls(formErrors.phone)}
                      />
                    </FormField>
                  </div>

                  <FormField label="Shipping Address" required error={formErrors.shipAddress}>
                    <textarea
                      rows={3}
                      value={form.shipAddress}
                      onChange={(e) => { setForm((p) => ({ ...p, shipAddress: e.target.value })); setFormErrors((p) => ({ ...p, shipAddress: undefined })) }}
                      placeholder="123 Main St, City, Country"
                      className={`${inputCls(formErrors.shipAddress)} resize-none`}
                    />
                  </FormField>

                  <FormField label="Order Note (optional)">
                    <textarea
                      rows={2}
                      value={form.note}
                      onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                      placeholder="Special instructions..."
                      className={`${inputCls(false)} resize-none`}
                    />
                  </FormField>

                  <button
                    type="submit"
                    disabled={checkoutLoading}
                    className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-primary-900/30 text-sm"
                  >
                    {checkoutLoading ? 'Placing Order...' : `Place Order · $${total.toFixed(2)}`}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── Right: Order Summary ──────────────────────────── */}
          <div className="lg:w-80 shrink-0">
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
                      <div key={item.id} className="flex justify-between text-text-secondary-light dark:text-text-secondary-dark">
                        <span className="truncate mr-2">{item.name} ×{item.quantity}</span>
                        <span className="shrink-0 font-medium">${(price * item.quantity).toFixed(2)}</span>
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
                    <span className={subtotal >= FREE_SHIPPING_THRESHOLD ? 'text-green-500 font-semibold' : ''}>
                      {subtotal >= FREE_SHIPPING_THRESHOLD ? 'Free 🚚' : 'TBD'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border-light dark:border-border-dark pt-4 flex justify-between font-black text-base text-text-primary-light dark:text-text-primary-dark">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                {subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD && (
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark bg-gray-50 dark:bg-dark-800 rounded-xl px-3 py-2.5">
                    Add{' '}
                    <span className="font-bold text-primary-500">
                      ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)}
                    </span>{' '}
                    more for free shipping
                  </p>
                )}

                {step === STEP.CART && (
                  <button
                    onClick={() => setStep(STEP.CHECKOUT)}
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
          </div>

        </div>
      </div>
    </div>
  )
}