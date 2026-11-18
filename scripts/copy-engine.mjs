// Copies the Stockfish WASM builds we use into public/engine so Vite serves them.
// Skips files that are already up to date (the full engine is ~94MB).
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const from = join(root, 'node_modules', 'stockfish', 'bin')
const to = join(root, 'public', 'engine')

const files = [
  'stockfish-19.js',
  'stockfish-19.wasm',
  'stockfish-19-lite-single.js',
  'stockfish-19-lite-single.wasm',
]

mkdirSync(to, { recursive: true })
for (const f of files) {
  const src = join(from, f)
  const dest = join(to, f)
  if (!existsSync(src)) throw new Error(`Missing ${src}; run npm install`)
  if (existsSync(dest) && statSync(dest).size === statSync(src).size) continue
  copyFileSync(src, dest)
  console.log(`copied ${f}`)
}
