import { MATE_CP } from './types'

export interface Info {
  depth: number
  cp: number
  mate?: number
  pv: string[]
}

/**
 * Parse a UCI `info` line. Returns null for lines we don't use
 * (no score, secondary PVs, or bound-only scores from aspiration windows).
 * Scores are converted from side-to-move to White's perspective.
 */
export function parseInfo(line: string, turn: 'w' | 'b'): Info | null {
  if (!line.startsWith('info ')) return null
  if (/\b(lowerbound|upperbound)\b/.test(line)) return null
  const multipv = /\bmultipv (\d+)/.exec(line)
  if (multipv && multipv[1] !== '1') return null

  const depth = /\bdepth (\d+)/.exec(line)
  const score = /\bscore (cp|mate) (-?\d+)/.exec(line)
  if (!depth || !score) return null

  const sign = turn === 'w' ? 1 : -1
  const value = Number(score[2])
  const pv = (/ pv (.+)$/.exec(line)?.[1] ?? '').split(' ').filter(Boolean)

  if (score[1] === 'mate') {
    return {
      depth: Number(depth[1]),
      cp: value === 0 ? 0 : sign * Math.sign(value) * MATE_CP,
      mate: sign * value,
      pv,
    }
  }
  return { depth: Number(depth[1]), cp: sign * value, pv }
}

/** Extract the move from a `bestmove` line; "" when the engine has none. */
export function parseBestMove(line: string): string | null {
  const m = /^bestmove (\S+)/.exec(line)
  if (!m) return null
  return m[1] === '(none)' ? '' : (m[1] as string)
}
