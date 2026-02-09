'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Category } from '@/types/menu'

interface CategoryGridProps {
    categories: Category[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
    return (
        <div className="py-8">
            <div className="flex items-center gap-2 mb-6 px-4">
                <div className="w-1 h-6 bg-meso-red-500 rounded-full" />
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Kategorie</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 container mx-auto">
                {categories.map((category) => (
                    <Link
                        key={category.id}
                        href={`/menu?category=${category.slug}`}
                        className="group relative overflow-hidden rounded-2xl bg-meso-dark-800 border border-white/5 aspect-[4/3] flex flex-col items-center justify-center p-4 transition-all hover:border-meso-red-500/50 hover:bg-meso-dark-700"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-meso-red-500/0 to-meso-red-500/0 group-hover:from-meso-red-500/5 group-hover:to-purple-600/10 transition-all duration-500" />

                        <span className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                            {category.icon || '🍱'}
                        </span>

                        <h3 className="text-lg font-bold text-white uppercase text-center group-hover:text-meso-red-500 transition-colors">
                            {category.name}
                        </h3>

                        {category.name_jp && (
                            <span className="text-xs text-zinc-500 font-jp opacity-50">
                                {category.name_jp}
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    )
}
