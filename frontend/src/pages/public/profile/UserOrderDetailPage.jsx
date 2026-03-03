import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ordersApi } from '@/api/orders.api'

// ─── Constants ────────────────────────────────────────────────────
const STATUS = {
  0: { label: 'None',       icon: '📦', color: 'bg-gray-500/15 text-gray-400 border border-gray-600'            },
  1: { label: 'New',        icon: '🆕', color: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'         },
  2: { label: 'Pending',    icon: '⏳', color: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'   },
  3: { label: 'Processing', icon: '⚙️', color: 'bg-blue-500/15 text-blue-400 border border-blue-500/30'         },
  4: { label: 'Shipped',    icon: '🚚', color: 'bg-purple-500/15 text-purple-400 border border-purple-500/30'   },
  5: { label: 'Delivered',  icon: '✅', color: 'bg-green-500/15 text-green-400 border border-green-500/30'      },
  6: { label: 'Cancelled',  icon: '❌', color: 'bg-red-500/15 text-red-400 border border-red-500/30'            },
}

// User can only cancel while order hasn't been shipped yet
const CANCELLABLE_STATUSES = new Set([1, 2, 3]) // New, Pending, Processing

const fmt = {
  date: (d) => {
    if (!d) return '—'
    const dt = new Date(d)
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' · ' + dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  },
  currency: (n) => typeof n === 'number' ? `$${n.toFixed(2)}` : '$0.00',
}

// ─── Status Timeline ──────────────────────────────────────────────
function StatusTimeline({ current }) {
  const steps = [1, 2, 3, 4, 5]
  const isCancelled = current === 6

  return (
    <div className="w-full">
      {isCancelled ? (
        <div className="flex items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center text-lg">
            ❌
          </div>
          <div>
            <p className="text-red-400 font-semibold">Order Cancelled</p>
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
              This order has been cancelled.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-0 overflow-x-auto pb-1">
          {steps.map((step, idx) => {
            const s = STATUS[step]
            const isDone   = current >= step
            const isActive = current === step
            return (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm border-2 transition-all shrink-0
                    ${isDone
                      ? 'bg-primary-600 border-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-dark-700 border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark'}
                    ${isActive ? 'ring-2 ring-primary-400 ring-offset-2 ring-offset-white dark:ring-offset-background-dark' : ''}
                  `}>
                    {isDone ? (isActive ? s.icon : '✓') : <span className="text-xs font-bold">{step}</span>}
                  </div>
                  <span className={`text-xs whitespace-nowrap font-medium px-1 ${
                    isDone ? 'text-primary-500' : 'text-text-muted-light dark:text-text-muted-dark'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 w-8 sm:w-12 mx-1 mb-5 shrink-0 transition-all ${
                    current > step ? 'bg-primary-500' : 'bg-border-light dark:bg-border-dark'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Cancel Confirmation Modal ────────────────────────────────────
function CancelModal({ order, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-900 rounded-2xl w-full max-w-sm border border-border-light dark:border-border-dark shadow-2xl p-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-2xl mx-auto">
          ⚠️
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
            Cancel this order?
          </h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Order <span className="font-mono font-bold text-primary-500">{order.codeOrder}</span> will be cancelled.
            This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors"
          >
            Keep Order
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            {loading ? 'Cancelling...' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────
export default function UserOrderDetailPage() {
  const { orderCode } = useParams()   // route: /orders/:orderCode
  const [order,         setOrder]         = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [showCancel,    setShowCancel]    = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await ordersApi.getOrderByCode(orderCode)
        setOrder(res)
      } catch (err) {
        setError(err.response?.data?.message ?? 'Failed to load order.')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderCode])

  const handleCancel = async () => {
    setCancelLoading(true)
    try {
      await ordersApi.cancelOrder(order.id)
      // Refresh order to show updated cancelled status
      const updated = await ordersApi.getOrderByCode(orderCode)
      setOrder(updated)
      setShowCancel(false)
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to cancel order.')
    } finally {
      setCancelLoading(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-text-secondary-light dark:text-text-secondary-dark">Loading order...</p>
      </div>
    </div>
  )

  // ── Error ────────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-text-primary-light dark:text-text-primary-dark font-semibold mb-2">
          Order not found
        </p>
        <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-6">{error}</p>
        <Link to="/profile?tab=orders" className="text-primary-500 hover:underline text-sm">
          ← Back to My Orders
        </Link>
      </div>
    </div>
  )

  if (!order) return null

  const status      = STATUS[order.status] ?? STATUS[0]
  const canCancel   = CANCELLABLE_STATUSES.has(order.status)
  const subtotal    = order.orderItems?.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">

      {showCancel && (
        <CancelModal
          order={order}
          onClose={() => setShowCancel(false)}
          onConfirm={handleCancel}
          loading={cancelLoading}
        />
      )}

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="bg-linear-to-r from-primary-900 to-dark-900 text-white py-10">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <Link to="/profile?tab=orders" className="hover:text-white transition-colors">
              My Orders
            </Link>
            <span>›</span>
            <span className="text-white font-mono">{order.codeOrder}</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black font-mono">{order.codeOrder}</h1>
              <p className="text-gray-400 text-sm mt-1">Placed on {fmt.date(order.orderDate)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${status.color}`}>
                <span>{status.icon}</span>
                <span>{status.label}</span>
              </span>
              {canCancel && (
                <button
                  onClick={() => setShowCancel(true)}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-sm font-semibold rounded-xl transition-colors"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">

        {/* ── Status Timeline ─────────────────────────────────── */}
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider font-semibold mb-4">
            Order Status
          </p>
          <StatusTimeline current={order.status} />

          {/* Cancellation window notice */}
          {canCancel && (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-yellow-400 mt-0.5">ℹ️</span>
              <p className="text-yellow-400 text-sm">
                You can cancel this order while it's in <strong>New</strong>, <strong>Pending</strong>, or <strong>Processing</strong> status.
                Once shipped, cancellation is no longer possible.
              </p>
            </div>
          )}
          {!canCancel && order.status !== 6 && (
            <div className="mt-4 bg-gray-50 dark:bg-dark-800 border border-border-light dark:border-border-dark rounded-xl px-4 py-3">
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                This order can no longer be cancelled as it has already been <strong>{status.label.toLowerCase()}</strong>.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Left: Items ───────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark">
                <h2 className="font-bold text-text-primary-light dark:text-text-primary-dark">
                  Items
                  <span className="ml-2 text-sm font-normal text-text-secondary-light dark:text-text-secondary-dark">
                    ({order.orderItems?.length ?? 0})
                  </span>
                </h2>
              </div>

              <ul className="divide-y divide-border-light dark:divide-border-dark">
                {(order.orderItems ?? []).map((item, idx) => (
                  <li key={idx} className="p-5 flex gap-4">
                    {/* Image */}
                    <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        : <span className="text-2xl">🎮</span>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
                        {item.name || '—'}
                      </p>
                      {item.sku && (
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono mt-0.5">
                          {item.sku}
                        </p>
                      )}
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                        {fmt.currency(item.price)} × {item.quantity}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-bold text-text-primary-light dark:text-text-primary-dark">
                        {fmt.currency(item.price * item.quantity)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-dark-800/50 border-t border-border-light dark:border-border-dark space-y-2 text-sm">
                <div className="flex justify-between text-text-secondary-light dark:text-text-secondary-dark">
                  <span>Subtotal</span>
                  <span>{fmt.currency(subtotal)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary-light dark:text-text-secondary-dark flex items-center gap-2">
                      Discount
                      {order.discount?.code && (
                        <span className="text-xs font-mono bg-green-500/10 text-green-500 border border-green-500/30 px-1.5 py-0.5 rounded">
                          {order.discount.code}
                        </span>
                      )}
                    </span>
                    <span className="text-green-500 font-medium">−{fmt.currency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-base text-text-primary-light dark:text-text-primary-dark pt-2 border-t border-border-light dark:border-border-dark">
                  <span>Total</span>
                  <span>{fmt.currency(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Note */}
            {order.note && (
              <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 shadow-sm">
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider font-semibold mb-2">
                  Order Note
                </p>
                <p className="text-text-primary-light dark:text-text-primary-dark text-sm leading-relaxed">
                  {order.note}
                </p>
              </div>
            )}
          </div>

          {/* ── Right: Info ───────────────────────────────────── */}
          <div className="lg:w-72 shrink-0 space-y-5">

            {/* Shipping */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider font-semibold mb-4">
                Delivery Info
              </p>
              <div className="space-y-3 text-sm">
                {[
                  { icon: '👤', label: 'Name',    value: order.name        },
                  { icon: '📞', label: 'Phone',   value: order.phone       },
                  { icon: '📧', label: 'Email',   value: order.email       },
                  { icon: '📍', label: 'Address', value: order.shipAddress },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex gap-3">
                    <span className="mt-0.5">{icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{label}</p>
                      <p className="text-text-primary-light dark:text-text-primary-dark font-medium wrap-break-word">
                        {value || '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Meta */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 shadow-sm text-sm">
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider font-semibold mb-4">
                Order Info
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Order Code</p>
                  <p className="font-mono font-bold text-primary-500">{order.codeOrder}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Placed On</p>
                  <p className="text-text-primary-light dark:text-text-primary-dark">{fmt.date(order.orderDate)}</p>
                </div>
              </div>
            </div>

            {/* Cancel CTA — shown again in sidebar for visibility */}
            {canCancel && (
              <button
                onClick={() => setShowCancel(true)}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl text-sm font-bold transition-colors"
              >
                ✕ Cancel This Order
              </button>
            )}

            <Link
              to="/profile?tab=orders"
              className="block text-center text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-500 transition-colors py-1"
            >
              ← Back to My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}