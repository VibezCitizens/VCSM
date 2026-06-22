# BlackWidow V2 Adversarial Review — ads
## VCSM Feature: ads
## Review Date: 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report ID | BW-ADS-2026-06-04 |
| Feature | ads |
| App | VCSM |
| Reviewer | BLACKWIDOW V2 (BW2.5) |
| Review Date | 2026-06-04 |
| Scanner Version | 1.1.0 |
| Scanner Freshness | FRESH (2026-06-04T19:48:25.152Z, ~7h old) |
| Behavior Contract | PLACEHOLDER — all §9 invariants UNANCHORED |
| VENOM Cross-Ref | VEN-ADS-001 through VEN-ADS-006 (all OPEN) |
| ELEKTRA Cross-Ref | NOT RUN |

---

## 2. Scanner Preflight

- Scanner Version: 1.1.0
- Maps Generated: 2026-06-04T19:48:25.152Z
- Status: FRESH
- Security paths attributed to ads in scanner: 0 (zero entries in security-path-map.json)
- Total platform security paths: 598
- Write execution paths for ads in write-execution-map.json: 0 (no entries)
- RPC paths for ads in rpc-execution-map.json: 0 (no entries)
- Callgraph nodes: 40 nodes, 43 edges
- Callgraph hook entry points: 1 (useVportAds)

Assessment: Zero security-path-map entries for ads is consistent with the feature
using only localStorage (no Supabase writes). All write surfaces are client-side only.
Scanner signals are LOW CONFIDENCE for this feature — primary attack analysis must
rely on source verification.

---

## 3. Scanner Inputs Block

| Map File | Entries for ads | Notes |
|---|---|---|
| security-path-map.json | 0 | No Supabase paths tracked |
| callgraph.json | 40 nodes / 43 edges | Fully mapped, HIGH confidence |
| write-execution-map.json | 0 | localStorage writes not tracked |
| rpc-execution-map.json | 0 | No RPCs in this feature |

---

## 4. Attack Surface Inventory

### Source Files Reviewed

| File | Layer | Attack Relevance |
|---|---|---|
| screens/VportAdsSettingsScreen.jsx | Screen | Route entry point — actorId resolution |
| hooks/useVportAds.js | Hook | All mutation entry points |
| usecases/adPipeline.usecase.js | Use Case | deleteAdUseCase, saveAd, publishAdUseCase, pauseAdUseCase, archiveAdUseCase |
| dal/ad.storage.dal.js | DAL | upsertAd, removeAd, listAdsByActor — all localStorage |
| api/ad.api.js | API bridge | Thin wrapper over DAL |
| lib/ad.validation.js | Validation | Draft validation, URL validation |
| model/ad.model.js | Model | createAdDraft — actorId stamping |
| ads.feature.js | Barrel | Exports usecases directly (VEN-ADS-005) |
| app/routes/protected/app.routes.jsx | Router | Route placement vs OwnerOnlyDashboardGuard |

### Route Registration (CONFIRMED)

- `/ads/vport/:actorId` — registered at line 154 of app.routes.jsx
- This route is a flat sibling to the OwnerOnlyDashboardGuard subtree
- It is NOT nested inside `<OwnerOnlyDashboardGuard>` or `<BlockedVportGuard>`
- The OwnerOnlyDashboardGuard only covers `/actor/:actorId/dashboard/*` and `/actor/:actorId/settings`

### DAL Write Surfaces

| DAL Function | Ownership Check | Location |
|---|---|---|
| upsertAd(ad) | NONE — accepts any payload | ad.storage.dal.js:43 |
| removeAd({id}) | NONE — accepts bare id | ad.storage.dal.js:61 |
| listAdsByActor({actorId}) | Filters by actorId field in localStorage | ad.storage.dal.js:33 |

### Hook Entry Points (UI-Accessible)

