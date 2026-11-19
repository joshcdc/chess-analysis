import type { Classification } from '../analysis/metrics'
import type { EvalResult } from '../engine/types'

export const CLASS_COLOR: Record<Classification, string> = {
  best: '#96bc4b',
  good: '#a9c98a',
  inaccuracy: '#f7c631',
  mistake: '#e58f2a',
  blunder: '#ca3431',
}

export function formatEval(r: EvalResult | undefined): string {
  if (!r) return '…'
  if (r.mate !== undefined) return r.mate === 0 ? '#' : `M${Math.abs(r.mate)}`
  return (r.cp / 100).toFixed(1)
}
