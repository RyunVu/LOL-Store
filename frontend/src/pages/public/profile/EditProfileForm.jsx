import { FormField, inputCls } from '@/components/ui/FormField'

export function EditProfileForm({
  user,
  editForm,
  setEditForm,
  editErrors,
  setEditErrors,
  editLoading,
  editSuccess,
  onSubmit,
}) {
  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm">
      <div className="p-6 border-b border-border-light dark:border-border-dark">
        <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Edit Profile</h2>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
          Update your personal information
        </p>
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-5">
        {editSuccess && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3">
            ✓ Profile updated successfully!
          </div>
        )}
        {editErrors.submit && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
            {editErrors.submit}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Full Name" required error={editErrors.name}>
            <input
              value={editForm.name}
              onChange={(e) => {
                setEditForm((p) => ({ ...p, name: e.target.value }))
                setEditErrors((p) => ({ ...p, name: undefined }))
              }}
              placeholder="Your name"
              className={inputCls(editErrors.name)}
            />
          </FormField>

          <FormField label="Email" required error={editErrors.email}>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => {
                setEditForm((p) => ({ ...p, email: e.target.value }))
                setEditErrors((p) => ({ ...p, email: undefined }))
              }}
              placeholder="your@email.com"
              className={inputCls(editErrors.email)}
            />
          </FormField>

          <FormField label="Phone">
            <input
              type="tel"
              value={editForm.phone}
              onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+1 234 567 8900"
              className={inputCls()}
            />
          </FormField>
        </div>

        <FormField label="Address">
          <textarea
            value={editForm.address}
            onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="Your shipping address"
            rows={3}
            className={`${inputCls()} resize-none`}
          />
        </FormField>

        {/* Read-only */}
        <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-4 text-sm">
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-2">
            Cannot be changed
          </p>
          <p className="text-text-primary-light dark:text-text-primary-dark">
            Username: <span className="font-mono">@{user.userName}</span>
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={editLoading}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}