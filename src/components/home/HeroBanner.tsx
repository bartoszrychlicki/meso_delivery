'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function HeroBanner() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-2xl border border-meso-red-500/20 bg-meso-dark-800 shadow-[0_0_20px_rgba(244,37,175,0.15)] group transition-all duration-500 hover:shadow-[0_0_30px_rgba(244,37,175,0.3)] hover:border-meso-red-500/40">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src="/images/menu/gyoza-chicken.jpg"
                        alt="Gyoza Promo"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                    />
                    {/* Cyberpunk Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-meso-dark-900/95 via-meso-dark-900/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-meso-dark-900 via-transparent to-transparent opacity-60" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex items-center">
                    <div className="px-8 md:px-12">
                        <div className="max-w-xl space-y-4 md:space-y-6">
                            <h1 className="text-4xl md:text-6xl font-bold text-white uppercase leading-tight tracking-tight">
                                Nowość: <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-meso-red-500 to-purple-600 drop-shadow-[0_0_10px_rgba(244,37,175,0.5)]">
                                    Cyber-Gyoza
                                </span>
                            </h1>
                            <p className="text-zinc-300 text-lg md:text-xl font-light">
                                Chrupiące pierożki z wysyłką prosto do Twojego Paczkomatu.
                                Poczuj smak przyszłości już dziś.
                            </p>
                            <div className="pt-4">
                                <Button
                                    asChild
                                    className="bg-meso-red-500 hover:bg-meso-red-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-[0_0_20px_rgba(244,37,175,0.5)] transition-all hover:scale-105"
                                >
                                    <Link href="/menu">
                                        ZAMÓW TERAZ
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
