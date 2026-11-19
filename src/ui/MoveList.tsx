import { useEffect, useRef } from 'react'
import type { MoveReview } from '../analysis/reviewGame'
import { CLASS_COLOR } from './format'

/** Two-column move list (White / Black) with a colored dot for each reviewed move. */
export function MoveList({
  sans,
  moves,
  ply,
  onSelect,
}: {
  sans: string[]
  moves: MoveReview[]
  ply: number
  onSelect: (ply: number) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    box.current?.querySelector('.move.sel')?.scrollIntoView({ block: 'nearest' })
  }, [ply])
  const byPly = new Map(moves.map((m) => [m.ply, m]))
  const cell = (p: number) => {
    const san = sans[p - 1]
    if (san === undefined) return <span />
    const m = byPly.get(p)
    return (
      <button
        className={`move${ply === p ? ' sel' : ''}`}
        onClick={() => onSelect(p)}
        title={m ? `${m.classification} (−${m.loss.toFixed(1)}% win chance)` : 'analyzing…'}
      >
        <i
          className="dot"
          style={{ background: m ? CLASS_COLOR[m.classification] : 'transparent' }}
        />
        {san}
      </button>
    )
  }

  const rows = Math.ceil(sans.length / 2)
  return (
    <div className="movelist" ref={box}>
      {Array.from({ length: rows }, (_, i) => (
        <div className="moverow" key={i}>
          <span className="movenum">{i + 1}.</span>
          {cell(2 * i + 1)}
          {cell(2 * i + 2)}
        </div>
      ))}
    </div>
  )
}
