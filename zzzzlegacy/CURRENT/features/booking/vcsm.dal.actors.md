# VCSM DAL — Actors

_Domain:_ `vcsm`
_System:_ `dal`
_Topic:_ `actors`
_Filename:_ `vcsm.dal.actors.md`

---

## 1 Purpose

Documents the data access layer for the `actors` feature inside `apps/VCSM/`. This feature provides shared actor lookup and search primitives consumed by booking, chat, vport team management, and the hydration engine. It does not own a standalone UI — it is a shared data-access boundary.

---

## 2 Scope

**Included:**
- DAL files in `apps/VCSM/src/features/actors/dal/`
- Model files in `apps/VCSM/src/features/actors/model/`
- Controller files in `apps/VCSM/src/features/actors/controllers/`
- Adapter file in `apps/VCSM/src/features/actors/adapters/`
- Known callers across VCSM app features

**Excluded:**
- The canonical `getActorSummariesByIdsDAL` implementation (lives in `engines/hydration/src/dal.js`)
- The `search_actor_directory` Supabase RPC definition (lives in Supabase `identity` schema)
- Engine-internal use of these functions (documented in engine audit files)

---

## 3 Ownership

**Application Scope:** VCSM
**Code Root:** `apps/VCSM/src/features/actors/`
**Related Engines:** `engines/hydration/` (canonical actor data source)
**Primary Consumers:** booking feature, chat feature, vport dashboard feature

---

## 4 Entry Points

**DAL files:**
- ~~`features/actors/dal/getActorSummariesByIds.dal.js`~~ — DELETED 2026-05-12 (re-export shim, zero callers)
- `features/actors/dal/searchActors.dal.js` — RPC call to `identity.search_actor_directory`

**Controllers:**
- ~~`features/actors/controllers/hydrateActors.controller.js`~~ — DELETED 2026-05-12 (re-export shim, zero callers)
- `features/actors/controllers/searchActors.controller.js` — composes DAL + model

**Models:**
- ~~`features/actors/model/extractActorIdsForHydration.model.js`~~ — DELETED 2026-05-14 (ENGINE scope cleanup, zero callers in VCSM)
- `features/actors/model/searchActors.model.js`

**Adapter:**
- `features/actors/adapters/actors.adapter.js` — approved public boundary exporting `searchActorsAdapter(params)`

**RPCs:**
- `identity.search_actor_directory` — actor directory search, called by `searchActorsDAL`

---

## 5 Data Flow

### Actor Hydration Path

```
Consumer (booking / chat / engine)
  → fetchActorSummaries() — imported from @hydration directly (renamed from getActorSummariesByIdsDAL per 2026-05-14 engine cleanup)
    → engines/hydration/src/dal.js (canonical implementation)
      → Supabase (actor data)
```

> `features/actors/dal/getActorSummariesByIds.dal.js` was a re-export shim — DELETED 2026-05-12. All callers import from `@hydration` directly using `fetchActorSummaries`.

### Actor Search Path (correct)

```
Consumer (searchActors.controller.js)
  → searchActorsDAL()
    → identity.search_actor_directory (RPC)
      → Supabase identity schema
        → searchActors.model.js (transform)
```

### Actor Search Path (approved cross-feature)

```
Cross-feature consumer
  → actors.adapter.js
    → searchActors.controller.js
      → searchActorsDAL()
      → identity.search_actor_directory (RPC)
```

---

## 6 Source of Truth

| Data | Source | Notes |
|---|---|---|
| Actor summaries | `engines/hydration/src/dal.js` | Canonical. VCSM DAL file is shim only. |
| Actor search results | `identity.search_actor_directory` RPC | Supabase `identity` schema |
| Actor store (cached) | `engines/hydration/src/store.js` | Zustand, 5min TTL |

---

## 7 UI States

Not applicable — this feature is a shared data-access layer with no standalone UI. UI states are owned by the consuming feature screens (booking, chat, vport team).

---

## 8 Dependencies

**Internal modules:**
- `engines/hydration/` — provides `getActorSummariesByIdsDAL`, `hydrateActorsFromRows`, `hydrateActorsByIds`, `hydrateAndReturnSummaries`
- `apps/VCSM/src/features/actors/model/` — transforms RPC rows into domain shapes

**External services:**
- Supabase — `identity` schema, `search_actor_directory` RPC

**Database objects:**
- `identity.search_actor_directory` — RPC, owned by Supabase identity schema

**Consumers of this feature's exports (verified):**
- `features/booking/controller/listMyBookings.controller.js` — uses `fetchActorSummaries` via `@hydration` (renamed from `getActorSummariesByIdsDAL` per 2026-05-14 engine cleanup)
- `features/chat/setup.js` — wraps `hydrateAndReturnSummaries` from `@hydration` as local `getActorSummariesByIds`
- `features/dashboard/vport/controller/vportTeamAccess.controller.js` — uses `searchActorsAdapter` via approved actors adapter boundary
- `engines/chat/` — uses `getActorSummariesByIdsDAL` via `@hydration`

---

## 9 Rules / Invariants

1. All callers of `getActorSummariesByIdsDAL`, `hydrateActorsByIds`, and `hydrateActorsFromRows` must import from `@hydration` directly. No actors-feature shim path exists — `getActorSummariesByIds.dal.js` and `hydrateActors.controller.js` were deleted (2026-05-12).
2. Cross-feature callers of actor search must go through `actors.adapter.js` → `searchActors.controller.js`. Direct cross-feature DAL imports are forbidden by the architecture contract.
3. `actors.adapter.js` exposes `searchActorsAdapter(params)` as the approved public actor-search surface for cross-feature narrow actor lookups (team search, block search). Feature-owned search domains (Explore, Upload mention suggestions, Chat DI wiring) may call `identity.search_actor_directory` via their own DAL → Controller → Hook chain without routing through the actors adapter.
4. DAL files must not call engine functions as side effects. `hydrateActorsByIds` and `hydrateActorsFromRows` belong in the controller or hook layer only.
5. `select('*')` is banned — all Supabase queries must use explicit column lists. The `searchActors.dal.js` RPC call complies (RPC returns a defined contract).
6. `searchActors.dal.js` returns raw RPC rows only — no inline transform. SENTRY-F-02 (inline DAL transform) was resolved 2026-05-14: all row mapping now belongs exclusively to `searchActors.model.js`. Do not add transform logic to the DAL.

---

## 10 Failure Risks

| Risk | ID | Severity | Status | Handoff |
|---|---|---|---|---|
| Redundant re-export shims — `getActorSummariesByIds.dal.js` + `hydrateActors.controller.js` | RISK-1 | LOW | FIXED | Wolverine (2026-05-12) |
| `vportTeamAccess.controller.js` imports `searchActorsDAL` directly across feature boundary | RISK-2 | HIGH | FIXED | SENTRY (verified) |
| `actors.adapter.js` is an empty stub — cross-feature callers have no approved boundary to use | RISK-3 | HIGH | FIXED | SENTRY (verified) |
| `chat/setup.js` inline RPC — `viewerActorId` now wired from identity store | RISK-4 | MEDIUM | FIXED | Wolverine (2026-05-14) |
| `explore/dal/search.dal.js` reimplements `searchActors` locally — feature-owned domain | RISK-5 | LOW | RECLASSIFIED — no action | IRONMAN (verified: feature-owned) |
| `blocks.dal.js` reimplements `search_actor_directory` locally | RISK-6 | MEDIUM | FIXED | SENTRY (verified) |
| `upload/dal/searchMentionSuggestions.dal.js` distinct mention contract | RISK-7 | LOW | RECLASSIFIED — no action | IRONMAN (verified: feature-owned) |
| `searchActors.controller.js` silently drops `viewerActorId` | RISK-8 | HIGH | FIXED | SENTRY (verified) |
| `MyAppointmentsView.jsx` calls `hydrateActorsByIds` directly from view layer | RISK-9 | LOW | FIXED | Wolverine (2026-05-12) |
| `searchActors.dal.js` inline DAL transform (lines 21–30) | SENTRY-F-02 | LOW | FIXED | Wolverine (2026-05-14) |

**RISK-1 detail:** Fixed. Both shim files (`features/actors/dal/getActorSummariesByIds.dal.js` and `features/actors/controllers/hydrateActors.controller.js`) deleted 2026-05-12. Zero callers confirmed before deletion. All VCSM callers already imported from `@hydration` directly.

**RISK-2 detail:** Fixed. `vportTeamAccess.controller.js` now imports `searchActorsAdapter` from `@/features/actors/adapters/actors.adapter` and no longer imports the actors DAL directly.

**RISK-3 detail:** Fixed. `actors.adapter.js` now exports `searchActorsAdapter(params)` and delegates through the actors controller.

**RISK-4 detail:** Fixed. `chat/setup.js` still owns the RPC call (approved per §9 Rule 3 — chat DI wiring is a feature-owned domain). `p_viewer_actor_id` now reads `useIdentitySelectionStore.getState().activeActorId ?? null` at call time. Output shape unchanged. Native blocker cleared.

**RISK-5 detail:** Reclassified LOW / no action. `explore/dal/search.dal.js` is a feature-owned search domain (Explore tab) — it may call `identity.search_actor_directory` directly per Rule 3. The hydration side effect at line 46 was removed 2026-05-12 (SENTRY-F-01) and moved to `searchResults.controller.js`. RPC call itself is compliant.

**RISK-6 detail:** Fixed. `settings/privacy/dal/blocks.dal.js` no longer owns a local actor-search RPC implementation; the privacy controller uses the actors adapter.

**RISK-7 detail:** Reclassified LOW / no action. `upload/dal/searchMentionSuggestions.dal.js` is a feature-owned domain with a distinct mention contract (`handle`, username-required filtering). Output shape divergence is intentional.

**RISK-8 detail:** Fixed. `searchActors.controller.js` now accepts `viewerActorId` and passes it to the DAL.

**RISK-9 detail:** Fixed. `MyAppointmentsView.jsx` `VportCell` and `MemberLine` sub-components no longer import or call `hydrateActorsByIds`. `useEffect` hydration triggers removed 2026-05-12. Bulk hydration already handled by `useMyAppointments.js:28`.

---

## 11 Debug Notes

- To verify `getActorSummariesByIdsDAL` consumers: `grep -rn "getActorSummariesByIdsDAL\|getActorSummariesByIds" apps/VCSM/src engines --include="*.js" --include="*.jsx"`
- To verify `searchActorsDAL` consumers: `grep -rn "searchActorsDAL" apps/VCSM/src --include="*.js" --include="*.jsx"`
- Static import tracing will show zero callers for `getActorSummariesByIds.dal.js` — this is expected (re-export shim, callers bypass to `@hydration`). Do not classify as dead without live grep verification.
- Actor search results are not cached — each call hits the RPC. No TTL or store layer wraps `searchActorsDAL`.

---

## 12 Files Map

| File | Layer | Status | Notes |
|---|---|---|---|
| `features/actors/dal/getActorSummariesByIds.dal.js` | DAL | DELETED | Re-export shim. Deleted 2026-05-12 (RISK-1 / IRONMAN-F-02). Zero callers confirmed. |
| `features/actors/dal/searchActors.dal.js` | DAL | ACTIVE | Calls `identity.search_actor_directory` RPC. Returns raw array — no inline transform (SENTRY-F-02 resolved 2026-05-14). |
| `features/actors/model/extractActorIdsForHydration.model.js` | Model | DELETED | Deleted 2026-05-14 (ENGINE scope cleanup — change log entry (3)). Zero callers confirmed. Engine implementation remains at `engines/hydration/src/extract.js`. |
| `features/actors/model/searchActors.model.js` | Model | ACTIVE | Full transform from raw RPC columns to domain shape (`actorId`, `kind`, `displayName`, `username`, `avatarUrl`). |
| `features/actors/controllers/hydrateActors.controller.js` | Controller | DELETED | Re-export shim. Deleted 2026-05-12 (RISK-1 / IRONMAN-F-02). Zero callers confirmed. |
| `features/actors/controllers/searchActors.controller.js` | Controller | ACTIVE | Composes DAL + model. Accepts `viewerActorId`. |
| `features/actors/adapters/actors.adapter.js` | Adapter | ACTIVE | Exports `searchActorsAdapter(params)`. Cross-feature narrow actor lookup boundary only. |

---

## Audit References

Latest Engine Audit: `engines/hydration/docs/` — check for latest `HYDRATION_ENGINE_AUDIT_VN.md`
Previous Engine Audit: N/A — verify audit versioning in hydration engine docs folder.

---

## Native Parity Notes

**Native Relevance:** INDIRECT
**Falcon Review:** OPTIONAL
**Reason:** The actors DAL is internal infrastructure. However, its consumers — booking (`listMyBookings`) and chat (`setup.js`) — are native-relevant features. Changes to the actor hydration contract or `search_actor_directory` RPC shape could break native booking and chat flows.
**Related Native Module:** Booking, Chat
**Native Transfer Status:** Not directly in scope — monitor if hydration engine or RPC contract changes.
**Known Native Gaps:** None specific to this DAL layer.
**Winter Soldier Handoff:** Not required at this time.

---

## 13 Change Log

### 2026-05-18

Task: ARCHITECT verification pass + LOGAN doc sync — align document with live code state post all 2026-05-12 and 2026-05-14 Wolverine fixes.
Application Scope: VCSM
Documentation Scope: VCSM
Code Status: No source code modified. Documentation only.
Boundary Contract: PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — enforced.

**ARCHITECT STATUS: DRIFT FOUND → RESOLVED**

Drift found (D-01 through D-18). All corrections applied. Primary structural drift: `§12` listed `extractActorIdsForHydration.model.js` as ACTIVE despite deletion on 2026-05-14.

Sections Updated:
- `§4 Entry Points` — annotated deleted files (getActorSummariesByIds.dal.js, hydrateActors.controller.js)
- `§8 Dependencies` — updated `getActorSummariesByIdsDAL` → `fetchActorSummaries` (engine rename 2026-05-14)
- `§9 Rule 6` — rewritten to reflect post-SENTRY-F-02 state (DAL returns raw rows; no inline transform)
- `§12 Files Map` — `extractActorIdsForHydration.model.js` changed from ACTIVE → DELETED (2026-05-14); `searchActors.dal.js` notes updated (no inline transform)
- `§14.1 Models` — `extractActorIdsForHydration.model.js` marked DELETED
- `§14.2 Controllers` — `hydrateActors.controller.js` marked DELETED; `vportTeamAccess.controller.js` updated from VIOLATION → CORRECT (RISK-2 FIXED)
- `§14.3 Hooks` — `useVportTeamAccess.js` updated from VIOLATION CHAIN → CORRECT (RISK-2 FIXED)
- `§14.5 Screens` — `VportDashboardTeamScreen.jsx` updated from VIOLATION CHAIN → CORRECT (RISK-2 FIXED)
- Phase 4 VENOM Trust Boundary Map — chat updated from DRIFT → ALIGNED (RISK-4 FIXED)
- Phase 4 VENOM-S-01 — status updated from DEFERRED → CLOSED (RISK-4 FIXED 2026-05-14)
- Phase 5 Chain B (LOKI) — chat search updated to reflect viewerActorId wiring (RISK-4 FIXED)
- Phase 5 Runtime Risk Summary — RISK-4 (chat) and SENTRY-F-01 (Explore) marked FIXED; RISK-9 marked FIXED
- Phase 7 CARNAGE-M-01 — fragility count updated from 6 → 5 files (searchActors.dal.js no longer has inline transform)
- Phase 8 FALCON-N-01 — updated from TRANSFER BLOCKER → RESOLVED (RISK-4 FIXED)
- Phase 8 FALCON Transfer Readiness — chat updated from NOT TRANSFER READY → TRANSFER READY
- Avengers Assembly Phase Close Open Risk table — RISK-1/4/5/9/SENTRY-F-02 all marked FIXED

Verification Commands:
- `find apps/VCSM/src/features/actors -type f | sort` — confirmed file inventory
- `grep -rn "search_actor_directory" apps/VCSM/src --include="*.js" --include="*.jsx"` — 4 active call sites confirmed
- `grep -rn "extractActorIdsForHydration" apps/VCSM/src --include="*.js" --include="*.jsx"` — zero results (file deleted)
- `grep -rn "viewerActorId|p_viewer_actor_id" apps/VCSM/src/features/chat/setup.js` — RISK-4 fix confirmed
- `grep -rn "hydrateActorsByIds" apps/VCSM/src/features/explore/dal/search.dal.js` — zero results (SENTRY-F-01 fix confirmed)
- `grep -rn "hydrateActorsByIds" apps/VCSM/src/features/notifications/screen/views/MyAppointmentsView.jsx` — zero results (RISK-9 fix confirmed)
- `grep -rn "fetchActorSummaries" apps/VCSM/src/features/booking/controller/listMyBookings.controller.js` — confirmed renamed import

Documentation Truth Status: VERIFIED. All live code changes through 2026-05-14 are now reflected in this document.

---

### 2026-05-14 (4)

Task: SENTRY-F-02 — Remove inline transform from `searchActors.dal.js`, move full transform to model.
Application Scope: VCSM
Code Status Before: `searchActors.dal.js` mapped raw RPC rows to intermediate shape (10-line inline transform). `searchActors.model.js` mapped intermediate → domain model using `vport_name`, `vport_slug`, `photo_url` field aliases.
Code Status After: DAL returns raw RPC array. Model reads raw columns (`actor_id`, `actor_kind`, `avatar_url`). Consumer shape unchanged.
Files Changed:
- `apps/VCSM/src/features/actors/dal/searchActors.dal.js`
- `apps/VCSM/src/features/actors/model/searchActors.model.js`

Build: `vite build --mode development` — PASS. ✓ No errors.
SENTRY Status: ALIGNED.
Documentation Truth Status: VERIFIED. All risks in §10 now FIXED or RECLASSIFIED. No open items remain.

---

### 2026-05-14 (3)

Task: ENGINE scope cleanup — `engines/hydration/index.js` public API contract fixes.
Application Scope: ENGINE + VCSM
Prompt Registry Entry: `zNOTFORPRODUCTION/_ACTIVE/planning/may/12/12-01.md`
Code Status Before: `index.js` exported `getActorSummariesByIdsDAL` (DAL-named in public adapter), `normalizeActorSummary`, `normalizeActorSummaries`, `extractActorIdsForHydration` (all unused or misnamed).
Code Status After: Public API is clean — no DAL/model names exposed. `fetchActorSummaries` is the canonical name.
Files Changed:
- `engines/hydration/index.js` — renamed DAL export, removed 3 unused exports
- `apps/VCSM/src/features/booking/controller/listMyBookings.controller.js` — import and call site updated
- `apps/VCSM/src/features/actors/model/extractActorIdsForHydration.model.js` — DELETED (shim, zero callers)

Build: `vite build --mode development` — PASS. ✓ No errors.
SENTRY Status: ALIGNED.
Documentation Truth Status: VERIFIED. All ENGINE scope items resolved.

---

### 2026-05-14 (2)

Task: RISK-4 fix — wire `viewerActorId` into `chat/setup.js` `searchActors` DI function.
Application Scope: VCSM
Prompt Registry Entry: `zNOTFORPRODUCTION/_ACTIVE/planning/may/12/12-01.md`
Code Status Before: `chat/setup.js:51` hardcoded `p_viewer_actor_id: null` — viewer context always null.
Code Status After: Reads `useIdentitySelectionStore.getState().activeActorId ?? null` at call time.
Files Changed:
- `apps/VCSM/src/features/chat/setup.js`

Build: `vite build --mode development` — PASS. ✓ No errors.
SENTRY Status: ALIGNED.
Documentation Truth Status: VERIFIED. RISK-4 closed. All five Wolverine queue items now resolved.

---

### 2026-05-14

Task: Logan post-Wolverine doc sync — §9, §10, §12 updated to reflect completed code changes.
Application Scope: VCSM
Prompt Registry Entry: `zNOTFORPRODUCTION/_ACTIVE/planning/may/12/12-01.md`
Code Status Before: §9/§10/§12 reflected pre-Wolverine state (shims as ACTIVE, RISK-9 as DEFERRED, RISK-1 as OPEN, RISK-5 with stale hydration side-effect detail).
Code Status After: All three sections updated to canonical post-execution state.
Files Changed:
- `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.actors.md` — §9, §10, §12 updated

Summary of changes:
- §9 Rule 1: Removed shim reference; all callers use `@hydration` directly. Added Rules 3, 4, 6 (feature-owned search domains, DAL side-effect ban, SENTRY-F-02 inline transform note).
- §10 RISK-1: OPEN → FIXED (shims deleted 2026-05-12)
- §10 RISK-5: HIGH/DEFERRED → LOW/RECLASSIFIED — feature-owned domain per IRONMAN; hydration side effect removed (SENTRY-F-01 resolved)
- §10 RISK-7: MEDIUM/DEFERRED → LOW/RECLASSIFIED — feature-owned per IRONMAN
- §10 RISK-9: LOW/DEFERRED → LOW/FIXED (view-layer effects removed 2026-05-12)
- §10 SENTRY-F-02: Added — pre-existing inline DAL transform, low priority
- §12: Both shim rows updated to DELETED with deletion date.

Architecture Contracts Checked: PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — enforced.
Documentation Truth Status: VERIFIED. §9, §10, §12 now reflect live code state as of 2026-05-12.

---

### 2026-05-11

