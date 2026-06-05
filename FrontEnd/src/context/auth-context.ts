import { createContext } from "react"
import type { AuthUser } from "@/lib/auth"

export type AuthContextValue = {
  isLoggedIn: boolean
  isAdmin: boolean
  user: AuthUser | null
  login: (token: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
