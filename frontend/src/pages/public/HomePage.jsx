export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-900 to-dark-900 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Welcome to LoL Store
          </h1>
          <p className="text-xl mb-8">
            Official League of Legends Merchandise
          </p>
          <a
            href="/shop"
            className="inline-block bg-gold-500 text-dark-900 px-8 py-3 rounded-lg font-semibold hover:bg-gold-600 transition"
          >
            Shop Now
          </a>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Featured Products
          </h2>
          <div className="text-center text-gray-600">
            Products will appear here...
          </div>
        </div>
      </section>
    </div>
  )
}