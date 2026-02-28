export function DiscountSection({
  discountInput,
  setDiscountInput,
  discountCode,
  discountData,
  discountError,
  discountLoading,
  subtotal,
  onApply,
  onRemove,
}) {
  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm p-5">
      <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
        🏷️ Discount Code
      </h3>

      {discountData ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
            <div>
              <span className="font-mono font-black text-green-400">{discountCode}</span>
              <span className="text-green-400 text-sm ml-2">
                {discountData.isPercentage
                  ? `${discountData.discountValue}% off`
                  : `$${discountData.discountValue.toFixed(2)} off`}
              </span>
            </div>
            <button
              onClick={onRemove}
              className="text-green-400 hover:text-red-400 text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
          {discountData.minimumOrderAmount > 0 && subtotal < discountData.minimumOrderAmount && (
            <p className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-xl px-3 py-2">
              Add{' '}
              <span className="font-bold">
                ${(discountData.minimumOrderAmount - subtotal).toFixed(2)}
              </span>{' '}
              more to unlock this discount (min. ${discountData.minimumOrderAmount.toFixed(2)})
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && onApply()}
              placeholder="Enter code..."
              className="flex-1 px-4 py-2.5 text-sm border border-border-light dark:border-border-dark rounded-xl
                bg-white dark:bg-dark-800 text-text-primary-light dark:text-text-primary-dark
                placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark
                font-mono uppercase tracking-widest
                focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
            />
            <button
              onClick={onApply}
              disabled={discountLoading || !discountInput.trim()}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 shrink-0"
            >
              {discountLoading ? '...' : 'Apply'}
            </button>
          </div>
          {discountError && <p className="text-red-400 text-xs mt-2">{discountError}</p>}
        </>
      )}
    </div>
  )
}