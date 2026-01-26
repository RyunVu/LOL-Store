import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { productsApi } from '@/api/products.api'
import { categoriesApi } from '@/api/categories.api'
import ProductSection from '@/components/products/ProductSection'
import { useDebounce } from '@/hooks/useDebounce'

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)

  const [filters, setFilters] = useState({
    keyword: searchParams.get('search') || '',
    categoryId: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sort') || '',
    pageNumber: Number(searchParams.get('page')) || 1,
    pageSize: 20,
  })

  const debouncedKeyword = useDebounce(filters.keyword, 500)

  const {
    categoryId,
    minPrice,
    maxPrice,
    sortBy,
    pageNumber,
    pageSize,
  } = filters

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await categoriesApi.getCategories()
      const data = res?.result ?? res
      setCategories(data?.items ?? [])
    }
    fetchCategories()
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        keyword: debouncedKeyword,
        categoryId,
        minPrice,
        maxPrice,
        sortBy,
        pageNumber,
        pageSize,
      }
      
      if (sortBy) {
        switch (sortBy) {
          case 'price_asc':
            params.sortColumn = 'finalPrice' 
            params.sortOrder = 'asc'
            break

          case 'price_desc':
            params.sortColumn = 'finalPrice'
            params.sortOrder = 'desc'
            break

          case 'name_asc':
            params.sortColumn = 'name'
            params.sortOrder = 'asc'
            break

          case 'name_desc':
            params.sortColumn = 'name'
            params.sortOrder = 'desc'
            break

          case 'newest':
            params.sortColumn = 'createDate'
            params.sortOrder = 'desc'
            break
        }
      }

      Object.keys(params).forEach(
        (k) => (params[k] === '' || params[k] == null) && delete params[k]
      )

      const res = await productsApi.getProducts(params)
      const data = res?.result ?? res

      setProducts(data?.items ?? [])
      setTotalItems(data?.metadata?.totalItemCount ?? 0)
    } finally {
      setLoading(false)
    }
  }, [
    debouncedKeyword,
    categoryId,
    minPrice,
    maxPrice,
    sortBy,
    pageNumber,
    pageSize,
  ])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

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
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      pageNumber: key === 'pageNumber' ? value : 1,
    }))
    
    // Scroll to sidebar sticky point when page changes
    if (key === 'pageNumber') {
      setTimeout(() => {
        const sidebarAnchor = document.getElementById('sidebar-anchor')
        if (sidebarAnchor) {
          const yOffset = -80 
          const y = sidebarAnchor.getBoundingClientRect().top + window.pageYOffset + yOffset
          window.scrollTo({ top: y, behavior: 'smooth' })
        }
      }, 100)
    }
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

  const totalPages = Math.ceil(totalItems / pageSize)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-linear-to-r from-primary-900 to-dark-900 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Shop</h1>
          <p className="text-gray-300">
            Discover official League of Legends merchandise
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0" id="sidebar-anchor">
          <div className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-20">
            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search products..."
                value={filters.keyword}
                onChange={(e) =>
                  handleFilterChange('keyword', e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Categories */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Categories</p>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="radio"
                    checked={categoryId === ''}
                    onChange={() => handleFilterChange('categoryId', '')}
                    className="mr-3 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">All Categories</span>
                </label>

                {categories.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="radio"
                      checked={categoryId === c.id}
                      onChange={() => handleFilterChange('categoryId', c.id)}
                      className="mr-3 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Price Range</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={filters.minPrice}
                    onChange={(e) =>
                      handleFilterChange('minPrice', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                  <input
                    type="number"
                    placeholder="1000"
                    min="0"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      handleFilterChange('maxPrice', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Sort By */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Default</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </aside>

        {/* Products */}
        <main className="flex-1">
          <ProductSection
            products={products}
            loading={loading}
            page={pageNumber}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={(page) =>
              handleFilterChange('pageNumber', page)
            }
          />
        </main>
      </div>
    </div>
  )
}