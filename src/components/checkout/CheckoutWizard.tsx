'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
    id: string
    label: string
}

interface CheckoutWizardProps {
    currentStep: number
    steps: Step[]
}

export function CheckoutWizard({ currentStep, steps }: CheckoutWizardProps) {
    return (
        <div className="w-full">
            <div className="relative flex justify-between">
                {/* Progress Line */}
                <div className="absolute top-4 left-0 w-full h-0.5 bg-meso-dark-800 -z-10">
                    <div
                        className="h-full bg-meso-red-500 transition-all duration-300"
                        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    />
                </div>

                {/* Steps */}
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep
                    const isCurrent = index === currentStep

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                                isCompleted
                                    ? "bg-meso-red-500 border-meso-red-500 text-white"
                                    : isCurrent
                                        ? "bg-meso-dark-900 border-meso-red-500 text-meso-red-500"
                                        : "bg-meso-dark-900 border-meso-dark-800 text-white/40"
                            )}>
                                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                            </div>
                            <span className={cn(
                                "text-xs font-medium transition-colors",
                                isCurrent ? "text-white" : "text-white/40"
                            )}>
                                {step.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
