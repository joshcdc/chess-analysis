import { describe, expect, it } from 'vitest'
import { filterByClass, outcomeFor, parseGames, type Game } from './client'

const p = (username: string, result: string) => ({ username, rating: 1200, result })
const raw = (over: object) => ({
  url: 'https://www.chess.com/game/live/1',
  pgn: '1. e4 e5',
  time_control: '600',
  time_class: 'rapid' as const,
  rules: 'chess',
  end_time: 100,
  white: p('Me', 'win'),
  black: p('Opp', 'resigned'),
  ...over,
})

describe('parseGames', () => {
  it('drops variants, daily and pgn-less games, and sorts newest first', () => {
    const games = parseGames([
      raw({ end_time: 1, url: 'https://x/live/1' }),
      raw({ end_time: 3, url: 'https://x/live/3' }),
      raw({ rules: 'chess960' }),
      raw({ time_class: 'daily' }),
      raw({ pgn: undefined }),
    ])
    expect(games.map((g) => g.id)).toEqual(['3', '1'])
  })
})

describe('filterByClass', () => {
  it('keeps only allowed time classes', () => {
    const games = parseGames([raw({}), raw({ time_class: 'blitz' })])
    expect(filterByClass(games, new Set(['blitz']))).toHaveLength(1)
  })
})

describe('outcomeFor', () => {
  const game = parseGames([raw({})])[0] as Game
  it('is case-insensitive and perspective-aware', () => {
    expect(outcomeFor(game, 'me')).toBe('win')
    expect(outcomeFor(game, 'opp')).toBe('loss')
  })
  it('treats stalemate/agreed as draw', () => {
    const d = parseGames([raw({ white: p('Me', 'stalemate') })])[0] as Game
    expect(outcomeFor(d, 'Me')).toBe('draw')
  })
})
