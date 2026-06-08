import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

/** GitHub project site: https://<user>.github.io/Agile-SMU-Final-Project/ */
const GITHUB_PAGES_BASE = "/Agile-SMU-Final-Project/"

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Local dev: /. GitHub Pages CI: set VITE_BASE_PATH or use default repo path in production.
  base:
    process.env.VITE_BASE_PATH ??
    (mode === "production" ? GITHUB_PAGES_BASE : "/"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}))
