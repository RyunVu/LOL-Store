import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usersApi } from '@/api/users.api'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function UserEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!id) return
    setFetchLoading(true)
    usersApi
      .getUserById(id)
      .then((data) => {
        setUser(data)
        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
        })
      })
      .catch((err) => {
        console.error('Failed to fetch user:', err)
        alert('Failed to load user')
        navigate('/admin/users')
      })
      .finally(() => setFetchLoading(false))
  }, [id, navigate])

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format'
    return errs
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      await usersApi.updateUser(id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      })
      navigate(`/admin/users/${id}`)
    } catch (err) {
      console.error('Failed to update user:', err)
      alert('Failed to update user. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return <div className="text-center py-20 text-gray-400">User not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      {/* Back */}
      <button
        onClick={() => navigate(`/admin/users/detail/${id}`)}
        className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to User Details
      </button>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Edit User</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Editing <span className="text-blue-400 font-mono">@{user.userName}</span>
        </p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-6">
          
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="John Doe"
              className={`w-full bg-gray-900 border text-white text-sm rounded-lg px-4 py-3 focus:ring-2 focus:outline-none placeholder-gray-600 transition-colors ${
                errors.name
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-600 focus:ring-blue-500'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className={`w-full bg-gray-900 border text-white text-sm rounded-lg px-4 py-3 focus:ring-2 focus:outline-none placeholder-gray-600 transition-colors ${
                errors.email
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-600 focus:ring-blue-500'
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+1 234 567 8900"
              className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-600"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Address
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="123 Main St, City, Country"
              rows={3}
              className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-600 resize-none"
            />
          </div>

          {/* Read-only info */}
          <div className="bg-gray-900/50 rounded-lg p-4 space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Read-only Info</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Username: </span>
                <span className="text-gray-300 font-mono">@{user.userName}</span>
              </div>
              <div>
                <span className="text-gray-500">Role: </span>
                <span className="text-gray-300">{user.primaryRole}</span>
              </div>
              <div>
                <span className="text-gray-500">Status: </span>
                <span className={user.isBanned ? 'text-red-400' : 'text-green-400'}>
                  {user.isBanned ? 'Banned' : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/admin/users/detail/${id}`)}
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}