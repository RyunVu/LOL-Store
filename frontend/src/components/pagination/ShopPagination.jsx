import { usePagination } from './usePagination'

export default function ShopPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}) {
  const { pages, totalPages, hasPrev, hasNext } = usePagination({
    page,
    pageSize,
    totalItems,
  })

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Page info */}
      <p className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </p>

      {/* Pagination buttons */}
      <div className="flex items-center gap-2">
        <button
          disabled={!hasPrev}
          onClick={() => onPageChange(page - 1)}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Prev
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={i} className="px-2 text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-10 px-3 py-2 border rounded-lg transition-colors ${
                p === page
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}