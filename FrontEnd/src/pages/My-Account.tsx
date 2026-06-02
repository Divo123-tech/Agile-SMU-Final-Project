import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "sonner"
import { Check, Save } from "lucide-react"
import { AllergenSelector } from "@/components/allergen-selector"
import type { AllergenType } from "@/components/ui/allergen-badge"
import { PageHeader } from "@/components/page-header"
import { getAccount, updateAccount } from "@/lib/api"
import { allergenListsEqual, parseAllergenTypes } from "@/lib/allergens"
import { getPasswordChecks, isPasswordStrong } from "@/lib/password"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export default function MyAccountPage() {
  const navigate = useNavigate()
  const { isLoggedIn, user, login } = useAuth()
  const [email, setEmail] = useState("")
  const [allergens, setAllergens] = useState<AllergenType[]>([])
  const [savedAllergens, setSavedAllergens] = useState<AllergenType[]>([])
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", { replace: true, state: { from: "/my-account" } })
    }
  }, [isLoggedIn, navigate])

  useEffect(() => {
    if (!isLoggedIn) return

    let cancelled = false

    ;(async () => {
      setIsLoading(true)
      try {
        const profile = await getAccount()
        if (cancelled) return
        const profileAllergens = parseAllergenTypes(profile.allergies)
        setEmail(profile.email)
        setAllergens(profileAllergens)
        setSavedAllergens(profileAllergens)
      } catch (err: unknown) {
        if (cancelled) return
        const message =
          axios.isAxiosError(err) && err.response?.data
            ? String(
                (err.response.data as { error?: string }).error ??
                  `Failed to load account (${err.response.status})`,
              )
            : "Failed to load your account. Please try again."
        toast.error(message)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn])

  const passwordChecks = getPasswordChecks(newPassword)
  const wantsPasswordChange = newPassword.length > 0 || confirmPassword.length > 0
  const passwordsMatch = newPassword === confirmPassword
  const emailChanged = user ? email.trim().toLowerCase() !== user.email : false
  const allergiesChanged = !allergenListsEqual(allergens, savedAllergens)
  const newPasswordValid = !wantsPasswordChange || isPasswordStrong(newPassword)

  const isFormValid =
    currentPassword.length > 0 &&
    (emailChanged || wantsPasswordChange || allergiesChanged) &&
    newPasswordValid &&
    (!wantsPasswordChange || (confirmPassword.length > 0 && passwordsMatch))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isFormValid || isSubmitting || !user) return

    if (wantsPasswordChange && !passwordsMatch) {
      toast.error("New passwords do not match")
      return
    }

    setIsSubmitting(true)

    try {
      const payload: {
        currentPassword: string
        email?: string
        newPassword?: string
        allergies?: string[]
      } = { currentPassword }

      if (emailChanged) {
        payload.email = email.trim().toLowerCase()
      }

      if (wantsPasswordChange) {
        payload.newPassword = newPassword
      }

      if (allergiesChanged) {
        payload.allergies = allergens
      }

      const result = await updateAccount(payload)
      login(result.token)
      const updatedAllergens = parseAllergenTypes(result.account.allergies)
      setAllergens(updatedAllergens)
      setSavedAllergens(updatedAllergens)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Account updated successfully!")
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data
          ? String(
              (err.response.data as { error?: string }).error ??
                `Failed to update account (${err.response.status})`,
            )
          : "Failed to update account. Please try again."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="My Account" backTo="/" backLabel="Back to home" />

      <main className="mx-auto max-w-lg px-4 py-6">
        <p className="mb-6 text-sm text-muted-foreground">
          Update your email, password, or saved allergies. Enter your current
          password to save any changes.
        </p>

        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Loading your account…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="account-email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="account-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-border bg-card px-4 focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                My allergies
              </label>
              <p className="text-xs text-muted-foreground">
                Select allergens you need to avoid. These can be used to filter menus
                when browsing stalls.
              </p>
              <div className="rounded-xl border border-border bg-card p-4">
                <AllergenSelector selected={allergens} onChange={setAllergens} />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="account-current-password"
                className="text-sm font-medium text-foreground"
              >
                Current password
              </label>
              <Input
                id="account-current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Required to save changes"
                className="h-12 rounded-xl border-border bg-card px-4 focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="account-new-password"
                className="text-sm font-medium text-foreground"
              >
                New password
              </label>
              <Input
                id="account-new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="h-12 rounded-xl border-border bg-card px-4 focus-visible:border-primary focus-visible:ring-primary/20"
              />
              {newPassword.length > 0 && (
                <ul className="space-y-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5">
                  {passwordChecks.map(({ id, label, met }) => (
                    <li
                      key={id}
                      className={cn(
                        "flex items-center gap-2 text-xs",
                        met ? "text-emerald-700" : "text-muted-foreground",
                      )}
                    >
                      <Check
                        className={cn("size-3.5 shrink-0", met ? "opacity-100" : "opacity-30")}
                        aria-hidden
                      />
                      {label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {wantsPasswordChange && (
              <div className="space-y-2">
                <label
                  htmlFor="account-confirm-new-password"
                  className="text-sm font-medium text-foreground"
                >
                  Confirm new password
                </label>
                <Input
                  id="account-confirm-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 rounded-xl border-border bg-card px-4 focus-visible:border-primary focus-visible:ring-primary/20"
                />
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="h-14 w-full rounded-xl text-base font-semibold"
            >
              <Save className="mr-2 size-5" />
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </form>
        )}
      </main>
    </div>
  )
}
