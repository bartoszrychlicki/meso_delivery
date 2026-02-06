'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactSchema, type ContactFormData } from '@/lib/validators/checkout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin } from 'lucide-react'

interface ContactFormProps {
    defaultValues?: Partial<ContactFormData>
    onSubmit: (data: ContactFormData) => void
}

export function ContactForm({ defaultValues, onSubmit }: ContactFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues,
        mode: 'onBlur',
    })

    return (
        <form id="address-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                        {errors.firstName && <p className="text-red-400 text-sm">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Nazwisko</Label>
                        <Input id="lastName" {...register('lastName')} placeholder="Kowalski" className="bg-meso-dark-800 border-white/10" />
                        {errors.lastName && <p className="text-red-400 text-sm">{errors.lastName.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register('email')} placeholder="jan@example.com" className="bg-meso-dark-800 border-white/10" />
                    {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input id="phone" type="tel" {...register('phone')} placeholder="123456789" maxLength={9} className="bg-meso-dark-800 border-white/10" />
                    {errors.phone && <p className="text-red-400 text-sm">{errors.phone.message}</p>}
                </div>
            </div>
        </form>
    )
}
