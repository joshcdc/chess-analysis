# Chess Analysis — Plan

Personal website: enter a chess.com username, list recent games, analyze one on demand with Stockfish, show a Game Review–style UI.

## Decisions
- **Audience:** personal tool; username is a UI input (not hardcoded).
- **Data:** chess.com public API (`/pub/player/<u>/games/archives` → monthly archives), called from the browser. No auth.
- **Game list:** last ~20 standard games; filter rapid/blitz/bullet; "load more" pulls older months; skip variants and daily.
- **Engine:** Stockfish WASM (multi-threaded NNUE, single-thread lite fallback) behind `Engine.analyze(fen, depth)`; native Stockfish via a local Node server can be swapped in later.
- **Depth:** fixed ~16–18; progress bar; browse moves as they finish; "deeper analysis" for one position.
- **Hosting:** localhost only. Vite dev server sets `COOP`/`COEP` headers for SharedArrayBuffer.
- **Stack:** Vite + React + TypeScript, `chess.js`, `react-chessboard`, Vitest.
- **Analysis math:** Lichess formulas — win% from centipawns, classification by win% loss (>=20 blunder, >=10 mistake, >=5 inaccuracy), Lichess accuracy formula. Labels Best→Blunder; Brilliant/Great deferred. Opening names included. No coaching text.
- **UI MVP:** move navigation, auto-flip to your color, eval bar, clickable eval graph, best-move arrows, move list with classification icons. No variation exploration.
- **Storage:** IndexedDB cache keyed by `gameId + depth`, behind a `Storage` interface so permanent storage (file/DB) can replace it later.
- **Verification:** unit tests for pure logic; manual comparison against chess.com Game Review on 2–3 games.

## Milestones
1. **Scaffold** — Vite/React/TS, git, deps, COOP/COEP headers, Vitest.
2. **Games** — chess.com client, archive fetching, game list UI + filters.
3. **Analysis core (pure, tested)** — win%, classification, accuracy.
4. **Engine** — Stockfish worker, `Engine` interface, sequential per-position analysis with progress.
5. **Review UI** — board, eval bar, eval graph, move list, arrows, navigation.
6. **Storage** — `Storage` interface + IndexedDB impl, cache analyses.
7. **Openings** — ECO lookup.
8. **Validate** — compare with chess.com, tune thresholds.

## Later
Permanent storage, native Stockfish backend, Brilliant/Great labels, variation exploration, coaching text.