| Hook Method | Calls Into | actorId Source |
|---|---|---|
| useVportAds(actorId).createDraft() | createDraftUseCase(actorId) | Caller-supplied |
| useVportAds(actorId).saveDraft(ad) | saveDraftUseCase(ad) | From ad.actorId field |
| useVportAds(actorId).publish(ad) | publishAdUseCase(ad) | From ad.actorId field |
| useVportAds(actorId).pause(ad) | pauseAdUseCase(ad) | From ad.actorId field |
| useVportAds(actorId).archive(ad) | archiveAdUseCase(ad) | From ad.actorId field |
| useVportAds(actorId).remove(id) | deleteAdUseCase(id) | Bare id, no actorId |

### Callgraph Path: Hook to DAL

```
VportAdsSettingsScreen (screen)
  -> useVportAds(actorId) (hook)
    -> deleteAdUseCase(id) (usecase)
      -> deleteAd(id) (api)
        -> removeAd({id}) (dal)   [NO ownership check at any layer]

    -> saveDraftUseCase(ad) / publishAdUseCase(ad) (usecase)
      -> saveAd(ad) (api)
        -> upsertAd(ad) (dal)   [NO ownership check at any layer]
```

---

## 5. Scanner Signals Block

| Signal Source | Finding | Confidence |
|---|---|---|
| callgraph: no controller layer | All write operations reach DAL through usecase only — no controller ownership gate | SCANNER_LEAD |
| callgraph: hook entry only | Only 1 hook node registered — all mutations route through useVportAds | HIGH |
| security-path-map: 0 entries | No Supabase writes in scope — all storage is localStorage | SCANNER_LOW_CONF |
| route config: flat placement | /ads/vport/:actorId not nested under OwnerOnlyDashboardGuard | SOURCE_VERIFIED |

---

## 6. Adversarial Path Analysis

### A. OWNERSHIP BYPASS (§5.1)

**Attack**: Can an authenticated actor load and mutate another actor's ad pipeline by visiting `/ads/vport/<victimActorId>`?

**Trace**:
1. Attacker visits `/ads/vport/victim-actor-uuid` directly in browser
2. Route at app.routes.jsx:154 renders `<VportAdsSettingsScreen />` with no guard
3. VportAdsSettingsScreen.jsx:16 — `const { actorId: actorIdParam } = useParams()` reads victim's actorId from URL
4. VportAdsSettingsScreen.jsx:19 — `const actorId = actorIdParam || identity?.actorId || null` — URL param takes priority over session identity
5. useVportAds is initialized with victim's actorId
6. listAdsByActor filters localStorage by actorId — since ads are stored in shared `vc.ads.pipeline.v1` key, victim ads only appear if they were created in the same browser session (same device)

**Current-state result**: PARTIAL BYPASS (storage-limited)
- Route renders without ownership check [SOURCE_VERIFIED: app.routes.jsx:154]
- actorId accepted from URL param with no session cross-check [SOURCE_VERIFIED: VportAdsSettingsScreen.jsx:19]
- In current localStorage state: ads are per-browser, so cross-actor read is limited to same-device scenarios
- However, the screen renders fully with attacker able to call createDraft() with victim's actorId, which stamps victim's actorId on new ads stored locally
- When ads migrate to Supabase, this path becomes a CRITICAL bypass with server-side writes to victim's actor data

**Finding**: BW-ADS-001

---

### B. SESSION MUTATION (§5.2)

**Attack**: Is viewerActorId/actorId sourced from trusted session or untrusted client payload?

**Trace**:
- VportAdsSettingsScreen.jsx:17-19: `const { identity } = useIdentity()` + `const actorId = actorIdParam || identity?.actorId || null`
- Line 19 uses `actorIdParam || identity?.actorId` — URL param wins over session
- useVportAds hook receives this caller-controlled actorId
- All use case functions (saveDraftUseCase, publishAdUseCase, etc.) operate on the `ad` object which contains `actorId` embedded in the draft
- createDraftUseCase(actorId) at adPipeline.usecase.js:18-19 stamps the provided actorId into the draft model
- No use case checks that the actorId in the draft matches the authenticated session

