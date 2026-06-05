import { useCallback, useMemo, useState, type ReactNode } from "react"
import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/api"
import { getUserFromToken, isTokenValid, type AuthUser } from "@/lib/auth"
import { AuthContext, type AuthContextValue } from "@/context/auth-context"

type AuthSession = {
  token: string
  user: AuthUser
}

function readStoredSession(): AuthSession | null {
  const token = getAuthToken()
  if (!token || !isTokenValid(token)) {
    if (token) clearAuthToken()
    return null
  }

  const user = getUserFromToken(token)
  if (!user) {
    clearAuthToken()
    return null
  }

  return { token, user }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession())

  const login = useCallback((token: string) => {
    if (!isTokenValid(token)) return

    const user = getUserFromToken(token)
    if (!user) return

    setAuthToken(token)
    setSession({ token, user })
  }, [])

  const logout = useCallback(() => {
    clearAuthToken()
    setSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoggedIn: session !== null,
      isAdmin: session?.user.isAdmin ?? false,
      user: session?.user ?? null,
      login,
      logout,
    }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
