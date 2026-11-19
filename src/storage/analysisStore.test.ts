import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import type { EvalResult } from '../engine/types'
import { createIdbStore } from './analysisStore'

const result = (cp: number): EvalResult => ({ cp, best: 'e2e4', pv: ['e2e4'], depth: 16 })

describe('IndexedDB analysis store', () => {
  it('returns undefined on a miss', async () => {
    const store = createIdbStore('t-miss')
    expect(await store.get('g1', 16)).toBeUndefined()
  })

  it('round-trips results, keyed by game and depth', async () => {
    const store = createIdbStore('t-roundtrip')
    await store.put('g1', 16, [result(10), result(-20)])
    expect(await store.get('g1', 16)).toEqual([result(10), result(-20)])
    expect(await store.get('g1', 20)).toBeUndefined()
    expect(await store.get('g2', 16)).toBeUndefined()
  })

  it('overwrites an existing entry', async () => {
    const store = createIdbStore('t-overwrite')
    await store.put('g1', 16, [result(1)])
    await store.put('g1', 16, [result(2)])
    expect(await store.get('g1', 16)).toEqual([result(2)])
  })
})
