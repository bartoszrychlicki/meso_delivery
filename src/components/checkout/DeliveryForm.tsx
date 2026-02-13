'use client'

import { Clock, Truck, Store } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeliveryFormProps {
    value: {
        type: 'delivery' | 'pickup'
        time: 'asap' | 'scheduled'
    }
    onChange: (value: { type: 'delivery' | 'pickup'; time: 'asap' | 'scheduled' }) => void
}

export function DeliveryForm({ value, onChange }: DeliveryFormProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <h3 className="text-white font-medium">Sposób dostawy</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        disabled
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all bg-meso-dark-800 border-white/5 text-white/30 cursor-not-allowed opacity-50"
                    >
                        <Truck className="w-6 h-6 text-white/20" />
                        <span className="font-medium">Dostawa</span>
                        <span className="text-xs opacity-60">Wkrótce</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onChange({ ...value, type: 'pickup' })}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all",
                            value.type === 'pickup'
                                ? "bg-meso-red-500/10 border-meso-red-500 text-white"
                                : "bg-meso-dark-800 border-white/5 text-white/60 hover:bg-meso-dark-700"
                        )}
                    >
                        <Store className={cn("w-6 h-6", value.type === 'pickup' ? "text-meso-red-500" : "text-white/40")} />
                        <span className="font-medium">Odbiór osobisty</span>
                        <span className="text-xs opacity-60">0.00 zł</span>
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-white font-medium">Czas realizacji</h3>
                <div className="grid grid-cols-1 gap-3">
                    <button
                        type="button"
                        onClick={() => onChange({ ...value, time: 'asap' })}
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                            value.time === 'asap'
                                ? "bg-meso-red-500/10 border-meso-red-500 text-white"
                                : "bg-meso-dark-800 border-white/5 text-white/60 hover:bg-meso-dark-700"
                        )}
                    >
                        <div className={cn("p-2 rounded-full", value.time === 'asap' ? "bg-meso-red-500/20 text-meso-red-500" : "bg-white/5 text-white/40")}>
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-medium">Jak najszybciej</div>
                            <div className="text-sm opacity-60">Szacowany czas: 30-45 min</div>
                        </div>
                    </button>

                    {/* Scheduled time placeholder - simplified for MVP */}
                    {/* We can add scheduled time selector later */}
                </div>
            </div>
        </div>
    )
}
