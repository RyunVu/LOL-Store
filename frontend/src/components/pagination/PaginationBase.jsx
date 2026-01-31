import { usePagination } from './usePagination'

export default function PaginationBase({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  showPageSize = false,
  showGoTo = false,
  className = '',
}) {
  const {
    pages,
    totalPages,
    hasPrev,
    hasNext,
  } = usePagination({
    page,
    pageSize,
    totalItems,
  })

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
      {/* Page size */}
      {showPageSize && (
        <div className="flex items-center gap-2 text-sm">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {[5, 10, 20, 50].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span>items</span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <button
          disabled={!hasPrev}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`}>…</span>
          ) : (
            <button
              key={`page-${p}-${i}`}
              onClick={() => onPageChange(p)}
              className={p === page ? 'font-bold underline' : ''}
            >
              {p}
            </button>
          )
        )}

        <button
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>

      {/* Go to */}
      {showGoTo && (
        <input
          type="number"
          min={1}
          max={totalPages}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const p = Math.min(
                totalPages,
                Math.max(1, Number(e.target.value))
              )
              onPageChange(p)
            }
          }}
          className="w-16 border rounded px-2 py-1"
        />
      )}
    </div>
  )
}