Task: ARCHITECT dead code audit + LOGAN canonical doc restructure.
Application Scope: VCSM
Prompt Registry Entry: `zNOTFORPRODUCTION/_ACTIVE/planning/may/11/11-02.md`
Code Status Before: Doc existed in ARCHITECT report format. `getActorSummariesByIds.dal.js` incorrectly classified as "possibly dead code."
Code Status After: Doc restructured to Logan canonical format. All three risk findings documented.
Files Changed:
- `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.actors.md` — full restructure
- `zNOTFORPRODUCTION/_ACTIVE/planning/may/11/11-02.md` — prompt provenance created

Command Evidence:
- ARCHITECT: live grep scan confirmed `getActorSummariesByIds` active in booking + chat + engines
- ARCHITECT: confirmed `actors.adapter.js` is empty
- ARCHITECT: confirmed `vportTeamAccess.controller.js` is direct-importing `searchActorsDAL`

Architecture Contracts Checked: PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — enforced.
Security / Runtime / DB Notes: No schema changes. RPC `identity.search_actor_directory` confirmed active.
Validation: grep traces confirmed. No production code modified.

Documentation Truth Status: VERIFIED for current code state. RISK-2 and RISK-3 remain OPEN pending SENTRY.

---

## LOGAN REVIEW REPORT

**Task:** Dead code verification + Logan canonical restructure of actors DAL doc.
**Application Scope:** VCSM
**Documentation Scope:** VCSM
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — enforced
**Architecture Contract:** ARCHITECTURE.md — consulted

### DOCUMENTATION SCOPE GATE

| Documentation Area | In Scope | Update Allowed | Reason |
|---|---|---|---|
| `vcsm/dal/vcsm.dal.actors.md` | YES | YES | VCSM scope, documentation task |
| Engine audit files | NO | NO | No engine code was modified |
| Wentrex docs | NO | NO | Out of boundary |
| Traffic docs | NO | NO | Out of boundary |

### RELEVANT DOCS

| Doc Path | Status | Truth Status | Notes |
|---|---|---|---|
| `logan/vcsm/dal/vcsm.dal.actors.md` | UPDATED | VERIFIED | Restructured this session |

### CODE REVIEWED

| Code Path | Purpose | Status |
|---|---|---|
| `features/actors/dal/getActorSummariesByIds.dal.js` | Re-export shim | Verified — re-export only |
| `features/actors/dal/searchActors.dal.js` | RPC call | Verified — active |
| `features/actors/controllers/hydrateActors.controller.js` | Re-export shim | Verified |
| `features/actors/controllers/searchActors.controller.js` | Controller | Verified — active |
| `features/actors/adapters/actors.adapter.js` | Adapter | Verified — EMPTY |
| `features/booking/controller/listMyBookings.controller.js` | Consumer | Verified — uses @hydration |
| `features/chat/setup.js` | Consumer | Verified — wraps hydrateAndReturnSummaries |
| `features/dashboard/vport/controller/vportTeamAccess.controller.js` | Consumer | Verified — VIOLATION at line 9 |
| `engines/hydration/index.js` | Engine exports | Verified — canonical source |

### COMMAND EVIDENCE REGISTRY

| Command | Report Path | Relevance | Status |
|---|---|---|---|
| ARCHITECT | (inline this session) | Dead code verification, call chain tracing | PRESENT |
| SENTRY | — | RISK-2 and RISK-3 require SENTRY review | MISSING |
| IRONMAN | — | RISK-1 ownership decision pending | MISSING |
| VENOM | — | N/A this session | N/A |
| THOR | — | N/A this session | N/A |
| LOKI | — | Optional — could runtime-verify searchActors chain | MISSING |
| KRAVEN | — | N/A this session | N/A |
| CARNAGE | — | N/A this session | N/A |

### DRIFT FINDINGS

**LOGAN DRIFT FINDING — DF-01**
Finding ID: DF-01
Doc Path: `logan/vcsm/dal/vcsm.dal.actors.md`
Code Path: `features/actors/dal/getActorSummariesByIds.dal.js`
Drift Status: MAJOR DRIFT
Drift Severity: MEDIUM
Documentation Truth Status: CORRECTED
Current doc behavior: "No callers detected — possibly dead code or dynamically invoked."
Actual code behavior: Re-export shim. Function actively used in booking, chat, and both engines via `@hydration`.
Risk: Static scan limitation mislead documentation into false dead-code classification.
Recommended documentation update: APPLIED — doc now documents shim pattern and explains static scan blind spot.

**LOGAN DRIFT FINDING — DF-02**
Finding ID: DF-02
Doc Path: `logan/vcsm/dal/vcsm.dal.actors.md`
Code Path: `features/actors/adapters/actors.adapter.js`
Drift Status: MAJOR DRIFT
Drift Severity: HIGH
Documentation Truth Status: CORRECTED
Current doc behavior: Adapter listed as "PRESENT."
Actual code behavior: File exists but is EMPTY — zero exports.
Risk: Doc implied cross-feature boundary was available. It is not.
Recommended documentation update: APPLIED — doc now marks adapter as EMPTY STUB and identifies it as root cause of RISK-2 and RISK-3.

**LOGAN DRIFT FINDING — DF-03**
Finding ID: DF-03
Doc Path: `logan/vcsm/dal/vcsm.dal.actors.md`
Code Path: `features/dashboard/vport/controller/vportTeamAccess.controller.js:9`
Drift Status: NOT PREVIOUSLY DOCUMENTED
Drift Severity: HIGH
Documentation Truth Status: CORRECTED
Current doc behavior: Not mentioned in prior doc.
Actual code behavior: Cross-feature direct DAL import — boundary violation.
Risk: Violation will persist and may spread if not flagged.
Recommended documentation update: APPLIED — documented as RISK-2 with SENTRY handoff.

### README VIOLATION REPORT

No README files found in scope.

### PROMPT PROVENANCE STATUS

Prompt Logged: YES
Planning File: `zNOTFORPRODUCTION/_ACTIVE/planning/may/11/11-02.md`
Prompt Entry Timestamp: 2026-05-11

### ENGINE AUDIT STATUS

Engine Changed: NO
Latest Audit: Check `engines/hydration/docs/` for latest version.
New Audit Required: NO — no engine code was modified this session.
New Audit Path: N/A

### DOCUMENTATION STATUS: VERIFIED

### FINAL LOGAN STATUS: ALIGNED

**Recommended handoffs:**
- SENTRY — resolve RISK-2 (cross-feature DAL import) and RISK-3 (empty adapter)
- IRONMAN — resolve RISK-1 (redundant shim ownership decision)

### NATIVE PARITY ROUTING

| Logan Doc | Native Relevance | Falcon Review | Reason | Module File |
|---|---|---|---|---|
| `vcsm.dal.actors.md` | INDIRECT | OPTIONAL | Consumers (booking, chat) are native-relevant; DAL itself is internal infrastructure | N/A |

---

## 14 Full Consumer Map — ARCHITECT Scan 2026-05-11

> Appended by ARCHITECT scan. Covers all models, controllers, hooks, components, and screens that touch any actors feature DAL export — directly or through engine shims.

---

### Import Path Legend

| Path | Meaning |
|---|---|
| `@/features/actors/dal/searchActors.dal` | Direct actors DAL import — only `searchActors.controller.js` should use this |
| `@hydration` | Canonical hydration engine — approved for all callers |
| `@/state/actors/hydrateActors` | App-level re-export shim → re-exports from `@hydration` |

---

### 14.1 Models

| File | Function Used | Import Path | Status |
|---|---|---|---|
| `features/actors/model/searchActors.model.js` | `mapSearchActorsRows` | internal | CORRECT — called by `searchActors.controller.js` only |
| ~~`features/actors/model/extractActorIdsForHydration.model.js`~~ | ~~`extractActorIdsForHydration`~~ | — | **DELETED 2026-05-14** — was a shim. Engine version lives at `engines/hydration/src/extract.js`. Zero callers in VCSM feature layer. |

---

### 14.2 Controllers

| File | Function Used | Import Path | Status |
|---|---|---|---|
| `features/actors/controllers/searchActors.controller.js` | `searchActorsDAL`, `mapSearchActorsRows` | internal | CORRECT — owns the canonical search compose path |
| ~~`features/actors/controllers/hydrateActors.controller.js`~~ | — | — | **DELETED 2026-05-12** — was a re-export shim. Zero callers confirmed. |
| `features/dashboard/vport/controller/vportTeamAccess.controller.js:9` | `searchActorsAdapter` | `@/features/actors/adapters/actors.adapter` | **CORRECT — RISK-2 FIXED** (2026-05-11). No longer imports DAL directly. |
| `features/profiles/controller/friends/hydrateActorsIntoStore.controller.js` | `hydrateActorsByIds` | `@hydration` | CORRECT |
| `features/profiles/controller/post/getActorPosts.controller.js` | `hydrateActorsFromRows` | `@/state/actors/hydrateActors` | CORRECT (via shim) |

---

### 14.3 Hooks

| File | Function Used | Import Path | Status |
|---|---|---|---|
| `features/settings/queries/useBlockedCitizens.js` | `hydrateActorsFromRows` | `@/state/actors/hydrateActors` | CORRECT (via shim) |
| `features/post/commentcard/hooks/useCommentThread.js` | `hydrateActorsFromRows` | `@/state/actors/hydrateActors` | CORRECT (via shim) |
| `features/social/friend/request/hooks/useIncomingFollowRequests.js` | `hydrateActorsFromRows` | `@/state/actors/hydrateActors` | CORRECT (via shim) |
| `features/dashboard/vport/hooks/useVportTeam.js` | `hydrateActorsByIds` | `@hydration` | CORRECT |
| `features/dashboard/vport/hooks/useVportTeamAccess.js` | `hydrateActorsByIds` + controller chain → `searchActorsAdapter` | `@hydration` + adapter path | **CORRECT — RISK-2 FIXED** (2026-05-11). Upstream controller now uses adapter boundary. |
| `features/dashboard/vport/hooks/useBarberTeamRequests.js` | `hydrateActorsByIds` | `@hydration` | CORRECT |
| `features/dashboard/vport/hooks/useVportOwnerSchedule.js` | `hydrateActorsByIds` | `@hydration` | CORRECT |
| `features/feed/hooks/useFeed.js` | `hydrateActorsByIds` | `@hydration` | CORRECT |
| `features/feed/hooks/useCentralFeed.js` | `hydrateActorsByIds` | `@hydration` | CORRECT |
| `features/profiles/kinds/vport/screens/booking/hooks/useVportBookingView.js` | `hydrateActorsFromRows` | `@/state/actors/hydrateActors` | CORRECT (via shim) |
| `features/notifications/screen/hooks/useMyAppointments.js` | `hydrateActorsByIds` | `@hydration` | CORRECT |

---

### 14.4 Components

| File | Function Used | Import Path | Status |
|---|---|---|---|
| `features/dashboard/vport/components/bookingHistory/BookingCard.jsx` | `hydrateActorsByIds` | `@hydration` | CORRECT |
| `features/dashboard/vport/components/bookingHistory/OperationalBookingCard.jsx` | `hydrateActorsByIds` | `@hydration` | CORRECT |
| `features/profiles/kinds/vport/screens/booking/components/bookingCalendarDayPanel.components.jsx` | `hydrateActorsFromRows` | `@/state/actors/hydrateActors` | CORRECT (via shim) |

---

### 14.5 Screens

| File | Function Used | Call Chain | Status |
|---|---|---|---|
| `features/dashboard/vport/screens/VportDashboardBookingHistoryScreen.jsx` | `hydrateActorsByIds` | Screen → `@hydration` | CORRECT |
| `features/dashboard/vport/screens/VportDashboardTeamScreen.jsx` | via `useVportTeamAccess` | Screen → `useVportTeamAccess` → `vportTeamAccess.controller.js` → `searchActorsAdapter` | **CORRECT — RISK-2 FIXED** (2026-05-11). Chain now routes through adapter boundary. |

---

### 14.6 Duplicate Implementations Detected — New Risks

Two features reimplement the `search_actor_directory` RPC call locally instead of delegating to `searchActors.controller.js`. Neither imports from the actors feature at all.

**RISK-4 — `features/chat/setup.js`**

| Field | Detail |
|---|---|
| Location | `apps/VCSM/src/features/chat/setup.js:43` |
| Pattern | Inline `searchActors()` function calling `identity.search_actor_directory` RPC directly |
| Duplicate Of | `features/actors/controllers/searchActors.controller.js` |
| Divergence | Passes `p_viewer_actor_id: null` hardcoded — cannot pass viewer context |
| Risk | MEDIUM — drift between chat search and canonical search results; viewer-context filtering silently disabled |
| Recommended Fix | Replace inline function with import of `searchActors` controller or future adapter export |
| Handoff | SENTRY |

**RISK-5 — `features/explore/dal/search.dal.js`**

| Field | Detail |
|---|---|
| Location | `apps/VCSM/src/features/explore/dal/search.dal.js:12` |
| Pattern | Inline `searchActors()` function calling `identity.search_actor_directory` RPC directly |
| Duplicate Of | `features/actors/controllers/searchActors.controller.js` |
| Divergence | Supports additional `filter` param (users/vports/all), `offset`, `normalizeActorRow` transform — has diverged into a richer superset |
| Risk | HIGH — three separate call paths to `search_actor_directory` RPC; any RPC contract change must be updated in three places |
| Recommended Fix | Promote filter/offset support into canonical `searchActorsDAL` and `searchActors.controller.js`, then consolidate |
| Handoff | SENTRY + IRONMAN |

---

### 14.7 State Shim Bridge

`apps/VCSM/src/state/actors/hydrateActors.js` is an app-level re-export shim:

```js
export { hydrateActorsFromRows, hydrateActorsByIds } from '@hydration'
```

Multiple hooks and controllers import hydration functions from `@/state/actors/hydrateActors` rather than `@hydration` directly. Both import paths are functionally equivalent — they resolve to the same engine functions. The shim is not a violation, but it creates two valid import paths for the same function. Consumers should prefer `@hydration` directly for clarity.

---

### 14.8 Updated Risk Table

| Risk | ID | Severity | Status | Handoff |
|---|---|---|---|---|
| Redundant re-export shim — `getActorSummariesByIds.dal.js` bypassed by all callers | RISK-1 | LOW | OPEN | IRONMAN |
| `vportTeamAccess.controller.js` imports `searchActorsDAL` directly across feature boundary | RISK-2 | HIGH | OPEN | SENTRY |
| `actors.adapter.js` is an empty stub — no approved cross-feature boundary exists | RISK-3 | HIGH | OPEN | SENTRY |
| `chat/setup.js` reimplements `searchActors` locally — duplicate of actors controller | RISK-4 | MEDIUM | OPEN | SENTRY |
| `explore/dal/search.dal.js` reimplements `searchActors` locally — diverged superset | RISK-5 | HIGH | OPEN | SENTRY + IRONMAN |

---

### 14.9 Scan Evidence

Scan commands used:

```
grep -rn "searchActorsDAL|searchActors\.dal|searchActors\.controller|hydrateActors\.controller|actors\.adapter|extractActorIdsForHydration|searchActors\.model|getActorSummariesByIds\.dal" apps/VCSM/src

grep -rn "searchActors\b|from.*actors/controllers|hydrateActors\b|hydrateActorsByIds|hydrateActorsFromRows|extractActorIdsForHydration|mapSearchActors" apps/VCSM/src
```

Scan Date: 2026-05-11
Scan Scope: `apps/VCSM/src/` — all `.js` and `.jsx` files
Engine files excluded from consumer map (engine-internal usage documented in hydration engine audit).

---

## AVENGERS ASSEMBLY REPORT — 2026-05-11

**Run Summary**
Date: 2026-05-11
Triggered by: User — targeted doc alignment pass
Application Scope: VCSM
Document Scope: `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.actors.md`
Boundary Contract: `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md` — enforced
Commands Run: ARCHITECT / VENOM / LOGAN / review-contract

---

### Governance Evidence Registry

| Command | Status | Findings | Drift | Blocking |
|---|---|---|---|---|
| ARCHITECT | PRESENT | 2 undocumented RPC call sites; 1 undocumented view-layer engine call | YES | NO |
| VENOM | PRESENT | Viewer-context inversion at controller layer | YES | NO |
| LOGAN | PRESENT | 4 new consumer map gaps | YES | NO |
| review-contract | PRESENT | RISK-2 / RISK-3 open; new view-layer boundary concern | YES | NO |
| IRONMAN | MISSING | RISK-1 ownership decision pending | N/A | NO |
| SENTRY | MISSING | RISK-2, RISK-3, RISK-4, RISK-5 pending review | N/A | NO |
| LOKI | MISSING | Runtime verification of search paths not run | N/A | NO |
| KRAVEN | N/A | No performance scope this pass | N/A | NO |
| CARNAGE | N/A | No schema changes this pass | N/A | NO |
| FALCON | OPTIONAL | Consumer features (booking, chat) are native-relevant | N/A | NO |
| WINTER SOLDIER | N/A | Not in scope | N/A | NO |
| SHIELD | N/A | No IP/provenance changes this pass | N/A | NO |

---

### ARCHITECT

**Status: DRIFT FOUND**

**File structure:** MATCHES documentation — all 7 files in `features/actors/` confirmed present.

**New finding — undocumented RPC call sites:**
Two additional `search_actor_directory` call sites exist in the codebase that are not present in the Section 14 consumer map:

1. `features/settings/privacy/dal/blocks.dal.js:88–115`
   - Exports `dalSearchActors()` — standalone implementation calling `identity.search_actor_directory` RPC directly
   - Own inline row transform (produces same shape as `searchActors.dal.js`)
   - Accepts `viewerActorId` as optional param — wired correctly at DAL level
   - Does not route through `searchActors.controller.js` or `actors.adapter.js`

2. `features/upload/dal/searchMentionSuggestions.dal.js:1–48`
   - Exports `searchMentionSuggestions()` — standalone implementation calling `identity.search_actor_directory` RPC directly
   - Output shape diverges from canonical: adds `handle` field, drops `vport_name`/`vport_slug` fields
   - Accepts `viewerActorId` as optional param
   - Does not route through canonical actors feature

**Total `search_actor_directory` call sites:** 5 — `searchActors.dal.js`, `explore/dal/search.dal.js`, `chat/setup.js`, `settings/privacy/dal/blocks.dal.js`, `upload/dal/searchMentionSuggestions.dal.js`

**New finding — view-layer engine call:**
`features/notifications/screen/views/MyAppointmentsView.jsx:5` imports `hydrateActorsByIds` directly from `@hydration`. This is a view-screen file calling an engine function directly — bypassing the hook layer. Architecture contract requires view screens to call hooks only, not engine functions. Not documented in Section 14.

**DAL double-transform pattern (pre-existing, not previously noted):**
`searchActors.dal.js` performs an inline row transform at lines 21–30 (maps raw DB columns → intermediate shape with `photo_url`, `vport_name`, etc.). `searchActors.model.js` then performs a second transform on this output (maps intermediate → domain shape with `avatarUrl`, `displayName`, etc.). This two-pass transform is functional but diverges from the contract's intent of keeping transforms in the model layer only.

---

### VENOM

**Status: DRIFT FOUND**

**Viewer-context inversion at controller layer (new finding):**
`searchActors.controller.js` signature: `{ query, limit = 12 }` — does NOT accept or pass `viewerActorId`.
When called through the canonical path, `searchActorsDAL` always receives `viewerActorId: null`.
This means viewer-context filtering from the `identity.search_actor_directory` RPC is silently disabled on the canonical search path.

Security inversion: the only call site that correctly passes `viewerActorId` is `vportTeamAccess.controller.js` — which is the VIOLATION path (RISK-2). The canonical path always bypasses viewer context.

**Implication:** Any RLS or identity-based filtering applied by `search_actor_directory` based on `p_viewer_actor_id` is only honored by the violation path, not the canonical path. If the RPC relies on viewer context for sensitive filtering, the canonical path is a security regression relative to RISK-2.

**RISK-4 confirmed active:** `chat/setup.js:52` hardcodes `p_viewer_actor_id: null` — viewer context always missing from chat search.

**No new `select('*')` violations.** All five RPC call sites pass explicit param contracts.
**No TypeScript files** in actors feature or consumers.
**No raw UUID exposure** in URL surfaces from this layer.

---

### LOGAN

**Status: DRIFT FOUND**

Section 14 (Full Consumer Map) is accurate for its documented entries but is missing the following:

| Gap | Location | Missing From |
|---|---|---|
| `dalSearchActors()` in blocks.dal.js | `features/settings/privacy/dal/blocks.dal.js:88` | Section 14.2 Controllers / Section 14.8 Risk Table |
| `searchMentionSuggestions()` in upload DAL | `features/upload/dal/searchMentionSuggestions.dal.js` | Section 14.2 / Section 14.8 Risk Table |
| `MyAppointmentsView.jsx` direct hydration call | `features/notifications/screen/views/MyAppointmentsView.jsx:5` | Section 14.4 Components / view-layer boundary note |
| Viewer-context inversion | `searchActors.controller.js` missing `viewerActorId` param | Section 9 Rules, Section 10 Failure Risks |

No drift found in entries already documented. Section 14.8 risk table is accurate for RISK-1 through RISK-5 but is missing RISK-6 through RISK-9.

---

### review-contract

**Status: VIOLATIONS FOUND**

Pre-existing open violations (unchanged from last audit):

| Violation | Location | Risk ID | Status |
|---|---|---|---|
| Direct cross-feature DAL import | `vportTeamAccess.controller.js:9` | RISK-2 | OPEN |
| Empty adapter — no approved cross-feature boundary | `actors.adapter.js` | RISK-3 | OPEN |
| Duplicate RPC impl (chat) | `chat/setup.js:43` | RISK-4 | OPEN |
| Duplicate RPC impl (explore) | `explore/dal/search.dal.js:12` | RISK-5 | OPEN |

