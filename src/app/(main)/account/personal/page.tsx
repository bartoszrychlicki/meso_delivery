'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface PersonalData {
  first_name: string
  last_name: string
  email: string
  phone: string
  birthday: string
}

export default function PersonalPage() {
  const { user, isPermanent, isLoading: authLoading } = useAuth()
  const [form, setForm] = useState<PersonalData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birthday: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    if (!user || !isPermanent) {
      setIsLoadingData(false)
      return
    }

    async function loadData() {
      const supabase = createClient()
      const { data } = await supabase
        .from('customers')
        .select('first_name, last_name, email, phone, birthday')
        .eq('auth_id', user!.id)
        .single()

      if (data) {
        setForm({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          email: data.email ?? user!.email ?? '',
          phone: data.phone ?? '',
          birthday: data.birthday ?? '',
        })
      } else {
        setForm((prev) => ({ ...prev, email: user!.email ?? '' }))
      }
      setIsLoadingData(false)
    }

    loadData()
  }, [user, isPermanent])

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    setSaved(false)

    const supabase = createClient()
    await supabase
      .from('customers')
      .update({
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        phone: form.phone || null,
        birthday: form.birthday || null,
      })
      .eq('auth_id', user.id)

    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (authLoading || isLoadingData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isPermanent) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <p className="mb-4 text-sm text-muted-foreground">Zaloguj sie, aby edytowac dane</p>
        <Link href="/login">
          <Button className="bg-accent text-accent-foreground">Zaloguj sie</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Back */}
      <Link href="/account" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Profil
      </Link>

      <h1 className="font-display text-xl font-bold">Dane osobowe</h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* First Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Imie</label>
          <input
            type="text"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            placeholder="Jan"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Last Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Nazwisko</label>
          <input
            type="text"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            placeholder="Kowalski"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Email (readonly) */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <input
            type="email"
            value={form.email}
            readOnly
            className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground cursor-not-allowed"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Telefon</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+48 500 000 000"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Birthday */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Data urodzenia</label>
          <input
            type="date"
            value={form.birthday}
            onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-accent text-accent-foreground neon-glow-yellow h-12 font-semibold"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              Zapisano
            </>
          ) : (
            'Zapisz zmiany'
          )}
        </Button>
      </motion.div>
    </div>
  )
}
