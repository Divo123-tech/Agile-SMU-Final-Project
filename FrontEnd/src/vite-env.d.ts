/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API gateway base URL (no trailing slash). */
  readonly VITE_API_URL: string
  /** Asset base path for GitHub Pages (optional; Vite sets import.meta.env.BASE_URL). */
  readonly VITE_BASE_PATH?: string
  /** Legacy — optional if VITE_API_URL is set. */
  readonly VITE_DISHES_URL?: string
  readonly VITE_ACCOUNTS_URL?: string
  readonly VITE_STALLS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
