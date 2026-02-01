export type LoyaltyTier = 'bronze' | 'silver' | 'gold'

export interface Customer {
  id: string
  name?: string
  email: string
  phone?: string
  birthday?: string
  loyalty_points: number
  loyalty_tier: LoyaltyTier
  referral_code: string
  referred_by?: string
  marketing_consent: boolean
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

export const LOYALTY_REWARDS: LoyaltyReward[] = [
  {
    id: 'free-delivery',
    name: 'Darmowa dostawa',
    description: 'Twoje następne zamówienie bez kosztów dostawy',
    points_cost: 100,
    reward_type: 'free_delivery',
    is_active: true,
  },
  {
    id: 'gyoza-free',
    name: 'Gyoza (6 szt)',
    description: 'Darmowa porcja gyozy do zamówienia',
    points_cost: 150,
    reward_type: 'free_product',
    is_active: true,
  },
  {
    id: 'discount-10',
    name: '10 zł rabatu',
    description: 'Rabat na następne zamówienie',
    points_cost: 200,
    reward_type: 'discount',
    discount_value: 10,
    is_active: true,
  },
  {
    id: 'ramen-free',
    name: 'Ramen do wyboru',
    description: 'Dowolny ramen z menu gratis',
    points_cost: 300,
    reward_type: 'free_product',
    is_active: true,
  },
]
