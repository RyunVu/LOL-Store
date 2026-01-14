import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'

export default function LoginPage() {
  const { login, loading, error, setError } = useAuth()

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  })

  const [formErrors, setFormErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (error) setError(null)
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.identifier) {
      errors.identifier = 'Username or email is required'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
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

    await login(formData)
  }

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-2xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gold-500 mb-2">LoL Store</h1>
        <h2 className="text-2xl font-semibold text-gray-800">Welcome Back</h2>
        <p className="text-gray-600 mt-2">Sign in to your account</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username or Email"
          type="text"
          name="identifier"
          placeholder="username or email"
          value={formData.identifier}
          onChange={handleChange}
          error={formErrors.identifier}
          autoComplete="username"
        />

        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          error={formErrors.password}
        />

        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-600 font-semibold">
          Sign up
        </Link>
      </p>
    </div>
  )
}
