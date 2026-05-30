import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "sonner"
import { ArrowLeft, Eye, Pencil, Plus, Store, Trash2 } from "lucide-react"
import { deleteStall, getMyStalls, type MyStallsResponse, type Stall } from "@/lib/api"
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
          <p className="font-medium text-foreground truncate">{stall.name}</p>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
            {stall.description}
          </p>
          {stall.address && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {stall.address}
            </p>
          )}
        </div>

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
        ) : (
          <div className="flex flex-col gap-1.5 shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-lg w-20 justify-center"
            >
              <Link to={`/stall/${stall.id}`} aria-label={`View ${stall.name}`}>
                <Eye className="w-3.5 h-3.5 mr-1" />
                View
              </Link>
            </Button>
            {isOwner && (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-lg w-20 justify-center"
                >
                  <Link
                    to={`/edit-stall/${stall.id}`}
                    aria-label={`Edit ${stall.name}`}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg w-20 justify-center text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  onClick={() => setConfirmDelete(true)}
                  aria-label={`Delete ${stall.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
        )}
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
      navigate("/login", { replace: true })
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
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="font-serif text-xl font-medium text-foreground flex-1">
            My Stalls
          </h1>
          <Link
            to="/create-stall"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Create stall"
          >
            <Plus className="w-5 h-5 text-foreground" />
          </Link>
        </div>
      </header>

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
