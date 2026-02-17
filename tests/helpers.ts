import { expect, Page } from '@playwright/test'

export async function gotoMenu(page: Page) {
  await page.goto('/menu')
  await expect(page.locator('a[href^="/product/"]').first()).toBeVisible({
    timeout: 20_000,
  })
}

export async function addFirstProductToCart(page: Page) {
  await gotoMenu(page)

  const firstProductLink = page.locator('a[href^="/product/"]').first()
  await expect(firstProductLink).toBeVisible()
  await firstProductLink.click()

  await expect(page).toHaveURL(/\/product\/[^/?#]+/)
  const addToCartButton = page.getByTestId('product-detail-add-to-cart')
  await expect(addToCartButton).toBeVisible()
  await addToCartButton.click()

  await page.waitForURL((url) => !url.pathname.includes('/product/'), {
    timeout: 15_000,
  })
}

export async function ensureCheckoutIsAvailable(page: Page, maxAttempts = 3) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await page.goto('/cart')

    const checkoutLink = page.getByTestId('cart-checkout-link')
    if ((await checkoutLink.count()) > 0) {
      const href = await checkoutLink.getAttribute('href')
      if (href === '/checkout') {
        return
      }
    }

    await addFirstProductToCart(page)
  }

  await page.goto('/cart')
  const checkoutLink = page.getByTestId('cart-checkout-link')
  await expect(checkoutLink).toBeVisible()
  await expect(checkoutLink).toHaveAttribute('href', '/checkout')
}

export async function fillCheckoutContactForm(page: Page) {
  await expect(page.getByRole('heading', { name: 'CHECKOUT' })).toBeVisible()
  await page.getByLabel('Imię').fill('Test')
  await page.getByLabel('Nazwisko').fill('Playwright')
  await page.getByLabel('Email').fill('test.playwright@example.com')
  await page.getByLabel(/Numer telefonu|Telefon/).fill('500100100')
}

export async function acceptTerms(page: Page) {
  const termsCheckbox = page.locator('#terms-acceptance')
  await expect(termsCheckbox).toBeVisible()
  if ((await termsCheckbox.getAttribute('data-state')) !== 'checked') {
    await termsCheckbox.click()
  }
  await expect(termsCheckbox).toHaveAttribute('data-state', 'checked')
}
