import { useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { toast } from "sonner"
import { Bookmark, Pencil, Trash2 } from "lucide-react"
import { API_BASE_URL } from "@/lib/api"
import { Button } from "@/components/ui/button"
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
  isOwner?: boolean
  onDishDeleted?: (dishId: string) => void
  showBookmark?: boolean
  isBookmarked?: boolean
  isBookmarking?: boolean
  onBookmarkToggle?: (dishId: string) => void
}

export function DishCard({
  dish,
  className,
  isOwner = false,
  onDishDeleted,
  showBookmark = false,
  isBookmarked = false,
  isBookmarking = false,
  onBookmarkToggle,
}: DishCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await axios.delete(`${API_BASE_URL}/dishes/${dish.id}`)
      toast.success("Dish removed successfully!")
      onDishDeleted?.(dish.id)
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data
          ? String(
              (err.response.data as { message?: string }).message ??
                `Failed to remove dish (${err.response.status})`,
            )
          : "Failed to remove dish. Please try again."
      toast.error(message)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

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
        <div className="flex items-center gap-2 shrink-0">
          {showBookmark && (
            <button
              type="button"
              onClick={() => onBookmarkToggle?.(dish.id)}
              disabled={isBookmarking}
              className="rounded-lg p-1.5 text-primary transition-colors hover:bg-muted disabled:opacity-50"
              aria-label={isBookmarked ? "Remove saved dish" : "Save dish"}
              aria-pressed={isBookmarked}
            >
              <Bookmark
                className={cn("size-5", isBookmarked && "fill-current")}
              />
            </button>
          )}
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
            <span className="text-[10px]" title="Spicy">
              🌶️
            </span>
          )}
        </div>
      </div>

      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
        {dish.description}
      </p>

      {dish.allergens.length > 0 && (
        <div className="mt-3">
          <span className="sr-only">Contains: </span>
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Allergens">
            {dish.allergens.map((allergen) => (
              <AllergenBadge key={allergen} allergen={allergen} />
            ))}
          </div>
        </div>
      )}

      {isOwner && (
        <div className="mt-3 pt-3 border-t border-border/50">
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive font-medium text-center">
                Remove this dish?
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 h-10 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 h-10 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  {isDeleting ? "Removing…" : "Remove"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-6">
              <Link
                to={`/add-dish?edit=${dish.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit Dish
              </Link>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remove Dish
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
