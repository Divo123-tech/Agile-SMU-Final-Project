import { cn } from "@/lib/utils"
import { type AllergenType } from "./ui/allergen-badge"
import { Check, X } from "lucide-react"

interface AllergenSelectorProps {
  selected: AllergenType[]
  onChange: (allergens: AllergenType[]) => void
}

const allergenOptions: { value: AllergenType; label: string; icon: string; bgClass: string; textClass: string; selectedBg: string }[] = [
  { value: "gluten", label: "Gluten", icon: "🌾", bgClass: "bg-amber-50 hover:bg-amber-100", textClass: "text-amber-800", selectedBg: "bg-amber-200 ring-2 ring-amber-400" },
  { value: "dairy", label: "Dairy", icon: "🥛", bgClass: "bg-blue-50 hover:bg-blue-100", textClass: "text-blue-800", selectedBg: "bg-blue-200 ring-2 ring-blue-400" },
  { value: "nuts", label: "Nuts", icon: "🥜", bgClass: "bg-orange-50 hover:bg-orange-100", textClass: "text-orange-800", selectedBg: "bg-orange-200 ring-2 ring-orange-400" },
  { value: "eggs", label: "Eggs", icon: "🥚", bgClass: "bg-yellow-50 hover:bg-yellow-100", textClass: "text-yellow-800", selectedBg: "bg-yellow-200 ring-2 ring-yellow-400" },
  { value: "soy", label: "Soy", icon: "🫛", bgClass: "bg-green-50 hover:bg-green-100", textClass: "text-green-800", selectedBg: "bg-green-200 ring-2 ring-green-400" },
  { value: "fish", label: "Fish", icon: "🐟", bgClass: "bg-sky-50 hover:bg-sky-100", textClass: "text-sky-800", selectedBg: "bg-sky-200 ring-2 ring-sky-400" },
  { value: "shellfish", label: "Shellfish", icon: "🦐", bgClass: "bg-red-50 hover:bg-red-100", textClass: "text-red-800", selectedBg: "bg-red-200 ring-2 ring-red-400" },
  { value: "sesame", label: "Sesame", icon: "⚪", bgClass: "bg-stone-50 hover:bg-stone-100", textClass: "text-stone-800", selectedBg: "bg-stone-200 ring-2 ring-stone-400" },
]

export function AllergenSelector({ selected, onChange }: AllergenSelectorProps) {
  const toggleAllergen = (allergen: AllergenType) => {
    if (selected.includes(allergen)) {
      onChange(selected.filter((a) => a !== allergen))
    } else {
      onChange([...selected, allergen])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {allergenOptions.map((option) => {
          const isSelected = selected.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleAllergen(option.value)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                option.textClass,
                isSelected ? option.selectedBg : option.bgClass
              )}
              aria-pressed={isSelected}
            >
              <span aria-hidden="true">{option.icon}</span>
              <span>{option.label}</span>
              {isSelected && (
                <Check className="w-4 h-4 ml-1" />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected allergens summary */}
      {selected.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            Selected allergens ({selected.length}):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((allergen) => {
              const option = allergenOptions.find((o) => o.value === allergen)!
              return (
                <span
                  key={allergen}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    option.textClass,
                    option.selectedBg.split(" ")[0]
                  )}
                >
                  <span aria-hidden="true">{option.icon}</span>
                  {option.label}
                  <button
                    type="button"
                    onClick={() => toggleAllergen(allergen)}
                    className="ml-0.5 rounded-full hover:bg-black/10 p-0.5"
                    aria-label={`Remove ${option.label}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
