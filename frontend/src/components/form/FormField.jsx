export function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}