New violations confirmed this pass:

| Violation | Location | Severity | Notes |
|---|---|---|---|
| View-screen calls engine function directly | `MyAppointmentsView.jsx:5` imports `hydrateActorsByIds` from `@hydration` | LOW | View layer must call hooks only; hydration should be in `useMyAppointments.js` |
| Controller drops incoming param | `searchActors.controller.js:4` signature missing `viewerActorId` | HIGH | Canonical path silently disables viewer-context filtering; fix requires adding param and threading it to DAL |

---

### New Risk Entries — 2026-05-11

| Risk | ID | Severity | Status | Handoff |
|---|---|---|---|---|
| `blocks.dal.js` reimplements `search_actor_directory` locally — 4th duplicate | RISK-6 | MEDIUM | OPEN | SENTRY + IRONMAN |
| `upload/dal/searchMentionSuggestions.dal.js` reimplements `search_actor_directory` locally — 5th duplicate, diverged output shape | RISK-7 | MEDIUM | OPEN | SENTRY + IRONMAN |
| `searchActors.controller.js` silently drops `viewerActorId` — canonical path always uses null viewer context | RISK-8 | HIGH | OPEN | SENTRY |
| `MyAppointmentsView.jsx` calls `hydrateActorsByIds` directly from view layer — bypasses hook boundary | RISK-9 | LOW | OPEN | SENTRY |

**RISK-6 detail:** `features/settings/privacy/dal/blocks.dal.js` exports `dalSearchActors()` — a fourth standalone implementation of the `search_actor_directory` RPC call. Functionally equivalent to `searchActors.dal.js` but lives inside a different feature boundary. Any RPC contract change must now be propagated to four DAL files.

**RISK-7 detail:** `features/upload/dal/searchMentionSuggestions.dal.js` exports `searchMentionSuggestions()` — a fifth standalone implementation. Output shape diverges from canonical (adds `handle`, drops `vport_name`/`vport_slug`). This makes schema migration harder — the upload feature's output shape is a superset with a different field contract. Recommended fix: promote `handle` support into canonical `searchActorsDAL`, then consolidate.

**RISK-8 detail:** `searchActors.controller.js` accepts `{ query, limit }` but not `viewerActorId`. The DAL accepts it as `viewerActorId = null`. Any caller using the canonical controller path always sends `null` viewer context to the RPC. RISK-2 is the only path that correctly threads viewer context — making the violation path more correct than the canonical path. Fix: add `viewerActorId` to the controller signature before resolving RISK-2, otherwise the corrected RISK-2 path will silently regress viewer filtering.

**RISK-9 detail:** `features/notifications/screen/views/MyAppointmentsView.jsx` line 5 imports `hydrateActorsByIds` from `@hydration` and calls it inside the component body (lines 54, 95) as a side-effect trigger. This bypasses the hook layer. The call should move into `useMyAppointments.js` or a dedicated hydration effect hook.

---

### Cross-System Contradictions

| System A | System B | Contradiction | Severity | Recommended Resolution |
|---|---|---|---|---|
| RISK-2 (violation path) passes `viewerActorId` correctly | Canonical `searchActors.controller.js` silently drops it | Violation path has better security behavior than canonical path | HIGH | Fix RISK-8 (controller param) before fixing RISK-2 — otherwise RISK-2 fix regresses viewer filtering |
| Section 14.8 risk table (5 entries) | Live code (7 entries including RISK-6, RISK-7) | Risk table incomplete | MODERATE | Append RISK-6 through RISK-9 to Section 10 and Section 14.8 |

---

### Documentation Truth Review

| Doc Section | Truth Status | Drift | Blocking |
|---|---|---|---|
| §4 Entry Points | ALIGNED | None | NO |
| §5 Data Flow | ALIGNED | None | NO |
| §6 Source of Truth | ALIGNED | None | NO |
| §8 Dependencies / Consumers | MINOR DRIFT | Missing blocks.dal.js and searchMentionSuggestions.dal.js as consumers | NO |
| §9 Rules / Invariants | MINOR DRIFT | Rule 3 does not acknowledge that canonical controller also violates viewer-context threading | NO |
| §10 Failure Risks | DRIFT | Missing RISK-6, RISK-7, RISK-8, RISK-9 | NO |
| §14 Full Consumer Map | DRIFT | Missing blocks.dal.js, searchMentionSuggestions.dal.js, MyAppointmentsView.jsx | NO |
| §14.8 Risk Table | DRIFT | Missing RISK-6 through RISK-9 | NO |

---

### Overall Status

**DRIFT FOUND**

Documentation accurately reflects the code for all previously documented surfaces. Four new risks (RISK-6 through RISK-9) were identified and are documented above. No pre-existing risks have been resolved. No production code was modified this pass.

**Pre-existing open risks:** RISK-1 (LOW), RISK-2 (HIGH), RISK-3 (HIGH), RISK-4 (MEDIUM), RISK-5 (HIGH)
**New open risks:** RISK-6 (MEDIUM), RISK-7 (MEDIUM), RISK-8 (HIGH), RISK-9 (LOW)

---

### Recommended Next Commands

| Priority | Command | Reason |
|---|---|---|
| 1 | SENTRY | Resolve RISK-2, RISK-3, RISK-8 — boundary violations and viewer-context inversion are the highest architectural debt in this feature |
| 2 | IRONMAN | Ownership decision on RISK-1, RISK-6, RISK-7 — five duplicate RPC impls need a consolidation owner |
| 3 | LOGAN | Update §10 and §14.8 of this doc with RISK-6 through RISK-9 entries |

**Note to SENTRY:** Fix RISK-8 (`searchActors.controller.js` missing `viewerActorId` param) before resolving RISK-2. The corrected RISK-2 path passes `viewerActorId` — if the controller doesn't accept it, the fix will silently drop it.

---

## WOLVERINE FIX APPEND — 2026-05-11

**Task:** Avengers/Logan Actors DAL findings fix.
**Application Scope:** VCSM.
**Implementation Scope:** `apps/VCSM/`.
**Documentation Scope:** VCSM canonical actors DAL doc.
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md consulted and enforced.
**Architecture Contract:** ARCHITECTURE.md consulted and enforced.

### Summary

Created the approved actors adapter boundary and moved safe actor-search consumers behind it. No engine files, database schema, RLS policy, Supabase RPC definition, hydration engine implementation, or unrelated actor hydration path was modified.

### Production Code Updated

| File | Change |
|---|---|
| `apps/VCSM/src/features/actors/adapters/actors.adapter.js` | Populated the previously empty adapter and exposed `searchActorsAdapter(params)` as the approved public cross-feature actors search boundary. The adapter calls the actors controller and does not import DAL. |
| `apps/VCSM/src/features/actors/controllers/searchActors.controller.js` | Added `viewerActorId` passthrough so the approved controller path preserves viewer-context behavior already supported by the DAL. |
| `apps/VCSM/src/features/dashboard/vport/controller/vportTeamAccess.controller.js` | Replaced the direct cross-feature import of `searchActorsDAL` with `searchActorsAdapter`. Preserved the vport team candidate return shape expected by the existing UI. |
| `apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js` | Removed a safe duplicate actor-search path by routing block-search actor lookup through `searchActorsAdapter`. |
| `apps/VCSM/src/features/settings/privacy/dal/blocks.dal.js` | Removed the local duplicate `search_actor_directory` implementation after the privacy controller moved to the adapter. |

### Risk Status After Fix

| Risk | Previous Status | New Status | Notes |
|---|---:|---:|---|
| RISK-2 | OPEN | FIXED | `vportTeamAccess.controller.js` no longer imports `@/features/actors/dal/searchActors.dal` directly. It now uses the approved adapter boundary. |
| RISK-3 | OPEN | FIXED | `actors.adapter.js` is no longer an empty stub and now exports `searchActorsAdapter(params)`. |
| RISK-4 | OPEN | DEFERRED | `chat/setup.js` was inspected and left unchanged because its current injected search function hardcodes `p_viewer_actor_id: null` and returns the chat engine's snake_case `DirectorySearchResultModel` shape. The current adapter/controller path does not preserve that behavior exactly. |
| RISK-5 | OPEN | DEFERRED | RISK-5 deferred to IRONMAN/SENTRY because Explore has a richer search contract: `filter`, `offset`, `normalizeActorRow`, dedupe, and hydration side effects. |
| RISK-6 | OPEN | FIXED | `blocks.dal.js` no longer reimplements `search_actor_directory`; privacy block actor search now goes through `searchActorsAdapter`. |
| RISK-7 | OPEN | DEFERRED | Upload mention suggestions still have a distinct output contract with `handle` and username-required filtering. Not consolidated because equivalence was not established. |
| RISK-8 | OPEN | FIXED | `viewerActorId` is now accepted by `searchActors.controller.js` and threaded through to the DAL. |
| RISK-9 | OPEN | UNCHANGED | Out of this task's actor search adapter scope. No notification hydration paths were touched. |

### Verification Evidence

| Command | Result |
|---|---|
| `grep -rn "@/features/actors/dal/searchActors.dal" apps/VCSM/src --include="*.js" --include="*.jsx"` | Only the approved actors controller import remains. No cross-feature direct import remains for the vport team path. |
| `grep -rn "search_actor_directory" apps/VCSM/src --include="*.js" --include="*.jsx"` | Remaining hits are canonical actors DAL, deferred chat path, deferred Explore path, deferred upload mention suggestions, and comments/model references. Privacy settings duplicate was removed. |
| `npm run build` | PASS. Vite build completed successfully. Existing chunk/dynamic-import warnings were reported; no build failure. |

### Deferred Items

| Item | Owner Review Required | Reason |
|---|---|---|
| Chat actor search consolidation | SENTRY | Adapter/controller path does not yet preserve chat's exact null-viewer and snake_case engine result contract. |
| Explore actor search consolidation | SENTRY + IRONMAN | Explore has richer search behavior and side effects that are not represented by canonical actors search. |
| Upload mention search consolidation | SENTRY + IRONMAN | Upload mention suggestions require `handle` and username-required filtering. Canonical adapter does not expose that exact contract. |
| Notification hydration boundary issue | SENTRY | Existing RISK-9 remains outside the current actor search adapter fix. |

### Pending Reviews

- SENTRY required.
- IRONMAN required for deferred Explore/upload consolidation decisions.
- LOGAN update required to reconcile the main risk tables with this fix append.

---

## Codex Fix Pass — 2026-05-11

### Files Changed

