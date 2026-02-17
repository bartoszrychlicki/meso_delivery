import { test, expect } from '@playwright/test'
import {
  addFirstProductToCart,
  ensureCheckoutIsAvailable,
  fillCheckoutContactForm,
  acceptTerms,
} from './helpers'

test.describe('P24 Payment Flow (Mocked)', () => {
  test('Full flow: Menu -> Checkout -> Mock Payment Redirect -> Confirmation', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Payment flow covered on desktop to reduce mobile flakiness')

    await addFirstProductToCart(page)
    await ensureCheckoutIsAvailable(page)

    await page.goto('/cart')
    await page.getByTestId('cart-checkout-link').click()
    await expect(page).toHaveURL(/\/checkout/)

    await fillCheckoutContactForm(page)
    await acceptTerms(page)

    let createdOrderId = ''

    await page.route('**/api/payments/p24/register', async (route) => {
      const payload = route.request().postDataJSON() as { orderId: string | number }
      createdOrderId = String(payload.orderId)

      await route.fulfill({
        json: {
          token: `mock_token_${Date.now()}`,
          url: `/order-confirmation?orderId=${payload.orderId}&status=success`,
        },
      })
    })

    const submitButton = page.getByTestId('checkout-submit-button')

    // First click submits contact form into local state.
    await submitButton.click()

    // Second click performs order creation and mocked payment registration.
    await submitButton.click()

    await expect(page).toHaveURL(/\/order-confirmation\?orderId=.*status=success/)
    await expect(page.getByText('Oczekiwanie na płatność...')).toBeVisible()
    await expect(page.getByText('Twoje zamówienie')).toBeVisible()
    await expect(page.getByText(new RegExp(`#${createdOrderId.slice(-6).toUpperCase()}`))).toBeVisible()
  })
})
