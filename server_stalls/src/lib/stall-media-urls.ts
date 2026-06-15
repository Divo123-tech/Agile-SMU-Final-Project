export type StallMediaKind = "image" | "proof";

export function buildStallMediaPath(
  stallId: number,
  kind: StallMediaKind
): string {
  if (kind === "image") {
    return `/stalls/${stallId}/image`;
  }
  return `/stalls/${stallId}/proof-of-ownership`;
}

/** Stable gateway URL clients can open in a browser tab (redirects to a fresh presigned S3 URL). */
export function buildStallMediaClientUrl(
  stallId: number,
  kind: StallMediaKind
): string | null {
  const base = process.env.STALLS_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}${buildStallMediaPath(stallId, kind)}`;
}
