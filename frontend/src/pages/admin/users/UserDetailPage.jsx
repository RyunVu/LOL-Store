import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { usersApi } from '@/api/users.api'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function UserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [roles, setRoles] = useState([])
  const [fetchLoading, setFetchLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Modals
  const [banModal, setBanModal] = useState({ show: false })
  const [banForm, setBanForm] = useState({ isPermanent: false, durationDays: 7, reason: '' })
  const [rolesModal, setRolesModal] = useState({ show: false })
  const [selectedRoleIds, setSelectedRoleIds] = useState([])
  const [resetPasswordModal, setResetPasswordModal] = useState({ show: false })
  const [newPassword, setNewPassword] = useState('')
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null, danger: false })
  const [actionLoading, setActionLoading] = useState(false)

useEffect(() => {
  if (!id) return
  setFetchLoading(true)

  Promise.all([
    usersApi.getUserById(id),
    usersApi.getRoles(),
  ])
    .then(([userData, rolesData]) => {
      setUser(userData)
      setRoles(rolesData || [])
      setSelectedRoleIds((userData?.roles || []).map((r) => r.id))
    })
    .catch((err) => {
      console.error('Failed to fetch user:', err)
      alert('Failed to load user')
      navigate('/admin/users')
    })
    .finally(() => setFetchLoading(false))
  
    
  usersApi.getUserOrders(id, { pageSize: 10, pageNumber: 1 })
    .then((ordersData) => setOrders(ordersData?.items ?? []))
    .catch(() => setOrders([])) 

}, [id, navigate])

  const refreshUser = async () => {
    const updated = await usersApi.getUserById(id)
    setUser(updated)
    setSelectedRoleIds((updated?.roles || []).map((r) => r.id))
  }

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handleBanConfirm = async () => {
    setActionLoading(true)
    try {
      const { isPermanent, durationDays, reason } = banForm
      await usersApi.banUser(id, isPermanent, isPermanent ? null : durationDays, reason)
      setBanModal({ show: false })
      await refreshUser()
    } catch (err) {
      alert('Failed to ban user: ' + (err.response?.data?.message || err.message))
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnban = () => {
    setConfirmModal({
      show: true,
      title: 'Unban User',
      message: `Remove ban for "${user.userName}"?`,
      danger: false,
      onConfirm: async () => {
        setActionLoading(true)
        try {
          await usersApi.unbanUser(id)
          setConfirmModal((p) => ({ ...p, show: false }))
          await refreshUser()
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  const handleForceLogout = () => {
    setConfirmModal({
      show: true,
      title: 'Force Logout',
      message: `Revoke all active sessions for "${user.userName}"?`,
      danger: true,
      onConfirm: async () => {
        setActionLoading(true)
        try {
          await usersApi.forceLogout(id)
          setConfirmModal((p) => ({ ...p, show: false }))
          alert('User sessions revoked.')
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  const handleUpdateRoles = async () => {
    setActionLoading(true)
    try {
      await usersApi.updateUserRoles(id, selectedRoleIds)
      setRolesModal({ show: false })
      await refreshUser()
    } catch (err) {
      alert('Failed to update roles: ' + (err.response?.data?.message || err.message))
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }
    setActionLoading(true)
    try {
      await usersApi.resetPassword(id, newPassword)
      setResetPasswordModal({ show: false })
      setNewPassword('')
      alert('Password reset successfully.')
    } catch (err) {
      alert('Failed to reset password: ' + (err.response?.data?.message || err.message))
    } finally {
      setActionLoading(false)
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const formatDate = (d) => {
    if (!d) return '—'
    const dt = new Date(d)
    return dt.toLocaleDateString('en-GB') + ' ' + dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const totalSpending = orders.reduce((s, o) => s + (o.totalAmount || 0), 0)

  const getBanBadge = () => {
    if (!user?.isBanned) return null
    if (user.banStatus === 2) return { text: 'Permanently Banned', color: 'bg-red-900/40 text-red-400 border border-red-700' }
    return {
      text: `Banned until ${new Date(user.bannedUntil).toLocaleDateString()}`,
      color: 'bg-orange-900/40 text-orange-400 border border-orange-700',
    }
  }

  if (fetchLoading) {
    return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner /></div>
  }
  if (!user) {
    return <div className="text-center py-20 text-gray-400">User not found</div>
  }

  const banBadge = getBanBadge()

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/users')}
        className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Users
      </button>

      {/* ─── Profile Card ──────────────────────────────────────────────── */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
              {user.name?.[0]?.toUpperCase() || user.userName?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                <span className="text-gray-500 font-mono text-sm">@{user.userName}</span>
                {banBadge && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${banBadge.color}`}>
                    🚫 {banBadge.text}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-1">{user.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {(user.roles || []).map((r) => (
                  <span key={r.id} className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                    r.name === 'Admin' ? 'bg-purple-900/30 text-purple-400 border-purple-800' :
                    r.name === 'Manager' ? 'bg-blue-900/30 text-blue-400 border-blue-800' :
                    'bg-gray-700 text-gray-400 border-gray-600'
                  }`}>
                    {r.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/admin/users/edit/${user.id}`}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              ✏️ Edit
            </Link>
            <button
              onClick={() => setRolesModal({ show: true })}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              👑 Roles
            </button>
            <button
              onClick={() => setResetPasswordModal({ show: true })}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              🔑 Reset PW
            </button>
            <button
              onClick={handleForceLogout}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-yellow-400 text-sm font-medium rounded-lg transition-colors border border-gray-600"
            >
              ⚡ Force Logout
            </button>
            {user.isBanned ? (
              <button
                onClick={handleUnban}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                ✅ Unban
              </button>
            ) : (
              <button
                onClick={() => { setBanForm({ isPermanent: false, durationDays: 7, reason: '' }); setBanModal({ show: true }) }}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                🚫 Ban
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700">
          {[
            { label: 'Total Orders', value: orders.length },
            { label: 'Total Spent', value: `$${totalSpending.toFixed(2)}` },
            { label: 'Phone', value: user.phone || '—' },
            { label: 'Joined', value: formatDate(user.createdAt) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
              <p className="text-white font-semibold mt-1">{value}</p>
            </div>
          ))}
        </div>

        {/* Ban info if banned */}
        {user.isBanned && user.banReason && (
          <div className="mt-4 bg-red-900/20 border border-red-800/50 rounded-lg p-3">
            <p className="text-xs text-red-400 font-medium uppercase tracking-wider mb-1">Ban Reason</p>
            <p className="text-gray-300 text-sm">{user.banReason}</p>
          </div>
        )}
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-700 mb-6">
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'orders', label: '🛒 Orders' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab: Overview ──────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Account Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', value: user.name },
              { label: 'Username', value: user.userName },
              { label: 'Email', value: user.email },
              { label: 'Phone', value: user.phone || '—' },
              { label: 'Address', value: user.address || '—' },
              { label: 'Primary Role', value: user.primaryRole },
              { label: 'Recent Spending (last 10)', value: `$${totalSpending.toFixed(2)}` },
              { label: 'Joined', value: formatDate(user.createdAt) },
              { label: 'Ban Status', value: user.isBanned ? (user.banStatus === 2 ? 'Permanently Banned' : 'Temporarily Banned') : 'Active' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-white mt-1">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Tab: Orders ────────────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p>No orders found for this user</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="bg-gray-900">
                <tr>
                  {['Order Code', 'Total', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-700/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-blue-400">{order.codeOrder}</td>
                    <td className="px-6 py-4 text-white font-medium">${order.totalAmount?.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">{order.status}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(order.orderDate)}</td>
                    <td className="px-6 py-4">
                      <Link to={`/admin/orders/edit/${order.id}`} className="text-blue-400 hover:text-blue-300 text-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ─── Ban Modal ─────────────────────────────────────────────────── */}
      {banModal.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="p-6 space-y-5">
              <h3 className="text-lg font-bold text-white">Ban "{user.userName}"</h3>

              <div className="space-y-2">
                <p className="text-sm text-gray-400 font-medium">Ban Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {[false, true].map((perm) => (
                    <button
                      key={String(perm)}
                      type="button"
                      onClick={() => setBanForm((p) => ({ ...p, isPermanent: perm }))}
                      className={`px-4 py-3 rounded-lg border font-medium text-sm transition-colors ${
                        banForm.isPermanent === perm
                          ? perm ? 'bg-red-600 border-red-500 text-white' : 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {perm ? '🔒 Permanent' : '⏱ Temporary'}
                    </button>
                  ))}
                </div>
              </div>

              {!banForm.isPermanent && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 font-medium">Duration</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[7, 14, 30, 90].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setBanForm((p) => ({ ...p, durationDays: d }))}
                        className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                          banForm.durationDays === d
                            ? 'bg-orange-600 border-orange-500 text-white'
                            : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">Custom:</span>
                    <input
                      type="number"
                      min="1"
                      value={banForm.durationDays}
                      onChange={(e) => setBanForm((p) => ({ ...p, durationDays: parseInt(e.target.value) || 1 }))}
                      className="w-24 bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                    <span className="text-gray-500 text-sm">days</span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-sm text-gray-400 font-medium">Reason (optional)</p>
                <textarea
                  rows={2}
                  placeholder="Reason for ban..."
                  className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none placeholder-gray-600"
                  value={banForm.reason}
                  onChange={(e) => setBanForm((p) => ({ ...p, reason: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setBanModal({ show: false })}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanConfirm}
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 ${
                    banForm.isPermanent ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {actionLoading ? 'Processing...' : 'Confirm Ban'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Roles Modal ───────────────────────────────────────────────── */}
      {rolesModal.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-sm border border-gray-700 shadow-2xl">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Manage Roles</h3>
              <p className="text-sm text-gray-400">User: <span className="text-white font-medium">@{user.userName}</span></p>
              <div className="space-y-2">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.includes(role.id)}
                      onChange={(e) => {
                        setSelectedRoleIds((prev) =>
                          e.target.checked ? [...prev, role.id] : prev.filter((id) => id !== role.id)
                        )
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-white font-medium">{role.name}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setRolesModal({ show: false })}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRoles}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Roles'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Reset Password Modal ──────────────────────────────────────── */}
      {resetPasswordModal.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-sm border border-gray-700 shadow-2xl">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Reset Password</h3>
              <p className="text-sm text-gray-400">Set a new password for <span className="text-white font-medium">@{user.userName}</span></p>
              <input
                type="password"
                placeholder="New password (min 6 chars)"
                className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-600"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setResetPasswordModal({ show: false }); setNewPassword('') }}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Generic Confirm Modal ─────────────────────────────────────── */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-sm border border-gray-700 shadow-2xl">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">{confirmModal.title}</h3>
              <p className="text-gray-300 text-sm">{confirmModal.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmModal((p) => ({ ...p, show: false }))}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 ${
                    confirmModal.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {actionLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}