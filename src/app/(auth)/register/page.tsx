'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User, Phone, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

const upgradeSchema = z.object({
  name: z.string().min(2, 'Imię musi mieć minimum 2 znaki'),
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(8, 'Hasło musi mieć minimum 8 znaków'),
  confirmPassword: z.string(),
  marketingConsent: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
})

type UpgradeFormData = z.infer<typeof upgradeSchema>

export default function UpgradeAccountPage() {
  const router = useRouter()
  const { isPermanent, isLoading: authLoading, session } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [sessionError, setSessionError] = useState(false)
  const [referralPhone, setReferralPhone] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const ensureSession = async () => {
      if (!authLoading && !session) {
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

  if (!authLoading && isPermanent) {
    router.push('/account')
    return null
  }

  const onSubmit = async (data: UpgradeFormData) => {
    setIsSubmitting(true)

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()

      if (!currentSession) {
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously()
        if (anonError || !anonData.session) {
          toast.error('Nie udało się nawiązać połączenia. Odśwież stronę i spróbuj ponownie.')
          return
        }
      }

      const { error } = await supabase.auth.updateUser({
        email: data.email,
        password: data.password,
        data: {
          name: data.name,
          marketing_consent: data.marketingConsent,
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Ten email jest już zarejestrowany. Spróbuj się zalogować.')
        } else if (error.message.includes('Auth session missing')) {
          toast.error('Sesja wygasła. Odśwież stronę i spróbuj ponownie.')
          await supabase.auth.signInAnonymously()
        } else {
          toast.error(error.message)
        }
        return
      }

      // Upgrade the customer record from anonymous → permanent
      // (the INSERT trigger doesn't fire on updateUser, so we do it here)
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        await fetch('/api/auth/upgrade-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.name, marketingConsent: data.marketingConsent }),
        })
      }

      // Apply referral if phone was provided
      if (referralPhone.trim()) {
        try {
          await fetch('/api/loyalty/apply-referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referral_phone: referralPhone.trim() }),
          })
        } catch {
          // Referral is optional — don't block registration on failure
        }
      }

      toast.success(
        'Sprawdź swoją skrzynkę email!',
        {
          description: 'Kliknij link w wiadomości, aby aktywować konto i odebrać 50 punktów.',
          duration: 8000,
        }
      )

      router.push('/?upgrade=pending')
    } catch {
      toast.error('Wystąpił błąd. Spróbuj ponownie.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">
          Nie udało się nawiązać połączenia z serwerem.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl border border-border px-4 py-2 text-sm text-primary hover:bg-secondary"
        >
          Odśwież stronę
        </button>
      </div>
    )
  }

  const inputCls = 'w-full rounded-xl border border-border bg-secondary/50 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-secondary/50 focus:outline-none'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Neon MESO heading */}
      <Link href="/" className="mb-8 block text-center font-display text-3xl font-bold tracking-[0.3em] text-primary neon-text">
        MESO
      </Link>

      <h2 className="mb-6 text-center font-display text-lg font-semibold tracking-wider">
        ZAREJESTRUJ SIĘ
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Imię"
              autoComplete="name"
              {...register('name')}
              className={`${inputCls} pl-10 pr-4`}
            />
          </div>
          {errors.name && (
            <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              {...register('email')}
              className={`${inputCls} pl-10 pr-4`}
            />
          </div>
          {errors.email && (
            <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Hasło (min. 8 znaków)"
              autoComplete="new-password"
              {...register('password')}
              className={`${inputCls} pl-10 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showConfirmPass ? 'text' : 'password'}
              placeholder="Powtórz hasło"
              autoComplete="new-password"
              {...register('confirmPassword')}
              className={`${inputCls} pl-10 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Marketing consent */}
        <div className="flex items-start gap-3 pt-1">
          <Checkbox
            id="marketingConsent"
            checked={marketingConsent}
            onCheckedChange={(checked) => setValue('marketingConsent', !!checked)}
            className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <Label
            htmlFor="marketingConsent"
            className="text-xs text-muted-foreground cursor-pointer leading-relaxed"
          >
            Chcę otrzymywać informacje o promocjach, nowościach i ekskluzywnych ofertach MESO
          </Label>
        </div>

        {/* Referral phone (optional) */}
        <div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="tel"
              value={referralPhone}
              onChange={(e) => setReferralPhone(e.target.value)}
              placeholder="Nr telefonu polecającego (opcjonalnie)"
              autoComplete="off"
              className={`${inputCls} pl-10 pr-4`}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Podaj numer osoby, która Cię poleciła — dostaniesz kupon powitalny na darmowe Gyoza!
          </p>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-accent py-3 font-display text-sm font-semibold tracking-wider text-accent-foreground neon-glow-yellow transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              TWORZENIE KONTA...
            </span>
          ) : (
            'ZAREJESTRUJ'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-5">
        <Separator className="bg-border" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-xs text-muted-foreground">
          lub
        </span>
      </div>

      {/* Google button */}
      <button
        type="button"
        disabled
        className="w-full rounded-xl border border-border bg-transparent py-3 text-sm font-medium text-foreground transition-colors hover:bg-card/50 disabled:opacity-50"
      >
        Kontynuuj z Google
      </button>

      {/* Skip link */}
      <Link
        href="/"
        className="block text-center text-xs text-muted-foreground hover:text-foreground mt-3"
      >
        Pomiń i przeglądaj menu →
      </Link>

      {/* Login link */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Masz już konto?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Zaloguj się
        </Link>
      </p>

      {/* Terms */}
      <p className="text-center text-muted-foreground/60 text-[10px] mt-4">
        Zakładając konto akceptujesz{' '}
        <Link href="/regulamin" className="underline hover:text-muted-foreground">
          Regulamin
        </Link>{' '}
        oraz{' '}
        <Link href="/polityka-prywatnosci" className="underline hover:text-muted-foreground">
          Politykę Prywatności
        </Link>
      </p>
    </motion.div>
  )
}
