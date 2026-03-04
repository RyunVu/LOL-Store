const StarDisplay = ({ rating, size = 'base' }) => (
  <div className={`flex ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ))}
  </div>
)

export default StarDisplay