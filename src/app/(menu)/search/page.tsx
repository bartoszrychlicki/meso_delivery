'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/formatters'

interface Product {
  id: string
  name: string
  name_jp: string | null
  price: number
  image_url: string | null
  description: string | null
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, name_jp, price, image_url, description')
      .ilike('name', `%${searchQuery}%`)
      .limit(20)

    setResults(data ?? [])
    setIsSearching(false)
  }, [])

  useEffect(() => {
    searchProducts(debouncedQuery) // eslint-disable-line react-hooks/set-state-in-effect
  }, [debouncedQuery, searchProducts])

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Search Input */}
      <div className="max-w-[640px] mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Czego szukasz?"
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 neon-border"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground text-center">
          Wpisz nazwę dania, składnik lub kategorię...
        </p>
      </div>

      {/* Loading */}
      {isSearching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State - no query */}
      {!query && !hasSearched && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">Wpisz nazwę dania, aby wyszukać</p>
        </div>
      )}

      {/* No Results */}
      {!isSearching && hasSearched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm font-medium">Brak wyników</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Spróbuj innej frazy wyszukiwania
          </p>
        </div>
      )}

      {/* Results Grid */}
      {!isSearching && results.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {results.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/product/${product.id}`}
                  className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30"
                >
                  <div className="relative aspect-square bg-secondary">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">
                        🍜
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold leading-tight">{product.name}</p>
                    {product.name_jp && (
                      <p className="mt-0.5 text-xs text-muted-foreground font-japanese">{product.name_jp}</p>
                    )}
                    <p className="mt-2 text-sm font-bold text-accent">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
