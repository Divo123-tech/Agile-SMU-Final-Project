import { Link } from "react-router-dom"
import { SiteHeader } from "@/components/site-header"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"

function Home() {
  const { isLoggedIn } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold text-foreground">
        Allergy-aware hawker menus
      </h1>
      <p className="mt-3 text-muted-foreground">
        Browse stall menus with clear allergen info. Create an account to save your
        allergies and manage your own stalls.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {isLoggedIn ? (
          <>
            <Button asChild className="h-12 flex-1 rounded-xl">
              <Link to="/my-account">My Account</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 flex-1 rounded-xl">
              <Link to="/my-stalls">My Stalls</Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild className="h-12 flex-1 rounded-xl">
              <Link to="/sign-up">Create account</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 flex-1 rounded-xl">
              <Link to="/login">Sign in</Link>
            </Button>
          </>
        )}
      </div>
      </main>
    </div>
  )
}

export default Home
