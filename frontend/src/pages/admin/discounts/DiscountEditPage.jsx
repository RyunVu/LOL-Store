import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { discountsApi } from '@/api/discounts.api'
import DiscountForm from './DiscountForm'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function DiscountEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [discount, setDiscount] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  useEffect(() => {
    setFetchLoading(true)
    console.log(discountsApi.getDiscountById(id));
    
    discountsApi
      .getDiscountById(id)
      .then((data) => {
        setDiscount(data)
      })
      .catch((err) => {
        console.error('Failed to fetch discount:', err)
        alert('Failed to load discount')
        navigate('/admin/discounts')
      })
      .finally(() => {
        setFetchLoading(false)
      })
  }, [id, navigate])

  const handleUpdate = async (formData) => {
    setLoading(true)
    try {
      await discountsApi.updateDiscount(id, formData)    
      navigate('/admin/discounts')
    } catch (error) {
      console.error('Failed to update discount:', error)
      alert('Failed to update discount. Please try again.')
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

  if (!discount) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Discount not found</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-8 space-y-3">
        {/* Back button */}
        <button
          onClick={() => navigate('/admin/discounts')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Discounts
        </button>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Edit Discount
          </h1>
          <p className="text-gray-600 mt-1">
            Update discount information
          </p>
        </div>
      </div>

      <DiscountForm
        initialData={discount}
        onSubmit={handleUpdate}
        submitText="Update Discount"
        loading={loading}
      />
    </div>
  )
}