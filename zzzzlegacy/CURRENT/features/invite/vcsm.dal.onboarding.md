# VCSM DAL — `onboarding`

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/onboarding/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 4 |
| Exported functions | 12 |
| Tables accessed | 7 |
| RPCs called | 0 |
| Risk findings | 0 |

## DAL Files

### `onboardingSteps.dal.js`

**Path:** `features/onboarding/dal/onboardingSteps.dal.js`  
**Operations:** `read` · `upsert`  

**Exported functions:**

| `markActorOnboardingStepCompletedDAL` | `read` · `upsert` | `onboarding_steps`, `actor_onboarding_steps` |
| `readActorOnboardingStepDAL` | `read` · `upsert` | `onboarding_steps`, `actor_onboarding_steps` |
| `readOnboardingStepsDAL` | `read` · `upsert` | `onboarding_steps`, `actor_onboarding_steps` |

### `profileCompletion.dal.js`

**Path:** `features/onboarding/dal/profileCompletion.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readActorRowDAL` | `read` | `actors`, `profiles` |
| `readProfileCompletionFieldsDAL` | `read` | `actors`, `profiles` |
| `readVportCompletionFieldsDAL` | `read` | `actors`, `profiles` |

### `vibeInvites.dal.js`

**Path:** `features/onboarding/dal/vibeInvites.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readQualifyingVibeInviteCountDAL` | `read` | `vibe_invites` |
| `readVibeInviteCountDAL` | `read` | `vibe_invites` |
| `readVibeInvitesDAL` | `read` | `vibe_invites` |

### `vibeTags.dal.js`

**Path:** `features/onboarding/dal/vibeTags.dal.js`  
**Operations:** `read` · `update` · `upsert`  

**Exported functions:**

| `readSelectedVibeTagsDAL` | `read` · `update` · `upsert` | `vibe_tags`, `vibe_actor_tags` |
| `readVibeTagsDAL` | `read` · `update` · `upsert` | `vibe_tags`, `vibe_actor_tags` |
| `replaceSelectedVibeTagsDAL` | `read` · `update` · `upsert` | `vibe_tags`, `vibe_actor_tags` |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `actor_onboarding_steps` | UPSERT | `markActorOnboardingStepCompletedDAL`, `readActorOnboardingStepDAL`, `readOnboardingStepsDAL` |
| `actors` | READ | `readActorRowDAL`, `readProfileCompletionFieldsDAL`, `readVportCompletionFieldsDAL` |
| `onboarding_steps` | UPSERT | `markActorOnboardingStepCompletedDAL`, `readActorOnboardingStepDAL`, `readOnboardingStepsDAL` |
| `profiles` | READ | `readActorRowDAL`, `readProfileCompletionFieldsDAL`, `readVportCompletionFieldsDAL` |
| `vibe_actor_tags` | UPSERT | `readSelectedVibeTagsDAL`, `readVibeTagsDAL`, `replaceSelectedVibeTagsDAL` |
| `vibe_invites` | READ | `readQualifyingVibeInviteCountDAL`, `readVibeInviteCountDAL`, `readVibeInvitesDAL` |
| `vibe_tags` | UPSERT | `readSelectedVibeTagsDAL`, `readVibeTagsDAL`, `replaceSelectedVibeTagsDAL` |

---

## Risk Findings

No risk findings for this feature.

---

## Pending Reviews

No pending reviews — feature DAL is clean.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `onboardingSteps.dal.js`

**Direct callers:**

- `onboarding.controller.js` _Controller_

**Full call chain to screen:**

```
`onboardingSteps.dal.js` → `onboarding.controller.js` → `useOnboardingCards.js` → `OnboardingCardsView.jsx`
```

### `profileCompletion.dal.js`

**Direct callers:**

- `onboarding.controller.js` _Controller_

**Full call chain to screen:**

```
`profileCompletion.dal.js` → `onboarding.controller.js` → `useOnboardingCards.js` → `OnboardingCardsView.jsx`
```

### `vibeInvites.dal.js`

**Direct callers:**

- `onboarding.controller.js` _Controller_

**Full call chain to screen:**

```
`vibeInvites.dal.js` → `onboarding.controller.js` → `useOnboardingCards.js` → `OnboardingCardsView.jsx`
```

### `vibeTags.dal.js`

**Direct callers:**

- `onboarding.controller.js` _Controller_
- `vibeTagsOnboarding.controller.js` _Controller_

**Full call chain to screen:**

```
`vibeTags.dal.js` → `onboarding.controller.js` → `useOnboardingCards.js` → `OnboardingCardsView.jsx`
```
```
`vibeTags.dal.js` → `vibeTagsOnboarding.controller.js` → `useOnboardingVibeTags.js` → `CitizenVibesScreen.jsx`
```

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `onboarding.model.js` |
| **Controller** | ✓ PRESENT | `onboarding.controller.js`, `vibeTagsOnboarding.controller.js` |
| **Adapter** | ✓ PRESENT | `onboarding.adapter.js` |
| **Service** | ✗ MISSING | — |
| **Hook** | ✓ PRESENT | `useOnboardingCards.js`, `useOnboardingVibeTags.js` |
| **Component** | ✓ PRESENT | `OnboardingCard.jsx`, `OnboardingCardList.jsx`, `VibeTagPicker.jsx` |
| **View Screen** | ✓ PRESENT | `OnboardingCardsView.jsx` |
| **Final Screen** | ✓ PRESENT | `CitizenVibesScreen.jsx` |

### Model

_Pure transforms — no side effects, no DB access_

- `features/onboarding/model/onboarding.model.js`

### Controller

