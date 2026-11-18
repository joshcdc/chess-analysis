import type { Engine, Transport } from './types'
import { UciEngine } from './uciEngine'

// Files are copied from node_modules/stockfish/bin into public/engine by
// scripts/copy-engine.mjs.
const FULL_THREADED = 'stockfish-19.js' // ~94MB NNUE, needs cross-origin isolation
const LITE_SINGLE = 'stockfish-19-lite-single.js' // ~1.7MB, works anywhere

function workerTransport(file: string): Transport {
  const worker = new Worker(`${import.meta.env.BASE_URL}engine/${file}`)
  return {
    send: (cmd) => worker.postMessage(cmd),
    onLine: (cb) => {
      worker.onmessage = (ev) => {
        if (typeof ev.data === 'string') cb(ev.data)
      }
    },
    close: () => worker.terminate(),
  }
}

/** Full multi-threaded engine when the page is cross-origin isolated, else lite. */
export function createBrowserEngine(): Engine {
  if (self.crossOriginIsolated) {
    const threads = Math.max(1, Math.min((navigator.hardwareConcurrency || 2) - 1, 8))
    return new UciEngine(workerTransport(FULL_THREADED), { threads, hashMb: 256 })
  }
  return new UciEngine(workerTransport(LITE_SINGLE), { hashMb: 64 })
}
