import { forwardRef } from 'react'
import clsx from 'clsx'

const Input = forwardRef(function Input(
  {
    label,
    error,
    className,
    id,
    ...props
  },
  ref
) {
  const inputId = id || props.name

  return (
    <div className="space-y-1">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      {/* Input */}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          'w-full rounded-lg border px-4 py-2 text-sm',
          'focus:outline-none focus:ring-2 transition',
          error
            ? 'border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:ring-primary-200 focus:border-primary-500',
          className
        )}
        {...props}
      />

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
