import { MapPin } from "lucide-react"

interface MenuHeaderProps {
    stallName: string
    stallDescription?: string
    stallAddress?: string
    stallImage?: string
  }
  
  export function MenuHeader({ stallName, stallDescription, stallAddress, stallImage }: MenuHeaderProps) {
    return (
      <header className="relative">
        {/* Hero Image */}
        {stallImage && (
          <div 
            className="h-40 bg-cover bg-center"
            style={{ backgroundImage: `url(${stallImage})` }}
          >
            <div className="absolute inset-0 bg-linear-to-b from-foreground/20 to-foreground/60 h-40" />
          </div>
        )}
        
        {/* Stall Info */}
        <div className={`px-5 ${stallImage ? '-mt-12 relative z-10' : 'pt-6'}`}>
          <div className="bg-card rounded-xl p-5 shadow-lg border border-border/30">
            <h1 className="font-serif text-2xl font-bold text-foreground">
              {stallName}
            </h1>
            {stallAddress && (
              <div className="mt-3 flex items-start gap-2 pt-1">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <p className="text-sm text-muted-foreground">{stallAddress}</p>
              </div>
            )}
            {stallDescription && (
              <p className="mt-2 text-sm text-muted-foreground">
                {stallDescription}
              </p>
            )}
 
          </div>
        </div>
      </header>
    )
  }
  