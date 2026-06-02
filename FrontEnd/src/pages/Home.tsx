import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { Search, Store } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { getStalls, type Stall } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function Home() {
  const { isLoggedIn } = useAuth()
  const [stalls, setStalls] = useState<Stall[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getStalls()
        if (!cancelled) setStalls(data.stalls)
      } catch (err: unknown) {
        if (cancelled) return
        const message =
          axios.isAxiosError(err) && err.response?.data
            ? String(
                (err.response.data as { error?: string }).error ??
                  `Failed to load stalls (${err.response.status})`,
              )
            : "Failed to load stalls. Please try again."
        setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredStalls = useMemo(() => {
    const text = query.trim().toLowerCase()
    if (!text) return stalls
    return stalls.filter((stall) => stall.name.toLowerCase().includes(text))
  }, [query, stalls])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            Welcome
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-foreground md:text-4xl">
            Find allergy-aware stalls quickly
          </h1>
          <p className="mt-3 text-muted-foreground">
            Search stalls by name, open menus instantly, and use allergy filters to hide
            dishes you want to avoid.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {isLoggedIn ? (
              <>
                <Button asChild className="h-12 rounded-xl">
                  <Link to="/my-account">My Account</Link>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-xl">
                  <Link to="/my-stalls">My Stalls</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="h-12 rounded-xl">
                  <Link to="/sign-up">Create account</Link>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-xl">
                  <Link to="/login">Sign in</Link>
                </Button>
              </>
            )}
          </div>
        </section>

        <section className="mt-8 space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stalls by name..."
              className="h-12 rounded-xl bg-card pl-10"
            />
          </div>

          {loading ? (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Loading stalls...
            </p>
          ) : error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </p>
          ) : filteredStalls.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              No stalls match your search.
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {filteredStalls.map((stall) => (
                <li key={stall.id}>
                  <Link
                    to={`/stall/${stall.id}`}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
                  >
                    {stall.image ? (
                      <img
                        src={stall.image}
                        alt=""
                        className="size-14 shrink-0 rounded-lg object-cover bg-muted"
                      />
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Store className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{stall.name}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {stall.description}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default Home
