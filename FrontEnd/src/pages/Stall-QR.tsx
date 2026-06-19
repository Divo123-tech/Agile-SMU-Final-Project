import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import QRCode from "qrcode"
import { Download } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { getStall } from "@/lib/api"
import { APP_NAME, getStallMenuPublicUrl } from "@/lib/app"
import { Button } from "@/components/ui/button"

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "stall"
}

async function drawQrCardPng(
  title: string,
  subtitle: string,
  qrDataUrl: string,
): Promise<string> {
  const width = 400
  const padding = 40
  const qrSize = 280
  const titleHeight = 28
  const subtitleHeight = 22
  const gap = 24
  const height =
    padding + titleHeight + gap + subtitleHeight + gap + qrSize + padding

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas not supported")

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = "#e5e7eb"
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1)

  let y = padding

  ctx.fillStyle = "#171717"
  ctx.font = "600 20px system-ui, -apple-system, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "top"
  ctx.fillText(title, width / 2, y)
  y += titleHeight + gap

  ctx.fillStyle = "#737373"
  ctx.font = "14px system-ui, -apple-system, sans-serif"
  ctx.fillText(subtitle, width / 2, y)
  y += subtitleHeight + gap

  const qrImage = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Failed to load QR image"))
    img.src = qrDataUrl
  })

  const qrX = (width - qrSize) / 2
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(qrX - 12, y - 12, qrSize + 24, qrSize + 24)
  ctx.strokeStyle = "#e5e7eb"
  ctx.strokeRect(qrX - 12.5, y - 12.5, qrSize + 25, qrSize + 25)
  ctx.drawImage(qrImage, qrX, y, qrSize, qrSize)

  return canvas.toDataURL("image/png")
}

export default function StallQRPage() {
  const { id } = useParams()
  const stallId = Number(id)
  const isValidStallId = Number.isInteger(stallId) && stallId > 0

  const [stallName, setStallName] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const menuUrl = useMemo(() => {
    if (!isValidStallId) return ""
    return getStallMenuPublicUrl(stallId)
  }, [isValidStallId, stallId])

  const cardTitle = stallName ?? `Stall ${stallId}`
  const cardSubtitle = `Scan to view this stall's menu on ${APP_NAME}`

  useEffect(() => {
    if (!isValidStallId) return

    let cancelled = false

    ;(async () => {
      try {
        const stall = await getStall(stallId)
        if (!cancelled) setStallName(stall.name)
      } catch {
        if (!cancelled) setStallName(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isValidStallId, stallId])

  useEffect(() => {
    if (!menuUrl) return

    let cancelled = false

    QRCode.toDataURL(menuUrl, { width: 280, margin: 2 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setError("Failed to generate QR code.")
      })

    return () => {
      cancelled = true
    }
  }, [menuUrl])

  const handleDownload = async () => {
    if (!qrDataUrl) return

    setIsDownloading(true)
    try {
      const pngDataUrl = await drawQrCardPng(cardTitle, cardSubtitle, qrDataUrl)
      const link = document.createElement("a")
      link.href = pngDataUrl
      link.download = `${sanitizeFilename(cardTitle)}-qr.png`
      link.click()
    } catch {
      setError("Failed to download QR image.")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Stall QR Code"
        backTo="/my-stalls"
        backLabel="Back to my stalls"
      />

      <main className="max-w-lg mx-auto px-4 py-8 space-y-4">
        {!isValidStallId ? (
          <p className="text-sm text-destructive text-center">Invalid stall id.</p>
        ) : error ? (
          <p className="text-sm text-destructive text-center">{error}</p>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card p-6 text-center space-y-4">
              <p className="font-medium text-foreground text-xl">{cardTitle}</p>
              <p className="text-sm text-muted-foreground">{cardSubtitle}</p>

              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${cardTitle} menu`}
                  className="mx-auto rounded-lg border border-border bg-white p-3"
                  width={280}
                  height={280}
                />
              ) : (
                <p className="text-sm text-muted-foreground py-16">Generating QR code…</p>
              )}
            </div>

            <div className="flex flex-col items-center gap-3">
              <Button
                type="button"
                className="min-w-44 rounded-xl"
                onClick={handleDownload}
                disabled={!qrDataUrl || isDownloading}
              >
                <Download className="w-5 h-5 mr-2" />
                {isDownloading ? "Downloading…" : "Download QR card"}
              </Button>
              <Button asChild variant="outline" className="min-w-44 rounded-xl">
                <Link to={`/stall/${stallId}`}>Preview menu</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
