export interface EvalResult {
  /** Centipawns from White's perspective. Mates are mapped to +/-MATE_CP. */
  cp: number
  /** Moves to mate if the position is a forced mate (White perspective sign). */
  mate?: number
  /** Best move in UCI notation (e.g. "e2e4"), empty if the game is over. */
  best: string
  /** Principal variation in UCI notation. */
  pv: string[]
  depth: number
}

export interface Engine {
  analyze(fen: string, depth: number, signal?: AbortSignal): Promise<EvalResult>
  dispose(): void
}

/** A duplex line channel to a UCI engine (Worker in the browser, Node API in tests). */
export interface Transport {
  send(command: string): void
  onLine(callback: (line: string) => void): void
  close(): void
}

export const MATE_CP = 10000
