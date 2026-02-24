'use client'

import { Heart } from 'lucide-react'

export default function FavoritesPage() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <Heart className="mb-4 h-16 w-16 text-muted-foreground/30" />
      <h2 className="mb-2 font-display text-lg font-semibold">Ulubione produkty</h2>
      <p className="text-sm text-muted-foreground">Wkrótce dostępne</p>
    </div>
  )
}
