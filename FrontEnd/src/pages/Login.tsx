import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "sonner"
import { ArrowLeft, LogIn } from "lucide-react"
import { ACCOUNTS_API_BASE_URL, type LoginResponse } from "@/lib/api"
import { APP_NAME } from "@/lib/app"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoggedIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isFormValid = email.trim() && password.length > 0

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/my-account", { replace: true })
    }
  }, [isLoggedIn, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isFormValid || isSubmitting) return

    setIsSubmitting(true)

    try {
      const res = await axios.post<LoginResponse>(`${ACCOUNTS_API_BASE_URL}/login`, {
        email: email.trim().toLowerCase(),
        password,
      })

      login(res.data.token)

      toast.success("Signed in successfully!")
      navigate("/my-account", { replace: true })
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.status === 401
          ? "Invalid email or password"
          : axios.isAxiosError(err) && err.response?.data
            ? String(
                (err.response.data as { error?: string }).error ??
                  `Failed to sign in (${err.response.status})`,
              )
            : "Failed to sign in. Please try again."
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
          <h1 className="font-serif text-xl font-medium text-foreground">Sign In</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground mb-6">
          Welcome back to {APP_NAME}. Sign in to manage your account, allergies, and
          stalls.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12 px-4 rounded-xl border-border bg-card focus-visible:ring-primary/20 focus-visible:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="h-12 px-4 rounded-xl border-border bg-card focus-visible:ring-primary/20 focus-visible:border-primary"
            />
          </div>

          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full h-14 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-5 h-5 mr-2" />
            {isSubmitting ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/sign-up" className="font-medium text-primary hover:text-primary/80">
            Create account
          </Link>
        </p>
      </main>
    </div>
  )
}
