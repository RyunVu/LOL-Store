import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { usersApi } from '@/api/users.api'

import { ProfileOverview }   from './ProfileOverview'
import { OrderHistory }      from './OrderHistory'
import { EditProfileForm }   from './EditProfileForm'
import { ChangePasswordForm } from './ChangePasswordForm'

// ─── Constants ────────────────────────────────────────────────────
const TAB_LIST = [
  { key: 'overview',  label: 'Overview',         icon: '◈' },
  { key: 'orders',    label: 'Order History',    icon: '◎' },
  { key: 'edit',      label: 'Edit Profile',     icon: '◇' },
  { key: 'password',  label: 'Change Password',  icon: '◉' },
]

// ─── Main Component ───────────────────────────────────────────────
export default function ProfilePage() {
  const { user, setAuth } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')

  // ── Orders state ────────────────────────────────────────────────
  const [orders,       setOrders]       = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersMeta,   setOrdersMeta]   = useState(null)
  const [ordersPage,   setOrdersPage]   = useState(1)

  // ── Edit form state ─────────────────────────────────────────────
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [editErrors, setEditErrors] = useState({})
  const [editLoading, setEditLoading] = useState(false)
  const [editSuccess, setEditSuccess] = useState(false)

  // ── Password form state ─────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)

  // Populate edit form from user
  useEffect(() => {
    if (user) {
      setEditForm({
        name:    user.name    || '',
        email:   user.email   || '',
        phone:   user.phone   || '',
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

  // ── Derived ─────────────────────────────────────────────────────
  const totalOrders = ordersMeta?.totalItemCount ?? orders.length
  const totalSpent  = orders.reduce((s, o) => s + (o.totalAmount || 0), 0)

  // ── Edit Profile ────────────────────────────────────────────────
  const validateEdit = () => {
    const errs = {}
    if (!editForm.name.trim())  errs.name  = 'Name is required'
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
        name:    editForm.name.trim(),
        email:   editForm.email.trim(),
        phone:   editForm.phone.trim()   || null,
        address: editForm.address.trim() || null,
      })
      setAuth({ user: { ...user, ...updated } })
      setEditSuccess(true)
      setEditErrors({})
      setTimeout(() => setEditSuccess(false), 3000)
    } catch (err) {
      const d = err.response?.data
      const message =
        d?.message ||
        d?.errors?.[0] ||
        (Array.isArray(d) ? d.map((e) => e.errorMessage).join(', ') : null) ||
        'Update failed. Please try again.'
      setEditErrors({ submit: message })
    } finally {
      setEditLoading(false)
    }
  }

  // ── Change Password ─────────────────────────────────────────────
  const validatePassword = () => {
    const errs = {}
    if (!pwForm.oldPassword)                        errs.oldPassword     = 'Current password is required'
    if (!pwForm.newPassword)                        errs.newPassword     = 'New password is required'
    else if (pwForm.newPassword.length < 6)         errs.newPassword     = 'Minimum 6 characters'
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

  // ── Guard ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
            Please log in to view your profile.
          </p>
          <Link to="/login" className="text-primary-500 hover:underline font-medium">
            Go to Login →
          </Link>
        </div>
      </div>
    )
  }

  const avatarLetter =
    user?.name?.[0]?.toUpperCase() ||
    user?.userName?.[0]?.toUpperCase() ||
    '?'

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">

      {/* Hero Banner */}
      <div className="relative bg-linear-to-r from-primary-900 via-dark-900 to-dark-800 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="container mx-auto px-4 py-10 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-primary-500 to-gold-500 flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-primary-900/50">
                {avatarLetter}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-dark-900" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {user.name || user.userName}
              </h1>
              <p className="text-text-secondary-dark text-sm mt-0.5">
                @{user.userName} · {user.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {(user.roles || []).map((r) => (
                  <span
                    key={r.id || r.name}
                    className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                      r.name === 'Admin'   ? 'bg-purple-500/20 text-purple-300' :
                      r.name === 'Manager' ? 'bg-blue-500/20 text-blue-300'    :
                                             'bg-white/10 text-gray-300'
                    }`}
                  >
                    {r.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar Tabs */}
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

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {activeTab === 'overview' && (
              <ProfileOverview
                user={user}
                totalOrders={totalOrders}
                totalSpent={totalSpent}
                onGoToOrders={() => setActiveTab('orders')}
                onGoToEdit={() => setActiveTab('edit')}
              />
            )}

            {activeTab === 'orders' && (
              <OrderHistory
                orders={orders}
                ordersLoading={ordersLoading}
                ordersMeta={ordersMeta}
                ordersPage={ordersPage}
                setOrdersPage={setOrdersPage}
              />
            )}

            {activeTab === 'edit' && (
              <EditProfileForm
                user={user}
                editForm={editForm}
                setEditForm={setEditForm}
                editErrors={editErrors}
                setEditErrors={setEditErrors}
                editLoading={editLoading}
                editSuccess={editSuccess}
                onSubmit={handleEditSubmit}
              />
            )}

            {activeTab === 'password' && (
              <ChangePasswordForm
                pwForm={pwForm}
                setPwForm={setPwForm}
                pwErrors={pwErrors}
                setPwErrors={setPwErrors}
                pwLoading={pwLoading}
                pwSuccess={pwSuccess}
                onSubmit={handlePasswordSubmit}
              />
            )}
          </main>

        </div>
      </div>
    </div>
  )
}