import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { usersApi } from '@/api/users.api'
import { useDebounce } from '@/hooks/useDebounce'
import AdminPagination from '../../../components/pagination/AdminPagination'

export default function UserManagePage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)

  const [selectedUsers, setSelectedUsers] = useState([])

  // ─── Modals ──────────────────────────────────────────────────────────────
  const [banModal, setBanModal] = useState({
    show: false,
    user: null,
    isMultiple: false,
  })
  const [banForm, setBanForm] = useState({
    isPermanent: false,
    durationDays: 7,
    reason: '',
  })
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    danger: false,
  })

  const [filters, setFilters] = useState({
    keyword: '',
    isBanned: '',
    sortColumn: 'createdAt',
    sortOrder: 'Desc',
    pageNumber: 1,
    pageSize: 10,
  })

  const debouncedKeyword = useDebounce(filters.keyword, 300)
  const { pageNumber, pageSize, isBanned, sortColumn, sortOrder } = filters

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        pageNumber,
        pageSize,
        keyword: debouncedKeyword || undefined,
        isBanned: isBanned !== '' ? isBanned : undefined,
        sortColumn,
        sortOrder,
      }
      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === '') delete params[k]
      })
      const res = await usersApi.getUsersByManager(params)
      
      setUsers(res?.items ?? [])
      setTotalItems(res?.totalItems ?? 0)
      
      setSelectedUsers([])
    } catch (err) {
      console.error('Failed to fetch users:', err)
      setUsers([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, pageNumber, pageSize, isBanned, sortColumn, sortOrder])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleSelectAll = (e) => {
    setSelectedUsers(e.target.checked ? users.map((u) => u.id) : [])
  }
  const handleSelectUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const openBanModal = (user = null) => {
    setBanForm({ isPermanent: false, durationDays: 7, reason: '' })
    setBanModal({ show: true, user, isMultiple: !user })
  }

  const handleBanConfirm = async () => {
    const { isPermanent, durationDays, reason } = banForm
    try {
      if (banModal.isMultiple) {
        await Promise.all(
          selectedUsers.map((id) =>
            usersApi.banUser(id, isPermanent, isPermanent ? null : durationDays, reason)
          )
        )
        setSelectedUsers([])
      } else {
        await usersApi.banUser(
          banModal.user.id,
          isPermanent,
          isPermanent ? null : durationDays,
          reason
        )
      }
      setBanModal({ show: false, user: null, isMultiple: false })
      fetchUsers()
    } catch (err) {
      console.error('Ban failed:', err)
      alert('Failed to ban user: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleUnban = (user) => {
    setConfirmModal({
      show: true,
      title: 'Unban User',
      message: `Remove ban for "${user.userName}"?`,
      danger: false,
      onConfirm: async () => {
        await usersApi.unbanUser(user.id)
        setConfirmModal((p) => ({ ...p, show: false }))
        fetchUsers()
      },
    })
  }

  const handleForceLogout = (user) => {
    setConfirmModal({
      show: true,
      title: 'Force Logout',
      message: `Revoke all active sessions for "${user.userName}"? They will be logged out immediately.`,
      danger: true,
      onConfirm: async () => {
        try {
          await usersApi.forceLogout(user.id)
        } catch (err) {
          alert('Failed to force logout: ' + (err.response?.data?.message || err.message))
        } finally {
          setConfirmModal((p) => ({ ...p, show: false }))
        }
      },
    })
  }

  const getBanLabel = (user) => {
    if (!user.isBanned) return null
    if (user.banStatus === 2) return { text: 'Permanent Ban', color: 'bg-red-900/30 text-red-400 border border-red-800' }
    if (user.bannedUntil) {
      const until = new Date(user.bannedUntil)
      return {
        text: `Banned until ${until.toLocaleDateString()}`,
        color: 'bg-orange-900/30 text-orange-400 border border-orange-800',
      }
    }
    return { text: 'Banned', color: 'bg-red-900/30 text-red-400 border border-red-800' }
  }

  const getPrimaryRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-purple-900/30 text-purple-400 border border-purple-800'
      case 'Manager': return 'bg-blue-900/30 text-blue-400 border border-blue-800'
      default: return 'bg-gray-700/50 text-gray-400 border border-gray-600'
    }
  }

  const formatDate = (d) => {
    if (!d) return '--'
    const dt = new Date(d)
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
  }

  const selectedAllUnbanned = selectedUsers.every((id) => {
    const u = users.find((x) => x.id === id)
    return !u?.isBanned
  })

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1 text-sm">Manage accounts, roles and security</p>
        </div>
        <div className="flex gap-2 text-sm">
          <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            <span className="text-gray-400">Total: </span>
            <span className="text-white font-semibold">{totalItems}</span>
          </div>
        </div>
      </div>

      {/* ─── Filters ────────────────────────────────────────────────────── */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Filter Users</h2>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Search by name, username or email..."
              className="w-72 bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={filters.keyword}
              onChange={(e) => setFilters((p) => ({ ...p, keyword: e.target.value, pageNumber: 1 }))}
            />

            <select
              className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={filters.isBanned}
              onChange={(e) => setFilters((p) => ({ ...p, isBanned: e.target.value, pageNumber: 1 }))}
            >
              <option value="">All Users</option>
              <option value="false">✅ Active</option>
              <option value="true">🚫 Banned</option>
            </select>

            <select
              className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              value={filters.sortOrder}
              onChange={(e) => setFilters((p) => ({ ...p, sortOrder: e.target.value, pageNumber: 1 }))}
            >
              <option value="Desc">Newest First</option>
              <option value="Asc">Oldest First</option>
            </select>

            <button
              onClick={() => setFilters({ keyword: '', isBanned: '', sortColumn: 'createdAt', sortOrder: 'Desc', pageNumber: 1, pageSize: 10 })}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              Clear All
            </button>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="ml-auto flex items-center gap-3 bg-gray-900 px-3 py-2 rounded-lg border border-gray-600">
                <span className="text-sm text-blue-400 font-medium">{selectedUsers.length} selected</span>
                <div className="h-4 w-px bg-gray-600" />

                {selectedAllUnbanned && (
                  <button
                    onClick={() => openBanModal(null)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>🚫</span> Ban Selected
                  </button>
                )}

                <div className="h-4 w-px bg-gray-600" />
                <button
                  onClick={() => setSelectedUsers([])}
                  className="text-gray-400 hover:text-white text-sm"
                >✕</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Table ──────────────────────────────────────────────────────── */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2" />
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg mb-2">No users found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={users.length > 0 && selectedUsers.length === users.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    {['No', 'Username', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((user, i) => {
                    const banLabel = getBanLabel(user)
                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-gray-700/40 transition-colors ${selectedUsers.includes(user.id) ? 'bg-gray-700/20' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm whitespace-nowrap">
                          {(filters.pageNumber - 1) * filters.pageSize + i + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/admin/users/${user.id}`}
                            className="text-blue-400 hover:text-blue-300 font-medium font-mono transition-colors"
                          >
                            {user.userName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">{user.email || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">{user.phone || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPrimaryRoleColor(user.primaryRole)}`}>
                            {user.primaryRole}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {banLabel ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${banLabel.color}`}>
                              🚫 {banLabel.text}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800">
                              ✅ Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm font-mono">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Link
                              to={`/admin/users/detail/${user.id}`}
                              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                            >
                              View
                            </Link>
                            <Link
                              to={`/admin/users/edit/${user.id}`}
                              className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
                            >
                              Edit
                            </Link>
                            {user.isBanned ? (
                              <button
                                onClick={() => handleUnban(user)}
                                className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                              >
                                Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => openBanModal(user)}
                                className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                              >
                                Ban
                              </button>
                            )}
                            <button
                              onClick={() => handleForceLogout(user)}
                              className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                            >
                              Logout
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <AdminPagination filters={filters} totalItems={totalItems} setFilters={setFilters} />
          </>
        )}
      </div>

      {/* ─── Ban Modal ───────────────────────────────────────────────────── */}
      {banModal.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="p-6 space-y-5">
              <h3 className="text-lg font-bold text-white">
                {banModal.isMultiple
                  ? `Ban ${selectedUsers.length} User${selectedUsers.length > 1 ? 's' : ''}`
                  : `Ban "${banModal.user?.userName}"`}
              </h3>

              {/* Ban Type */}
              <div className="space-y-2">
                <p className="text-sm text-gray-400 font-medium">Ban Type</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBanForm((p) => ({ ...p, isPermanent: false }))}
                    className={`px-4 py-3 rounded-lg border font-medium text-sm transition-colors ${
                      !banForm.isPermanent
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    ⏱ Temporary
                  </button>
                  <button
                    type="button"
                    onClick={() => setBanForm((p) => ({ ...p, isPermanent: true }))}
                    className={`px-4 py-3 rounded-lg border font-medium text-sm transition-colors ${
                      banForm.isPermanent
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    🔒 Permanent
                  </button>
                </div>
              </div>

              {/* Duration (only for temp) */}
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

              {/* Reason */}
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
                  onClick={() => setBanModal({ show: false, user: null, isMultiple: false })}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanConfirm}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                    banForm.isPermanent ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  Confirm Ban
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Generic Confirm Modal ───────────────────────────────────────── */}
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
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                    confirmModal.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}