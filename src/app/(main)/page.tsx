import { createClient } from '@/lib/supabase/server'
import { HeroBanner, CategoryGrid, ProductCarousel, PromoBanner } from '@/components/home'


export const revalidate = 60


async function getHomeData() {
  const supabase = await createClient()

  const [categoriesResult, productsResult] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*),
        addons:product_addons(
          addon:addons(*)
        )
      `)
      .eq('is_active', true)
      .order('sort_order'),
  ])

  return {
    categories: categoriesResult.data || [],
    products: productsResult.data || [],
  }
}

export default async function HomePage() {
  const { categories, products } = await getHomeData()

  // Filter products for specific sections
  const promotedProducts = products.filter(p => p.is_new || p.is_signature).slice(0, 6)
  const bestsellerProducts = products.filter(p => p.is_bestseller).slice(0, 6)
  // Fallback if no specific tags
  const popularProducts = promotedProducts.length > 0 ? promotedProducts : products.slice(0, 6)

  return (
    <div className="min-h-screen bg-meso-dark-900 pb-20">
      <HeroBanner />

      <div className="space-y-4 md:space-y-8 -mt-20 relative z-10">
        <div className="container mx-auto">
          <ProductCarousel
            title="Popularne Teraz"
            products={popularProducts}
            linkTo="/menu?filter=popular"
          />
        </div>
      </div>

      <div className="bg-meso-dark-800/50 py-4">
        <ProductCarousel
          title="Bestsellery"
          products={bestsellerProducts.length > 0 ? bestsellerProducts : products.slice(6, 12)}
          linkTo="/menu?filter=bestseller"
        />
      </div>

      <CategoryGrid categories={categories} />

      <PromoBanner />
    </div>
  )
}