_Business rules, ownership, permissions — no React_

- `features/onboarding/controller/onboarding.controller.js`
- `features/onboarding/controller/vibeTagsOnboarding.controller.js`

### Adapter

_Cross-feature boundary — only approved cross-feature access point_

- `features/onboarding/adapters/onboarding.adapter.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/onboarding/hooks/useOnboardingCards.js`
- `features/onboarding/hooks/useOnboardingVibeTags.js`

### Component

_Presentational only — no hooks, no data fetching_

- `features/onboarding/components/OnboardingCard.jsx`
- `features/onboarding/components/OnboardingCardList.jsx`
- `features/onboarding/components/VibeTagPicker.jsx`

### View Screen

_Hooks + component composition — no business logic_

- `features/onboarding/screens/OnboardingCardsView.jsx`

### Final Screen

_Route entry + identity gate only — no computation_

- `features/onboarding/screens/CitizenVibesScreen.jsx`

### Missing Layers

- 🟡 **Service** — not detected in static scan

> Missing layers may exist but use naming patterns not detected by static scan, or may be delegated to engines.

---

## Dead Code Audit

_Audited:_ 2026-05-11  
_Method:_ Static import trace — grep across all `.js`/`.jsx` in `apps/VCSM/src/`  
_Auditor:_ ARCHITECT

---

### Verdict: 2 Confirmed Dead Functions

| Function | Status | Evidence |
|---|---|---|
| `readOnboardingStepsDAL` | LIVE | `onboarding.controller.js` line 59 |
| `readActorOnboardingStepDAL` | LIVE | `onboarding.controller.js` line 89 |
| `markActorOnboardingStepCompletedDAL` | **CONFIRMED DEAD** | Zero imports outside `onboardingSteps.dal.js` |
| `readActorRowDAL` | LIVE | `onboarding.controller.js` line 84 |
| `readProfileCompletionFieldsDAL` | LIVE | `onboarding.controller.js` line 103 |
| `readVportCompletionFieldsDAL` | LIVE | `onboarding.controller.js` line 110 |
| `readVibeInvitesDAL` | LIVE | `onboarding.controller.js` line 74 |
| `readVibeInviteCountDAL` | **CONFIRMED DEAD** | Zero imports outside `vibeInvites.dal.js` |
| `readQualifyingVibeInviteCountDAL` | LIVE | `onboarding.controller.js` line 79 |
| `readVibeTagsDAL` | LIVE | Both controllers |
| `readSelectedVibeTagsDAL` | LIVE | Both controllers |
| `replaceSelectedVibeTagsDAL` | LIVE | `vibeTagsOnboarding.controller.js` line 52 |

---

### Dead Code Finding #1 — `markActorOnboardingStepCompletedDAL`

**File:** `features/onboarding/dal/onboardingSteps.dal.js`  
**Function:** `markActorOnboardingStepCompletedDAL`  
**Classification:** CONFIRMED DEAD  

**Evidence:**
- Zero import references found anywhere in `apps/VCSM/src/`
- `onboarding.controller.js` only imports `readOnboardingStepsDAL` and `readActorOnboardingStepDAL` — the write function is absent from the import list
- No other controller or hook references the function

**Risk:** HIGH — this is the sole write path for recording completed onboarding steps in `actor_onboarding_steps`. Its absence means **no onboarding step is ever marked complete in the database**. The read path (`readActorOnboardingStepDAL`) checks for completion, but the write path that sets it is unwired. The onboarding card system is read-only against this table.

**Recommended action:** VERIFY USAGE — if onboarding step completion is intended to persist (which the table existence implies), this function must be wired into `onboarding.controller.js` at the completion action trigger.  
**Handoffs:** IRONMAN (confirm whether step persistence is intended or intentionally deferred), WOLVERINE (wire the write path if confirmed required)

---

### Dead Code Finding #2 — `readVibeInviteCountDAL`

**File:** `features/onboarding/dal/vibeInvites.dal.js`  
**Function:** `readVibeInviteCountDAL`  
**Classification:** CONFIRMED DEAD  

**Evidence:**
- Zero import references found anywhere in `apps/VCSM/src/`
- `onboarding.controller.js` imports `readVibeInvitesDAL` and `readQualifyingVibeInviteCountDAL` — `readVibeInviteCountDAL` is not imported
- Likely superseded by `readQualifyingVibeInviteCountDAL`, which performs the same count with additional qualifying filters

**Risk:** LOW — sibling functions cover the used paths. No runtime impact.  
**Recommended action:** DELETE CANDIDATE — confirm `readQualifyingVibeInviteCountDAL` fully replaces it, then remove.  
**Handoffs:** IRONMAN (confirm no planned use case for a raw unfiltered invite count)

---

### Structural Finding #1 — `readActorRowDAL` exposes `profile_id` and `vport_id`

**File:** `features/onboarding/dal/profileCompletion.dal.js`  
**Classification:** INTERNAL USE ACCEPTABLE — must not leak to public surface  

**Evidence:**
- `readActorRowDAL` selects `id, kind, profile_id, vport_id, is_void` from `vc.actors`
- The controller uses the returned `profile_id`/`vport_id` to drive `readProfileCompletionFieldsDAL` and `readVportCompletionFieldsDAL`
- These IDs remain internal to the controller — they are not returned to the hook or UI layer

**Why acceptable here:** The onboarding controller needs the raw DB IDs to fetch completion fields from `profiles`. This is a legitimate internal coordination pattern at the controller layer. The contract only bans exposing these IDs through `useIdentity()` or public hook surfaces — not from being used inside a controller.

