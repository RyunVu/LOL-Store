import { useMemo } from 'react'

export function usePagination({
  page,
  pageSize,
  totalItems,
  maxVisible = 4,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const pages = useMemo(() => {
    const result = []

    let start = Math.max(1, page - 2)
    let end = Math.min(totalPages, start + maxVisible - 1)

    start = Math.max(1, end - maxVisible + 1)

    if (start > 1) {
      result.push(1)
      if (start > 2) result.push('...')
    }

    for (let i = start; i <= end; i++) {
      result.push(i)
    }

    if (end < totalPages) {
      if (end < totalPages - 1) result.push('...')
      result.push(totalPages)
    }

    return result
  }, [page, totalPages, maxVisible])

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    pages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  }
}
