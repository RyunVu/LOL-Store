import { useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'

const STATUS_CONFIG = {
  success: {
    icon: '✅',
    title: 'Payment Successful!',
    message: 'Your order has been confirmed and is being processed.',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  },
  failed: {
    icon: '❌',
    title: 'Payment Failed',
    message: 'Your payment could not be processed. Please try again.',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  },
}

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const status = searchParams.get('status') ?? 'failed'
  const orderId = searchParams.get('orderId')
  const code = searchParams.get('code')

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.failed

  // Auto redirect to orders after success
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => navigate('/profile/orders'), 5000)
      return () => clearTimeout(timer)
    }
  }, [status, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 space-y-6 text-center">
        <div className="text-6xl">{config.icon}</div>

        <div className="space-y-2">
          <h1 className={`text-2xl font-bold ${config.color}`}>{config.title}</h1>
          <p className="text-sm text-gray-500">{config.message}</p>
        </div>

        {orderId && (
          <div className={`rounded-xl border p-4 space-y-1 ${config.bg}`}>
            <p className="text-xs text-gray-500">Order ID</p>
            <p className="text-sm font-mono font-medium text-gray-800 dark:text-gray-200 break-all">
              {orderId}
            </p>
            {code && (
              <>
                <p className="text-xs text-gray-500 mt-2">Response Code</p>
                <p className="text-sm font-mono text-gray-600 dark:text-gray-400">{code}</p>
              </>
            )}
          </div>
        )}

        {status === 'success' && (
          <p className="text-xs text-gray-400">
            Redirecting to your orders in 5 seconds...
          </p>
        )}

        <div className="flex flex-col gap-3">
          {status === 'success' ? (
            <Link
              to="/profile/orders"
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              View My Orders
            </Link>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Try Again
            </button>
          )}
          <Link
            to="/"
            className="w-full py-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PaymentResultPage