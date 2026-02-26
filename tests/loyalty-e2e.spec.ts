/**
 * E2E Test: Loyalty Program
 *
 * Tests the MESO Club loyalty program features:
 * - Rewards page display and coupon activation
 * - Active coupon blocking further activations
 * - Loyalty coupon display in cart
 * - Loyalty history tab
 * - Registration referral field
 * - Coupon sync on cart page load
 *
 * URUCHOMIENIE:
 *   npx playwright test loyalty-e2e --headed
 *
 * WYMAGANIA:
 *   - .env.local z NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - Działający serwer dev (uruchamiany automatycznie przez playwright.config.ts)
 *   - Przynajmniej jedna aktywna nagroda w loyalty_rewards
 */

import { test, expect, Page } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { bypassGate } from './helpers'

// ──────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────

const TEST_EMAIL = 'e2e-loyalty@meso.dev'
const TEST_PASSWORD = 'e2e-loyalty-test-123!'

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function ensureLoyaltyTestUser(admin: SupabaseClient): Promise<string> {
  const { data: { users } } = await admin.auth.admin.listUsers()
  const existing = users?.find(u => u.email === TEST_EMAIL)

  let userId: string

  if (existing) {
    userId = existing.id
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (error) throw new Error(`Failed to create test user: ${error.message}`)
    userId = data.user.id
  }

  // Set up customer with loyalty points
  await admin.from('customers').upsert({
    id: userId,
    email: TEST_EMAIL,
    name: 'E2E Loyalty',
    phone: '+48500200300',
    loyalty_points: 500,
    loyalty_tier: 'silver',
    lifetime_points: 500,
  }, { onConflict: 'id' })

  // Clean up any existing coupons
  await admin.from('loyalty_coupons').delete().eq('customer_id', userId)

  return userId
}

/**
 * Ensure at least one active loyalty reward exists in the DB.
 * Returns the reward row (id, name, points_cost, reward_type).
 */
async function ensureActiveReward(admin: SupabaseClient) {
  const { data: rewards } = await admin
    .from('loyalty_rewards')
    .select('id, name, points_cost, reward_type, min_tier')
    .eq('is_active', true)
    .order('points_cost', { ascending: true })
    .limit(5)

  if (rewards && rewards.length > 0) {
    return rewards
  }

  // Create a test reward if none exist
  const { data: created, error } = await admin
    .from('loyalty_rewards')
    .insert({
      name: 'Darmowa dostawa (test)',
      description: 'Kupon na darmową dostawę',
      points_cost: 100,
      reward_type: 'free_delivery',
      icon: '🚚',
      sort_order: 0,
      is_active: true,
      min_tier: 'bronze',
    })
    .select()

  if (error) throw new Error(`Failed to create test reward: ${error.message}`)
  return created!
}

async function loginLoyaltyUser(page: Page) {
  await bypassGate(page)
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(TEST_EMAIL)
  await page.locator('input[type="password"]').fill(TEST_PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15_000 })
}

// ──────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────

