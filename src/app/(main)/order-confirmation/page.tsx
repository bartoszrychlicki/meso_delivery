'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Clock, MapPin, Store, ArrowLeft } from 'lucide-react'
import { useOrderConfirmationStore } from '@/stores/orderConfirmationStore'
import { formatPriceExact } from '@/lib/formatters'

export default function OrderConfirmationPage() {
    const router = useRouter()
    const { confirmation, clearConfirmation } = useOrderConfirmationStore()

    useEffect(() => {
        if (!confirmation) {
            router.replace('/menu')
        }
    }, [confirmation, router])

    if (!confirmation) {
        return null
    }

    const handleBackToMenu = () => {
        clearConfirmation()
        router.push('/menu')
    }

    return (
        <div className="flex flex-col min-h-screen pb-24">
            {/* Success Header */}
            <div className="bg-gradient-to-b from-green-500/20 to-transparent px-4 pt-8 pb-6 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">
                    Zamówienie przyjęte!
                </h1>
                <p className="text-white/60">
                    Numer zamówienia
                </p>
                <p className="text-meso-gold-500 font-mono text-lg font-bold mt-1">
                    #{confirmation.orderNumber}
                </p>
            </div>

            <div className="px-4 space-y-4">
                {/* Estimated Time */}
                <div className="bg-meso-dark-800 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Clock className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-white/60 text-sm">Szacowany czas</p>
                            <p className="text-white font-bold text-lg">{confirmation.estimatedTime}</p>
                        </div>
                    </div>
                </div>

                {/* Delivery Info */}
                <div className="bg-meso-dark-800 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-meso-red-500/10 rounded-lg">
                            {confirmation.deliveryType === 'delivery' ? (
                                <MapPin className="w-5 h-5 text-meso-red-500" />
                            ) : (
                                <Store className="w-5 h-5 text-meso-red-500" />
                            )}
                        </div>
                        <div>
                            <p className="text-white/60 text-sm">
                                {confirmation.deliveryType === 'delivery' ? 'Adres dostawy' : 'Odbiór osobisty'}
                            </p>
                            {confirmation.deliveryType === 'delivery' && confirmation.deliveryAddress ? (
                                <p className="text-white font-medium">
                                    {confirmation.deliveryAddress.street} {confirmation.deliveryAddress.houseNumber}
                                    {confirmation.deliveryAddress.apartmentNumber ? `/${confirmation.deliveryAddress.apartmentNumber}` : ''}
                                    , {confirmation.deliveryAddress.city}
                                </p>
                            ) : (
                                <p className="text-white font-medium">MESO Food, Gdańsk</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-meso-dark-800 rounded-xl p-4 border border-white/5">
                    <h3 className="text-white font-medium mb-3">Twoje zamówienie</h3>
                    <div className="space-y-3">
                        {confirmation.items.map((item) => {
                            const itemTotal = (item.price + (item.variantPrice || 0) + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity
                            return (
                                <div key={item.id} className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="text-white text-sm">
                                            <span className="text-white/50">{item.quantity}x</span>{' '}
                                            {item.name}
                                        </p>
                                        {item.variantName && (
                                            <p className="text-white/40 text-xs">{item.variantName}</p>
                                        )}
                                        {item.spiceLevel && (
                                            <p className="text-white/40 text-xs">
                                                {'🔥'.repeat(item.spiceLevel)}
                                            </p>
                                        )}
                                        {item.addons.length > 0 && (
                                            <p className="text-white/40 text-xs">
                                                + {item.addons.map(a => a.name).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-white/60 text-sm ml-2">
                                        {formatPriceExact(itemTotal)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Price Summary */}
                <div className="bg-meso-dark-800 rounded-xl p-4 border border-white/5 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-white/60">Produkty</span>
                        <span className="text-white">{formatPriceExact(confirmation.subtotal)}</span>
                    </div>
                    {confirmation.discount > 0 && (
                        <div className="flex justify-between">
                            <span className="text-green-400">Rabat</span>
                            <span className="text-green-400">-{formatPriceExact(confirmation.discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-white/60">Dostawa</span>
                        <span className="text-white">
                            {confirmation.deliveryFee > 0 ? formatPriceExact(confirmation.deliveryFee) : 'Gratis'}
                        </span>
                    </div>
                    {confirmation.tip > 0 && (
                        <div className="flex justify-between">
                            <span className="text-white/60">Napiwek</span>
                            <span className="text-white">{formatPriceExact(confirmation.tip)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t border-white/5">
                        <span className="text-white">Razem</span>
                        <span className="text-meso-red-500 text-lg">{formatPriceExact(confirmation.total)}</span>
                    </div>
                </div>
            </div>

            {/* Back to Menu Button */}
            <div className="fixed bottom-0 left-0 right-0 z-20 bg-meso-dark-900 border-t border-white/5 p-4 pb-8">
                <button
                    onClick={handleBackToMenu}
                    className="w-full bg-meso-red-500 hover:bg-meso-red-600 text-white font-bold h-14 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Wróć do menu
                </button>
            </div>
        </div>
    )
}
