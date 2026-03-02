import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/useCartStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { ordersApi } from '@/api/orders.api'

import { CartSkeleton }    from './CartSkeleton'
import { CartItemList }    from './CartItemList'
import { DiscountSection } from './DiscountSection'
import { CheckoutForm }    from './CheckoutForm'
import { OrderSummary }    from './OrderSummary'
import { OrderSuccess }    from './OrderSuccess'
import { ConfirmModal }    from '@/components/form/ConfirmModal'

// ─── Constants ────────────────────────────────────────────────────
const STEP = { CART: 'cart', CHECKOUT: 'checkout', SUCCESS: 'success' }

// ─── Empty state ──────────────────────────────────────────────────
import { Link } from 'react-router-dom'

function EmptyCart() {
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
          className="inline-block px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-primary-900/20"
        >
          Browse Shop
        </Link>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────
export default function CartPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { items, removeItem, updateQuantity, clearCart, getSubtotal, getItemPrice } = useCartStore()

  // Hydration guard
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { setHydrated(true) }, [])

  const [step,         setStep]         = useState(STEP.CART)
  const [placedOrder,  setPlacedOrder]  = useState(null)
  const [clearConfirm, setClearConfirm] = useState(false)

  // ── Discount state ──────────────────────────────────────────────
  const [discountInput,   setDiscountInput]   = useState('')
  const [discountCode,    setDiscountCode]    = useState('')
  const [discountData,    setDiscountData]    = useState(null)
  const [discountError,   setDiscountError]   = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)

  // ── Checkout form state ─────────────────────────────────────────
  const [form, setForm] = useState({
    name:        user?.name    || '',
    email:       user?.email   || '',
    phone:       user?.phone   || '',
    shipAddress: user?.address || '',
    note:        '',
  })
  const [formErrors,      setFormErrors]      = useState({})
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Sync form when auth changes
  useEffect(() => {
    if (user) {
      setForm((p) => ({
        ...p,
        name:        p.name        || user.name    || '',
        email:       p.email       || user.email   || '',
        phone:       p.phone       || user.phone   || '',
        shipAddress: p.shipAddress || user.address || '',
      }))
    }
  }, [user])

  // ── Derived values ──────────────────────────────────────────────
  const subtotal = getSubtotal()
  const discountAmount = (() => {
    if (!discountData) return 0
    if (discountData.minimumOrderAmount && subtotal < discountData.minimumOrderAmount) return 0
    return discountData.isPercentage
      ? Math.min((subtotal * discountData.discountValue) / 100, subtotal)
      : Math.min(discountData.discountValue, subtotal)
  })()
  const total     = Math.max(0, subtotal - discountAmount)
  const itemCount = items.reduce((n, i) => n + i.quantity, 0)

  // ── Discount actions ────────────────────────────────────────────
  const applyDiscount = async () => {
    const code = discountInput.trim().toUpperCase()
    if (!code) return
    setDiscountLoading(true)
    setDiscountError('')
    try {
      const { discountsApi } = await import('@/api/discounts.api')
      const discount = await discountsApi.getDiscountByCode(code)
      const now = new Date()

      if (!discount.isActive) {
        setDiscountError('This discount code is not active.')
        setDiscountData(null)
        return
      }
      if (now < new Date(discount.startDate)) {
        setDiscountError('This discount code is not yet valid.')
        setDiscountData(null)
        return
      }
      if (now > new Date(discount.endDate)) {
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

  // ── Checkout ────────────────────────────────────────────────────
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

  // ── Render guards ───────────────────────────────────────────────
  if (step === STEP.SUCCESS) return <OrderSuccess placedOrder={placedOrder} />
  if (!hydrated) return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="container mx-auto px-4 py-8"><CartSkeleton /></div>
    </div>
  )
  if (items.length === 0) return <EmptyCart />

  // ── Main render ─────────────────────────────────────────────────
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

      {/* Page header */}
      <div className="bg-linear-to-r from-primary-900 to-dark-900 text-white py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-black">
            {step === STEP.CART ? `Your Cart (${itemCount})` : 'Checkout'}
          </h1>
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

          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-5">
            {step === STEP.CART && (
              <>
                <CartItemList
                  items={items}
                  getItemPrice={getItemPrice}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                  onClearAll={() => setClearConfirm(true)}
                />
                <DiscountSection
                  discountInput={discountInput}
                  setDiscountInput={setDiscountInput}
                  discountCode={discountCode}
                  discountData={discountData}
                  discountError={discountError}
                  discountLoading={discountLoading}
                  subtotal={subtotal}
                  onApply={applyDiscount}
                  onRemove={removeDiscount}
                />
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

            {step === STEP.CHECKOUT && (
              <CheckoutForm
                form={form}
                setForm={setForm}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
                isAuthenticated={isAuthenticated}
                checkoutLoading={checkoutLoading}
                total={total}
                onBack={() => setStep(STEP.CART)}
                onSubmit={handleCheckout}
              />
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:w-80 shrink-0">
            <OrderSummary
              items={items}
              getItemPrice={getItemPrice}
              subtotal={subtotal}
              discountAmount={discountAmount}
              discountCode={discountCode}
              total={total}
              step={step}
              onCheckout={() => setStep(STEP.CHECKOUT)}
            />
          </div>

        </div>
      </div>
    </div>
  )
}