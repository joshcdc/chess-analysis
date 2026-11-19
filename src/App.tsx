import { useState } from 'react'
import './App.css'
import {
  fetchArchives,
  fetchMonth,
  filterByClass,
  outcomeFor,
  type Game,
  type TimeClass,
} from './chesscom/client'
import { ReviewView } from './ui/ReviewView'

const CLASSES: TimeClass[] = ['rapid', 'blitz', 'bullet']
const PAGE_TARGET = 20

function loadUsername(): string {
  try {
    return localStorage.getItem('username') ?? ''
  } catch {
    return ''
  }
}

export default function App() {
  const [input, setInput] = useState(loadUsername)
  const [username, setUsername] = useState('')
  const [archives, setArchives] = useState<string[]>([])
  const [nextArchive, setNextArchive] = useState(0)
  const [games, setGames] = useState<Game[]>([])
  const [allowed, setAllowed] = useState<Set<TimeClass>>(new Set(CLASSES))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Game | null>(null)
  const [shown, setShown] = useState(PAGE_TARGET)

  /** Fetch months (newest first) until we have enough visible games. */
  async function loadMore(urls: string[], start: number, current: Game[]) {
    setLoading(true)
    setError('')
    try {
      let i = start
      let all = current
      let added = 0
      const skipped: string[] = []
      while (i < urls.length && added < PAGE_TARGET) {
        const url = urls[i] as string
        try {
          const month = await fetchMonth(url)
          all = [...all, ...month]
          added += month.length
        } catch {
          // chess.com sometimes errors on very large months; skip it, keep going.
          skipped.push(url.split('/').slice(-2).join('/'))
        }
        i++
      }
      setGames(all)
      setNextArchive(i)
      if (skipped.length) setError(`Couldn't load ${skipped.join(', ')} from chess.com (skipped).`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const name = input.trim()
    if (!name) return
    try {
      localStorage.setItem('username', name)
    } catch {
      /* storage unavailable; fine */
    }
    setUsername(name)
    setGames([])
    setShown(PAGE_TARGET)
    setSelected(null)
    setLoading(true)
    setError('')
    try {
      const urls = await fetchArchives(name)
      setArchives(urls)
      await loadMore(urls, 0, [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  function toggle(c: TimeClass) {
    const next = new Set(allowed)
    if (next.has(c)) next.delete(c)
    else next.add(c)
    setAllowed(next)
  }

  const visible = filterByClass(games, allowed)

  if (selected) {
    return (
      <main className="app wide">
        <ReviewView key={selected.id} game={selected} username={username} onBack={() => setSelected(null)} />
      </main>
    )
  }

  return (
    <main className="app">
      <h1>Chess Analysis</h1>
      <form onSubmit={submit} className="row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="chess.com username"
          aria-label="chess.com username"
        />
        <button disabled={loading}>Load games</button>
      </form>

      {error && <p className="error">{error}</p>}

      {username && (
        <div className="row filters">
          {CLASSES.map((c) => (
            <label key={c}>
              <input
                type="checkbox"
                checked={allowed.has(c)}
                onChange={() => toggle(c)}
              />
              {c}
            </label>
          ))}
        </div>
      )}

      <ul className="games">
        {visible.slice(0, shown).map((g) => {
          const out = outcomeFor(g, username)
          const opp =
            g.white.username.toLowerCase() === username.toLowerCase()
              ? g.black
              : g.white
          return (
            <li key={g.id}>
              <button
                className={`game ${out}`}
                onClick={() => setSelected(g)}
              >
                <span className="out">{out}</span>
                <span>
                  vs {opp.username} ({opp.rating})
                </span>
                <span className="meta">
                  {g.timeClass} · {new Date(g.endTime * 1000).toLocaleDateString()}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {loading && <p>Loading…</p>}
      {!loading && username && (visible.length > shown || nextArchive < archives.length) && (
        <button
          onClick={() => {
            if (visible.length > shown) setShown(shown + PAGE_TARGET)
            else loadMore(archives, nextArchive, games)
          }}
        >
          Load more
        </button>
      )}
      {!loading && username && visible.length === 0 && !error && (
        <p>No games match.</p>
      )}

    </main>
  )
}
