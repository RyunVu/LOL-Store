import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productsApi } from '@/api/products.api'
import { categoriesApi } from '@/api/categories.api'
import ProductCard from '@/components/products/ProductCard'
import HeroSection from '@/components/home/HeroSection'

export default function HomePage() {
  const [topProducts, setTopProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch top selling products
        const productsResponse = await productsApi.getTopSales(8)
        const productsData = productsResponse.result || productsResponse
        setTopProducts(productsData || [])

        // Fetch categories
        const categoriesResponse = await categoriesApi.getCategories()
        const categoriesData = categoriesResponse.result || categoriesResponse
        setCategories((categoriesData.items || categoriesData || []).slice(0, 6))
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark">
      
      {/* Hero Section - Epic Games Style */}
      <HeroSection />

      {/* Categories Section */}
      <section className="py-16 bg-gray-200 dark:bg-dark-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/shop?category=${category.id}`}
                className="group bg-surface-light dark:bg-surface-dark rounded-lg p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-2xl">
                  {category.name.charAt(0)}
                </div>
                <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark group-hover:text-primary-500 transition">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-background-light dark:bg-background-dark">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Bestsellers
              </h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Most popular items this month
              </p>
            </div>
            <Link
              to="/shop"
              className="text-primary-500 hover:text-primary-700 font-semibold flex items-center gap-2"
            >
              View All
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 dark:bg-dark-700 rounded-lg h-96 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-dark-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gold-500 rounded-full flex items-center justify-center text-dark-900 text-2xl">
                🚚
              </div>
              <h3 className="text-xl font-bold mb-2">Free Shipping</h3>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">On orders over $50</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gold-500 rounded-full flex items-center justify-center text-dark-900 text-2xl">
                ✓
              </div>
              <h3 className="text-xl font-bold mb-2">Official Merchandise</h3>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">100% authentic products</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gold-500 rounded-full flex items-center justify-center text-dark-900 text-2xl">
                ↻
              </div>
              <h3 className="text-xl font-bold mb-2">Easy Returns</h3>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">30-day return policy</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}