import crypto from 'crypto'

const P24_MERCHANT_ID = process.env.P24_MERCHANT_ID!
const P24_POS_ID = process.env.P24_POS_ID || P24_MERCHANT_ID
const P24_CRC_KEY = process.env.P24_CRC_KEY!
const P24_API_KEY = process.env.P24_API_KEY!
const P24_SANDBOX = process.env.P24_SANDBOX === 'true'

const BASE_URL = P24_SANDBOX
  ? 'https://sandbox.przelewy24.pl'
  : 'https://secure.przelewy24.pl'

function parseMerchantId(value: string): number {
  const asDecimal = parseInt(value, 10)
  if (!isNaN(asDecimal)) return asDecimal
  // Fallback: some sandbox IDs may be hex-encoded
  const asHex = parseInt(value, 16)
  if (!isNaN(asHex)) return asHex
  throw new Error(`Invalid P24_MERCHANT_ID: ${value}`)
}

function getAuthHeader(): string {
  const posId = parseMerchantId(P24_POS_ID)
  const credentials = Buffer.from(`${posId}:${P24_API_KEY}`).toString('base64')
  return `Basic ${credentials}`
}

export function calculateRegisterSign(params: {
  sessionId: string
  merchantId: number
  amount: number
  currency: string
}): string {
  const payload = JSON.stringify({
    sessionId: params.sessionId,
    merchantId: params.merchantId,
    amount: params.amount,
    currency: params.currency,
    crc: P24_CRC_KEY,
  })
  return crypto.createHash('sha384').update(payload).digest('hex')
}

export function calculateVerifySign(params: {
  sessionId: string
  orderId: number
  amount: number
  currency: string
}): string {
  const payload = JSON.stringify({
    sessionId: params.sessionId,
    orderId: params.orderId,
    amount: params.amount,
    currency: params.currency,
    crc: P24_CRC_KEY,
  })
  return crypto.createHash('sha384').update(payload).digest('hex')
}

export interface P24RegisterParams {
  sessionId: string
  amount: number // in grosze (1 PLN = 100)
  currency?: string
  description: string
  email: string
  urlReturn: string
  urlStatus: string
  client?: string
  phone?: string
  country?: string
  language?: string
  timeLimit?: number
}

export async function registerTransaction(params: P24RegisterParams): Promise<{
  token: string
  redirectUrl: string
}> {
  const merchantId = parseMerchantId(P24_MERCHANT_ID)
  const posId = parseMerchantId(P24_POS_ID)
  const currency = params.currency || 'PLN'

  const sign = calculateRegisterSign({
    sessionId: params.sessionId,
    merchantId,
    amount: params.amount,
    currency,
  })

  const body = {
    merchantId,
    posId,
    sessionId: params.sessionId,
    amount: params.amount,
    currency,
    description: params.description,
    email: params.email,
    client: params.client,
    phone: params.phone,
    country: params.country || 'PL',
    language: params.language || 'pl',
    urlReturn: params.urlReturn,
    urlStatus: params.urlStatus,
    timeLimit: params.timeLimit || 15,
    sign,
  }

  console.log('[P24] Registering transaction:', { ...body, sign: sign.slice(0, 8) + '...' })

  const response = await fetch(`${BASE_URL}/api/v1/transaction/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(body),
  })

  const responseText = await response.text()

  if (!response.ok) {
    console.error('[P24] Register error:', response.status, responseText)
    throw new Error(`P24 registration failed: ${response.status}`)
  }

  const result = JSON.parse(responseText)
  const token = result.data?.token

  if (!token) {
    console.error('[P24] No token in response:', responseText)
    throw new Error('P24 did not return a payment token')
  }

  console.log('[P24] Transaction registered, token:', token.slice(0, 8) + '...')

  return {
    token,
    redirectUrl: `${BASE_URL}/trnRequest/${token}`,
  }
}

export interface P24Notification {
  merchantId: number
  posId: number
  sessionId: string
  amount: number
  originAmount: number
  currency: string
  orderId: number
  methodId: number
  statement: string
  sign: string
}

export function verifyNotificationSign(notification: P24Notification): boolean {
  const expectedSign = calculateVerifySign({
    sessionId: notification.sessionId,
    orderId: notification.orderId,
    amount: notification.amount,
    currency: notification.currency,
  })
  return expectedSign === notification.sign
}

export async function verifyTransaction(params: {
  sessionId: string
  orderId: number
  amount: number
  currency?: string
}): Promise<boolean> {
  const merchantId = parseMerchantId(P24_MERCHANT_ID)
  const posId = parseMerchantId(P24_POS_ID)
  const currency = params.currency || 'PLN'

  const sign = calculateVerifySign({
    sessionId: params.sessionId,
    orderId: params.orderId,
    amount: params.amount,
    currency,
  })

  const body = {
    merchantId,
    posId,
    sessionId: params.sessionId,
    amount: params.amount,
    currency,
    orderId: params.orderId,
    sign,
  }

  console.log('[P24] Verifying transaction:', { sessionId: params.sessionId, orderId: params.orderId })

  const response = await fetch(`${BASE_URL}/api/v1/transaction/verify`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('[P24] Verify error:', response.status, errorBody)
    return false
  }

  console.log('[P24] Transaction verified successfully')
  return true
}
