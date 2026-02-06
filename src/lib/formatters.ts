/**
 * Format price for display in PLN
 * Rounds up to whole numbers for cleaner display
 * @param price - Price in PLN
 * @returns Formatted price string with "zł" suffix
 */
export function formatPrice(price: number): string {
    const roundedPrice = Math.ceil(price)
    return `${roundedPrice} zł`
}

/**
 * Format price with decimals (for checkout/payment summaries)
 * @param price - Price in PLN
 * @returns Formatted price string with 2 decimal places and "zł" suffix
 */
export function formatPriceExact(price: number): string {
    return new Intl.NumberFormat('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price) + ' zł'
}
