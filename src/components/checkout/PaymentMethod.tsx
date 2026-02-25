'use client'

import { CreditCard, Smartphone, Landmark, Ban } from 'lucide-react'

export function PaymentMethod() {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-4 w-4 text-primary" />
                <h3 className="font-display text-xs font-semibold uppercase tracking-wider">Płatność</h3>
            </div>

            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 space-y-3">
                <p className="flex items-center gap-2 text-sm text-blue-400 font-medium">
                    <Landmark className="w-4 h-4 flex-shrink-0" />
                    Płatności obsługuje Przelewy24
                </p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: 'BLIK', icon: <span className="font-bold text-xs">BLIK</span> },
                        { label: 'Karta (Visa, Mastercard)', icon: <CreditCard className="w-3.5 h-3.5" /> },
                        { label: 'Apple Pay', icon: <Smartphone className="w-3.5 h-3.5" /> },
                        { label: 'Google Pay', icon: <Smartphone className="w-3.5 h-3.5" /> },
                    ].map((method) => (
                        <span
                            key={method.label}
                            className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300"
                        >
                            {method.icon}
                            {method.label}
                        </span>
                    ))}
                </div>
            </div>

            <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Ban className="w-3.5 h-3.5 flex-shrink-0" />
                Na tę chwilę gotówki nie przyjmujemy
            </p>
        </div>
    )
}
