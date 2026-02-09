'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Clock, XCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPriceExact } from '@/lib/formatters'

type PaymentState = 'checking' | 'paid' | 'pending' | 'failed'

export default function PaymentReturnPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')

  const [state, setState] = useState<PaymentState>('checking')
  const [order, setOrder] = useState<{
    id: number
    status: string
    payment_status: string
    total: number
    delivery_type: string
  } | null>(null)

  useEffect(() => {
    if (!orderId) {
      router.replace('/menu')
      return
    }

    const supabase = createClient()
    let attempts = 0
    const maxAttempts = 20 // 20 * 3s = 60s max polling

    const checkStatus = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, payment_status, total, delivery_type')
        .eq('id', parseInt(orderId, 10))
        .single()

      if (error || !data) {
        setState('failed')
        return
      }

      setOrder(data)

      if (data.payment_status === 'paid') {
        setState('paid')
        return
      }

      if (data.payment_status === 'failed') {
        setState('failed')
        return
      }

      attempts++
      if (attempts >= maxAttempts) {
        setState('pending')
        return
      }

      // Keep polling
      setTimeout(checkStatus, 3000)
    }

    checkStatus()
  }, [orderId, router])

  if (!orderId) return null

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        {state === 'checking' && (
          <>
            <div className="w-16 h-16 bg-meso-dark-800 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-8 h-8 text-meso-gold-500 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Weryfikujemy płatność...
            </h1>
            <p className="text-white/60 max-w-sm">
              Czekamy na potwierdzenie od Przelewy24. To może potrwać kilka sekund.
            </p>
          </>
        )}

        {state === 'paid' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Płatność przyjęta!
            </h1>
            <p className="text-white/60 mb-1">
              Zamówienie #{orderId}
            </p>
            {order && (
              <p className="text-meso-gold-500 font-bold text-xl mb-4">
                {formatPriceExact(order.total)}
              </p>
            )}
            <p className="text-white/60 max-w-sm mb-2">
              {order?.delivery_type === 'delivery'
                ? 'Twoje zamówienie jest w przygotowaniu. Szacowany czas dostawy: 30-45 min.'
                : 'Twoje zamówienie jest w przygotowaniu. Szacowany czas odbioru: 15-20 min.'}
            </p>
          </>
        )}

        {state === 'pending' && (
          <>
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Oczekujemy na potwierdzenie
            </h1>
            <p className="text-white/60 max-w-sm">
              Płatność jest przetwarzana. Otrzymasz powiadomienie gdy zostanie potwierdzona.
              Możesz sprawdzić status w zakładce Zamówienia.
            </p>
          </>
        )}

        {state === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Płatność nie powiodła się
            </h1>
            <p className="text-white/60 max-w-sm">
              Coś poszło nie tak z płatnością. Spróbuj ponownie lub wybierz inną metodę płatności.
            </p>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 bg-meso-dark-900 border-t border-white/5 p-4 pb-8 space-y-3">
        {state === 'paid' && (
          <button
            onClick={() => router.push(`/orders/${orderId}`)}
            className="w-full bg-meso-red-500 hover:bg-meso-red-600 text-white font-bold h-14 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2"
          >
            Śledź zamówienie
          </button>
        )}

        {state === 'failed' && (
          <button
            onClick={() => router.push('/checkout')}
            className="w-full bg-meso-red-500 hover:bg-meso-red-600 text-white font-bold h-14 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2"
          >
            Spróbuj ponownie
          </button>
        )}

        <button
          onClick={() => router.push('/menu')}
          className="w-full bg-meso-dark-800 hover:bg-meso-dark-700 text-white/80 font-medium h-12 rounded-xl flex items-center justify-center gap-2 border border-white/5"
        >
          <ArrowLeft className="w-5 h-5" />
          Wróć do menu
        </button>
      </div>
    </div>
  )
}
