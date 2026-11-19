import { winPercent } from '../analysis/metrics'
import type { EvalResult } from '../engine/types'

const W = 300
const H = 64

/** Win-probability graph over the game. Click to jump to a position. */
export function EvalGraph({
  results,
  total,
  ply,
  onSelect,
}: {
  results: (EvalResult | undefined)[]
  total: number
  ply: number
  onSelect: (ply: number) => void
}) {
  const last = Math.max(1, total - 1)
  const x = (i: number) => (i / last) * W
  const y = (i: number) => H - (winPercent((results[i] as EvalResult).cp) / 100) * H

  const pts: string[] = []
  for (let i = 0; i < total; i++) if (results[i]) pts.push(`${x(i)},${y(i)}`)
  const lastDone = results.length ? results.findLastIndex(Boolean) : -1
  const area =
    pts.length > 0 ? `M0,${H} L${pts.join(' L')} L${x(lastDone)},${H} Z` : ''

  return (
    <svg
      className="evalgraph"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      onClick={(e) => {
        const box = e.currentTarget.getBoundingClientRect()
        const frac = (e.clientX - box.left) / box.width
        onSelect(Math.round(frac * last))
      }}
    >
      <rect width={W} height={H} className="evalgraph-bg" />
      <line x1="0" x2={W} y1={H / 2} y2={H / 2} className="evalgraph-mid" />
      {area && <path d={area} className="evalgraph-area" />}
      <line x1={x(ply)} x2={x(ply)} y1="0" y2={H} className="evalgraph-cursor" />
    </svg>
  )
}
