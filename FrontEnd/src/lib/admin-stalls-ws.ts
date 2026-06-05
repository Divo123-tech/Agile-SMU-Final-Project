import { STALLS_API_BASE_URL, getAuthToken } from "@/lib/api"
import type { AdminStall } from "@/lib/api"

export type PendingStallCreatedMessage = {
  type: "pending_stall_created"
  stall: AdminStall
}

export function getAdminStallsWebSocketUrl(): string | null {
  const token = getAuthToken()
  if (!token) return null

  const wsBase = STALLS_API_BASE_URL.replace(/^http/i, (match) =>
    match.toLowerCase() === "https" ? "wss" : "ws",
  )
  const url = new URL("/ws/admin", `${wsBase}/`)
  url.searchParams.set("token", token)
  return url.toString()
}

export function parseAdminStallsWsMessage(
  data: string,
): PendingStallCreatedMessage | null {
  try {
    const parsed = JSON.parse(data) as PendingStallCreatedMessage
    if (
      parsed?.type === "pending_stall_created" &&
      parsed.stall &&
      typeof parsed.stall.id === "number"
    ) {
      return parsed
    }
  } catch {
    return null
  }
  return null
}
