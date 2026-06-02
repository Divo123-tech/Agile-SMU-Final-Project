import type { AllergenType } from "@/components/ui/allergen-badge"

export const VALID_ALLERGEN_TYPES: AllergenType[] = [
  "gluten",
  "dairy",
  "nuts",
  "eggs",
  "soy",
  "fish",
  "shellfish",
  "sesame",
]

export function parseAllergenTypes(values: string[]): AllergenType[] {
  return values.filter((value): value is AllergenType =>
    VALID_ALLERGEN_TYPES.includes(value as AllergenType),
  )
}

export function allergenListsEqual(a: AllergenType[], b: AllergenType[]): boolean {
  if (a.length !== b.length) return false
  const left = [...a].sort()
  const right = [...b].sort()
  return left.every((value, index) => value === right[index])
}
