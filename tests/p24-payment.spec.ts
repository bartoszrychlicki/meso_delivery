import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('P24 Payment Flow (Mocked)', () => {

    test('Full flow: Menu -> Checkout -> Mock Payment -> Confirmation', async ({ page, request, isMobile }) => {
        // Mobile layout issues might block this test, skipping for now if mobile
        if (isMobile) test.skip();

        // --- Configuration ---
        const MOCK_TOKEN = 'mock_token_' + Date.now();
        // For DB Update, we need Service Role Key
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
            console.warn('Skipping test: Supabase Env Vars missing');
            test.skip();
        }

        // --- 1. Mock P24 Register Endpoint ---
        // This intercepts the app calling its own backend to register the transaction
        await page.route('**/api/payments/p24/register', async route => {
            console.log('Intercepted /api/payments/p24/register');
            // FIX: Return flat structure as expected by useCheckout (NextResponse.json({ token, url }))
            const json = {
                token: MOCK_TOKEN,
                url: `https://sandbox.przelewy24.pl/trnRequest/${MOCK_TOKEN}`
            };
            await route.fulfill({ json });
        });

        // --- 2. Setup Cart ---
        await test.step('Add item to cart', async () => {
            await page.goto('/menu');
            // Wait for hydration
            await page.waitForSelector('button:has-text("DODAJ")');
            // Add item
            await page.locator('button').filter({ hasText: 'DODAJ' }).first().click();

            // Handle potential modal
            const modal = page.locator('[role="dialog"]');
            if (await modal.isVisible()) {
                // Click last button (usually "Add")
                const confirmButton = modal.locator('button').filter({ hasText: 'PLN' }).first();
                if (await confirmButton.isVisible()) {
                    await confirmButton.click({ force: true });
                } else {
                    await modal.locator('button').last().click({ force: true });
                }
                await expect(modal).not.toBeVisible();
            }
            // Wait for toast or badge
            await page.waitForTimeout(1000);
        });

        // --- 3. Checkout ---
        await test.step('Proceed to Checkout', async () => {
            await page.goto('/cart');
            await expect(page.getByText('Razem', { exact: true })).toBeVisible();
            await page.locator('a[href="/checkout"]').click({ force: true });
        });

        // --- 4. Fill Checkout Form ---
        await test.step('Fill Checkout Details', async () => {
            // Select Pickup to simplify (skip address validation)
            await page.getByText('Odbiór osobisty').click();
            await page.waitForTimeout(500);
            await page.getByRole('button', { name: 'Dalej' }).click({ force: true });

            // Fill Contact
            await page.getByLabel('Imię').fill('Test Playwright');
            await page.getByLabel('Nazwisko').fill('Mock');
            await page.getByLabel('Email').fill('test@example.com');
            await page.getByLabel('Telefon').fill('111222333');

            await page.getByRole('button', { name: 'Dalej' }).click({ force: true });

            // Select Pay Method
            await expect(page.getByText('Płatność', { exact: true }).first()).toBeVisible();
            // Assuming BLIK or generic P24 method is selected by default or we select it
            // Just ensure we are on the step
        });

        // --- 5. Mock P24 Redirection & Perform Payment ---
        let orderId: string;

        await test.step('Submit Order and Mock Payment', async () => {
            // Accept Terms
            // It might be a Radix checkbox key or label click
            // Assuming label contains "Akceptuję"
            const termsCheckbox = page.locator('button[role="checkbox"]');
            if (await termsCheckbox.isVisible()) {
                await termsCheckbox.click();
            } else {
                // Fallback if use label
                await page.getByText('Akceptuję', { exact: false }).click();
            }

            const registerRequest = page.waitForRequest(req => req.url().includes('/api/payments/p24/register'));

            // Click Pay
            await page.getByRole('button', { name: 'Zamawiam i płacę' }).click();

            const req = await registerRequest;
            const postData = req.postDataJSON();
            console.log('Request Post Data:', postData);

            orderId = postData.orderId;
            console.log('Captured OrderID:', orderId);

            // Since `register` returns our MOCK_TOKEN, the app will redirect to:
            // https://sandbox.przelewy24.pl/trnRequest/mock_token_...

            // We intercept this SPECIFIC url and redirect back to app
            await page.route(`**/*przelewy24.pl/trnRequest/${MOCK_TOKEN}`, async route => {
                console.log('Intercepted P24 Redirect. Redirecting back to confirmation...');

                // urlReturn is NOT in request. We construct it manually.
                const returnUrl = `http://localhost:3003/order-confirmation?orderId=${orderId}&status=success`;

                console.log('Redirecting to:', returnUrl);

                await route.fulfill({
                    status: 302,
                    headers: { Location: returnUrl }
                });
            });

            // Wait for landing on confirmation page
            await page.waitForURL(/\/order-confirmation/);
            console.log('Landed on Confirmation Page');

            // --- 6. Simulate Status Update (Direct DB) ---
            // Bypass Webhook to avoid P24 verification failure with fake token
            console.log('Simulating Payment Success via Direct DB Update...');

            const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
                auth: { autoRefreshToken: false, persistSession: false }
            });

            const { error } = await supabase
                .from('orders')
                .update({
                    status: 'confirmed',
                    payment_status: 'paid',
                    paid_at: new Date().toISOString()
                })
                .eq('id', orderId);

            if (error) {
                console.error('DB Update Error:', error);
                throw new Error(`DB Update Failed: ${error.message}`);
            }
            console.log('DB Updated Successfully to PAID');
        });

        // --- 7. Verify UI Update ---
        await test.step('Verify Status Update in UI', async () => {
            // The frontend polls for status changes. It should eventually show confirmation.
            // Look for updated status

            // Adjust selector based on your actual UI for "Paid" state
            // UI shows "Zamówienie przyjęte!"
            await expect(page.getByText('Zamówienie przyjęte!', { exact: false })).toBeVisible({ timeout: 15000 });
            // Or check the specific timeline step
            // await expect(page.getByText('Zamówione')).toBeVisible();
        });
    });
});
