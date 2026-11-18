// Lichess-style formulas. All evals are centipawns from White's perspective.

export type Classification =
  | 'best'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'

/** Win probability (0-100) for White from a centipawn eval. */
export function winPercent(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1)
}

/** Win% the mover lost by playing a move (>= 0). */
export function winPercentLoss(
  cpBefore: number,
  cpAfter: number,
  mover: 'w' | 'b',
): number {
  const before = winPercent(cpBefore)
  const after = winPercent(cpAfter)
  const loss = mover === 'w' ? before - after : after - before
  return Math.max(0, loss)
}

export function classify(loss: number): Classification {
  if (loss >= 20) return 'blunder'
  if (loss >= 10) return 'mistake'
  if (loss >= 5) return 'inaccuracy'
  if (loss >= 2) return 'good'
  return 'best'
}

/** Accuracy (0-100) of a single move from its win% loss. */
export function moveAccuracy(loss: number): number {
  const acc = 103.1668 * Math.exp(-0.04354 * loss) - 3.1669
  return Math.min(100, Math.max(0, acc))
}

/** Mean accuracy over a side's moves. */
export function gameAccuracy(losses: number[]): number {
  if (losses.length === 0) return 100
  return losses.reduce((s, l) => s + moveAccuracy(l), 0) / losses.length
}