**Attack Variant — Stale Identity**:
- If identity is null (session expired mid-render), VportAdsSettingsScreen.jsx:19 falls back to `actorIdParam` from URL
- Route is not guarded, so a null identity does not redirect
- The screen continues to render and useVportAds(actorId) is called with the URL param actorId
- All operations proceed until an auth error from the backend (currently none — localStorage has no auth)

**Finding**: BW-ADS-002

---

### C. RUNTIME ABUSE (§5.3)

**Attack**: Can a non-owner actor type (personal profile vs VPORT) reach owner-only paths?

**Analysis**:
- No actor `kind` check exists anywhere in the ads feature
- VportAdsSettingsScreen.jsx: no check that `identity.kind === 'vport'`
- useVportAds.js: no kind guard
- adPipeline.usecase.js: no kind guard
- ad.storage.dal.js: no kind guard
- A personal profile actor (`kind: 'user'`) can navigate to `/ads/vport/<any-actorId>` and create/publish ads attributed to any actorId

**Finding**: BW-ADS-003

---

### D. RLS VERIFICATION (§5.4)

**Analysis**:
- The ads feature uses localStorage exclusively (ADS_STORAGE_KEY = "vc.ads.pipeline.v1")
- There is NO Supabase table for ads
- Therefore there is no RLS to verify or bypass — the entire persistence layer is client-side
- This is confirmed by: zero entries in security-path-map.json, zero entries in rpc-execution-map.json, zero entries in write-execution-map.json
- All data is stored in `window.localStorage` under a single global key with no encryption, no signing, and no access control

**Attack**: Can localStorage be tampered with to inject arbitrary ad payloads?
- Yes, unconditionally. Any code running in the same browser origin (including injected scripts via XSS) can read and overwrite `vc.ads.pipeline.v1`
- normalizeStoredAd() at ad.storage.dal.js:3-11 does minimal coercion but accepts arbitrary actorId values from localStorage reads
- An attacker with XSS can write ads with arbitrary actorId, status, mediaUrl, destinationUrl to localStorage
- When the victim loads VportAdsSettingsScreen, the poisoned data is rendered

**Finding**: BW-ADS-004

---

### E. VIEWER CONTEXT FUZZING (§5.5)

**Attack**: What happens if null/undefined actorId is passed to each entry point?

**Test Cases**:

1. `useVportAds(null)`:
   - useVportAds.js:18-23: `if (!actorId) { setAds([]); setLoading(false); return; }` — BLOCKED
   - createDraft() with null actorId: createDraftUseCase(null) -> createAdDraft({actorId: null}) -> ad.actorId = null — draft created with null actorId, saved to localStorage
   - saveDraft(nullActorIdAd): passes through to upsertAd() — no actorId check, SAVED

2. `deleteAdUseCase(undefined)`:
   - deleteAdUseCase(undefined) -> deleteAd(undefined) -> removeAd({id: undefined})
   - ad.storage.dal.js:62: `all.filter((item) => item.id !== id)` — id is undefined, so NO items match, nothing deleted
   - No error thrown — silent no-op

3. `useVportAds("")` (empty string):
   - useVportAds.js:18: `!actorId` evaluates `!""` = true — bails early, no ads loaded
   - BLOCKED at load, but empty string could be passed to createDraft: createDraftUseCase("") -> actorId = "" in draft

**Finding**: BW-ADS-005 (null actorId creates unowned ads; deleteAdUseCase(undefined) is silent no-op)

---

### F. MUTATION REPLAY (§5.6)

**Attack**: Can a terminal-state ad (ARCHIVED) be re-published or re-activated?

