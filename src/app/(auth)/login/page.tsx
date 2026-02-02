'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogIn, Loader2, Mail, Lock, Smartphone, Chrome } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isPermanent, isLoading: authLoading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const redirectTo = searchParams.get('redirect') || '/menu'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Redirect if already logged in as permanent user
  useEffect(() => {
    if (!authLoading && isPermanent) {
      router.push(redirectTo)
    }
  }, [authLoading, isPermanent, redirectTo, router])

  // Show nothing while redirecting
  if (!authLoading && isPermanent) {
    return null
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Nieprawidłowy email lub hasło')
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Potwierdź swój email przed zalogowaniem')
        } else {
          toast.error(error.message)
        }
        return
      }

      toast.success('Witaj ponownie!')
      router.push(redirectTo)
      router.refresh()
    } catch (error) {
      toast.error('Wystąpił błąd. Spróbuj ponownie.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-meso-red-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-meso-red-500/20 flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-7 h-7 text-meso-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Zaloguj się
        </h1>
        <p className="text-white/60">
          Wróć do swojego konta MESO Club
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/80">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.pl"
              {...register('email')}
              className="pl-10 bg-meso-dark-800 border-white/10 text-white placeholder:text-white/40 focus:border-meso-red-500"
            />
          </div>
          {errors.email && (
            <p className="text-red-400 text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-white/80">
              Hasło
            </Label>
            <Link
              href="/forgot-password"
              className="text-sm text-meso-red-500 hover:text-meso-red-400"
            >
              Zapomniałeś hasła?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="pl-10 bg-meso-dark-800 border-white/10 text-white placeholder:text-white/40 focus:border-meso-red-500"
            />
          </div>
          {errors.password && (
            <p className="text-red-400 text-sm">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-meso-red-500 hover:bg-meso-red-600 text-white font-semibold h-11 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Logowanie...
            </>
          ) : (
            <>
              Zaloguj się
              <LogIn className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <Separator className="bg-white/10" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-meso-dark-950 px-3 text-sm text-white/40">
          lub
        </span>
      </div>

      {/* Social login (mock) */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          disabled
          className="w-full h-11 bg-meso-dark-800/50 border-white/10 text-white/40 cursor-not-allowed"
          title="Wkrótce dostępne"
        >
          <Smartphone className="w-5 h-5 mr-3" />
          Zaloguj przez Telefon
          <span className="ml-auto text-xs opacity-50">Wkrótce</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled
          className="w-full h-11 bg-meso-dark-800/50 border-white/10 text-white/40 cursor-not-allowed"
          title="Wkrótce dostępne"
        >
          <Chrome className="w-5 h-5 mr-3" />
          Zaloguj przez Google
          <span className="ml-auto text-xs opacity-50">Wkrótce</span>
        </Button>
      </div>

      {/* Register link */}
      <div className="text-center pt-4 border-t border-white/10">
        <p className="text-white/50">
          Nie masz jeszcze konta?{' '}
          <Link href="/account/upgrade" className="text-meso-gold-400 hover:text-meso-gold-300 font-medium">
            Załóż za darmo
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-meso-red-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
