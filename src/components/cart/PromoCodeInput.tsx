'use client'

import { useState } from 'react'
import { Tag, X, Loader2 } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Mock promo codes for testing (would be validated via API in production)
const PROMO_CODES: Record<string, { discount: number; type: 'percent' | 'fixed' | 'free_delivery'; minOrder?: number; firstOrderOnly?: boolean }> = {
  'PIERWSZYRAMEN': { discount: 15, type: 'percent', firstOrderOnly: true },
  'MESOCLUB': { discount: 10, type: 'percent' },
  'DOSTAWAZERO': { discount: 0, type: 'free_delivery', minOrder: 40 },
}

export function PromoCodeInput() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const promoCode = useCartStore((state) => state.promoCode)
  const promoDiscount = useCartStore((state) => state.promoDiscount)
  const promoDiscountType = useCartStore((state) => state.promoDiscountType)
  const setPromoCode = useCartStore((state) => state.setPromoCode)
  const clearPromoCode = useCartStore((state) => state.clearPromoCode)
  const getSubtotal = useCartStore((state) => state.getSubtotal)

  const handleApply = async () => {
    if (!code.trim()) return

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    const upperCode = code.toUpperCase().trim()
    const promo = PROMO_CODES[upperCode]

    if (!promo) {
      toast.error('Nieprawidłowy kod promocyjny')
      setIsLoading(false)
      return
    }

    if (promo.minOrder && getSubtotal() < promo.minOrder) {
      toast.error(`Minimalna wartość zamówienia dla tego kodu to ${promo.minOrder} zł`)
      setIsLoading(false)
      return
    }

    setPromoCode(upperCode, promo.discount, promo.type)

    const message = promo.type === 'percent'
      ? `Zastosowano rabat ${promo.discount}%`
      : promo.type === 'free_delivery'
      ? 'Darmowa dostawa aktywowana!'
      : `Zastosowano rabat ${promo.discount} zł`

    toast.success(message)
    setCode('')
    setIsLoading(false)
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
