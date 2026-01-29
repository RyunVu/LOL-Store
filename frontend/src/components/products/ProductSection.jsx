import ProductCard from './ProductCard'
import ShopPagination from '@/components/pagination/ShopPagination'

export default function ProductSection({
  products,
  loading,
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
}) {
  if (loading) {
    return <div className="text-center py-10">Loading products...</div>
  }

  if (!products.length) {
    return <div className="text-center py-10">No products found.</div>
  }

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <>
      {/* Result info */}
      <p className="text-sm text-gray-500 mb-4" id="product-results">
        Showing {start}–{end} of {totalItems} products
      </p>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex justify-center">
            <ShopPagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={onPageChange}
            />
        </div>
        )}
    </>
  )
}