import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "sonner"
import {
  MoreVertical,
  Pencil,
  Plus,
  QrCode,
  Store,
  Trash2,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import {
  deleteStall,
  getMyStalls,
  type MyStallsResponse,
  type Stall,
  type StallStatus,
} from "@/lib/api"
import { cn } from "@/lib/utils"

function statusLabel(status: StallStatus): string {
  if (status === "approved") return "Approved"
  if (status === "rejected") return "Rejected"
  return "Pending review"
}

function statusClass(status: StallStatus): string {
  if (status === "approved") return "bg-emerald-100 text-emerald-800"
  if (status === "rejected") return "bg-destructive/10 text-destructive"
  return "bg-amber-100 text-amber-900"
}
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
function StallListItem({
  stall,
  isOwner,
  onDeleted,
}: {
  stall: Stall
  isOwner: boolean
  onDeleted: (stallId: number) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuOpen])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteStall(stall.id)
      toast.success("Stall deleted successfully!")
      onDeleted(stall.id)
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data
          ? String(
              (err.response.data as { error?: string }).error ??
                `Failed to delete stall (${err.response.status})`,
            )
          : "Failed to delete stall. Please try again."
      toast.error(message)
    } finally {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <li>
      <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
        <Link
          to={stall.status === "approved" ? `/stall/${stall.id}` : "#"}
          onClick={(e) => {
            if (stall.status !== "approved") e.preventDefault()
          }}
          className="flex gap-3 min-w-0 flex-1"
        >
          {stall.image ? (
            <img
              src={stall.image}
              alt=""
              className="size-16 shrink-0 rounded-lg object-cover bg-muted"
            />
          ) : (
            <div className="size-16 shrink-0 rounded-lg bg-muted flex items-center justify-center">
              <Store className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-medium text-foreground truncate">{stall.name}</p>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  statusClass(stall.status),
                )}
              >
                {statusLabel(stall.status)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {stall.description}
            </p>
            {stall.address && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {stall.address}
              </p>
            )}
            {stall.status === "rejected" && stall.adminNotes && (
              <p className="text-xs text-destructive mt-2 line-clamp-3">
                <span className="font-medium">Admin note:</span> {stall.adminNotes}
              </p>
            )}
          </div>
        </Link>

        {confirmDelete ? (
          <div className="flex flex-col gap-2 shrink-0 w-28">
            <p className="text-xs text-destructive font-medium text-center leading-tight">
              Delete this stall?
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg w-full"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-lg w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Confirm"}
            </Button>
          </div>
        ) : isOwner ? (
          <div ref={menuRef} className="relative shrink-0 self-start">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-lg"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={`Options for ${stall.name}`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-20 mt-1 min-w-[10.5rem] rounded-xl border border-border bg-card py-1 shadow-lg"
              >
                <Link
                  to={`/edit-stall/${stall.id}`}
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => {
                    setMenuOpen(false)
                    setConfirmDelete(true)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <Link
                  to={`/stall-qr/${stall.id}`}
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <QrCode className="w-4 h-4" />
                  Generate QR
                </Link>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </li>
  )
}

export default function MyStallsPage() {
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuth()
  const userId = user?.id ?? null
  const [data, setData] = useState<MyStallsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", { replace: true, state: { from: "/my-stalls" } })
    }
  }, [isLoggedIn, navigate])

  useEffect(() => {
    if (!isLoggedIn || !user) {
      return
    }

    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await getMyStalls(user.id)
        if (!cancelled) setData(result)
      } catch (err: unknown) {
        if (cancelled) return
        const message =
          axios.isAxiosError(err) && err.response?.data
            ? String(
                (err.response.data as { error?: string }).error ??
                  `Failed to load stalls (${err.response.status})`,
              )
            : "Failed to load your stalls. Please try again."
        setError(message)
        toast.error(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn, user])

  const handleStallDeleted = (stallId: number) => {
    setData((prev) => {
      if (!prev) return prev
      const stalls = prev.stalls.filter((s) => s.id !== stallId)
      return { ...prev, stalls, count: stalls.length }
    })
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="My Stalls"
        backTo="/"
        backLabel="Back to home"
        trailing={
          <Link
            to="/create-stall"
            className="shrink-0 rounded-lg p-2 transition-colors hover:bg-muted"
            aria-label="Create stall"
          >
            <Plus className="size-5 text-foreground" />
          </Link>
        }
      />

      <main className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Loading your stalls…
          </p>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : data && data.count === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center space-y-4">
            <Store className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              You don&apos;t have any stalls yet.
            </p>
            <Button asChild className="w-full rounded-xl">
              <Link to="/create-stall">Create your first stall</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {data?.count} stall{data && data.count !== 1 ? "s" : ""}
            </p>
            <ul className="space-y-3">
              {data?.stalls.map((stall) => (
                <StallListItem
                  key={stall.id}
                  stall={stall}
                  isOwner={userId !== null && stall.owner === userId}
                  onDeleted={handleStallDeleted}
                />
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}
