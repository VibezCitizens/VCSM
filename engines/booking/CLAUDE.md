# Booking Engine

Shared booking domain engine for the VCSM workspace.

## Rules
- No React imports — this engine is framework-agnostic
- No app-specific imports — all dependencies are injected via `configureBookingEngine()`
- Call `configureBookingEngine({ supabaseClient, vportClient, notifyFn })` once at app startup before any component renders
- Import in VCSM via the `@booking` alias

## Structure
- `src/config.js` — dependency injection
- `src/events.js` — event name constants
- `src/types/index.js` — JSDoc domain types
- `src/dal/` — raw Supabase queries (grouped by domain)
- `src/model/` — pure row mappers (no side effects)
- `src/controller/` — business logic orchestration
- `src/adapters/index.js` — public API exports
