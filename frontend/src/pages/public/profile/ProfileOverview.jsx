import { useState, useEffect } from 'react'
import { usersApi } from '@/api/users.api'

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

function RecentOrdersPreview({ userId }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return 

    usersApi
      .getRecentOrders(userId)
      .then((res) => setOrders(res ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="h-20 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm text-center py-4">
        No orders yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const status = ORDER_STATUS_STYLES[order.status] || {
          label: String(order.status),
          classes: 'bg-gray-500/15 text-gray-400',
        }
        return (
          <div
            key={order.id}
            className="flex items-center justify-between bg-gray-50 dark:bg-dark-800 rounded-lg px-4 py-3"
          >
            <div>
              <span className="font-mono text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                {order.codeOrder}
              </span>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${status.classes}`}>
                {status.label}
              </span>
            </div>
            <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
              ${order.totalAmount?.toFixed(2)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function ProfileOverview({ user, totalOrders, totalSpent, onGoToOrders, onGoToEdit }) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',   value: totalOrders || '—',                                   icon: '📦' },
          { label: 'Total Spent',    value: totalSpent ? `$${totalSpent.toFixed(2)}` : '—',        icon: '💳' },
          { label: 'Member Since',   value: formatDate(user.createdAt),                            icon: '📅' },
          { label: 'Account Status', value: user.isBanned ? 'Banned' : 'Active', highlight: !user.isBanned, icon: '✅' },
        ].map(({ label, value, icon, highlight }) => (
          <div
            key={label}
            className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-4 shadow-sm"
          >
            <div className="text-2xl mb-2">{icon}</div>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
              {label}
            </p>
            <p className={`text-lg font-bold mt-1 ${
              highlight === false
                ? 'text-red-400'
                : 'text-text-primary-light dark:text-text-primary-dark'
            }`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Account Details */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
            Account Details
          </h2>
          <button
            onClick={onGoToEdit}
            className="text-sm text-primary-500 hover:text-primary-400 font-medium"
          >
            Edit →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Full Name', value: user.name },
            { label: 'Username',  value: `@${user.userName}` },
            { label: 'Email',     value: user.email },
            { label: 'Phone',     value: user.phone   || '—' },
            { label: 'Address',   value: user.address || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3">
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                {label}
              </p>
              <p className="text-text-primary-light dark:text-text-primary-dark font-medium mt-0.5 truncate">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
            Recent Orders
          </h2>
          <button
            onClick={onGoToOrders}
            className="text-sm text-primary-500 hover:text-primary-400 font-medium"
          >
            View All →
          </button>
        </div>
        <RecentOrdersPreview userId={user?.id} />
      </div>
    </div>
  )
}