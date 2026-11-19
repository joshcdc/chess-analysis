import { useEffect, useMemo, useState } from 'react'
import {
  computeReview,
  evaluatePositions,
  replayPgn,
  type GameReview,
} from '../analysis/reviewGame'
import { createBrowserEngine } from '../engine/browserEngine'
import type { Engine, EvalResult } from '../engine/types'
import { analysisStore } from '../storage/analysisStore'

export const REVIEW_DEPTH = 16

export interface ReviewState {
  fens: string[]
  sans: string[]
  results: (EvalResult | undefined)[]
  review: GameReview
  done: number
  total: number
  error: string
}

const EMPTY: GameReview = { moves: [], accuracy: { w: 100, b: 100 } }

/**
 * Replays the PGN and evaluates every position, streaming results as they finish.
 * A finished analysis is cached by game id and depth and reused next time.
 */
export function useReview(gameId: string, pgn: string, depth = REVIEW_DEPTH): ReviewState {
  const parsed = useMemo(() => {
    try {
      return { ...replayPgn(pgn), error: '' }
    } catch {
      return { verbose: [], positions: [], error: 'Could not read this game’s moves.' }
    }
  }, [pgn])

  const [results, setResults] = useState<(EvalResult | undefined)[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (parsed.positions.length === 0) return

    const ctl = new AbortController()
    let engine: Engine | undefined

    const run = async () => {
      const cached = await analysisStore.get(gameId, depth)
      if (ctl.signal.aborted) return
      if (cached && cached.length === parsed.positions.length) {
        setResults(cached)
        return
      }

      engine = createBrowserEngine()
      const all = await evaluatePositions(parsed.positions, engine, depth, {
        signal: ctl.signal,
        onEval: (i, r) =>
          setResults((prev) => {
            const next = [...prev]
            next[i] = r
            return next
          }),
      })
      await analysisStore.put(gameId, depth, all)
    }

    run().catch((e: unknown) => {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : 'Engine failed')
    })

    return () => {
      ctl.abort()
      engine?.dispose()
    }
  }, [gameId, parsed, depth])

  const review = useMemo(
    () => (parsed.verbose.length ? computeReview(parsed.verbose, results) : EMPTY),
    [parsed, results],
  )

  return {
    fens: parsed.positions.map((p) => p.fen),
    sans: parsed.verbose.map((m) => m.san),
    results,
    review,
    done: results.filter(Boolean).length,
    total: parsed.positions.length,
    error: parsed.error || error,
  }
}
