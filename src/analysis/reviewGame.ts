import { Chess } from 'chess.js'
import { MATE_CP, type Engine, type EvalResult } from '../engine/types'
import {
  classify,
  gameAccuracy,
  winPercentLoss,
  type Classification,
} from './metrics'

export interface MoveReview {
  ply: number // 1-based
  color: 'w' | 'b'
  san: string
  uci: string
  fenBefore: string
  fenAfter: string
  evalBefore: number // cp, White perspective
  evalAfter: number
  bestMove: string // engine's best move in the position before this move (UCI)
  loss: number // win% lost by the mover
  classification: Classification
}

export interface GameReview {
  moves: MoveReview[]
  /** evals[i] is the eval of position i; evals[0] is the start, evals[n] the final position. */
  evals: number[]
  accuracy: { w: number; b: number }
}

export interface Position {
  fen: string
  /** Set when the game is over here, so the engine isn't needed. */
  terminal?: EvalResult
}

/** Replay a PGN into the list of moves and the position after each (plus the start). */
export function replayPgn(pgn: string) {
  const game = new Chess()
  game.loadPgn(pgn)
  const verbose = game.history({ verbose: true })
  const start = verbose[0]?.before ?? game.fen()
  const positions: Position[] = [{ fen: start }]
  for (const m of verbose) positions.push({ fen: m.after })

  // Mark terminal positions so we don't ask the engine about them.
  const last = positions[positions.length - 1] as Position
  const end = new Chess(last.fen)
  if (end.isCheckmate()) {
    // Side to move is mated, so the other side wins.
    const cp = end.turn() === 'w' ? -MATE_CP : MATE_CP
    last.terminal = { cp, mate: 0, best: '', pv: [], depth: 0 }
  } else if (end.isGameOver()) {
    last.terminal = { cp: 0, best: '', pv: [], depth: 0 }
  }
  return { verbose, positions }
}

export async function reviewGame(
  pgn: string,
  engine: Engine,
  depth: number,
  opts: {
    signal?: AbortSignal
    onProgress?: (done: number, total: number) => void
  } = {},
): Promise<GameReview> {
  const { verbose, positions } = replayPgn(pgn)
  const results: EvalResult[] = []

  for (const pos of positions) {
    if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    results.push(pos.terminal ?? (await engine.analyze(pos.fen, depth, opts.signal)))
    opts.onProgress?.(results.length, positions.length)
  }

  const evals = results.map((r) => r.cp)
  const moves: MoveReview[] = verbose.map((m, i) => {
    const evalBefore = evals[i] as number
    const evalAfter = evals[i + 1] as number
    const loss = winPercentLoss(evalBefore, evalAfter, m.color)
    return {
      ply: i + 1,
      color: m.color,
      san: m.san,
      uci: m.from + m.to + (m.promotion ?? ''),
      fenBefore: m.before,
      fenAfter: m.after,
      evalBefore,
      evalAfter,
      bestMove: (results[i] as EvalResult).best,
      loss,
      classification: classify(loss),
    }
  })

  const lossesFor = (c: 'w' | 'b') => moves.filter((m) => m.color === c).map((m) => m.loss)
  return {
    moves,
    evals,
    accuracy: { w: gameAccuracy(lossesFor('w')), b: gameAccuracy(lossesFor('b')) },
  }
}
