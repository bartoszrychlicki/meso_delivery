'use client'

import { useMediaQuery } from '@/hooks/use-media-query'
import {
    Drawer,
    DrawerContent,
} from '@/components/ui/drawer'
import {
    Sheet,
    SheetContent,
} from '@/components/ui/sheet'
import { ProductCustomization, type Product } from './ProductCustomization'

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
    const isDesktop = useMediaQuery('(min-width: 768px)')

    if (isDesktop) {
        return (
            <Sheet open={isOpen} onOpenChange={onOpenChange}>
                <SheetContent side="right" showCloseButton={false} className="p-0 bg-meso-dark-900 border-l-meso-dark-800 text-white w-[500px] sm:max-w-[500px] flex flex-col h-full">
                    <ProductCustomization
                        productSlug={productSlug}
                        initialData={initialData}
                        onClose={() => onOpenChange(false)}
                    />
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-meso-dark-900 border-t-meso-dark-800 text-white max-h-[90vh] flex flex-col">
                <ProductCustomization
                    productSlug={productSlug}
                    initialData={initialData}
                    onClose={() => onOpenChange(false)}
                />
            </DrawerContent>
        </Drawer>
    )
}
