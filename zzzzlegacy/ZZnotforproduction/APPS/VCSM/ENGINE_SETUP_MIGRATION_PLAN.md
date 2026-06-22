# Engine Setup Migration Plan

**Ticket:** ARCH-ENGINESETUP-001  
**Generated:** 2026-06-06  
**Status:** PLANNING ONLY — no source files modified

---

## Context

`main.jsx` currently imports 8 setup functions from 8 different `features/` folders.
Engine startup is an app-level concern, not a feature-level concern. These files belong
in `app/setup/` — a single folder where any developer can find all engine initialization
in one place.

---

## Current Call Site — main.jsx (lines 9–29)

```js
import { setupVcsmIdentityEngine }     from '@/features/identity/setup'
import { setupVcsmHydration }           from '@/features/hydration/setup'
import { setupVcsmChatEngine }          from '@/features/chat/setup'
import { setupVcsmReviewsEngine }       from '@/features/reviews/setup'
import { setupVcsmPortfolioEngine }     from '@/features/portfolio/setup'
import { setupVcsmNotificationsEngine } from '@/features/notifications/setup'
import { setupVcsmBookingEngine }       from '@/features/booking/setup'
import { setupVcsmMediaEngine }         from '@/features/media/setup'

setupVcsmIdentityEngine()
setupVcsmHydration()
setupVcsmChatEngine()
setupVcsmReviewsEngine()
setupVcsmPortfolioEngine()
setupVcsmNotificationsEngine()
setupVcsmBookingEngine()
setupVcsmMediaEngine()
```

---

## Dependency Analysis

### Cross-setup runtime dependencies

| Setup | Imports from | Required order constraint |
|---|---|---|
| `identity/setup.js` | `@identity`, supabase | None — must be first (auth resolver) |
| `hydration/setup.js` | `@hydration`, supabase, `./vcsmActorHydrator` | None — must be second |
| `chat/setup.js` | `@chat`, `@hydration`, supabase, postgrest utils | hydration configured before call |
| `reviews/setup.js` | `@reviews`, supabase | None |
| `portfolio/setup.js` | `@portfolio`, supabase | None |
| `notifications/setup.js` | `@notifications`, `@hydration`, supabase | hydration configured before call |
| `booking/setup.js` | `@booking`, supabase, vportClient, `notifications.adapter` | notifications configured before call |
| `media/setup.js` | `@media`, cloudflare service | None |

### Required initialization order

```
1. identity     — no dependencies
2. hydration    — no dependencies (must precede chat + notifications)
3. reviews      — no dependencies
4. portfolio    — no dependencies
5. media        — no dependencies
6. notifications — requires hydration engine configured
7. chat          — requires hydration engine configured
8. booking       — requires notifications.adapter functional
```

Order 3–5 can be in any sequence relative to each other. Order 6–8 must follow 1–2.
Current `main.jsx` order is safe. The proposed barrel must preserve order.

---

## What Each Setup Injects

| Setup | Injected dependencies |
|---|---|
| identity | supabase, `createVcsmAppContextResolver`, debug reporter |
| hydration | supabase, `hydrateVcsmActor` (private VCSM actor hydrator) |
| chat | supabase, `hydrateAndReturnSummaries`, `resolveRealm`, postgrest utils, `searchActors` closure, `resolveActorRealmContext` closure, `checkBlockRelation` closure |
| reviews | supabase, `isActorOwner` closure (checks `vc.actor_owners` RLS-enforced) |
| portfolio | supabase, `isActorOwner` closure, dev `debugReporter` → portfolioTraceStore |
| notifications | supabase, `resolveActorCard` closure (wraps hydration) |
| booking | supabase, vportClient, `publishVcsmNotification` (from notifications adapter) |
| media | `uploadToCloudflare`, `publicUrlForKey` |

---

## Proposed Destination Structure

```
apps/VCSM/src/app/setup/
├── identity.setup.js
├── hydration.setup.js          ← includes vcsmActorHydrator inline or as local import
├── chat.setup.js
├── reviews.setup.js
├── portfolio.setup.js
├── notifications.setup.js
├── booking.setup.js
├── media.setup.js
└── index.js                    ← barrel: exports configureAllEngines()
```

