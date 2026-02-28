import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { productsApi } from '@/api/products.api'
import { categoriesApi } from '@/api/categories.api'
import ProductSection from '@/components/products/ProductSection'
import { useDebounce } from '@/hooks/useDebounce'
import CustomSelect from '@/components/common/CustomSelect' // Import the custom select
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [priceDraft, setPriceDraft] = useState([0, 1000])

  const [filters, setFilters] = useState({
    keyword: searchParams.get('search') || '',
    categoryId: searchParams.get('category') || '',
    minPrice: Number(searchParams.get('minPrice')) || 0,
    maxPrice: Number(searchParams.get('maxPrice')) || 1000,

    sortColumn: searchParams.get('sortColumn') || '',
    sortOrder: searchParams.get('sortOrder') || 'Desc',

    pageNumber: Number(searchParams.get('page')) || 1,
    pageSize: 20,
  })

  const debouncedKeyword = useDebounce(filters.keyword, 500)

  const {
    categoryId,
    minPrice,
    maxPrice,
    sortColumn,
    sortOrder,
    pageNumber,
    pageSize,
  } = filters
  
  useEffect(() => {
    setPriceDraft([filters.minPrice, filters.maxPrice])
  }, [filters.minPrice, filters.maxPrice])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoriesApi.getCategories()
        const data = res?.result ?? res

        const visibleCategories =
          (data?.items ?? []).filter(
            (c) => c.isActive
          )
        
        setCategories(visibleCategories)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        setCategories([])
      }
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
        sortColumn,
        sortOrder,
        pageNumber,
        pageSize,
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
    sortColumn,
    sortOrder,
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
    if (filters.sortColumn) params.sortColumn = filters.sortColumn
    if (filters.sortOrder) params.sortOrder = filters.sortOrder
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
      minPrice: 0,
      maxPrice: 1000,
      sortColumn: '',
      sortOrder: 'Desc',
      pageNumber: 1,
      pageSize: 20,
    })
  }

  // Prepare category options for CustomSelect
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(c => ({ value: c.id, label: c.name }))
  ]

  // Prepare sort options for CustomSelect
  const sortOptions = [
    { value: '', label: 'Default' },
    { value: 'FinalPrice_Asc', label: 'Price: Low → High' },
    { value: 'FinalPrice_Desc', label: 'Price: High → Low' },
    { value: 'Name_Asc', label: 'Name: A → Z' },
    { value: 'Name_Desc', label: 'Name: Z → A' },
    { value: 'CreatedAt_Desc', label: 'Newest' },
  ]

  const totalPages = Math.ceil(totalItems / pageSize)

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Hero */}
      <div className="bg-linear-to-r from-primary-900 to-dark-900 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Shop</h1>
          <p className="text-text-secondary-dark">
            Discover official League of Legends merchandise
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0" id="sidebar-anchor">
          <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm p-6 lg:sticky lg:top-20 border border-border-light dark:border-border-dark">
            
            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search products..."
                value={filters.keyword}
                onChange={(e) =>
                  handleFilterChange('keyword', e.target.value)
                }
                className="w-full px-4 py-2.5 border border-border-light dark:border-border-dark rounded-lg 
                bg-white dark:bg-dark-800 
                text-text-primary-light dark:text-text-primary-dark
                placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark
                focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                hover:border-gray-400 dark:hover:border-gray-500
                transition-all"
              />
            </div>

            {/* Categories - Using Custom Select */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                Category
              </label>
              <CustomSelect
                value={categoryId}
                onChange={(value) => handleFilterChange('categoryId', value)}
                options={categoryOptions}
                placeholder="All Categories"
              />
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
                Price Range
              </p>

              {/* Price labels */}
              <div className="flex justify-between text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">
                <span>${priceDraft[0]}</span>
                <span>${priceDraft[1]}</span>
              </div>

              {/* Slider */}
              <Slider
                range
                min={0}
                max={1000}
                step={10}
                value={priceDraft}
                onChange={(value) => {
                  setPriceDraft(value)
                }}
                onChangeComplete={([min, max]) => {
                  setFilters((prev) => ({
                    ...prev,
                    minPrice: min,
                    maxPrice: max,
                    pageNumber: 1,
                  }))
                }}
                styles={{
                  track: {
                    backgroundColor: '#6366F1',
                    height: 6,
                  },
                  rail: {
                    backgroundColor: '#E5E7EB',
                    height: 6,
                  },
                  handle: {
                    borderColor: '#EAB308',
                    backgroundColor: '#020617',
                    boxShadow: '0 0 0 4px rgba(99,102,241,0.25)',
                  },
                }}
              />
            </div>

            {/* Sort By - Using Custom Select */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                Sort By
              </label>
              <CustomSelect
                value={
                  filters.sortColumn
                    ? `${filters.sortColumn}_${filters.sortOrder}`
                    : ''
                }
                onChange={(value) => {
                  if (!value) {
                    setFilters((prev) => ({
                      ...prev,
                      sortColumn: '',
                      sortOrder: 'Desc',
                      pageNumber: 1,
                    }))
                    return
                  }

                  const [column, order] = value.split('_')

                  setFilters((prev) => ({
                    ...prev,
                    sortColumn: column,
                    sortOrder: order,
                    pageNumber: 1,
                  }))
                }}
                options={sortOptions}
                placeholder="Default"
              />
            </div>

            {/* Clear Filters */}
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2.5 text-sm font-medium 
              text-text-primary-light dark:text-text-primary-dark
              bg-gray-100 dark:bg-dark-700 
              hover:bg-gray-200 dark:hover:bg-dark-800 
              rounded-lg transition-colors border border-border-light dark:border-border-dark"
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