export type AuthUser = {
  id: number
  email: string
  isAdmin: boolean
}

type JwtPayload = {
  sub?: number
  email?: string
  isAdmin?: boolean
  exp?: number
}

function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const segment = token.split(".")[1]
    if (!segment) return null

    const json = atob(segment.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function getUserFromToken(token: string): AuthUser | null {
  const payload = parseJwtPayload(token)
  if (payload?.sub == null || typeof payload.email !== "string") {
    return null
  }

  return {
    id: payload.sub,
    email: payload.email,
    isAdmin: payload.isAdmin === true,
  }
}

export function isTokenValid(token: string): boolean {
  const payload = parseJwtPayload(token)
  if (!payload?.exp) return true
  return Date.now() < payload.exp * 1000
}
