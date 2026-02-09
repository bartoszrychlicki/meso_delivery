import { create } from 'zustand'
import type { CartItem } from './cartStore'

export interface OrderConfirmation {
  orderId: string
  orderNumber: string
  items: CartItem[]
  deliveryType: 'delivery' | 'pickup'
  deliveryAddress: {
    street?: string
    houseNumber?: string
    apartmentNumber?: string
    city?: string
    firstName?: string
    lastName?: string
  } | null
  subtotal: number
  deliveryFee: number
  discount: number
  tip: number
  total: number
  paymentMethod: string
  paymentStatus: string
  estimatedTime: string
  createdAt: string
}

interface OrderConfirmationState {
  confirmation: OrderConfirmation | null
  setConfirmation: (data: OrderConfirmation) => void
  clearConfirmation: () => void
}

export const useOrderConfirmationStore = create<OrderConfirmationState>()((set) => ({
  confirmation: null,
  setConfirmation: (data) => set({ confirmation: data }),
  clearConfirmation: () => set({ confirmation: null }),
}))
