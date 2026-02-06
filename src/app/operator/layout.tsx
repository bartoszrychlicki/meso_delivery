import type { Metadata } from 'next'
import { OperatorHeader } from '@/components/operator/OperatorHeader'

export const metadata: Metadata = {
    title: 'Panel Operatora | MESO Kitchen',
    description: 'Kucharz Cyfrowy - zarządzanie zamówieniami',
}

export default function OperatorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-meso-dark-950">
            <OperatorHeader />
            <main className="pb-20 md:pb-0">
                {children}
            </main>
        </div>
    )
}
