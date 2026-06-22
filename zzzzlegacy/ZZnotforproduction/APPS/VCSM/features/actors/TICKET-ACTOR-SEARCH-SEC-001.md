---
ticket: TICKET-ACTOR-SEARCH-SEC-001
type: SEC
app: VCSM
priority: P0
status: In Progress — DB migration pending owner deploy; 2 app gaps open (SURVIVE-001, SURVIVE-002)
date: 2026-06-07
---

# TICKET-ACTOR-SEARCH-SEC-001 — Actor Search Trust Boundary Remediation

## Status

| Phase | Status |
|---|---|
| P0 app patches (3 findings) | DONE |
| P1 app patches (2 findings) | DONE |
| P2 app hardening (2 findings) | DONE |
| DB audit | DONE — migration written |
| DB migration deploy | PENDING — owner deploys manually |
| SURVIVE-001 (explore isUuid consistency) | OPEN |
| SURVIVE-002 (mention chain missing viewerActorId) | OPEN |
| THOR gate | BLOCKED until migration deployed |

## Summary

7 app-layer trust boundary patches applied. DB function audited (SQL provided by owner); 2 critical + 1 high DB findings fixed in migration `20260607100000`. Migration not yet deployed — owner action required. 2 surviving app-layer gaps documented below.

---

## CALLSITE MAP — CURRENT STATE (post-patch baseline)

All surfaces that call `identity.search_actor_directory`. This is the reference
map before any further modifications. Read this before touching any actor search file.

---

### CANONICAL PATH — `features/actors/`

```
searchActorsAdapter (actors.adapter.js)
  └── searchActors (controllers/searchActors.controller.js)
        └── searchActorsDAL (dal/searchActors.dal.js)
              └── supabase.schema('identity').rpc('search_actor_directory', {...})
```

**viewerActorId source:** caller-provided
**Filter logic:** `isUuid(viewerActorId) ? 'all' : 'public'` — UUID-validated ✅
**Limit:** caller-provided, default 12; no server-side cap in app (DB now caps at 100)
**p_offset:** always 0

---

### CALLSITE 1 — Blocks search (`features/settings/privacy/`)

**Purpose:** Authenticated user searches for an actor to block.

```
useActorLookup (hooks/useActorLookup.js)
  │  viewerActorId = identity?.actorId ?? null   ← from useIdentity()
  │  enabled only when !!actorId && query.length >= 2
  └── ctrlSearchActors({ query, viewerActorId })  (controller/Blocks.controller.js)
        └── searchActorsAdapter({ query, limit: 12, viewerActorId })
              └── CANONICAL PATH
```

**viewerActorId source:** `useIdentity()` hook → `identity.actorId` ✅ session-bound
**Filter at DAL:** `isUuid(viewerActorId) ? 'all' : 'public'` ✅
**Gap:** none — fully patched

---

### CALLSITE 2 — Mention autocomplete (`features/upload/`)

**Purpose:** Authenticated user types `@prefix` in post caption to mention a user/vport.

```
useMentionAutocomplete (hooks/useMentionAutocomplete.js)
  │  NO identity read — hook never calls useIdentity()
  │  NO viewerActorId available at this layer
  └── ctrlSearchMentionSuggestions({ query, limit: 8 })  (controllers/searchMentionSuggestions.controller.js)
        │  viewerActorId NOT in signature — never passed
        └── searchMentionSuggestions(prefix, { limit })  (dal/searchMentionSuggestions.dal.js)
              │  viewerActorId = null  (default — never supplied by controller)
              │  p_filter = null ? 'all' : 'public' → always 'public'
              └── supabase.schema('identity').rpc('search_actor_directory', {
                    p_viewer_actor_id: null,
                    p_filter: 'public'
                  })
```

**viewerActorId source:** hardcoded null — architecture gap ❌ (SURVIVE-002)
**Filter result:** always `'public'` — authenticated users see public-only mention results
**Security status:** SAFE (no null+all possible)
**UX impact:** authenticated users cannot @-mention private actors
**Fix required:** thread `viewerActorId` from identity through controller to DAL

