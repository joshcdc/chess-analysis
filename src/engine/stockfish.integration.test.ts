// Runs the real Stockfish (lite, single-threaded WASM) under Node through UciEngine.
import { createRequire } from 'node:module'
import { afterAll, describe, expect, it } from 'vitest'
import type { Transport } from './types'
import { UciEngine } from './uciEngine'

const require = createRequire(import.meta.url)

function nodeTransport(): Transport {
  let cb: (line: string) => void = () => {}
  const sf = require('stockfish')('lite-single', (line: string) => cb(line))
  return {
    send: (cmd) => sf.processCommand(cmd),
    onLine: (fn) => {
      cb = fn
    },
    close: () => sf.terminate(),
  }
}

describe('UciEngine + real Stockfish', () => {
  const engine = new UciEngine(nodeTransport(), { hashMb: 16 })
  afterAll(() => engine.dispose())

  it('finds mate in one and reports it from White perspective', async () => {
    // White to move, Qh5#-style: back-rank mate with Ra8#
    const r = await engine.analyze('6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1', 10)
    expect(r.best).toBe('a1a8')
    expect(r.mate).toBe(1)
    expect(r.cp).toBe(10000)
  }, 30000)

  it('flips the sign when Black is to move and winning', async () => {
    const r = await engine.analyze('r3k3/8/8/8/8/8/5PPP/6K1 b - - 0 1', 10)
    expect(r.best).toBe('a8a1')
    expect(r.cp).toBe(-10000)
  }, 30000)

  it('keeps the start position near equal', async () => {
    const r = await engine.analyze(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      10,
    )
    expect(Math.abs(r.cp)).toBeLessThan(80)
  }, 30000)
})
