'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Gift, Star, Check, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

const upgradeSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(8, 'Hasło musi mieć minimum 8 znaków'),
  confirmPassword: z.string(),
  marketingConsent: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
})

type UpgradeFormData = z.infer<typeof upgradeSchema>

const BENEFITS = [
  { icon: '🎁', text: '50 punktów na start' },
  { icon: '🍜', text: '1 zł = 1 punkt za zamówienia' },
  { icon: '🎉', text: 'Darmowe dania za punkty' },
  { icon: '🎂', text: '2x punkty w urodziny' },
  { icon: '👥', text: 'Bonus za polecenia znajomych' },
]

export default function UpgradeAccountPage() {
  const router = useRouter()
  const { isPermanent, isLoading: authLoading, refreshSession, session } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionError, setSessionError] = useState(false)
  const supabase = createClient()

  // Ensure session exists on page load
  useEffect(() => {
    const ensureSession = async () => {
      if (!authLoading && !session) {
        // Try to create anonymous session
        const { error } = await supabase.auth.signInAnonymously()
        if (error) {
          setSessionError(true)
        }
      }
    }
    ensureSession()
  }, [authLoading, session, supabase])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpgradeFormData>({
    resolver: zodResolver(upgradeSchema),
    defaultValues: {
      marketingConsent: false,
    },
  })

  const marketingConsent = watch('marketingConsent')

  // Redirect if already permanent user
  if (!authLoading && isPermanent) {
    router.push('/account')
    return null
  }

  const onSubmit = async (data: UpgradeFormData) => {
    setIsSubmitting(true)

    try {
      // First check if we have a session
      const { data: { session: currentSession } } = await supabase.auth.getSession()

      if (!currentSession) {
        // No session - try to create anonymous session first
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously()

        if (anonError || !anonData.session) {
          toast.error('Nie udało się nawiązać połączenia. Odśwież stronę i spróbuj ponownie.')
          return
        }
      }

      // Update the anonymous user with email and password
      const { error } = await supabase.auth.updateUser({
        email: data.email,
        password: data.password,
        data: {
          marketing_consent: data.marketingConsent,
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Ten email jest już zarejestrowany. Spróbuj się zalogować.')
        } else if (error.message.includes('Auth session missing')) {
          toast.error('Sesja wygasła. Odśwież stronę i spróbuj ponownie.')
          // Try to restore session
          await supabase.auth.signInAnonymously()
        } else {
          toast.error(error.message)
        }
        return
      }

      // Success - email verification required
      toast.success(
        'Sprawdź swoją skrzynkę email!',
        {
          description: 'Kliknij link w wiadomości, aby aktywować konto i odebrać 50 punktów.',
          duration: 8000,
        }
      )

      // Redirect to menu with a note
      router.push('/menu?upgrade=pending')
    } catch (error) {
      toast.error('Wystąpił błąd. Spróbuj ponownie.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-meso-red-500" />
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white/60 text-center">
          Nie udało się nawiązać połączenia z serwerem.
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="border-meso-red-500/30 text-meso-red-400"
        >
          Odśwież stronę
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-meso-gold-500/20 flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-meso-gold-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Dołącz do MESO Club
        </h1>
        <p className="text-white/60">
          Załóż darmowe konto i zacznij zbierać punkty za zamówienia!
        </p>
      </div>

      {/* Benefits */}
      <div className="bg-meso-dark-800/50 rounded-xl p-4 mb-8 border border-meso-gold-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-meso-gold-400" />
          <span className="font-medium text-white">Co zyskujesz?</span>
        </div>
        <div className="space-y-2">
          {BENEFITS.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              <span>{benefit.icon}</span>
              <span className="text-white/70">{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/80">
            Adres email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="twoj@email.pl"
            {...register('email')}
            className="bg-meso-dark-800 border-white/10 text-white placeholder:text-white/40 focus:border-meso-red-500"
          />
          {errors.email && (
            <p className="text-red-400 text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-white/80">
            Hasło
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Minimum 8 znaków"
            {...register('password')}
            className="bg-meso-dark-800 border-white/10 text-white placeholder:text-white/40 focus:border-meso-red-500"
          />
          {errors.password && (
            <p className="text-red-400 text-sm">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-white/80">
            Powtórz hasło
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Powtórz hasło"
            {...register('confirmPassword')}
            className="bg-meso-dark-800 border-white/10 text-white placeholder:text-white/40 focus:border-meso-red-500"
          />
          {errors.confirmPassword && (
            <p className="text-red-400 text-sm">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="marketingConsent"
            checked={marketingConsent}
            onCheckedChange={(checked) => setValue('marketingConsent', !!checked)}
            className="mt-1 border-white/30 data-[state=checked]:bg-meso-red-500 data-[state=checked]:border-meso-red-500"
          />
          <Label
            htmlFor="marketingConsent"
            className="text-sm text-white/60 cursor-pointer"
          >
            Chcę otrzymywać informacje o promocjach, nowościach i ekskluzywnych ofertach MESO
          </Label>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-meso-gold-500 hover:bg-meso-gold-600 text-black font-semibold h-12 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Tworzenie konta...
            </>
          ) : (
            <>
              Załóż konto i odbierz 50 pkt
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </form>

      {/* Login link */}
      <div className="text-center mt-6 pt-6 border-t border-white/10">
        <p className="text-white/50 text-sm">
          Masz już konto?{' '}
          <Link href="/login" className="text-meso-red-500 hover:text-meso-red-400">
            Zaloguj się
          </Link>
        </p>
      </div>

      {/* Terms */}
      <p className="text-center text-white/40 text-xs mt-6">
        Zakładając konto akceptujesz{' '}
        <Link href="/regulamin" className="underline hover:text-white/60">
          Regulamin
        </Link>{' '}
        oraz{' '}
        <Link href="/polityka-prywatnosci" className="underline hover:text-white/60">
          Politykę Prywatności
        </Link>
      </p>
    </div>
  )
}
