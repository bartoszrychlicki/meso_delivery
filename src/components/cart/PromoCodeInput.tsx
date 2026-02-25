'use client'

import { useState } from 'react'
import { Tag, X, Loader2 } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function PromoCodeInput() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const promoCode = useCartStore((state) => state.promoCode)
  const promoDiscount = useCartStore((state) => state.promoDiscount)
  const promoDiscountType = useCartStore((state) => state.promoDiscountType)
  const setPromoCode = useCartStore((state) => state.setPromoCode)
  const clearPromoCode = useCartStore((state) => state.clearPromoCode)
  const getSubtotal = useCartStore((state) => state.getSubtotal)
  const loyaltyCoupon = useCartStore((s) => s.loyaltyCoupon)
  const clearLoyaltyCoupon = useCartStore((s) => s.clearLoyaltyCoupon)

  const handleApply = async () => {
    if (!code.trim()) return

    // Block promo code when loyalty coupon is active
    const activeLoyaltyCoupon = useCartStore.getState().loyaltyCoupon
    if (activeLoyaltyCoupon) {
      toast.error('Masz aktywny kupon lojalnościowy. Usuń go, aby użyć kodu promocyjnego.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), subtotal: getSubtotal() }),
      })

      const data = await response.json()

      if (!response.ok || !data.valid) {
        toast.error(data.error || 'Nieprawidłowy kod promocyjny')
        setIsLoading(false)
        return
      }

      const discountType = data.discount_type as 'percent' | 'fixed' | 'free_delivery'
      const discountValue = data.discount_value ?? 0

      setPromoCode(data.code, discountValue, discountType)

      const message = discountType === 'percent'
        ? `Zastosowano rabat ${discountValue}%`
        : discountType === 'free_delivery'
        ? 'Darmowa dostawa aktywowana!'
        : `Zastosowano rabat ${discountValue} zł`

      toast.success(message)
      setCode('')
    } catch {
      toast.error('Błąd weryfikacji kodu. Spróbuj ponownie.')
    } finally {
      setIsLoading(false)
    }
  }

  const getPromoDescription = () => {
    if (!promoCode) return null

    if (promoDiscountType === 'percent') {
      return `-${promoDiscount}%`
    }
    if (promoDiscountType === 'free_delivery') {
      return 'Darmowa dostawa'
    }
    return `-${promoDiscount} zł`
  }

  if (loyaltyCoupon) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-meso-gold-400/30 bg-meso-gold-400/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-meso-gold-400" />
          <div>
            <p className="text-sm font-medium text-meso-gold-400">Kupon: {loyaltyCoupon.code}</p>
            <p className="text-xs text-white/50">
              {loyaltyCoupon.coupon_type === 'free_delivery' && 'Darmowa dostawa'}
              {loyaltyCoupon.coupon_type === 'discount' && `Rabat ${loyaltyCoupon.discount_value} zł`}
              {loyaltyCoupon.coupon_type === 'free_product' && loyaltyCoupon.free_product_name}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            clearLoyaltyCoupon()
            toast('Kupon usunięty z koszyka. Punkty nie wracają.')
          }}
          className="p-1 text-white/40 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  if (promoCode) {
    return (
      <div className={cn(
        'flex items-center justify-between p-3 rounded-lg',
        'bg-primary/10 border border-primary/30'
      )}>
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <span className="text-white font-medium">{promoCode}</span>
          <span className="text-primary text-sm">{getPromoDescription()}</span>
        </div>
        <button
          onClick={clearPromoCode}
          className="text-white/50 hover:text-primary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="Kod promocyjny"
          className={cn(
            'w-full h-12 pl-10 pr-4 rounded-lg',
            'bg-white/5 border border-border',
            'text-white placeholder:text-white/40',
            'focus:outline-none focus:ring-2 focus:ring-ring/50'
          )}
        />
      </div>
      <button
        onClick={handleApply}
        disabled={isLoading || !code.trim()}
        className={cn(
          'h-12 px-6 rounded-lg font-medium',
          'bg-white/10 text-white',
          'hover:bg-white/20 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Zastosuj'}
      </button>
    </div>
  )
}
