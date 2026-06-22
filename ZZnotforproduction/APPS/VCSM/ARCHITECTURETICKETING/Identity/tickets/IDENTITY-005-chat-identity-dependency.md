# [IDENTITY-005] Chat → Identity Dependency Audit

Status: Complete
Priority: P2
Type: TASK
Weight: Medium
Risk: LOW

**Completed:** 2026-06-06
**Source files read:**
- `FEATURE_IMPORT_MAP.json` (chat outbound section — lines 1294–1600)
- `apps/VCSM/src/features/chat/inbox/hooks/useVexSettings.js`
- `apps/VCSM/src/features/chat/setup.js`
- `apps/VCSM/src/features/identity/adapters/identity.adapter.js`
- `apps/VCSM/src/features/identity/adapters/identityOps.adapter.js`
- `apps/VCSM/src/state/identity/identityContext.jsx`
- `apps/VCSM/src/state/identity/identitySelection.store.js`

---

## Goal

Map every identity import inside `features/chat/`, classify each import path, and determine
whether IDENTITY-010 is required before any implementation work.

---

## CRITICAL FINDING — Architecture Review Claim Not Confirmed

**FEATURES_ARCHITECTURE_REVIEW.md stated:**
> "Imports from `@identity` engine directly (16x in chat feature) AND uses `@/features/identity/` (8x).
> Mixed consumption of engine alias vs feature adapter."

**Source grep result:**
```
grep -rn "@identity" apps/VCSM/src/features/chat/ → 0 results
```

**There are NO `@identity` engine alias imports in the chat feature.** The architecture review
claim of "16 engine alias imports" is NOT confirmed in the current source. The claim was either:
a) Written against an older codebase state that has since been refactored, or
b) The reviewer conflated `@/state/identity/` (app state layer) with `@identity` (engine alias)

**All RISK-004 analysis based on this claim must be revised.** See RISK-004 UPDATE section below.

---

## Third Identity Layer Discovered

The audit revealed a third identity layer that was not documented in any prior planning file:

| Layer | Path | What It Is |
|---|---|---|
| Engine | `engines/identity/` (via `@identity` alias) | Raw cross-app identity engine |
| State | `apps/VCSM/src/state/identity/` (via `@/state/identity/`) | App-level React context, Zustand store, controller, DAL, model |
| Feature adapter | `apps/VCSM/src/features/identity/adapters/` (via `@/features/identity/adapters/`) | Thin re-export wrapper over the state layer |

The `features/identity/adapters/identity.adapter.js` is a **thin re-export**:
```js
// identity.adapter.js — full content
export { useIdentityOps } from '@/features/identity/hooks/useIdentityOps'
export {
  ensureVcsmPlatformBootstrap,
  refreshVcActorDirectory,
} from '@/features/identity/adapters/identityOps.adapter'
export { useIdentity, IdentityProvider } from '@/state/identity/identityContext'
```

The feature adapter does NOT implement `useIdentity`. It re-exports it from `state/identity/identityContext`.
The canonical identity implementation lives in `state/identity/`, not `features/identity/`.

**Implication:** A direct import from `@/state/identity/identityContext` is functionally identical
to an import through the feature adapter, but bypasses the governance boundary.

---

## Complete Chat Identity Import Inventory

### Summary

| Category | Count | Compliant |
|---|---|---|
| Feature adapter imports (`@/features/identity/adapters/identity.adapter`) | 8 | YES — confirmed by scanner |
| State layer direct imports (`@/state/identity/identityContext`) | 1 | BYPASS — skips feature adapter |
| State store direct imports (`@/state/identity/identitySelection.store`) | 1 | STATE_STORE — not in feature adapter surface |
| Engine alias imports (`@identity`) | **0** | N/A — none found |
| **Total** | **10** | — |

---

### Category 1 — Feature Adapter Imports (8 sites) — COMPLIANT

All 8 imports use `@/features/identity/adapters/identity.adapter` and import `useIdentity`.
All confirmed COMPLIANT by scanner (0 violations). All are screen-level files that need the
current actor context to render actor-scoped UI.

| File | Imported Symbol | Use Case |
|---|---|---|
| `chat/conversation/screen/ConversationScreen.jsx:11` | `useIdentity` | Reads `actorId` for conversation context |
| `chat/conversation/screen/ConversationView.jsx:4` | `useIdentity` | Reads actor identity for message rendering |
| `chat/inbox/screens/ArchivedInboxScreen.jsx:5` | `useIdentity` | Reads actor for inbox scoping |
| `chat/inbox/screens/InboxScreen.jsx:5` | `useIdentity` | Reads actor for inbox scoping |
| `chat/inbox/screens/RequestsInboxScreen.jsx:5` | `useIdentity` | Reads actor for requests inbox |
| `chat/inbox/screens/SpamInboxScreen.jsx:5` | `useIdentity` | Reads actor for spam inbox |
| `chat/inbox/screens/settings/BlockedUsersScreen.jsx:14` | `useIdentity` | Reads actor for block list scoping |
| `chat/start/hooks/useStartConversation.js:19` | `useIdentity` | Reads `actorId` as sender actor |

