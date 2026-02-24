export type LoyaltyTier = 'bronze' | 'silver' | 'gold'

export interface Customer {
  id: string
  name?: string
  email?: string | null  // NULL for anonymous users
  phone?: string
  birthday?: string
  loyalty_points: number
  loyalty_tier: LoyaltyTier
  referral_code?: string | null  // NULL for anonymous users
  referred_by?: string
  marketing_consent: boolean
  is_anonymous: boolean  // true for anonymous users
  created_at: string
}

export interface CustomerAddress {
  id: string
  customer_id: string
  label: string
  street: string
  building_number: string
  apartment_number?: string
  city: string
  postal_code: string
  notes?: string
  is_default: boolean
  created_at: string
}

export interface Location {
  id: string
  name: string
  slug: string
  address: string
  city: string
  postal_code?: string
  phone?: string
  open_time: string
  close_time: string
  delivery_radius_km: number
  delivery_fee: number
  delivery_time_min: number
  delivery_time_max: number
  min_order_value: number
  is_active: boolean
  is_default: boolean
  created_at: string
}

export interface PromoCode {
  id: string
  code: string
  discount_type: 'percent' | 'fixed' | 'free_item' | 'free_delivery'
  discount_value?: number
  free_product_id?: string
  min_order_value: number
  max_uses?: number
  uses_count: number
  first_order_only: boolean
  valid_from: string
  valid_until?: string
  is_active: boolean
}

// Loyalty rewards
export interface LoyaltyReward {
  id: string
  name: string
  description: string
  points_cost: number
  reward_type: 'free_delivery' | 'discount' | 'free_product'
  discount_value?: number
  free_product_id?: string
  is_active: boolean
}

export interface LoyaltyHistoryEntry {
  id: string
  customer_id: string
  label: string
  points: number
  type: 'earned' | 'spent' | 'bonus' | 'expired'
  order_id: number | null
  created_at: string
}
