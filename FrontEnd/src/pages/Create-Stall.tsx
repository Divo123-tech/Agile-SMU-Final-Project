import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { FileCheck, ImagePlus, Store } from "lucide-react"
import { createStall } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type FileFieldProps = {
  id: string
  label: string
  hint: string
  accept: string
  file: File | null
  onChange: (file: File | null) => void
  icon: ReactNode
}

function FileField({ id, label, hint, accept, file, onChange, icon }: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div
        className={cn(
          "rounded-xl border border-dashed border-border bg-card p-4 transition-colors",
          file && "border-primary/40 bg-primary/5",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {icon}
            </div>
            <div className="min-w-0">
              {file ? (
                <>
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No file selected</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => inputRef.current?.click()}
            >
              {file ? "Change file" : "Choose file"}
            </Button>
            {file && (
              <Button
                type="button"
                variant="ghost"
                className="rounded-lg"
                onClick={() => {
                  onChange(null)
                  if (inputRef.current) inputRef.current.value = ""
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreateStallPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [proofOfOwnership, setProofOfOwnership] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isLoggedIn, user } = useAuth()

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", { replace: true, state: { from: "/create-stall" } })
    }
  }, [isLoggedIn, navigate])

  const photoPreviewUrl = useMemo(
    () => (photo ? URL.createObjectURL(photo) : null),
    [photo],
  )

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    }
  }, [photoPreviewUrl])

  const isFormValid =
    name.trim() &&
    description.trim() &&
    address.trim() &&
    photo !== null &&
    proofOfOwnership !== null

  if (!isLoggedIn) {
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isFormValid || isSubmitting || !user) return

    setIsSubmitting(true)

    try {
      await createStall({
        name: name.trim(),
        owner: user.id,
        description: description.trim(),
        address: address.trim(),
        photo,
        proofOfOwnership,
      })

      toast.success("Stall submitted! An admin will review it before it goes live.")
      navigate("/my-stalls")
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data
          ? String(
              (err.response.data as { error?: string }).error ??
                `Failed to create stall (${err.response.status})`,
            )
          : "Failed to create stall. Please try again."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Create Stall" backTo="/" backLabel="Back to home" />

      <main className="max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground mb-6">
          Register your stall with basic details and ownership verification. Your
          submission will be reviewed by an admin before it appears on the home page.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="stall-name" className="text-sm font-medium text-foreground">
              Stall name
            </label>
            <Input
              id="stall-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The Golden Wok"
              className="h-12 px-4 rounded-xl border-border bg-card focus-visible:ring-primary/20 focus-visible:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="stall-description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <Textarea
              id="stall-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers what your stall offers..."
              rows={4}
              className="px-4 py-3 rounded-xl border-border bg-card resize-none focus-visible:ring-primary/20 focus-visible:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="stall-address" className="text-sm font-medium text-foreground">
              Address
            </label>
            <Input
              id="stall-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Food Court Level 2, Booth 12"
              className="h-12 px-4 rounded-xl border-border bg-card focus-visible:ring-primary/20 focus-visible:border-primary"
            />
          </div>

          <FileField
            id="stall-photo"
            label="Stall photo"
            hint="Upload a clear photo of your stall (JPG, PNG, or WebP)."
            accept="image/jpeg,image/png,image/webp,image/*"
            file={photo}
            onChange={setPhoto}
            icon={<ImagePlus className="size-5" />}
          />

          {photoPreviewUrl && (
            <div className="overflow-hidden rounded-xl border border-border">
              <img
                src={photoPreviewUrl}
                alt="Stall photo preview"
                className="w-full max-h-56 object-cover"
              />
            </div>
          )}

          <FileField
            id="stall-proof"
            label="Proof of ownership"
            hint="Upload a document or image proving you own or operate this stall (PDF or image)."
            accept="image/jpeg,image/png,image/webp,application/pdf,image/*,.pdf"
            file={proofOfOwnership}
            onChange={setProofOfOwnership}
            icon={<FileCheck className="size-5" />}
          />

          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full h-14 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Store className="w-5 h-5 mr-2" />
            {isSubmitting ? "Submitting…" : "Create Stall"}
          </Button>
        </form>
      </main>
    </div>
  )
}
