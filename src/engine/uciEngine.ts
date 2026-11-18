import type { Engine, EvalResult, Transport } from './types'
import { parseBestMove, parseInfo, type Info } from './uci'

export interface UciOptions {
  threads?: number
  hashMb?: number
}

/** Runs UCI searches one at a time over a Transport. */
export class UciEngine implements Engine {
  private listeners = new Set<(line: string) => void>()
  private queue: Promise<unknown> = Promise.resolve()
  private ready: Promise<void>
  private transport: Transport

  constructor(transport: Transport, opts: UciOptions = {}) {
    this.transport = transport
    transport.onLine((line) => this.listeners.forEach((fn) => fn(line)))
    this.ready = this.init(opts)
  }

  private waitFor(match: (line: string) => boolean): Promise<string> {
    return new Promise((resolve) => {
      const fn = (line: string) => {
        if (!match(line)) return
        this.listeners.delete(fn)
        resolve(line)
      }
      this.listeners.add(fn)
    })
  }

  private async init({ threads, hashMb }: UciOptions) {
    // Register each listener before sending: replies may arrive synchronously.
    const uciok = this.waitFor((l) => l === 'uciok')
    this.transport.send('uci')
    await uciok
    if (threads) this.transport.send(`setoption name Threads value ${threads}`)
    if (hashMb) this.transport.send(`setoption name Hash value ${hashMb}`)
    const readyok = this.waitFor((l) => l === 'readyok')
    this.transport.send('isready')
    await readyok
  }

  analyze(fen: string, depth: number, signal?: AbortSignal): Promise<EvalResult> {
    const run = async (): Promise<EvalResult> => {
      await this.ready
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

      const turn = (fen.split(' ')[1] ?? 'w') as 'w' | 'b'
      let last: Info | null = null
      const onInfo = (line: string) => {
        const info = parseInfo(line, turn)
        if (info) last = info
      }
      const onAbort = () => this.transport.send('stop')

      this.listeners.add(onInfo)
      signal?.addEventListener('abort', onAbort)
      try {
        const done = this.waitFor((l) => l.startsWith('bestmove'))
        this.transport.send(`position fen ${fen}`)
        this.transport.send(`go depth ${depth}`)
        const line = await done
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

        const best = parseBestMove(line) ?? ''
        const info = last as Info | null
        return {
          cp: info?.cp ?? 0,
          mate: info?.mate,
          best,
          pv: info?.pv ?? [],
          depth: info?.depth ?? 0,
        }
      } finally {
        this.listeners.delete(onInfo)
        signal?.removeEventListener('abort', onAbort)
      }
    }
    const result = this.queue.then(run)
    this.queue = result.catch(() => undefined)
    return result
  }

  dispose() {
    this.transport.close()
  }
}
