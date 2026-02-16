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
    alt: 'MESO IS BACK - Wracamy do Trójmiasta po 3 latach!',
    href: '/',
  },
  {
    id: 'promo-2',
    imageUrl: '/images/promos/promo-2.png',
    alt: 'Autorskie Gyoza - mrożone pierożki z dostawą do paczkomatu',
    href: '/menu',
  },
]

interface PromoCarouselProps {
  className?: string
}

export function PromoCarousel({ className }: PromoCarouselProps) {
  return (
    <div className={cn('w-full mb-6', className)}>
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
                className="block overflow-hidden rounded-xl border border-border transition-all hover:border-primary/50"
              >
                <div
                  className="relative w-full bg-card neon-border rounded-xl overflow-hidden"
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
        <CarouselPrevious className="hidden md:flex -left-3 bg-card/80 border-primary/30 text-white hover:bg-muted hover:border-primary" />
        <CarouselNext className="hidden md:flex -right-3 bg-card/80 border-primary/30 text-white hover:bg-muted hover:border-primary" />
      </Carousel>
    </div>
  )
}