**Risk:** MEDIUM — if the controller's return shape ever exposes `profileId` or `vportId` up to the hook/screen layer, it becomes a contract violation. Must be verified that the controller does not surface these in its output.

---

### Structural Finding #2 — Potential camelCase/snake_case mismatch

**File:** `features/onboarding/controller/onboarding.controller.js`  
**Classification:** POSSIBLE BUG  

**Evidence:**
- `readActorRowDAL` returns snake_case DB columns: `profile_id`, `vport_id`
- The controller references `actor.profileId` and `actor.vportId` (camelCase)
- No model layer is present in this feature (listed as MISSING in Architecture Pipeline) to perform the case transform

**Risk:** MEDIUM — if `actor` is the raw result of `readActorRowDAL`, the properties `actor.profileId` and `actor.vportId` would be `undefined`, silently causing `readProfileCompletionFieldsDAL` and `readVportCompletionFieldsDAL` to receive `null` and skip. The `actor` object may be sourced from elsewhere (e.g. identity state), which would resolve this — but the source is not traceable from the DAL layer alone.  
**Recommended action:** Verify the source of `actor` in `onboarding.controller.js`. If it is the raw `readActorRowDAL` result, either add a model transform or access `actor.profile_id` / `actor.vport_id` directly.  
**Handoffs:** DEADPOOL (root cause trace on `actor` object source), WOLVERINE (add model layer if transform is needed)

---

### Audit Summary

| Finding | Classification | Priority |
|---|---|---|
| `markActorOnboardingStepCompletedDAL` — write path unwired, steps never persist | CONFIRMED DEAD | P0 — no onboarding step completion is ever written to DB |
| `readVibeInviteCountDAL` — superseded by qualifying count fn | CONFIRMED DEAD | P2 — delete candidate |
| `readActorRowDAL` exposes `profile_id`/`vport_id` internally | INTERNAL USE ACCEPTABLE | P3 — monitor for leakage to hook layer |
| `actor.profileId` vs `actor.profile_id` — possible silent null | POSSIBLE BUG | P1 — verify actor object source |

**Confirmed dead functions:** 2  
**Doc function count requires correction:** was 12, active count is 10  
**Critical gap:** Onboarding step write path (`markActorOnboardingStepCompletedDAL`) is unwired — `actor_onboarding_steps` is read-only from the application layer

---

## Layer Consumer Map

_Audited:_ 2026-05-11  
_Method:_ Static import trace — full upward traversal from each DAL file through Controller → Model → Hook → Adapter → Screen → Route  
_Auditor:_ ARCHITECT

---

### DAL → Controller

| DAL File | Function | Controller | Notes |
|---|---|---|---|
| `onboardingSteps.dal.js` | `readOnboardingStepsDAL` | `onboarding.controller.js` | Live |
| `onboardingSteps.dal.js` | `readActorOnboardingStepDAL` | `onboarding.controller.js` | Live |
| `onboardingSteps.dal.js` | `markActorOnboardingStepCompletedDAL` | _(none)_ | **DEAD — P0 write path unwired** |
| `profileCompletion.dal.js` | `readActorRowDAL` | `onboarding.controller.js` | Live |
| `profileCompletion.dal.js` | `readProfileCompletionFieldsDAL` | `onboarding.controller.js` | Live — called with `actor.profileId` (camelCase mismatch risk) |
| `profileCompletion.dal.js` | `readVportCompletionFieldsDAL` | `onboarding.controller.js` | Live — called with `actor.vportId` (camelCase mismatch risk) |
| `vibeInvites.dal.js` | `readVibeInvitesDAL` | `onboarding.controller.js` | Live |
| `vibeInvites.dal.js` | `readQualifyingVibeInviteCountDAL` | `onboarding.controller.js` | Live |
| `vibeInvites.dal.js` | `readVibeInviteCountDAL` | _(none)_ | **DEAD — superseded** |
| `vibeTags.dal.js` | `readVibeTagsDAL` | `onboarding.controller.js`, `vibeTagsOnboarding.controller.js` | Live — called by both controllers |
| `vibeTags.dal.js` | `readSelectedVibeTagsDAL` | `onboarding.controller.js`, `vibeTagsOnboarding.controller.js` | Live — called by both controllers |
| `vibeTags.dal.js` | `replaceSelectedVibeTagsDAL` | `vibeTagsOnboarding.controller.js` | Live — sole write path for vibe tag selection |

---

### Model → Controller

`onboarding.model.js` provides pure transforms consumed by both controllers:

| Model Function | Consumed By | Purpose |
|---|---|---|
| `mapOnboardingStepRow` | `onboarding.controller.js` | Maps DB row → domain onboarding step shape |
| `mapVibeTagRow` | `vibeTagsOnboarding.controller.js` | Maps DB row → domain vibe tag shape |
| _(other exports)_ | `onboarding.controller.js` | Additional step/card transforms |

**Note:** `features/auth/model/onboarding.model.js` is a **separate model file** in the auth feature — it is NOT this feature's model. The auth model provides `isProfileShellIncompleteModel` and related auth-side checks, consumed by `auth/controllers/onboarding.controller.js` and `auth/controllers/profileOnboarding.controller.js`. These do not touch the onboarding DAL.

---

### Controller Helpers

`onboarding.controller.helpers.js` is an internal helper file used exclusively by `onboarding.controller.js`. It contains logic shared across the controller's internal steps but is not exported externally.

---

### Controller → Hook

| Controller | Hook That Imports It | Function Used |
|---|---|---|
| `onboarding.controller.js` | `useOnboardingCards.js` | `getOnboardingCardsController` |
| `vibeTagsOnboarding.controller.js` | `useOnboardingVibeTags.js` | Multiple — load tags, save selection |