test.describe('Loyalty Program', () => {
  let admin: SupabaseClient
  let testUserId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let availableRewards: any[]

  test.beforeAll(async () => {
    admin = getAdminClient()
    testUserId = await ensureLoyaltyTestUser(admin)
    availableRewards = await ensureActiveReward(admin)
  })

  test.afterAll(async () => {
    // Cleanup test data
    await admin.from('loyalty_coupons').delete().eq('customer_id', testUserId)
    await admin.from('loyalty_history').delete().eq('customer_id', testUserId)

    // Restore points to original state for re-runs
    await admin.from('customers').update({
      loyalty_points: 500,
      loyalty_tier: 'silver',
      lifetime_points: 500,
    }).eq('id', testUserId)
  })

  // ──────────────────────────────────────────────────────
  // TEST 1: MESO Club page shows rewards and allows coupon activation
  // ──────────────────────────────────────────────────────
  test('MESO Club page shows rewards and allows coupon activation', async ({ page }) => {
    // Ensure clean state: 500 points, no active coupons
    await admin.from('loyalty_coupons').delete().eq('customer_id', testUserId)
    await admin.from('customers').update({
      loyalty_points: 500,
      loyalty_tier: 'silver',
    }).eq('id', testUserId)

    await loginLoyaltyUser(page)
    await page.goto('/account/club')

    // Verify rewards list is visible (wait for data to load)
    await expect(page.getByText('Dostępne nagrody')).toBeVisible({ timeout: 15_000 })

    // Should show at least one reward
    const rewardCards = page.locator('.space-y-3 > div')
    await expect(rewardCards.first()).toBeVisible({ timeout: 10_000 })

    // Find an affordable reward and click "Aktywuj"
    const activateButton = page.getByRole('button', { name: 'Aktywuj' }).first()
    await expect(activateButton).toBeVisible({ timeout: 10_000 })
    await activateButton.click()

    // Verify confirmation modal appears
    await expect(page.getByText('Aktywujesz kupon')).toBeVisible({ timeout: 5_000 })
    // Verify point cost is shown
    await expect(page.getByText(/pkt/)).toBeVisible()
    // Verify warning about non-refundable points
    await expect(page.getByText(/Punkty nie podlegają zwrotowi/)).toBeVisible()

    // Click "Potwierdzam" to activate
    await page.getByRole('button', { name: 'Potwierdzam' }).click()

    // Verify success toast appears
    await expect(page.getByText(/Aktywowano kupon/).or(page.getByText(/kupon.*dodany/i))).toBeVisible({ timeout: 10_000 })

    // Verify the active coupon banner now shows
    await expect(page.getByText('Masz aktywny kupon')).toBeVisible({ timeout: 10_000 })

    // Verify points decreased in DB
    const { data: customer } = await admin
      .from('customers')
      .select('loyalty_points')
      .eq('id', testUserId)
      .single()
    expect(customer!.loyalty_points).toBeLessThan(500)

    console.log(`Points after activation: ${customer!.loyalty_points}`)
  })

  // ──────────────────────────────────────────────────────
  // TEST 2: Active coupon blocks further activation
  // ──────────────────────────────────────────────────────
  test('active coupon blocks further activation', async ({ page }) => {
    // Ensure user has an active coupon via admin client
    await admin.from('loyalty_coupons').delete().eq('customer_id', testUserId)
    await admin.from('loyalty_coupons').insert({
      customer_id: testUserId,
      reward_id: availableRewards[0].id,
      code: 'MESO-TEST1',
      coupon_type: availableRewards[0].reward_type,
      discount_value: availableRewards[0].reward_type === 'discount' ? 10 : null,
      status: 'active',
      points_spent: availableRewards[0].points_cost,
      source: 'reward',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })

    await loginLoyaltyUser(page)
    await page.goto('/account/club')

    // Wait for page to load
    await expect(page.getByText('Dostępne nagrody')).toBeVisible({ timeout: 15_000 })

    // Verify info banner about active coupon is shown
    await expect(page.getByText('Masz aktywny kupon')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/Użyj go lub poczekaj/)).toBeVisible()

    // Verify "Aktywuj" buttons are NOT visible (replaced by point cost text)
    const activateButtons = page.getByRole('button', { name: 'Aktywuj' })
    await expect(activateButtons).toHaveCount(0)

    console.log('Active coupon correctly blocks further activation')
  })

  // ──────────────────────────────────────────────────────
  // TEST 3: Loyalty coupon appears in cart
  // ──────────────────────────────────────────────────────
  test('loyalty coupon appears in cart', async ({ page }) => {
    // Create active coupon for user via admin client
    await admin.from('loyalty_coupons').delete().eq('customer_id', testUserId)
    const { data: coupon } = await admin.from('loyalty_coupons').insert({
      customer_id: testUserId,
      reward_id: availableRewards[0].id,
      code: 'MESO-CART1',
      coupon_type: 'free_delivery',
      status: 'active',
      points_spent: 100,
      source: 'reward',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }).select().single()

    await loginLoyaltyUser(page)

    // Set the coupon in cart store via page.evaluate
    await page.goto('/')
    await page.evaluate((couponData) => {
      // Access Zustand store from window
      const cartKey = 'meso-cart'
      const stored = localStorage.getItem(cartKey)
      const parsed = stored ? JSON.parse(stored) : { state: {}, version: 0 }
      parsed.state = {
        ...parsed.state,
        loyaltyCoupon: couponData,
      }
      localStorage.setItem(cartKey, JSON.stringify(parsed))
    }, {
      id: coupon!.id,
      code: coupon!.code,
      coupon_type: coupon!.coupon_type,
      discount_value: coupon!.discount_value,
      free_product_name: coupon!.free_product_name,
      expires_at: coupon!.expires_at,
    })

    // Add a product to cart so the cart page is not empty
    await page.goto('/menu')
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible({ timeout: 20_000 })
    await page.locator('a[href^="/product/"]').first().click()
    await expect(page).toHaveURL(/\/product\/[^/?#]+/)
    const addBtn = page.getByTestId('product-detail-add-to-cart')
    await expect(addBtn).toBeVisible()
    await addBtn.click()
    await page.waitForURL(url => !url.pathname.includes('/product/'), { timeout: 15_000 })

    // Navigate to cart
    await page.goto('/cart')

    // Verify coupon display shows with gold border (loyalty coupon style)
    const couponDisplay = page.getByText(`Kupon: ${coupon!.code}`)
    await expect(couponDisplay).toBeVisible({ timeout: 10_000 })

    // Verify coupon type description
    await expect(page.getByText('Darmowa dostawa')).toBeVisible()

    // Verify the promo code input is replaced by coupon display
    // (when loyaltyCoupon is set, PromoCodeInput renders the coupon display instead)
    const promoInput = page.locator('input[placeholder="Kod promocyjny"]')
    await expect(promoInput).toHaveCount(0)

    console.log(`Coupon ${coupon!.code} correctly displayed in cart`)
  })

  // ──────────────────────────────────────────────────────
  // TEST 4: Loyalty history page shows entries
  // ──────────────────────────────────────────────────────
  test('loyalty history page shows entries', async ({ page }) => {
    // Insert some loyalty_history entries for user via admin client
    await admin.from('loyalty_history').delete().eq('customer_id', testUserId)
    await admin.from('loyalty_history').insert([
      {
        customer_id: testUserId,
        label: 'Bonus rejestracyjny',
        points: 50,
        type: 'bonus',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        customer_id: testUserId,
        label: 'Zamowienie #1234',
        points: 45,
        type: 'earned',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        customer_id: testUserId,
        label: 'Kupon: Darmowa dostawa',
        points: -100,
        type: 'spent',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ])

    await loginLoyaltyUser(page)
    await page.goto('/loyalty')

    // Wait for page to load
    await expect(page.getByText('MESO Club').or(page.getByText('MESO POINTS'))).toBeVisible({ timeout: 15_000 })

    // Verify loyalty level info is visible on the points page (regression: tiers disappeared)
    await expect(page.getByText(/Poziom:\s*Srebrny/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/Łącznie zebrane:\s*500 pkt/i)).toBeVisible()

    // Switch to history tab
    const historyTab = page.getByRole('button', { name: 'Historia' })
    await expect(historyTab).toBeVisible()
    await historyTab.click()

    // Verify history entries are visible
    await expect(page.getByText('Bonus rejestracyjny')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Zamowienie #1234')).toBeVisible()
    await expect(page.getByText('Kupon: Darmowa dostawa')).toBeVisible()

    // Verify points values are shown
    await expect(page.getByText('+50 pkt')).toBeVisible()
    await expect(page.getByText('+45 pkt')).toBeVisible()
    await expect(page.getByText('-100 pkt')).toBeVisible()

    // Verify dates are shown (Polish date format)
    const datePattern = /\d{1,2}\.\d{1,2}\.\d{4}/
    const historyEntries = page.locator('.border-b.border-white\\/5')
    const firstEntry = historyEntries.first()
    await expect(firstEntry).toBeVisible()
    await expect(firstEntry.locator('p').last()).toHaveText(datePattern)

    console.log('Loyalty history entries correctly displayed')
  })

  // ──────────────────────────────────────────────────────
  // TEST 5: Registration page has referral phone field
  // ──────────────────────────────────────────────────────
  test('registration page has referral phone field', async ({ page }) => {
    await bypassGate(page)
    await page.goto('/register')

    // Wait for page to load
    await expect(page.getByText('ZAREJESTRUJ')).toBeVisible({ timeout: 15_000 })

    // Verify referral phone input is visible
    const referralInput = page.locator('input[placeholder*="polecając"]')
    await expect(referralInput).toBeVisible()

    // Verify helper text about Gyoza coupon
    await expect(page.getByText(/kupon powitalny.*Gyoza|darmowe Gyoza/i)).toBeVisible()

    console.log('Referral phone field correctly displayed on registration page')
  })

  // ──────────────────────────────────────────────────────
  // TEST 6: Coupon syncs on cart page load
  // ──────────────────────────────────────────────────────
  test('coupon syncs from DB on cart page load', async ({ page }) => {
    // Create active coupon via admin client
    await admin.from('loyalty_coupons').delete().eq('customer_id', testUserId)
    const { data: coupon } = await admin.from('loyalty_coupons').insert({
      customer_id: testUserId,
      reward_id: availableRewards[0].id,
      code: 'MESO-SYNC1',
      coupon_type: 'free_delivery',
      status: 'active',
      points_spent: 100,
      source: 'reward',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }).select().single()

    await loginLoyaltyUser(page)

    // Ensure the cart store does NOT have the coupon (clear localStorage coupon data)
    await page.goto('/')
    await page.evaluate(() => {
      const cartKey = 'meso-cart'
      const stored = localStorage.getItem(cartKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.state) {
          delete parsed.state.loyaltyCoupon
        }
        localStorage.setItem(cartKey, JSON.stringify(parsed))
      }
    })

    // Add a product to cart so the cart page is not empty
    await page.goto('/menu')
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible({ timeout: 20_000 })
    await page.locator('a[href^="/product/"]').first().click()
    await expect(page).toHaveURL(/\/product\/[^/?#]+/)
    const addBtn = page.getByTestId('product-detail-add-to-cart')
    await expect(addBtn).toBeVisible()
    await addBtn.click()
    await page.waitForURL(url => !url.pathname.includes('/product/'), { timeout: 15_000 })

    // Navigate to cart (without manually setting coupon in store)
    await page.goto('/cart')

    // Wait for the sync effect to run and the coupon to appear
    // The cart page calls /api/loyalty/active-coupon on mount and syncs
    const couponDisplay = page.getByText(`Kupon: ${coupon!.code}`)
    await expect(couponDisplay).toBeVisible({ timeout: 15_000 })

    console.log(`Coupon ${coupon!.code} correctly synced from DB to cart`)
  })
})