---

### CALLSITE 3 — Chat actor search (`features/chat/setup.js`)

**Purpose:** Chat engine's actor search (new conversation recipient lookup).

```
searchActors(query, limit)  (chat/setup.js — local function, NOT the canonical controller)
  │  viewerActorId = useIdentitySelectionStore.getState().activeActorId ?? null
  │                  ← non-reactive Zustand read, safe for non-hook context
  └── supabase.schema('identity').rpc('search_actor_directory', {
        p_viewer_actor_id: viewerActorId,
        p_filter: viewerActorId ? 'all' : 'public'   ← truthy check (not isUuid)
      })
```

**viewerActorId source:** Zustand store `activeActorId` ✅ session-bound
**Filter logic:** truthy check `viewerActorId ? 'all' : 'public'` — not `isUuid()` ⚠️
**Inconsistency:** canonical DAL uses `isUuid()`; this callsite uses truthy check
**Security impact:** low — store returns session UUID or null, not caller-injected value
**Gap:** minor inconsistency only; not an injection vector

---

### CALLSITE 4 — Explore search (`features/explore/`)

**Purpose:** Explore tab search — actors, VPORTs, features (all/users/vports filter tabs).

```
useSearchResults (hooks/useSearchResults.js)   ← assumed; reads useIdentity()
  │  viewerActorId from useIdentity()
  └── ctrlSearchResults({ query, filter, viewerActorId })  (controllers/searchResults.controller.js)
        └── searchDal(trimmed, filter, { viewerActorId })  (dal/search.dal.js)
              │  searchActors(rawQuery, { viewerActorId, filter, limit: 25 })
              │  safeFilter = viewerActorId ? mapFilter(filter) : 'public'   ← truthy check
              │                                                                  (SURVIVE-001)
              └── supabase.schema('identity').rpc('search_actor_directory', {
                    p_viewer_actor_id: viewerActorId,
                    p_filter: safeFilter
                  })
```

**viewerActorId source:** `useIdentity()` → threaded through controller ✅
**Filter logic:** `viewerActorId ? mapFilter(filter) : 'public'` — truthy check ⚠️ (SURVIVE-001)
**SURVIVE-001:** should be `isUuid(viewerActorId) ? mapFilter(filter) : 'public'`
**Security impact:** low — viewerActorId comes from session hook, not caller input
**Fix:** one-line change; add `isUuid` import + swap truthy to UUID check

---

### CALLSITE 5 — VPORT team candidate search (`features/vportDashboard/`)

**Purpose:** Dashboard owner searches for actors to add as team members.

```
useVportTeamAccess (hooks/useVportTeamAccess.js)
  │  sessionActorId from useIdentity()
  │  searchCandidates(query) calls:
  │    searchTeamCandidatesController({ query, viewerActorId: sessionActorId })
  │                                     ↑ dead param — controller ignores it
  └── searchTeamCandidatesController({ query })  (controller/vportTeamAccess.controller.js)
        │  viewerActorId = useIdentitySelectionStore.getState().activeActorId ?? null
        │                  ← non-reactive Zustand read; ignores caller-provided viewerActorId
        └── searchActorsAdapter({ query, limit: 12, viewerActorId })
              └── CANONICAL PATH
```

**viewerActorId source:** Zustand store `activeActorId` ✅ session-bound; not caller-injected
**Filter at DAL:** `isUuid(viewerActorId) ? 'all' : 'public'` ✅ (canonical path)
**Dead parameter:** hook passes `viewerActorId: sessionActorId` → controller ignores it
**Cleanup needed:** remove `viewerActorId: sessionActorId` from hook callsite (cosmetic)

---

### SURFACE SUMMARY

