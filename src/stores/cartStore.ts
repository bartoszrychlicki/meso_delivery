import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItemAddon {
  id: string
  name: string
  price: number
}

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  spiceLevel?: 1 | 2 | 3
  variantId?: string
  variantName?: string
  variantPrice?: number
  addons: CartItemAddon[]
  notes?: string
}

interface CartState {
  items: CartItem[]
  locationId: string | null
  deliveryType: 'delivery' | 'pickup'
  promoCode: string | null
  promoDiscount: number
  promoDiscountType: 'percent' | 'fixed' | 'free_delivery' | null
  tip: number

  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  setLocation: (locationId: string) => void
  setDeliveryType: (type: 'delivery' | 'pickup') => void
  setPromoCode: (code: string, discount: number, discountType: 'percent' | 'fixed' | 'free_delivery') => void
  clearPromoCode: () => void
  setTip: (amount: number) => void

  // Getters
  getItemCount: () => number
  getSubtotal: () => number
  getDeliveryFee: () => number
  getDiscount: () => number
  getTotal: () => number
  canCheckout: () => { allowed: boolean; reason?: string }
}

const MIN_ORDER_VALUE = 35 // zł
const BASE_DELIVERY_FEE = 7.99 // zł

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      locationId: null,
      deliveryType: 'delivery',
      promoCode: null,
      promoDiscount: 0,
      promoDiscountType: null,
      tip: 0,

      addItem: (item) => {
        const id = `${item.productId}-${item.variantId || 'base'}-${item.spiceLevel || 0}-${JSON.stringify(item.addons)}-${Date.now()}`

        // Check if identical item exists (same product, variant, spice level, addons)
        const existingIndex = get().items.findIndex(
          (i) =>
            i.productId === item.productId &&
            i.variantId === item.variantId &&
            i.spiceLevel === item.spiceLevel &&
            JSON.stringify(i.addons) === JSON.stringify(item.addons)
        )

        if (existingIndex > -1) {
          const items = [...get().items]
          items[existingIndex].quantity += item.quantity
          set({ items })
        } else {
          set({ items: [...get().items, { ...item, id }] })
        }
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }

        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        })
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) })
      },

      clearCart: () => {
        set({
          items: [],
          promoCode: null,
          promoDiscount: 0,
          promoDiscountType: null,
          tip: 0,
        })
      },

      setLocation: (locationId) => set({ locationId }),

      setDeliveryType: (type) => set({ deliveryType: type }),

      setPromoCode: (code, discount, discountType) => {
        set({
          promoCode: code,
          promoDiscount: discount,
          promoDiscountType: discountType,
        })
      },

      clearPromoCode: () => {
        set({
          promoCode: null,
          promoDiscount: 0,
          promoDiscountType: null,
        })
      },

      setTip: (amount) => set({ tip: Math.max(0, amount) }),

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const basePrice = item.price + (item.variantPrice || 0)
          const addonsPrice = item.addons.reduce((a, addon) => a + addon.price, 0)
          return sum + (basePrice + addonsPrice) * item.quantity
        }, 0)
      },

      getDeliveryFee: () => {
        const { deliveryType, promoDiscountType } = get()
        if (deliveryType === 'pickup') return 0
        if (promoDiscountType === 'free_delivery') return 0
        return BASE_DELIVERY_FEE
      },

      getDiscount: () => {
        const { promoDiscount, promoDiscountType } = get()
        if (!promoDiscount || !promoDiscountType) return 0

        if (promoDiscountType === 'percent') {
          return get().getSubtotal() * (promoDiscount / 100)
        }

        if (promoDiscountType === 'fixed') {
          return promoDiscount
        }

        return 0 // free_delivery is handled in getDeliveryFee
      },

      getTotal: () => {
        const subtotal = get().getSubtotal()
        const deliveryFee = get().getDeliveryFee()
        const discount = get().getDiscount()
        const tip = get().tip

        return Math.max(0, subtotal - discount + deliveryFee + tip)
      },

      canCheckout: () => {
        const items = get().items
        const subtotal = get().getSubtotal()

        if (items.length === 0) {
          return { allowed: false, reason: 'Koszyk jest pusty' }
        }

        if (subtotal < MIN_ORDER_VALUE) {
          const missing = (MIN_ORDER_VALUE - subtotal).toFixed(2)
          return {
            allowed: false,
            reason: `Minimalna wartość zamówienia to ${MIN_ORDER_VALUE} zł. Brakuje ${missing} zł.`,
          }
        }

        return { allowed: true }
      },
    }),
    {
      name: 'meso-cart',
      partialize: (state) => ({
        items: state.items,
        locationId: state.locationId,
        deliveryType: state.deliveryType,
        tip: state.tip,
      }),
    }
  )
)
