import { Link } from 'react-router-dom'
import { FormField } from '@/components/form/FormField'
import { inputCls } from '@/components/form/formStyles'

const PAYMENT_OPTIONS = [
  {
    value: 'cod',
    label: 'Cash on Delivery',
    icon: '💵',
    description: 'Pay when your order arrives',
    detail: {
      title: 'Cash on Delivery',
      lines: [
        '✅ No online payment required',
        '📦 Pay when your package arrives',
        '🔄 Order can be cancelled before shipping',
      ],
      note: null,
    },
  },
  {
    value: 'vnpay',
    label: 'VNPay',
    icon: '🏦',
    description: 'Pay securely via VNPay gateway',
    detail: {
      title: 'Pay with VNPay',
      lines: [
        '💳 Supports ATM, Visa, Mastercard, MoMo',
        '🔒 Secured by VNPay payment gateway',
        '⚡ Order confirmed immediately after payment',
      ],
      note: "You'll be redirected to VNPay to complete payment after placing your order.",
    },
  },
]

export function CheckoutForm({
  form,
  setForm,
  formErrors,
  setFormErrors,
  isAuthenticated,
  checkoutLoading,
  total,
  onBack,
  onSubmit,
  paymentMethod,
  setPaymentMethod,
}) {
  const selectedOption = PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm"
    >
      <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
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
            <Link to="/login?redirect=/cart" className="underline font-bold">
              Log in
            </Link>{' '}
            to track this order in your account.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Full Name" required error={formErrors.name}>
            <input
              value={form.name}
              onChange={(e) => {
                setForm((p) => ({ ...p, name: e.target.value }))
                setFormErrors((p) => ({ ...p, name: undefined }))
              }}
              placeholder="John Doe"
              className={inputCls(formErrors.name)}
            />
          </FormField>

          <FormField label="Email" required error={formErrors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm((p) => ({ ...p, email: e.target.value }))
                setFormErrors((p) => ({ ...p, email: undefined }))
              }}
              placeholder="john@example.com"
              className={inputCls(formErrors.email)}
            />
          </FormField>

          <FormField label="Phone" required error={formErrors.phone}>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => {
                setForm((p) => ({ ...p, phone: e.target.value }))
                setFormErrors((p) => ({ ...p, phone: undefined }))
              }}
              placeholder="+1 234 567 8900"
              className={inputCls(formErrors.phone)}
            />
          </FormField>
        </div>

        <FormField label="Shipping Address" required error={formErrors.shipAddress}>
          <textarea
            rows={3}
            value={form.shipAddress}
            onChange={(e) => {
              setForm((p) => ({ ...p, shipAddress: e.target.value }))
              setFormErrors((p) => ({ ...p, shipAddress: undefined }))
            }}
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

        {/* ── Payment Method ───────────────────────────── */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
            Payment Method <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_OPTIONS.map(({ value, label, icon, description }) => {
              const isSelected = paymentMethod === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentMethod(value)}
                  className={`group relative flex flex-col items-start gap-1 py-4 px-4 rounded-xl border-2 text-left transition-all duration-200
                    ${isSelected
                      ? 'border-primary-500 bg-primary-500/10 shadow-md shadow-primary-500/10'
                      : 'border-border-light dark:border-border-dark hover:border-primary-400 hover:bg-primary-500/5'
                    }`}
                >
                  {/* Selected checkmark */}
                  {isSelected && (
                    <span className="absolute top-2.5 right-3 text-primary-500 text-xs font-black">
                      ✓
                    </span>
                  )}
                  <span className="text-2xl">{icon}</span>
                  <span className={`text-sm font-bold ${
                    isSelected
                      ? 'text-primary-500'
                      : 'text-text-primary-light dark:text-text-primary-dark'
                  }`}>
                    {label}
                  </span>
                  <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-snug">
                    {description}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Detail panel — shows when a method is selected */}
          {selectedOption && (
            <div className={`rounded-xl border px-4 py-4 space-y-2 transition-all duration-300
              ${paymentMethod === 'vnpay'
                ? 'bg-blue-500/5 border-blue-500/20'
                : 'bg-green-500/5 border-green-500/20'
              }`}
            >
              <p className={`text-sm font-bold ${
                paymentMethod === 'vnpay' ? 'text-blue-500' : 'text-green-500'
              }`}>
                {selectedOption.detail.title}
              </p>
              <ul className="space-y-1">
                {selectedOption.detail.lines.map((line, i) => (
                  <li key={i} className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    {line}
                  </li>
                ))}
              </ul>
              {selectedOption.detail.note && (
                <p className="text-xs text-blue-400 bg-blue-500/10 rounded-lg px-3 py-2 mt-1">
                  ℹ️ {selectedOption.detail.note}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={checkoutLoading || !paymentMethod}
          className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-primary-900/30 text-sm"
        >
          {checkoutLoading
            ? 'Processing...'
            : !paymentMethod
              ? 'Select a Payment Method'
              : paymentMethod === 'vnpay'
                ? `Pay with VNPay · $${total.toFixed(2)}`
                : `Place Order · $${total.toFixed(2)}`
          }
        </button>
      </div>
    </form>
  )
}