---

### Adapter Surface (`onboarding.adapter.js`)

The adapter exports two screens for cross-feature consumption:

| Export | Source |
|---|---|
| `OnboardingCardsView` | `features/onboarding/screens/OnboardingCardsView.jsx` |
| `CitizenVibesScreen` | `features/onboarding/screens/CitizenVibesScreen.jsx` |

The adapter is a **screen-level re-export** — it does not expose controllers or hooks directly. All cross-feature consumers receive the screen component, not the data layer.

---

### Adapter Consumers

| Consumer | Feature | Usage |
|---|---|---|
| `lazyApp.jsx` | app/routes | Lazy-loads `CitizenVibesScreen` via adapter for the `/citizen/vibes` route |
| `SearchScreen.view.jsx` | `explore` | Renders `OnboardingCardsView` **inline as an embedded component** — not a standalone route |

---

### Hook → Screen

| Hook | Screen |
|---|---|
| `useOnboardingCards.js` | `OnboardingCardsView.jsx` |
| `useOnboardingVibeTags.js` | `CitizenVibesScreen.jsx` |

---

### Screen → Route

| Screen | Route | Status |
|---|---|---|
| `CitizenVibesScreen.jsx` | `/citizen/vibes` — protected route in `app.routes.jsx` | **ROUTED** — lazy-loaded via `lazyApp.jsx` → `onboarding.adapter.js` |
| `OnboardingCardsView.jsx` | No standalone route | **EMBEDDED** — rendered inside `SearchScreen.view.jsx` (explore feature) as an inline component |

`OnboardingCardsView` is not a navigable screen — it is a view injected into the explore search screen. It renders below search results when the user's onboarding cards are relevant.

---

### Components

Three presentational components are used by the screens:

| Component | Consumed By |
|---|---|
| `OnboardingCard.jsx` | `OnboardingCardList.jsx` |
| `OnboardingCardList.jsx` | `OnboardingCardsView.jsx` |
| `VibeTagPicker.jsx` | `CitizenVibesScreen.jsx` |

---

### Full Call Chain

**Onboarding cards (embedded in explore search):**
```
onboardingSteps.dal.js ──┐
profileCompletion.dal.js ─┤
vibeInvites.dal.js ───────┤→ onboarding.controller.js (+ onboarding.model.js + helpers)
vibeTags.dal.js ───────── ┘
                            → useOnboardingCards.js
                              → OnboardingCardsView.jsx
                                → onboarding.adapter.js
                                  → SearchScreen.view.jsx (explore — embedded, no route)
```

**Vibe tag selection (`/citizen/vibes`):**
```
vibeTags.dal.js
  → vibeTagsOnboarding.controller.js (+ onboarding.model.js mapVibeTagRow)
    → useOnboardingVibeTags.js
      → CitizenVibesScreen.jsx
        → onboarding.adapter.js
          → lazyApp.jsx → /citizen/vibes (protected route)
```

---

### Architecture Pipeline — Corrected

| Layer | Actual Status | Evidence |
|---|---|---|
| DAL | PRESENT | 4 files — 2 functions dead (see Dead Code Audit) |
| Model | PRESENT | `features/onboarding/model/onboarding.model.js` — consumed by both controllers |
| Controller | PRESENT | `onboarding.controller.js`, `vibeTagsOnboarding.controller.js`, `onboarding.controller.helpers.js` (internal) |
| Adapter | PRESENT | `onboarding.adapter.js` — screen-level re-export for cross-feature embed + lazy route |
| Hook | PRESENT | `useOnboardingCards.js`, `useOnboardingVibeTags.js` |
| Component | PRESENT | `OnboardingCard.jsx`, `OnboardingCardList.jsx`, `VibeTagPicker.jsx` |
| View Screen | PRESENT | `OnboardingCardsView.jsx` (embedded in explore, not standalone route) |
| Final Screen | PRESENT | `CitizenVibesScreen.jsx` (`/citizen/vibes`) |

---

### Key Findings

| Finding | Classification | Priority |
|---|---|---|
| `markActorOnboardingStepCompletedDAL` — write path not wired into any controller | **P0 — steps never persist to DB** | Critical |
| `readVibeInviteCountDAL` — superseded dead function | P2 — delete candidate | Low |
| `actor.profileId` / `actor.vportId` in controller may be undefined (snake_case mismatch) | P1 — silent null risk | Medium |
| `OnboardingCardsView` has no standalone route — embedded in explore search | Architecture note | Informational |

---

## Avengers Assembly Report — 2026-05-11

**Scope:** `vcsm.dal.onboarding.md` — documentation alignment pass  
**Triggered by:** User-invoked `/AvengersAssemble` against this document  
**Application scope:** VCSM  
**Commands run:** ARCHITECT · IRONMAN · VENOM · SENTRY · LOKI · KRAVEN · CARNAGE · FALCON · WINTER SOLDIER · LOGAN · review-contract · SHIELD  
**Mode:** READ-ONLY — no source code modified

---

### Governance Evidence Registry

| Command | Status | Evidence Source | Drift | Blocking |
|---|---|---|---|---|
| ARCHITECT | PRESENT | Live filesystem scan + controller read | YES | YES |
| IRONMAN | PRESENT | File tree + ownership audit | NO | NO |
| VENOM | PRESENT | All 4 DAL files inspected | YES | CAUTION |
| SENTRY | PRESENT | DAL source + architecture review | YES | NO |
| LOKI | MISSING | No runtime trace available | N/A | NO |
| KRAVEN | MISSING | No performance trace available | N/A | NO |
| CARNAGE | N/A | No schema migration scope | N/A | NO |
| FALCON | N/A | No native module scope | N/A | NO |
| WINTER SOLDIER | N/A | No Android scope | N/A | NO |
| LOGAN | PRESENT | Internal document consistency check | YES | YES |
| review-contract | PRESENT | DAL source + import audit | YES | YES |
| SHIELD | N/A | No external IP/license scope | N/A | NO |

