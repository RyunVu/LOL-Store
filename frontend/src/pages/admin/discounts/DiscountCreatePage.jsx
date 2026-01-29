import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { discountsApi } from '@/api/discounts.api'
import DiscountForm from './DiscountForm'

export default function DiscountCreatePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleCreate = async (formData) => {
    setLoading(true)
    try {
      await discountsApi.createDiscount(formData)
      navigate('/admin/discounts')
    } catch (error) {
      console.error('Failed to create discount:', error)
      alert('Failed to create discount. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/discounts')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Discounts
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create Discount</h1>
        <p className="text-gray-600 mt-1">Add a new discount code</p>
      </div>

      <DiscountForm
        initialData={{
          code: '',
          discountValue: 0,
          isPercentage: true,
          minimumOrderAmount: '',
          maxUses: '',
          startDate: '',
          endDate: '',
          isActive: true,
        }}
        onSubmit={handleCreate}
        submitText="Create Discount"
        loading={loading}
      />
    </div>
  )
}