import { useState, useEffect } from 'react'

const EMPTY_FORM = {
  code: '',
  discountValue: 0,
  isPercentage: true,
  minimumOrderAmount: '',
  maxUses: '',
  startDate: '',
  endDate: '',
  isActive: true,
}

export default function DiscountForm({
  initialData,
  onSubmit,
  submitText,
  loading = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (!initialData) return

    // Format dates for datetime-local input
    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    setForm({
      code: initialData.code || '',
      discountValue: initialData.discountValue || 0,
      isPercentage: initialData.isPercentage ?? true,
      minimumOrderAmount: initialData.minimumOrderAmount ?? '',
      maxUses: initialData.maxUses ?? '',
      startDate: formatDate(initialData.startDate),
      endDate: formatDate(initialData.endDate),
      isActive: initialData.isActive ?? true,
    })
  }, [initialData])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

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

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!form.code.trim()) {
      alert('Discount code is required')
      return
    }

    if (form.discountValue <= 0) {
      alert('Discount value must be greater than 0')
      return
    }

    if (form.isPercentage && form.discountValue > 100) {
      alert('Percentage discount cannot exceed 100%')
      return
    }

    if (!form.startDate) {
      alert('Start date is required')
      return
    }

    if (!form.endDate) {
      alert('End date is required')
      return
    }

    if (new Date(form.endDate) <= new Date(form.startDate)) {
      alert('End date must be after start date')
      return
    }

    // Convert datetime-local to ISO string
    const formData = {
      code: form.code.trim().toUpperCase(),
      discountValue: Number(form.discountValue),
      isPercentage: form.isPercentage,
      minimumOrderAmount: form.minimumOrderAmount === '' ? null : Number(form.minimumOrderAmount),
      maxUses: form.maxUses === '' ? null : Number(form.maxUses),
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      isActive: form.isActive,
    }

    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="
      space-y-6 bg-white rounded-lg shadow-base p-6
      text-(--fs-base)
      [--fs-xs:13px]
      [--fs-base:17px]
      [--fs-lg:19px]
      [--fs-xl:22px]">
      
      {/* Basic Information */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Discount Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Discount Code *
            </label>
            <input
              name="code"
              placeholder="WELCOME10"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              value={form.code}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Code will be converted to uppercase</p>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Discount Type *
            </label>
            <div className="flex gap-4 items-center h-13">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isPercentage"
                  checked={form.isPercentage === true}
                  onChange={() => setForm(prev => ({ ...prev, isPercentage: true }))}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-base">Percentage (%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isPercentage"
                  checked={form.isPercentage === false}
                  onChange={() => setForm(prev => ({ ...prev, isPercentage: false }))}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-base">Fixed Amount ($)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Discount Value *
            </label>
            <div className="relative">
              <input
                type="number"
                name="discountValue"
                placeholder={form.isPercentage ? "10" : "50"}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.discountValue}
                onChange={handleChange}
                min={0}
                max={form.isPercentage ? 100 : undefined}
                step={form.isPercentage ? "0.01" : "0.01"}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                {form.isPercentage ? '%' : '$'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Minimum Order Amount
            </label>
            <input
              type="number"
              name="minimumOrderAmount"
              placeholder="Optional"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.minimumOrderAmount}
              onChange={handleChange}
              min={0}
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no minimum</p>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Maximum Uses
            </label>
            <input
              type="number"
              name="maxUses"
              placeholder="Optional"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.maxUses}
              onChange={handleChange}
              min={0}
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited uses</p>
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Validity Period</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="datetime-local"
              name="startDate"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="datetime-local"
              name="endDate"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      {/* Active Status */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
            className="w-5 h-5 accent-blue-600"
          />
          <span className="text-xl font-medium">
            Active (visible to customers)
          </span>
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