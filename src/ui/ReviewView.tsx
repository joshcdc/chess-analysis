import { useEffect, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import type { Game } from '../chesscom/client'
import { EvalBar } from './EvalBar'
import { EvalGraph } from './EvalGraph'
import { CLASS_COLOR } from './format'
import { MoveList } from './MoveList'
import { REVIEW_DEPTH, useReview } from './useReview'

export function ReviewView({
  game,
  username,
  onBack,
}: {
  game: Game
  username: string
  onBack: () => void
}) {
  const { fens, sans, results, review, done, total, error } = useReview(game.pgn)
  const [ply, setPly] = useState(0)
  const last = Math.max(0, fens.length - 1)

  const iAmBlack = game.black.username.toLowerCase() === username.toLowerCase()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setPly((p) => Math.max(0, p - 1))
      else if (e.key === 'ArrowRight') setPly((p) => Math.min(last, p + 1))
      else if (e.key === 'Home') setPly(0)
      else if (e.key === 'End') setPly(last)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [last])

  const result = results[ply]
  const best = result?.best
  const arrows =
    best && best.length >= 4
      ? [{ startSquare: best.slice(0, 2), endSquare: best.slice(2, 4), color: '#4a90d9cc' }]
      : []

  const played = ply > 0 ? review.moves.find((m) => m.ply === ply) : undefined
  const squareStyles: Record<string, React.CSSProperties> = {}
  if (played) {
    const tint = { background: `${CLASS_COLOR[played.classification]}66` }
    squareStyles[played.uci.slice(0, 2)] = tint
    squareStyles[played.uci.slice(2, 4)] = tint
  }

  const finished = done >= total && total > 0
  const you = iAmBlack ? game.black : game.white
  const opp = iAmBlack ? game.white : game.black
  const acc = (c: 'w' | 'b') => review.accuracy[c].toFixed(1)

  return (
    <section className="review">
      <button onClick={onBack}>← Games</button>
      {error && <p className="error">{error}</p>}

      <div className="review-main">
        <EvalBar result={result} flipped={iAmBlack} />
        <div className="boardwrap">
          <div className="player">
            {opp.username} ({opp.rating})
            {finished && <b> · {acc(iAmBlack ? 'w' : 'b')}%</b>}
          </div>
          <Chessboard
            options={{
              position: fens[ply] ?? 'start',
              boardOrientation: iAmBlack ? 'black' : 'white',
              allowDragging: false,
              arrows,
              squareStyles,
              animationDurationInMs: 120,
            }}
          />
          <div className="player">
            {you.username} ({you.rating})
            {finished && <b> · {acc(iAmBlack ? 'b' : 'w')}%</b>}
          </div>
        </div>

        <aside className="side">
          {!finished && !error && (
            <label className="progress">
              Analyzing depth {REVIEW_DEPTH}… {done}/{total}
              <progress value={done} max={total} />
            </label>
          )}
          <EvalGraph results={results} total={total} ply={ply} onSelect={setPly} />
          <MoveList sans={sans} moves={review.moves} ply={ply} onSelect={setPly} />
          <div className="nav">
            <button onClick={() => setPly(0)} aria-label="Start">⏮</button>
            <button onClick={() => setPly((p) => Math.max(0, p - 1))} aria-label="Previous">◀</button>
            <button onClick={() => setPly((p) => Math.min(last, p + 1))} aria-label="Next">▶</button>
            <button onClick={() => setPly(last)} aria-label="End">⏭</button>
          </div>
        </aside>
      </div>
    </section>
  )
}

