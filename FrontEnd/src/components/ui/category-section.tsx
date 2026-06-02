import { DishCard, type Dish } from "./dish-card"

interface CategorySectionProps {
  name: string
  dishes: Dish[]
  isOwner?: boolean
  onDishDeleted?: (dishId: string) => void
  showBookmark?: boolean
  bookmarkedIds?: Set<string>
  bookmarkingId?: string | null
  onBookmarkToggle?: (dishId: string) => void
}

export function CategorySection({
  name,
  dishes,
  isOwner = false,
  onDishDeleted,
  showBookmark = false,
  bookmarkedIds,
  bookmarkingId = null,
  onBookmarkToggle,
}: CategorySectionProps) {
  if (dishes.length === 0) return null

  return (
    <section className="px-5">
      <h2 className="font-serif text-xl font-semibold text-foreground mb-4 sticky top-0 bg-background py-3 z-10 border-b border-border/50">
        {name}
      </h2>
      <div className="space-y-3 pb-6">
        {dishes.map((dish) => (
          <DishCard
            key={dish.id}
            dish={dish}
            isOwner={isOwner}
            onDishDeleted={onDishDeleted}
            showBookmark={showBookmark}
            isBookmarked={bookmarkedIds?.has(dish.id) ?? false}
            isBookmarking={bookmarkingId === dish.id}
            onBookmarkToggle={onBookmarkToggle}
          />
        ))}
      </div>
    </section>
  )
}