**Pattern:** All 8 are inbox screen or conversation screen reads of `identity.actorId` to scope
the UI or the conversation context to the active actor. Correct use.

---

### Category 2 — State Layer Direct Import (1 site) — BYPASS

| File | Import Path | Imported Symbol | Use Case |
|---|---|---|---|
| `chat/inbox/hooks/useVexSettings.js:2` | `@/state/identity/identityContext` | `useIdentity` | Reads `identity.actorId` to scope localStorage key |

**What it does:**
```js
const { identity } = useIdentity();
const actorId = identity?.actorId ?? null;
const storageKey = useMemo(() => buildStorageKey(actorId), [actorId]);
```
Reads the actor ID to create an actor-scoped localStorage key for inbox display preferences
(`hideEmptyConversations`, `showThreadPreview`). Pure local state — no DB access.

**Why this is a bypass:**
`useIdentity` is re-exported from `@/state/identity/identityContext` through the feature adapter.
`useVexSettings.js` skips the adapter and imports from the state layer directly.

**Functional impact:** NONE — imports the same function from the same underlying source.
`features/identity/adapters/identity.adapter` exports `useIdentity` from `state/identity/identityContext`,
so the result is identical. The bypass only matters for governance: if the feature adapter
ever adds middleware or changes the re-export path, `useVexSettings.js` will not benefit.

**Risk:** LOW — functionally identical today. Policy compliance issue, not a behavioral issue.

---

### Category 3 — State Store Direct Import (1 site) — STATE_STORE

| File | Import Path | Imported Symbol | Use Case |
|---|---|---|---|
| `chat/setup.js:16` | `@/state/identity/identitySelection.store` | `useIdentitySelectionStore` | Reads `activeActorId` synchronously in a non-React async function |

**What it does:**
```js
// Inside searchActors() — a non-React async function injected into configureChatEngine()
const viewerActorId = useIdentitySelectionStore.getState().activeActorId ?? null
```
`chat/setup.js` configures the chat engine via dependency injection at app startup. The
`searchActors` function it defines runs in a non-React context (it is an async function, not
a hook). Zustand's `.getState()` pattern is the correct way to read store state outside React.

**Why `useIdentitySelectionStore` is NOT in the feature adapter:**
`features/identity/adapters/identity.adapter.js` exports:
- `useIdentity` (React hook — React context)
- `IdentityProvider` (React provider)
- `useIdentityOps` (React hook — operations)
- `ensureVcsmPlatformBootstrap` (controller function)
- `refreshVcActorDirectory` (controller function)

None of these are usable in a non-React async function. The Zustand store is the only identity
primitive accessible synchronously outside React. There is no adapter-safe way to read the
active actor ID in a non-React context with the current feature adapter surface.

**Risk:** LOW-MEDIUM. The Zustand store is not a governed surface — any change to `identitySelection.store`
would silently break `chat/setup.js`'s actor search function. This creates an implicit contract
between the store shape and the chat engine setup that is not enforced by the feature adapter.

---

## Feature Adapter Surface — Confirmed

From source reading of `identity.adapter.js` and `identityOps.adapter.js`:

| Export | Source | Classification |
|---|---|---|
| `useIdentity` | `@/state/identity/identityContext` | React hook — session identity read |
| `IdentityProvider` | `@/state/identity/identityContext` | React provider |
| `useIdentityOps` | `@/features/identity/hooks/useIdentityOps` | React hook — identity operations |
| `ensureVcsmPlatformBootstrap` | `controller/ensureVcsmPlatformBootstrap.controller.js` | Controller function |
| `refreshVcActorDirectory` | `controller/refreshActorDirectory.controller.js` | Controller function |

**Not in adapter surface:** `useIdentitySelectionStore` (Zustand store) — no React-context equivalent exists.

---

## What `state/identity/` Contains

The `state/identity/` directory is the canonical identity implementation layer for VCSM:

