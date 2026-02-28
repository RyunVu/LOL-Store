import { Link } from 'react-router-dom'
import { FormField } from '@/components/form/FormField'
import { inputCls } from '@/components/form/formStyles'

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
}) {
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

        <button
          type="submit"
          disabled={checkoutLoading}
          className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-primary-900/30 text-sm"
        >
          {checkoutLoading ? 'Placing Order...' : `Place Order · $${total.toFixed(2)}`}
        </button>
      </div>
    </form>
  )
}