---

### ARCHITECT

**Status: DRIFT FOUND**

**Finding 1 — Tables Accessed section has systematically wrong operation labels**

The Tables Accessed table has incorrect operation types and wrong function-to-table attributions throughout. Live source inspection reveals:

| Table | Documented Operations | Actual Operations | Error |
|---|---|---|---|
| `onboarding_steps` | UPSERT | READ only | `markActorOnboardingStepCompletedDAL` writes `actor_onboarding_steps`, NOT `onboarding_steps` — UPSERT is wrong |
| `actor_onboarding_steps` | UPSERT | READ, UPSERT | READ operations missing; `readActorOnboardingStepDAL` is a reader |
| `vibe_tags` | UPSERT | READ only | `replaceSelectedVibeTagsDAL` writes `vibe_actor_tags`, NOT `vibe_tags` — UPSERT is wrong |
| `vibe_actor_tags` | UPSERT | READ, UPDATE, UPSERT | READ missing; UPDATE missing (`replaceSelectedVibeTagsDAL` calls `.update()` then `.upsert()`) |

The Via Functions column compounds the error — functions are attributed to the wrong tables:
- `onboarding_steps` lists `markActorOnboardingStepCompletedDAL` as a caller — that function writes `actor_onboarding_steps`, not `onboarding_steps`
- `vibe_tags` lists `replaceSelectedVibeTagsDAL` as a caller — that function only touches `vibe_actor_tags`
- `actor_onboarding_steps` lists `readOnboardingStepsDAL` — that function only reads `onboarding_steps`

**Finding 2 — `profiles` table is accessed via two different Supabase schema clients, undocumented**

`readProfileCompletionFieldsDAL` queries `profiles` with no `.schema()` call (defaults to `public` schema).  
`readVportCompletionFieldsDAL` queries `profiles` via `vportSchema` which resolves to `supabase.schema('vport')`.

These are two separate tables in two separate schemas. The Tables Accessed section treats them as one `profiles` entry with no schema distinction. The different client used for the vport path (`vportClient.js`) is also entirely undocumented.

**Finding 3 — Summary table claims "Risk findings | 0"**

The document Summary table at line 17 states `Risk findings | 0`. This directly contradicts the Dead Code Audit section which documents 4 findings including a P0 critical bug (`markActorOnboardingStepCompletedDAL` is an unwired write path). The summary was never updated after the audit was appended.

**Finding 4 — P0 write path still unwired (unchanged since audit)**

Live grep confirms `markActorOnboardingStepCompletedDAL` has zero import references outside its own DAL file. The onboarding step persistence gap documented at P0 remains unresolved.

---

### IRONMAN

**Status: ALIGNED**

File tree matches exactly: 16 files across all documented layers. No orphaned files. No undocumented boundary exceptions. Adapter correctly exports screen-level re-exports only — no controller or hook exposure. `onboarding.controller.helpers.js` is correctly contained within the controller folder.

---

### VENOM

**Status: DRIFT FOUND — CAUTION**

**Finding 1 — All 4 DAL files use singleton Supabase clients, undocumented**

None of the onboarding DAL files use the parameter-injection pattern (`{ supabase, ... }`). All four import singletons at module level:
- `onboardingSteps.dal.js`: `import { supabase } from '@/services/supabase/supabaseClient'`
- `profileCompletion.dal.js`: `import { supabase } from '@/services/supabase/supabaseClient'` + `import vportSchema from '@/services/supabase/vportClient'`
- `vibeInvites.dal.js`: `import { supabase } from '@/services/supabase/supabaseClient'`
- `vibeTags.dal.js`: `import { supabase } from '@/services/supabase/supabaseClient'`

This pattern is consistent within the module but is different from the learning DAL module (which uses injection for most files). The singleton pattern means these DAL functions cannot be called with a scoped client and cannot be tested in isolation. This is not a security break but is undocumented and inconsistent across the codebase.

**Finding 2 — `readProfileCompletionFieldsDAL` queries `profiles` without `.schema()`**

```js
const { data, error } = await supabase
  .from('profiles')   // no .schema() — hits Supabase default schema
  .select('id,display_name,username,photo_url,bio')
```

All other DAL files in this module explicitly call `.schema('vc')`. This file omits it for the profile and vport queries. Whether `profiles` lives in the default schema or `vc` is not documented. If `profiles` is in `vc`, this query would silently fail or return empty results.

**Finding 3 — DEV probe `console.log` in `readQualifyingVibeInviteCountDAL` — unremediated**

`vibeInvites.dal.js` lines 71–77:
```js
// DEV PROBE — remove after invite tracking confirmed working
if (import.meta.env.DEV) {
  console.log('[DEV onboarding/vibe_invites] qualifying count', { ... })
}
```

The comment explicitly marks this as a temporary probe pending removal. It is gated by `import.meta.env.DEV` so it does not ship to production, but it violates the project's no-console.log rule and is undocumented as a pending cleanup item. The comment implies it should have been removed once invite tracking was confirmed working.

**Finding 4 — `readActorRowDAL` selects `profile_id` and `vport_id` from `vc.actors`**

