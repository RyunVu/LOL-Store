import { useState } from 'react'

const ProductTabs = ({ description, feedback }) => {
  const [activeTab, setActiveTab] = useState('description')

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'feedback', label: 'Feedback' }
  ]

  return (
    <div className="border-t border-gray-200">
      <div className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-1 text-xl border-b-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-6">
        {activeTab === 'description' && (
          <div className="prose max-w-none">
            <p className="text-gray-700 text-lg whitespace-pre-wrap">
              {description || 'No description available'}
            </p>
          </div>
        )}


        {activeTab === 'feedback' && (
          <div>
            {feedback && feedback.length > 0 ? (
              <div className="space-y-4">
                {feedback.map((item) => (
                  <div key={item.id} className="border-b border-gray-200 pb-4">
                    <div className="flex items-center mb-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < item.rating ? 'text-yellow-400 text-lg' : 'text-gray-300 text-lg'}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="ml-2 text-gray-600 text-lg">
                        {item.rating}/5
                      </span>
                    </div>
                    <p className="text-gray-700 text-lg">{item.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-lg">No feedback available</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductTabs
