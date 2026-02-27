import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { usersApi } from '@/api/users.api'
import { ordersApi } from '@/api/orders.api'

const ORDER_STATUS_STYLES = {
  0: { label: 'Pending', classes: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  1: { label: 'Processing', classes: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  2: { label: 'Shipped', classes: 'bg-purple-500/15 text-purple-400 border border-purple-500/30' },
  3: { label: 'Delivered', classes: 'bg-green-500/15 text-green-400 border border-green-500/30' },
  4: { label: 'Cancelled', classes: 'bg-red-500/15 text-red-400 border border-red-500/30' },
}

const TAB_LIST = [
  { key: 'overview', label: 'Overview', icon: '◈' },
  { key: 'orders', label: 'Order History', icon: '◎' },
  { key: 'edit', label: 'Edit Profile', icon: '◇' },
  { key: 'password', label: 'Change Password', icon: '◉' },
]

export default function ProfilePage() {
  const { user, setAuth } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')

  // Orders state
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersMeta, setOrdersMeta] = useState(null)
  const [ordersPage, setOrdersPage] = useState(1)

  // Edit form
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [editErrors, setEditErrors] = useState({})
  const [editLoading, setEditLoading] = useState(false)
  const [editSuccess, setEditSuccess] = useState(false)

  // Password form
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)

  // Populate edit form from user
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      })
    }
  }, [user])

  // Fetch orders when tab or page changes
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const res = await usersApi.getUserOrders(user.id, { pageNumber: ordersPage, pageSize: 8 })
      
      setOrders(res?.items ?? [])
      setOrdersMeta(res?.metadata ?? null)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setOrdersLoading(false)
    }
  }, [user.id, ordersPage])

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders()
  }, [activeTab, fetchOrders])

  // Stats derived from first-page orders (overview only shows summary)
  const totalOrders = ordersMeta?.totalItemCount ?? orders.length
  const totalSpent = orders.reduce((s, o) => s + (o.totalAmount || 0), 0)

  // ─── Edit Profile ──────────────────────────────────────────────────────────
  const validateEdit = () => {
    const errs = {}
    if (!editForm.name.trim()) errs.name = 'Name is required'
    if (!editForm.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) errs.email = 'Invalid email'
    return errs
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    const errs = validateEdit()
    if (Object.keys(errs).length) { setEditErrors(errs); return }
    setEditLoading(true)
    try {
      const updated = await usersApi.updateUser(user.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
        address: editForm.address.trim() || null,
      })
      setAuth({ user: { ...user, ...updated } })
      setEditSuccess(true)
      setTimeout(() => setEditSuccess(false), 3000)
    } catch (err) {
      setEditErrors({ submit: err.response?.data?.message || 'Update failed. Please try again.' })
    } finally {
      setEditLoading(false)
    }
  }

  // ─── Change Password ────────────────────────────────────────────────────────
  const validatePassword = () => {
    const errs = {}
    if (!pwForm.oldPassword) errs.oldPassword = 'Current password is required'
    if (!pwForm.newPassword) errs.newPassword = 'New password is required'
    else if (pwForm.newPassword.length < 6) errs.newPassword = 'Minimum 6 characters'
    if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    return errs
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const errs = validatePassword()
    if (Object.keys(errs).length) { setPwErrors(errs); return }
    setPwLoading(true)
    try {
      await usersApi.changePassword(pwForm.oldPassword, pwForm.newPassword)
      setPwSuccess(true)
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err) {
      setPwErrors({ submit: err.response?.data?.message || 'Failed to change password.' })
    } finally {
      setPwLoading(false)
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const avatarLetter = user?.name?.[0]?.toUpperCase() || user?.userName?.[0]?.toUpperCase() || '?'

  if (!user) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">Please log in to view your profile.</p>
          <Link to="/login" className="text-primary-500 hover:underline font-medium">Go to Login →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* ─── Hero Banner ─────────────────────────────────────────────── */}
      <div className="relative bg-linear-to-r from-primary-900 via-dark-900 to-dark-800 overflow-hidden">
        {/* decorative grid lines */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="container mx-auto px-4 py-10 relative z-10">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-primary-500 to-gold-500 flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-primary-900/50">
                {avatarLetter}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-dark-900" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{user.name || user.userName}</h1>
              <p className="text-text-secondary-dark text-sm mt-0.5">@{user.userName} · {user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {(user.roles || []).map((r) => (
                  <span key={r.id || r.name} className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                    r.name === 'Admin' ? 'bg-purple-500/20 text-purple-300' :
                    r.name === 'Manager' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-white/10 text-gray-300'
                  }`}>{r.name}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ─── Sidebar Tabs ─────────────────────────────────────────── */}
          <aside className="lg:w-56 shrink-0">
            <nav className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm sticky top-20">
              {TAB_LIST.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-all text-left border-b border-border-light dark:border-border-dark last:border-b-0 ${
                    activeTab === tab.key
                      ? 'bg-primary-600 text-white'
                      : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-text-primary-light dark:hover:text-text-primary-dark'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* ─── Main Content ─────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">

            {/* ── Tab: Overview ── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Orders', value: totalOrders || '—', icon: '📦' },
                    { label: 'Total Spent', value: totalSpent ? `$${totalSpent.toFixed(2)}` : '—', icon: '💳' },
                    { label: 'Member Since', value: formatDate(user.createdAt), icon: '📅' },
                    { label: 'Account Status', value: user.isBanned ? 'Banned' : 'Active', icon: '✅', highlight: !user.isBanned },
                  ].map(({ label, value, icon, highlight }) => (
                    <div key={label} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-4 shadow-sm">
                      <div className="text-2xl mb-2">{icon}</div>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">{label}</p>
                      <p className={`text-lg font-bold mt-1 ${highlight === false ? 'text-red-400' : 'text-text-primary-light dark:text-text-primary-dark'}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Account Details */}
                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Account Details</h2>
                    <button onClick={() => setActiveTab('edit')} className="text-sm text-primary-500 hover:text-primary-400 font-medium">Edit →</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Full Name', value: user.name },
                      { label: 'Username', value: `@${user.userName}` },
                      { label: 'Email', value: user.email },
                      { label: 'Phone', value: user.phone || '—' },
                      { label: 'Address', value: user.address || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3">
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">{label}</p>
                        <p className="text-text-primary-light dark:text-text-primary-dark font-medium mt-0.5 truncate">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent orders preview */}
                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Recent Orders</h2>
                    <button onClick={() => setActiveTab('orders')} className="text-sm text-primary-500 hover:text-primary-400 font-medium">View All →</button>
                  </div>
                  <RecentOrdersPreview />
                </div>
              </div>
            )}

            {/* ── Tab: Order History ── */}
            {activeTab === 'orders' && (
              <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border-light dark:border-border-dark">
                  <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Order History</h2>
                  {ordersMeta && (
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">{ordersMeta.totalItemCount} orders total</p>
                  )}
                </div>

                {ordersLoading ? (
                  <div className="p-12 text-center">
                    <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-secondary-light dark:text-text-secondary-dark mt-3 text-sm">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-5xl mb-4">📦</div>
                    <p className="text-text-primary-light dark:text-text-primary-dark font-semibold">No orders yet</p>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-1">Start shopping to see your orders here</p>
                    <Link to="/shop" className="inline-block mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Browse Shop
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-border-light dark:divide-border-dark">
                      {orders.map((order) => {
                        const status = ORDER_STATUS_STYLES[order.status] || { label: order.status, classes: 'bg-gray-500/15 text-gray-400' }
                        return (
                          <div key={order.id} className="p-5 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-bold text-text-primary-light dark:text-text-primary-dark">{order.codeOrder}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.classes}`}>{status.label}</span>
                                </div>
                                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                                  {formatDate(order.orderDate)} · {order.orderItems?.length ?? 0} item{order.orderItems?.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  {order.discountAmount > 0 && (
                                    <p className="text-xs text-green-400">-${order.discountAmount.toFixed(2)} off</p>
                                  )}
                                  <p className="font-bold text-text-primary-light dark:text-text-primary-dark">${order.totalAmount?.toFixed(2)}</p>
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
            )}

            {/* ── Tab: Edit Profile ── */}
            {activeTab === 'edit' && (
              <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm">
                <div className="p-6 border-b border-border-light dark:border-border-dark">
                  <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Edit Profile</h2>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">Update your personal information</p>
                </div>
                <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
                  {editSuccess && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3">
                      ✓ Profile updated successfully!
                    </div>
                  )}
                  {editErrors.submit && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                      {editErrors.submit}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField label="Full Name" required error={editErrors.name}>
                      <input
                        value={editForm.name}
                        onChange={(e) => { setEditForm((p) => ({ ...p, name: e.target.value })); setEditErrors((p) => ({ ...p, name: undefined })) }}
                        placeholder="Your name"
                        className={inputCls(editErrors.name)}
                      />
                    </FormField>
                    <FormField label="Email" required error={editErrors.email}>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => { setEditForm((p) => ({ ...p, email: e.target.value })); setEditErrors((p) => ({ ...p, email: undefined })) }}
                        placeholder="your@email.com"
                        className={inputCls(editErrors.email)}
                      />
                    </FormField>
                    <FormField label="Phone">
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+1 234 567 8900"
                        className={inputCls()}
                      />
                    </FormField>
                  </div>

                  <FormField label="Address">
                    <textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Your shipping address"
                      rows={3}
                      className={`${inputCls()} resize-none`}
                    />
                  </FormField>

                  {/* Read-only */}
                  <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-4 text-sm">
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-2">Cannot be changed</p>
                    <p className="text-text-primary-light dark:text-text-primary-dark">Username: <span className="font-mono">@{user.userName}</span></p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {editLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Tab: Change Password ── */}
            {activeTab === 'password' && (
              <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm">
                <div className="p-6 border-b border-border-light dark:border-border-dark">
                  <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Change Password</h2>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">Keep your account secure</p>
                </div>
                <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5 max-w-md">
                  {pwSuccess && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3">
                      ✓ Password changed successfully!
                    </div>
                  )}
                  {pwErrors.submit && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                      {pwErrors.submit}
                    </div>
                  )}

                  <FormField label="Current Password" error={pwErrors.oldPassword}>
                    <input
                      type="password"
                      value={pwForm.oldPassword}
                      onChange={(e) => { setPwForm((p) => ({ ...p, oldPassword: e.target.value })); setPwErrors((p) => ({ ...p, oldPassword: undefined })) }}
                      placeholder="••••••••"
                      className={inputCls(pwErrors.oldPassword)}
                      autoComplete="current-password"
                    />
                  </FormField>
                  <FormField label="New Password" error={pwErrors.newPassword}>
                    <input
                      type="password"
                      value={pwForm.newPassword}
                      onChange={(e) => { setPwForm((p) => ({ ...p, newPassword: e.target.value })); setPwErrors((p) => ({ ...p, newPassword: undefined })) }}
                      placeholder="••••••••"
                      className={inputCls(pwErrors.newPassword)}
                      autoComplete="new-password"
                    />
                  </FormField>
                  <FormField label="Confirm New Password" error={pwErrors.confirmPassword}>
                    <input
                      type="password"
                      value={pwForm.confirmPassword}
                      onChange={(e) => { setPwForm((p) => ({ ...p, confirmPassword: e.target.value })); setPwErrors((p) => ({ ...p, confirmPassword: undefined })) }}
                      placeholder="••••••••"
                      className={inputCls(pwErrors.confirmPassword)}
                      autoComplete="new-password"
                    />
                  </FormField>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {pwLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  )
}

// ─── Recent Orders Preview (overview tab) ────────────────────────────────────
function RecentOrdersPreview() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ordersApi.getOrdersByUser({ pageNumber: 1, pageSize: 3 })
      .then((res) => setOrders(res?.items ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-20 flex items-center justify-center"><div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>

  if (orders.length === 0) return (
    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm text-center py-4">No orders yet.</p>
  )

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const status = ORDER_STATUS_STYLES[order.status] || { label: String(order.status), classes: 'bg-gray-500/15 text-gray-400' }
        return (
          <div key={order.id} className="flex items-center justify-between bg-gray-50 dark:bg-dark-800 rounded-lg px-4 py-3">
            <div>
              <span className="font-mono text-sm font-bold text-text-primary-light dark:text-text-primary-dark">{order.codeOrder}</span>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${status.classes}`}>{status.label}</span>
            </div>
            <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">${order.totalAmount?.toFixed(2)}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

function inputCls(error) {
  return `w-full px-4 py-2.5 rounded-lg border text-sm bg-white dark:bg-dark-800 text-text-primary-light dark:text-text-primary-dark placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark focus:outline-none focus:ring-2 transition-all ${
    error
      ? 'border-red-500 focus:ring-red-500/30'
      : 'border-border-light dark:border-border-dark focus:ring-primary-500/30 focus:border-primary-500'
  }`
}