import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductDetailClient } from './ProductDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('menu_products')
    .select(`
      *,
      category:menu_categories(id, name, slug, icon),
      variants:product_variants(*),
      addons:product_addons(*)
    `)
    .eq('id', id)
    .single()

  if (!product) {
    notFound()
  }

  return <ProductDetailClient product={product} />
}
