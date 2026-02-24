'use client'

import { MapPin, Clock, Truck, Store, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Location {
  id: string
  name: string
  address: string
  hours: string
  type: 'food_truck' | 'restaurant'
  isOpen: boolean
  lat: number
  lng: number
}

const MOCK_LOCATIONS: Location[] = [
  {
    id: '1',
    name: 'MESO Mokotow',
    address: 'ul. Pulawska 24, 02-512 Warszawa',
    hours: '11:00 - 22:00',
    type: 'restaurant',
    isOpen: true,
    lat: 52.199,
    lng: 21.004,
  },
  {
    id: '2',
    name: 'MESO Centrum',
    address: 'ul. Marszalkowska 89, 00-693 Warszawa',
    hours: '11:00 - 22:00',
    type: 'food_truck',
    isOpen: true,
    lat: 52.228,
    lng: 21.014,
  },
  {
    id: '3',
    name: 'MESO Wilanow',
    address: 'ul. Klimczaka 1, 02-797 Warszawa',
    hours: '11:00 - 21:00',
    type: 'food_truck',
    isOpen: false,
    lat: 52.164,
    lng: 21.076,
  },
  {
    id: '4',
    name: 'MESO Zoliborz',
    address: 'ul. Slowackiego 15, 01-592 Warszawa',
    hours: '11:00 - 22:00',
    type: 'restaurant',
    isOpen: true,
    lat: 52.267,
    lng: 20.982,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function LocationsPage() {
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Menu
      </Link>

      <div>
        <h1 className="font-display text-xl font-bold">Nasze lokalizacje</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Znajdź najbliższy punkt MESO
        </p>
      </div>

      {/* Map Placeholder */}
      <div className="relative h-48 overflow-hidden rounded-xl border border-border bg-secondary">
        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
          <MapPin className="mb-2 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm">Mapa wkrótce</p>
        </div>
      </div>

      {/* Location Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {MOCK_LOCATIONS.map((location) => (
          <motion.div
            key={location.id}
            variants={itemVariants}
            className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm font-semibold">{location.name}</h3>
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium',
                    location.type === 'restaurant'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-accent/20 text-accent'
                  )}>
                    {location.type === 'restaurant' ? (
                      <span className="flex items-center gap-1">
                        <Store className="h-3 w-3" /> Lokal
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" /> Food Truck
                      </span>
                    )}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{location.address}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {location.hours}
                  </span>
                </div>
              </div>
              <span className={cn(
                'mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                location.isOpen
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              )}>
                {location.isOpen ? 'Otwarte' : 'Zamknięte'}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
