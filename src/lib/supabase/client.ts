import { createBrowserClient } from '@supabase/ssr'

// Custom lock function with real timeout.
// The default @supabase/auth-js navigatorLock waits FOREVER when acquireTimeout > 0,
// which causes auth operations to hang when another tab holds the lock.
async function lockWithTimeout<R>(
  name: string,
  acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> {
  if (typeof navigator === 'undefined' || !navigator?.locks) {
    return await fn()
  }

  const timeout = acquireTimeout > 0 ? acquireTimeout : 5000
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeout)

  try {
    return await navigator.locks.request(
      name,
      { mode: 'exclusive', signal: ac.signal },
      async () => {
        clearTimeout(timer)
        return await fn()
      }
    )
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof DOMException && err.name === 'AbortError') {
      // Lock acquire timed out — proceed without lock to avoid hanging forever
      return await fn()
    }
    throw err
  }
}

export function createClient() {
  // Support both variable names for flexibility
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey,
    {
      auth: {
        lock: lockWithTimeout,
      },
    }
  )
}
