import { useEffect, useRef, useState } from "react"
import {
  getAdminStallsWebSocketUrl,
  parseAdminStallsWsMessage,
} from "@/lib/admin-stalls-ws"
import type { AdminStall } from "@/lib/api"

const RECONNECT_MS = 4000

type UseAdminStallRealtimeOptions = {
  enabled: boolean
  onPendingStall: (stall: AdminStall) => void
}

export function useAdminStallRealtime({
  enabled,
  onPendingStall,
}: UseAdminStallRealtimeOptions): boolean {
  const [connected, setConnected] = useState(false)
  const handlersRef = useRef({ onPendingStall })

  handlersRef.current = { onPendingStall }

  useEffect(() => {
    if (!enabled) {
      setConnected(false)
      return
    }

    let cancelled = false
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const scheduleReconnect = () => {
      if (cancelled) return
      reconnectTimer = setTimeout(connect, RECONNECT_MS)
    }

    const connect = () => {
      if (cancelled) return

      const url = getAdminStallsWebSocketUrl()
      if (!url) {
        scheduleReconnect()
        return
      }

      socket = new WebSocket(url)

      socket.onopen = () => {
        if (!cancelled) setConnected(true)
      }

      socket.onmessage = (event) => {
        const message = parseAdminStallsWsMessage(String(event.data))
        if (message) {
          handlersRef.current.onPendingStall(message.stall)
        }
      }

      socket.onclose = () => {
        if (!cancelled) setConnected(false)
        socket = null
        scheduleReconnect()
      }

      socket.onerror = () => {
        socket?.close()
      }
    }

    connect()

    return () => {
      cancelled = true
      setConnected(false)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [enabled])

  return connected
}
