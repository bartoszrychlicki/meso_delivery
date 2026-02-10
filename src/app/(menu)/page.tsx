import { createClient } from '@/lib/supabase/server'
import { MenuClient } from './MenuClient'

export const revalidate = 60

async function getMenuData() {
  const supabase = await createClient()

  const [categoriesResult, productsResult, locationResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, name_jp, slug, icon, description')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('products')
      .select(`
        id,
        category_id,
        name,
        name_jp,
        slug,
        description,
        price,
        image_url,
        is_spicy,
        spice_level,
        is_vegetarian,
        is_vegan,
        is_bestseller,
        is_signature,
        is_new,
        has_variants,
        has_addons,
        has_spice_level,
        original_price,
        allergens,
        tags
      `)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('locations')
      .select('*')
      .eq('is_default', true)
      .single(),
  ])

  return {
    categories: categoriesResult.data || [],
    products: productsResult.data || [],
    location: locationResult.data,
  }
}

export default async function MenuPage() {
  const { categories, products, location } = await getMenuData()

  return (
    <div className="min-h-screen bg-meso-dark-900">
      {/* Menu content */}
      <MenuClient categories={categories} products={products} location={location} />
    </div>
  )
}
