import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Support both variable names for flexibility
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey
  )
}
