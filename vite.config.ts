import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// COOP/COEP enable SharedArrayBuffer, needed by multi-threaded Stockfish WASM.
const isolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { headers: isolation },
  preview: { headers: isolation },
})
