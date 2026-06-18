import { Link } from "react-router-dom"
import { MapPinOff } from "lucide-react"
import { APP_NAME } from "@/lib/app"
import { Button } from "@/components/ui/button"

interface StallNotFoundProps {
  stallId?: string
  statusCode?: number
}

export function StallNotFound({ stallId, statusCode }: StallNotFoundProps) {
  const isNotFound = statusCode === 404

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-muted">
          <MapPinOff className="size-8 text-muted-foreground" aria-hidden />
        </div>

        <h1 className="font-serif text-2xl font-bold text-foreground">
          {isNotFound ? "Stall not found" : "Couldn't load stall"}
        </h1>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {isNotFound ? (
            <>
              We couldn&apos;t find a stall
              {stallId ? (
                <>
                  {" "}
                  with ID <span className="font-mono text-foreground">{stallId}</span>
                </>
              ) : null}
              . It may have been removed or the link might be incorrect.
            </>
          ) : (
            <>
              Something went wrong while loading this menu. Please check your connection and try
              again.
            </>
          )}
        </p>

        <Button asChild className="mt-8 w-full">
          <Link to="/">Back to {APP_NAME}</Link>
        </Button>
      </div>
    </main>
  )
}
