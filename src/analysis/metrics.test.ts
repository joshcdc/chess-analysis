import { describe, expect, it } from 'vitest'
import {
  classify,
  gameAccuracy,
  moveAccuracy,
  winPercent,
  winPercentLoss,
} from './metrics'

describe('winPercent', () => {
  it('is 50 at equality and symmetric', () => {
    expect(winPercent(0)).toBeCloseTo(50)
    expect(winPercent(300) + winPercent(-300)).toBeCloseTo(100)
  })
  it('matches the Lichess curve (+100cp ~ 59%)', () => {
    expect(winPercent(100)).toBeCloseTo(59.1, 0)
  })
})

describe('winPercentLoss', () => {
  it('is measured from the mover perspective', () => {
    expect(winPercentLoss(0, -300, 'w')).toBeGreaterThan(20)
    expect(winPercentLoss(0, 300, 'b')).toBeGreaterThan(20)
  })
  it('never goes negative', () => {
    expect(winPercentLoss(0, 300, 'w')).toBe(0)
  })
})

describe('classify', () => {
  it('uses thresholds 20/10/5', () => {
    expect(classify(25)).toBe('blunder')
    expect(classify(12)).toBe('mistake')
    expect(classify(6)).toBe('inaccuracy')
    expect(classify(0)).toBe('best')
  })
})

describe('accuracy', () => {
  it('is ~100 for no loss and drops with loss', () => {
    expect(moveAccuracy(0)).toBeCloseTo(100, 2)
    expect(moveAccuracy(30)).toBeLessThan(moveAccuracy(5))
  })
  it('averages per side', () => {
    expect(gameAccuracy([])).toBe(100)
    expect(gameAccuracy([0, 0])).toBeCloseTo(100, 2)
  })
})
