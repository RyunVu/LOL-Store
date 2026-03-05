export const REPORT_STATUS = {
  Pending: 'Pending',
  Reviewed: 'Reviewed',
  Actioned: 'Actioned',
}

export const statusColors = {
  Pending: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800',
  Reviewed: 'bg-blue-900/30 text-blue-400 border border-blue-800',
  Actioned: 'bg-green-900/30 text-green-400 border border-green-800',
}

export const statusIcons = {
  Pending: '⏳',
  Reviewed: '👁',
  Actioned: '✅',
}

export const getBaseUrl = () =>
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? ''

export const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}