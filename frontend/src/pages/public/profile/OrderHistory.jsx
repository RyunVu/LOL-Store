import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

// Matches backend OrderStatus enum
const STATUS_MAP = {
  0: { label: 'None',       classes: 'bg-gray-500/15 text-gray-400 border border-gray-500/30'      },
  1: { label: 'New',        classes: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'       },
  2: { label: 'Pending',    classes: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  3: { label: 'Processing', classes: 'bg-blue-500/15 text-blue-400 border border-blue-500/30'       },
  4: { label: 'Shipped',    classes: 'bg-purple-500/15 text-purple-400 border border-purple-500/30' },
  5: { label: 'Delivered',  classes: 'bg-green-500/15 text-green-400 border border-green-500/30'    },
  6: { label: 'Cancelled',  classes: 'bg-red-500/15 text-red-400 border border-red-500/30'          },
}

// Tab definitions — which status values each tab includes
const TABS = [
  { key: 'all',       label: 'All',       statuses: null             },
  { key: 'active',    label: 'Active',    statuses: new Set([1,2,3]) },
  { key: 'shipped',   label: 'Shipped',   statuses: new Set([4])     },
  { key: 'delivered', label: 'Delivered', statuses: new Set([5])     },
  { key: 'cancelled', label: 'Cancelled', statuses: new Set([6])     },
]

function resolveStatus(raw) {
  const byNumber = STATUS_MAP[Number(raw)]
  if (byNumber) return byNumber
  const byLabel = Object.values(STATUS_MAP).find(
    (s) => s.label.toLowerCase() === String(raw).toLowerCase()
  )
  return byLabel ?? { label: String(raw), classes: 'bg-gray-500/15 text-gray-400 border border-gray-500/30' }
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function OrderHistory({ orders, ordersLoading, ordersMeta, ordersPage, setOrdersPage }) {
  const [activeTab, setActiveTab] = useState('all')
  const [sortOrder, setSortOrder] = useState('desc') // desc = newest first

  // ── Per-tab counts (based on current page) ───────────────────────
  const tabCounts = useMemo(() => {
    const counts = {}
    TABS.forEach((tab) => {
      counts[tab.key] = tab.statuses === null
        ? orders.length
        : orders.filter((o) => tab.statuses.has(Number(o.status))).length
    })
    return counts
  }, [orders])

  // ── Filter by tab + sort by date ─────────────────────────────────
  const visibleOrders = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab)
    const filtered = tab?.statuses === null
      ? orders
      : orders.filter((o) => tab.statuses.has(Number(o.status)))

    return [...filtered].sort((a, b) => {
      const diff = new Date(a.orderDate) - new Date(b.orderDate)
      return sortOrder === 'desc' ? -diff : diff
    })
  }, [orders, activeTab, sortOrder])

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden">

      {/* ── Header + Tabs ───────────────────────────────────────── */}
      <div className="px-6 pt-6 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
              Order History
            </h2>
            {ordersMeta && (
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                {ordersMeta.totalItemCount} orders total
              </p>
            )}
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => setSortOrder((s) => s === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors shrink-0"
          >
            {sortOrder === 'desc' ? '↓ Newest first' : '↑ Oldest first'}
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const count = tabCounts[tab.key]
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all -mb-px ${
                  isActive
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary-500/15 text-primary-500'
                      : 'bg-gray-100 dark:bg-dark-700 text-text-secondary-light dark:text-text-secondary-dark'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      {ordersLoading ? (
        <div className="p-12 text-center">
          <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary-light dark:text-text-secondary-dark mt-3 text-sm">
            Loading orders...
          </p>
        </div>

      ) : orders.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-text-primary-light dark:text-text-primary-dark font-semibold">No orders yet</p>
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-1">
            Start shopping to see your orders here
          </p>
          <Link
            to="/shop"
            className="inline-block mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Browse Shop
          </Link>
        </div>

      ) : visibleOrders.length === 0 ? (
        // Empty state for a tab that has no matching orders
        <div className="p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-text-primary-light dark:text-text-primary-dark font-semibold">
            No {TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} orders
          </p>
          <button
            onClick={() => setActiveTab('all')}
            className="mt-3 text-sm text-primary-500 hover:underline"
          >
            View all orders
          </button>
        </div>

      ) : (
        <>
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {visibleOrders.map((order) => {
              const status = resolveStatus(order.status)
              return (
                <div
                  key={order.id}
                  className="p-5 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-text-primary-light dark:text-text-primary-dark">
                          {order.codeOrder}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.classes}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                        {formatDate(order.orderDate)} · {order.orderItems?.length ?? 0} item
                        {order.orderItems?.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {order.discountAmount > 0 && (
                          <p className="text-xs text-green-500">−${order.discountAmount.toFixed(2)} off</p>
                        )}
                        <p className="font-bold text-text-primary-light dark:text-text-primary-dark">
                          ${order.totalAmount?.toFixed(2)}
                        </p>
                      </div>
                      <Link
                        to={`/orders/${order.codeOrder}`}
                        className="shrink-0 px-3 py-1.5 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-text-primary-light dark:text-text-primary-dark text-sm font-medium rounded-lg transition-colors border border-border-light dark:border-border-dark"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Pagination ──────────────────────────────────────── */}
          {ordersMeta && ordersMeta.pageCount > 1 && (
            <div className="p-4 flex items-center justify-center gap-2 border-t border-border-light dark:border-border-dark">
              <button
                onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                disabled={ordersPage === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-border-light dark:border-border-dark disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors text-text-primary-light dark:text-text-primary-dark"
              >
                ← Prev
              </button>
              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Page {ordersPage} of {ordersMeta.pageCount}
              </span>
              <button
                onClick={() => setOrdersPage((p) => Math.min(ordersMeta.pageCount, p + 1))}
                disabled={ordersPage === ordersMeta.pageCount}
                className="px-3 py-1.5 text-sm rounded-lg border border-border-light dark:border-border-dark disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors text-text-primary-light dark:text-text-primary-dark"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}