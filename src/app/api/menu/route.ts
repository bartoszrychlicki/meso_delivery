import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name, name_jp, slug, icon, description')
    .eq('is_active', true)
    .order('sort_order')

  if (catError) {
    return NextResponse.json({ error: catError.message }, { status: 500 })
  }

  const { data: products, error: prodError } = await supabase
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
      allergens,
      tags
    `)
    .eq('is_active', true)
    .order('sort_order')

  if (prodError) {
    return NextResponse.json({ error: prodError.message }, { status: 500 })
  }

  const { data: location, error: locError } = await supabase
    .from('locations')
    .select('*')
    .eq('is_default', true)
    .single()

  if (locError) {
    return NextResponse.json({ error: locError.message }, { status: 500 })
  }

  return NextResponse.json({
    categories,
    products,
    location,
    meta: {
      totalProducts: products.length,
      totalCategories: categories.length,
    }
  })
}
