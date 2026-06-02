export const VALID_ALLERGENS = [
  "gluten",
  "dairy",
  "nuts",
  "eggs",
  "soy",
  "fish",
  "shellfish",
  "sesame",
] as const;

export type Allergen = (typeof VALID_ALLERGENS)[number];

export function normalizeAllergies(values: string[]): Allergen[] {
  const seen = new Set<Allergen>();
  const normalized: Allergen[] = [];

  for (const value of values) {
    if (!VALID_ALLERGENS.includes(value as Allergen)) {
      continue;
    }
    const allergen = value as Allergen;
    if (!seen.has(allergen)) {
      seen.add(allergen);
      normalized.push(allergen);
    }
  }

  return normalized;
}

export function allergiesEqual(a: string[], b: string[]): boolean {
  const left = normalizeAllergies(a);
  const right = normalizeAllergies(b);

  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}
