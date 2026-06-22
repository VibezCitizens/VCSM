# ARCHITECT — State Store Map
Generated: 2026-05-09

---

## VCSM — Zustand Stores

### actorStore.js
Path: apps/VCSM/src/state/actors/actorStore.js
Purpose: Actor directory cache — stores hydrated actor records keyed by actorId
Persistence: In-memory (TTL cache via shared/lib/ttlCache.js — 5min TTL)
Consumers: hydration engine adapter, feed, profiles, chat, notifications
Cross-feature: YES — consumed by nearly every feature that displays actor data
Flags: Central actor cache — corruption or staleness here propagates system-wide

### identitySelection.store.js
Path: apps/VCSM/src/state/identity/identitySelection.store.js
Purpose: Active actor selection — tracks which actor (user or vport) is currently active
Persistence: In-memory + likely localStorage for persistence across reloads
Consumers: identity feature, auth, dashboard, all actor-scoped features
Cross-feature: YES — identity selection affects every authenticated feature
Flags: CRITICAL — must only expose actorId + kind, never profileId/vportId

### profileGateStore.js
Path: apps/VCSM/src/state/actors/profileGateStore.js
Purpose: Gate state for profile completion check
Persistence: In-memory
Consumers: auth, onboarding
Cross-feature: LOW — scoped to auth/onboarding flow

### followRequestsStore.js
Path: apps/VCSM/src/state/social/followRequestsStore.js
Purpose: Follow request state cache
Persistence: In-memory
Consumers: social/friend/request feature, notifications
Cross-feature: LIMITED

### vportProfileUiStore.js
Path: apps/VCSM/src/state/vport/vportProfileUiStore.js
Purpose: Vport profile UI state (active tab, edit mode, etc.)
Persistence: In-memory
Consumers: profiles feature (vport kind)
Cross-feature: LOW

### chatUiStore.js
Path: apps/VCSM/src/features/chat/store/chatUiStore.js
Purpose: Chat UI state (active conversation, scroll position, typing indicators)
Persistence: In-memory
Consumers: chat feature
Cross-feature: LOW

### bootstrap.store.js
Path: apps/VCSM/src/bootstrap/bootstrap.store.js
Purpose: Bootstrap hydration state — tracks whether platform bootstrap is complete
Persistence: In-memory
Consumers: bootstrap controller, identity, auth gate
Cross-feature: YES — gates all authenticated routes

### loginDebug.store.js
Path: apps/VCSM/src/features/debug/loginDebug.store.js
Purpose: Debug state for login/auth debugging
Persistence: In-memory (dev only)
Consumers: debug feature
Cross-feature: NO
PRODUCTION RISK: Must never ship to production — debug store only

---

## VCSM — React Context (Inferred)

No explicit Context providers were found in this scan pass.
VCSM appears to use Zustand exclusively for shared state.
Local component state likely uses useState/useReducer.

---

## VCSM — localStorage Usage

Likely locations (not yet fully scanned):
- Identity persistence (active actor selection)
- Onboarding step completion state
- Auth token caching (via Supabase client)

Full localStorage usage scan recommended via a dedicated grep pass.

---

## VCSM — Service Worker Cache

Path: apps/Traffic/public/sw.js (Traffic only)
VCSM service worker status: Unknown — not found in this scan pass.
Traffic has a service worker at public/sw.js.

---

## TRAFFIC — State

Traffic is a Next.js static export with no persistent client-side state stores.
No Zustand, no Redux, no Context providers detected.
All data is fetched at build time (generateStaticParams + page data).
Client-side state is local to individual components (search bars, UI toggles, etc.).

---

## WENTREX — State Stores

Wentrex state stores not fully scanned in this pass.
Known: Wentrex uses Zustand (follows same engine pattern as VCSM).
Full Wentrex store scan required in a dedicated pass.

---

## Duplicate State Warnings

### Actor data duplicated across features
Risk: feed, profiles, chat, and notifications all need actor data.
If each feature independently fetches and stores actor records, actor data is duplicated in memory.
Expected resolution: actorStore.js (Zustand) is the shared cache — all features must read from it via hydration engine.
Verify: No feature maintains its own local actor cache separate from actorStore.js.

### Identity surface in multiple stores
identitySelection.store.js and bootstrap.store.js both track identity-related state.
Ensure: Only identitySelection.store.js exposes actorId + kind. bootstrap.store.js should only track completion status.
