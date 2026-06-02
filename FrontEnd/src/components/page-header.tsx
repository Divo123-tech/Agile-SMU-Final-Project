import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { UserMenu } from "@/components/user-menu"

type PageHeaderProps = {
  title: string
  backTo: string
  backLabel: string
  trailing?: React.ReactNode
}

export function PageHeader({ title, backTo, backLabel, trailing }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
        <Link
          to={backTo}
          className="-ml-2 shrink-0 rounded-lg p-2 transition-colors hover:bg-muted"
          aria-label={backLabel}
        >
          <ArrowLeft className="size-5 text-foreground" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate font-serif text-xl font-medium text-foreground">
          {title}
        </h1>
        {trailing}
        <UserMenu />
      </div>
    </header>
  )
}
