'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export function PromoBanner() {
    return (
        <div className="px-4 py-8 container mx-auto">
            <div className="relative w-full h-[300px] overflow-hidden rounded-2xl border border-meso-red-500/20 group">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src="/images/menu/yuzu-soda.jpg"
                        alt="Drinks Promo"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Detailed Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-meso-dark-900 via-meso-dark-900/60 to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex items-center p-8 md:p-12">
                    <div className="max-w-lg space-y-4">
                        <h2 className="text-3xl md:text-5xl font-bold text-white uppercase leading-none">
                            NAPOJE
                        </h2>
                        <p className="text-zinc-300 text-lg max-w-sm">
                            Orzeźwiające eliksiry energetyczne i tradycyjne japońskie napoje.
                        </p>
                        <div className="pt-2">
                            <Button
                                asChild
                                variant="outline"
                                className="border-meso-red-500 text-meso-red-500 hover:bg-meso-red-500 hover:text-white px-8 h-12 text-lg uppercase font-bold tracking-wider"
                            >
                                <Link href="/menu?category=napoje">
                                    ZOBACZ MENU
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
