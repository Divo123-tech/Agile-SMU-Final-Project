import { AllergenBadge, type AllergenType } from "./allergen-badge"
import { cn } from "@/lib/utils"

export interface Dish {
  id: string
  name: string
  description: string
  allergens: AllergenType[]
  isPopular?: boolean
  isVegetarian?: boolean
  isSpicy?: boolean
}

interface DishCardProps {
  dish: Dish
  className?: string
}

export function DishCard({ dish, className }: DishCardProps) {
  return (
    <article
      className={cn(
        "p-4 bg-card rounded-xl border border-border/50 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground text-base leading-tight">
          {dish.name}
        </h3>
        {/* Special tags */}
        <div className="flex items-center gap-2 shrink-0">
          {dish.isPopular && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
              Popular
            </span>
          )}
          {dish.isVegetarian && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-accent">
              Vegetarian
            </span>
          )}
          {dish.isSpicy && (
            <span className="text-[10px]" title="Spicy">🌶️</span>
          )}
        </div>
      </div>

      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
        {dish.description}
      </p>

      {/* Allergens */}
      {dish.allergens.length > 0 && (
        <div className="mt-3">
          <span className="sr-only">Contains: </span>
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Allergens">
            {dish.allergens && dish.allergens.map((allergen) => (
              <AllergenBadge key={allergen} allergen={allergen} />
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
