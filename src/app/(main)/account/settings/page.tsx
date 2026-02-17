'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Phone, Calendar, Bell, Megaphone, Trash2, Lock, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Customer } from '@/types'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const profileSchema = z.object({
    name: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki'),
    phone: z.string().regex(/^\+?\d{9,15}$/, 'Nieprawidłowy numer telefonu').optional().or(z.literal('')),
    birthday: z.string().optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function SettingsPage() {
    const { user, isLoading: authLoading, signOut } = useAuth()
    const [customer, setCustomer] = useState<Customer | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [marketingConsent, setMarketingConsent] = useState(false)
    const [pushNotifications, setPushNotifications] = useState(false)

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            phone: '',
            birthday: '',
        },
    })

    useEffect(() => {
        async function fetchCustomer() {
            if (!user?.id) {
                setIsLoading(false)
                return
            }

            const supabase = createClient()
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) {
                console.error('Error fetching customer:', error)
            } else if (data) {
                setCustomer(data)
                form.reset({
                    name: data.name || '',
                    phone: data.phone || '',
                    birthday: data.birthday || '',
                })
                setMarketingConsent(data.marketing_consent || false)
            }
            setIsLoading(false)
        }

        if (!authLoading) {
            fetchCustomer()
        }
    }, [user?.id, authLoading, form])

    const onSubmit = async (data: ProfileFormData) => {
        if (!user?.id) return

        setIsSaving(true)
        const supabase = createClient()

        const { error } = await supabase
            .from('customers')
            .update({
                name: data.name,
                phone: data.phone || null,
                birthday: data.birthday || null,
            })
            .eq('id', user.id)

        if (error) {
            console.error('Error updating profile:', error)
            toast.error('Nie udało się zaktualizować profilu')
        } else {
            toast.success('Profil został zaktualizowany')
        }

        setIsSaving(false)
    }

    const handleMarketingToggle = async (checked: boolean) => {
        setMarketingConsent(checked)

        if (!user?.id) return

        const supabase = createClient()
        const { error } = await supabase
            .from('customers')
            .update({ marketing_consent: checked })
            .eq('id', user.id)

        if (error) {
            console.error('Error updating marketing consent:', error)
            toast.error('Nie udało się zaktualizować ustawień')
            setMarketingConsent(!checked) // Revert
        } else {
            toast.success(checked ? 'Marketing włączony' : 'Marketing wyłączony')
        }
    }

    const handleResetPassword = async () => {
        if (!user?.email) {
            toast.error('Brak adresu email')
            return
        }

        const supabase = createClient()
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) {
            console.error('Error sending reset email:', error)
            toast.error('Nie udało się wysłać emaila')
        } else {
            toast.success('Link do zmiany hasła wysłany na email')
        }
    }

    const handleDeleteAccount = async () => {
        // Note: Full account deletion requires backend implementation
        // For now, just sign out and show a message
        toast.info('Skontaktuj się z nami aby usunąć konto: kontakt@mesofood.pl')
        await signOut()
    }

    if (authLoading || isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/account" className="text-white/60 hover:text-white">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-white">Ustawienia</h1>
            </div>

            {/* Profile Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="bg-card/50 rounded-xl p-5 border border-white/5 space-y-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Dane profilu
                    </h2>

                    <div>
                        <label className="block text-sm text-white/60 mb-1">Imię i nazwisko</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <Input
                                {...form.register('name')}
                                placeholder="Jan Kowalski"
                                className="pl-10 bg-background border-white/10 text-white"
                            />
                        </div>
                        {form.formState.errors.name && (
                            <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm text-white/60 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <Input
                                value={user?.email || ''}
                                disabled
                                className="pl-10 bg-background border-white/10 text-white/50"
                            />
                        </div>
                        <p className="text-xs text-white/40 mt-1">Email nie może być zmieniony</p>
                    </div>

                    <div>
                        <label className="block text-sm text-white/60 mb-1">Telefon</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <Input
                                {...form.register('phone')}
                                placeholder="+48 123 456 789"
                                className="pl-10 bg-background border-white/10 text-white"
                            />
                        </div>
                        {form.formState.errors.phone && (
                            <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm text-white/60 mb-1">Data urodzin</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <Input
                                {...form.register('birthday')}
                                type="date"
                                className="pl-10 bg-background border-white/10 text-white [&::-webkit-calendar-picker-indicator]:invert"
                            />
                        </div>
                        <p className="text-xs text-white/40 mt-1">Zdobywaj x2 punkty w urodziny!</p>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-primary hover:bg-primary/90"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Zapisz zmiany
                    </Button>
                </div>
            </form>

            {/* Notifications */}
            <div className="bg-card/50 rounded-xl p-5 border border-white/5 space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Powiadomienia
                </h2>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white">Push notifications</p>
                        <p className="text-sm text-white/50">Statusy zamówień, promocje</p>
                    </div>
                    <Switch
                        checked={pushNotifications}
                        onCheckedChange={setPushNotifications}
                        disabled // PWA push not implemented yet
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white flex items-center gap-2">
                            <Megaphone className="w-4 h-4" />
                            Marketing
                        </p>
                        <p className="text-sm text-white/50">Nowości, promocje, oferty specjalne</p>
                    </div>
                    <Switch
                        checked={marketingConsent}
                        onCheckedChange={handleMarketingToggle}
                    />
                </div>
            </div>

            {/* Security */}
            <div className="bg-card/50 rounded-xl p-5 border border-white/5 space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    Bezpieczeństwo
                </h2>

                <Button
                    variant="outline"
                    onClick={handleResetPassword}
                    className="w-full border-white/10 text-white/70 hover:text-white hover:bg-white/5"
                >
                    <Lock className="w-4 h-4 mr-2" />
                    Zmień hasło
                </Button>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-950/20 rounded-xl p-5 border border-red-500/20 space-y-4">
                <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Strefa niebezpieczna
                </h2>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Usuń konto
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-background border-white/10">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Czy na pewno chcesz usunąć konto?</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/60">
                                Ta akcja jest nieodwracalna. Utracisz wszystkie punkty lojalnościowe, historię zamówień i zapisane adresy.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-transparent border-white/10 text-white/70 hover:text-white hover:bg-white/5">
                                Anuluj
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteAccount}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Usuń konto
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <p className="text-xs text-white/40 text-center">
                    W celu usunięcia konta skontaktuj się z nami: kontakt@mesofood.pl
                </p>
            </div>
        </div>
    )
}
