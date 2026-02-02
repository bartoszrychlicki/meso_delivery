import { ReactNode } from 'react'

export default function CheckoutLayout({
    children,
}: {
    children: ReactNode
}) {
    return (
        <div className="min-h-screen bg-meso-dark-900 font-display">
            {children}
        </div>
    )
}
