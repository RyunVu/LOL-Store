export function inputCls(hasError) {
  return [
    'w-full px-4 py-2.5 rounded-xl border text-sm transition-all',
    'bg-white dark:bg-dark-800',
    'text-text-primary-light dark:text-text-primary-dark',
    'placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark',
    'focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-400 focus:ring-red-400/30'
      : 'border-border-light dark:border-border-dark focus:ring-primary-500/30 focus:border-primary-500',
  ].join(' ')
}