import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ordersApi } from '@/api/orders.api'
import OrderForm from './OrderForm'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function OrderEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    setFetchLoading(true)
    ordersApi
      .getOrderById(id)
      .then((data) => {
        setOrder(data)
      })
      .catch((error) => {
        console.error('Failed to fetch order:', error)
        alert('Failed to load order')
        navigate('/admin/orders')
      })
      .finally(() => {
        setFetchLoading(false)
      })
  }, [id, navigate])

  useEffect(() => {
    console.log(order);
  }, [order]);
  const handleUpdate = async (formData) => {
    setLoading(true)
    try {
      await ordersApi.updateOrder(id, formData)

      navigate('/admin/orders')
    } catch (error) {
      console.error('Failed to update order:', error)
      alert('Failed to update order. Please try again.')
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

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Order not found</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-8 space-y-3">
        {/* Back button */}
        <button
          onClick={() => navigate('/admin/orders')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </button>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Edit Order
          </h1>
          <p className="text-gray-600 mt-1">
            Update order information
          </p>
        </div>
      </div>

      <OrderForm
        initialData={order}
        onSubmit={handleUpdate}
        submitText="Update Order"
        loading={loading}
      />
    </div>
  )
}
