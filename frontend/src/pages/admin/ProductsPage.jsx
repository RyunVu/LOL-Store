import { useEffect, useState } from 'react'
import { getProducts } from '@/api/products.api'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts()
        console.log('Fetched products:', data)
        setProducts(data)
      } catch (err) {
        console.error(err)
        setError('Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return <p className="text-gray-500">Loading products...</p>
  }

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Manage Products</h2>

      <div className="bg-white p-6 rounded-lg shadow">
        {products.length === 0 ? (
          <p className="text-gray-600">No products found</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Price</th>
                <th className="text-left p-3">Stock</th>
                <th className="text-left p-3">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3">${p.price}</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3">{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
