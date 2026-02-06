'use client'

import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface TermsAcceptanceProps {
    accepted: boolean
    onChange: (accepted: boolean) => void
    error?: string
}

export function TermsAcceptance({ accepted, onChange, error }: TermsAcceptanceProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-start gap-3">
                <Checkbox
                    id="terms-acceptance"
                    checked={accepted}
                    onCheckedChange={(checked) => onChange(checked === true)}
                    className="mt-0.5 border-white/30 data-[state=checked]:bg-meso-red-500 data-[state=checked]:border-meso-red-500"
                />
                <Label
                    htmlFor="terms-acceptance"
                    className="text-sm text-white/80 leading-relaxed cursor-pointer"
                >
                    Akceptuję{' '}
                    <Link
                        href="/regulamin"
                        target="_blank"
                        className="text-meso-red-500 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Regulamin
                    </Link>
                    {' '}oraz{' '}
                    <Link
                        href="/polityka-prywatnosci"
                        target="_blank"
                        className="text-meso-red-500 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Politykę Prywatności
                    </Link>
                    <span className="text-meso-red-500"> *</span>
                </Label>
            </div>
            {error && (
                <p className="text-sm text-red-500 ml-7">{error}</p>
            )}
        </div>
    )
}
