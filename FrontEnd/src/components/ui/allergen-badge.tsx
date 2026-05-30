import { cn } from "@/lib/utils"

export type AllergenType = 
  | "gluten" 
  | "dairy" 
  | "nuts" 
  | "eggs" 
  | "soy" 
  | "fish" 
  | "shellfish" 
  | "sesame"

interface AllergenBadgeProps {
  allergen: AllergenType
  className?: string
}

const allergenConfig: Record<AllergenType, { label: string; icon: string; bgClass: string; textClass: string }> = {
  gluten: { 
    label: "Gluten", 
    icon: "🌾",
    bgClass: "bg-amber-100",
    textClass: "text-amber-800"
  },
  dairy: { 
    label: "Dairy", 
    icon: "🥛",
    bgClass: "bg-blue-100",
    textClass: "text-blue-800"
  },
  nuts: { 
    label: "Nuts", 
    icon: "🥜",
    bgClass: "bg-orange-100",
    textClass: "text-orange-800"
  },
  eggs: { 
    label: "Eggs", 
    icon: "🥚",
    bgClass: "bg-yellow-100",
    textClass: "text-yellow-800"
  },
  soy: { 
    label: "Soy", 
    icon: "🫛",
    bgClass: "bg-green-100",
    textClass: "text-green-800"
  },
  fish: { 
    label: "Fish", 
    icon: "🐟",
    bgClass: "bg-sky-100",
    textClass: "text-sky-800"
  },
  shellfish: { 
    label: "Shellfish", 
    icon: "🦐",
    bgClass: "bg-red-100",
    textClass: "text-red-800"
  },
  sesame: { 
    label: "Sesame", 
    icon: "⚪",
    bgClass: "bg-stone-100",
    textClass: "text-stone-800"
  },
}

export function AllergenBadge({ allergen, className }: AllergenBadgeProps) {
  const config = allergenConfig[allergen]
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        config.bgClass,
        config.textClass,
        className
      )}
    >
      <span className="text-[10px]" aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  )
}
