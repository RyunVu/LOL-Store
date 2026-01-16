import { useState, useEffect, useMemo } from 'react'

const EMPTY_FORM = {
  name: '',
  sku: '',
  urlSlug: '',
  price: 0,
  quantity: 0,
  discount: 0,
  supplierId: '',
  categoryIds: [],
  description: '',
  note: '',
  active: true,
  editReason: '',
}

export default function ProductForm({
  initialData,
  categories = [],
  suppliers = [],
  existingImages = [],
  onSubmit,
  submitText,
  requireEditReason = false,
  loading = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [newImageFiles, setNewImageFiles] = useState([])
  const [newImagePreviews, setNewImagePreviews] = useState([])
  const [removedExistingImages, setRemovedExistingImages] = useState([])

  useEffect(() => {
    if (initialData) {
      setForm({
        ...EMPTY_FORM,
        ...initialData,
        categoryIds: initialData.categoryIds ?? [],
        supplierId: initialData.supplierId ?? '',
      })
    }
  }, [initialData])

  /* =========================
   * Derived helpers
   * ========================= */
  const inactiveCategoryIds = useMemo(
    () => categories.filter(c => c.isDeleted).map(c => c.id),
    [categories]
  )

  /* =========================
   * Handlers
   * ========================= */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    // Auto-generate URL slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setForm(prev => ({
        ...prev,
        name: value,
        urlSlug: slug,
      }))
      return
    }

    setForm(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
          ? Number(value)
          : value,
    }))
  }

  const handleCategoryChange = (id) => {
    setForm(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter(x => x !== id)
        : [...prev.categoryIds, id],
    }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    setNewImageFiles(prev => [...prev, ...files])

    // Create previews
    const previews = files.map(file => URL.createObjectURL(file))
    setNewImagePreviews(prev => [...prev, ...previews])
  }

  const removeNewImage = (index) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index))
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (imageId) => {
    setRemovedExistingImages(prev => [...prev, imageId])
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate
    if (!form.name) {
      alert('Product name is required')
      return
    }
    if (!form.supplierId) {
      alert('Supplier is required')
      return
    }
    if (form.categoryIds.length === 0) {
      alert('Please select at least one category')
      return
    }
    if (requireEditReason && !form.editReason) {
      alert('Edit reason is required')
      return
    }

    onSubmit({
      formData: form,
      newImages: newImageFiles,
      removedImages: removedExistingImages,
    })
  }

  /* =========================
   * Render
   * ========================= */
  const displayedExistingImages = existingImages.filter(
    img => !removedExistingImages.includes(img.id)
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-sm p-6">
      {/* Basic Information */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              name="name"
              placeholder="Ahri Figurine"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU
            </label>
            <input
              name="sku"
              placeholder="LOL-FIG-001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={form.sku}
              onChange={handleChange}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Slug
            </label>
            <input
              name="urlSlug"
              placeholder="ahri-figurine"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50"
              value={form.urlSlug}
              onChange={handleChange}
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">Auto-generated from product name</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          placeholder="Product description..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          rows={4}
          value={form.description}
          onChange={handleChange}
        />
      </div>

      {/* Pricing & Inventory */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Pricing & Inventory</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <input
              type="number"
              name="price"
              placeholder="29.99"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={form.price}
              onChange={handleChange}
              min={0}
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              placeholder="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={form.quantity}
              onChange={handleChange}
              min={0}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount (%)
            </label>
            <input
              type="number"
              name="discount"
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={form.discount}
              onChange={handleChange}
              min={0}
              max={100}
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Supplier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Supplier *
        </label>
        <select
          name="supplierId"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={form.supplierId}
          onChange={handleChange}
          required
        >
          <option value="">Select supplier</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Categories *</h2>
        <p className="text-sm text-gray-600 mb-3">Select one or more categories</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map(c => {
            const inactive = inactiveCategoryIds.includes(c.id)
            const isChecked = form.categoryIds.includes(c.id)

            return (
              <label
                key={c.id}
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition ${
                  isChecked 
                    ? 'bg-primary-50 border-primary-500' 
                    : 'hover:bg-gray-50 border-gray-300'
                } ${inactive ? 'opacity-60' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCategoryChange(c.id)}
                  className="rounded"
                />
                <span className="text-sm font-medium">{c.name}</span>
                {inactive && (
                  <span className="text-xs text-gray-500">(inactive)</span>
                )}
              </label>
            )
          })}
        </div>
      </div>

      {/* Existing Images */}
      {displayedExistingImages.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Current Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {displayedExistingImages.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${image.path}`}
                  alt="Product"
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(image.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Images */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {existingImages.length > 0 ? 'Add More Images' : 'Product Images'}
        </h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600 font-medium">Click to upload images</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
          </label>
        </div>

        {/* New Image Previews */}
        {newImagePreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
            {newImagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`New ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border-2 border-green-500"
                />
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  New
                </div>
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Internal Note
        </label>
        <textarea
          name="note"
          placeholder="Internal notes (not visible to customers)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          rows={3}
          value={form.note}
          onChange={handleChange}
        />
      </div>

      {/* Active Status */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="active"
            checked={form.active}
            onChange={handleChange}
            className="rounded"
          />
          <span className="text-sm font-medium">Active (visible in store)</span>
        </label>
      </div>

      {/* Edit Reason (for updates) */}
      {requireEditReason && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Edit Reason *
          </label>
          <input
            name="editReason"
            placeholder="Describe the changes made..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={form.editReason}
            onChange={handleChange}
            required
          />
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4 pt-4 border-t">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : submitText}
        </button>
      </div>
    </form>
  )
}