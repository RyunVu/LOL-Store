import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from 'sonner'

const GUEST_CART_KEY = 'guest_cart'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], 
      getItemCount: () => get().items.reduce((n, i) => n + i.quantity, 0),

      getItemPrice: (item) =>
        item.finalPrice != null
          ? item.finalPrice
          : item.discount > 0
          ? item.price * (1 - item.discount / 100)
          : item.price,

      getSubtotal: () => {
        const { items, getItemPrice } = get()
        return items.reduce((sum, i) => sum + getItemPrice(i) * i.quantity, 0)
      },

      addItem: (product, quantity = 1) => {
        const { items } = get()
        const existing = items.find((i) => i.id === product.id)

        if (existing) {
          set({
            items: items.map((i) =>
              i.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          })
          toast.success(`${product.name}`, {
            description: `Qty updated to ${existing.quantity + quantity}`,
            duration: 2000,
          })
        } else {
          set({ items: [...items, { ...product, quantity }] })
          toast.success(`Added to cart`, {
            description: product.name,
            duration: 2000,
          })
        }
      },

      removeItem: (productId) => {
        const item = get().items.find((i) => i.id === productId)
        set({ items: get().items.filter((i) => i.id !== productId) })
        if (item) {
          toast.info(`Removed`, { description: item.name, duration: 2000 })
        }
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.id === productId ? { ...i, quantity } : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      mergeGuestCart: () => {
      },
    }),
    {
      name: GUEST_CART_KEY,
      partialize: (state) => ({ items: state.items }),
    }
  )
)