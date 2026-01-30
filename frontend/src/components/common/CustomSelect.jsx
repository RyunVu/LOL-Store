import { useState, useRef, useEffect } from 'react'

export default function CustomSelect({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select...",
  className = "" 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Select Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full appearance-none 
        bg-white dark:bg-dark-800 
        text-text-primary-light dark:text-text-primary-dark
        border border-border-light dark:border-border-dark 
        rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-left
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
        hover:border-gray-400 dark:hover:border-gray-500 
        transition-all cursor-pointer shadow-sm"
      >
        <span className={selectedOption?.value ? '' : 'text-text-muted-light dark:text-text-muted-dark'}>
          {selectedOption?.label || placeholder}
        </span>

        {/* Chevron Icon */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 9l-7 7-7-7" 
            />
          </svg>
        </span>
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 
        bg-white dark:bg-dark-800 
        border border-border-light dark:border-border-dark 
        rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium
                transition-colors
                ${option.value === value 
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
                  : 'text-text-primary-light dark:text-text-primary-dark hover:bg-gray-500 dark:hover:bg-dark-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}