| File | Change |
|---|---|
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.actors.md` | Reconciled current-state documentation with live repo state for the actors adapter boundary, vport actor-search routing, risk table statuses, and file map. |

### Findings Addressed

| Finding | Status | Notes |
|---|---|---|
| RISK-2 — direct cross-feature import of `searchActorsDAL` from vport team access | DONE | Live grep shows only the actors controller imports `@/features/actors/dal/searchActors.dal`; vport team access uses the actors adapter. |
| RISK-3 — empty `actors.adapter.js` | DONE | Live file inspection shows `searchActorsAdapter(params)` is exported and delegates to the actors controller. |
| RISK-6 — privacy blocks duplicate `search_actor_directory` path | DONE | Live grep shows the settings privacy duplicate RPC call is gone. |
| RISK-8 — controller drops `viewerActorId` | DONE | Live file inspection shows `searchActors.controller.js` accepts `viewerActorId` and passes it to the DAL. |
| RISK-1 — redundant hydration re-export shim | BLOCKED | Repo search confirms callers still use `@hydration` directly. Ownership decision remains with IRONMAN; no code deletion was safe. |
| RISK-4 — chat duplicate actor search path | BLOCKED | Chat search preserves a hardcoded null viewer context and snake_case engine result shape. Consolidation would require a contract-preserving adapter change. |
| RISK-5 — Explore duplicate actor search path | BLOCKED | Explore has a richer contract with `filter`, `offset`, `normalizeActorRow`, dedupe, and hydration side effects. |
| RISK-7 — upload mention suggestions duplicate actor search path | BLOCKED | Upload mention search requires `handle` and username-required filtering; equivalence with canonical actors search is not established. |
| RISK-9 — notification view imports hydration engine directly | BLOCKED | This is outside the actors DAL code scope and should be handled by SENTRY in the notifications feature boundary. |

### Verification

- Commands/searches run:
  - `grep -rn "@/features/actors/dal/searchActors.dal" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `grep -rn "search_actor_directory" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `grep -rn "getActorSummariesByIdsDAL\\|getActorSummariesByIds" apps/VCSM/src engines --include='*.js' --include='*.jsx'`
  - `grep -rn "hydrateActorsByIds" apps/VCSM/src/features/notifications --include='*.js' --include='*.jsx'`
  - Inspected `apps/VCSM/src/features/actors/adapters/actors.adapter.js`
  - Inspected `apps/VCSM/src/features/actors/controllers/searchActors.controller.js`
- Production callers checked:
  - `apps/VCSM/src/features/dashboard/vport/controller/vportTeamAccess.controller.js`
  - `apps/VCSM/src/features/chat/setup.js`
  - `apps/VCSM/src/features/explore/dal/search.dal.js`
  - `apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js`
  - `apps/VCSM/src/features/booking/controller/listMyBookings.controller.js`
  - `apps/VCSM/src/features/notifications/screen/views/MyAppointmentsView.jsx`
- Remaining risks:
  - RISK-1 requires IRONMAN ownership decision.
  - RISK-4 requires SENTRY contract-preserving chat adapter decision.
  - RISK-5 requires SENTRY + IRONMAN because Explore has a richer search contract.
  - RISK-7 requires SENTRY + IRONMAN because upload mention suggestions have a distinct output contract.
  - RISK-9 requires SENTRY in the notifications feature boundary.

### Status

PARTIAL

---

## SENTRY COMPLIANCE REPORT — 2026-05-11

**Date:** 2026-05-11
**Reviewer:** SENTRY
**Trigger:** Phase 1 of phased verification run ordered by Cerebro. Scope: close RISK-4, RISK-5, RISK-9 and verify RISK-2/3/6/8 closures.
**Application Scope:** VCSM
**Review Reason:** Actors DAL boundary compliance audit — verify closed risks are actually closed; assess open and deferred risks
**Architecture Contract:** `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md`
**Boundary Contract:** `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`

---

### BOUNDARY COMPLIANCE STATUS

| Protected Root | In Scope | Modified | Violation | Notes |
|---|---|---|---|---|
| apps/VCSM | YES | NO | NO | Inspection only — all files read, none written |
| apps/wentrex | NO | NO | NO | Out of scope |
| apps/Traffic | NO | NO | NO | Out of scope |
| engines | YES (read) | NO | NO | `@hydration` engine read for import tracing — no engine files modified |

---

### CLOSURE VERIFICATION — RISK-2 / RISK-3 / RISK-6 / RISK-8

#### RISK-2 — `vportTeamAccess.controller.js` direct cross-feature DAL import

**Verification method:** Live file inspection.
**File:** `apps/VCSM/src/features/dashboard/vport/controller/vportTeamAccess.controller.js`
**Line 9:** `import { searchActorsAdapter } from "@/features/actors/adapters/actors.adapter"`
**Result:** CONFIRMED CLOSED. No direct import of `searchActorsDAL` exists. Cross-feature actor search now routes through the approved adapter boundary.

#### RISK-3 — `actors.adapter.js` empty stub

**Verification method:** Live file inspection.
**File:** `apps/VCSM/src/features/actors/adapters/actors.adapter.js`
**Content:** Exports `searchActorsAdapter(params)` — delegates to `searchActors.controller.js`. No Supabase access. No DAL bypass.
**Result:** CONFIRMED CLOSED. Adapter is populated and architecturally correct.

#### RISK-6 — `blocks.dal.js` duplicate `search_actor_directory` implementation

**Verification method:** `grep -n "search_actor_directory\|dalSearchActors" apps/VCSM/src/features/settings/privacy/dal/blocks.dal.js` — zero results.
**Result:** CONFIRMED CLOSED. Duplicate RPC call removed.

#### RISK-8 — `searchActors.controller.js` drops `viewerActorId`

**Verification method:** Live file inspection.
**File:** `apps/VCSM/src/features/actors/controllers/searchActors.controller.js`
**Line 4:** `export async function searchActors({ query, limit = 12, viewerActorId = null } = {})`
**Line 5:** `const rows = await searchActorsDAL({ query, limit, viewerActorId })`
**Result:** CONFIRMED CLOSED. `viewerActorId` is accepted and threaded through to the DAL.

---

### ARCHITECTURE ALIGNMENT STATUS

| Area | Status | Drift Level | Notes |
|---|---|---|---|
| actors/adapters boundary | ALIGNED | NONE | `searchActorsAdapter` correctly delegates to controller only |
| actors/controllers layer | ALIGNED | NONE | `searchActors.controller.js` correctly composes DAL + model; viewer context threaded |
| actors/dal layer | MINOR DRIFT | MINOR DRIFT | Inline row transform at lines 21–30 belongs in model layer (pre-existing, see SENTRY-F-02) |
| vportTeamAccess cross-feature access | ALIGNED | NONE | Now routes through adapter — correct |
| chat/setup.js wiring layer | MODERATE DRIFT | MODERATE DRIFT | Inline Supabase RPC call bypasses canonical actors path; null viewer context hardcoded (RISK-4) |
| explore/dal/search.dal.js | MODERATE DRIFT | MODERATE DRIFT | Direct RPC superset + DAL-layer side effect (SENTRY-F-01 + RISK-5) |
| upload/searchMentionSuggestions.dal.js | MINOR DRIFT | MINOR DRIFT | Distinct output contract; deferred from consolidation (RISK-7) |
| MyAppointmentsView.jsx view layer | MINOR DRIFT | MINOR DRIFT | Imports `hydrateActorsByIds` directly from engine at view layer (RISK-9) |

---

### ACTOR OWNERSHIP STATUS

| Flow | Status | Risk | Notes |
|---|---|---|---|
| vportTeamAccess actor search | ALIGNED | LOW | `searchTeamCandidatesController` passes `viewerActorId` to adapter correctly |
| chat actor search | DRIFT | MEDIUM | `searchActors` in setup.js always passes `null` viewer context — viewer-context filtering silently disabled for chat search |
| explore actor search | DRIFT | HIGH | `viewerActorId` is accepted but search runs inside a DAL file that also triggers a store side effect |
| canonical actors controller | ALIGNED | LOW | `searchActors.controller.js` now accepts and threads `viewerActorId` |

---

### IDENTITY SURFACE STATUS

| Surface | Status | Risk | Notes |
|---|---|---|---|
| `searchActorsAdapter` return shape | ALIGNED | LOW | Returns camelCase domain shape from model layer — no raw DB columns exposed |
| `chat/setup.js` search return shape | DRIFT | MEDIUM | Returns snake_case `{ actor_id, display_name, username, photo_url, kind }` — raw DB column names exposed to chat engine consumer |
| `upload/searchMentionSuggestions` return shape | DRIFT | LOW | Returns `{ actor_id, kind, handle, display_name, photo_url }` — `actor_id` and `photo_url` are raw column names, not camelCase domain shape |
| `explore/dal/search.dal.js` return shape | ALIGNED | LOW | Uses `normalizeActorRow` from explore model — camelCase domain shape preserved |

---

### ENGINE ISOLATION STATUS

| Engine Area | Status | Drift | Notes |
|---|---|---|---|
| `@hydration` import from view layer | DRIFT | MINOR DRIFT | `MyAppointmentsView.jsx` and `explore/dal/search.dal.js` import `hydrateActorsByIds` from `@hydration` directly, bypassing the hook layer |
| `@hydration` import from hook layer | ALIGNED | NONE | `useMyAppointments.js` correctly calls `hydrateActorsByIds` from hook layer |
| chat engine dependency injection | QUALIFIED | MODERATE DRIFT | `configureChatEngine` receives `searchActors` as injected dep — pattern is architecturally valid, but injected function bypasses canonical actors boundary |

---

### NATIVE PARITY STATUS

| Native Area | Status | Drift | Notes |
|---|---|---|---|
| Actors DAL layer | NOT IN SCOPE | N/A | Falcon flagged as OPTIONAL for this layer |
| Booking + Chat consumers | INDIRECT RISK | MONITOR | RISK-4 (null viewer context in chat) and RISK-9 (view-layer hydration trigger) could affect native behavior if these paths are ported |

---

### SENTRY FINDINGS

---

**SENTRY FINDING — SENTRY-F-01**
- **Finding ID:** SENTRY-F-01
- **Location:** `apps/VCSM/src/features/explore/dal/search.dal.js` — line 46: `hydrateActorsByIds(actorIds).catch(() => {})`
- **Drift Level:** MODERATE DRIFT
- **Severity:** HIGH
- **Contract Violated:** Architecture Contract — DAL Layer Responsibilities
- **Current behavior:** `explore/dal/search.dal.js` calls `hydrateActorsByIds` from `@hydration` as a side effect after executing the RPC query. The hydration store is mutated inside a DAL file.
- **Expected behavior:** DAL files must do raw Supabase access only. They must not perform store mutations, trigger state updates, or call engine functions. Side effects belong in the controller or hook layer.
- **Risk:** This pattern makes the DAL non-deterministic from a testing and tracing perspective. If the RPC call succeeds but hydration fails, the DAL silently swallows the error (`.catch(() => {})`). If the Explore DAL is called from multiple layers or in parallel, store hydration becomes an unpredictable side effect of a data fetch. Engine behavior leaks into the DAL tier.
- **Recommended correction:** Remove `hydrateActorsByIds` call from `explore/dal/search.dal.js`. Move the hydration trigger to `explore/controller/` or the hook that consumes the DAL result. The DAL should return the raw search rows only — the caller decides whether to hydrate the store.
- **Architectural rationale:** DAL = persistence access only. Store mutations are a hook/controller concern. The architecture contract is explicit: DAL files must not contain side effects.

---

**SENTRY FINDING — SENTRY-F-02**
- **Finding ID:** SENTRY-F-02
- **Location:** `apps/VCSM/src/features/actors/dal/searchActors.dal.js` — lines 21–30
- **Drift Level:** MINOR DRIFT
- **Severity:** LOW
- **Contract Violated:** Architecture Contract — DAL Layer Responsibilities
- **Current behavior:** `searchActors.dal.js` performs an inline row transform at lines 21–30: maps raw RPC columns (`actor_kind`, `avatar_url`, `display_name`, etc.) to an intermediate shape (`kind`, `photo_url`, `display_name`, `vport_name`, `vport_slug`, `vport_avatar_url`). The model file `searchActors.model.js` then performs a second pass on this output.
- **Expected behavior:** DAL files return raw Supabase rows. All transforms belong in the model layer.
- **Risk:** LOW — the double-transform is functional and produces the correct domain shape. Risk is primarily maintainability: if the RPC column names change, both the DAL transform and model transform must be updated. The split also makes it harder to unit-test the transform in isolation.
- **Recommended correction:** Remove the inline transform from `searchActors.dal.js`. Return raw RPC rows. Let `searchActors.model.js` own the full transform from raw RPC columns to domain shape.
- **Architectural rationale:** Pre-existing pattern, previously noted in AvengersAssemble report. Flagged here for IRONMAN ownership decision.

---

**SENTRY FINDING — RISK-4 ASSESSMENT**
- **Finding ID:** RISK-4 (SENTRY assessment)
- **Location:** `apps/VCSM/src/features/chat/setup.js` — lines 43–67
- **Drift Level:** MODERATE DRIFT
- **Severity:** MEDIUM
- **Contract Violated:** Architecture Contract — Feature Adapter Boundary Rule; Actor Ownership Flow
- **Current behavior:** `chat/setup.js` defines a local `searchActors(query, limit)` function that directly calls `identity.search_actor_directory` RPC via Supabase client. `p_viewer_actor_id` is hardcoded to `null`. This function is passed as a dependency to `configureChatEngine`. The return shape is snake_case: `{ actor_id, display_name, username, photo_url, kind }`.
- **Expected behavior:** The injected `searchActors` function should delegate to `searchActorsAdapter` from `@/features/actors/adapters/actors.adapter`. The adapter is the approved cross-feature actors search boundary. The injected function should accept and pass `viewerActorId` so that viewer-context filtering is honored in chat search.
- **Risk:** MEDIUM — viewer-context RLS or filtering in `search_actor_directory` is permanently disabled for the chat search path. Any actor that should be hidden from the viewer based on block lists, privacy settings, or realm context will appear in chat search results. This is a viewer-identity trust gap.
- **SENTRY constraint for fix:** The injected function returns the chat engine's `DirectorySearchResultModel` shape (snake_case). The canonical `searchActorsAdapter` returns camelCase domain shape. Before substituting the adapter, the engine's `DirectorySearchResultModel` shape contract must be honored. Either: (a) the actor adapter gains a snake_case output option, or (b) `chat/setup.js` adds a thin mapping wrapper over `searchActorsAdapter`. The function signature must also add `viewerActorId` as a parameter and wire it from the engine call.
- **Recommended correction:** Replace the inline Supabase call with a wrapper over `searchActorsAdapter`. Pass `viewerActorId` through from the chat engine's call context. Add a shape mapper to produce the snake_case `DirectorySearchResultModel` that the chat engine expects.
- **Architectural rationale:** `chat/setup.js` is a dependency-injection wiring file — the pattern of injecting app-specific implementations is correct. The violation is that the injected implementation bypasses the approved actors boundary. The wiring layer is the right place to adapt between the canonical adapter output and the engine's expected contract.

---

**SENTRY FINDING — RISK-5 ASSESSMENT**
- **Finding ID:** RISK-5 (SENTRY assessment)
- **Location:** `apps/VCSM/src/features/explore/dal/search.dal.js`
- **Drift Level:** MODERATE DRIFT
- **Severity:** HIGH
- **Contract Violated:** Architecture Contract — Cross-Feature Boundary Rule; DAL Layer Responsibilities (compounded by SENTRY-F-01)
- **Current behavior:** `explore/dal/search.dal.js` owns a superset `searchActors` implementation calling `identity.search_actor_directory` directly with `filter`, `offset`, `normalizeActorRow`, deduplication, and a store hydration side effect. It does not route through `searchActorsAdapter` or `searchActors.controller.js`.
- **Expected behavior:** Explore feature should access actors search via the approved `searchActorsAdapter` from `@/features/actors/adapters/actors.adapter`. Filter and offset support that is not in the canonical actors path should be promoted into the canonical controller before consolidation.
- **Risk:** HIGH — five separate implementations of `search_actor_directory` now exist in the codebase. Any RPC contract change requires four coordinated updates. Additionally, SENTRY-F-01 compounds this: the DAL side effect makes the Explore search path non-deterministic.
- **SENTRY constraint for fix:** Consolidation requires IRONMAN to determine ownership before SENTRY can mandate a migration path. The canonical `searchActors.controller.js` does not currently support `filter` or `offset`. These must be promoted before the Explore path can safely consolidate.
- **Recommended correction (phased):** Phase 1 — remove the `hydrateActorsByIds` side effect from the DAL (per SENTRY-F-01) and move it to the Explore hook/controller. Phase 2 — promote `filter` and `offset` into `searchActors.controller.js` (IRONMAN ownership decision). Phase 3 — consolidate `explore/dal/search.dal.js` actor search onto the adapter.
- **Architectural rationale:** The DAL side effect is the most urgent violation. Consolidation of the RPC call is blocked on IRONMAN's ownership decision but the side effect removal is independent and safe to do now.

---

**SENTRY FINDING — RISK-7 ASSESSMENT**
- **Finding ID:** RISK-7 (SENTRY assessment)
- **Location:** `apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js`
- **Drift Level:** MINOR DRIFT
- **Severity:** MEDIUM
- **Contract Violated:** Architecture Contract — Cross-Feature Boundary Rule
- **Current behavior:** `searchMentionSuggestions.dal.js` calls `identity.search_actor_directory` directly. Returns `{ actor_id, kind, handle, display_name, photo_url }` where `handle` = `row.username`. Filters out rows without a `username`. Has distinct filtering: `username` is required.
- **Expected behavior:** Mention suggestions should route through the actors adapter, with the adapter or model responsible for producing the `handle` field from `username`.
- **Risk:** MEDIUM — three distinct output shapes now exist for `search_actor_directory` results across the codebase. The `handle` alias is upload-specific and creates a divergent consumer contract. `actor_id` exposed as a raw column name rather than `actorId`.
- **SENTRY constraint for fix:** The canonical `searchActorsAdapter` does not expose `handle`. A `searchMentionSuggestionsAdapter` could be a valid separate adapter export that maps `username` to `handle` in its own model. The underlying DAL call should be consolidated.
- **Recommended correction:** Create a `searchMentionSuggestions` model function in `features/actors/model/` that maps the canonical search result to the mention suggestion contract. Expose it through the actors adapter as a named export `searchMentionSuggestionsAdapter`. Replace the direct RPC call in `upload/dal/`.
- **Architectural rationale:** The divergence is in the output shape only, not the RPC call. A model layer transform can resolve the shape difference. This is lower risk than RISK-5 because no side effects are present.

---

**SENTRY FINDING — RISK-9 ASSESSMENT**
- **Finding ID:** RISK-9 (SENTRY assessment)
- **Location:** `apps/VCSM/src/features/notifications/screen/views/MyAppointmentsView.jsx` — line 5: `import { hydrateActorsByIds } from "@hydration"` / used at line 54 inside `VportCell` component
- **Drift Level:** MINOR DRIFT
- **Severity:** LOW
- **Contract Violated:** Architecture Contract — Screen/Component Layer Responsibilities
- **Current behavior:** `MyAppointmentsView.jsx` is a view screen file. It imports `hydrateActorsByIds` directly from `@hydration`. The engine function is called inside `VportCell` (an inline component defined within the view file) via a `useEffect` as a secondary hydration trigger when `summary.missing === true`.
- **Expected behavior:** View screens must not import engine functions directly. Hydration triggers belong in the hook layer. `useMyAppointments.js` already calls `hydrateActorsByIds` for the full booking actor set at load time (line 28 of the hook). The secondary per-actor hydration trigger in `VportCell` should either be removed (if the hook's initial hydration covers all cases) or moved into `useActorSummary` or a dedicated `useHydrateIfMissing` hook.
- **Risk:** LOW — `useMyAppointments` already handles hydration for the full actor set on load. The `VportCell` trigger is a defensive re-fire for actors not covered by the initial load. Functionally it rarely fires. Architecturally it is a layer violation but does not represent a security or correctness risk.
- **Recommended correction:** Option A (preferred) — verify whether `useMyAppointments` initial hydration covers all `vportActorId` values. If yes, remove the `hydrateActorsByIds` import and `useEffect` from `VportCell`. Option B — move the hydration trigger into `useActorSummary` so the hook auto-triggers hydration when a summary is missing.
- **Architectural rationale:** Component/view files must not call engine functions. Hooks are the correct layer for engine side effects.

---

### FINAL SENTRY STATUS: MODERATE DRIFT

**Summary of closures verified:** RISK-2 ✅ RISK-3 ✅ RISK-6 ✅ RISK-8 ✅

**Summary of open findings:**

| Finding | Severity | Status | Priority |
|---|---|---|---|
| SENTRY-F-01 — DAL side effect in explore/dal/search.dal.js | HIGH | OPEN — fix is independent of IRONMAN | Fix before RISK-5 consolidation |
| SENTRY-F-02 — inline DAL transform in searchActors.dal.js | LOW | OPEN — low risk | Can defer to IRONMAN cleanup pass |
| RISK-4 — chat/setup.js null viewer context bypass | MEDIUM | DEFERRED — requires engine contract alignment | Fix before RISK-2 closure is considered complete in chat context |
| RISK-5 — explore/dal/search.dal.js RPC superset + side effect | HIGH | DEFERRED — requires IRONMAN ownership decision | Phase 1 (side effect removal) is independent and safe |
| RISK-7 — upload mention suggestions distinct output contract | MEDIUM | DEFERRED — IRONMAN consolidation decision pending | Low blocking risk |
| RISK-9 — view layer engine import in MyAppointmentsView | LOW | OPEN — safe to fix independently | Fix independently |

**FOLLOW-UP REQUIRED:** REQUIRED BEFORE RELEASE

Priority handoffs:
1. **SENTRY-F-01 → Wolverine (immediate):** Remove `hydrateActorsByIds` from `explore/dal/search.dal.js`. This fix is independent of all IRONMAN decisions and unblocks Phase 1 of RISK-5.
2. **RISK-4 → Wolverine after IRONMAN:** Chat viewer-context fix requires engine shape adapter — do after IRONMAN defines consolidation contract.
3. **RISK-9 → Wolverine (immediate):** Remove engine import from view layer — independent fix, low effort.
4. **RISK-5 Phase 1 → Wolverine after SENTRY-F-01 cleared:** Move hydration side effect out of DAL.
5. **RISK-7 → IRONMAN first:** Needs ownership/adapter decision before code change.

---

## IRONMAN OWNERSHIP REPORT — 2026-05-11

**Date:** 2026-05-11
**Reviewer:** IRONMAN
**Trigger:** Phase 2 of phased verification run ordered by Cerebro. Scope: ownership decisions on RISK-1, RISK-5, RISK-7 consolidation.
**Application Scope:** VCSM
**Boundary Contract:** `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md` — enforced

---

### IRONMAN TARGET

```
Feature / Engine: actors DAL + cross-feature search_actor_directory callers
Application Scope: VCSM
Reason for ownership review:
  - RISK-1: hydration shim files with no callers — remove or enforce?
  - RISK-5: Explore actor search — consolidate onto adapter or keep as feature-owned?
  - RISK-7: Upload mention suggestions — consolidate onto adapter or keep as feature-owned?
  - Boundary clarification: what scope does searchActorsAdapter govern?