### Proposed main.jsx after migration

```js
import { configureAllEngines } from '@/app/setup'
configureAllEngines()
```

Single import, single call, startup order locked in the barrel.

---

## Per-File Migration Steps

### 1. identity.setup.js

**Source:** `features/identity/setup.js`  
**Destination:** `app/setup/identity.setup.js`  
**Changes:** None — copy exactly as-is.  
**Internal imports unchanged:** `./resolvers/vcsmIdentity.resolver.js` → needs path update to
  `@/features/identity/resolvers/vcsmIdentity.resolver.js`  
**Feature folder after move:** `features/identity/` has 8+ remaining files — stays.

### 2. hydration.setup.js

**Source:** `features/hydration/setup.js`  
**Destination:** `app/setup/hydration.setup.js`  
**Companion file:** `features/hydration/vcsmActorHydrator.js`  
  → Move to `app/setup/vcsmActorHydrator.js` (used only by hydration setup)  
  → OR inline the hydrator content directly into `hydration.setup.js`  
  → Recommended: move as a local file next to the setup file (keeps the hydrator self-contained)  
**Feature folder after move:** `features/hydration/` becomes empty → **DELETE**.

### 3. chat.setup.js

**Source:** `features/chat/setup.js`  
**Destination:** `app/setup/chat.setup.js`  
**Changes:** None — copy exactly as-is.  
**Feature folder after move:** `features/chat/` has 65+ remaining files — stays.

### 4. reviews.setup.js

**Source:** `features/reviews/setup.js`  
**Destination:** `app/setup/reviews.setup.js`  
**Changes:** None — copy exactly as-is.  
**Feature folder after move:** `features/reviews/` has 0 remaining files → **DELETE**.

### 5. portfolio.setup.js

**Source:** `features/portfolio/setup.js`  
**Destination:** `app/setup/portfolio.setup.js`  
**Changes:** None — copy exactly as-is.  
**Side effect:** `features/portfolio/adapters/portfolioTrace.adapter.js` imports `portfolioTraceStore`
  from `@/features/portfolio/setup`. After the move, that import path breaks.  
  **Must update:** `portfolioTrace.adapter.js` → import from `@/app/setup/portfolio.setup`  
  **Also update:** the dashboard probe that imports via the adapter (path stays the same — adapter unchanged)  
**Feature folder after move:** `features/portfolio/` has 1 remaining file (`portfolioTrace.adapter.js`) — stays.

### 6. notifications.setup.js

**Source:** `features/notifications/setup.js`  
**Destination:** `app/setup/notifications.setup.js`  
**Changes:** None — copy exactly as-is.  
**Feature folder after move:** `features/notifications/` has 43+ remaining files — stays.

### 7. booking.setup.js

**Source:** `features/booking/setup.js`  
**Destination:** `app/setup/booking.setup.js`  
**Changes:** None — copy exactly as-is.  
**Feature folder after move:** `features/booking/` has 67+ remaining files — stays.

### 8. media.setup.js

**Source:** `features/media/setup.js`  
**Destination:** `app/setup/media.setup.js`  
**Changes:** None — copy exactly as-is.  
**Feature folder after move:** `features/media/` has 8+ remaining files — stays.

---

## Barrel — app/setup/index.js

```js
import { setupVcsmIdentityEngine }     from './identity.setup'
import { setupVcsmHydration }           from './hydration.setup'
import { setupVcsmReviewsEngine }       from './reviews.setup'
import { setupVcsmPortfolioEngine }     from './portfolio.setup'
import { setupVcsmMediaEngine }         from './media.setup'
import { setupVcsmNotificationsEngine } from './notifications.setup'
import { setupVcsmChatEngine }          from './chat.setup'
import { setupVcsmBookingEngine }       from './booking.setup'

export function configureAllEngines() {
  // Order is load-bearing — see dependency analysis above.
  setupVcsmIdentityEngine()       // 1. auth resolver first
  setupVcsmHydration()             // 2. hydration before chat + notifications
  setupVcsmReviewsEngine()         // 3. no dependencies
  setupVcsmPortfolioEngine()       // 4. no dependencies
  setupVcsmMediaEngine()           // 5. no dependencies
  setupVcsmNotificationsEngine()   // 6. requires hydration configured
  setupVcsmChatEngine()            // 7. requires hydration configured
  setupVcsmBookingEngine()         // 8. requires notifications configured
}
```