**Trace**:
- adPipeline.usecase.js:32-39: publishAdUseCase(ad) — no status check before publishing
- adPipeline.usecase.js:42-44: pauseAdUseCase(ad) — no status check
- adPipeline.usecase.js:46-48: archiveAdUseCase(ad) — no status check
- UI layer: ui/components.jsx:159-186 renders all action buttons (Save/Publish/Pause/Archive/Delete) regardless of current status

**Attack**: Archived ad can be republished:
1. Archive an ad — status becomes "archived"
2. Call publishAdUseCase(archivedAd) — no gate, status set to "active"
3. No state-machine protection at any layer

**Finding**: BW-ADS-006 (no state-machine enforcement — terminal states can be re-transitioned)

Currently LOW severity because storage is localStorage-only, but becomes HIGH when Supabase migration occurs.

---

### G. HYDRATION POISONING (§5.7)

**Analysis**:
- The ads feature does NOT interact with the VCSM hydration store
- No `useHydration`, `hydrateActor`, or similar calls found in ads files
- No cross-feature data injection surfaces

**Result**: NOT APPLICABLE. No hydration interaction.

---

### H. URL SURFACE (§5.9)

**Attack**: Do notification links, share links, or deep links expose raw UUIDs?

**Analysis**:
- The route `/ads/vport/:actorId` uses `:actorId` directly — this is a raw UUID in the URL
- VportToActorAdsRedirect (appRoutes.redirects.jsx:63-66) redirects `/vport/:actorId/ads` -> `/ads/vport/${actorId}`, both exposing raw actorId
- No share links, QR codes, or notifications were found in the ads feature
- However, the route pattern itself exposes raw actorId in the URL, violating the platform "no raw IDs in public URLs" rule documented in MEMORY.md

**Finding**: BW-ADS-007 (raw actorId UUID in route /ads/vport/:actorId — violates platform URL policy)

---

### I. §9 INVARIANT ATTACK (HIGHEST PRIORITY)

**Status**: BEHAVIOR.md is PLACEHOLDER — no §9 Must Never Happen section exists.

Since no §9 invariants are declared, the invariant attack map is constructed from
source-inferred security invariants based on platform conventions:

**Inferred Invariant 1**: An actor must not be able to read or write ads belonging to another actor.
- ATTACK: Visit `/ads/vport/<victimActorId>` from authenticated session
- RESULT: Route renders (BYPASSED at route level); localStorage cross-contamination limited to same device (PARTIAL)
- See BW-ADS-001

**Inferred Invariant 2**: An actor's actorId must never be injected from client payload.
- ATTACK: Pass foreign actorId in URL param, creating draft stamped with victim's actorId
- RESULT: BYPASSED — URL param actorId accepted without cross-check (VportAdsSettingsScreen.jsx:19)
- See BW-ADS-001, BW-ADS-002

**Inferred Invariant 3**: Deleting an ad must only delete ads owned by the authenticated actor.
- ATTACK: Call deleteAdUseCase(victimAdId) directly (via barrel export from ads.feature.js)
- RESULT: BYPASSED — no actorId ownership check at usecase or DAL layer
- ad.storage.dal.js:61-64: removeAd({id}) removes any ad with matching id regardless of actorId
- See BW-ADS-001 (cross-references VEN-ADS-004)

**Inferred Invariant 4**: The ads UI must only be accessible to the owner of the VPORT.
- ATTACK: Any authenticated Citizen visits `/ads/vport/<any-actorId>`
- RESULT: BYPASSED — route is not inside OwnerOnlyDashboardGuard (app.routes.jsx:154 vs :203)
- See BW-ADS-001 (cross-references VEN-ADS-001, VEN-ADS-002)

---

## 7. Exploitability Assessment