```

---

### CROSS-ROOT OWNERSHIP REVIEW

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| actors search DAL | `features/actors/` | `apps/VCSM` | COMPLIANT | Canonical path — actors controller → DAL → RPC |
| Explore actor search | `features/explore/` | `apps/VCSM` | COMPLIANT | Feature-owned search domain — not a cross-feature lookup |
| Upload mention suggestions | `features/upload/` | `apps/VCSM` | COMPLIANT | Feature-owned mention context — correct DAL → Controller → Hook chain |
| chat/setup.js search injection | `features/chat/` → engine boundary | `apps/VCSM` | MINOR DRIFT | Injected function bypasses actors adapter; wiring pattern is correct but implementation is not |
| Hydration engine | `engines/hydration/` | `engines/` | COMPLIANT | Canonical source for actor hydration |

---

### OWNERSHIP BOUNDARY RISK

| Area | Risk | Reason | Recommended Clarification |
|---|---|---|---|
| `searchActorsAdapter` scope definition | HIGH | Absence of documented scope has created confusion: should ALL `search_actor_directory` callers route through the adapter? Answer is NO — but undocumented. | Document that `searchActorsAdapter` governs cross-feature narrow actor lookup only — not feature-owned search domains |
| Hydration shim files in actors feature | MEDIUM | Two shim files with zero callers create the illusion of an actors-feature-owned hydration path — misleads static analysis and future developers | Remove shims; establish `@hydration` as the explicit and only canonical import path |
| Explore DAL side effect | HIGH | `hydrateActorsByIds` in a DAL file violates DAL layer contract and is currently SENTRY-F-01. Ownership of the fix: Explore controller layer. | Move hydration trigger to `ctrlSearchResults` or the Explore hook layer |
| Upload mention suggestions duplicate RPC | LOW | Upload correctly implements DAL → Controller → Hook. The duplicate RPC call is a maintenance risk but not an ownership violation. | Optional long-term: extend actors adapter with a `searchMentionSuggestionsAdapter` export |

---

### DATA OWNERSHIP REGISTRY

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| `identity.search_actor_directory` RPC | `features/actors/dal/searchActors.dal.js` | actors, explore, upload, chat | NONE (read-only RPC) | Supabase identity schema | CARNAGE (if schema changes) | LOGAN (this doc) |
| `engines/hydration/src/dal.js` | `engines/hydration/` | booking, chat, feed, social, dashboard, notifications | NONE (read-only) | Supabase | CARNAGE | engine audit docs |

---

### RULE OWNERSHIP REGISTRY

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| Actor search cross-feature boundary | `features/actors/adapters/actors.adapter.js` | Adapter | This doc (§9) | MEDIUM — scope is undocumented; see IRONMAN-F-01 |
| Actor hydration canonical path | `engines/hydration/` | Engine | engine audit docs | LOW — well-established; shims are vestigial |
| `viewerActorId` threading in search | `searchActors.controller.js` | Controller | This doc (§9, RISK-8) | MEDIUM — chat still hardcodes null |
| Explore search dispatch | `features/explore/controller/searchResults.controller.js` | Controller | None (gap — Logan doc missing) | MEDIUM — no Logan doc for Explore search feature |
| Mention suggestion contract | `features/upload/controller/searchMentionSuggestions.controller.js` | Controller | None (gap) | LOW — correct chain exists |

---

### RESPONSIBILITY CLASSIFICATION

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Canonical actor search (narrow lookup) | `features/actors/` (via adapter) | HIGH | Team search, block search |
| Explore multi-type search (feature-owned) | `features/explore/` | HIGH | Paginated, multi-type, richer model |
| Mention suggestion search | `features/upload/` | HIGH | Upload-specific handle contract |
| Chat actor search injection | `features/chat/setup.js` | PARTIAL | Wiring pattern correct; implementation bypasses adapter |
| Actor hydration store | `engines/hydration/` | HIGH | Canonical source; all VCSM features may call `@hydration` directly |
| Hydration shims in actors feature | ORPHANED | HIGH | No callers — shims serve no ownership purpose |

---

### IRONMAN OWNERSHIP FINDINGS

---

**IRONMAN OWNERSHIP FINDING — IRONMAN-F-01**
- **Finding ID:** IRONMAN-F-01
- **Feature / Engine:** `features/actors/` — `searchActorsAdapter` boundary scope
- **Application Scope:** VCSM
- **Responsibility Type:** Feature ownership, Contract ownership
- **Ownership Clarity:** AMBIGUOUS
- **Boundary Risk:** HIGH
- **Severity:** HIGH
- **Primary code roots:** `apps/VCSM/src/features/actors/adapters/actors.adapter.js`
- **Current ambiguity:** The `searchActorsAdapter` boundary was created to stop cross-feature direct DAL imports. However, its scope — what callers MUST use it vs. what callers may own their own search implementation — is not documented anywhere. The ambiguity has led to: (a) SENTRY and prior audit authors classifying Explore and Upload as "violations" when they may not be, and (b) future developers not knowing whether to use the adapter or write their own search.
- **Risk:** Future features that need actor search will either incorrectly route through the adapter (getting a limited search contract) or bypass it and create more duplicates without governance clarity.
- **Recommended ownership clarification:** Document the adapter scope rule in `§9 Rules / Invariants` of this doc:
  > `searchActorsAdapter` governs cross-feature narrow actor lookup: finding actors to add to a team, searching for actors to block, or any case where one feature needs the actor list returned by another feature's search logic. Feature-owned search domains (Explore search, mention autocomplete) may own their own DAL → Model → Controller → Hook chain that calls `identity.search_actor_directory` directly, provided: (1) no side effects exist in the DAL layer, (2) the feature has a controller layer that owns the call, and (3) the feature does not import from `features/actors/` internals.
- **Rationale:** The adapter boundary prevents cross-feature direct imports. It does not prevent independent feature-owned search paths from calling the same Supabase RPC. These are architecturally different concerns.

---

**IRONMAN OWNERSHIP FINDING — IRONMAN-F-02 (RISK-1 Decision)**
- **Finding ID:** IRONMAN-F-02 (RISK-1)
- **Feature / Engine:** `features/actors/dal/getActorSummariesByIds.dal.js` + `features/actors/controllers/hydrateActors.controller.js`
- **Application Scope:** VCSM
- **Responsibility Type:** DAL ownership, Feature ownership
- **Ownership Clarity:** MISSING
- **Boundary Risk:** MEDIUM
- **Severity:** MEDIUM
- **Primary code roots:**
  - `apps/VCSM/src/features/actors/dal/getActorSummariesByIds.dal.js` — 2-line re-export shim to `@hydration`
  - `apps/VCSM/src/features/actors/controllers/hydrateActors.controller.js` — 2-line re-export shim to `@hydration`
- **Engines used:** `engines/hydration/`
- **Current ambiguity:** Both files exist but have zero callers in `apps/VCSM/src`. All callers use `@hydration` directly or `@/state/actors/hydrateActors`. The shim files create a ghost ownership — they imply actors feature owns hydration, but no code uses that path.
- **Risk:** Static analysis tools classify these as dead code. Future developers may: (a) add calls to the shim paths thinking they are the canonical path, (b) add logic to the shim files expecting them to intercept callers, or (c) continue to be misled by the dead code classification concern documented in §9.
- **Recommended ownership clarification — DECISION: REMOVE**
  - **Remove** `features/actors/dal/getActorSummariesByIds.dal.js`
  - **Remove** `features/actors/controllers/hydrateActors.controller.js`
  - **Update §12 Files Map** to remove these entries
  - **Update §9 Rule 1** to simply state: All callers of `getActorSummariesByIdsDAL` must import from `@hydration` directly.
  - **Rationale:** The hydration engine is the canonical owner of `getActorSummariesByIdsDAL`, `hydrateActorsFromRows`, and `hydrateActorsByIds`. There is no reason for the actors feature to re-export engine functions when (a) zero callers use the re-export path and (b) the architecture contract says apps may import from engines directly. The shims add no interception, no transformation, and no ownership value.
- **Handoff:** Wolverine — remove these two files and update §9 and §12 of this doc.

---

**IRONMAN OWNERSHIP FINDING — IRONMAN-F-03 (RISK-5 Decision)**
- **Finding ID:** IRONMAN-F-03 (RISK-5)
- **Feature / Engine:** `features/explore/dal/search.dal.js`
- **Application Scope:** VCSM
- **Responsibility Type:** Feature ownership, DAL ownership
- **Ownership Clarity:** CLEAR (ownership), MODERATE DRIFT (DAL side effect)
- **Boundary Risk:** HIGH (for the side effect) / LOW (for the duplicate RPC call)
- **Severity:** HIGH (side effect) / RESOLVED (duplicate RPC call classification)
- **Architecture chain (verified):** `explore/dal/search.dal.js` → `explore/controller/searchResults.controller.js` → hook layer — CORRECT
- **Current ambiguity:** Prior audits classified RISK-5 as a "boundary violation" requiring consolidation onto the actors adapter. This is INCORRECT. Explore owns its search domain. The violation is not the RPC call — it is the DAL side effect (SENTRY-F-01).
- **Risk classification correction:**
  - **RISK-5 (RPC duplicate):** RECLASSIFIED as LOW risk. Explore owns this call. No consolidation onto actors adapter is required.
  - **SENTRY-F-01 (DAL side effect):** REMAINS HIGH. `hydrateActorsByIds` must be moved out of `explore/dal/search.dal.js` to the controller or hook layer.
- **Recommended ownership clarification — DECISION: KEEP EXPLORE'S OWN SEARCH DAL, FIX SIDE EFFECT ONLY**
  - Explore keeps `features/explore/dal/search.dal.js` as the feature-owned search DAL
  - Remove `hydrateActorsByIds` call from line 46 and lines 2 (import)
  - Move the hydration trigger to `features/explore/controller/searchResults.controller.js` — after `ctrlSearchResults` gets its results, it should trigger `hydrateActorsByIds` for the actor results
  - No RPC consolidation onto `searchActorsAdapter` — this is NOT required
- **Rationale:** Explore is a multi-type search dispatcher. Its actor search is one component of a broader search experience that includes posts, tags, videos, groups, and features. The output contract (`normalizeActorRow` with `actorDomain`, `banner_url`, `bio`, `rank`, `is_private`) is richer than the canonical adapter's output and serves Explore's specific rendering needs. Forcing consolidation would either require the adapter to expose Explore-specific fields (polluting the adapter) or require Explore to make a second call to enrich results (N+1). Neither is acceptable.
- **Handoff:** Wolverine (SENTRY-F-01 fix) — move hydration trigger to `ctrlSearchResults`. Logan — update §10 RISK-5 status to RECLASSIFIED.

---

**IRONMAN OWNERSHIP FINDING — IRONMAN-F-04 (RISK-7 Decision)**
- **Finding ID:** IRONMAN-F-04 (RISK-7)
- **Feature / Engine:** `features/upload/dal/searchMentionSuggestions.dal.js`
- **Application Scope:** VCSM
- **Responsibility Type:** Feature ownership, DAL ownership
- **Ownership Clarity:** CLEAR
- **Boundary Risk:** LOW
- **Severity:** LOW
- **Architecture chain (verified):** `upload/dal/searchMentionSuggestions.dal.js` → `upload/controller/searchMentionSuggestions.controller.js` → `upload/hooks/useMentionAutocomplete.js` — CORRECT
- **Current ambiguity:** RISK-7 was classified as a cross-feature boundary concern. On review, the upload feature has a complete and correct DAL → Controller → Hook chain. It does not import from `features/actors/` internals. The only concern is the duplicate RPC call.
- **Risk classification correction:**
  - **RISK-7 (RPC duplicate):** RECLASSIFIED as LOW risk. Upload owns this call. The mention suggestion contract is distinct: `{ actor_id, kind, handle, display_name, photo_url }` with `username`-required filtering. This is appropriate to own locally.
  - The canonical `searchActorsAdapter` does not return `handle` and does not enforce `username` presence. Forcing consolidation would require adding upload-specific requirements to the canonical adapter or model.
- **Recommended ownership clarification — DECISION: KEEP UPLOAD'S OWN MENTION DAL**
  - Upload keeps `features/upload/dal/searchMentionSuggestions.dal.js` as the feature-owned mention search DAL
  - No consolidation onto `searchActorsAdapter` is required
  - Optional long-term improvement: rename the file to make its purpose clearer, and document that the mention contract intentionally differs from canonical actor search
- **Rationale:** Mention suggestions serve a real-time autocomplete UI with strict filtering requirements (`username` required, returns `handle` alias). The output contract is intentionally minimal. The correct architecture chain already exists. Forcing this into the canonical actors adapter would pollute the adapter with a feature-specific contract or force a double-mapping step with no architectural benefit.
- **Handoff:** Logan — update §10 RISK-7 status to RECLASSIFIED.

---

### BOUNDARY SCOPE CLARIFICATION — OFFICIAL DECISION

**`searchActorsAdapter` governs:**
- Cross-feature narrow actor lookup only
- Use cases: team member candidate search, block search actor lookup, any feature that needs to look up actors but does not own an actor search domain

**`searchActorsAdapter` does NOT govern:**
- Feature-owned search domains (Explore, mention autocomplete, chat actor directory injection)
- These features may own their own DAL → Controller → Hook chain calling `identity.search_actor_directory` directly
- The only DAL-layer constraint that applies universally: **no side effects in DAL files** (SENTRY-F-01 applies regardless of ownership)

---

### OWNERSHIP SUMMARY — RISK TABLE DECISIONS

| Risk | Previous Classification | IRONMAN Decision | Action Required |
|---|---|---|---|
| RISK-1 — hydration shims | OPEN / IRONMAN | REMOVE both shim files | Wolverine removes files; Logan updates §9 and §12 |
| RISK-5 — Explore duplicate RPC | HIGH / DEFERRED | RECLASSIFIED to LOW — Explore owns its search | Wolverine moves side effect only (per SENTRY-F-01); Logan updates §10 |
| RISK-7 — upload mention duplicate RPC | MEDIUM / DEFERRED | RECLASSIFIED to LOW — Upload owns its mention contract | No code change required; Logan updates §10 |
| SENTRY-F-01 — Explore DAL side effect | HIGH (SENTRY) | CONFIRMED HIGH — fix is DAL cleanup, not consolidation | Wolverine moves `hydrateActorsByIds` to `ctrlSearchResults` |

---

### NATIVE PARITY OWNERSHIP

| Area | PWA Owner | Native Owner | Parity Doc | Risk |
|---|---|---|---|---|
| Actors actor search (narrow) | `features/actors/adapters/actors.adapter.js` | Not yet ported | N/A | LOW — actors adapter is internal infrastructure |
| Explore search | `features/explore/` | Not yet ported | N/A | INDIRECT — if Explore is ported natively, side-effect fix (SENTRY-F-01) must be in place first |
| Mention suggestions | `features/upload/` | Not yet ported | N/A | LOW |

---

### FINAL IRONMAN OWNERSHIP STATUS: PARTIAL → CLARIFIED

**Pre-review state:** AMBIGUOUS (scope of searchActorsAdapter undefined; RISK-5 and RISK-7 incorrectly classified as consolidation requirements)

**Post-review state:** CLARIFIED — ownership boundaries now defined; two risks reclassified; two shim files flagged for deletion; one DAL side effect remains as the only HIGH-priority code action

**FOLLOW-UP REQUIRED:**
1. Wolverine — remove `getActorSummariesByIds.dal.js` and `hydrateActors.controller.js`
2. Wolverine — move `hydrateActorsByIds` side effect from `explore/dal/search.dal.js` to `ctrlSearchResults`
3. Logan — update §9, §10, §12 to reflect IRONMAN decisions
4. Logan — add IRONMAN-F-01 scope rule to §9 Rules / Invariants

---

## LOGAN REVIEW REPORT — 2026-05-11

**Date:** 2026-05-11
**Reviewer:** LOGAN
**Trigger:** Phase 3 of phased verification run ordered by Cerebro. Scope: reconcile §9, §10, §12 after SENTRY and IRONMAN findings.
**Task:** Documentation reconciliation — actors DAL doc post SENTRY + IRONMAN audit pass
**Application Scope:** VCSM
**Documentation Scope:** VCSM
**Boundary Contract:** `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md` — enforced
**Architecture Contract:** `ARCHITECTURE.md` — consulted

---

### DOCUMENTATION SCOPE GATE

| Documentation Area | In Scope | Update Allowed | Reason |
|---|---|---|---|
| `vcsm/dal/vcsm.dal.actors.md` | YES | YES | VCSM doc scope — this is the target file |
| Engine audit files (`engines/hydration/docs/`) | NO | NO | No engine code was modified in this pass |
| Wentrex docs | NO | NO | Out of boundary |
| Traffic docs | NO | NO | Out of boundary |

---

### RELEVANT DOCS

| Doc Path | Status | Truth Status | Notes |
|---|---|---|---|
| `logan/vcsm/dal/vcsm.dal.actors.md` | ACTIVE — this file | PARTIAL | §9/§10/§12 are stale relative to SENTRY + IRONMAN findings appended below |

---

### CODE REVIEWED

| Code Path | Purpose | Status |
|---|---|---|
| `features/actors/adapters/actors.adapter.js` | Cross-feature adapter boundary | VERIFIED — exports `searchActorsAdapter`, delegates to controller |
| `features/actors/controllers/searchActors.controller.js` | Canonical actor search controller | VERIFIED — accepts `viewerActorId`, threads to DAL |
| `features/actors/dal/searchActors.dal.js` | Canonical actor search DAL | VERIFIED — inline row transform at lines 21–30 (SENTRY-F-02, pre-existing) |
| `features/actors/dal/getActorSummariesByIds.dal.js` | Hydration shim | VERIFIED ORPHANED — 2-line re-export, zero callers; pending deletion (IRONMAN-F-02) |
| `features/actors/controllers/hydrateActors.controller.js` | Hydration shim | VERIFIED ORPHANED — 2-line re-export, zero callers; pending deletion (IRONMAN-F-02) |
| `features/dashboard/vport/controller/vportTeamAccess.controller.js` | Vport team controller | VERIFIED CLEAN — uses `searchActorsAdapter`, RISK-2 closed |
| `features/chat/setup.js` | Chat engine wiring | VERIFIED DRIFT — inline RPC call, null viewer context (RISK-4, DEFERRED) |
| `features/explore/dal/search.dal.js` | Explore multi-type search DAL | VERIFIED DRIFT — DAL side effect `hydrateActorsByIds` at line 46 (SENTRY-F-01, action required) |
| `features/explore/controller/searchResults.controller.js` | Explore search controller | VERIFIED — correct layer; hydration trigger should move here from DAL |
| `features/upload/dal/searchMentionSuggestions.dal.js` | Mention suggestions DAL | VERIFIED — correct DAL → Controller → Hook chain; distinct contract (RISK-7 RECLASSIFIED LOW) |
| `features/notifications/screen/views/MyAppointmentsView.jsx` | Notifications view | VERIFIED DRIFT — imports `@hydration` directly at view layer (RISK-9, action required) |

---

### COMMAND EVIDENCE REGISTRY

| Command | Report Path | Relevance | Status |
|---|---|---|---|
| ARCHITECT | Appended in §14 (2026-05-11) | Dead code verification, call chain tracing | PRESENT |
| SENTRY | Appended in this file (2026-05-11) | Boundary compliance, layer violations, closure verification | PRESENT |
| IRONMAN | Appended in this file (2026-05-11) | Ownership decisions on RISK-1/5/7; adapter scope clarification | PRESENT |
| VENOM | Appended in AvengersAssemble section (2026-05-11) | Viewer-context inversion finding | PRESENT |
| LOKI | Not run | Runtime verification of search paths | MISSING (optional) |
| KRAVEN | Not run | No performance scope | N/A |
| CARNAGE | Not run | No schema changes | N/A |

---

### DRIFT FINDINGS

**LOGAN DRIFT FINDING — DF-04**
- **Finding ID:** DF-04
- **Doc Path:** `§9 Rules / Invariants`
- **Code Path:** `features/actors/dal/getActorSummariesByIds.dal.js`, `features/actors/controllers/hydrateActors.controller.js`
- **Drift Status:** STALE
- **Drift Severity:** MEDIUM
- **Documentation Truth Status:** STALE
- **Current doc behavior:** Rule 1 instructs "never add business logic to this file" and treats it as an expected shim. Rule 6 explains static analysis will show zero callers and that this is expected.
- **Actual code behavior:** IRONMAN-F-02 has determined both shim files should be deleted. They have zero callers and serve no interception, transformation, or ownership purpose.
- **Risk:** Rule 1 and Rule 6 will actively mislead developers after shims are deleted. They must be replaced.
- **Recommended documentation update:** After Wolverine removes the shim files, replace Rule 1 with: "All callers of `getActorSummariesByIdsDAL`, `hydrateActorsByIds`, and `hydrateActorsFromRows` must import from `@hydration` directly. No actors-feature shim path exists." Remove Rule 6 entirely.

**LOGAN DRIFT FINDING — DF-05**
- **Finding ID:** DF-05
- **Doc Path:** `§9 Rules / Invariants` — Rule 3 scope
- **Code Path:** `features/explore/dal/search.dal.js`, `features/upload/dal/searchMentionSuggestions.dal.js`
- **Drift Status:** PARTIAL
- **Drift Severity:** HIGH
- **Documentation Truth Status:** PARTIAL
- **Current doc behavior:** Rule 3 states "Cross-feature callers of actor search must go through `actors.adapter.js`" — this is unqualified and implies ALL callers of `search_actor_directory` must route through the adapter.
- **Actual code behavior:** IRONMAN-F-01 has established that `searchActorsAdapter` governs cross-feature narrow actor lookups only. Feature-owned search domains (Explore, Upload) may own their own search DAL.
- **Risk:** Without this scoping rule documented, every future feature that needs actor search will either incorrectly use the adapter (wrong contract) or be flagged as a violation (incorrectly).
- **Recommended documentation update:** After IRONMAN decisions are applied, update Rule 3 to add the scope qualifier per IRONMAN-F-01. Add Rule 7: "DAL files must not call engine functions as side effects."

**LOGAN DRIFT FINDING — DF-06**
- **Finding ID:** DF-06
- **Doc Path:** `§10 Failure Risks` — risk table and detail blocks
- **Code Path:** Multiple
- **Drift Status:** STALE
- **Drift Severity:** HIGH
- **Documentation Truth Status:** STALE
- **Current doc behavior:** RISK-5 is classified HIGH/DEFERRED requiring consolidation onto actors adapter. RISK-7 is classified MEDIUM/DEFERRED for consolidation. RISK-1 detail says "decision: remove the shim (if callers are already canonical) or enforce its use."
- **Actual code behavior:** IRONMAN has reclassified RISK-5 to LOW (Explore owns its search domain), RISK-7 to LOW (Upload owns its mention contract), and RISK-1 to PENDING_DELETION (IRONMAN-F-02 decided: remove both shim files).
- **Risk:** HIGH — developers and future audit commands will see RISK-5 as HIGH and attempt unnecessary consolidation that would degrade Explore's search quality.
- **Recommended documentation update (to be applied by Wolverine):**
  - RISK-1: Status → PENDING_DELETION. Detail → update to reflect IRONMAN-F-02 decision.
  - RISK-5: Severity → LOW, Status → RECLASSIFIED. Detail → "Explore owns its actor search domain. No consolidation onto actors adapter required. The only action item is moving `hydrateActorsByIds` from the DAL to the controller (per SENTRY-F-01)."
  - RISK-7: Severity → LOW, Status → RECLASSIFIED. Detail → "Upload owns its mention suggestion contract. No consolidation required. Correct DAL → Controller → Hook chain verified."

**LOGAN DRIFT FINDING — DF-07**
- **Finding ID:** DF-07
- **Doc Path:** `§12 Files Map`
- **Code Path:** `features/actors/dal/getActorSummariesByIds.dal.js`, `features/actors/controllers/hydrateActors.controller.js`
- **Drift Status:** STALE (pending action)
- **Drift Severity:** LOW
- **Documentation Truth Status:** STALE (pending action)
- **Current doc behavior:** Both shim files shown as `ACTIVE (shim)`.
- **Actual code behavior:** IRONMAN-F-02 decided both should be deleted. They are currently still present in the repo but are pending deletion.
- **Recommended documentation update:** After Wolverine deletes the files, update §12 to remove these two rows.

---

### CANONICAL STATE — WHAT §9, §10, §12 MUST REFLECT AFTER NEXT WOLVERINE PASS

This section records the authoritative post-audit state so Wolverine can apply changes cleanly.

#### §9 Rules / Invariants — Target State

```
1. All callers of `getActorSummariesByIdsDAL`, `hydrateActorsByIds`, and `hydrateActorsFromRows` must import from `@hydration` directly. No actors-feature shim path exists.
2. Cross-feature callers of actor search must go through `actors.adapter.js` → `searchActors.controller.js`. Direct cross-feature DAL imports are forbidden by the architecture contract.
3. `actors.adapter.js` exposes `searchActorsAdapter(params)` as the approved public actor-search surface for cross-feature narrow actor lookups (team search, block search). Feature-owned search domains (Explore, Upload mention suggestions, chat DI wiring) may call `identity.search_actor_directory` via their own DAL → Controller → Hook chain without routing through the actors adapter.
4. DAL files must not call engine functions as side effects. `hydrateActorsByIds` and `hydrateActorsFromRows` belong in the controller or hook layer only.
5. `select('*')` is banned — all Supabase queries must use explicit column lists. The `searchActors.dal.js` RPC call complies (RPC returns a defined contract).
6. The `searchActors.dal.js` DAL has a pre-existing inline row transform at lines 21–30. This is SENTRY-F-02 (MINOR DRIFT). Do not add more transform logic here — model layer owns all transforms.
```

#### §10 Failure Risks — Target State

| Risk | ID | Severity | Status | Handoff |
|---|---|---|---|---|
| Hydration shim files — pending deletion | RISK-1 | LOW | PENDING_DELETION | Wolverine |
| `vportTeamAccess.controller.js` direct DAL import | RISK-2 | HIGH | FIXED | SENTRY (verified) |
| `actors.adapter.js` empty stub | RISK-3 | HIGH | FIXED | SENTRY (verified) |
| `chat/setup.js` inline RPC — null viewer context | RISK-4 | MEDIUM | DEFERRED | Wolverine (after IRONMAN contract alignment) |
| `explore/dal/search.dal.js` DAL side effect | RISK-5 | HIGH (side effect only) | OPEN (SENTRY-F-01) | Wolverine |
| `blocks.dal.js` duplicate RPC | RISK-6 | MEDIUM | FIXED | SENTRY (verified) |
| `upload/searchMentionSuggestions.dal.js` distinct contract | RISK-7 | LOW | RECLASSIFIED — no action | IRONMAN (verified: feature-owned) |
| `searchActors.controller.js` drops `viewerActorId` | RISK-8 | HIGH | FIXED | SENTRY (verified) |
| `MyAppointmentsView.jsx` view-layer engine import | RISK-9 | LOW | OPEN | Wolverine |
| `searchActors.dal.js` inline DAL transform | SENTRY-F-02 | LOW | OPEN (pre-existing, low priority) | Wolverine (future cleanup) |

#### §12 Files Map — Target State _(2026-05-11 planning target — superseded by live §12 above)_

> **Note:** This target state was recorded as of 2026-05-11 before the 2026-05-14 ENGINE scope cleanup. `extractActorIdsForHydration.model.js` was subsequently deleted on 2026-05-14. Refer to §12 for the authoritative current file inventory.

| File | Layer | Status | Notes |
|---|---|---|---|
| `features/actors/dal/getActorSummariesByIds.dal.js` | DAL | PENDING_DELETION | Shim with zero callers. Deletion approved per IRONMAN-F-02. |
| `features/actors/dal/searchActors.dal.js` | DAL | ACTIVE | Calls `identity.search_actor_directory` RPC. Has pre-existing inline transform (SENTRY-F-02). |
| `features/actors/model/extractActorIdsForHydration.model.js` | Model | ~~ACTIVE~~ → **DELETED 2026-05-14** | Was planned as ACTIVE at this point; deleted in subsequent ENGINE cleanup. |
| `features/actors/model/searchActors.model.js` | Model | ACTIVE | Maps RPC rows to domain shape. |
| `features/actors/controllers/hydrateActors.controller.js` | Controller | PENDING_DELETION | Shim with zero callers. Deletion approved per IRONMAN-F-02. |
| `features/actors/controllers/searchActors.controller.js` | Controller | ACTIVE | Composes DAL + model. Accepts `viewerActorId`. |
| `features/actors/adapters/actors.adapter.js` | Adapter | ACTIVE | Exports `searchActorsAdapter(params)`. Cross-feature narrow actor lookup boundary only. |

---

### README VIOLATION REPORT

No README files found in scope.

---

### PROMPT PROVENANCE STATUS

Prompt Logged: YES (this session)
Planning File: `zNOTFORPRODUCTION/_ACTIVE/planning/may/11/` — see existing session planning file
Prompt Entry Timestamp: 2026-05-11
Exception: None

---

### ENGINE AUDIT STATUS

Engine Changed: NO
Latest Audit: Check `engines/hydration/docs/` for latest `HYDRATION_ENGINE_AUDIT_VN.md`
New Audit Required: NO — no engine code was modified this pass
New Audit Path: N/A

---

### DOCUMENTATION STATUS: PARTIAL

§1–§8 and §11 remain aligned. §9, §10, §12 are STALE relative to SENTRY + IRONMAN findings. Canonical target state documented above. Actual doc sections should not be edited until Wolverine executes the pending code actions (shim deletion, DAL side effect removal) so documentation truth can be verified against final code state.

---

### NATIVE PARITY ROUTING

| Logan Doc | Native Relevance | Falcon Review | Reason | Module File |
|---|---|---|---|---|
| `vcsm.dal.actors.md` | INDIRECT | OPTIONAL | Actor search and hydration consumers (booking, chat) are native-relevant; the DAL layer itself is internal infrastructure | N/A |

**Note:** RISK-5 reclassification (Explore owns its actor search) has no direct native impact at this time. RISK-4 (chat null viewer context) is indirectly native-relevant — if chat search is ported natively, viewer context must be wired.

---

### FINAL LOGAN STATUS: PARTIAL

Documentation is structurally sound. Three sections (§9, §10, §12) require targeted updates that are blocked on Wolverine completing:
1. Shim file deletion (IRONMAN-F-02)
2. Explore DAL side effect removal (SENTRY-F-01)
3. MyAppointmentsView engine import removal (RISK-9)

Once those code actions are verified, Logan should return to update §9, §10, §12 with the canonical target state documented in this report.

**RECOMMENDED NEXT STEP:** Run Wolverine with scope = fix SENTRY-F-01, RISK-1 (shim deletion), and RISK-9, then return to Logan for final §9/§10/§12 reconciliation.

---

## LOKI RUNTIME REPORT — 2026-05-11

**Date:** 2026-05-11
**Reviewer:** LOKI
**Trigger:** Phase 4 of phased verification run ordered by Cerebro. Scope: runtime verification of search actor chains.
**Application Scope:** VCSM
**Observed flow:** `identity.search_actor_directory` call paths — canonical adapter chain, Explore search, Upload mention autocomplete, chat DI injection
**TypeScript output allowed:** NO
**Evidence type for all findings:** INFERRED (code static read — no live runtime instrumentation was applied; all findings derived from source inspection)

---

### LOKI TARGET

```
Observed flow: All searchActors execution paths — canonical adapter chain, Explore search, Upload mention autocomplete, chat DI injection
Application Scope: VCSM
Entry points:
  - useVportTeamAccess (team candidate search via canonical adapter)
  - useSearchScreenController (Explore multi-type search)
  - useMentionAutocomplete (Upload mention suggestions)
  - chat/setup.js → configureChatEngine (chat DI injection)