Structural Finding #1 in the Dead Code Audit correctly identifies and classifies this as acceptable internal use. Confirmed: `actor.profile_id` and `actor.vport_id` remain internal to the controller — they are not surfaced to hooks or screens. No contract violation.

---

### SENTRY

**Status: DRIFT FOUND — LOW**

**Finding 1 — Structural Finding #2 is a FALSE POSITIVE**

The Dead Code Audit's Structural Finding #2 states: "No model layer is present in this feature (listed as MISSING in Architecture Pipeline) to perform the case transform."

Live source inspection of `onboarding.controller.js` line 96:
```js
const actor = mapActorRow(rawActor)
```

`mapActorRow` is imported from `features/onboarding/model/onboarding.model.js` and is applied to the raw `readActorRowDAL` result BEFORE `actor.profileId` is accessed at lines 99 and 107. The model transform IS present and IS performing the snake_case → camelCase conversion. `actor.profileId` and `actor.vportId` are therefore valid — the P1 null risk does not exist.

The Structural Finding #2 referenced an earlier (incorrect) version of the Architecture Pipeline that showed the model as MISSING. The Architecture Pipeline table in this same document correctly shows model as `✓ PRESENT`. The Dead Code Audit section was never updated to reflect the correction, creating an internal contradiction.

**Finding 2 — In-DAL model transforms in `vibeInvites.dal.js` and `vibeTags.dal.js`**

`readVibeInvitesDAL` performs a field-renaming map inside the DAL file (lines 31–44):
```js
return (data ?? []).map((row) => ({
  id: row.id,
  sender_actor_id: row.inviter_actor_id,  // renaming
  recipient_actor_id: row.accepted_actor_id,  // renaming
  ...
}))
```

`readVibeTagsDAL` similarly remaps fields inside the DAL (lines 13–23):
```js
return (data ?? []).map((row) => ({
  id: row.key,       // renaming
  name: row.label,   // renaming
  slug: row.key,
  ...
}))
```

Per architecture contract, DAL files should return raw Supabase results. Domain shape translation belongs in the model layer. These transforms are doing model-layer work at the DAL layer. The document does not flag this.

---

### LOKI

**Status: MISSING — no runtime trace available this pass**

No runtime execution evidence collected. The `SHOW_INVITE_ONBOARDING_CARD` flag in `onboarding.controller.helpers.js` controls whether the invite card is rendered — runtime behavior of this flag is not traced.

---

### KRAVEN

**Status: MISSING — no performance trace available this pass**

`getOnboardingCardsController` runs 7 parallel DAL calls via `Promise.all` on every invocation, followed by a second `Promise.all` for profile/vport fields. No performance instrumentation exists to confirm query cost under load.

---

### CARNAGE

**Status: N/A**

No schema migration scope for this document pass. All tables are in `vc` or `vport` schemas as observed.

---

### FALCON / WINTER SOLDIER

**Status: N/A**

Onboarding is a web-only route. No native module scope applies.

---

### LOGAN

**Status: DRIFT FOUND**

**Finding 1 — Summary table "Risk findings | 0" contradicts document body**

The document's Summary table (line 17) states `Risk findings | 0`. The Dead Code Audit section below it documents 4 findings, including a P0 critical (write path never wired). The summary has never been updated.

**Finding 2 — Structural Finding #2 is a false positive**

The Dead Code Audit documents a P1 null-risk finding that does not exist in the live code. The model layer (`mapActorRow`) resolves the camelCase issue before the controller accesses `actor.profileId`. The finding references an outdated state of the document (when model was thought to be missing) and was never corrected.

**Finding 3 — Tables Accessed section has wrong operation types and wrong function attributions**

Documented separately under ARCHITECT. The operations column and Via Functions column contain multiple inaccuracies against the live DAL source.

**Finding 4 — `vportClient.js` usage undocumented**

`readVportCompletionFieldsDAL` uses a separate `vportSchema` client (`supabase.schema('vport')`), not documented anywhere in the document's DAL files or risk sections.

**Finding 5 — DEV probe `console.log` not flagged as pending cleanup**

The `console.log` in `readQualifyingVibeInviteCountDAL` with a "remove after invite tracking confirmed working" comment is not listed in Pending Reviews or Risk Findings.

---

### review-contract

**Status: DRIFT FOUND**

- No TypeScript files found ✓
- No `select('*')` violations found ✓
- No relative `../../` import violations ✓
- All `@/` path aliases used correctly ✓
- **VIOLATION NOTE:** `vibeInvites.dal.js` and `vibeTags.dal.js` perform domain shape transforms (field renaming) inside DAL files. Per contract, DAL files must return raw Supabase data only — transforms belong in the model layer.
- **PATTERN DEVIATION:** All DAL files use singleton supabase imports. No injection pattern. This is consistent within the module but deviates from the contract expectation that DAL functions receive their dependencies via parameters.

---

### SHIELD

**Status: N/A**

All files in scope are internal project code. No external library, license, or provenance concerns identified.

---

### Cross-System Contradictions

