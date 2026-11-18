export type TimeClass = 'bullet' | 'blitz' | 'rapid' | 'daily'

export interface Player {
  username: string
  rating: number
  result: string
}

export interface Game {
  id: string
  url: string
  pgn: string
  timeControl: string
  timeClass: TimeClass
  endTime: number // unix seconds
  white: Player
  black: Player
}

interface RawGame {
  url: string
  pgn?: string
  time_control: string
  time_class: TimeClass
  rules: string
  end_time: number
  white: Player
  black: Player
}

const API = 'https://api.chess.com/pub/player'

/** Standard chess only, and only games that carry a PGN. */
export function parseGames(raw: RawGame[]): Game[] {
  return raw
    .filter((g) => g.rules === 'chess' && g.pgn && g.time_class !== 'daily')
    .map((g) => ({
      id: g.url.split('/').pop() ?? g.url,
      url: g.url,
      pgn: g.pgn as string,
      timeControl: g.time_control,
      timeClass: g.time_class,
      endTime: g.end_time,
      white: g.white,
      black: g.black,
    }))
    .sort((a, b) => b.endTime - a.endTime)
}

export function filterByClass(games: Game[], allowed: Set<TimeClass>): Game[] {
  return games.filter((g) => allowed.has(g.timeClass))
}

/** Result from the given user's point of view. */
export function outcomeFor(game: Game, username: string): 'win' | 'loss' | 'draw' {
  const me =
    game.white.username.toLowerCase() === username.toLowerCase()
      ? game.white
      : game.black
  if (me.result === 'win') return 'win'
  return ['checkmated', 'resigned', 'timeout', 'abandoned'].includes(me.result)
    ? 'loss'
    : 'draw'
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (res.status === 404) throw new Error('Not found')
  if (!res.ok) throw new Error(`chess.com request failed (${res.status})`)
  return res.json() as Promise<T>
}

/** Monthly archive URLs, newest first. */
export async function fetchArchives(username: string): Promise<string[]> {
  try {
    const data = await getJson<{ archives: string[] }>(
      `${API}/${encodeURIComponent(username.toLowerCase())}/games/archives`,
    )
    return [...data.archives].reverse()
  } catch (e) {
    if (e instanceof Error && e.message === 'Not found')
      throw new Error(`No chess.com user named "${username}"`)
    throw e
  }
}

export async function fetchMonth(archiveUrl: string): Promise<Game[]> {
  const data = await getJson<{ games: RawGame[] }>(archiveUrl)
  return parseGames(data.games)
}