| Callsite | viewerActorId Source | Filter Logic | isUuid() | Status |
|---|---|---|---|---|
| Canonical DAL | caller-provided | `isUuid()` | ✅ | Baseline |
| Blocks search | `useIdentity()` | `isUuid()` (via canonical) | ✅ | PATCHED |
| Mention autocomplete | always null | always 'public' | N/A | SURVIVE-002 open |
| Chat search | Zustand store | truthy check | ❌ | minor inconsistency |
| Explore search | `useIdentity()` | truthy check | ❌ | SURVIVE-001 open |
| Team search | Zustand store | `isUuid()` (via canonical) | ✅ | PATCHED |

---

## CONFIRMED VULNERABILITIES

### P0-1 — Blocks controller dropped viewerActorId (CONFIRMED / PATCHED)

**File:** `features/settings/privacy/controller/Blocks.controller.js`
**Finding:** `ctrlSearchActors({ query })` — no viewerActorId parameter. The hook
(`useActorLookup.js`) had `actorId` available but never forwarded it. Authenticated
users searching for actors to block received public-only results (visibility "public")
instead of "all", making it impossible to locate private actors.

**Root Cause:** Missing parameter threading from hook → controller → adapter → DAL.

**Patch:**
- `Blocks.controller.js:54` — `ctrlSearchActors` now accepts `viewerActorId = null`
  and forwards it to `searchActorsAdapter`
- `useActorLookup.js:28` — queryFn now passes `viewerActorId: actorId`

**Invariant enforced:**
- Authenticated block search: viewerActorId = actorId → visibility "all"
- Unauthenticated: falls through to DAL default → visibility "public"

---

### P0-2 — Mention suggestions hardcoded p_filter='all' (CONFIRMED / PATCHED)

**File:** `features/upload/dal/searchMentionSuggestions.dal.js`
**Finding:** `p_filter: 'all'` hardcoded at line 29. When `viewerActorId = null`
(unauthenticated or mention triggered before identity hydration), the RPC was called
with null viewer + "all" filter — the exact Must Never Happen combination.

**Patch:**
- Line 23: `const p_filter = viewerActorId ? 'all' : 'public'`
- RPC call now uses `p_filter` (derived) instead of hardcoded literal

**Invariant enforced:**
- viewerActorId present → p_filter = 'all'
- viewerActorId null → p_filter = 'public'
- The combination (null viewer, 'all') is now impossible at the app layer

---

### P0-3 — assertActorId accepted null/empty/invalid UUIDs (CONFIRMED / PATCHED)

**File:** `state/actors/assertActorId.js`
**Finding:** Old implementation: `if (actor && typeof actor !== "string")` — only
threw when actor was non-null AND non-string. This means:
  - `assertActorId(null)` → no throw (falsy short-circuit)
  - `assertActorId("")` → no throw (falsy short-circuit)
  - `assertActorId("not-a-uuid")` → no throw (string type passes)
  - `assertActorId("injected-string")` → no throw

The function provided zero protection against malformed or injected actor IDs.

**Patch:**
- Import `isUuid` from `@/services/supabase/postgrestSafe`
- New gate: rejects null, undefined, empty strings, non-strings, and non-UUID strings
- Added `label` parameter (callers at `VportReviews.controller.js` already pass it;
  previously silently ignored)

**Invariant enforced:**
- Only valid RFC-4122 UUID strings pass
- All other inputs throw immediately with a labeled error message

---

## P1 REMEDIATIONS

### P1-4 — Chat actor search hardcoded p_filter='all' (CONFIRMED / PATCHED)

**File:** `features/chat/setup.js`
**Finding:** `searchActors()` correctly reads `viewerActorId` from
`useIdentitySelectionStore.getState().activeActorId` but then hardcodes
`p_filter: 'all'`. If the store returns null (unauthenticated session or
pre-hydration race), the RPC executes with null viewer + 'all' filter.

**Patch:**
- Line 56: `p_filter: viewerActorId ? 'all' : 'public'`

