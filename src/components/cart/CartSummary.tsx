'use client'

import { useCartStore } from '@/stores/cartStore'
import { cn } from '@/lib/utils'
import { Truck, Tag } from 'lucide-react'

export function CartSummary() {
  const getSubtotal = useCartStore((state) => state.getSubtotal)
  const getDeliveryFee = useCartStore((state) => state.getDeliveryFee)
  const getDiscount = useCartStore((state) => state.getDiscount)
  const getTotal = useCartStore((state) => state.getTotal)
  const tip = useCartStore((state) => state.tip)
  const promoCode = useCartStore((state) => state.promoCode)
  const promoDiscountType = useCartStore((state) => state.promoDiscountType)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price) + ' zł'
  }

  const subtotal = getSubtotal()
  const deliveryFee = getDeliveryFee()
  const discount = getDiscount()
  const total = getTotal()

  return (
    <div className={cn(
      'p-4 rounded-xl space-y-3',
      'bg-white/5 border border-meso-red-500/20'
    )}>
      {/* Subtotal */}
      <div className="flex justify-between text-white/70">
        <span>Suma produktów</span>
        <span>{formatPrice(subtotal)}</span>
      </div>

      {/* Delivery */}
      <div className="flex justify-between text-white/70">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4" />
          <span>Dostawa</span>
        </div>
        <span className={promoDiscountType === 'free_delivery' ? 'text-meso-red-500 line-through' : ''}>
          {deliveryFee === 0 && promoDiscountType === 'free_delivery' ? (
            <span className="text-meso-red-500 no-underline">Gratis!</span>
          ) : deliveryFee === 0 ? (
            'Gratis'
          ) : (
            formatPrice(deliveryFee)
          )}
        </span>
      </div>

      {/* Discount */}
      {discount > 0 && (
        <div className="flex justify-between text-meso-red-500">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            <span>Rabat ({promoCode})</span>
          </div>
          <span>-{formatPrice(discount)}</span>
        </div>
      )}

      {/* Tip */}
      {tip > 0 && (
        <div className="flex justify-between text-white/70">
          <span>Napiwek</span>
          <span>{formatPrice(tip)}</span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-meso-red-500/20 pt-3">
        {/* Total */}
        <div className="flex justify-between">
          <span className="text-white text-lg font-bold">Razem</span>
          <span className="text-meso-red-500 text-xl font-bold">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  )
}
