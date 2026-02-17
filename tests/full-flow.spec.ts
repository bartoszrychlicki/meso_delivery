import { test, expect } from '@playwright/test'
import {
  addFirstProductToCart,
  ensureCheckoutIsAvailable,
  fillCheckoutContactForm,
} from './helpers'

test.describe('Full User Journey', () => {
  test('Complete flow: Menu -> Cart -> Checkout (ready to submit)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Checkout flow covered on desktop to reduce mobile flakiness')

    await addFirstProductToCart(page)
    await ensureCheckoutIsAvailable(page)

    await page.goto('/cart')
    const checkoutLink = page.getByTestId('cart-checkout-link')
    await expect(checkoutLink).toHaveAttribute('href', '/checkout')
    await checkoutLink.click()

    await expect(page).toHaveURL(/\/checkout/)
    await fillCheckoutContactForm(page)

    const submitButton = page.getByTestId('checkout-submit-button')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeEnabled()

    await submitButton.click()
    await expect(
      page.getByText('Musisz zaakceptować Regulamin i Politykę Prywatności')
    ).toBeVisible()
  })
})
