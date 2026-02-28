import { useState, useEffect } from 'react'
import { productsApi } from '@/api/products.api'
import { discountsApi } from '@/api/discounts.api'

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  shipAddress: '',
  note: '',
  discountCode: '',
  items: [],
}

export default function OrderForm({
  initialData,
  onSubmit,
  submitText,
  loading = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [discountInfo, setDiscountInfo] = useState(null)
  const [validatingDiscount, setValidatingDiscount] = useState(false)

  useEffect(() => {
    if (!initialData) return

    setForm({
      name: initialData.name || '',
      email: initialData.email || '',
      phone: initialData.phone || '',
      shipAddress: initialData.shipAddress || '',
      note: initialData.note || '',
      discountCode: initialData.discount?.code || '',
      items: initialData.orderItems?.map(d => ({
        productId: d.productId,
        productName: d.name,
        productSku: d.sku,
        quantity: d.quantity,
        price: d.price,
        imageUrl: d.imageUrl,
        urlSlug: d.urlSlug,
      })) || [],
    })

    if (initialData.discount) {
      setDiscountInfo(initialData.discount)
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSearchProducts = async (query) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const res = await productsApi.getProducts({ 
        keyword: query, 
        pageSize: 10,
        pageNumber: 1 
      })
      setSearchResults(res?.result?.items || [])
    } catch (error) {
      console.error('Failed to search products:', error)
      setSearchResults([])
    }
  }

  const handleAddProduct = (product) => {
    const existingItem = form.items.find(item => item.productId === product.id)
    
    if (existingItem) {
      setForm(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      }))
    } else {
      setForm(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            quantity: 1,
            price: product.price,
            imageUrl: product.imageUrl,
            urlSlug: product.urlSlug,
          },
        ],
      }))
    }

    setSearchQuery('')
    setSearchResults([])
    setShowProductSearch(false)
  }

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId)
      return
    }

    setForm(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.productId === productId
          ? { ...item, quantity: newQuantity }
          : item
      ),
    }))
  }

  const handleRemoveItem = (productId) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId),
    }))
  }

  const handleValidateDiscount = async () => {
    if (!form.discountCode.trim()) {
      setDiscountInfo(null)
      return
    }

    setValidatingDiscount(true)
    try {
      const discount = await discountsApi.getDiscountByCode(form.discountCode.trim().toUpperCase())
      
      const now = new Date()
      const startDate = new Date(discount.startDate)
      const endDate = new Date(discount.endDate)

      if (!discount.isActive) {
        alert('This discount code is not active')
        setDiscountInfo(null)
      } else if (now < startDate) {
        alert('This discount code is not yet valid')
        setDiscountInfo(null)
      } else if (now > endDate) {
        alert('This discount code has expired')
        setDiscountInfo(null)
      } else if (discount.maxUses && discount.timesUsed >= discount.maxUses) {
        alert('This discount code has reached its maximum usage limit')
        setDiscountInfo(null)
      } else {
        setDiscountInfo(discount)
        alert('Discount code applied successfully!')
      }
    } catch (error) {
      console.error('Failed to validate discount:', error)
      alert('Invalid discount code')
      setDiscountInfo(null)
    } finally {
      setValidatingDiscount(false)
    }
  }

  const calculateSubtotal = () => {
    return form.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }

  const calculateDiscount = () => {
    if (!discountInfo) return 0
    
    const subtotal = calculateSubtotal()
    
    if (discountInfo.minimumOrderAmount && subtotal < discountInfo.minimumOrderAmount) {
      return 0
    }

    if (discountInfo.isPercentage) {
      return (subtotal * discountInfo.discountValue) / 100
    } else {
      return Math.min(discountInfo.discountValue, subtotal)
    }
  }

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount()
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!form.name.trim()) {
      alert('Customer name is required')
      return
    }

    if (!form.email.trim()) {
      alert('Email is required')
      return
    }

    if (!form.phone.trim()) {
      alert('Phone number is required')
      return
    }

    if (!form.shipAddress.trim()) {
      alert('Shipping address is required')
      return
    }

    if (form.items.length === 0) {
      alert('Please add at least one product to the order')
      return
    }

    const formData = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      shipAddress: form.shipAddress.trim(),
      note: form.note.trim() || null,
      discountCode: discountInfo ? form.discountCode.trim().toUpperCase() : null,
      detail: form.items.map(item => ({
        id: item.productId,
        quantity: item.quantity,
      })),
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
      
      {/* Customer Information */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Customer Name *
            </label>
            <input
              name="name"
              placeholder="John Doe"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              placeholder="john@example.com"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="+1 234 567 8900"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Shipping Address *
            </label>
            <input
              name="shipAddress"
              placeholder="123 Main St, City, Country"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.shipAddress}
              onChange={handleChange}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-base font-medium text-gray-700 mb-1">
              Order Notes
            </label>
            <textarea
              name="note"
              placeholder="Special instructions or notes..."
              rows={3}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              value={form.note}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">Optional delivery instructions</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Order Items</h2>
          <button
            type="button"
            onClick={() => setShowProductSearch(!showProductSearch)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Add Product
          </button>
        </div>

        {/* Product Search */}
        {showProductSearch && (
          <div className="mb-4 bg-gray-50 border border-gray-300 rounded-lg p-4">
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => handleSearchProducts(e.target.value)}
              autoFocus
            />

            {searchResults.length > 0 && (
              <div className="mt-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleAddProduct(product)}
                    className="w-full flex items-center gap-4 p-3 hover:bg-gray-100 transition-colors text-left border-b border-gray-200 last:border-b-0"
                  >
                    <img
                      src={product.imageUrl || '/placeholder.png'}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                      <p className="text-sm font-semibold text-blue-600">${product.price.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Order Items Table */}
        {form.items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-500">No products added yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add Product" to add items to this order</p>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Subtotal</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {form.items.map((item) => (
                  <tr key={item.productId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl || '/placeholder.png'}
                          alt={item.productName}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <span className="font-medium text-gray-900">{item.productName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-sm">{item.productSku}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">${item.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-semibold">
                      ${(item.quantity * item.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.productId)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Discount Code */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Discount Code</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-base font-medium text-gray-700 mb-1">
              Discount Code
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                name="discountCode"
                placeholder="Enter discount code"
                className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                value={form.discountCode}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={handleValidateDiscount}
                disabled={validatingDiscount || !form.discountCode.trim()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validatingDiscount ? 'Validating...' : 'Apply'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Optional - leave empty for no discount</p>
          </div>
        </div>

        {discountInfo && (
          <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800">
                  Discount Applied: {discountInfo.code}
                </p>
                <p className="text-sm text-green-700">
                  {discountInfo.isPercentage
                    ? `${discountInfo.discountValue}% off`
                    : `$${discountInfo.discountValue.toFixed(2)} off`}
                </p>
                {discountInfo.minimumOrderAmount > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    Minimum order: ${discountInfo.minimumOrderAmount.toFixed(2)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setDiscountInfo(null)
                  setForm(prev => ({ ...prev, discountCode: '' }))
                }}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal ({form.items.length} {form.items.length === 1 ? 'item' : 'items'})</span>
            <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
          </div>

          {calculateDiscount() > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({discountInfo?.code})</span>
              <span className="font-medium">-${calculateDiscount().toFixed(2)}</span>
            </div>
          )}

          {discountInfo && discountInfo.minimumOrderAmount > 0 && calculateSubtotal() < discountInfo.minimumOrderAmount && (
            <div className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
              Add ${(discountInfo.minimumOrderAmount - calculateSubtotal()).toFixed(2)} more to use this discount
            </div>
          )}

          <div className="border-t border-gray-300 pt-3 flex justify-between text-gray-900 font-bold text-lg">
            <span>Total</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4 pt-6 border-t">
        <button
          type="submit"
          disabled={loading || form.items.length === 0}
          className="text-base flex-1 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : submitText}
        </button>
      </div>
    </form>
  )
}