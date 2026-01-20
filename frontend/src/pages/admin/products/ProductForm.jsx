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

// Reusable Image Tile Component
const ImageTile = ({ src, alt, onRemove, onClick, badge }) => {
  return (
    <div
      className="relative group w-35 h-35 shrink-0 overflow-hidden rounded-lg border-2 border-gray-300 cursor-pointer hover:border-blue-500 transition"
      onClick={onClick}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover pointer-events-none"
      />

      {badge && (
        <span className="absolute top-2 left-2 z-10 bg-green-500 text-white text-xs px-2 py-0.5 rounded-md font-semibold">
          {badge}
        </span>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        aria-label="Remove image"
        className="absolute top-2 right-2 z-20 w-8 h-8 bg-red-500 text-white rounded-full
                   opacity-0 group-hover:opacity-100 transition-all
                   shadow-md hover:bg-red-600 flex items-center justify-center pointer-events-auto"
      >
        <span className="text-lg font-bold leading-none">×</span>
      </button>
    </div>
  )
}


// Upload Tile Component
const UploadTile = ({ onFileChange, inputId }) => {
  return (
    <div className="w-35 h-35 shrink-0">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
        id={inputId}
      />
      <label
        htmlFor={inputId}
        className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100"
      >
        <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <p className="text-xs text-gray-600 font-medium text-center px-2">Add Images</p>
        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP</p>
      </label>
    </div>
  )
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
  const [fullImageView, setFullImageView] = useState(null)

  useEffect(() => {
    if (!initialData) return

    setForm({
      ...EMPTY_FORM,
      ...initialData,
      categoryIds: Array.isArray(initialData.categoryIds)
        ? initialData.categoryIds.map(String)
        : [],
      supplierId: initialData.supplierId ?? '',
      editReason: '',
    })

    setNewImageFiles([])
    setNewImagePreviews([])
    setRemovedExistingImages([])
  }, [initialData])

  const inactiveCategoryIds = useMemo(
    () => categories.filter(c => c.isDeleted).map(c => c.id),
    [categories]
  )

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .trim()
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
          ? value === '' ? '' : Number(value)
          : value,
    }))
  }

  const handleCategoryChange = (id) => {
    const strId = String(id)
    setForm(prev => {
      const exists = prev.categoryIds.includes(strId)
      return {
        ...prev,
        categoryIds: exists
          ? prev.categoryIds.filter(x => x !== strId)
          : [...prev.categoryIds, strId],
      }
    })
  }


  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setNewImageFiles(prev => [...prev, ...files])

    const previews = files.map(file => URL.createObjectURL(file))
    setNewImagePreviews(prev => [...prev, ...previews])

    e.target.value = ''
  }

  const removeNewImage = (index) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index))
    setNewImagePreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const removeExistingImage = (imageId) => {
    setRemovedExistingImages(prev =>
      prev.includes(imageId) ? prev : [...prev, imageId]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!form.name.trim()) {
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

    if (requireEditReason && !form.editReason.trim()) {
      alert('Edit reason is required')
      return
    }

    onSubmit({
      formData: {
        ...form,
        price: Number(form.price),
        quantity: Number(form.quantity),
        discount: Number(form.discount),
      },
      newImages: newImageFiles,
      removedImages: removedExistingImages,
    })
  }

  const displayedExistingImages = existingImages.filter(
    img => !removedExistingImages.includes(img.id)
  )
  
  return (
    <form onSubmit={handleSubmit} className="
      admin-page
      space-y-6 bg-white rounded-lg shadow-base p-6
      text-(--fs-base)
      [--fs-xs:13px]
      [--fs-base:17px]
      [--fs-lg:19px]
      [--fs-xl:22px]">
      {/* Basic Information */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              name="name"
              placeholder="Ahri Figurine"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              SKU
            </label>
            <input
              name="sku"
              placeholder="LOL-FIG-001"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.sku}
              onChange={handleChange}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-base font-medium text-gray-700 mb-1">
              URL Slug
            </label>
            <input
              name="urlSlug"
              placeholder="ahri-figurine"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
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
        <label className="block text-base font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          placeholder="Product description..."
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={5}
          value={form.description}
          onChange={handleChange}
        />
      </div>

      {/* Pricing & Inventory */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Pricing & Inventory</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Price *
            </label>
            <input
              type="number"
              name="price"
              placeholder="29.99"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.price}
              onChange={handleChange}
              min={0}
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              placeholder="100"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.quantity}
              onChange={handleChange}
              min={0}
              required
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Discount (%)
            </label>
            <input
              type="number"
              name="discount"
              placeholder="0"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <label className="block text-base font-medium text-gray-700 mb-1">
          Supplier *
        </label>
        <select
          name="supplierId"
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <p className="text-base text-gray-600 mb-3">Select one or more categories</p>
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">            
            {categories.map(c => {
              const inactive = inactiveCategoryIds.includes(c.id)
              const isChecked = form.categoryIds.includes(c.id)
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-4 px-5 h-15 border rounded-xl cursor-pointer transition select-none
                    ${
                      isChecked
                        ? 'bg-blue-50 border-blue-500'
                        : 'hover:bg-gray-50 border-gray-300'
                    }
                    ${inactive ? 'opacity-60' : ''}
                  `}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCategoryChange(c.id)}
                    className="w-5 h-5 accent-blue-600 shrink-0"
                  />

                  {/* Text */}
                  <span className="text-[17px] font-medium leading-tight">
                    {c.name}
                  </span>

                  {inactive && (
                    <span className="text-base text-gray-500">
                      (inactive)
                    </span>
                  )}
                </label>
              )
            })}
          </div>
      </div>

      {/* Unified Image Gallery */}
      <div className="border-b border-gray-300">
        <h2 className="text-xl font-semibold mb-4">Product Images</h2>
        <div className="flex flex-wrap gap-3">
          {/* Existing Images */}
          {displayedExistingImages.map((image) => (
            <ImageTile
              key={image.id}
              src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${image.path}`}
              alt="Product"
              onRemove={() => removeExistingImage(image.id)}
              onClick={() => setFullImageView(`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${image.path}`)}
            />
          ))}

          {/* New Images */}
          {newImagePreviews.map((preview, index) => (
            <ImageTile
              key={`new-${index}`}
              src={preview}
              alt={`New ${index + 1}`}
              badge="New"
              onRemove={() => removeNewImage(index)}
              onClick={() => setFullImageView(preview)}
            />
          ))}

          {/* Upload Tile */}
          <UploadTile
            onFileChange={handleImageChange}
            inputId="image-upload"
          />
        </div>
      </div>

      {/* Note */}
      <div className="border-t border-gray-200">
        <label className="block text-xl font-semibold text-gray-800 mb-3">
          Internal Note
        </label>

        <textarea
          name="note"
          placeholder="Internal notes (not visible to customers)"
          className="w-full px-6 py-5 text-[18px] border-2 border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50/30"    rows={5}
          value={form.note}
          onChange={handleChange}
        />
      </div>

      {/* Active Status */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="active"
            checked={form.active}
            onChange={handleChange}
            className="w-5 h-5 accent-blue-600"
          />
          <span className="text-xl font-medium">
            Active (visible in store)
          </span>
        </label>

      </div>  

      {/* Edit Reason (for updates) */}
      {requireEditReason && (
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            Edit Reason *
          </label>

          <textarea
            name="editReason"
            placeholder="Describe the changes made in detail..."
            className="w-full px-6 py-5 text-[18px] border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={5}
            value={form.editReason}
            onChange={handleChange}
            required
          />
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4 pt-6 border-t">
        <button
          type="submit"
          disabled={loading}
          className="text-base flex-1 px-8 py-4  bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : submitText}
        </button>
      </div>

      {/* Full Image Modal */}
      {fullImageView && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setFullImageView(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <img 
              src={fullImageView} 
              alt="Full view" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setFullImageView(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 w-10 h-10 rounded-full shadow-lg hover:bg-gray-100 transition flex items-center justify-center"
              aria-label="Close"
            >
              <span className="text-2xl font-bold leading-none">×</span>
            </button>
          </div>
        </div>
      )}
    </form>
  )
}