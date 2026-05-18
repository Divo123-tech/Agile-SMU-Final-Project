"use client"

import { cn } from "@/lib/utils"
import type { AllergenType } from "./allergen-badge"

interface AllergenFilterProps {
  selectedAllergens: AllergenType[]
  onToggle: (allergen: AllergenType) => void
}

const allergens: { type: AllergenType; label: string; icon: string }[] = [
  { type: "gluten", label: "Gluten", icon: "🌾" },
  { type: "dairy", label: "Dairy", icon: "🥛" },
  { type: "nuts", label: "Nuts", icon: "🥜" },
  { type: "eggs", label: "Eggs", icon: "🥚" },
  { type: "soy", label: "Soy", icon: "🫛" },
  { type: "fish", label: "Fish", icon: "🐟" },
  { type: "shellfish", label: "Shellfish", icon: "🦐" },
  { type: "sesame", label: "Sesame", icon: "⚪" },
]

export function AllergenFilter({ selectedAllergens, onToggle }: AllergenFilterProps) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-muted-foreground"
          aria-hidden="true"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        <span className="text-sm font-medium text-foreground">
          Hide dishes containing:
        </span>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by allergens">
        {allergens.map((allergen) => {
          const isSelected = selectedAllergens.includes(allergen.type)
          return (
            <button
              key={allergen.type}
              onClick={() => onToggle(allergen.type)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isSelected
                  ? "bg-destructive text-destructive-foreground border-destructive"
                  : "bg-card text-muted-foreground border-border hover:border-foreground/30"
              )}
              aria-pressed={isSelected}
            >
              <span className="text-[10px]" aria-hidden="true">{allergen.icon}</span>
              {allergen.label}
              {isSelected && (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              )}
            </button>
          )
        })}
      </div>
      {selectedAllergens.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Hiding {selectedAllergens.length} allergen{selectedAllergens.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
