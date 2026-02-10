'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'

interface PromoBanner {
  id: string
  imageUrl: string
  alt: string
  href?: string
}

const PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'promo-1',
    imageUrl: '/images/promos/promo-1.png',
    alt: 'Darmowa dostawa od 40 PLN - kod DOSTAWAZERO',
    href: '/',
  },
  {
    id: 'promo-2',
    imageUrl: '/images/promos/promo-2.png',
    alt: 'MESO Club - dołącz i zyskaj -10%',
    href: '/account',
  },
  {
    id: 'promo-3',
    imageUrl: '/images/promos/promo-3.png',
    alt: 'Nowość: Tonkotsu z truflą',
    href: '/',
  },
]

interface PromoCarouselProps {
  className?: string
}

export function PromoCarousel({ className }: PromoCarouselProps) {
  return (
    <div className={cn('w-full', className)}>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 5000,
            stopOnInteraction: true,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent>
          {PROMO_BANNERS.map((banner) => (
            <CarouselItem key={banner.id}>
              <Link
                href={banner.href || '#'}
                className="block overflow-hidden rounded-xl border border-meso-red-500/20 transition-all hover:border-meso-red-500/50"
              >
                <div
                  className="relative w-full bg-meso-dark-800"
                  style={{ aspectRatio: '2.5 / 1' }}
                >
                  <Image
                    src={banner.imageUrl}
                    alt={banner.alt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 800px"
                    priority
                  />
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-3 bg-meso-dark-800/80 border-meso-red-500/30 text-white hover:bg-meso-dark-700 hover:border-meso-red-500" />
        <CarouselNext className="hidden md:flex -right-3 bg-meso-dark-800/80 border-meso-red-500/30 text-white hover:bg-meso-dark-700 hover:border-meso-red-500" />
      </Carousel>
    </div>
  )
}
