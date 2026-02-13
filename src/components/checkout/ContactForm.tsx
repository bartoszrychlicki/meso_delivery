'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactSchema, type ContactFormData } from '@/lib/validators/checkout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { MapPin, MessageSquare } from 'lucide-react'

interface ContactFormProps {
    defaultValues?: Partial<ContactFormData>
    savedPhone?: string
    onSubmit: (data: ContactFormData, savePhone: boolean) => void
}

export function ContactForm({ defaultValues, savedPhone, onSubmit }: ContactFormProps) {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, touchedFields, isSubmitted },
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues,
        mode: 'onTouched',
    })

    const currentPhone = watch('phone')
    const [savePhoneChecked, setSavePhoneChecked] = useState(true)

    // Show checkbox only when savedPhone exists AND user typed a different number
    const showSaveCheckbox = !!savedPhone && !!currentPhone && currentPhone !== savedPhone

    const handleFormSubmit = (data: ContactFormData) => {
        let shouldSavePhone: boolean

        if (!savedPhone) {
            // First time - always save
            shouldSavePhone = true
        } else if (data.phone === savedPhone) {
            // Same number - no action needed
            shouldSavePhone = false
        } else {
            // Different number - respect checkbox
            shouldSavePhone = savePhoneChecked
        }

        onSubmit(data, shouldSavePhone)
    }

    const showError = (field: keyof ContactFormData) =>
        errors[field] && (touchedFields[field] || isSubmitted)

    return (
        <form id="address-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Pickup location info */}
            <div className="bg-meso-dark-800 border border-meso-red-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-meso-red-500/10 rounded-lg">
                        <MapPin className="w-5 h-5 text-meso-red-500" />
                    </div>
                    <div>
                        <h4 className="text-white font-medium">Punkt odbioru</h4>
                        <p className="text-white/60 text-sm mt-1">
                            MESO Food, ul. Przykładowa 12, Gdańsk
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-white font-medium">Dane kontaktowe</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">Imię</Label>
                        <Input id="firstName" {...register('firstName')} placeholder="Jan" className="bg-meso-dark-800 border-white/10" />
                        {showError('firstName') && <p className="text-red-400 text-sm">{errors.firstName?.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Nazwisko</Label>
                        <Input id="lastName" {...register('lastName')} placeholder="Kowalski" className="bg-meso-dark-800 border-white/10" />
                        {showError('lastName') && <p className="text-red-400 text-sm">{errors.lastName?.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register('email')} placeholder="jan@example.com" className="bg-meso-dark-800 border-white/10" />
                    {showError('email') && <p className="text-red-400 text-sm">{errors.email?.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-meso-gold-400" />
                        Numer telefonu
                    </Label>
                    <Input id="phone" type="tel" {...register('phone')} placeholder="123456789" maxLength={9} className="bg-meso-dark-800 border-white/10" />
                    <p className="text-white/40 text-xs">Na ten numer wyślemy SMS o statusie Twojego zamówienia</p>
                    {showError('phone') && <p className="text-red-400 text-sm">{errors.phone?.message}</p>}
                </div>

                {showSaveCheckbox && (
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="savePhone"
                            checked={savePhoneChecked}
                            onCheckedChange={(checked) => setSavePhoneChecked(checked === true)}
                        />
                        <label htmlFor="savePhone" className="text-white/60 text-sm cursor-pointer">
                            Zapisz jako domyślny numer telefonu
                        </label>
                    </div>
                )}
            </div>
        </form>
    )
}