---

## Post-Move Stub Folder Fates

| Feature | Files after setup.js moves | Verdict | Action |
|---|---|---|---|
| identity | 8+ remaining | STAYS | setup.js moves, feature stays |
| hydration | 1 (vcsmActorHydrator.js) → 0 after hydrator moves | DELETE | move hydrator to `app/setup/`, delete folder |
| chat | 65+ remaining | STAYS | setup.js moves, feature stays |
| reviews | 0 remaining | DELETE | delete empty folder after move |
| portfolio | 1 remaining (portfolioTrace.adapter.js) | STAYS | setup.js moves, adapter stays + import updated |
| notifications | 43+ remaining | STAYS | setup.js moves, feature stays |
| booking | 67+ remaining | STAYS | setup.js moves, feature stays |
| media | 8+ remaining | STAYS | setup.js moves, feature stays |

---

## Implementation Order (when owner approves)

```
Step 1 — Create app/setup/ directory
Step 2 — Copy all 8 setup.js files to app/setup/ (exact copies)
Step 3 — Move vcsmActorHydrator.js to app/setup/ (or inline)
Step 4 — Update portfolioTrace.adapter.js import (1 line)
Step 5 — Create app/setup/index.js barrel
Step 6 — Update main.jsx: replace 8 imports + 8 calls with 1 import + configureAllEngines()
Step 7 — Grep validate: zero references to @/features/[identity|hydration|reviews|portfolio|notifications|booking|media]/setup in app/ or main.jsx
Step 8 — Cold launch app — all 8 engines must configure before first render
Step 9 — Delete empty feature folders: features/hydration/, features/reviews/
Step 10 — Delete old setup.js files from features/
```

---

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Startup order change | LOW | Order locked in barrel — harder to accidentally break than scattered main.jsx calls |
| portfolioTrace.adapter import breaks | MEDIUM | Must update before deleting portfolio/setup.js; one line |
| vcsmActorHydrator relocation | LOW | Used only by hydration/setup.js; update import after move |
| `_configured` idempotency | NONE | All 8 setup files have guards; double-calling is safe |
| features/reviews/ deletion | NONE | Only 1 file (setup.js); zero other files, zero other consumers |
| features/hydration/ deletion | LOW | vcsmActorHydrator must move first; confirm no other consumer |

---

## Validation Checklist (for implementation ticket)

- [ ] `grep -r "@/features/identity/setup\|@/features/hydration/setup\|@/features/chat/setup\|@/features/reviews/setup\|@/features/portfolio/setup\|@/features/notifications/setup\|@/features/booking/setup\|@/features/media/setup" apps/VCSM/src/` → zero results
- [ ] `grep -r "portfolioTraceStore" apps/VCSM/src/` → only `app/setup/portfolio.setup.js` and `portfolioTrace.adapter.js` (not `features/portfolio/setup.js`)
- [ ] App cold launch: all 8 engines configure before first render
- [ ] `features/hydration/` and `features/reviews/` do not exist after cleanup
- [ ] `portfolioTrace.adapter.js` still serves dashboard probe

---

## Owner Approval Required Before Implementation

- [ ] Approve barrel approach (`configureAllEngines()`) vs. keep 8 separate calls in main.jsx
- [ ] Approve vcsmActorHydrator relocation strategy (move alongside setup vs. inline)
- [ ] Confirm startup order in barrel matches expected behavior
- [ ] Confirm deletion of `features/hydration/` and `features/reviews/` after move
