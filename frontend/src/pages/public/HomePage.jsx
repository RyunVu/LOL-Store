import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productsApi } from '@/api/products.api'
import { categoriesApi } from '@/api/categories.api'
import ProductCard from '@/components/products/ProductCard'
import HeroSection from '@/components/home/HeroSection'
import AcrylicImage from '@/assets/images/A.jpg'
import FigureImage from '@/assets/images/F.jpg'
import StatueImage from '@/assets/images/S.jpg'

export default function HomePage() {
  const [topProducts, setTopProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const getCategoryBackgroundImage = (categoryName) => {
    switch (categoryName) {
      case 'Acrylics':
        return AcrylicImage
      case 'Figurines':
        return FigureImage
      case 'Statues':
        return StatueImage
      default:
        return null
    }
  }

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
                className="group relative h-40 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-gray-800"
              >
                {/* Background image layer */}
                {getCategoryBackgroundImage(category.name) && (
                  <div
                    className="absolute inset-0 bg-center bg-cover bg-no-repeat transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${getCategoryBackgroundImage(category.name)})`,
                    }}
                  />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/40 to-black/10 group-hover:from-black/80 transition-colors" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 mb-3 opacity-70 bg-white/90 dark:bg-dark-900/80 rounded-full flex items-center justify-center text-xl font-bold text-primary-600 shadow">
                    {category.name.charAt(0)}
                  </div>

                  <h3 className="text-white font-semibold text-lg tracking-wide">
                    {category.name}
                  </h3>
                </div>
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