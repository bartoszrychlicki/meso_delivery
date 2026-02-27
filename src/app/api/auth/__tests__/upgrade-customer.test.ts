import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Helpers: chainable Supabase mock builder
// ---------------------------------------------------------------------------

type MockChainResult = {
  data: unknown
  error: unknown
  count?: number | null
}

/**
 * Creates a proxy that supports arbitrary chaining of Supabase query methods
 * (.from().select().eq().update()...) and resolves to `result` at the terminal
 * call (.single(), .maybeSingle(), or when awaited directly).
 */
function chain(result: MockChainResult = { data: null, error: null, count: null }): Record<string, unknown> {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      // Terminal methods -- return the result promise-like
      if (prop === 'single' || prop === 'maybeSingle') {
        return () => Promise.resolve(result)
      }
      // When awaited (thenable)
      if (prop === 'then') {
        return (resolve: (v: MockChainResult) => void) => resolve(result)
      }
      // Everything else returns the same proxy so chaining continues
      return (..._args: unknown[]) => new Proxy({}, handler)
    },
  }
  return new Proxy({}, handler)
}

// ---------------------------------------------------------------------------
// Mock: @supabase/supabase-js
// ---------------------------------------------------------------------------

const mockRpc = vi.fn()
const mockFrom = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: mockRpc,
    from: mockFrom,
    auth: { admin: { getUserById: vi.fn() } },
  })),
}))

// ---------------------------------------------------------------------------
// Utility: build NextRequest for route handlers
// ---------------------------------------------------------------------------
function makeRequest(
  method: 'GET' | 'POST',
  body?: Record<string, unknown>,
  searchParams?: Record<string, string>,
) {
  const url = new URL('http://localhost:3000/api/auth/upgrade-customer')
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  if (method === 'GET') {
    return new NextRequest(url)
  }
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
    headers: { 'Content-Type': 'application/json' },
  })
}

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------
const USER_ID = 'user-123'

beforeEach(() => {
  vi.clearAllMocks()
})

// ===========================================================================
// POST /api/auth/upgrade-customer
// ===========================================================================

describe('POST /api/auth/upgrade-customer', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeEach(async () => {
    const mod = await import('../upgrade-customer/route')
    POST = mod.POST
  })

  // ---- 400: Missing email ----
  it('returns 400 when email is missing', async () => {
    const res = await POST(makeRequest('POST', {}))
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toBe('Missing email')
  })

  // ---- 200: Deferred to trigger (RPC returns null userId) ----
  it('returns 200 with deferred message when RPC returns null userId', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })

    const res = await POST(makeRequest('POST', { email: 'test@example.com' }))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.message).toBe('Deferred to trigger')
  })

  // ---- 200: Deferred to trigger (RPC returns error) ----
  it('returns 200 with deferred message when RPC returns an error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } })

    const res = await POST(makeRequest('POST', { email: 'test@example.com' }))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.message).toBe('Deferred to trigger')
  })

  // ---- 404: Customer not found ----
  it('returns 404 when customer does not exist', async () => {
    mockRpc.mockResolvedValue({ data: USER_ID, error: null })

    mockFrom.mockImplementation(() => {
      // customers select returns null (not found)
      return chain({ data: null, error: null })
    })

    const res = await POST(makeRequest('POST', { email: 'test@example.com' }))
    expect(res.status).toBe(404)

    const json = await res.json()
    expect(json.error).toBe('Customer not found')
  })

  // ---- 200: Already permanent ----
  it('returns 200 with already permanent message when customer is not anonymous', async () => {
    mockRpc.mockResolvedValue({ data: USER_ID, error: null })

    mockFrom.mockImplementation(() => {
      return chain({
        data: { id: USER_ID, is_anonymous: false, loyalty_points: 100, lifetime_points: 100 },
        error: null,
      })
    })

    const res = await POST(makeRequest('POST', { email: 'test@example.com' }))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.message).toBe('Already permanent')
  })

  // ---- 500: Update fails ----
  it('returns 500 when customer update fails', async () => {
    mockRpc.mockResolvedValue({ data: USER_ID, error: null })

    let callN = 0
    mockFrom.mockImplementation(() => {
      callN++
      if (callN === 1) {
        // customers select -- anonymous customer found
        return chain({
          data: { id: USER_ID, is_anonymous: true, loyalty_points: 0, lifetime_points: 0 },
          error: null,
        })
      }
      if (callN === 2) {
        // customers update -- fails
        return chain({ data: null, error: { message: 'DB update error' } })
      }
      return chain({ data: null, error: null })
    })

    const res = await POST(makeRequest('POST', { email: 'test@example.com', name: 'Jan' }))
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('Failed to upgrade')
  })

  // ---- 200: Successful upgrade ----
  it('returns 200 with updated points on successful upgrade', async () => {
    mockRpc.mockResolvedValue({ data: USER_ID, error: null })

    const fromCalls: string[] = []
    let callN = 0
    mockFrom.mockImplementation((table: string) => {
      fromCalls.push(table)
      callN++
      if (callN === 1) {
        // customers select -- anonymous customer with 0 points
        return chain({
          data: { id: USER_ID, is_anonymous: true, loyalty_points: 0, lifetime_points: 0 },
          error: null,
        })
      }
      if (callN === 2) {
        // customers update -- success
        return chain({ data: null, error: null })
      }
      if (callN === 3) {
        // loyalty_history insert -- success
        return chain({ data: null, error: null })
      }
      return chain({ data: null, error: null })
    })

    const res = await POST(makeRequest('POST', { email: 'test@example.com', name: 'Jan', marketingConsent: true }))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.points).toBe(50)

    // Verify the correct tables were called
    expect(fromCalls[0]).toBe('crm_customers')
    expect(fromCalls[1]).toBe('crm_customers')
    expect(fromCalls[2]).toBe('crm_loyalty_transactions')

    // Verify RPC was called with correct arguments
    expect(mockRpc).toHaveBeenCalledWith('get_auth_user_id_by_email', { lookup_email: 'test@example.com' })
  })

  // ---- 200: Successful upgrade with existing points ----
  it('adds 50 bonus points to existing loyalty_points', async () => {
    mockRpc.mockResolvedValue({ data: USER_ID, error: null })

    let callN = 0
    mockFrom.mockImplementation(() => {
      callN++
      if (callN === 1) {
        // customer already has 30 points from anonymous orders
        return chain({
          data: { id: USER_ID, is_anonymous: true, loyalty_points: 30, lifetime_points: 30 },
          error: null,
        })
      }
      // update + insert succeed
      return chain({ data: null, error: null })
    })

    const res = await POST(makeRequest('POST', { email: 'test@example.com', name: 'Jan' }))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.points).toBe(80) // 30 existing + 50 bonus
  })

  // ---- 500: Server error (catch block) ----
  it('returns 500 on unexpected server error', async () => {
    // Simulate request.json() throwing an error by sending invalid body
    const req = new NextRequest('http://localhost:3000/api/auth/upgrade-customer', {
      method: 'POST',
      body: 'not-valid-json',
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBe('Server error')
  })
})
