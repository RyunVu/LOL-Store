import { useState, useEffect } from 'react'

const EMPTY_FORM = {
  name: '',
  description: '',
  isActive: true,
}

export default function CategoryForm({
  initialData,
  onSubmit,
  submitText,
  loading = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (!initialData) return

    setForm({
      ...EMPTY_FORM,
      ...initialData,
    })
  }, [initialData])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === 'name') {
    setForm(prev => {

        return {
        ...prev,
        name: value,
        }
    })
    return
    }

    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

    const handleSubmit = (e) => {
    e.preventDefault()

    if (!form.name.trim()) {
        alert('Category name is required')
        return
    }

    const payload = {
        name: form.name,
        urlSlug: form.urlSlug,
        description: form.description,
        isActive: form.isActive,
    }

    onSubmit(payload)
    }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white rounded-lg shadow-base p-6"
    >
      {/* Basic Information */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              name="name"
              placeholder="Electronics"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              URL Slug
            </label>
            <input
              name="urlSlug"
              placeholder="electronics"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              value={form.urlSlug}
              onChange={handleChange}
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-generated from category name
            </p>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Category description..."
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={5}
              value={form.description}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-xl font-semibold mb-4">Display Settings</h2>
        
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
            className="w-5 h-5 accent-blue-600"
          />
          <div>
            <span className="text-base font-medium">Show on Menu</span>
            <p className="text-sm text-gray-500">
              Display this category in the navigation menu
            </p>
          </div>
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4 pt-6 border-t">
        <button
          type="submit"
          disabled={loading}
          className="text-base flex-1 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : submitText}
        </button>
      </div>
    </form>
  )
}