import type { Product } from './menu'

export type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'awaiting_courier'
  | 'in_delivery'
  | 'delivered'
  | 'cancelled'

export type DeliveryType = 'delivery' | 'pickup'

export type PaymentMethod = 'blik' | 'card' | 'cash'

export interface DeliveryAddress {
  street: string
  building_number: string
  apartment_number?: string
  city: string
  postal_code: string
  notes?: string
}

export interface Order {
  id: number
  customer_id: string
  location_id: string
  status: OrderStatus
  delivery_type: DeliveryType
  delivery_address?: DeliveryAddress
  scheduled_time?: string
  estimated_prep_time?: number
  estimated_delivery_time?: number
  payment_method: PaymentMethod
  payment_status: string
  subtotal: number
  delivery_fee: number
  promo_code?: string
  promo_discount: number
  tip: number
  total: number
  loyalty_points_earned: number
  loyalty_points_used: number
  notes?: string
  paid_at?: string
  confirmed_at?: string
  preparing_at?: string
  ready_at?: string
  picked_up_at?: string
  delivered_at?: string
  cancelled_at?: string
  created_at: string
  // Relations
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: number
  product_id: string
  quantity: number
  unit_price: number
  spice_level?: 1 | 2 | 3
  variant_id?: string
  addons: OrderItemAddon[]
  notes?: string
  total_price: number
  created_at: string
  // Relations
  product?: Product
}

export interface OrderItemAddon {
  id: string
  name: string
  price: number
}

export const ORDER_STATUS_MESSAGES: Record<OrderStatus, { title: string; subtitle: string; emoji: string }> = {
  pending_payment: {
    title: 'Oczekujemy na płatność',
    subtitle: 'Dokończ płatność, aby złożyć zamówienie',
    emoji: '💳',
  },
  confirmed: {
    title: 'Zamówienie przyjęte!',
    subtitle: 'Zaraz zabieramy się do roboty',
    emoji: '✅',
  },
  preparing: {
    title: 'Gotujemy Twój ramen! 🍜',
    subtitle: 'Nasz kucharz pracuje nad Twoim zamówieniem',
    emoji: '👨‍🍳',
  },
  ready: {
    title: 'Gotowe!',
    subtitle: 'Zamówienie czeka na kuriera',
    emoji: '📦',
  },
  awaiting_courier: {
    title: 'Szukamy kuriera',
    subtitle: 'Za chwilę wyruszy w Twoją stronę',
    emoji: '🔍',
  },
  in_delivery: {
    title: 'Kurier w drodze! 🛵',
    subtitle: 'Śledź go na mapie',
    emoji: '🛵',
  },
  delivered: {
    title: 'Smacznego! 🍜',
    subtitle: 'Dziękujemy za zamówienie',
    emoji: '🎉',
  },
  cancelled: {
    title: 'Zamówienie anulowane',
    subtitle: 'Jeśli zapłaciłeś, zwrot w ciągu 3 dni',
    emoji: '❌',
  },
}
