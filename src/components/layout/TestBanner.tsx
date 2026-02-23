'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export function TestBanner({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <div className="relative bg-violet-600/90 text-white text-center text-sm py-2 px-8">
      <span className="font-medium">🚧 Strona w trybie testowym</span>
      <span className="hidden sm:inline"> — zamówienia ruszają już niedługo!</span>
      <span className="sm:hidden"> — zamówienia wkrótce!</span>
      <button
        onClick={onDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Zamknij"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