| Finding ID | Severity | Attack Path | Exploitability | Pre-requisite |
|---|---|---|---|---|
| BW-ADS-001 | HIGH | Visit /ads/vport/<foreignActorId> — route renders, actorId from URL wins | High (authenticated only) | Valid session, knowledge of target actorId |
| BW-ADS-002 | HIGH | URL param actorId overrides session actorId — stale session continues | High (same device) | Shared browser session or expired auth |
| BW-ADS-003 | MEDIUM | User-kind actor accesses vport-only ads pipeline | Medium | Any authenticated user |
| BW-ADS-004 | MEDIUM | localStorage tamper — inject ads with arbitrary actorId via XSS or DevTools | Medium (DevTools trivial) | Browser access or XSS |
| BW-ADS-005 | LOW | null actorId draft saved to localStorage; deleteAdUseCase(undefined) silent no-op | Low | Programmatic access |
| BW-ADS-006 | LOW | No state-machine enforcement — archived ads can be re-published | Low (localStorage only) | Actor owns the browser |
| BW-ADS-007 | LOW | Raw actorId UUID in /ads/vport/:actorId URL — violates platform URL policy | Low (policy violation) | None |

**Note on Current vs Migration Severity**:
All findings are scoped to the current localStorage-only implementation.
Upon Supabase migration, BW-ADS-001 and BW-ADS-002 escalate to CRITICAL (server-side write to victim's data).
BW-ADS-004 becomes HIGH (stored XSS payload reaching server).
BW-ADS-006 becomes HIGH (invalid state transitions in DB).

---

## 8. Source Verification Summary

All BYPASSED and BLOCKED claims are source-verified with file:line citations.

| Claim | File | Line | Verification |
|---|---|---|---|
| Route not inside OwnerOnlyDashboardGuard | app/routes/protected/app.routes.jsx | 154, 203 | [SOURCE_VERIFIED] |
| actorId from URL param takes priority over session | screens/VportAdsSettingsScreen.jsx | 16, 19 | [SOURCE_VERIFIED] |
| deleteAdUseCase accepts bare id, no ownership check | usecases/adPipeline.usecase.js | 50-51 | [SOURCE_VERIFIED] |
| removeAd has no actorId filter | dal/ad.storage.dal.js | 61-64 | [SOURCE_VERIFIED] |
| upsertAd has no actorId ownership check | dal/ad.storage.dal.js | 43-58 | [SOURCE_VERIFIED] |
| ads.feature.js barrel exports usecases | ads.feature.js | 3 | [SOURCE_VERIFIED] |
| No actor kind check anywhere in feature | All files searched | — | [SOURCE_VERIFIED] |
| No state-machine check in use cases | usecases/adPipeline.usecase.js | 22-51 | [SOURCE_VERIFIED] |
| localStorage global key with no per-actor namespace | dal/ad.storage.dal.js | 25, 30 | [SOURCE_VERIFIED] |
| useVportAds null-guard on load | hooks/useVportAds.js | 18-23 | [SOURCE_VERIFIED] |

---

## 9. Confidence Summary

| Finding | Provenance | Confidence |
|---|---|---|
| BW-ADS-001 | [SOURCE_VERIFIED] | HIGH |
| BW-ADS-002 | [SOURCE_VERIFIED] | HIGH |
| BW-ADS-003 | [SOURCE_VERIFIED] | HIGH |
| BW-ADS-004 | [SOURCE_VERIFIED] | HIGH |
| BW-ADS-005 | [SOURCE_VERIFIED] | HIGH |
| BW-ADS-006 | [SOURCE_VERIFIED] | HIGH |
| BW-ADS-007 | [SOURCE_VERIFIED] | MEDIUM (policy scope may vary) |

No SCANNER_LOW_CONF findings were promoted to BYPASSED status.
Scanner was used for surface discovery only; all bypass claims are source-confirmed.

---

## 10. §9 Invariant Attack Map

| Inferred Invariant | Attack Designed | Result | Finding |
|---|---|---|---|
| Actor cannot read/write foreign ads | Visit /ads/vport/<foreignActorId> | BYPASSED (route level) | BW-ADS-001 |
| actorId must come from session | Pass actorId via URL param | BYPASSED | BW-ADS-002 |
| Delete must be ownership-scoped | Call deleteAdUseCase(foreignId) | BYPASSED | BW-ADS-001 |
| Ads UI for VPORT owners only | Any authenticated user visits route | BYPASSED | BW-ADS-003 |
| Storage must not be globally poisonable | Tamper localStorage via DevTools/XSS | BYPASSED | BW-ADS-004 |

Note: All invariants are UNANCHORED (no §9 in BEHAVIOR.md). These are source-inferred
from platform conventions and the VENOM findings already recorded.

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md status: PLACEHOLDER

All §9 Must Never Happen entries are absent. This means:
- No formal invariants were available for attack harness construction
- All attacks were designed from source-inferred invariants and VENOM findings
- The UNANCHORED status confirmed by VEN-ADS-006 means there is no governance
  target to hold findings against
- THOR cannot gate release on §9 violations because §9 does not exist

Pre-existing VENOM finding VEN-ADS-006 remains OPEN and is directly evidenced by
the missing contract sections.

BW confirms: every one of the source-inferred invariants is currently BYPASSED
at the route or use case layer.

---

## 12. THOR Impact

### Release Blockers from BW Findings

| Finding | Severity | THOR Status |
|---|---|---|
| BW-ADS-001 | HIGH | RELEASE BLOCKER — must resolve before ads Supabase migration |
| BW-ADS-002 | HIGH | RELEASE BLOCKER — must resolve before ads Supabase migration |
| BW-ADS-003 | MEDIUM | DEFERRED — actor kind check missing, low exploitation risk pre-migration |
| BW-ADS-004 | MEDIUM | DEFERRED — localStorage XSS risk, elevated on migration |
| BW-ADS-005 | LOW | DEFERRED |
| BW-ADS-006 | LOW | DEFERRED — escalates to HIGH on migration |
| BW-ADS-007 | LOW | DEFERRED |

Current THOR gate: ads feature is pre-migration (localStorage only).
THOR Release Blocker becomes YES on ads Supabase migration for BW-ADS-001, BW-ADS-002
(in addition to pre-existing VEN-ADS-001, VEN-ADS-002, VEN-ADS-004).

---

## 13. SPIDER-MAN Test Requirements

The following tests are required before THOR clearance:

| Test ID | Type | Description |
|---|---|---|
| SM-ADS-BW-001 | Route Guard | Verify /ads/vport/:actorId rejects requests where URL actorId !== session actorId |
| SM-ADS-BW-002 | Route Guard | Verify null/undefined session identity redirects to /feed on ads route |
| SM-ADS-BW-003 | Use Case | Verify deleteAdUseCase(id) verifies ad.actorId matches session actorId before delete |
| SM-ADS-BW-004 | Use Case | Verify saveDraftUseCase rejects ad.actorId !== session actorId |
| SM-ADS-BW-005 | Actor Kind | Verify VportAdsSettingsScreen rejects kind !== 'vport' actors |
| SM-ADS-BW-006 | State Machine | Verify archived ads cannot be re-published |
| SM-ADS-BW-007 | DAL | Verify removeAd only removes ads matching authenticated session actorId |
| SM-ADS-BW-008 | DAL | Verify upsertAd rejects payloads where ad.actorId !== session actorId |

---

## Summary

**0 CRITICAL, 2 HIGH, 2 MEDIUM, 3 LOW, 0 INFO**

All HIGH findings are source-verified BYPASSED paths targeting the missing
OwnerOnlyDashboardGuard on the ads route and the missing ownership cross-check
in deleteAdUseCase. Current severity is bounded by localStorage-only storage;
all HIGH findings escalate to CRITICAL upon Supabase migration.

SECURITY.md updated: YES
