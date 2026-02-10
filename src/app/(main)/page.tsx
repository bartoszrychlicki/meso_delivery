import { createClient } from '@/lib/supabase/server'
import { HeroBanner, CategoryGrid, ProductCarousel, PromoBanner } from '@/components/home'
import { CategoryTabs } from '@/components/menu/CategoryTabs'

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

  // Construct categories with "Start" link
  const sidebarCategories = [
    { id: 'home', name: 'Start', slug: 'home', icon: '🏠' },
    ...categories
  ]

  return (
    <div className="min-h-screen bg-meso-dark-900 pb-20">
      {/* Mobile Category Navigation (Horizontal) */}
      <div className="lg:hidden sticky top-[60px] z-30 bg-meso-dark-900/95 backdrop-blur supports-[backdrop-filter]:bg-meso-dark-900/60 border-b border-white/5 px-4 mb-4">
        <CategoryTabs
          categories={sidebarCategories}
          activeCategory="home"
          useLinks={true}
        />
      </div>

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8 container mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto py-6 pr-4">
          <CategoryTabs
            categories={sidebarCategories}
            activeCategory="home"
            useLinks={true}
          />
        </aside>

        {/* Main Content */}
        <main>
          <HeroBanner />

          <div className="space-y-4 md:space-y-8 -mt-8 relative z-10 px-4 md:px-0">
            <ProductCarousel
              title="Popularne Teraz"
              products={popularProducts}
              linkTo="/menu?filter=popular"
            />
          </div>

          <div className="bg-meso-dark-800/50 py-4 my-8 rounded-2xl mx-4 md:mx-0">
            <ProductCarousel
              title="Bestsellery"
              products={bestsellerProducts.length > 0 ? bestsellerProducts : products.slice(6, 12)}
              linkTo="/menu?filter=bestseller"
            />
          </div>

          <CategoryGrid categories={categories} />

          <PromoBanner />
        </main>
      </div>
    </div>
  )
}
