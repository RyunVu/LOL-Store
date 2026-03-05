export const renderStars = (rating, size = 'text-base') => {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={`${size} ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}>
      ★
    </span>
  ))
}

export const formatDate = (dateString) => {
  if (!dateString) return '--/--/----'
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}