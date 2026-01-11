import  React, { useEffect, useState } from 'react'
import { getCategories } from '../../api/category.api'

export default function CategorysPage() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategories()
                console.log('Fetching categories:', data)
                setCategories(data)
            } catch (err) {
                console.error(err)
                setError('Failed to load categories')                 
            } finally {
                setLoading(false)
            }
        }

        fetchCategories()
    }, [])

    if (loading) {
        return <p className="text-gray-500">Loading categories...</p>
    }

    if (error) {
        return <p className="text-red-500">{error}</p>
    }
    
  return (
    <div>
        <h2 className="text-2xl font-bold mb-6">Manage Categories</h2>
        <div className="bg-white p-6 rounded-lg shadow">
            {categories.length === 0 ? (
                <p className="text-gray-600">No categories found</p>
            ) : (
                <ul>
                    {categories.map((category) => (
                        <li key={category.id} className="border-b py-2">
                            <span className="font-medium">{category.name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
            
    </div>
  )
}