**Hydration race note:** The existing code already handles the null case correctly
at the identity store level. The filter derivation now mirrors that same null check
so both are coherent.

---

### P1-5 — Explore search: null viewer could pass 'all' filter (CONFIRMED / PATCHED)

**File:** `features/explore/dal/search.dal.js`
**Finding:** `searchActors()` accepted `viewerActorId = null` and `filter = 'all'`
from callers independently. `mapFilter('all')` returns `'all'` — so an unauthenticated
user hitting the default "all" tab sent `p_viewer_actor_id: null, p_filter: 'all'`.

Note: `p_filter` here also controls entity type (users/vports). The `'public'`
override collapses entity-type filtering for unauthenticated users — they see only
public actors across all types. This is the correct and safe behavior.

**Patch:**
- Line 18: `const safeFilter = viewerActorId ? mapFilter(filter) : 'public'`
- RPC call uses `safeFilter` instead of `mapFilter(filter)` directly

localStorage filter manipulation (changing the `filter` tab value) cannot bypass
visibility because `safeFilter` ignores `mapFilter()` entirely when viewer is null.

---

## P2 HARDENINGS

### P2-6 — Canonical searchActorsDAL: truthy check not UUID validation (CONFIRMED / PATCHED)

**File:** `features/actors/dal/searchActors.dal.js`
**Finding:** `const filter = viewerActorId ? 'all' : 'public'` — a truthy string
like `"injected-id"` or `"false"` would pass as 'all'. The canonical DAL is the
last app-layer gate before the RPC call.

**Patch:**
- Import `isUuid` added alongside existing `toContainsPattern`
- Line 9: `const filter = isUuid(viewerActorId) ? 'all' : 'public'`
- Only RFC-4122 UUIDs elevate visibility to 'all'. All other values stay 'public'.

---

### P2-7 — VPORT team candidate search: viewerActorId from caller params (CONFIRMED / PATCHED)

**File:** `features/vportDashboard/dashboard/cards/team/controller/vportTeamAccess.controller.js`
**Finding:** `searchTeamCandidatesController({ query, viewerActorId })` — the
controller accepted `viewerActorId` from the caller without binding to the active
session. A caller could inject any actor ID to elevate search visibility.

The legitimate caller (`useVportTeamAccess.js:85`) already derives `sessionActorId`
from `useIdentity()` and passes it correctly — the vulnerability was in the controller
accepting it uncritically rather than deriving it independently.

**Patch:**
- Import `useIdentitySelectionStore` from `@/state/identity/identitySelection.store`
- Controller now ignores caller-provided `viewerActorId` (param removed from signature)
- Derives: `const viewerActorId = useIdentitySelectionStore.getState().activeActorId ?? null`
- The hook still passes `viewerActorId: sessionActorId` (no-op — controller ignores it)
  — the hook can be cleaned up in a follow-up ticket

---

## PHASE 4 — DATABASE AUDIT: COMPLETE

**Function:** `identity.search_actor_directory`
**Status:** SQL definition provided by owner; full audit executed; remediation migration written.

**Full audit report:**
`ZZnotforproduction/APPS/VCSM/features/actors/outputs/2026/06/07/REDTEAM/2026-06-07_db-audit_identity-search-actor-directory.md`

**Remediation migration (owner deploys manually):**
`supabase/migrations/20260607100000_harden_identity_search_actor_directory.sql`

### Confirmed DB Findings

| ID | Severity | Description | Status |
|---|---|---|---|
| DB-CRITICAL-1 | CRITICAL | No auth.uid() validation — cross-actor UUID spoofing enables block bypass | FIXED in migration |
| DB-CRITICAL-2 | CRITICAL | p_limit uncapped — full directory extraction possible | FIXED in migration (cap 100) |
| DB-HIGH-1 | HIGH | Private actors visible to ALL authenticated users; no relationship gate | DESIGN — confirm intent |
| DB-HIGH-2 | HIGH | Nil UUID (v0) bypasses app isUuid() but passes PostgreSQL type check | FIXED in migration (ownership verification) |
| DB-MEDIUM-1 | MEDIUM | LIKE '%q%' leading wildcard forces seq scan; DoS vector for short queries | NOT FIXED — out of scope |
| DB-LOW-1 | LOW | Rank threshold 0.05 too permissive; single-char enumeration possible | NOT FIXED — out of scope |

