/**
 * E2E Test: Registration Flow
 *
 * Tests the registration (anonymous → permanent upgrade) flow:
 * - Full registration awards 50 loyalty points
 * - Registration page renders all expected fields
 * - Duplicate email shows an error
 *
 * URUCHOMIENIE:
 *   npx playwright test registration-e2e --headed
 *
 * WYMAGANIA:
 *   - .env.local z NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - Działający serwer dev (uruchamiany automatycznie przez playwright.config.ts)
 */

import { test, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { bypassGate } from './helpers'

// ──────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────

const UNIQUE_SUFFIX = Date.now()
const TEST_EMAIL = `e2e-register-${UNIQUE_SUFFIX}@meso.dev`
const TEST_PASSWORD = 'TestRegister123!'
const TEST_NAME = 'E2ERegister'

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

// ──────────────────────────────────────────────────────────
// Tests (serial — Test 3 depends on Test 1 having registered)
// ──────────────────────────────────────────────────────────

test.describe.serial('Registration Flow', () => {
  let admin: SupabaseClient

  test.beforeAll(async () => {
    admin = getAdminClient()

    // Pre-cleanup: remove any leftover test users from previous runs
    const { data: { users } } = await admin.auth.admin.listUsers()
    const staleUsers = users?.filter(u => u.email?.includes('e2e-register-')) || []
    for (const u of staleUsers) {
      await admin.from('loyalty_history').delete().eq('customer_id', u.id)
      await admin.from('customers').delete().eq('id', u.id)
      await admin.auth.admin.deleteUser(u.id)
    }
  })

  test.afterAll(async () => {
    // Cleanup all test users created during this run
    const { data: { users } } = await admin.auth.admin.listUsers()
    const testUsers = users?.filter(u => u.email?.includes('e2e-register-')) || []
    for (const u of testUsers) {
      await admin.from('loyalty_history').delete().eq('customer_id', u.id)
      await admin.from('customers').delete().eq('id', u.id)
      await admin.auth.admin.deleteUser(u.id)
    }
  })

  // ──────────────────────────────────────────────────────
  // TEST 1: Full registration awards 50 points
  // ──────────────────────────────────────────────────────
  test('full registration awards 50 loyalty points', async ({ page }) => {
    await bypassGate(page)
    await page.goto('/register')

    // Wait for the form to be ready
    await expect(page.locator('input[placeholder="Imię"]')).toBeVisible({ timeout: 15_000 })

    // Fill in the registration form
    await page.locator('input[placeholder="Imię"]').fill(TEST_NAME)
    await page.locator('input[placeholder="Email"]').fill(TEST_EMAIL)
    await page.locator('input[placeholder="Hasło (min. 8 znaków)"]').fill(TEST_PASSWORD)
    await page.locator('input[placeholder="Powtórz hasło"]').fill(TEST_PASSWORD)

    // Click the register button
    await page.getByRole('button', { name: 'ZAREJESTRUJ' }).click()

    // Wait for navigation away from /register (redirect to /?upgrade=pending or /account)
    await page.waitForURL(url => !url.pathname.includes('/register'), { timeout: 15_000 })

    // Wait for the DB trigger and /api/auth/upgrade-customer to settle
    await page.waitForTimeout(3000)

    // Verify the customer record was created with 50 bonus points
    const { data: customer, error: custError } = await admin
      .from('customers')
      .select('id, email, is_anonymous, loyalty_points, lifetime_points')
      .eq('email', TEST_EMAIL)
      .single()

    expect(custError).toBeNull()
    expect(customer).not.toBeNull()
    expect(customer!.email).toBe(TEST_EMAIL)
    expect(customer!.is_anonymous).toBe(false)
    expect(customer!.loyalty_points).toBe(50)
    expect(customer!.lifetime_points).toBe(50)

    // Verify loyalty_history has the registration bonus entry
    const { data: history, error: histError } = await admin
      .from('loyalty_history')
      .select('label, points, type')
      .eq('customer_id', customer!.id)
      .eq('type', 'bonus')

    expect(histError).toBeNull()
    expect(history).not.toBeNull()
    expect(history!.length).toBeGreaterThanOrEqual(1)

    const bonusEntry = history!.find(h => h.label === 'Bonus rejestracyjny')
    expect(bonusEntry).toBeTruthy()
    expect(bonusEntry!.points).toBe(50)
    expect(bonusEntry!.type).toBe('bonus')

    console.log(`Registration successful: ${TEST_EMAIL}, points: ${customer!.loyalty_points}`)
  })

  // ──────────────────────────────────────────────────────
  // TEST 2: Registration page renders correctly
  // ──────────────────────────────────────────────────────
  test('registration page renders all expected fields', async ({ page }) => {
    await bypassGate(page)
    await page.goto('/register')

    // Name input
    const nameInput = page.locator('input[placeholder="Imię"]')
    await expect(nameInput).toBeVisible({ timeout: 15_000 })

    // Email input
    const emailInput = page.locator('input[placeholder="Email"]')
    await expect(emailInput).toBeVisible()

    // Password input
    const passwordInput = page.locator('input[placeholder="Hasło (min. 8 znaków)"]')
    await expect(passwordInput).toBeVisible()

    // Confirm password input
    const confirmPasswordInput = page.locator('input[placeholder="Powtórz hasło"]')
    await expect(confirmPasswordInput).toBeVisible()

    // Submit button
    const submitButton = page.getByRole('button', { name: 'ZAREJESTRUJ' })
    await expect(submitButton).toBeVisible()

    // Referral phone field
    const referralInput = page.locator('input[placeholder*="polecając"]')
    await expect(referralInput).toBeVisible()

    // Marketing consent checkbox
    const marketingCheckbox = page.locator('#marketingConsent')
    await expect(marketingCheckbox).toBeVisible()

    // Login link ("Zaloguj się")
    const loginLink = page.getByRole('link', { name: 'Zaloguj się' })
    await expect(loginLink).toBeVisible()

    console.log('Registration page renders all expected fields correctly')
  })

  // ──────────────────────────────────────────────────────
  // TEST 3: Duplicate email shows error
  // (depends on Test 1 having already registered TEST_EMAIL)
  // ──────────────────────────────────────────────────────
  test('duplicate email shows error toast', async ({ page }) => {
    await bypassGate(page)
    await page.goto('/register')

    // Wait for the form to be ready
    await expect(page.locator('input[placeholder="Imię"]')).toBeVisible({ timeout: 15_000 })

    // Fill in the form with the SAME email registered in Test 1
    await page.locator('input[placeholder="Imię"]').fill('DuplicateTest')
    await page.locator('input[placeholder="Email"]').fill(TEST_EMAIL)
    await page.locator('input[placeholder="Hasło (min. 8 znaków)"]').fill(TEST_PASSWORD)
    await page.locator('input[placeholder="Powtórz hasło"]').fill(TEST_PASSWORD)

    // Click the register button
    await page.getByRole('button', { name: 'ZAREJESTRUJ' }).click()

    // Wait for the error toast to appear (contains "zarejestrowany" from the Polish error message)
    await expect(
      page.getByText(/zarejestrowany/).or(page.getByText(/already registered/i))
    ).toBeVisible({ timeout: 15_000 })

    // Verify we are still on the /register page
    expect(page.url()).toContain('/register')

    console.log('Duplicate email correctly shows error toast')
  })
})
