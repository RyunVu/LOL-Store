import { Link } from 'react-router-dom'

const ORDER_STATUS_STYLES = {
  0: { label: 'Pending',    classes: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  1: { label: 'Processing', classes: 'bg-blue-500/15 text-blue-400 border border-blue-500/30'       },
  2: { label: 'Shipped',    classes: 'bg-purple-500/15 text-purple-400 border border-purple-500/30' },
  3: { label: 'Delivered',  classes: 'bg-green-500/15 text-green-400 border border-green-500/30'    },
  4: { label: 'Cancelled',  classes: 'bg-red-500/15 text-red-400 border border-red-500/30'          },
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function OrderHistory({ orders, ordersLoading, ordersMeta, ordersPage, setOrdersPage }) {
  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border-light dark:border-border-dark">
        <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
          Order History
        </h2>
        {ordersMeta && (
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
            {ordersMeta.totalItemCount} orders total
          </p>
        )}
      </div>

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
      ) : (
        <>
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {orders.map((order) => {
              const status = ORDER_STATUS_STYLES[order.status] || {
                label: order.status,
                classes: 'bg-gray-500/15 text-gray-400',
              }
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
                          <p className="text-xs text-green-400">-${order.discountAmount.toFixed(2)} off</p>
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

          {/* Pagination */}
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