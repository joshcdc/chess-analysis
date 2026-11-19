import { openDB, type DBSchema } from 'idb'
import type { EvalResult } from '../engine/types'

/**
 * Where finished analyses are kept. The UI only depends on this interface, so a
 * permanent store (file, SQLite, server) can replace IndexedDB later.
 */
export interface AnalysisStore {
  /** Engine results for every position of the game, if analyzed at this depth. */
  get(gameId: string, depth: number): Promise<EvalResult[] | undefined>
  put(gameId: string, depth: number, results: EvalResult[]): Promise<void>
}

interface Schema extends DBSchema {
  analyses: {
    key: string
    value: {
      gameId: string
      depth: number
      results: EvalResult[]
      savedAt: number
    }
  }
}

/** IndexedDB-backed store. Storage failures (private mode, quota) act as a cache miss. */
export function createIdbStore(dbName = 'chess-analysis'): AnalysisStore {
  const db = openDB<Schema>(dbName, 1, {
    upgrade: (d) => d.createObjectStore('analyses'),
  })
  const key = (gameId: string, depth: number) => `${gameId}:${depth}`

  return {
    async get(gameId, depth) {
      try {
        return (await (await db).get('analyses', key(gameId, depth)))?.results
      } catch {
        return undefined
      }
    },
    async put(gameId, depth, results) {
      try {
        await (await db).put(
          'analyses',
          { gameId, depth, results, savedAt: Date.now() },
          key(gameId, depth),
        )
      } catch {
        /* cache is best-effort */
      }
    },
  }
}

export const analysisStore: AnalysisStore = createIdbStore()
