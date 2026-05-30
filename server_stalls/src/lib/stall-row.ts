/** Columns selected from stalls for API mapping. */
export const STALL_SELECT_COLUMNS =
  "id, name, owner, description, address, image_url, proof_of_ownership_url, updated_at";

export function stallUpdatedAtToIso(
  value: Date | string | null | undefined
): string | null {
  if (value == null) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}
