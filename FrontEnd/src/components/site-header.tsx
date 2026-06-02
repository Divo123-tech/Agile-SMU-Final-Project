import { Link } from "react-router-dom"
import { LogIn, UserPlus } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { UserMenu } from "@/components/user-menu"
import { Button } from "@/components/ui/button"

/** Top bar for public pages only (home, stall menu). */
export function SiteHeader() {
  const { isLoggedIn } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
        <Link
          to="/"
          className="font-serif text-lg font-medium text-foreground transition-colors hover:text-primary"
        >
          Allergen Menu
        </Link>

        {isLoggedIn ? (
          <UserMenu />
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-lg" asChild>
              <Link to="/login">
                <LogIn className="mr-1.5 size-4" />
                Log in
              </Link>
            </Button>
            <Button size="sm" className="rounded-lg" asChild>
              <Link to="/sign-up">
                <UserPlus className="mr-1.5 size-4" />
                Sign up
              </Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
