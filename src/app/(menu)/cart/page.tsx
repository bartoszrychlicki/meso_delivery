'use client'

import Link from 'next/link'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import { CartItem, CartSummary, PromoCodeInput, TipSelector } from '@/components/cart'
import { EmptyState } from '@/components/common/EmptyState'
import { cn } from '@/lib/utils'

export default function CartPage() {
  const items = useCartStore((state) => state.items)
  const itemCount = useCartStore((state) => state.getItemCount())
  const canCheckout = useCartStore((state) => state.canCheckout)
  const getTotal = useCartStore((state) => state.getTotal)

  const checkout = canCheckout()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price) + ' zł'
  }

  if (items.length === 0) {
    return (
      <EmptyState
        type="cart"
        action={{ label: 'Przejdź do menu', href: '/menu' }}
      />
    )
  }

  return (
    <div className="min-h-screen pb-32 bg-meso-dark-900">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center bg-meso-dark-900/80 backdrop-blur-sm p-4 pb-2 justify-between border-b border-meso-red-500/20">
        <div className="flex w-12 items-center justify-start">
          <Link
            href="/menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:text-meso-red-500 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </div>
        <h1
          className="text-white text-lg font-bold leading-tight tracking-widest flex-1 text-center uppercase"
          style={{ textShadow: '0 0 5px rgba(244, 37, 175, 0.5)' }}
        >
          KOSZYK
        </h1>
        <div className="flex w-12 items-center justify-end">
          <div className="relative flex h-10 w-10 items-center justify-center text-meso-red-500">
            <ShoppingCart className="w-6 h-6" />
            <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-meso-red-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(244,37,175,0.6)]">
              {itemCount > 9 ? '9+' : itemCount}
            </div>
          </div>
        </div>
      </header>

      {/* Cart Items */}
      <main className="px-4 py-4 space-y-6">
        {/* Items count */}
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold">{itemCount} {itemCount === 1 ? 'produkt' : itemCount < 5 ? 'produkty' : 'produktów'}</span>
        </div>

        {/* Items list */}
        <div className="space-y-3">
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        {/* Promo Code */}
        <div>
          <h2 className="text-white font-semibold mb-3">Kod promocyjny</h2>
          <PromoCodeInput />
        </div>

        {/* Tip */}
        <div>
          <TipSelector />
        </div>

        {/* Summary */}
        <CartSummary />

        {/* Min order warning */}
        {!checkout.allowed && checkout.reason && (
          <div className={cn(
            'p-4 rounded-lg text-center',
            'bg-yellow-500/10 border border-yellow-500/30 text-yellow-500'
          )}>
            {checkout.reason}
          </div>
        )}
      </main>

      {/* Fixed CTA Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-meso-dark-900 to-transparent p-4 pb-6">
        <Link
          href={checkout.allowed ? '/checkout' : '#'}
          onClick={(e) => !checkout.allowed && e.preventDefault()}
          className={cn(
            'w-full h-14 flex items-center justify-center rounded-xl',
            'font-bold text-lg transition-all',
            checkout.allowed
              ? 'bg-meso-red-500 text-white shadow-[0_0_15px_rgba(244,37,175,0.8)] hover:shadow-[0_0_25px_rgba(244,37,175,0.9)] active:scale-95'
              : 'bg-white/10 text-white/50 cursor-not-allowed'
          )}
        >
          <span>Zamów</span>
          <span className="mx-2">·</span>
          <span>{formatPrice(getTotal())}</span>
        </Link>
      </div>
    </div>
  )
}
