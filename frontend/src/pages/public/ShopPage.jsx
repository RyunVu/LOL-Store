import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { productsApi } from '@/api/products.api'
import { categoriesApi } from '@/api/categories.api'
import ProductCard from '@/components/products/ProductCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  
  // Filters
  const [filters, setFilters] = useState({
    keyword: searchParams.get('search') || '',
    categoryId: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sort') || '',
    pageNumber: parseInt(searchParams.get('page')) || 1,
    pageSize: 20,
  })

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getCategories()
        const data = response.result || response
        setCategories(data.items || data || [])
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategories()
  }, [])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const response = await productsApi.getProducts(filters)
        const data = response.result || response
        
        setProducts(data.items || data || [])
        setTotalItems(data.metadata?.totalItems || data.length || 0)
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [filters])

  // Update URL params when filters change
  useEffect(() => {
    const params = {}
    if (filters.keyword) params.search = filters.keyword
    if (filters.categoryId) params.category = filters.categoryId
    if (filters.minPrice) params.minPrice = filters.minPrice
    if (filters.maxPrice) params.maxPrice = filters.maxPrice
    if (filters.sortBy) params.sort = filters.sortBy
    if (filters.pageNumber > 1) params.page = filters.pageNumber
    
    setSearchParams(params)
  }, [filters, setSearchParams])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      pageNumber: 1, // Reset to page 1 when filter changes
    }))
  }

  const handleClearFilters = () => {
    setFilters({
      keyword: '',
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      sortBy: '',
      pageNumber: 1,
      pageSize: 20,
    })
  }

  const totalPages = Math.ceil(totalItems / filters.pageSize)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary-900 to-dark-900 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Shop</h1>
          <p className="text-lg text-gray-300">
            Discover official League of Legends merchandise
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.keyword}
                  onChange={(e) => handleFilterChange('keyword', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Categories
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      checked={filters.categoryId === ''}
                      onChange={() => handleFilterChange('categoryId', '')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-primary-600">
                      All Products
                    </span>
                  </label>
                  {categories.map((category) => (
                    <label 
                      key={category.id}
                      className="flex items-center cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={filters.categoryId === category.id}
                        onChange={() => handleFilterChange('categoryId', category.id)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-primary-600">
                        {category.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Price Range
                </h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-gray-500 self-center">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={handleClearFilters}
                className="w-full text-sm text-primary-600 hover:text-primary-700 font-semibold"
              >
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {totalItems} {totalItems === 1 ? 'product' : 'products'} found
              </p>
              
              {/* Sort */}
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Sort by: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner />
              </div>
            ) : products.length === 0 ? (
              /* Empty State */
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={handleClearFilters}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12">
                    <button
                      onClick={() => handleFilterChange('pageNumber', filters.pageNumber - 1)}
                      disabled={filters.pageNumber === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1
                      // Show first, last, current, and adjacent pages
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= filters.pageNumber - 1 && page <= filters.pageNumber + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handleFilterChange('pageNumber', page)}
                            className={`px-4 py-2 border rounded-lg ${
                              filters.pageNumber === page
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      } else if (
                        page === filters.pageNumber - 2 ||
                        page === filters.pageNumber + 2
                      ) {
                        return <span key={page}>...</span>
                      }
                      return null
                    })}
                    
                    <button
                      onClick={() => handleFilterChange('pageNumber', filters.pageNumber + 1)}
                      disabled={filters.pageNumber === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}