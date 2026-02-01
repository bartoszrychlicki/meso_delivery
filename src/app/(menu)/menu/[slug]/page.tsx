import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductDetails } from './ProductDetails'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string) {
  const supabase = await createClient()

  // Get product with variants and addons
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, name_jp, slug),
      variants:product_variants(id, name, price_modifier, is_default, sort_order)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (productError || !product) {
    return null
  }

  // Get addons for this product
  const { data: productAddons } = await supabase
    .from('product_addons')
    .select(`
      addon:addons(id, name, price, is_active)
    `)
    .eq('product_id', product.id)

  interface AddonRow {
    addon: {
      id: string
      name: string
      price: number
      is_active: boolean
    } | null
  }

  const addons = (productAddons as AddonRow[] | null)
    ?.map((pa) => pa.addon)
    .filter((addon): addon is NonNullable<typeof addon> => addon !== null && addon.is_active) || []

  return {
    ...product,
    addons,
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return { title: 'Nie znaleziono produktu' }
  }

  return {
    title: `${product.name} | MESO`,
    description: product.description,
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  return <ProductDetails product={product} />
}
