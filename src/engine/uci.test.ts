import { describe, expect, it } from 'vitest'
import { parseBestMove, parseInfo } from './uci'

describe('parseInfo', () => {
  const line = 'info depth 12 seldepth 18 multipv 1 score cp 34 nodes 1000 pv e2e4 e7e5'
  it('keeps White-to-move scores as-is', () => {
    expect(parseInfo(line, 'w')).toEqual({ depth: 12, cp: 34, pv: ['e2e4', 'e7e5'] })
  })
  it('flips scores when Black is to move', () => {
    expect(parseInfo(line, 'b')?.cp).toBe(-34)
  })
  it('maps mates to a large cp with White-perspective sign', () => {
    const m = parseInfo('info depth 5 score mate 3 pv a2a4', 'b')
    expect(m?.cp).toBe(-10000)
    expect(m?.mate).toBe(-3)
  })
  it('ignores bound scores, secondary PVs and non-info lines', () => {
    expect(parseInfo('info depth 9 score cp 10 lowerbound pv a2a4', 'w')).toBeNull()
    expect(parseInfo('info depth 9 multipv 2 score cp 10 pv a2a4', 'w')).toBeNull()
    expect(parseInfo('readyok', 'w')).toBeNull()
  })
})

describe('parseBestMove', () => {
  it('parses moves and (none)', () => {
    expect(parseBestMove('bestmove e2e4 ponder e7e5')).toBe('e2e4')
    expect(parseBestMove('bestmove (none)')).toBe('')
    expect(parseBestMove('info depth 1')).toBeNull()
  })
})
