import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "sonner"
import { ArrowLeft, Check, UserPlus } from "lucide-react"
import { ACCOUNTS_API_BASE_URL } from "@/lib/api"
import { getPasswordChecks, isPasswordStrong } from "@/lib/password"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export default function CreateAccountPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordsMatch = password === confirmPassword
  const passwordChecks = getPasswordChecks(password)
  const isFormValid =
    email.trim() &&
    isPasswordStrong(password) &&
    confirmPassword.length > 0 &&
    passwordsMatch

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isFormValid || isSubmitting) return

    if (!passwordsMatch) {
      toast.error("Passwords do not match")
      return
    }

    if (!isPasswordStrong(password)) {
      toast.error("Password does not meet all requirements")
      return
    }

    setIsSubmitting(true)

    try {
      await axios.post(`${ACCOUNTS_API_BASE_URL}/sign-up`, {
        email: email.trim().toLowerCase(),
        password,
      })

      toast.success("Account created! Sign in to continue.")
      navigate("/login", { replace: true })
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data
          ? String(
              (err.response.data as { error?: string }).error ??
                `Failed to create account (${err.response.status})`,
            )
          : "Failed to create account. Please try again."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
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
          <h1 className="font-serif text-xl font-medium text-foreground">
            Create Account
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground mb-6">
          Create an account to save your allergies, manage stalls, and browse menus safely.
        </p>

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
              placeholder="you@example.com"
              className="h-12 px-4 rounded-xl border-border bg-card focus-visible:ring-primary/20 focus-visible:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="account-password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="account-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="h-12 px-4 rounded-xl border-border bg-card focus-visible:ring-primary/20 focus-visible:border-primary"
            />
            {password.length > 0 && (
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

          <div className="space-y-2">
            <label
              htmlFor="account-confirm-password"
              className="text-sm font-medium text-foreground"
            >
              Confirm password
            </label>
            <Input
              id="account-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="h-12 px-4 rounded-xl border-border bg-card focus-visible:ring-primary/20 focus-visible:border-primary"
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full h-14 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            {isSubmitting ? "Creating account…" : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:text-primary/80">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  )
}
