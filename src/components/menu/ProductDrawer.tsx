'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Check, Info, Loader2, Minus, Plus } from 'lucide-react'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerTrigger,
    DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useCartStore, CartItemAddon } from '@/stores/cartStore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/client'
import { ALLERGENS, type AllergenKey } from '@/types/menu'

interface Variant {
    id: string
    name: string
    price_modifier: number
    is_default: boolean
    sort_order: number
}

interface Addon {
    id: string
    name: string
    price: number
    is_active: boolean
}

interface Product {
    id: string
    name: string
    name_jp?: string
    slug: string
    description?: string
    story?: string
    price: number
    original_price?: number
    image_url?: string
    is_spicy?: boolean
    spice_level?: 1 | 2 | 3
    is_vegetarian?: boolean
    is_vegan?: boolean
    is_bestseller?: boolean
    is_signature?: boolean
    is_new?: boolean
    has_variants?: boolean
    has_addons?: boolean
    has_spice_level?: boolean
    allergens?: string[]
    calories?: number
    variants?: Variant[]
    addons?: Addon[]
}

interface ProductDrawerProps {
    productSlug: string
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    initialData?: Partial<Product>
}

export function ProductDrawer({
    productSlug,
    isOpen,
    onOpenChange,
    initialData,
}: ProductDrawerProps) {
    const addItem = useCartStore((state) => state.addItem)
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)

    // State for customization
    const [quantity, setQuantity] = useState(1)
    const [selectedSpice, setSelectedSpice] = useState<1 | 2 | 3>(1)
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
    const [selectedAddons, setSelectedAddons] = useState<Addon[]>([])

    useEffect(() => {
        if (isOpen && productSlug) {
            setLoading(true)
            const fetchProduct = async () => {
                const supabase = createClient()

                // Fetch product with variants
                const { data: productData, error } = await supabase
                    .from('products')
                    .select(`
            *,
            variants:product_variants(id, name, price_modifier, is_default, sort_order)
          `)
                    .eq('slug', productSlug)
                    .single()

                if (error || !productData) {
                    console.error('Error fetching product:', error)
                    setLoading(false)
                    return
                }

                // Fetch addons
                const { data: addonsData } = await supabase
                    .from('product_addons')
                    .select(`
            addon:addons(id, name, price, is_active)
          `)
                    .eq('product_id', productData.id)

                const addons = (addonsData as any[])
                    ?.map((pa) => pa.addon)
                    .filter((a) => a && a.is_active) || []

                const fullProduct = { ...productData, addons } as Product
                setProduct(fullProduct)

                // Initialize state
                setSelectedSpice(fullProduct.spice_level || 1)
                setSelectedVariant(
                    fullProduct.variants?.find((v) => v.is_default) ||
                    fullProduct.variants?.[0] ||
                    null
                )
                setQuantity(1)
                setSelectedAddons([])
                setLoading(false)
            }

            fetchProduct()
        }
    }, [isOpen, productSlug])

    const calculateTotal = () => {
        if (!product) return 0
        const basePrice = product.price
        const variantPrice = selectedVariant?.price_modifier || 0
        const addonsPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0)
        return (basePrice + variantPrice + addonsPrice) * quantity
    }



    const handleAddonToggle = (addon: Addon) => {
        setSelectedAddons((prev) =>
            prev.some((a) => a.id === addon.id)
                ? prev.filter((a) => a.id !== addon.id)
                : [...prev, addon]
        )
    }

    const handleAddToCart = () => {
        if (!product) return

        const cartAddons: CartItemAddon[] = selectedAddons.map((a) => ({
            id: a.id,
            name: a.name,
            price: a.price,
        }))

        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            image: product.image_url,
            spiceLevel: product.has_spice_level ? selectedSpice : undefined,
            variantId: selectedVariant?.id,
            variantName: selectedVariant?.name,
            variantPrice: selectedVariant?.price_modifier,
            addons: cartAddons,
        })

        toast.success(`${product.name} dodano do koszyka`, {
            description: `Ilość: ${quantity}`,
            duration: 3000,
        })

        onOpenChange(false)
    }

    // Helper arrays
    const spiceLevels = [
        { level: 1 as const, label: 'Łagodny', icon: 'whatshot' },
        { level: 2 as const, label: 'Średni', icon: 'local_fire_department' },
        { level: 3 as const, label: 'Piekielny', icon: 'flare' },
    ]

    const displayProduct = product || (initialData as Product)

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-meso-dark-900 border-t-meso-dark-800 text-white max-h-[90vh]">
                <div className="mx-auto w-full max-w-lg flex flex-col h-full overflow-hidden">
                    {loading && !product ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-meso-red-500" />
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto scrollbar-hide">
                                {/* Header Image & Info */}
                                <div className="relative h-48 w-full bg-meso-dark-800">
                                    {displayProduct?.image_url ? (
                                        <Image
                                            src={displayProduct.image_url}
                                            alt={displayProduct.name || ''}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-meso-dark-800 to-meso-dark-900">
                                            <span className="text-6xl">🍜</span>
                                        </div>
                                    )}
                                    {/* Close Button Overlay */}
                                    <DrawerClose asChild>
                                        <button className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors z-20">
                                            <span className="sr-only">Zamknij</span>
                                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.1929 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.1929 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                        </button>
                                    </DrawerClose>
                                </div>

                                <div className="px-4 py-4 space-y-6">
                                    <div>
                                        <DrawerTitle className="text-2xl font-bold mb-1">
                                            {displayProduct?.name}
                                        </DrawerTitle>
                                        <DrawerDescription className="text-zinc-400 line-clamp-2">
                                            {displayProduct?.description}
                                        </DrawerDescription>
                                        {displayProduct?.calories && (
                                            <p className="text-zinc-500 text-sm mt-1">
                                                {displayProduct.calories} kcal
                                            </p>
                                        )}
                                        {/* Ingredients chips */}
                                        {displayProduct?.allergens && displayProduct.allergens.length > 0 && (
                                            <div className="pt-2">
                                                <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-wrap">
                                                    {displayProduct.allergens.map((allergen) => (
                                                        <div
                                                            key={allergen}
                                                            className="flex h-6 items-center justify-center gap-x-1 rounded-full bg-meso-red-500/10 px-3 border border-meso-red-500/20"
                                                        >
                                                            <p className="text-meso-red-500 text-xs font-medium">
                                                                {ALLERGENS[allergen as AllergenKey] || allergen}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Customization Options */}
                                    <div className="space-y-6 pb-4">
                                        {/* Spiciness */}
                                        {displayProduct?.has_spice_level && (
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-3">Poziom Ostrości</h3>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {spiceLevels.map((option) => (
                                                        <button
                                                            key={option.level}
                                                            onClick={() => setSelectedSpice(option.level)}
                                                            className={cn(
                                                                'flex flex-col items-center justify-center gap-1 rounded-lg border p-2 transition-all',
                                                                selectedSpice === option.level
                                                                    ? 'border-meso-red-500 bg-meso-red-500/20 text-meso-red-500'
                                                                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                                            )}
                                                        >
                                                            <span className="text-xl">
                                                                {option.level === 1 ? '🔥' : option.level === 2 ? '🔥🔥' : '🔥🔥🔥'}
                                                            </span>
                                                            <span className="text-xs font-semibold">{option.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Variants */}
                                        {displayProduct?.variants && displayProduct.variants.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-3">Rozmiar</h3>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {displayProduct.variants.map((variant) => (
                                                        <button
                                                            key={variant.id}
                                                            onClick={() => setSelectedVariant(variant)}
                                                            className={cn(
                                                                'flex items-center justify-between p-3 rounded-lg border transition-all',
                                                                selectedVariant?.id === variant.id
                                                                    ? 'border-meso-red-500 bg-meso-red-500/10 text-white'
                                                                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                                            )}
                                                        >
                                                            <span className="font-medium">{variant.name}</span>
                                                            {variant.price_modifier > 0 && (
                                                                <span className="text-sm text-meso-red-500">
                                                                    +{formatPrice(variant.price_modifier)}
                                                                </span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Addons */}
                                        {displayProduct?.addons && displayProduct.addons.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-3">Dodatki</h3>
                                                <div className="space-y-2">
                                                    {displayProduct.addons.map((addon) => (
                                                        <div
                                                            key={addon.id}
                                                            className={cn(
                                                                'flex items-center justify-between rounded-lg p-3 cursor-pointer transition-all border',
                                                                selectedAddons.some((a) => a.id === addon.id)
                                                                    ? 'bg-meso-red-500/10 border-meso-red-500/50'
                                                                    : 'bg-transparent border-zinc-800 hover:border-zinc-600'
                                                            )}
                                                            onClick={() => handleAddonToggle(addon)}
                                                        >
                                                            <span className="text-white text-sm">
                                                                {addon.name}{' '}
                                                                <span className="text-zinc-500 text-xs ml-1">
                                                                    (+{formatPrice(addon.price)})
                                                                </span>
                                                            </span>
                                                            <Checkbox
                                                                checked={selectedAddons.some((a) => a.id === addon.id)}
                                                                onCheckedChange={() => handleAddonToggle(addon)}
                                                                className="h-5 w-5 rounded border-zinc-600 bg-zinc-700 data-[state=checked]:bg-meso-red-500"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Footer */}
                            <div className="p-4 border-t border-meso-dark-800 bg-meso-dark-900 mt-auto z-10">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="flex items-center gap-3 bg-meso-dark-800 rounded-full px-4 py-2">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="text-lg font-bold w-4 text-center">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <span className="text-sm text-zinc-400 mr-2">Razem:</span>
                                        <span className="text-xl font-bold text-meso-red-500">
                                            {formatPrice(calculateTotal())}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleAddToCart}
                                    className="w-full h-12 text-lg font-bold bg-meso-red-500 hover:bg-meso-red-600 text-white rounded-xl shadow-[0_0_15px_rgba(244,37,175,0.4)]"
                                >
                                    Dodaj do koszyka
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    )
}
