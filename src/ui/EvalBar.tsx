import { winPercent } from '../analysis/metrics'
import type { EvalResult } from '../engine/types'
import { formatEval } from './format'

/** Vertical bar: White's share of the win probability, flipped with the board. */
export function EvalBar({
  result,
  flipped,
}: {
  result: EvalResult | undefined
  flipped: boolean
}) {
  const white = result ? winPercent(result.cp) : 50
  // DOM order is [black, white]: 'column' puts White at the bottom (normal board).
  const whiteAtBottom = !flipped
  const cp = result?.cp ?? 0
  // Label sits at the end of whichever side is ahead.
  const labelAtBottom = (cp >= 0) === whiteAtBottom
  return (
    <div
      className="evalbar"
      role="img"
      aria-label={`Evaluation ${formatEval(result)}`}
      style={{ flexDirection: whiteAtBottom ? 'column' : 'column-reverse' }}
    >
      <div className="evalbar-black" style={{ flex: 100 - white }} />
      <div className="evalbar-white" style={{ flex: white }} />
      <span
        className={`evalbar-label ${cp >= 0 ? 'on-white' : 'on-black'}`}
        style={labelAtBottom ? { bottom: 2, top: 'auto' } : { top: 2, bottom: 'auto' }}
      >
        {formatEval(result)}
      </span>
    </div>
  )
}
