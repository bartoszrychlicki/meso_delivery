import {
  Soup,
  Utensils,
  Drumstick,
  Plus,
  GlassWater,
  UtensilsCrossed,
  Salad,
  Coffee,
  IceCreamCone,
  Beef,
  Fish,
  type LucideProps,
} from 'lucide-react'
import type { FC } from 'react'

const iconMap: Record<string, FC<LucideProps>> = {
  Soup,
  Utensils,
  Drumstick,
  Plus,
  GlassWater,
  UtensilsCrossed,
  Salad,
  Coffee,
  IceCreamCone,
  Beef,
  Fish,
}

interface CategoryIconProps extends LucideProps {
  name?: string
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  if (!name) return null

  const Icon = iconMap[name]

  // If no matching Lucide icon, treat as emoji/text
  if (!Icon) return <span {...(props as React.HTMLAttributes<HTMLSpanElement>)}>{name}</span>

  return <Icon {...props} />
}
