# Platform Service Layer (PSL)

## Purpose

The Platform Service Layer sits between apps and engines, providing stable service APIs that eliminate duplicated orchestration across the repository.

## Architecture Position

```
Apps (VCSM, Wentrex, Traffic)
  → platform/services/
    → engines/ (identity, hydration, chat, notifications)
      → DAL
        → Database
```

Platform services are a shared root. They never import from apps. Apps import from platform services instead of calling engines directly.

## Location

```
platform/services/
  index.js                  — barrel export (public API)
  identityService.js        — session/actor/context resolution
  actorService.js           — canonical actor bundle fetch + cache
  notificationService.js    — event publishing, inbox (stub)
  chatService.js            — conversations, messaging (stub)
```

## Import Rule

Platform services use relative paths to engines, not app-specific Vite aliases.

```js
// Correct — platform services
import { ... } from '../../engines/identity/index.js'

// Wrong — ties platform to app build config
import { ... } from '@identity'
```

## Service Status

| Service | Status | Engine Dependency |
|---------|--------|-------------------|
| identityService | Implemented | engines/identity, engines/hydration |
| actorService | Implemented | engines/hydration |
| notificationService | Stub | engines/notifications (future) |
| chatService | Stub | engines/chat (future) |

## identityService API

| Function | Purpose |
|----------|---------|
| `getPlatformContext({ appKey })` | Full session → app → account → actor resolution |
| `getActiveActor({ appKey })` | Active actor extraction |
| `getActorLinks({ appKey })` | All available actor links for current user |
| `switchActor({ appKey, actorLinkId })` | Switch active actor |
| `getUserAppState({ appKey })` | Context + hydrated actor summaries |

## actorService API

| Function | Purpose |
|----------|---------|
| `getActorBundle(actorId)` | Single actor with cache-aware fetch |
| `getActorBundles(actorIds)` | Batch fetch, only stale/missing actors hit network |
| `getActorBundleMap(actorIds)` | Keyed map `{ [actorId]: bundle }` |
| `getActorSummaries(actorIds)` | Raw rows + hydrate (for engine DI callbacks) |
| `getActorFromStore(actorId)` | Synchronous store read, no fetch |
| `isActorStale(actorId)` | Freshness check against 5min TTL |
| `invalidateActors(actorIds)` | Force-stale for cache busting |

## Rules

- Services never export DAL functions
- Services never import from apps
- Services consume engines through their public APIs only
- Services use relative paths to engines, not Vite aliases
- Stubs throw explicitly — no silent failures

## Migration Path

1. Add `@platform` alias to each app's vite.config.js
2. Migrate identity controller bootstrap to `identityService.getUserAppState()`
3. Migrate feed actor bundle reads to `actorService.getActorBundles()`
4. Wire chat engine DI to `actorService.getActorSummaries()`
5. Implement notificationService after legacy schema migration
6. Implement chatService as simplified facade over engine's 60+ exports
