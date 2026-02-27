export interface ProductImage {
  id: string
  url: string
  alt?: string
  width: number
  height: number
  sort_order: number
}

/**
 * Get product image URL from either `images` JSONB array or `image_url` field.
 * POS stores images in JSONB `images` column, with `image_url` as deprecated fallback.
 */
export function getProductImageUrl(
  product: { images?: ProductImage[] | string | null; image_url?: string | null } | undefined
): string | undefined {
  if (!product) return undefined

  // Try images JSONB first
  if (product.images) {
    const imgs = typeof product.images === 'string' ? JSON.parse(product.images) : product.images
    if (Array.isArray(imgs) && imgs.length > 0 && imgs[0]?.url) {
      return imgs[0].url
    }
  }

  // Fallback to image_url
  return product.image_url || undefined
}
