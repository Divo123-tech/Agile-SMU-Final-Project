import { useNavigate, useParams } from "react-router-dom"
import { SiteHeader } from "@/components/site-header"
import { useState, useMemo, useEffect, useCallback } from "react"
import axios from "axios"
import { toast } from "sonner"
import {
  bookmarkDish,
  getAccount,
  getMyDishes,
  getStallMenu,
  unbookmarkDish,
} from "@/lib/api"
import { parseAllergenTypes } from "@/lib/allergens"
import { useAuth } from "@/hooks/useAuth"
import { StallNotFound } from "@/components/stall-not-found"
import { MenuHeader } from "@/components/ui/menu-header"
import { AllergenFilter } from "@/components/ui/allergen-filter"
import { CategorySection } from "@/components/ui/category-section"
import { SearchBar } from "@/components/ui/search-bar"
import { AllergenBadge, type AllergenType } from "@/components/ui/allergen-badge"
import type { Dish } from "@/components/ui/dish-card"

interface StallInfo {
  name: string
  description: string
  image: string
  address?: string
  owner: number
  updatedAt?: string | null
}

function formatLastUpdated(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

interface MenuCategory {
  category: string
  dishes: Dish[]
}

const ALLERGEN_ORDER: AllergenType[] = [
  "gluten",
  "dairy",
  "nuts",
  "eggs",
  "soy",
  "fish",
  "shellfish",
  "sesame",
]

function Stall() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuth()
  const userId = user?.id ?? null
  const [stall, setStall] = useState<StallInfo | null>(null)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(() => Boolean(id))
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const [filteredAllergens, setFilteredAllergens] = useState<AllergenType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => new Set())
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    let cancelled = false;

    (async () => {
      try {
        const menu = await getStallMenu(Number(id))
        if (cancelled) return
        setCategories(menu.categories as MenuCategory[])
        setStall(menu.stall as StallInfo)
        setErrorStatus(null)
      } catch (err: unknown) {
        if (cancelled) return
        const status = axios.isAxiosError(err) ? err.response?.status : undefined
        setErrorStatus(status ?? 0)
        setStall(null)
        setCategories([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!isLoggedIn) {
      setFilteredAllergens([])
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const profile = await getAccount()
        if (cancelled) return
        setFilteredAllergens(parseAllergenTypes(profile.allergies))
      } catch {
        if (!cancelled) setFilteredAllergens([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) {
      setBookmarkedIds(new Set())
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const saved = await getMyDishes()
        if (!cancelled) {
          setBookmarkedIds(new Set(saved.dishes.map((dish) => dish.id)))
        }
      } catch {
        if (!cancelled) setBookmarkedIds(new Set())
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn])

  const handleBookmarkToggle = useCallback(
    async (dishId: string) => {
      if (!isLoggedIn) {
        navigate(id ? `/login` : "/login", {
          state: { from: id ? `/stall/${id}` : "/" },
        })
        return
      }

      setBookmarkingId(dishId)

      try {
        if (bookmarkedIds.has(dishId)) {
          await unbookmarkDish(Number(dishId))
          setBookmarkedIds((prev) => {
            const next = new Set(prev)
            next.delete(dishId)
            return next
          })
          toast.success("Removed from My Dishes")
        } else {
          await bookmarkDish(Number(dishId))
          setBookmarkedIds((prev) => new Set(prev).add(dishId))
          toast.success("Saved to My Dishes")
        }
      } catch (err: unknown) {
        const message =
          axios.isAxiosError(err) && err.response?.data
            ? String(
                (err.response.data as { error?: string }).error ??
                  `Failed to update saved dish (${err.response.status})`,
              )
            : "Failed to update saved dish. Please try again."
        toast.error(message)
      } finally {
        setBookmarkingId(null)
      }
    },
    [bookmarkedIds, id, isLoggedIn, navigate],
  )

  const toggleAllergen = (allergen: AllergenType) => {
    setFilteredAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    )
  }

  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return categories.map((category) => ({
      ...category,
      dishes: category.dishes.filter((dish) => {
        const matchesAllergens = !dish.allergens.some((allergen) =>
          filteredAllergens.includes(allergen)
        )
        const matchesSearch =
          query === "" ||
          dish.name.toLowerCase().includes(query) ||
          dish.description.toLowerCase().includes(query)
        return matchesAllergens && matchesSearch
      }),
    }))
  }, [categories, filteredAllergens, searchQuery])

  const totalHiddenDishes = useMemo(() => {
    if (filteredAllergens.length === 0) return 0
    return categories.reduce(
      (acc, cat) =>
        acc +
        cat.dishes.filter((dish) =>
          dish.allergens.some((allergen) => filteredAllergens.includes(allergen))
        ).length,
      0
    )
  }, [categories, filteredAllergens])

  const handleDishDeleted = (dishId: string) => {
    setCategories((prev) =>
      prev
        .map((category) => ({
          ...category,
          dishes: category.dishes.filter((dish) => dish.id !== dishId),
        }))
        .filter((category) => category.dishes.length > 0),
    )
  }

  const stallAllergens = useMemo(() => {
    const present = new Set<AllergenType>()
    for (const category of categories) {
      for (const dish of category.dishes) {
        dish.allergens.forEach((allergen) => present.add(allergen))
      }
    }
    return ALLERGEN_ORDER.filter((allergen) => present.has(allergen))
  }, [categories])

  if (!id) {
    return <StallNotFound statusCode={404} />
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-5">
        <p className="text-muted-foreground">Loading menu…</p>
      </main>
    )
  }

  if (errorStatus !== null || !stall) {
    return <StallNotFound stallId={id} statusCode={errorStatus ?? 404} />
  }

  const isOwner = userId !== null && stall.owner === userId

  return (
    <main className="min-h-screen bg-background pb-8">
      <SiteHeader />
      <MenuHeader
        stallName={stall.name}
        stallDescription={stall.description}
        stallAddress={stall.address}
        stallImage={stall.image}
        lastUpdated={
          stall.updatedAt ? formatLastUpdated(stall.updatedAt) : null
        }
      />

      {stallAllergens.length > 0 && (
        <div className="px-5 pt-4">
          <div
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            <p>
              Dishes may face cross-contamination risk for allergens with:
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {stallAllergens.map((allergen) => (
                <AllergenBadge key={allergen} allergen={allergen} />
              ))}
            </div>
          </div>
        </div>
      )}

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <AllergenFilter selectedAllergens={filteredAllergens} onToggle={toggleAllergen} />

      {isLoggedIn && filteredAllergens.length > 0 && (
        <div className="px-5 pb-2">
          <p className="text-xs text-muted-foreground">
            Filtering dishes using your saved allergies from My Account. Tap a filter
            above to adjust.
          </p>
        </div>
      )}

      {totalHiddenDishes > 0 && (
        <div className="px-5 pb-4">
          <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
            {totalHiddenDishes} dish{totalHiddenDishes > 1 ? "es" : ""} hidden based on your
            allergy filters
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filteredCategories.map((category) => (
          <CategorySection
            key={category.category}
            name={category.category}
            dishes={category.dishes}
            isOwner={isOwner}
            onDishDeleted={handleDishDeleted}
            showBookmark={isLoggedIn}
            bookmarkedIds={bookmarkedIds}
            bookmarkingId={bookmarkingId}
            onBookmarkToggle={handleBookmarkToggle}
          />
        ))}
      </div>

      <footer className="px-5 pt-8 pb-4">
        <div className="text-center text-xs text-muted-foreground space-y-2">
          <p>
            <strong>Allergen Notice:</strong> Our kitchen handles all major allergens.
            Cross-contamination may occur.
          </p>
          <p>Please inform our staff of any allergies before ordering.</p>
        </div>
      </footer>
    </main>
  )
}

export default Stall