### Test Cases A–D — Final Verdicts

| Case | Input | Pre-patch | Post-patch |
|---|---|---|---|
| A | null viewer + 'all' | public only ✅ | public only ✅ |
| B | invalid UUID | PostgreSQL type error ✅ | same ✅ |
| B-prime | nil UUID + 'all' | **private actors leaked** ❌ | public only ✅ |
| C | authenticated actor + 'all' | authenticated visibility ✅ | authenticated visibility ✅ |
| D | private actor, anon viewer | not returned ✅ | not returned ✅ |

---

## FILES CHANGED

| File | Change |
|---|---|
| `features/settings/privacy/controller/Blocks.controller.js` | ctrlSearchActors: accept + forward viewerActorId |
| `features/settings/privacy/hooks/useActorLookup.js` | Pass viewerActorId: actorId to ctrlSearchActors |
| `features/upload/dal/searchMentionSuggestions.dal.js` | Derive p_filter from viewerActorId; remove hardcoded 'all' |
| `state/actors/assertActorId.js` | Full UUID validation gate; add label param; import isUuid |
| `features/chat/setup.js` | p_filter derived from viewerActorId (null → 'public') |
| `features/explore/dal/search.dal.js` | safeFilter: null viewer always forces 'public' |
| `features/actors/dal/searchActors.dal.js` | isUuid() replaces truthy check for visibility elevation |
| `features/vportDashboard/dashboard/cards/team/controller/vportTeamAccess.controller.js` | viewerActorId bound to session; caller param removed |

---

## REMAINING THOR BLOCKERS

1. **DB migration undeployed** — `supabase/migrations/20260607100000_harden_identity_search_actor_directory.sql`
   must be deployed by the owner before THOR. Until deployed, DB-CRITICAL-1 and DB-CRITICAL-2
   remain live in production. App-layer fixes are defense-in-depth only against direct RPC calls.

2. **assertActorId behavioral change** — callers in `VportReviews.controller.js` that
   previously relied on null-passthrough behavior will now throw on null/empty inputs.
   These call sites should be integration-tested before release.

3. **Private actor design intent** — DB-HIGH-1: all authenticated users see private actors.
   If "private" means follower-gated discoverability, a second migration is required.
   Confirm platform intent before THOR.

4. **Hook cleanup** — `useVportTeamAccess.js:85` still passes `viewerActorId: sessionActorId`
   to `searchTeamCandidatesController`, which now ignores it. Harmless but should be
   cleaned up for clarity.

5. **ELEK-2026-06-04-001** — HTML injection in `m/[actorId]` edge function — separate
   edge function audit required; out of scope for this ticket.

---

## ACTOR VISIBILITY LEAKS — POST-REMEDIATION STATUS

After these patches, the following combinations are now **impossible at the app layer**:

| Combination | Before | After |
|---|---|---|
| null viewer + p_filter='all' (mentions) | Possible | Eliminated |
| null viewer + p_filter='all' (chat) | Possible | Eliminated |
| null viewer + p_filter='all' (explore) | Possible (default tab) | Eliminated |
| invalid UUID → visibility 'all' (canonical DAL) | Possible | Eliminated |
| injected viewerActorId → elevated visibility (team) | Possible | Eliminated |
| null/empty/malformed UUID passing assertActorId | Possible | Eliminated |
| Authenticated block search seeing private actors | Broken | Fixed |

**Remaining risk:** DB function behavior is unverified. If `identity.search_actor_directory`
does not enforce visibility server-side (relies entirely on p_filter), a direct RPC
call bypassing the app layer would still leak private actors.