| File | Role |
|---|---|
| `identityContext.jsx` | React context + `useIdentity()` hook + `IdentityProvider` + `switchActor()` |
| `identitySelection.store.js` | Zustand store: `{ activeActorId, activeActorKind, activeActorLinkId }` |
| `identity.controller.js` | Identity resolution controller |
| `identity.read.dal.js` | Identity DAL (reads from DB) |
| `identity.model.js` | Identity model: `toPublicIdentity()`, `getIdentityEngineContext()`, `isBlockedVportIdentity()` |
| `identityResolutionSelfHeal.helper.js` | Self-heal helper |
| `identitySelfHeal.controller.js` | Self-heal controller |
| `identityStorage.js` | LocalStorage persistence for actor selection |
| `identitySelectors.js` | Zustand selectors |
| `useIdentityResolutionEffect.hook.js` | Resolution effect hook |
| `useIdentitySync.js` | Sync hook |
| `controller/switchActor.controller.js` | Actor switching controller |
| `queries/identityEngineQuery.js` | React Query wrapper for engine query |
| `IdentityDebugger.jsx` | Dev-only debugger component |
| `identitySwitcher.jsx` | Actor switcher UI component |

`identityContext.jsx` itself uses `@identity` (engine alias) at line 5:
```js
import { invalidateIdentityResultCache } from "@identity";
```

This is one engine alias import — in the state layer, not in the feature layer.

---

## RISK-004 UPDATE — Architecture Review Was Wrong

**Original RISK-004:** "Engine alias vs feature adapter inconsistency — Chat confirmed to use both paths"

**Correction:** No `@identity` engine alias imports exist in `features/chat/`. The
architecture review claim was inaccurate for the current source state.

**Actual risk (revised):**

| Original RISK-004 | Actual Findings |
|---|---|
| Chat uses `@identity` 16x | Not found in source — 0 engine alias imports |
| Chat uses `@/features/identity/` 8x | Confirmed — all COMPLIANT |
| Risk: engine surface vs feature adapter divergence | Not applicable — no engine alias imports |
| New risk: `useVexSettings.js` bypasses feature adapter | `@/state/identity/identityContext` imported directly |
| New risk: store access policy | `identitySelection.store` accessed directly in setup.js |

RISK-004 must be **reclassified**:
- Drop: engine alias divergence concern (not present)
- Add: `useVexSettings.js` state layer bypass (LOW risk, policy issue)
- Add: store access governance gap (LOW-MEDIUM risk — `identitySelection.store` is an ungoverned surface for setup files)

---

## IDENTITY-010 Verdict

**IDENTITY-010 IS REQUIRED — but scope must change.**

The original IDENTITY-010 scope (engine alias policy) is based on the incorrect architecture
review claim. With 0 engine alias imports found in chat, the original question ("ban `@identity`
in features?") has no evidence base in chat.

**Revised scope for IDENTITY-010:**

1. **State layer access policy:** When is direct access to `@/state/identity/` acceptable vs
   requiring the `@/features/identity/adapters/` path? The current feature adapter is a thin
   re-export — if `state/identity/` internals change, both paths are affected equally. Is there
   value in enforcing the adapter boundary if it's just a re-export?

2. **Store access gap:** `useIdentitySelectionStore` is not in the feature adapter surface.
   Should it be? The only use case found is synchronous store reads in non-React setup files.
   Options:
   - Add a `getActiveActorId()` function to the feature adapter that wraps `useIdentitySelectionStore.getState()`
   - Accept direct store imports in setup files only, document as an allowed pattern
   - Leave as-is (current state)

3. **`useVexSettings.js` fix path:** If IDENTITY-010 decides adapter-only is the policy,
   `useVexSettings.js:2` needs one import change:
   ```diff
   - import { useIdentity } from "@/state/identity/identityContext";
   + import { useIdentity } from "@/features/identity/adapters/identity.adapter";
   ```
   This is a 1-line, zero-behavior change. Can be batched in any PR.

**Does IDENTITY-010 block any implementation?**
Only the `useVexSettings.js` fix (1 line). That is LOW priority and LOW risk. IDENTITY-010
does not block any other work. It should be executed before the `useVexSettings.js` fix is
merged, but it does not gate IDENTITY-011 or IDENTITY-012.

---

## Validation

- [x] All chat identity imports enumerated from scanner + source grep
- [x] 0 `@identity` engine alias imports confirmed (architecture review claim refuted)
- [x] 8 COMPLIANT feature adapter imports confirmed
- [x] 1 state layer bypass in `useVexSettings.js` identified and assessed
- [x] 1 store access in `chat/setup.js` identified and assessed
- [x] Third identity layer (`state/identity/`) documented
- [x] Feature adapter surface confirmed from source
- [x] RISK-004 correction issued
- [x] IDENTITY-010 scope correction issued
- [x] No source file modified

---

## Next Ticket

IDENTITY-010 — Engine Alias Policy (scope must be updated per findings above before execution)
IDENTITY-006, IDENTITY-007, IDENTITY-008 — can now proceed in parallel (unblocked by this ticket)
