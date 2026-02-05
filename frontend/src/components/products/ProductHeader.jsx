const ProductHeader = ({ product }) => {
  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {product.name}
          </h1>
          <p className="text-lg text-gray-600">
            SKU: {product.sku}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-green-600">
            ${product.price.toFixed(2)}
          </p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
            product.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {product.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ProductHeader
