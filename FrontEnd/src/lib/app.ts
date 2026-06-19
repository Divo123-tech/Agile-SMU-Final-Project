export const APP_NAME = "HawkerAllergy QR"

export const APP_TAGLINE =
  "Scan hawker menus, filter allergens, and browse stalls safely."

/** Path prefix without trailing slash (empty locally; `/Agile-SMU-Final-Project` on GitHub Pages). */
export function getAppBasePath(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "")
}

/** Absolute public URL for a stall menu — includes GitHub Pages base path in production. */
export function getStallMenuPublicUrl(stallId: number): string {
  const base = getAppBasePath()
  return `${window.location.origin}${base}/stall/${stallId}`
}