Reason for observation: Verify canonical search paths post-SENTRY fixes; identify runtime risks from DAL side effect (SENTRY-F-01); map viewer-context threading gaps at runtime; assess caching behavior
TypeScript output allowed: NO
```

---

### TRACE IDENTITY

**Trace A — Canonical team search path**
- **Route:** VPORT team management screen
- **Screen:** `VportDashboardTeamScreen.jsx`
- **Entry hook:** `useVportTeamAccess`
- **Session state class:** authenticated VPORT owner
- **Evidence type:** INFERRED from source inspection

**Trace B — Explore multi-type search**
- **Route:** `/explore` or search overlay
- **Screen:** Explore search screen
- **Entry hook:** `useSearchActor` → `useSearchScreenController`
- **Session state class:** authenticated Citizen
- **Evidence type:** INFERRED from source inspection

**Trace C — Upload mention autocomplete**
- **Route:** Post creation / caption entry
- **Screen:** Upload / post composition screen
- **Entry hook:** `useMentionAutocomplete`
- **Session state class:** authenticated Citizen
- **Evidence type:** INFERRED from source inspection

**Trace D — Chat actor search**
- **Route:** Chat screen, new message, or member search
- **Entry:** `configureChatEngine` DI injection
- **Session state class:** authenticated Citizen
- **Evidence type:** INFERRED from source inspection

---

### EXECUTION FLOW MAP

#### Trace A — Canonical Team Search (Post-Fix State)

| Step | Operation | Caller | Mode | Notes |
|---|---|---|---|---|
| 1 | `useVportTeamAccess` fires `loadMembers` | React `useEffect` | SYNC setup | Triggered on actorId/isOwner change |
| 2 | `getTeamAccessController(actorId, sessionActorId)` | Hook | ASYNC | Ownership verified via `assertActorOwnsVportActorController` |
| 3 | `assertActorOwnsVportActorController` | Controller | ASYNC | DB read — `actor_owners` table |
| 4 | `readVportProfileByActorIdDAL({ actorId })` | Controller | ASYNC | DB read — resolves profileId |
| 5 | `fetchTeamMembersByProfileId(profileId)` | Controller | ASYNC | DB read — team members |
| 6 | `hydrateActorsByIds(ids)` | Hook (line 47) | ASYNC fire-and-forget | Store hydration — correct layer |
| 7 | `searchTeamCandidatesController({ query, viewerActorId })` | Hook (on search input) | ASYNC | User-triggered search |
| 8 | `searchActorsAdapter({ query, limit: 12, viewerActorId })` | Controller | ASYNC | Crosses adapter boundary |
| 9 | `searchActors({ query, limit, viewerActorId })` | Adapter → Controller | ASYNC | viewer context threaded ✅ |
| 10 | `searchActorsDAL({ query, limit, viewerActorId })` | Controller | ASYNC | RPC call |
| 11 | `identity.search_actor_directory` RPC | DAL | ASYNC | DB: identity schema |
| 12 | `mapSearchActorsRows(rows)` | Controller | SYNC | Model transform |

**Mode:** SERIAL (ownership check before team load; user-triggered search is independent)
**Viewer context:** THREADED — `sessionActorId` → `searchTeamCandidatesController` → `searchActorsAdapter` → `searchActors.controller.js` → `searchActorsDAL` ✅

#### Trace B — Explore Search

| Step | Operation | Caller | Mode | Notes |
|---|---|---|---|---|
| 1 | User types query | UI event | SYNC | Debounced in hook |
| 2 | `useSearchScreenController` checks cache | Hook | SYNC | 45s TTL, 120-entry in-memory LRU cache |
| 3a (cache HIT) | Return cached results | Hook cache | SYNC | No DB call — no DAL side effect fires |
| 3b (cache MISS) | `loadSearchCached` calls loader | Hook | ASYNC | In-flight coalescing prevents duplicate calls |
| 4 | `ctrlSearchResults({ query, filter })` | Hook → Controller | ASYNC | Returns Promise.all across search types |
| 5 | `searchDal(query, filter, {})` | Controller | ASYNC | Dispatches by filter type |
| 6 | `searchActors(query, opts)` (private) | DAL | ASYNC | Direct RPC call — no adapter |
| 7 | `identity.search_actor_directory` RPC | DAL | ASYNC | DB: identity schema |
| 8 | `normalizeActorRow(row)` | DAL | SYNC | Model transform inside DAL (should be in controller) |
| 9 | Deduplication | DAL | SYNC | Set-based dedupe |
| **10 ⚠️** | `hydrateActorsByIds(actorIds)` | **DAL** | ASYNC fire-and-forget | **SIDE EFFECT IN DAL — SENTRY-F-01** |
| 11 | Results returned to controller | DAL → Controller | SYNC | |
| 12 | `dedupeByKindAndId(results)` | Controller | SYNC | Second-pass dedupe at controller |
| 13 | Results cached | Hook | SYNC | Written to `searchResultCache` |

**Mode:** MIXED — actor/post searches run in parallel via `Promise.all`; internal dedupe is serial
**Viewer context:** ACCEPTED by DAL (`viewerActorId = null` by default) — NOT passed from hook → controller → DAL. Viewer context NOT threaded for Explore search.
**Cache:** 45s TTL in-memory, 120-entry LRU, in-flight coalescing — FUNCTIONAL

#### Trace C — Upload Mention Autocomplete

| Step | Operation | Caller | Mode | Notes |
|---|---|---|---|---|
| 1 | User types `@prefix` | UI event | SYNC | Caret detection in `useMentionAutocomplete` |
| 2 | 120ms debounce fires | Hook | ASYNC | `setTimeout` guard |
| 3 | Race condition check | Hook | SYNC | `requestIdRef` stale-response guard |
| 4 | `ctrlSearchMentionSuggestions({ query, limit: 8 })` | Hook | ASYNC | No `viewerActorId` passed |
| 5 | `searchMentionSuggestions(query, { limit })` | Controller | ASYNC | No `viewerActorId` threaded |
| 6 | `identity.search_actor_directory` RPC | DAL | ASYNC | DB: identity schema |
| 7 | Filter rows without `username` | DAL | SYNC | Upload-specific constraint |
| 8 | Map to `{ actor_id, kind, handle, display_name, photo_url }` | DAL | SYNC | Handle alias |
| 9 | Results returned | DAL → Controller → Hook | SYNC | |

**Mode:** SERIAL
**Viewer context:** NOT threaded — `ctrlSearchMentionSuggestions` does not accept `viewerActorId`; DAL defaults to `null`
**Cache:** NONE — every debounced keystroke fires a fresh RPC call. No in-flight coalescing.

#### Trace D — Chat Actor Search (DI Injection)

| Step | Operation | Caller | Mode | Notes |
|---|---|---|---|---|
| 1 | Chat engine calls injected `searchActors(query, limit)` | Engine → DI function | ASYNC | No `viewerActorId` parameter |
| 2 | `identity.search_actor_directory` RPC | DI function | ASYNC | Hardcodes `p_viewer_actor_id: null` |
| 3 | Map to snake_case `DirectorySearchResultModel` | DI function | SYNC | Engine-specific output shape |
| 4 | Results returned to engine | DI function | SYNC | |

**Mode:** SERIAL
**Viewer context:** HARDCODED NULL — no viewer context possible in current DI implementation
**Cache:** NONE — depends on chat engine's own caching strategy (not visible from this layer)

---

### DATABASE READ SUMMARY

| Table/View/RPC | Paths Using It | Call Count Per Search | Cache | Notes |
|---|---|---|---|---|
| `identity.search_actor_directory` | canonical adapter, Explore DAL, upload DAL, chat DI | 1 per search (per path) | Explore: 45s TTL; others: NONE | 4 independent call sites; each fires on user input |
| `vc.actors` (via hydration engine) | useVportTeamAccess, Explore DAL (side effect) | Variable | Hydration store, 5min TTL | Hydration called correctly in hook layer (A); incorrectly in DAL (B) |
| `actor_owners` | vportTeamAccess ownership check | 1 per team access | NONE | Pre-search ownership gating |
| vport profile (for profileId) | vportTeamAccess | 1 per team load | NONE | Serial with ownership check |
| team members table | vportTeamAccess | 1 per team load | NONE | Fetched on every mount |

---

### DUPLICATE QUERY FINGERPRINTS

| Fingerprint | Count | Paths | Impact |
|---|---|---|---|
| `identity.search_actor_directory` | 4 independent implementations | canonical adapter, Explore DAL, upload DAL, chat DI | MEDIUM — maintenance risk; RPC contract change requires 4 updates. Ownership clarified by IRONMAN (acceptable). |

---

### CACHE OBSERVATIONS

| Cache | Path | Status | TTL | Evidence | Impact |
|---|---|---|---|---|---|
| `useSearchScreenController` local Map | Explore | FUNCTIONAL | 45s | Source inspection — `readSearchCache`/`writeSearchCache` present | Prevents repeat RPC calls for same query within 45s. In-flight coalescing also present. |
| Hydration store (`engines/hydration/src/store.js`) | All paths (via `hydrateActorsByIds`) | FUNCTIONAL | 5min | Documented in §6 Source of Truth | Actors hydrated on search can be served from store on subsequent renders |
| Upload mention autocomplete | Upload | NONE | N/A | No cache in `useMentionAutocomplete` or `ctrlSearchMentionSuggestions` | Every debounced keystroke triggers a fresh RPC call — up to 8 RPC calls for an 8-char handle |
| Chat search | Chat DI | UNKNOWN | UNKNOWN | Depends on chat engine internals — not inspectable from DI layer | RISK UNKNOWN — if engine has no cache, every chat search fires RPC |
| Canonical actor search (team/block) | vportTeamAccess, Blocks | NONE | N/A | No cache in `searchActorsAdapter` or `searchActors.controller.js` | Acceptable — these are user-triggered one-off lookups, not high-frequency paths |

---

### LOKI RUNTIME FINDINGS

---

**LOKI RUNTIME FINDING — LOKI-F-01**
- **Finding ID:** LOKI-F-01
- **Location:** `apps/VCSM/src/features/explore/dal/search.dal.js` — line 46
- **Application Scope:** VCSM
- **Runtime Risk Category:** Cache bypass / Render loop risk
- **Evidence Type:** INFERRED
- **Observation Source:** Source code inspection — `hydrateActorsByIds(actorIds).catch(() => {})` at DAL line 46
- **Confidence:** HIGH
- **Current runtime behavior:** `hydrateActorsByIds` fires inside the DAL on every cache MISS. On cache HITs (Explore hook's 45s TTL), the DAL is NOT called, so the side effect does not fire redundantly. However: the DAL can be called from any context — if a test, a second consumer, or a future caller invokes `searchDal` directly, the hydration side effect fires unpredictably in those contexts too.
- **Runtime impact:** MEDIUM — currently limited by the hook cache, but the side effect is structurally unguarded. If the hook cache is bypassed or the DAL is called outside the hook chain, hydration fires without lifecycle context.
- **Read Amplification:** Not a read amplification issue — the hydration call is a store write, not a DB read.
- **Timing impact:** LOW — `hydrateActorsByIds` is fire-and-forget. It does not block the search result return.
- **Caller chain:** `useSearchScreenController` → cache MISS → `ctrlSearchResults` → `searchDal` → `searchActors` (private) → RPC → **`hydrateActorsByIds`** (side effect) → hydration store write
- **Cache status:** Explore hook: HIT prevents DAL call. Other callers: UNKNOWN.
- **Severity:** HIGH (architecture) / LOW (runtime risk at current usage)
- **Recommended handoff:** Wolverine — move `hydrateActorsByIds` call to `ctrlSearchResults` in `explore/controller/searchResults.controller.js`. Extract actor IDs from the normalized results and trigger hydration there. Remove import from DAL.
- **Rationale:** Consistent with SENTRY-F-01 finding. DAL side effects violate the architecture contract regardless of current runtime impact. Fix is low-risk and independent.

---

**LOKI RUNTIME FINDING — LOKI-F-02**
- **Finding ID:** LOKI-F-02
- **Location:** `apps/VCSM/src/features/upload/hooks/useMentionAutocomplete.js` + `apps/VCSM/src/features/upload/controller/searchMentionSuggestions.controller.js`
- **Application Scope:** VCSM
- **Runtime Risk Category:** Cache bypass — repeated RPC calls per keystroke
- **Evidence Type:** INFERRED
- **Observation Source:** Source code inspection — no cache in `useMentionAutocomplete`, no cache in `ctrlSearchMentionSuggestions`, 120ms debounce only
- **Confidence:** HIGH
- **Current runtime behavior:** Every debounced keystroke fires a fresh `identity.search_actor_directory` RPC call. Typing `@johnd` with 120ms between each key produces 5 RPC calls: `j`, `jo`, `joh`, `john`, `johnd`. Prior queries are not reused — if the user types `@john`, deletes to `@joh`, then retypes `n`, it fires a 6th RPC call for `john` again.
- **Runtime impact:** MEDIUM — mention search is user-triggered and infrequent, but in the post composition flow (high engagement path) this creates unnecessary RPC calls. No race condition risk (protected by `requestIdRef`).
- **Read Amplification:** N/A — RPC calls, not DB reads per result.
- **Timing impact:** LOW per call — each RPC call is lightweight. Aggregate: 5–10 RPC calls per mention typed.
- **Caller chain:** `useMentionAutocomplete` → 120ms debounce → `ctrlSearchMentionSuggestions` → `searchMentionSuggestions` DAL → `identity.search_actor_directory` RPC
- **Cache status:** NONE
- **Severity:** LOW
- **Recommended handoff:** Wolverine (optional improvement) — add a simple in-hook Map cache keyed by `query` with a 30s TTL. Check cache before firing `ctrlSearchMentionSuggestions`. This is a nice-to-have, not blocking.
- **Rationale:** The debounce protects against excessive calls during fast typing, but does not prevent refires for previously seen queries. A short TTL cache would eliminate repeat RPC calls for the same prefix.

---

**LOKI RUNTIME FINDING — LOKI-F-03**
- **Finding ID:** LOKI-F-03
- **Location:** `apps/VCSM/src/features/upload/controller/searchMentionSuggestions.controller.js` + `apps/VCSM/src/features/upload/hooks/useMentionAutocomplete.js`
- **Application Scope:** VCSM
- **Runtime Risk Category:** Viewer context gap — identical to RISK-4 / RISK-8 pattern
- **Evidence Type:** INFERRED
- **Observation Source:** Source code inspection — `ctrlSearchMentionSuggestions({ query, limit })` signature — no `viewerActorId` parameter
- **Confidence:** HIGH
- **Current runtime behavior:** The upload mention autocomplete always calls `identity.search_actor_directory` with `p_viewer_actor_id: null`. This means if the RPC uses viewer context for filtering (block lists, private accounts, realm restrictions), those filters are silently disabled for mention suggestions.
- **Runtime impact:** MEDIUM — a user mentioning `@johnd` may see blocked or otherwise hidden actors in their autocomplete suggestions. This is a viewer-trust boundary gap similar to RISK-4 (chat) and the pre-fix state of RISK-8 (canonical controller).
- **Read Amplification:** N/A
- **Timing impact:** None
- **Caller chain:** `useMentionAutocomplete` (does not have actorId context) → `ctrlSearchMentionSuggestions({ query, limit })` → DAL → RPC (null viewer)
- **Cache status:** NONE
- **Severity:** MEDIUM
- **Recommended handoff:** Wolverine — add `viewerActorId` to `ctrlSearchMentionSuggestions` signature; pass it from `useMentionAutocomplete` (which has access to identity context). Note: `useMentionAutocomplete` does not currently read identity state — this requires adding `useIdentity()` to the hook or receiving `viewerActorId` as a prop.
- **Rationale:** Block lists and privacy filtering from `search_actor_directory` depend on `p_viewer_actor_id`. Without it, all three viewer-triggered search paths (chat, mention, explore) silently bypass any viewer-based filtering the RPC provides.

---

**LOKI RUNTIME FINDING — LOKI-F-04**
- **Finding ID:** LOKI-F-04
- **Location:** `apps/VCSM/src/features/explore/hooks/useSearchScreenController.js` — viewer context gap
- **Application Scope:** VCSM
- **Runtime Risk Category:** Viewer context gap
- **Evidence Type:** INFERRED
- **Observation Source:** Source code inspection — `ctrlSearchResults({ query, filter })` — no `viewerActorId` parameter in hook or controller
- **Confidence:** HIGH
- **Current runtime behavior:** The Explore search path calls `identity.search_actor_directory` via `searchDal` with `viewerActorId = null` by default. The hook reads identity (`useIdentity`) is not confirmed in the source read — the hook does not appear to pass viewer context down to the controller.
- **Runtime impact:** MEDIUM — same viewer-trust gap as LOKI-F-03 and RISK-4. Explore search results may include actors the viewer has blocked or actors in private realms.
- **Timing impact:** None
- **Caller chain:** `useSearchScreenController` → `ctrlSearchResults({ query, filter })` → `searchDal(query, filter, {})` — `viewerActorId` never threaded
- **Cache status:** Explore hook: 45s TTL. Cache key is `${filter}:${query}` — does NOT include `viewerActorId`. This means if viewer A searches for "john", and viewer B (who has blocked john) searches for "john" on the same device/session, the cached result from viewer A would show john to viewer B. In a single-user app this is not a risk, but if the cache is ever shared across sessions it would be.
- **Severity:** MEDIUM
- **Recommended handoff:** Wolverine — add `viewerActorId` to `ctrlSearchResults` and `searchDal` opts; thread from hook via `useIdentity`. Update cache key to include `viewerActorId` to prevent cross-viewer cache collisions.
- **Rationale:** Viewer context threading is the pattern established by RISK-8 fix. The fix applied to the canonical adapter path should be consistently applied to all search paths that feed user-visible results.

---

### OBSERVABILITY GOVERNANCE STATUS

| Area | Coverage | Missing Visibility | Risk |
|---|---|---|---|
| Canonical actor search (team) | BASIC — ownership checks throw on failure | No timing logs; no search result count logged | LOW |
| Explore search | BASIC — cache events silent; no timing | No hit/miss log; no RPC latency tracking | MEDIUM |
| Upload mention autocomplete | BASIC — `console.warn` in DEV only | No timing; no result count; no null-result events | LOW |
| Chat actor search | MINIMAL — injected function, no logging | No timing; no error path beyond `throw error` | MEDIUM |
| Hydration side effect (Explore DAL) | NONE | No signal when hydration fires from DAL | MEDIUM — obscures hydration trigger source |
| Viewer context (all paths) | NONE | No log when `p_viewer_actor_id: null` is passed | HIGH — silent trust boundary bypass is invisible |

---

### OBSERVABILITY GAP REVIEW

| Flow | Current Visibility | Missing Signals | Severity | Recommended Instrumentation |
|---|---|---|---|---|
| All search paths — viewer context null | NONE | No warning when `p_viewer_actor_id` is null at RPC call | HIGH | DEV-only warning in `searchActorsDAL` when `viewerActorId` is null: `console.warn('[actors-search] viewerActorId is null — viewer filtering disabled')` |
| Explore search cache | NONE | No cache HIT/MISS signal | LOW | DEV-only `console.debug` on cache HIT/MISS in `loadSearchCached` |
| Mention autocomplete RPC calls | PARTIAL (`console.warn` on error only) | No count of RPC calls per session | LOW | DEV-only counter or `console.debug` on each search fire |
| Hydration side effect in Explore DAL | NONE | Side effect fires silently — no signal | MEDIUM | After fixing SENTRY-F-01, add DEV-only log in `ctrlSearchResults` when hydration is triggered |

---

### AUDIT TRAIL WARNINGS

**AUDIT TRAIL WARNING — ATW-01**
- **Flow:** `identity.search_actor_directory` RPC — viewer context bypass
- **Missing audit evidence:** No log anywhere in the codebase captures when a search fires with `p_viewer_actor_id: null`. If a bug report claims that blocked actors appeared in search results, there is no server-side or client-side audit trail to confirm or deny the null viewer context at time of search.
- **Operational risk:** MEDIUM — debugging viewer-context filtering issues requires guesswork without a trace signal
- **Recommended audit event:** DEV-only warning in `searchActorsDAL` when `viewerActorId` is null. Production-safe approach: tagged log in Supabase function when viewer context is absent (if RPC logging is available).

---

### CORRELATION ID REVIEW

| Flow | Correlation Present | Risk | Recommendation |
|---|---|---|---|
| Canonical actor search (team) | NO | LOW | Not required for one-off search lookups |
| Explore search | NO | LOW | Cache key `${filter}:${query}` acts as a soft correlation for deduplication |
| Upload mention autocomplete | PARTIAL — `requestIdRef` for race condition only | LOW | `requestIdRef` provides in-session stale-response protection — sufficient for this use case |
| Chat actor search | NO | MEDIUM | Chat search is part of a message-sending flow; if the DI function fails silently, no trace exists |

---

### HANDOFF MATRIX

| Finding | Recommended Handoff | Reason |
|---|---|---|
| LOKI-F-01 — Explore DAL side effect | Wolverine (IMMEDIATE) | Move `hydrateActorsByIds` to `ctrlSearchResults`. Independent fix, low effort. |
| LOKI-F-02 — Mention autocomplete no cache | Wolverine (optional) | Low-effort improvement — 30s TTL cache in `useMentionAutocomplete`. Not blocking. |
| LOKI-F-03 — Mention `viewerActorId` null | Wolverine (MEDIUM priority) | Thread `viewerActorId` through `useMentionAutocomplete` → controller → DAL. |
| LOKI-F-04 — Explore `viewerActorId` null | Wolverine (MEDIUM priority) | Thread `viewerActorId` through `useSearchScreenController` → `ctrlSearchResults` → `searchDal`. Update cache key. |

---

### TIMING BUDGET STATUS

All timing values are INFERRED (no live instrumentation). Budget assessment based on code paths.

| Runtime Area | Observed | Budget | Status |
|---|---|---|---|
| Canonical actor search (team, post-fix) | NOT MEASURED | 500ms DAL | ASSUMED PASS — single RPC call |
| Explore search (cache MISS) | NOT MEASURED | 1500ms screen load | ASSUMED PASS — parallel Promise.all |
| Explore search (cache HIT) | NOT MEASURED | 300ms | ASSUMED PASS — synchronous cache read |
| Upload mention autocomplete | NOT MEASURED | 300ms UX target | WATCH — no cache; up to 5 serial RPC calls per 5-char handle |

---

### OBSERVABILITY MATURITY

**Current maturity: BASIC**

The actors search system has minimal observability:
- Errors are surfaced in DEV via `console.warn` (mention autocomplete)
- No timing, no cache event logging, no viewer context signal
- Hydration side effect in Explore DAL is invisible to runtime observers

**Target maturity after Wolverine fixes: FUNCTIONAL**

With LOKI-F-01 resolved (DAL side effect moved to controller), a DEV-mode null viewer context warning added to `searchActorsDAL`, and `viewerActorId` threading completed, all major runtime blind spots would be addressed.

---

### FINAL LOKI STATUS: WATCH

No critical runtime failures observed. All search paths are functional. Primary concerns:
1. Viewer context is silently null on 3 of 4 search paths — invisible trust boundary gap
2. Explore DAL side effect structurally unguarded (fires on direct DAL calls outside the caching hook)
3. No cache on mention autocomplete — minor UX/performance concern

All findings are INFERRED from source inspection. Live instrumentation is recommended for production-path timing validation on Explore search and mention autocomplete.

---

### 13 Change Log Append — 2026-05-11 (Phase Verification Pass)

Task: Phased verification — SENTRY + IRONMAN + LOGAN pass on actors DAL doc.
Application Scope: VCSM
Prompt Registry Entry: 2026-05-11 session — user prompt: "run it in phase it / output append on current file"
Code Status Before: SENTRY-F-01 open; RISK-1/5/7 classification unresolved; RISK-2/3/6/8 closed but unverified by SENTRY.
Code Status After: SENTRY verified RISK-2/3/6/8 closures. Two new SENTRY findings (SENTRY-F-01, SENTRY-F-02). IRONMAN reclassified RISK-5 and RISK-7 as LOW/feature-owned. IRONMAN decided RISK-1 shims should be deleted. IRONMAN-F-01 defined `searchActorsAdapter` scope boundary.
Files Changed:
- `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.actors.md` — SENTRY, IRONMAN, and LOGAN reports appended

Command Evidence:
- SENTRY: closures for RISK-2/3/6/8 confirmed via live file inspection
- SENTRY: SENTRY-F-01 (Explore DAL side effect) and SENTRY-F-02 (DAL inline transform) identified
- IRONMAN: RISK-5 reclassified to LOW; RISK-7 reclassified to LOW; RISK-1 shims approved for deletion; IRONMAN-F-01 adapter scope rule established
- LOGAN: §9/§10/§12 drift documented; canonical target state recorded

Architecture Contracts Checked: PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — enforced. ARCHITECTURE.md — consulted.
Security / Runtime / DB Notes: No schema changes. No production code modified this pass. RPC `identity.search_actor_directory` confirmed active in 4 call sites.
Validation: All source files verified via live read. No code changes made in this pass.

Documentation Truth Status: PARTIAL — §9/§10/§12 are stale pending Wolverine code actions. All findings documented. Canonical target state recorded above.

---

---

## PHASE 4 — VENOM FORMAL SECURITY AUDIT — 2026-05-11

**Trigger:** Cerebro phased verification run — formal standalone VENOM report. Prior inline pass (AvengersAssemble) documented viewer-context inversion; this report is the formal trust boundary audit.
**Application Scope:** VCSM
**Scope:** All `search_actor_directory` call sites · actors adapter boundary · return shape exposure.
**Output Path:** `CURRENT/features/dashboard/evidence/venom_actors_dal_2026-05-11.md` _(pending creation)_

---

### Trust Boundary Map

| Surface | Viewer Context | Status |
|---|---|---|
| `searchActorsAdapter(params)` | `viewerActorId` passed end-to-end | ALIGNED |
| `searchActors.controller.js` | Accepts + threads `viewerActorId` (RISK-8 closed) | ALIGNED |
| `searchActorsDAL` | `p_viewer_actor_id: viewerActorId` — correct | ALIGNED |
| `Blocks.controller.js` | `viewerActorId` from caller context | ALIGNED |
| `chat/setup.js:searchActors` | `p_viewer_actor_id: viewerActorId` — reads from identity store | **ALIGNED** (RISK-4 FIXED 2026-05-14) |
| `explore/dal/search.dal.js` | `viewerActorId` threaded from opts | ALIGNED (SENTRY-F-01 side effect separate) |
| `upload/searchMentionSuggestions.dal.js` | `viewerActorId = null` default | MINOR DRIFT |

---

### Return Shape Exposure Audit

| Surface | Raw DB Columns Exposed | Risk |
|---|---|---|
| `searchActorsAdapter` → `mapSearchActorsRows` | None — full camelCase | CLEAN |
| `explore/dal` → `normalizeActorRow` | None — camelCase | CLEAN |
| `chat/setup.js` | `actor_id`, `photo_url` | MEDIUM |
| `upload/searchMentionSuggestions.dal.js` | `actor_id`, `photo_url` | LOW |

---

### Closure Verification

| Risk | Live Verification | Result |
|---|---|---|
| RISK-2 — cross-feature DAL import | `vportTeamAccess.controller.js:9` uses `searchActorsAdapter` | CLOSED |
| RISK-3 — empty adapter | `actors.adapter.js:3` exports `searchActorsAdapter(params)` | CLOSED |
| RISK-6 — blocks.dal.js duplicate | `grep search_actor_directory blocks.dal.js` → 0 results | CLOSED |
| RISK-8 — controller drops viewerActorId | `searchActors.controller.js:4` accepts + threads param | CLOSED |

---

### VENOM Security Findings

**VENOM-S-01 — Chat actor search bypasses viewer-context filtering (RISK-4)**
- Location: `apps/VCSM/src/features/chat/setup.js:48`
- Severity: MEDIUM
- ~~Block list and privacy filtering disabled for all chat actor searches.~~
- **Status: CLOSED — FIXED 2026-05-14.** `chat/setup.js` now reads `useIdentitySelectionStore.getState().activeActorId` at call time and passes it as `p_viewer_actor_id`. Viewer-context filtering is restored. Output shape (snake_case `DirectorySearchResultModel`) unchanged — engine compatibility preserved.

**VENOM-S-02 — Upload mention suggestions default to null viewer context**
- Location: `upload/searchMentionSuggestions.dal.js:19`
- Severity: LOW
- `viewerActorId = null` default. Callers not verified to supply viewer ID.
- Fix: Audit callers to confirm `viewerActorId` is sourced from auth session.

**VENOM-S-03 — Raw `actor_id` column name in chat and upload return shapes**
- Severity: LOW
- Both surfaces return raw DB `actor_id` instead of camelCase `actorId`. Schema rename would silently break consumers.
- Fix: Consolidation onto canonical adapter resolves automatically.

---

### VENOM FORMAL STATUS: MODERATE DRIFT

RISK-2/3/6/8 closures verified in source. Three open items (VENOM-S-01/02/03). VENOM-S-01 is the most impactful — user-visible privacy gap on web and native.

---

---

## PHASE 5 — LOKI RUNTIME TRACE — 2026-05-11

**Trigger:** Cerebro phased verification run — no prior runtime trace existed.
**Application Scope:** VCSM
**Scope:** All active `search_actor_directory` call chains traced from screen to DB.
**Output Path:** `CURRENT/features/dashboard/evidence/loki_actors_search_2026-05-11.md` _(pending creation)_

---

### Runtime Call Chain Map

**Chain A — VportTeam Search (CANONICAL) ✅**
```
VportDashboardTeamScreen → useVportTeamAccess → vportTeamAccess.controller.js:154
  → searchActorsAdapter({ query, limit: 12, viewerActorId })
    → searchActors.controller.js → searchActorsDAL
      → identity.search_actor_directory — p_viewer_actor_id: viewerActorId ✅
    → mapSearchActorsRows → { actorId, kind, displayName, username, avatarUrl }
