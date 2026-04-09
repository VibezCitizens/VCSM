# Reviews Engine — Scope Rules

## Working Directory

All work in this engine is scoped to:

```
/Users/vcsm/Desktop/VCSM/engines/reviews/
```

## Strict Scope Rules

- NEVER import from `apps/VCSM/` or `apps/wentrex/`
- NEVER import from other engines (`engines/identity/`, `engines/chat/`, `engines/hydration/`)
- NEVER import from `shared/`
- NEVER query schemas other than `reviews.*`
- NEVER add app-specific logic — use dependency injection

## What This Engine Owns

- Review lifecycle (create, update, soft-delete)
- Dimension resolution and rating management
- Aggregate stats retrieval
- Author card enrichment (via RPC)
- Revision history reads

## Database Schema

- `reviews.review_dimensions`
- `reviews.reviews`
- `reviews.review_dimension_ratings`
- `reviews.review_revisions`

## Dependency Injection

- `supabaseClient` — required
- `isActorOwner(actorId)` — required, app-injected ownership check
- `resolveActorCard(actorId)` — optional, app-injected actor enrichment
- `debugReporter` — optional

## Internal Architecture

```
src/
├── config.js           # DI configuration
├── events.js           # Domain events
├── types/index.js      # JSDoc typedefs
├── adapters/index.js   # PUBLIC API (only public surface)
├── controller/         # Orchestration layer
├── dal/                # Database queries only
├── model/              # Pure row → domain transforms
└── services/           # Reusable domain logic
```

## Layer Rules

- **DAL:** Database queries only. No business logic. Explicit column selection.
- **Model:** Pure functions. Row → domain object. No side effects.
- **Controller:** Orchestration. Validates inputs, calls DAL/services, emits events.
- **Services:** Shared logic used by multiple controllers.
- **Adapters:** Re-exports only. No logic.

## What NOT to Build

- React hooks (app responsibility)
- UI components (app responsibility)
- Cross-schema queries (use DI or RPC)
- Moderation workflows (separate concern)
- File/media handling (separate concern)
