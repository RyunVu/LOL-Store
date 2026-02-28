import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import AuthCard from '@/components/auth/AuthCard'

export default function RegisterPage() {
  const { register, loading, error, setError } = useAuth()

  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [formErrors, setFormErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData(prev => {
    const updated = { ...prev, [name]: value }

    if (name === 'confirmPassword' || name === 'password') {
      if (updated.confirmPassword) {
        if (updated.confirmPassword !== updated.password) {
          setFormErrors(prev => ({
            ...prev,
            confirmPassword: 'Passwords do not match'
          }))
        } else {
          setFormErrors(prev => ({
            ...prev,
            confirmPassword: ''
          }))
        }
      }
    }

    return updated
  })

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }

    if (error) setError(null)
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.userName) {
      errors.userName = 'Username is required'
    }

    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = 'Passwords do not match'
    }

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const { confirmPassword: _confirmPassword, ...payload } = formData

    await register(payload)
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-8">
      <AuthCard side="/auth-image.jpg">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              error={formErrors.userName}
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={formErrors.password}
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={formErrors.confirmPassword}
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Sign Up
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </AuthCard>
    </div>
  )
}