```
Status: ALIGNED — viewer context flows end-to-end.

**Chain B — Chat Actor Search (RISK-4 FIXED 2026-05-14) ✅**
```
ChatScreen (injected dep)
  → chat/setup.js:searchActors(query, limit)
    → useIdentitySelectionStore.getState().activeActorId → viewerActorId
    → identity.search_actor_directory — p_viewer_actor_id: viewerActorId ✅
      → { actor_id, display_name, username, photo_url, kind } (snake_case)
```
Status: ALIGNED for viewer context. Raw column names in output shape persist (VENOM-S-03 — low priority).

**Chain C — Explore Actor Search (FEATURE-OWNED + SIDE EFFECT) ⚠️**
```
ExploreScreen → useExploreSearch → searchDal(query, filter, opts)
  → explore/dal/search.dal.js
    → identity.search_actor_directory — p_viewer_actor_id: viewerActorId ✅
      → normalizeActorRow → dedup → actorIds
        → hydrateActorsByIds(actorIds).catch(() => {})  ⚠️ DAL SIDE EFFECT (SENTRY-F-01)
```
In `all` mode also fires: 2 parallel `vc.posts` SELECTs → **4 DB calls per keystroke total**.
Status: PARTIAL DRIFT — viewer context correct; DAL side effect is release blocker.

**Chain D — Upload Mention Suggestions (FEATURE-OWNED) ⚠️ minor**
```
Upload editor → searchMentionSuggestions(prefix, { limit, viewerActorId })
  → identity.search_actor_directory — p_viewer_actor_id: viewerActorId (may be null)
    → { actor_id, kind, handle, display_name, photo_url }
```
Status: MINOR DRIFT — correct chain; output uses raw column names; `viewerActorId` may be null.

**Chain E — Privacy Block Search (CORRECT) ✅**
```
Privacy settings → Blocks.controller.js:55
  → searchActorsAdapter({ query, viewerActorId })
    → searchActors.controller.js → searchActorsDAL
      → identity.search_actor_directory ✅
    → mapSearchActorsRows → camelCase domain shape
```
Status: ALIGNED.

**Chain F — Notifications Hydration (VIEW LAYER VIOLATION) ⚠️**
```
MyAppointmentsView.jsx:5 imports hydrateActorsByIds from @hydration (RISK-9)
  → VportCell:54  useEffect → hydrateActorsByIds([vportActorId]).catch(() => {})
  → MemberCell:95 useEffect → hydrateActorsByIds([memberActorId]).catch(() => {})
