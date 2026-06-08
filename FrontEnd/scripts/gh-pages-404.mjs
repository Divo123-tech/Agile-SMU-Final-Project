/**
 * GitHub Pages serves 404.html for unknown paths (SPA client routing).
 * Copy index.html so /login, /stall/1, etc. load the app.
 */
import { copyFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const distDir = join(import.meta.dirname, "..", "dist")
const index = join(distDir, "index.html")

if (!existsSync(index)) {
  console.error("gh-pages-404: dist/index.html not found — run vite build first")
  process.exit(1)
}

copyFileSync(index, join(distDir, "404.html"))
console.log("gh-pages-404: copied index.html → 404.html")
