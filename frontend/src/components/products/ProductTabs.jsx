import { useState } from 'react'
import ProductFeedback from '../feedback/ProductFeedback'

const ProductTabs = ({ description, productId }) => {
  const [activeTab, setActiveTab] = useState('description')

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'feedback', label: 'Reviews' },
  ]

  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      {/* Tab Headers */}
      <div className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-1 text-xl border-b-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === 'description' && (
          <div className="prose max-w-none">
            <p className="text-gray-700 dark:text-gray-300 text-lg whitespace-pre-wrap">
              {description || 'No description available'}
            </p>
          </div>
        )}

        {activeTab === 'feedback' && (
          <ProductFeedback productId={productId} />
        )}
      </div>
    </div>
  )
}

export default ProductTabs