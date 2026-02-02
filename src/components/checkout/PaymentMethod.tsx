'use client'

import { CreditCard, Smartphone, Banknote, Landmark } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaymentMethodProps {
    value: string
    onChange: (value: 'blik' | 'card' | 'google_pay' | 'apple_pay' | 'cash') => void
}

export function PaymentMethod({ value, onChange }: PaymentMethodProps) {
    const methods = [
        {
            id: 'blik',
            name: 'BLIK',
            icon: <span className="font-bold text-lg">BLIK</span>,
            description: 'Szybka płatność kodem',
        },
        {
            id: 'card',
            name: 'Karta płatnicza',
            icon: <CreditCard className="w-6 h-6" />,
            description: 'Visa, Mastercard',
        },
        {
            id: 'google_pay',
            name: 'Google Pay',
            icon: <Smartphone className="w-6 h-6" />,
            description: 'Szybka płatność mobilna',
        },
        {
            id: 'cash',
            name: 'Gotówka',
            icon: <Banknote className="w-6 h-6" />,
            description: 'Płatność przy odbiorze',
        },
    ] as const

    return (
        <div className="space-y-4">
            <h3 className="text-white font-medium">Metoda płatności</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {methods.map((method) => (
                    <button
                        key={method.id}
                        type="button"
                        onClick={() => onChange(method.id)}
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                            value === method.id
                                ? "bg-meso-red-500/10 border-meso-red-500 text-white"
                                : "bg-meso-dark-800 border-white/5 text-white/60 hover:bg-meso-dark-700"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-lg flex items-center justify-center w-12 h-12",
                            value === method.id ? "bg-meso-red-500/20 text-meso-red-500" : "bg-white/5 text-white/40"
                        )}>
                            {method.icon}
                        </div>
                        <div>
                            <div className="font-medium">{method.name}</div>
                            <div className="text-sm opacity-60">{method.description}</div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                <p className="flex items-center gap-2">
                    <Landmark className="w-4 h-4" />
                    Bezpieczne płatności obsługiwane przez Przelewy24 (Mock)
                </p>
            </div>
        </div>
    )
}