```
Status: DRIFT — engine function called at view layer. Two call sites at lines 54 and 95.

---

### Runtime Risk Summary

| Risk | Chain | Severity |
|---|---|---|
| DAL side effect | Chain C — Explore | ~~HIGH~~ **FIXED** — SENTRY-F-01 resolved 2026-05-14 |
| View-layer engine import | Chain F — Notifications | ~~LOW~~ **FIXED** — RISK-9 resolved 2026-05-12 |
| Null viewer context — Chat | Chain B | ~~MEDIUM~~ **FIXED** — RISK-4 resolved 2026-05-14 |
| Upload null-default viewer | Chain D | LOW — VENOM-S-02 (viewer context not threaded, LOKI-F-03) |
| No result cache (mention) | Chain D | LOW — LOKI-F-02 |

---

### LOKI RUNTIME STATUS: MODERATE DRIFT

One release blocker (SENTRY-F-01). One low-effort independent fix (RISK-9). All other chains aligned or deferred with IRONMAN decisions in place.

---

---

## PHASE 6 — KRAVEN PERFORMANCE AUDIT — 2026-05-11

**Trigger:** Cerebro phased verification run — no performance envelope documented.
**Application Scope:** VCSM
**Scope:** `search_actor_directory` call volume, cache status, per-call DB budget.
**Output Path:** `_ACTIVE/audits/performance/kraven_actors_search_2026-05-11.md` _(pending creation)_

---

### RPC Call Site Inventory

| Call Site | Default Limit | Filter | Offset | Cache | Viewer Context |
|---|---|---|---|---|---|
| `searchActors.dal.js` | 12 | `all` hardcoded | `0` hardcoded | None | `viewerActorId` param |
| `chat/setup.js` | 12 | `all` hardcoded | none | None | null hardcoded |
| `explore/dal/search.dal.js` | 25 | `users`/`vports`/`all` | `offset` supported | None | `viewerActorId` from opts |
| `upload/searchMentionSuggestions.dal.js` | 8 | `all` hardcoded | none | None | optional |

---

### Per-Keystroke DB Budget — Explore `all` mode (worst case)

| Call | Operation | DB Hit |
|---|---|---|
| 1 | `searchActors` → `identity.search_actor_directory` | RPC |
| 2 | `searchPosts` → `vc.posts` text ilike | SELECT |
| 3 | `searchPosts` → `vc.posts` tag contains | SELECT |
| 4 | `hydrateActorsByIds` (DAL side effect) | Hydration batch SELECT |

**4 DB calls per debounce fire.** Removing SENTRY-F-01 reduces to 3.

---

### KRAVEN Performance Findings

**KRAVEN-P-01 — Canonical DAL hardcodes `p_offset: 0` — no pagination**
- Severity: LOW. Current use cases bounded (≤12 results). Unblock when Explore consolidation promotes `offset`.

**KRAVEN-P-02 — No caching layer across 4 call sites**
- Severity: LOW at current scale. Recommendation: 30s TTL cache at controller level keyed on `(query, filter, limit, viewerActorId)` when needed.

**KRAVEN-P-03 — Explore DAL hydration side effect (SENTRY-F-01)**
- Severity: MEDIUM. Adds hidden DB call per search. Fire-and-forget failures silently swallowed. Removing per SENTRY-F-01 fix eliminates this entirely.

**KRAVEN-P-04 — `searchPosts` always dispatches 2 parallel queries**
- Severity: LOW. `Promise.all([byText, byTag])` fires even when one query would suffice.

---

### KRAVEN PERFORMANCE STATUS: LOW RISK

No high-severity bottlenecks in the actors DAL itself. Main concern is the Explore DAL side effect (SENTRY-F-01 — already a release blocker). All other items are low-priority improvements.

---

---

## PHASE 7 — CARNAGE MIGRATION AUDIT — 2026-05-11

**Trigger:** Cerebro phased verification run — no DB migration history documented.
**Application Scope:** VCSM
**Scope:** Tables and RPCs touched by the actors DAL layer.
**Output Path:** `_ACTIVE/audits/migrations/carnage_actors_dal_2026-05-11.md` _(pending creation)_

---

### Tables and RPCs Accessed

| Object | Schema | Operation | Write Owner |
|---|---|---|---|
| `actors` | `vc` | READ only | Auth feature (`dalCreateUserActor`) |
| `actor_owners` | `vc` | READ only | Auth feature (`dalCreateActorOwner`) |
| `identity.search_actor_directory` | `identity` | RPC read only | N/A — stored procedure |

**Actors feature does not write to any table.** All write authority belongs to auth feature.

---

### Migration Risk Assessment

**CARNAGE-M-01 — RPC contract fragility across 4 callers**

If `identity.search_actor_directory` signature changes (parameter rename or return column rename), all of the following require simultaneous update:
1. ~~`searchActors.dal.js` — inline transform references `actor_kind`, `avatar_url`~~ **No longer applies — SENTRY-F-02 fixed 2026-05-14. DAL returns raw array; no transform.**
2. `searchActors.model.js` — references `actor_id`, `actor_kind`, `avatar_url`, `display_name`, `username`
3. `explore/model/search.model.js` — `normalizeActorRow` references raw column names
4. `chat/setup.js` — returns raw columns in chat shape
5. `explore/dal/search.dal.js` — passes all params
6. `upload/searchMentionSuggestions.dal.js` — maps `avatar_url` → `photo_url`, `username` → `handle`

**Core fragility: 5 files to coordinate per schema change** (down from 6 — `searchActors.dal.js` DAL transform removed). IRONMAN decisions leave 3 feature-owned callers intentionally — fragility is accepted as a trade-off for feature autonomy.

**CARNAGE-M-02 — No pending migrations on current branch**
Branch `vport-booking-feed-security-updates` contains code-only changes. No Supabase migration files for actors-related tables detected.

---

### CARNAGE MIGRATION STATUS: LOW RISK

No active or pending migrations. Structural fragility (6-file coordination for RPC contract changes) is documented and accepted per IRONMAN design decisions.

---

---

## PHASE 8 — FALCON NATIVE PARITY REPORT — 2026-05-11

**Trigger:** Cerebro phased verification run — Falcon previously OPTIONAL; consumers are native-relevant.
**Application Scope:** VCSM
**Scope:** Native transfer readiness for actors DAL consumers and search surfaces.
**Output Path:** `_ACTIVE/native/falcon_actors_dal_2026-05-11.md` _(pending creation)_

---

### Native Relevance by Consumer

| Consumer | Native Relevance | Transfer Risk | Status |
|---|---|---|---|
| `searchActorsAdapter` (team, blocks) | LOW | LOW | Internal — not primary native surfaces |
| `listMyBookings` actor hydration | HIGH | LOW | Booking native-core; `@hydration` canonical path safe |
| Chat actor search (`chat/setup.js`) | HIGH | HIGH | Chat native-core; null viewer context is a blocker |
| Explore actor search | HIGH | MEDIUM | Explore native-core; SENTRY-F-01 must be resolved first |
| Upload mention suggestions | MEDIUM | LOW | Post composer native-relevant; raw column output may mismatch native component |
| `MyAppointmentsView.jsx` hydration | MEDIUM | LOW | View-layer anti-pattern — low functional risk |

---

### Native Contract Gaps

**FALCON-N-01 — Chat null viewer context (RISK-4) — RESOLVED**
- Risk: ~~HIGH~~ **CLOSED**
- ~~On native, chat actor search always returns unfiltered directory.~~
- **FIXED 2026-05-14.** `chat/setup.js` reads viewer identity at call time via `useIdentitySelectionStore`. `p_viewer_actor_id` is no longer null. Native transfer blocker cleared.

**FALCON-N-02 — Explore DAL side effect on native (SENTRY-F-01)**
- Risk: MEDIUM
- DAL-layer `hydrateActorsByIds` side effect creates hidden state dependency. On native with cold-start or background/foreground lifecycle, fire-and-forget `.catch(() => {})` may silently fail.
- Required before native transfer: SENTRY-F-01 fix (move hydration to controller layer).

**FALCON-N-03 — Explore 4 DB calls per keystroke on mobile network**
- Risk: LOW (WiFi/LTE) / MEDIUM (poor connection)
- Mitigation: SENTRY-F-01 fix reduces to 3. TTL cache (KRAVEN-P-02) eliminates repeat searches.

**FALCON-N-04 — Upload raw column names in mention suggestion shape**
- Risk: LOW
- If native mention component expects `actorId` (camelCase), `actor_id` (raw) causes silent access failures.
- Required: WinterSoldier to verify expected shape when native upload/post composer is evaluated.

---

### Native Transfer Readiness

| Path | Status | Blocker |
|---|---|---|
| `searchActorsAdapter` (team, blocks) | TRANSFER READY | None |
| `listMyBookings` actor hydration | TRANSFER READY | None |
| `useMyAppointments` hook hydration | TRANSFER READY | None |
| Chat actor search | **TRANSFER READY** | FALCON-N-01 RESOLVED (RISK-4 fixed 2026-05-14) |
| Explore actor search | CONDITIONAL | FALCON-N-02 (SENTRY-F-01 required) |
| Upload mention suggestions | CONDITIONAL | FALCON-N-04 (shape audit required) |
| `MyAppointmentsView.jsx` hydration | CONDITIONAL | RISK-9 cleanup before porting |

---

### FALCON NATIVE STATUS: CONDITIONAL

Core booking and narrow-search paths transfer-ready. Two paths require fixes before native transfer: Chat (RISK-4) and Explore (SENTRY-F-01).

**WinterSoldier handoff:** NOT REQUIRED now. Revisit when native upload/post composer is evaluated — verify mention suggestion shape contract (FALCON-N-04).

---

---

## AVENGERS ASSEMBLY — PHASE CLOSE — 2026-05-11

**Run Summary**

| Field | Value |
|---|---|
| Date | 2026-05-11 |
| Triggered by | Cerebro phased verification — 6 commands confirmed MISSING |
| Application Scope | VCSM |
| Branch | `vport-booking-feed-security-updates` |
| Document Scope | `vcsm.dal.actors.md` — actors DAL full governance pass |
| Prior passes | ARCHITECT · VENOM (inline) · LOGAN · review-contract · SENTRY · IRONMAN · LOGAN (reconciliation) |
| This pass | VENOM (formal) · LOKI · KRAVEN · CARNAGE · FALCON |
| Read-Only | YES — no source code modified |

---

### Final Governance Evidence Registry

| Command | Status | Key Findings | Blocking |
|---|---|---|---|
| ARCHITECT | PRESENT | Drift corrected (prior session) | NO |
| VENOM | PRESENT (formal) | VENOM-S-01 chat null viewer · S-02 upload null-default · S-03 raw columns | NO |
| LOGAN | PRESENT | §9/§10/§12 stale — canonical target state recorded | NO |
| review-contract | PRESENT | Pre-existing violations deferred per IRONMAN | NO |
| SENTRY | PRESENT | RISK-2/3/6/8 closed ✅ · SENTRY-F-01 open · SENTRY-F-02 open | YES (SENTRY-F-01) |
| IRONMAN | PRESENT | Shims → delete · RISK-5 → LOW · RISK-7 → LOW · adapter scope defined | NO |
| LOKI | PRESENT | Chain B null-viewer · Chain C side effect at :46 · Chain F RISK-9 at :54 and :95 | NO |
| KRAVEN | PRESENT | 4 call sites · no cache · SENTRY-F-01 hidden DB call · no pagination on canonical | NO |
| CARNAGE | PRESENT | No pending migrations · RPC 6-file fragility documented | NO |
| FALCON | PRESENT | Chat NOT transfer-ready (RISK-4) · Explore conditional (SENTRY-F-01) | YES (native) |
| WINTER SOLDIER | N/A | Deferred — revisit at upload/post native evaluation | NO |
| SHIELD | N/A | No IP/provenance concerns | NO |

---

### Open Risk Final State

| Risk | Severity | Status | Release Blocking |
|---|---|---|---|
| RISK-1 — hydration shims | LOW | **FIXED** (2026-05-12) | NO |
| RISK-4 — chat null viewer | MEDIUM | **FIXED** (2026-05-14) | NO |
| RISK-5 — explore DAL side effect (SENTRY-F-01) | HIGH | **FIXED** (2026-05-14) | NO |
| RISK-7 — upload mention contract | LOW | RECLASSIFIED — no action | NO |
| RISK-9 — view layer engine import | LOW | **FIXED** (2026-05-12) | NO |
| SENTRY-F-02 — DAL inline transform | LOW | **FIXED** (2026-05-14) | NO |

---

### Release Blockers

| Blocker | Location | Fix | Owner |
|---|---|---|---|
| SENTRY-F-01 | `explore/dal/search.dal.js:46` | Remove `hydrateActorsByIds` — move to `ctrlSearchResults` or hook | Wolverine immediate |

**One release blocker. All other items are improvements or deferred consolidation.**

---

### Wolverine Execution Queue

| # | Action | Priority |
|---|---|---|
| 1 | Remove `hydrateActorsByIds` from `explore/dal/search.dal.js:46` — move to controller | IMMEDIATE — release blocker |
| 2 | Remove `hydrateActorsByIds` engine import from `MyAppointmentsView.jsx` (lines 54, 95) — move to hook | IMMEDIATE — independent |
| 3 | Delete `getActorSummariesByIds.dal.js` + `hydrateActors.controller.js` shims | HIGH |
| 4 | Logan: update §9, §10, §12 with canonical target state after #1–#3 | HIGH |
| 5 | Chat: adapter wrapper + shape mapper + `viewerActorId` wiring (RISK-4) | MEDIUM (native blocker) |

---

### Overall Status: DRIFT FOUND — one release blocker (SENTRY-F-01)

All governance passes complete. Full evidence registry present. Sole release blocker is `SENTRY-F-01`. Next action: `/Wolverine` — execute items #1–#3 from the queue above.

---

### 15 Change Log — 2026-05-11 (Cerebro Phase Close)

Task: Cerebro-directed phased verification — VENOM formal, LOKI, KRAVEN, CARNAGE, FALCON.
Application Scope: VCSM
Prompt: User — "run it in phase it / output append on current file vcsm.dal.actors.md"
Code Status Before: SENTRY + IRONMAN + LOGAN appended. VENOM/LOKI/KRAVEN/CARNAGE/FALCON MISSING.
Code Status After: Phases 4–8 + AvengersAssemble close appended. Full governance evidence registry complete.
Files Changed: `vcsm.dal.actors.md` — phases 4–8 + AvengersAssemble close appended.
Command Evidence: All phases derived from live source inspection — `features/actors/`, `features/explore/`, `features/chat/`, `features/upload/`, `features/notifications/`, `features/dashboard/vport/`, `features/settings/privacy/`.
Architecture Contracts Checked: PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — enforced. ARCHITECTURE.md — consulted.
Security / Runtime / DB Notes: No schema changes. No production code modified. VENOM-S-01 confirmed at `chat/setup.js:51`. LOKI Chain F RISK-9 confirmed at `MyAppointmentsView.jsx:54,95`.
Validation: All source files verified via live read and grep.
Documentation Truth Status: PARTIAL — §9/§10/§12 remain stale pending Wolverine code actions. All governance evidence now present.

---

## CEREBRO ENGINE CONTRACT DECISION — 2026-05-11

**Date:** 2026-05-11
**Trigger:** User question — "is this respecting our engine contract?" after reviewing `engines/hydration/index.js`
**Decision question:** For the `engines/hydration/index.js` adapter violation, what is the correct command sequence — IRONMAN first, or Wolverine directly?

---

### Violation Identified

`engines/hydration/index.js` line 22:
```js
export { getActorSummariesByIdsDAL } from './src/dal.js'
```

`engines/hydration/index.js` line 28:
```js
export { hydrateActor } from './src/controller/hydrateActor.controller.js'
```

Engine contract rule violated: **Adapters must never export: DAL, controllers, models.**

The hydration engine exports a DAL function by name and a controller function by file path from its public adapter index. All 42 `@hydration` import sites in `apps/VCSM` that use `getActorSummariesByIdsDAL` are consuming an internal engine DAL through the adapter — which the engine itself should not be exposing.

---

### Decision: IRONMAN → SENTRY → Wolverine

---

### Rationale — Why NOT Wolverine directly

The engine contract violation is not a feature-layer bug fix. It is an **engine public API contract breach** with 42 active import sites across `apps/VCSM`. The key risks of going to Wolverine without IRONMAN:

1. **Consumer scope is unknown across apps.** VCSM has 42 `@hydration` imports. Wentrex may also consume `@hydration`. Wolverine would need to discover all callers during execution — that is IRONMAN's job, not Wolverine's.

2. **The rename is a breaking API change.** `getActorSummariesByIdsDAL` needs to be wrapped behind a proper public name (e.g., `getActorSummaries`). Without IRONMAN establishing the consumer map first, Wolverine cannot safely define the migration path — it risks breaking callers it did not know existed.

3. **Engine scope requires explicit boundary approval.** The boundary contract states: *"Engine changes must never be disguised as app-only scope."* This is ENGINE scope, potentially BOTH APPS + ENGINE. Wolverine must be briefed with the full scope declaration — which only IRONMAN can produce.

4. **Wolverine's downstream requirements include SENTRY for arch changes.** Skipping IRONMAN means SENTRY reviews a fix it has no ownership context for.

---

### Rationale — Why IRONMAN first, not SENTRY first

SENTRY validates compliance against a proposed solution. SENTRY needs to know what the solution is before it can verify it. IRONMAN defines the solution:
- What the clean public API should expose
- Which consumers use the violating exports today
- Whether Wentrex is affected (scope declaration)
- What the migration contract looks like (old name → new name)

Without IRONMAN's ownership map, SENTRY would be reviewing a partial picture.

Per the Cerebro canonical run order, IRONMAN (ownership) precedes SENTRY (compliance) precisely because compliance verification depends on ownership clarity.

---

### Rationale — Why SENTRY second, not skipped

Once IRONMAN defines the clean API and consumer migration plan, SENTRY must verify:
- The new adapter export surface does not introduce new violations
- The controller exports are correctly wrapped (not just renamed)
- Engine isolation is not broken by any changes Wolverine makes to the engine index
- No app-specific logic leaks into the engine during the refactor

Skipping SENTRY means a second engine contract violation could be introduced while fixing the first.

---

### Approved Command Sequence

| Phase | Command | Scope | Task |
|---|---|---|---|
| 1 | **IRONMAN** | ENGINE + VCSM + WENTREX | Map all consumers of `getActorSummariesByIdsDAL` and `hydrateActor`. Define the clean public API names. Declare which apps are affected. Produce the migration contract. |
| 2 | **SENTRY** | ENGINE | Verify the proposed clean public API surface against engine contract. Confirm no new violations introduced. |
| 3 | **Wolverine** | ENGINE scope (explicit approval required) | Execute: wrap `getActorSummariesByIdsDAL` behind a public function name, wrap or re-route `hydrateActor`, update all consumer import sites. |
| 4 | **LOGAN** | ENGINE + VCSM (+ WENTREX if affected) | Create a new hydration engine audit version. Update actors DAL doc §9 Rule 1 to reference the new public function name. |

---

### Gate Questions IRONMAN Must Answer Before Wolverine May Proceed

1. How many callers use `getActorSummariesByIdsDAL` from `@hydration` in VCSM?
2. Does Wentrex import `getActorSummariesByIdsDAL` or `hydrateActor` from `@hydration`?
3. What should the clean public name be? (`getActorSummaries`? `fetchActorSummaries`?)
4. Is `hydrateActor` still in active use, or is it a legacy export that can be removed?
5. Are `normalizeActorSummary` / `extractActorIdsForHydration` model exports that also violate the adapter contract, or do they qualify as public functions?

All five gate questions must be answered before Wolverine is authorized to touch `engines/hydration/index.js`.

---

### Status: PENDING IRONMAN

This decision is recorded as history. No code changes made. Next action: run IRONMAN scoped to ENGINE + VCSM + WENTREX against `engines/hydration/`.

---

## IRONMAN ENGINE OWNERSHIP REPORT — 2026-05-11

**Date:** 2026-05-11
**Reviewer:** IRONMAN
**Trigger:** Cerebro decision — five gate questions must be answered before Wolverine may touch `engines/hydration/index.js`
**Application Scope:** VCSM + ENGINE (Wentrex confirmed independent — see Gate Q2)
**Boundary Contract:** `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md` — enforced
**Ownership file created:** `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/engine.hydration.owner.md`

---

### IRONMAN TARGET

```
Feature / Engine: engines/hydration — public adapter (index.js) contract compliance
Application Scope: VCSM + ENGINE
Reason for ownership review:
  - engines/hydration/index.js exports getActorSummariesByIdsDAL (DAL function) from public adapter
  - engines/hydration/index.js exports hydrateActor from src/controller/ (controller-origin function)
  - Engine contract: Adapters must never export DAL, controllers, or models
  - Cerebro mandated five gate questions before Wolverine may proceed
```

---

### GATE QUESTION ANSWERS

---

**Gate Q1 — How many callers use `getActorSummariesByIdsDAL` from `@hydration` in VCSM?**

**Answer: ONE active caller.**

| File | Usage |
|---|---|
| `apps/VCSM/src/features/booking/controller/listMyBookings.controller.js:3` | `import { getActorSummariesByIdsDAL } from "@hydration"` — used at line 15 to fetch owner actor summaries for booking display |
| `apps/VCSM/src/features/actors/dal/getActorSummariesByIds.dal.js:3` | Shim re-export only — PENDING_DELETION per IRONMAN-F-02. Zero callers of this shim. |

`chat/setup.js` defines a local `getActorSummariesByIds` wrapper that calls `hydrateAndReturnSummaries` from `@hydration` — this does NOT use `getActorSummariesByIdsDAL`. It is a distinct, compliant path.

**Migration impact is minimal — exactly one file to update.**

---

**Gate Q2 — Does Wentrex import `getActorSummariesByIdsDAL` or `hydrateActor` from `@hydration`?**

**Answer: NO. Wentrex is confirmed fully independent.**

Wentrex has its own implementation at `apps/wentrex/src/features/actors/dal/getActorSummariesByIds.dal.js` that queries the `learning.actor_profiles` table directly — it does not use `@hydration` at all. Zero Wentrex files import from `@hydration`.

**Scope of this fix: VCSM + ENGINE only. Wentrex requires no changes.**

---

**Gate Q3 — What should the clean public name be?**

**Answer: `fetchActorSummaries({ actorIds })`**

Rationale:
- Removes the `DAL` suffix — no public API should expose its internal implementation tier in the name
- `fetch` signals a data retrieval operation appropriate for a controller to call
- Consistent with naming patterns elsewhere in the codebase (`fetchTeamMembersByProfileId`, etc.)
- `getActorSummaries` is also acceptable but `fetch` is preferred for async DB operations

**Migration plan:**
1. Add `export function fetchActorSummaries(params) { return getActorSummariesByIdsDAL(params) }` to `engines/hydration/src/adapters/` (new file) or directly in `index.js` as a wrapper
2. Remove `export { getActorSummariesByIdsDAL } from './src/dal.js'` from `index.js`
3. Update `listMyBookings.controller.js` import: `getActorSummariesByIdsDAL` → `fetchActorSummaries`
4. The underlying `src/dal.js` implementation is UNCHANGED

---

**Gate Q4 — Is `hydrateActor` still in active use, or can it be removed?**

**Answer: ACTIVE — CRITICAL PATH. Must not be removed or renamed.**

Active consumer: `apps/VCSM/src/state/identity/identity.controller.js` — lines 52 and 61. Used in two identity resolution functions:
- `hydrateIdentityActor(actor)` — resolves identity for an authenticated actor on login
- `loadIdentityForActorId(actorId)` — resolves identity by actor ID (used on actor switches)

Both are on the identity critical path. Any rename or signature change would break authentication.

**Classification of `hydrateActor` export:**
The engine contract says adapters must not export controllers. However, `hydrateActor` is the engine's primary DI resolver — it dispatches to app-registered hydrators by `appKey` + `actorSource`. It functions as the engine's main public entry point for app-specific actor resolution. Its internal file path (`src/controller/hydrateActor.controller.js`) is an implementation detail.

**IRONMAN decision:** `hydrateActor` qualifies as a public function, not a business-logic controller. The violation is in the internal file organization — the file should be in `src/adapters/` not `src/controller/`. The fix is an internal file move only — the public export name and signature stay identical.

**Risk: HIGH if name or signature changes. LOW for internal file relocation.**

---

**Gate Q5 — Are `normalizeActorSummary` / `extractActorIdsForHydration` model exports that also violate the adapter contract?**

**Answer: Both are borderline violations with zero active app-layer consumers. Recommend removing from public index.**

| Export | Origin | VCSM App Callers | Decision |
|---|---|---|---|
| `normalizeActorSummary` | `src/normalize.js` (model layer) | NONE found via grep | Remove from public index |
| `normalizeActorSummaries` | `src/normalize.js` (model layer) | NONE found via grep | Remove from public index |
| `extractActorIdsForHydration` | `src/extract.js` (utility) | Zero direct — only via shim pending deletion | Remove from public index after shim deletion |

These three exports have no confirmed app-layer callers. Removing them from `index.js` reduces the public surface area and brings the adapter closer to contract compliance without any migration burden. If a future consumer needs them, they can be added back as explicitly documented public utility exports.

---

### RESPONSIBILITY CLASSIFICATION

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Engine ownership | `engines/hydration/` | HIGH | Standalone engine module |
| Public API contract | `engines/hydration/index.js` | HIGH | Currently partially non-compliant — see violations |
| Actor summary fetch | `src/dal.js` via `fetchActorSummaries` (proposed) | HIGH | Single DB query, bulk fetch |
| Actor store lifecycle | `src/store.js` | HIGH | Zustand, 5min TTL |
| App-specific DI resolution | `src/controller/hydrateActor.controller.js` | HIGH | CRITICAL PATH — identity resolution |
| Hydration pipeline | `src/hydrate.js` | HIGH | Core consumer surface for 42 import sites |
| Documentation | LOGAN (actors DAL doc + new engine audit) | HIGH | This doc + `engine.hydration.owner.md` |

---

### OWNERSHIP BOUNDARY RISK

| Area | Risk | Reason | Recommended Clarification |
|---|---|---|---|
| `getActorSummariesByIdsDAL` in public index | HIGH | DAL function exported from adapter — engine contract violation | Replace with `fetchActorSummaries` wrapper |
| `hydrateActor` from `controller/` file | MEDIUM | Internal file in `controller/` but functionally a public DI function | Move file to `src/adapters/` — name unchanged |
| `normalizeActorSummary` / `normalizeActorSummaries` | LOW | Model functions in public index, no callers | Remove from public index |
| `extractActorIdsForHydration` | LOW | Utility in public index, used only via shim pending deletion | Remove after shim deletion |
| `listMyBookings.controller.js` coupling | LOW | One caller using DAL name directly — isolated migration | Update import name in same Wolverine pass |

---

### DATA OWNERSHIP REGISTRY

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| `vc.actors` (hydration read path) | `engines/hydration/src/dal.js` | `listMyBookings.controller.js` (via `fetchActorSummaries`), hydration store consumers | NONE — read only | Supabase | CARNAGE | LOGAN (engine audit) |
| Hydration Zustand store | `engines/hydration/src/store.js` | 42 VCSM files via `useActorSummary`, `hydrateActorsByIds` | Engine hydration pipeline | N/A | N/A | LOGAN |

---

### CROSS-ROOT OWNERSHIP REVIEW

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| `engines/hydration/` | Engine layer | `engines/` | COMPLIANT | No app imports found inside engine |
| Wentrex actor data | Wentrex app | `apps/wentrex/` | COMPLIANT | Independent — does not use `@hydration` |
| VCSM booking actor lookup | VCSM app | `apps/VCSM/` | MINOR VIOLATION | `listMyBookings.controller.js` imports a DAL-named function from engine adapter |
| VCSM identity resolution | VCSM app | `apps/VCSM/` | COMPLIANT (borderline) | Uses `hydrateActor` which is a public DI function (see Gate Q4) |

---

### ENGINE OWNERSHIP REVIEW

| Engine | Owner | Consumers | Public Interfaces (current) | Boundary Risk |
|---|---|---|---|---|
| `engines/hydration/` | Engine layer | VCSM (42 files) only | `hydrateActorsByIds`, `hydrateActorsFromRows`, `hydrateAndReturnSummaries`, `useActorSummary`, `hydrateActor`, `getActorSummariesByIdsDAL` ⚠️, `normalizeActorSummary` ⚠️, `extractActorIdsForHydration` ⚠️, `configureHydrationEngine`, `getHydrationConfig` | MEDIUM — 3 non-compliant exports identified |

---

### RECOMMENDED WOLVERINE EXECUTION PLAN (ENGINE SCOPE)

**Scope declaration required:** ENGINE + VCSM — explicit approval mandatory per boundary contract

**Execution order:**

| Step | File | Change | Risk |
|---|---|---|---|
| 1 | `engines/hydration/index.js` | Remove `export { getActorSummariesByIdsDAL } from './src/dal.js'`. Add `export function fetchActorSummaries(params) { return getActorSummariesByIdsDAL(params) }` (import `getActorSummariesByIdsDAL` locally in index). | LOW |
| 2 | `engines/hydration/index.js` | Remove `export { normalizeActorSummary, normalizeActorSummaries } from './src/normalize.js'` | LOW — no callers |
| 3 | `engines/hydration/index.js` | Remove `export { extractActorIdsForHydration } from './src/extract.js'` (after VCSM shim deletion confirmed) | LOW — no callers |
| 4 | `engines/hydration/src/controller/hydrateActor.controller.js` | Move file to `engines/hydration/src/adapters/hydrateActor.js`. Update `index.js` import path. Export name and signature unchanged. | MEDIUM — file move; must verify no internal engine imports reference old path |
| 5 | `apps/VCSM/src/features/booking/controller/listMyBookings.controller.js` | Update import: `getActorSummariesByIdsDAL` → `fetchActorSummaries` | LOW — one file, one line |
| 6 | `apps/VCSM/src/features/actors/dal/getActorSummariesByIds.dal.js` | Delete (IRONMAN-F-02 — shim with no callers) | LOW |
| 7 | `apps/VCSM/src/features/actors/controllers/hydrateActors.controller.js` | Delete (IRONMAN-F-02 — shim with no callers) | LOW |

**SENTRY review required after Step 4** — engine internal file reorganization must be verified for compliance before Wolverine closes the task.

**LOGAN required after all steps** — new `HYDRATION_ENGINE_AUDIT_VN.md` must be created. `vcsm.dal.actors.md` §9/§12 must be updated with `fetchActorSummaries` name.

---

### FINAL IRONMAN OWNERSHIP STATUS: CLARIFIED

**Pre-review:** Engine adapter violations identified but scope and consumer map unknown.

**Post-review:** Scope confirmed VCSM + ENGINE only. Wentrex isolated. One active consumer of violating export (`listMyBookings.controller.js`). Migration path is a rename wrapper — lowest possible risk. `hydrateActor` is critical path — internal file move only, no API change. Three unused exports identified for removal.

**All five Cerebro gate questions answered. Wolverine is now authorized to proceed under ENGINE scope approval.**

---
