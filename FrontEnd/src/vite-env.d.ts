/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DISHES_URL: string
  readonly VITE_ACCOUNTS_URL: string
  readonly VITE_STALLS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
