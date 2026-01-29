import PaginationBase from './PaginationBase'

export default function AdminPagination({
  filters,
  totalItems,
  setFilters,
}) {
  return (
    <PaginationBase
      page={filters.pageNumber}
      pageSize={filters.pageSize}
      totalItems={totalItems}
      showPageSize
      showGoTo
      onPageChange={(page) =>
        setFilters((prev) => ({ ...prev, pageNumber: page }))
      }
      onPageSizeChange={(size) =>
        setFilters((prev) => ({
          ...prev,
          pageSize: size,
          pageNumber: 1,
        }))
      }
      className="bg-gray-900 px-6 py-4 text-gray-300"
    />
  )
}
