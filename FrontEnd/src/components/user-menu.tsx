import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Bookmark, LogOut, Settings, ShieldCheck, Store, User } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export function UserMenu() {
  const navigate = useNavigate()
  const { logout, isAdmin } = useAuth()
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

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate("/")
  }

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted"
        aria-label="Account menu"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        <User className="size-5" />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
          {isAdmin && (
            <Link
              to="/admin/stalls"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
              onClick={() => setMenuOpen(false)}
            >
              <ShieldCheck className="size-4" />
              Review Stalls
            </Link>
          )}
          <Link
            to="/my-dishes"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
            onClick={() => setMenuOpen(false)}
          >
            <Bookmark className="size-4" />
            My Dishes
          </Link>
          <Link
            to="/my-stalls"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
            onClick={() => setMenuOpen(false)}
          >
            <Store className="size-4" />
            My Stalls
          </Link>
          <Link
            to="/my-account"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
            onClick={() => setMenuOpen(false)}
          >
            <Settings className="size-4" />
            My Account
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-muted"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
