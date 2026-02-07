'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addressSchema, type AddressFormData } from '@/lib/validators/checkout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface AddressFormProps {
    defaultValues?: Partial<AddressFormData>
    onSubmit: (data: AddressFormData) => void
}

export function AddressForm({ defaultValues, onSubmit }: AddressFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields, isSubmitted },
    } = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema),
        defaultValues: defaultValues || {
            city: 'Gdańsk', // Default city for this delivery zone
        },
        mode: 'onTouched',
    })

    const showError = (field: keyof AddressFormData) =>
        errors[field] && (touchedFields[field] || isSubmitted)

    return (
        <form id="address-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register('email')} placeholder="jan@example.com" className="bg-meso-dark-800 border-white/10" />
                    {showError('email') && <p className="text-red-400 text-sm">{errors.email?.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input id="phone" type="tel" {...register('phone')} placeholder="123456789" maxLength={9} className="bg-meso-dark-800 border-white/10" />
                    {showError('phone') && <p className="text-red-400 text-sm">{errors.phone?.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="street">Ulica</Label>
                <Input id="street" {...register('street')} placeholder="Długa" className="bg-meso-dark-800 border-white/10" />
                {showError('street') && <p className="text-red-400 text-sm">{errors.street?.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="houseNumber">Nr domu</Label>
                    <Input id="houseNumber" {...register('houseNumber')} placeholder="12A" className="bg-meso-dark-800 border-white/10" />
                    {showError('houseNumber') && <p className="text-red-400 text-sm">{errors.houseNumber?.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="apartmentNumber">Nr lokalu</Label>
                    <Input id="apartmentNumber" {...register('apartmentNumber')} placeholder="5" className="bg-meso-dark-800 border-white/10" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="postalCode">Kod pocztowy</Label>
                    <Input id="postalCode" {...register('postalCode')} placeholder="80-001" maxLength={6} className="bg-meso-dark-800 border-white/10" />
                    {showError('postalCode') && <p className="text-red-400 text-sm">{errors.postalCode?.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="city">Miasto</Label>
                <Input id="city" {...register('city')} readOnly className="bg-meso-dark-800/50 border-white/5 text-white/50 cursor-not-allowed" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Uwagi dla kuriera (opcjonalne)</Label>
                <Textarea id="notes" {...register('notes')} placeholder="Kod do domofonu, piętro itp." className="bg-meso-dark-800 border-white/10" />
            </div>
        </form>
    )
}
