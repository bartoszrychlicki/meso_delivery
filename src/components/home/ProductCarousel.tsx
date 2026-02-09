'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Product } from '@/types/menu'
import { ProductCard } from '@/components/menu/ProductCard'

interface ProductCarouselProps {
    title: string
    products: Product[]
    linkTo?: string
    linkText?: string
}

export function ProductCarousel({ title, products, linkTo, linkText = "Zobacz wszystko" }: ProductCarouselProps) {
    if (!products.length) return null

    return (
        <div className="py-8">
            <div className="flex items-center justify-between px-4 mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-meso-red-500 rounded-full" />
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wide">{title}</h2>
                </div>

                {linkTo && (
                    <Link
                        href={linkTo}
                        className="flex items-center text-sm font-medium text-meso-red-500 hover:text-meso-red-400 transition-colors group"
                    >
                        {linkText}
                        <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                )}
            </div>

            {/* Scroll Container */}
            <div className="relative">
                <div className="flex overflow-x-auto gap-4 px-4 pb-8 scrollbar-hide snap-x snap-mandatory">
                    {products.map((product) => (
                        <div key={product.id} className="min-w-[280px] w-[280px] snap-center">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>

                {/* Fade gradients for scroll indication */}
                <div className="absolute top-0 bottom-8 left-0 w-8 bg-gradient-to-r from-meso-dark-900 to-transparent pointer-events-none" />
                <div className="absolute top-0 bottom-8 right-0 w-8 bg-gradient-to-l from-meso-dark-900 to-transparent pointer-events-none" />
            </div>
        </div>
    )
}
