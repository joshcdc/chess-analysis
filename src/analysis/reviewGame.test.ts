import { describe, expect, it } from 'vitest'
import type { Engine, EvalResult } from '../engine/types'
import { replayPgn, reviewGame } from './reviewGame'

/** Fake engine: scripted White-perspective evals, one per call. */
function scripted(cps: number[]): Engine {
  let i = 0
  return {
    analyze: async (): Promise<EvalResult> => ({
      cp: cps[i++] ?? 0,
      best: 'e2e4',
      pv: [],
      depth: 10,
    }),
    dispose: () => {},
  }
}

describe('replayPgn', () => {
  it('returns start position plus one per move', () => {
    const { verbose, positions } = replayPgn('1. e4 e5 2. Nf3 *')
    expect(verbose).toHaveLength(3)
    expect(positions).toHaveLength(4)
  })
  it('marks a checkmate as terminal in favour of the winner', () => {
    const { positions } = replayPgn('1. f3 e5 2. g4 Qh4# 0-1')
    const last = positions[positions.length - 1]
    expect(last?.terminal?.cp).toBe(-10000) // Black mated White
  })
})

describe('reviewGame', () => {
  it('classifies a White blunder and reports per-side accuracy', async () => {
    // 3 positions: start 0, after 1.e4 +30, after 1...e5 -400 (Black blundered? no: eval drop for White)
    const review = await reviewGame('1. e4 e5 *', scripted([0, 30, 400]), 10)
    expect(review.moves).toHaveLength(2)
    expect(review.moves[0]?.classification).toBe('best') // 0 -> +30 is fine for White
    expect(review.moves[1]?.classification).toBe('blunder') // +30 -> +400 hurts Black
    expect(review.accuracy.b).toBeLessThan(review.accuracy.w)
  })

  it('reports progress and skips the engine for terminal positions', async () => {
    let calls = 0
    const engine: Engine = {
      analyze: async () => {
        calls++
        return { cp: 0, best: '', pv: [], depth: 1 }
      },
      dispose: () => {},
    }
    const seen: number[] = []
    await reviewGame('1. f3 e5 2. g4 Qh4# 0-1', engine, 5, {
      onProgress: (done) => seen.push(done),
    })
    expect(calls).toBe(4) // 5 positions, last is checkmate
    expect(seen).toEqual([1, 2, 3, 4, 5])
  })

  it('stops when aborted', async () => {
    const ctl = new AbortController()
    ctl.abort()
    await expect(reviewGame('1. e4 e5 *', scripted([]), 5, { signal: ctl.signal })).rejects.toThrow()
  })
})