| System A | System B | Contradiction | Severity | Recommended Resolution |
|---|---|---|---|---|
| Dead Code Audit (Structural Finding #2) | SENTRY + controller source | Finding #2 says model is missing and P1 null risk exists; controller source proves model IS present and transform IS applied | HIGH | Retract Structural Finding #2 as false positive in Pending Reviews |
| Summary table ("Risk findings: 0") | Dead Code Audit section | Summary claims zero risks; audit documents 4 findings including P0 critical | HIGH | Update summary table to reflect 4 findings (2 dead functions, 2 structural) |
| Tables Accessed (UPSERT for `onboarding_steps`) | `onboardingSteps.dal.js` source | `onboarding_steps` is read-only; `markActorOnboardingStepCompletedDAL` writes `actor_onboarding_steps` only | HIGH | Correct Tables Accessed operations column and Via Functions attributions |
| Tables Accessed (UPSERT for `vibe_tags`) | `vibeTags.dal.js` source | `vibe_tags` is read-only; `replaceSelectedVibeTagsDAL` only writes `vibe_actor_tags` | MODERATE | Correct Tables Accessed operations column |
| DAL Files section (no schema note) | `profileCompletion.dal.js` source | Document shows `profiles` as a single table; code uses two clients (`supabase` default + `vportSchema`) for two different `profiles` tables | MODERATE | Document schema distinction in DAL file entry |

---

### Runtime Alignment Review

| Area | Runtime Evidence | Performance Risk | Migration Risk | Status |
|---|---|---|---|---|
| 7-call parallel Promise.all on every render | Not traced | Moderate — all 7 DAL calls fire simultaneously on mount | None | LOKI/KRAVEN evidence missing |
| `SHOW_INVITE_ONBOARDING_CARD` flag | Not traced | N/A | None | Flag behavior untested at runtime |
| Onboarding step write path | Not applicable — write path is unwired (P0) | None | None | P0 bug unresolved |
| Vibe tag replace (UPDATE + UPSERT) | Not traced | Low — single-actor operation | None | LOKI evidence missing |

---

### Ownership / Boundary Alignment

| Area | Ownership Status | Boundary Status | Contract Status | Risk |
|---|---|---|---|---|
| Onboarding feature | ALIGNED | Adapter boundary enforced | Compliant | LOW |
| In-DAL model transforms | Not assigned | Violates DAL/model layer boundary | Minor deviation | LOW |
| `vportClient.js` usage | Not documented | Internally scoped, no cross-boundary issue | Acceptable | LOW |
| Singleton supabase imports | Not assigned | Module-consistent but injection pattern preferred | Minor deviation | LOW |

---

### Documentation Truth Review

| Doc/System | Truth Status | Drift | Blocking |
|---|---|---|---|
| DAL file inventory (4 files) | ALIGNED | None — exact match confirmed | NO |
| File structure (16 files, all layers) | ALIGNED | None | NO |
| Summary table "Risk findings: 0" | STALE | Contradicts 4 documented findings below it | YES |
| Summary table "Exported functions: 12" | MINOR DRIFT | Active count is 10 (2 confirmed dead) | NO |
| Tables Accessed — operations column | WRONG | Multiple wrong operation types | YES |
| Tables Accessed — Via Functions | WRONG | Functions attributed to wrong tables | YES |
| Structural Finding #2 (P1 null risk) | FALSE POSITIVE | Risk does not exist — model transform is applied | YES |
| `vportClient.js` / dual schema for `profiles` | MISSING | Not documented anywhere in the file | CAUTION |
| DEV probe `console.log` | MISSING | Not listed in Pending Reviews | NO |
| In-DAL transforms in vibeInvites + vibeTags | MISSING | Not flagged as architecture deviation | NO |
| P0 write path still unwired | CONFIRMED | Unchanged since original audit | YES |

---

### Module Alignment Matrix

| Module | Architecture | Ownership | Security | Runtime | Docs | Release Status |
|---|---|---|---|---|---|---|
| Onboarding DAL (4 files) | DRIFT | ALIGNED | CAUTION | MISSING | DRIFT | CAUTION |
| Step write path (P0 gap) | DRIFT | ALIGNED | N/A | N/A | DRIFT | BLOCKED |
| Profile completion DAL | ALIGNED | ALIGNED | CAUTION | MISSING | DRIFT | CAUTION |
| Vibe tags replace | ALIGNED | ALIGNED | ALIGNED | MISSING | MINOR DRIFT | READY |

---

### Proposed Fixes (append-mode report — no .v2.md required)

The following corrections are needed in this document:

1. **Summary table** — update `Risk findings | 0` to `Risk findings | 4` (2 confirmed dead functions + 2 structural findings). Update `Exported functions | 12` to note active count is 10.

2. **Tables Accessed — operations column** — correct to:
   - `onboarding_steps`: READ (not UPSERT)
   - `actor_onboarding_steps`: READ, UPSERT (not UPSERT only)
   - `vibe_tags`: READ (not UPSERT)
   - `vibe_actor_tags`: READ, UPDATE, UPSERT (not UPSERT only)

3. **Tables Accessed — Via Functions column** — remove incorrect cross-attributions:
   - Remove `markActorOnboardingStepCompletedDAL` from `onboarding_steps` row
   - Remove `readOnboardingStepsDAL` from `actor_onboarding_steps` row
   - Remove `replaceSelectedVibeTagsDAL` from `vibe_tags` row
   - Remove `readVibeTagsDAL` from `vibe_actor_tags` row

4. **Structural Finding #2** — retract as FALSE POSITIVE. Add correction note: `mapActorRow` is called on line 96 of `onboarding.controller.js` before `actor.profileId` is accessed. The model transform is present and resolves the camelCase issue. P1 risk does not exist.

5. **DAL Files — `profileCompletion.dal.js`** — add note documenting that:
   - `readProfileCompletionFieldsDAL` queries `profiles` in the default schema (no `.schema()` call)
   - `readVportCompletionFieldsDAL` uses `vportClient.js` which resolves to `supabase.schema('vport').from('profiles')` — a separate schema

6. **New Pending Review** — add entry: "Remove DEV probe `console.log` from `readQualifyingVibeInviteCountDAL` in `vibeInvites.dal.js` — comment confirms it was temporary pending invite tracking verification."

7. **New Risk Finding** — add entry for in-DAL model transforms: `readVibeInvitesDAL` and `readVibeTagsDAL` both perform field-renaming maps inside the DAL layer. Per architecture contract, DAL files must return raw Supabase data. These transforms should be in the model layer.

---

### Release Intelligence Summary

| Area | Status | Blocking Risk | Recommended Command |
|---|---|---|---|
| Architecture | DRIFT FOUND | YES — Tables Accessed is wrong, Summary is stale | LOGAN: correct tables + summary |
| Ownership | ALIGNED | NO | — |
| Security | CAUTION | NO (patterns undocumented, not broken) | VENOM: document singleton + schema patterns |
| Runtime | MISSING EVIDENCE | NO | LOKI |
| Performance | MISSING EVIDENCE | NO | KRAVEN |
| P0 Write Path Gap | UNRESOLVED | YES — step completion never persists | WOLVERINE: wire markActorOnboardingStepCompletedDAL |
| Documentation | DRIFT FOUND | YES — false positive finding, wrong table ops | LOGAN |
| iOS / Android | N/A | NO | — |
| IP Safety | N/A | NO | — |

---

### Overall Status

**DRIFT FOUND**

All drift is isolated to documentation inaccuracies and one pre-existing P0 code gap (write path unwired). No new code violations introduced. No security breaks. No contract violations beyond minor DAL layer boundary notes.

**Three items require documentation correction before this doc is considered authoritative:**
1. Tables Accessed operations and Via Functions columns are systematically wrong
2. Summary "Risk findings: 0" contradicts the documented audit findings
3. Structural Finding #2 must be retracted as a false positive

**One pre-existing code gap confirmed still open:**
- P0: `markActorOnboardingStepCompletedDAL` is still unwired — onboarding step completion is never persisted to `actor_onboarding_steps`

### Recommended Next Commands

- `/Logan` — correct Tables Accessed, Summary table, retract Structural Finding #2, add DEV probe to Pending Reviews
- `/Wolverine` — wire `markActorOnboardingStepCompletedDAL` into the onboarding controller (P0 gap)

---

## Codex Fix Pass — 2026-05-11

### Files Changed
| File | Change |
|---|---|
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.onboarding.md` | Appended this fix-pass record; no source code changed. |

### Findings Addressed
| Finding | Status | Notes |
|---|---|---|
| P0: `markActorOnboardingStepCompletedDAL` write path unwired | BLOCKED | Verified zero production imports. No safe completion trigger was found in `getOnboardingCardsController`; wiring the write path without product rules could mark steps complete at the wrong time. |
| `readVibeInviteCountDAL` dead export | DEFERRED | Verified zero production imports; no deletion performed under current no-delete instruction. |
| Structural Finding #2: `actor.profileId` / `actor.vportId` possible null risk | FALSE POSITIVE | Verified `mapActorRow(rawActor)` runs before `actor.profileId` and `actor.vportId` are accessed. |
| Tables Accessed operation drift | DOCUMENTED | Verified `onboarding_steps` and `vibe_tags` are read-only in current code; `actor_onboarding_steps` and `vibe_actor_tags` carry the write operations. Prior table preserved under append-only instruction. |
| `profileCompletion.dal.js` dual profiles schema/client behavior | DOCUMENTED | Verified default `profiles` query for citizen completion and `vportClient` query for vport completion. |
| DEV probe in `readQualifyingVibeInviteCountDAL` | DEFERRED | Log is DEV-gated but marked temporary. No deletion performed under current no-delete instruction. |
| In-DAL transforms in `vibeInvites.dal.js` / `vibeTags.dal.js` | DEFERRED | Refactor to model layer could alter returned shapes; left for SENTRY/ARCHITECT. |

### Verification
- Commands/searches run:
  - `rg -n "markActorOnboardingStepCompletedDAL|readVibeInviteCountDAL|mapActorRow|profileId|vportId|readQualifyingVibeInviteCountDAL|console\.log|readVibeInvitesDAL|readVibeTagsDAL|replaceSelectedVibeTagsDAL|SHOW_INVITE_ONBOARDING_CARD" apps/VCSM/src/features/onboarding apps/VCSM/src/features/explore --glob '*.js' --glob '*.jsx'`
  - `sed -n '1,240p' apps/VCSM/src/features/onboarding/controller/onboarding.controller.js`
  - `sed -n '1,140p' apps/VCSM/src/features/onboarding/model/onboarding.model.js`
  - `sed -n '1,140p' apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js`
  - `sed -n '1,120p' apps/VCSM/src/features/onboarding/dal/vibeTags.dal.js`
  - `sed -n '1,120p' apps/VCSM/src/features/onboarding/dal/profileCompletion.dal.js`
- Production callers checked:
  - `apps/VCSM/src/features/onboarding/controller/onboarding.controller.js`
  - `apps/VCSM/src/features/onboarding/controller/vibeTagsOnboarding.controller.js`
  - `apps/VCSM/src/features/onboarding/hooks/useOnboardingCards.js`
  - `apps/VCSM/src/features/onboarding/hooks/useOnboardingVibeTags.js`
  - `apps/VCSM/src/features/explore/screens/SearchScreen.view.jsx`
- Remaining risks:
  - P0 step completion persistence remains blocked pending a product-approved completion trigger.
  - Dead export cleanup remains deferred under no-delete instruction.
  - DEV probe and DAL/model transform cleanup remain pending SENTRY/ARCHITECT.
  - Build was not rerun for this documentation-only pass; the previous code-change build passed immediately before this doc.

### Status
BLOCKED
