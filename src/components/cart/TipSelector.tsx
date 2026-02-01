'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import { cn } from '@/lib/utils'

const TIP_OPTIONS = [0, 5, 10, 15]

export function TipSelector() {
  const tip = useCartStore((state) => state.tip)
  const setTip = useCartStore((state) => state.setTip)
  const [customTip, setCustomTip] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const handleTipSelect = (amount: number) => {
    setTip(amount)
    setShowCustom(false)
    setCustomTip('')
  }

  const handleCustomTip = () => {
    const amount = parseFloat(customTip)
    if (!isNaN(amount) && amount >= 0) {
      setTip(amount)
    }
  }

  const formatTip = (amount: number) => {
    if (amount === 0) return 'Bez napiwku'
    return `${amount} zł`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-white/70">
        <Heart className="w-4 h-4 text-meso-red-500" />
        <span className="text-sm font-medium">Napiwek dla kuriera</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {TIP_OPTIONS.map((amount) => (
          <button
            key={amount}
            onClick={() => handleTipSelect(amount)}
            className={cn(
              'h-10 rounded-lg text-sm font-medium transition-all',
              tip === amount && !showCustom
                ? 'bg-meso-red-500 text-white shadow-[0_0_10px_rgba(244,37,175,0.3)]'
                : 'bg-white/5 text-white/70 border border-meso-red-500/20 hover:border-meso-red-500/50'
            )}
          >
            {formatTip(amount)}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowCustom(!showCustom)}
        className={cn(
          'w-full h-10 rounded-lg text-sm font-medium transition-all',
          showCustom
            ? 'bg-meso-red-500/20 text-meso-red-500 border border-meso-red-500'
            : 'bg-white/5 text-white/70 border border-meso-red-500/20 hover:border-meso-red-500/50'
        )}
      >
        Inna kwota
      </button>

      {showCustom && (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="number"
              min="0"
              step="1"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              placeholder="Wpisz kwotę"
              className={cn(
                'w-full h-10 pl-4 pr-10 rounded-lg',
                'bg-white/5 border border-meso-red-500/20',
                'text-white placeholder:text-white/40',
                'focus:outline-none focus:ring-2 focus:ring-meso-red-500/50'
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">zł</span>
          </div>
          <button
            onClick={handleCustomTip}
            className={cn(
              'h-10 px-4 rounded-lg font-medium',
              'bg-meso-red-500 text-white',
              'hover:bg-meso-red-600 transition-colors'
            )}
          >
            OK
          </button>
        </div>
      )}
    </div>
  )
}
