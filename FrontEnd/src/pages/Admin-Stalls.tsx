import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "sonner"
import {
  Check,
  ExternalLink,
  FileCheck,
  ImageIcon,
  ShieldCheck,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { AllergenBadge } from "@/components/ui/allergen-badge"
import {
  getAdminStall,
  getAdminStallMenu,
  getPendingStalls,
  reviewStall,
  stallImageUrl,
  stallProofUrl,
  type AdminStall,
  type StallMenuCategory,
  type StallMenuDish,
} from "@/lib/api"
import { parseAllergenTypes } from "@/lib/allergens"
import { useAdminStallRealtime } from "@/hooks/useAdminStallRealtime"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

function DetailField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground whitespace-pre-wrap">{value || "—"}</p>
    </div>
  )
}

function AdminDishCard({ dish }: { dish: StallMenuDish }) {
  const knownAllergens = parseAllergenTypes(dish.allergens)
  const knownSet = new Set<string>(knownAllergens)
  const otherAllergens = dish.allergens.filter((a) => !knownSet.has(a))

  return (
    <article className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
      <h4 className="font-medium text-foreground text-sm">{dish.name}</h4>
      {dish.description ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {dish.description}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {knownAllergens.map((allergen) => (
          <AllergenBadge key={allergen} allergen={allergen} />
        ))}
        {otherAllergens.map((label) => (
          <span
            key={label}
            className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          >
            {label}
          </span>
        ))}
        {dish.allergens.length === 0 ? (
          <span className="text-xs text-muted-foreground">No allergens listed</span>
        ) : null}
      </div>
    </article>
  )
}

export default function AdminStallsPage() {
  const navigate = useNavigate()
  const { isLoggedIn, isAdmin } = useAuth()
  const [pending, setPending] = useState<AdminStall[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loadedDetail, setLoadedDetail] = useState<{
    stallId: number
    stall: AdminStall
    categories: StallMenuCategory[]
  } | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [fetchingDetailId, setFetchingDetailId] = useState<number | null>(null)

  const loadingDetail =
    selectedId != null && fetchingDetailId === selectedId

  const detailMatchesSelection =
    selectedId != null && loadedDetail?.stallId === selectedId
  const selected = detailMatchesSelection ? loadedDetail.stall : null
  const menuCategories = detailMatchesSelection ? loadedDetail.categories : []
  const [isReviewing, setIsReviewing] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectNotes, setRejectNotes] = useState("")

  const handlePendingStallCreated = useCallback((stall: AdminStall) => {
    setPending((prev) => {
      if (prev.some((s) => s.id === stall.id)) return prev
      return [...prev, stall]
    })
    toast.info(`New stall submission: ${stall.name}`, {
      description: stall.ownerEmail ?? `Owner #${stall.owner}`,
    })
  }, [])

  const wsConnected = useAdminStallRealtime({
    enabled: isLoggedIn && isAdmin,
    onPendingStall: handlePendingStallCreated,
  })

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", { replace: true, state: { from: "/admin/stalls" } })
      return
    }
    if (!isAdmin) {
      navigate("/", { replace: true })
    }
  }, [isLoggedIn, isAdmin, navigate])

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) return

    let cancelled = false

    ;(async () => {
      setLoadingList(true)
      setListError(null)
      try {
        const data = await getPendingStalls()
        if (cancelled) return
        setPending(data.stalls)
        if (data.stalls.length > 0) {
          setSelectedId(data.stalls[0].id)
        }
      } catch (err: unknown) {
        if (cancelled) return
        const message =
          axios.isAxiosError(err) && err.response?.data
            ? String(
                (err.response.data as { error?: string }).error ??
                  `Failed to load pending stalls (${err.response.status})`,
              )
            : "Failed to load pending stalls."
        setListError(message)
        toast.error(message)
      } finally {
        if (!cancelled) setLoadingList(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn, isAdmin])

  useEffect(() => {
    if (!selectedId || !isAdmin) return

    let cancelled = false
    const stallId = selectedId

    void (async () => {
      setFetchingDetailId(stallId)
      try {
        const [stall, menu] = await Promise.all([
          getAdminStall(stallId),
          getAdminStallMenu(stallId),
        ])
        if (cancelled) return
        setLoadedDetail({
          stallId,
          stall,
          categories: menu.categories,
        })
      } catch (err: unknown) {
        if (cancelled) return
        const message =
          axios.isAxiosError(err) && err.response?.data
            ? String(
                (err.response.data as { error?: string }).error ??
                  "Failed to load stall details",
              )
            : "Failed to load stall details."
        toast.error(message)
        setLoadedDetail(null)
      } finally {
        if (!cancelled) {
          setFetchingDetailId((current) => (current === stallId ? null : current))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [selectedId, isAdmin])

  const selectPendingStall = (stallId: number) => {
    if (stallId !== selectedId) {
      setShowRejectForm(false)
      setRejectNotes("")
    }
    setSelectedId(stallId)
  }

  const handleReview = async (
    status: "approved" | "rejected",
    adminNotes?: string,
  ) => {
    if (!selected || isReviewing) return

    setIsReviewing(true)
    try {
      await reviewStall(selected.id, status, adminNotes)
      setPending((prev) => {
        const remaining = prev.filter((s) => s.id !== selected.id)
        setSelectedId(remaining[0]?.id ?? null)
        return remaining
      })
      setLoadedDetail(null)
      setShowRejectForm(false)
      setRejectNotes("")
      toast.success(
        status === "approved"
          ? "Stall approved and is now public."
          : "Stall rejected. The owner will see your note.",
      )
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data
          ? String((err.response.data as { error?: string }).error ?? "Review failed")
          : "Review failed. Please try again."
      toast.error(message)
    } finally {
      setIsReviewing(false)
    }
  }

  if (!isLoggedIn || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Review Stalls" backTo="/" backLabel="Back to home" />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground flex-1 min-w-[200px]">
            Review new stall submissions. Approve to publish on the home page, or
            reject if they do not meet requirements.
          </p>
          {wsConnected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live updates on
            </span>
          ) : null}
        </div>

        {loadingList ? (
          <p className="text-sm text-muted-foreground">Loading pending stalls…</p>
        ) : listError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {listError}
          </p>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
            <ShieldCheck className="mx-auto size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No stalls are waiting for approval.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Pending ({pending.length})
              </p>
              <ul className="space-y-2">
                {pending.map((stall) => (
                  <li key={stall.id}>
                    <button
                      type="button"
                      onClick={() => selectPendingStall(stall.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                        selectedId === stall.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                    >
                      <p className="font-medium text-foreground truncate">
                        {stall.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {stall.ownerEmail ?? `Owner #${stall.owner}`}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <section className="flex flex-col rounded-xl border border-border bg-card min-h-[420px] max-h-[min(80vh,calc(100vh-9rem))] overflow-hidden">
              {!selectedId ? (
                <p className="text-sm text-muted-foreground py-8 text-center p-6">
                  Select a stall
                </p>
              ) : loadingDetail || !selected ? (
                <p className="text-sm text-muted-foreground py-8 text-center p-6">
                  {loadingDetail ? "Loading stall details…" : "Unable to load stall details"}
                </p>
              ) : (
                <>
                  <div className="flex-1 min-h-0 overflow-y-auto p-5 md:p-6 space-y-6">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Store className="size-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-serif text-xl font-semibold text-foreground">
                          {selected.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Submitted by{" "}
                          {selected.ownerEmail ?? `account #${selected.owner}`}
                        </p>
                      </div>
                    </div>

                    <DetailField label="Stall name" value={selected.name} />
                    <DetailField label="Description" value={selected.description} />
                    <DetailField label="Address" value={selected.address} />

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <ImageIcon className="size-3.5" />
                        Stall photo
                      </p>
                      {selected.image ? (
                        <img
                          src={stallImageUrl(selected.id)}
                          alt=""
                          className="w-full max-h-48 rounded-xl border border-border object-cover"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">No photo</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <FileCheck className="size-3.5" />
                        Proof of ownership
                      </p>
                      {selected.proofOfOwnership ? (
                        <a
                          href={stallProofUrl(selected.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
                        >
                          View proof document
                          <ExternalLink className="size-4" />
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">No proof uploaded</p>
                      )}
                    </div>

                    <div className="space-y-4 border-t border-border pt-5">
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className="size-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">
                          Menu ({menuCategories.reduce((n, c) => n + c.dishes.length, 0)}{" "}
                          {menuCategories.reduce((n, c) => n + c.dishes.length, 0) === 1
                            ? "dish"
                            : "dishes"}
                          )
                        </h3>
                      </div>

                      {menuCategories.length === 0 ? (
                        <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-4 text-center">
                          No dishes added yet. You can still approve or reject the stall
                          submission.
                        </p>
                      ) : (
                        menuCategories.map((group) => (
                          <div key={group.category} className="space-y-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              {group.category}
                            </p>
                            <div className="space-y-2">
                              {group.dishes.map((dish) => (
                                <AdminDishCard key={dish.id} dish={dish} />
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-border bg-card p-4 md:p-5">
                    {showRejectForm ? (
                      <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                        <label
                          htmlFor="reject-notes"
                          className="text-sm font-medium text-foreground"
                        >
                          Rejection note for the owner
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Explain what needs to change or why this submission was denied.
                        </p>
                        <Textarea
                          id="reject-notes"
                          value={rejectNotes}
                          onChange={(e) => setRejectNotes(e.target.value)}
                          placeholder="e.g. Proof of ownership is unclear. Please resubmit with a valid document."
                          rows={3}
                          className="resize-none rounded-xl border-border bg-card"
                        />
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 flex-1 rounded-xl"
                            disabled={isReviewing}
                            onClick={() => {
                              setShowRejectForm(false)
                              setRejectNotes("")
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            className="h-11 flex-1 rounded-xl"
                            disabled={isReviewing || !rejectNotes.trim()}
                            onClick={() =>
                              handleReview("rejected", rejectNotes.trim())
                            }
                          >
                            {isReviewing ? "Submitting…" : "Submit rejection"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          className="h-12 flex-1 rounded-xl"
                          disabled={isReviewing}
                          onClick={() => handleReview("approved")}
                        >
                          <Check className="mr-2 size-5" />
                          {isReviewing ? "Saving…" : "Approve"}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          className="h-12 flex-1 rounded-xl"
                          disabled={isReviewing}
                          onClick={() => setShowRejectForm(true)}
                        >
                          <X className="mr-2 size-5" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Need to browse menus?{" "}
          <Link to="/" className="text-primary hover:text-primary/80">
            Go to home
          </Link>
        </p>
      </main>
    </div>
  )
}
