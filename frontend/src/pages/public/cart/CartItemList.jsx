import { Link } from 'react-router-dom'

export function CartItemList({ items, getItemPrice, updateQuantity, removeItem, onClearAll }) {
  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
        <h2 className="font-bold text-text-primary-light dark:text-text-primary-dark">
          Items ({items.length})
        </h2>
        <button
          onClick={onClearAll}
          className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
        >
          Clear All
        </button>
      </div>

      <ul className="divide-y divide-border-light dark:divide-border-dark">
        {items.map((item) => {
          const price = getItemPrice(item)
          const img =
            item.pictures?.find((p) => p.isActive)?.path ??
            item.pictures?.[0]?.path ??
            null

          return (
            <li
              key={item.id}
              className="p-5 flex gap-4 hover:bg-gray-50 dark:hover:bg-dark-800/40 transition-colors"
            >
              {/* Image */}
              <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-dark-700">
                {img ? (
                  <img src={img} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${item.id}`}
                  className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark hover:text-primary-500 transition-colors line-clamp-2"
                >
                  {item.name}
                </Link>
                {item.sku && (
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono mt-0.5">
                    {item.sku}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {item.discount > 0 && (
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark line-through">
                      ${item.price.toFixed(2)}
                    </span>
                  )}
                  <span className="text-sm font-bold text-primary-500">${price.toFixed(2)}</span>
                  {item.discount > 0 && (
                    <span className="text-xs bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-md font-semibold">
                      -{item.discount}%
                    </span>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="shrink-0 flex flex-col items-end justify-between gap-2">
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove item"
                  className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors text-2xl leading-none"
                >
                  ×
                </button>

                <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-700 rounded-xl p-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-dark-600 text-text-primary-light dark:text-text-primary-dark font-black text-base transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-dark-600 text-text-primary-light dark:text-text-primary-dark font-black text-base transition-colors"
                  >
                    +
                  </button>
                </div>

                <p className="text-sm font-black text-text-primary-light dark:text-text-primary-dark">
                  ${(price * item.quantity).toFixed(2)}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}