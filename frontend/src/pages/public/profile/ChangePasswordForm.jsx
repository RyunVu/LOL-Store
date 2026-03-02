import { FormField } from '@/components/form/FormField'
import { inputCls } from '@/components/form/formStyles'

export function ChangePasswordForm({
  pwForm,
  setPwForm,
  pwErrors,
  setPwErrors,
  pwLoading,
  pwSuccess,
  onSubmit,
}) {
  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm">
      <div className="p-6 border-b border-border-light dark:border-border-dark">
        <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
          Change Password
        </h2>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
          Keep your account secure
        </p>
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-5 max-w-md">
        {pwSuccess && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3">
            ✓ Password changed successfully!
          </div>
        )}
        {pwErrors.submit && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
            {pwErrors.submit}
          </div>
        )}

        <FormField label="Current Password" error={pwErrors.oldPassword}>
          <input
            type="password"
            value={pwForm.oldPassword}
            onChange={(e) => {
              setPwForm((p) => ({ ...p, oldPassword: e.target.value }))
              setPwErrors((p) => ({ ...p, oldPassword: undefined }))
            }}
            placeholder="••••••••"
            className={inputCls(pwErrors.oldPassword)}
            autoComplete="current-password"
          />
        </FormField>

        <FormField label="New Password" error={pwErrors.newPassword}>
          <input
            type="password"
            value={pwForm.newPassword}
            onChange={(e) => {
              setPwForm((p) => ({ ...p, newPassword: e.target.value }))
              setPwErrors((p) => ({ ...p, newPassword: undefined }))
            }}
            placeholder="••••••••"
            className={inputCls(pwErrors.newPassword)}
            autoComplete="new-password"
          />
        </FormField>

        <FormField label="Confirm New Password" error={pwErrors.confirmPassword}>
          <input
            type="password"
            value={pwForm.confirmPassword}
            onChange={(e) => {
              setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))
              setPwErrors((p) => ({ ...p, confirmPassword: undefined }))
            }}
            placeholder="••••••••"
            className={inputCls(pwErrors.confirmPassword)}
            autoComplete="new-password"
          />
        </FormField>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pwLoading}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  )
}