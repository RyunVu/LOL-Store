export function ConfirmModal({ open, title, message, onConfirm, onCancel, danger = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-dark-700 shadow-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">{title}</h3>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 dark:border-dark-600 text-text-primary-light dark:text-text-primary-dark rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}