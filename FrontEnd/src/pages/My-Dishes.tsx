import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "sonner"
import { UtensilsCrossed } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { AllergenBadge, type AllergenType } from "@/components/ui/allergen-badge"
import {
  getMyDishes,
  unbookmarkDish,
  type BookmarkedDish,
  type MyDishesResponse,
} from "@/lib/api"
import { parseAllergenTypes } from "@/lib/allergens"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"

const ALL_STALLS = "all"

export default function MyDishesPage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [data, setData] = useState<MyDishesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stallFilter, setStallFilter] = useState(ALL_STALLS)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", { replace: true, state: { from: "/my-dishes" } })
    }
  }, [isLoggedIn, navigate])

  useEffect(() => {
    if (!isLoggedIn) return

    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await getMyDishes()
        if (!cancelled) setData(result)
      } catch (err: unknown) {
        if (cancelled) return
        const message =
          axios.isAxiosError(err) && err.response?.data
            ? String(
                (err.response.data as { error?: string }).error ??
                  `Failed to load saved dishes (${err.response.status})`,
              )
            : "Failed to load your saved dishes. Please try again."
        setError(message)
        toast.error(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn])

  const filteredDishes = useMemo(() => {
    if (!data) return []
    if (stallFilter === ALL_STALLS) return data.dishes

    const stallId = Number(stallFilter)
    return data.dishes.filter((dish) => dish.stallId === stallId)
  }, [data, stallFilter])

  const handleRemove = async (dish: BookmarkedDish) => {
    setRemovingId(dish.id)

    try {
      await unbookmarkDish(Number(dish.id))
      setData((prev) => {
        if (!prev) return prev
        const dishes = prev.dishes.filter((item) => item.id !== dish.id)
        const stallIds = new Set(dishes.map((item) => item.stallId))
        const stalls = prev.stalls.filter((stall) => stallIds.has(stall.id))
        return { dishes, stalls }
      })
      toast.success("Removed from My Dishes")
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data
          ? String(
              (err.response.data as { error?: string }).error ??
                `Failed to remove dish (${err.response.status})`,
            )
          : "Failed to remove dish. Please try again."
      toast.error(message)
    } finally {
      setRemovingId(null)
    }
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="My Dishes" backTo="/" backLabel="Back to home" />

      <main className="mx-auto max-w-lg px-4 py-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Dishes you saved while browsing stall menus.
        </p>

        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Loading your saved dishes…
          </p>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : data && data.dishes.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center space-y-4">
            <UtensilsCrossed className="mx-auto size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              You haven&apos;t saved any dishes yet. Open a stall menu and tap the
              bookmark icon on a dish.
            </p>
            <Button asChild className="w-full rounded-xl">
              <Link to="/">Browse stalls</Link>
            </Button>
          </div>
        ) : (
          <>
            {data && data.stalls.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="stall-filter" className="text-sm font-medium text-foreground">
                  Filter by stall
                </label>
                <select
                  id="stall-filter"
                  value={stallFilter}
                  onChange={(e) => setStallFilter(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                >
                  <option value={ALL_STALLS}>All stalls</option>
                  {data.stalls.map((stall) => (
                    <option key={stall.id} value={String(stall.id)}>
                      {stall.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {filteredDishes.length} saved dish
              {filteredDishes.length !== 1 ? "es" : ""}
            </p>

            <ul className="space-y-3">
              {filteredDishes.map((dish) => (
                <li
                  key={dish.id}
                  className="rounded-xl border border-border bg-card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{dish.category}</p>
                      <h2 className="font-semibold text-foreground truncate">{dish.name}</h2>
                      <Link
                        to={`/stall/${dish.stallId}`}
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        {dish.stallName}
                      </Link>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-lg"
                      disabled={removingId === dish.id}
                      onClick={() => handleRemove(dish)}
                    >
                      {removingId === dish.id ? "Removing…" : "Remove"}
                    </Button>
                  </div>

                  {dish.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {dish.description}
                    </p>
                  )}

                  {dish.allergens.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {parseAllergenTypes(dish.allergens).map((allergen) => (
                        <AllergenBadge key={allergen} allergen={allergen as AllergenType} />
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {filteredDishes.length === 0 && data && data.dishes.length > 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No saved dishes for this stall.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
