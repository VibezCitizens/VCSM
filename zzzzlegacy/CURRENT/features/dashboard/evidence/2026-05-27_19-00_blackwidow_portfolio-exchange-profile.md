# BLACKWIDOW Adversarial Simulation Report

**Date:** 2026-05-27 · 19:00
**Modules:** portfolio (`/vport/portfolio`) + exchange-profile (`/vport/exchange` public profile page)
**Reviewer:** BLACKWIDOW
**Application Scope:** VCSM
**Environment:** Static source trace + runtime path simulation (sandboxed — no production mutation)
**Governance Status:** DRAFT
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — VCSM root only
**Prior VENOM Sources:**
  - `2026-05-23_17-00_venom_portfolio-card.md` — Portfolio engine: 8 findings CRITICAL–HIGH
  - `2026-05-27_15-00_venom_exchange-module-reverification.md` — Exchange module: 8 findings HIGH–LOW
  - `2026-05-27_17-00_venom_exchange-module-post-hardening-reverification.md` — Post-hardening: 6 new findings

---

## BLACKWIDOW SIMULATION METHODOLOGY

BLACKWIDOW runs adversarial runtime simulations. For each scenario, a concrete attacker
identity is specified, a step-by-step exploit chain is traced through the actual source code,
and every gate is evaluated for BLOCKED / PARTIAL / BYPASSED status. BLACKWIDOW does not
modify source code and does not make production calls.

---

## MODULE 1 — PORTFOLIO

### Attack Surface Entry Points

| Surface | Path | Layer | Prior VENOM | BLACKWIDOW Scope |
|---|---|---|---|---|
| Portfolio engine adapter | `engines/portfolio/src/adapters/index.js` | ENGINE PUBLIC API | PARTIAL | ALL 5 scenarios |
| isActorOwner DI injected in setup.js | `apps/VCSM/src/features/portfolio/setup.js` | APP CONFIG | PORT-V-001 (OPEN) | Scenario 1, 2 |
| createItem / deleteItem / manageTags / removeMedia controllers | `engines/portfolio/src/controller/` | ENGINE | PORT-V-001–003 (OPEN) | Scenarios 1–5 |
| Public portfolio view | `apps/VCSM/src/features/profiles/kinds/vport/screens/portfolio/` | UI | PORT-V-013 (OPEN) | Scenarios 3, 4 |
| VportPortfolio.controller.js | `apps/VCSM/src/features/profiles/kinds/vport/controller/portfolio/VportPortfolio.controller.js` | VCSM controller | NEW | Scenario 3 |
| ctrlSavePortfolioDetail | `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js` | VCSM controller | PORT-V-004 (OPEN) | Scenario 1 |

---

### SCENARIO 1 — Ownership Bypass: Can Actor B call portfolio mutations for Actor A?

**Attacker identity:** Authenticated Citizen Bob, owns ActorB (kind='user' + valid VportB actor).
**Target:** ActorA, a locksmith VPORT owned by Alice.
**Goal:** Create a portfolio item under ActorA's profile; save locksmith portfolio detail under ActorA's item.

#### Step-by-step trace — createItem:

```
createItem({ actorId: 'actorA-uuid', title: 'Injected', ... })
  → actorId present check ✅
  → isActorOwner('actorA-uuid') [DI injected via setup.js]
    → supabase.auth.getSession() → Bob's session found ✅
    → if (!session?.user?.id) return false — passes (Bob has a session)
    → supabase.schema('vc').from('actor_owners')
        .select('actor_id')
        .eq('actor_id', 'actorA-uuid')   ← ActorA
        .eq('is_void', false)
        .limit(1)
      → RLS: actor_owners SELECT policy is user_id = auth.uid()
      → auth.uid() = Bob's user ID — actor_owners WHERE actor_id = ActorA AND user_id = Bob
      → ActorA is owned by Alice, not Bob → returns EMPTY
      → data?.[0] = null → returns false
  → ownerCheck === false → throws '[createItem] not authorized as this actor'
```

**Result: BLOCKED.**

The PORT-V-001 fix in `setup.js` correctly queries `actor_owners` with RLS auto-scoping
via `auth.uid()`. The explicit `user_id` join is enforced at DB layer — Bob cannot read
Alice's `actor_owners` row regardless of what is passed as `actor_id`.

#### Step-by-step trace — ctrlSavePortfolioDetail (locksmith):

```
ctrlSavePortfolioDetail('actorA-uuid', 'alice-portfolio-item-uuid', detail)
  → actorId + portfolioItemId presence check ✅
  → Parallel lookup:
    A) vport.from('profiles').select('id').eq('actor_id', 'actorA-uuid').maybeSingle()
       → RLS: vport.profiles SELECT — active profiles publicly readable
       → Returns Alice's profileId row ← NOTE: profile_id is returned to the controller
    B) vport.from('portfolio_items').select('profile_id').eq('id', 'alice-portfolio-item-uuid').maybeSingle()
       → RLS: portfolio_items SELECT — actor_can_view_profile allows reads for any authenticated user
       → Returns Alice's profile_id from the item row
  → callerProfileId = Alice's profileId (resolved from actorId='actorA-uuid')
  → itemProfileId = Alice's profileId (from item row)
  → callerProfileId === itemProfileId → TRUE ← DANGEROUS
  → Proceeds to dalUpsertLocksmithPortfolioDetail
```

**Result: BYPASSED — NEW FINDING.**

The PORT-V-004 fix added `actorId` as a parameter and performs an ownership check via
profile_id cross-reference. However the cross-check is WRONG. Both `callerProfileId` and
`itemProfileId` are resolved FROM THE CALLER-SUPPLIED `actorId`. The check proves only
that the item belongs to the actor supplied — NOT that the calling session owns that actor.

Bob supplies actorA-uuid → the code resolves Alice's profileId from actorA-uuid → the item
also resolves Alice's profileId → they match → passes. This is the same fundamental flaw
as PORT-V-006 in the VENOM report: the profile_id cross-check uses the caller-supplied actorId
to derive callerProfileId, not the session's authenticated actor. The fix restored no actual
protection for this controller.

This is a direct adversarial bypass. Classification: BW-PORT-004.

**Defense Gate:** ABSENT (the gate passes for any attacker who supplies the victim's actorId).
**RLS backstop:** `vport.locksmith_portfolio_details` — actor_can_manage_profile via portfolio_items join.
RLS is the only blocking gate for this path. DB-layer blocks the UPSERT because
auth.uid() = Bob, profile_id = Alice's → actor_can_manage_profile returns false.

---

### SCENARIO 2 — Cross-Feature Abuse: Can the portfolio engine DAL be called directly?

**Attacker:** Bob, authenticated, uses browser dev tools or Postman with his session JWT.
**Goal:** Bypass the app-layer wrapper and call the engine's public adapter directly.

The engine adapter (`engines/portfolio/src/adapters/index.js`) exports `createItem`, `deleteItem`,
`removeMedia`, `manageTags`, `updateItem`, `addMedia`. These are importable by any JS consumer
that resolves `@portfolio` alias.

In VCSM, `@portfolio` resolves to the engine. Within the browser context, Vite bundles the
engine into the app chunk. A direct call from browser console would require finding the bundled
module reference — possible in a dev build, much harder in production (minified + tree-shaken).

Assuming attacker bypasses the bundle and calls engine controller directly:

```
engines/portfolio/src/controller/createItem({ actorId: 'actorA', ... })
  → isActorOwner('actorA') [from DI config]
    → queries vc.actor_owners WHERE actor_id = actorA AND user_id = Bob (via RLS)
    → empty → returns false → BLOCKED
```

**Result: BLOCKED at engine DI gate.**

Even if the app-layer VCSM controller is bypassed, the engine's `isActorOwner` DI function
(now fixed in setup.js) provides a blocking gate that requires session ownership via actor_owners.
Additionally, all writes are backed by RLS. There is no service-role bypass in any portfolio path.

**Defense Gate:** PRESENT. Engine DI gate + RLS double coverage.

---

### SCENARIO 3 — Viewer Context Fuzz: null viewerActorId to portfolio read

**Target:** `ctrlListPortfolio(actorId)` → `engineListPortfolio` → `dalListPortfolioItemsByProfileId`
**Attacker vector:** Unauthenticated visitor navigates to a VPORT portfolio tab.

```
ctrlListPortfolio('actorA-uuid', { limit: 24, offset: 0 })
  → engineListPortfolio({ actorId: 'actorA-uuid', ... })
  → listPortfolio.controller.js → dalGetProfileIdByActorId({ actorId })
    → vport.profiles SELECT WHERE actor_id = actorA AND (no auth filter)
    → Returns Alice's profileId (public profile)
  → dalListPortfolioItemsByProfileId({ profileId, ... })
    .eq('is_deleted', false)
    → No visibility filter applied
    → RLS: portfolio_items SELECT — actor_can_view_profile → is_active profile required
    → For unauthenticated user (no session): RLS may block entirely or allow only public rows
    → NOTE: portfolio_media RLS SELECT is role:public — allows anon reads for active, is_active=true items
```

**Visibility filter gap confirmed (PORT-V-013):** `dalListPortfolioItemsByProfileId` applies
`is_deleted=false` but does NOT filter `visibility='public'`. Items with `visibility='private'`
or `visibility='unlisted'` are included in the query. Whether they reach the client depends on
the RLS `actor_can_view_profile` evaluation.

**Runtime simulation:**
- Authenticated viewer (not owner): RLS `portfolio_items_select_access` → `actor_can_view_profile`
  allows reads for non-deleted, is_active profiles. Visibility column is not in the RLS filter.
  Private items ARE returned to any authenticated user who knows the actorId.
- Unauthenticated viewer: RLS role check — `portfolio_items` policies are `role: authenticated`.
  Unauthenticated users cannot read the table. Portfolio remains inaccessible to anon visitors.

**Result for null viewerActorId (unauthenticated): BLOCKED by RLS role.**
**Result for authenticated non-owner: PARTIAL — private-visibility items returned (PORT-V-013 confirmed active).**

**Defense Gate:** PRESENT for unauthenticated (RLS role blocks anon reads). WEAK for authenticated
non-owner when portfolio items have `visibility='private'`.

---

### SCENARIO 4 — URL Surface: Portfolio item URLs — raw UUID exposure?

Reading `VportPortfolioView.jsx` and `PortfolioItemModal.jsx` — the public portfolio view renders
portfolio items as a grid. Items are opened via an in-modal viewer triggered by click. No URL
navigation occurs (no route push). `PortfolioItemModal` is a fixed overlay component. No URL
contains item IDs.

Portfolio item IDs (UUIDs) are:
- Returned in `dalListPortfolioItemsByProfileId` response (visible in browser network tab)
- Used as React `key` props in the grid (visible in DOM inspection)
- Not embedded in any public-facing URL, route, or shareable link

**Result: No raw UUID in public URLs.**

The portfolio does not embed item IDs in routes or share links. An attacker can observe
`itemId` values via network traffic (the list API call), but not from a URL slug. This is an
acceptable surface — network-observable IDs are expected; URL-embedded IDs are banned per
platform rules. No violation found.

**Defense Gate:** PRESENT (no UUID in URL routes). Network-observable itemIds are an
acceptable residual surface — consistent with platform norms.

---

### SCENARIO 5 — RLS Verification Under Hostile actorId

**Attack:** Bob authenticates, crafts a direct Supabase REST call with his JWT:

```
POST /rest/v1/vport.portfolio_items
Headers: Authorization: Bearer <Bob-JWT>
Body: { profile_id: '<Alice-profileId>', title: 'Injected', ... }
```

RLS INSERT policy (`portfolio_items_insert_managed`):
```sql
actor_can_manage_profile(current_actor_id(), profile_id)
```

`current_actor_id()` resolves from `vc.actor_owners WHERE user_id = auth.uid()` (Bob's ID).
Bob's current_actor_id = Bob's VportB. `actor_can_manage_profile(VportB, Alice-profileId)`:
  - `profiles.owner_user_id = auth.uid()` → Alice-profileId.owner_user_id = Alice.userId ≠ Bob → false
  - `profile_actor_access` check → no active link between Bob and Alice's profile → false
  → `actor_can_manage_profile` returns false → INSERT BLOCKED.

```
DELETE /rest/v1/vport.portfolio_media?id=eq.<Alice-mediaId>
Headers: Authorization: Bearer <Bob-JWT>
```

RLS DELETE policy (`portfolio_media_delete`):
`actor_can_manage_profile(current_actor_id(), profile_id)` → same evaluation → BLOCKED.

**Result: BLOCKED at DB layer across all portfolio write paths.**

**Defense Gate:** PRESENT. RLS is VERIFIED (live DB 2026-05-23 17:30) on all portfolio tables.

---

## MODULE 1 — PORTFOLIO FINDINGS SUMMARY

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-PORT-001
- Scenario: Scenario 1 — Ownership Bypass (createItem, deleteItem, manageTags, removeMedia)
- Target: engines/portfolio/src/config.js isActorOwner DI / apps/VCSM/src/features/portfolio/setup.js
- Application Scope: VCSM
- Platform Surface: PWA — Portfolio write paths
- Attack Vector: Authenticated non-owner calls portfolio write mutation with victim's actorId
- Exploit Chain Type: Identity substitution — attacker supplies victim actorId to engine controller
- Governance Status: DRAFT
- Result: BLOCKED
- Evidence: setup.js isActorOwner queries actor_owners with RLS auto-scope (auth.uid()).
  Actor_owners RLS enforces user_id = auth.uid() — Bob cannot read Alice's row.
  Confirmed: all 4 write paths (createItem, deleteItem, manageTags, removeMedia) gate on isActorOwner.
- Defense Gate: PRESENT — DI ownership gate + RLS double-coverage
- Blast Radius: N/A — attack blocked at engine layer
- Severity: N/A (BLOCKED)
- VENOM Finding Cross-Reference: PORT-V-001 (VENOM said CRITICAL). BW VERIFIES: PORT-V-001 fix is
  effective. The fix in setup.js correctly uses actor_owners with RLS scope rather than actors table.
- Recommended Fix: None — PORT-V-001 confirmed remediated for the four primary write controllers.
  Residual concern: ctrlSavePortfolioDetail is NOT routed through isActorOwner — see BW-PORT-004.
- Layer to Fix: N/A
- Required Follow-up Command: SPIDER-MAN (regression test for isActorOwner with cross-actor actorId)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-PORT-002
- Scenario: Scenario 2 — Cross-Feature Abuse (direct engine DAL call)
- Target: engines/portfolio/src/adapters/index.js (public engine API surface)
- Application Scope: VCSM + ENGINE
- Platform Surface: PWA — Vite bundle (engine co-bundled with app)
- Attack Vector: Attacker accesses bundled engine module reference via browser dev tools or
  alternate import path, bypassing the VCSM app-layer controller.
- Exploit Chain Type: Layer skip — bypass VCSM controller, call engine directly
- Governance Status: DRAFT
- Result: BLOCKED
- Evidence: Engine DI isActorOwner is the canonical gate regardless of call path.
  Even on direct engine call, isActorOwner queries actor_owners with session auth.uid() scope.
  No service-role or SECURITY DEFINER exposure exists in any portfolio write path.
  All engine DAL paths use anon key + user JWT — no privilege escalation possible.
- Defense Gate: PRESENT — engine DI gate is call-path-agnostic; RLS provides DB-layer backstop
- Blast Radius: N/A — attack blocked at engine DI layer
- Severity: N/A (BLOCKED)
- VENOM Finding Cross-Reference: PORT-V-010 (orchestration in hook layer). BW VERIFIES: even when
  the hook layer is bypassed, the engine gate holds. Cross-feature direct imports remain an
  architecture concern but do not create an exploitable security gap given the DI fix.
- Recommended Fix: N/A for this attack path. Architectural improvement: consider lazy-loading the
  engine module in production to limit bundle exploration surface (PORT-V-009 follow-up).
- Layer to Fix: N/A
- Required Follow-up Command: None (BLOCKED)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-PORT-003
- Scenario: Scenario 3 — Viewer Context Fuzz (null viewerActorId / private item visibility)
- Target: engines/portfolio/src/controller/listPortfolio.controller.js +
          engines/portfolio/src/dal/portfolioItems.read.dal.js (dalListPortfolioItemsByProfileId)
- Application Scope: VCSM + ENGINE
- Platform Surface: PWA — Public portfolio tab (VportPortfolioView)
- Attack Vector: Authenticated non-owner reads portfolio items with visibility='private'
  by calling the portfolio list endpoint with victim actorId.
- Exploit Chain Type: Insufficient filter — missing visibility gate allows private item reads
- Governance Status: DRAFT
- Result: PARTIAL — unauthenticated blocked; authenticated non-owner receives private items
- Evidence:
  - Unauthenticated (null session): portfolio_items RLS role=authenticated — anon callers
    receive RLS denial. Public portfolio is inaccessible to unauthenticated visitors. BLOCKED.
  - Authenticated non-owner: dalListPortfolioItemsByProfileId filters only is_deleted=false.
    No visibility='public' filter applied at app or engine layer. RLS SELECT policy
    (actor_can_view_profile) does NOT filter by visibility column — it only checks
    profile active state. Private-visibility portfolio items are returned to any authenticated
    platform user who knows the victim's actorId. PARTIAL exposure confirmed.
  - portfolio_media RLS is role:public — active media rows for active profiles are readable
    by any caller including unauthenticated. A visitor can enumerate all active portfolio media
    by portfolio_item_id if they know the item IDs (observable via network traffic on the list call).
- Defense Gate: PRESENT (unauthenticated blocked). WEAK (private visibility items returned to
  authenticated non-owner). ABSENT (portfolio_media readable without auth for active items).
- Blast Radius: Any portfolio item with visibility='private' on any VPORT — readable by any
  authenticated platform user. Platform-wide; depends on whether VPORT owners use private visibility.
- Severity: MEDIUM (PORT-V-013 confirmed active — new adversarial classification adds media RLS note)
- VENOM Finding Cross-Reference: PORT-V-013 (LOW in VENOM — BW elevates to MEDIUM given active
  confirmability of the private-item read path in an adversarial test). Media RLS role=public
  is a separate gap not previously classified as a finding.
- Recommended Fix:
  1. Add .eq('visibility', 'public') to dalListPortfolioItemsByProfileId for non-owner callers.
     Add ownerMode parameter to bypass the filter for dashboard use.
  2. Confirm intended behavior of portfolio_media RLS role=public — if public media reads
     without auth are intentional for active profiles, document it; if not, switch to role=authenticated.
- Layer to Fix: ENGINE DAL (dalListPortfolioItemsByProfileId) + APP (portfolio display controller)
- Required Follow-up Command: ELEKTRA (patch advisory for visibility filter + media RLS documentation)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-PORT-004
- Scenario: Scenario 1 (extended) — Ownership Bypass via ctrlSavePortfolioDetail
- Target: apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js
          ctrlSavePortfolioDetail (line 105–136)
- Application Scope: VCSM
- Platform Surface: PWA — Locksmith portfolio detail form (VportDashboardPortfolioScreen)
- Attack Vector: Authenticated locksmith VPORT owner Bob supplies victim Alice's actorId and
  a known portfolio item ID belonging to Alice. The PORT-V-004 "fix" derives callerProfileId
  FROM the caller-supplied actorId — not from the authenticated session. The cross-check
  proves item belongs to the supplied actorId, not that the session owns that actorId.
- Exploit Chain Type: Ownership verification using caller-controlled input as both the
  "expected" and "actual" side of the assertion — self-referential trust failure.
- Governance Status: DRAFT
- Result: BYPASSED — CRITICAL NEW FINDING
- Evidence:
  The "fixed" controller (locksmithOwner.controller.js line 105–136) executes:
    [profileRow] = vport.from('profiles').select('id').eq('actor_id', actorId).maybeSingle()
    callerProfileId = profileRow?.id  // ← profileId of the actor SUPPLIED by caller, not session actor
    itemProfileId = itemRow?.profile_id
    if (callerProfileId !== itemProfileId) throw // ← compares victim profileId to victim profileId
  When Bob supplies actorId='alice-actorId', callerProfileId resolves to Alice's profileId.
  When itemId='alice-item-uuid', itemProfileId also resolves to Alice's profileId.
  callerProfileId === itemProfileId → TRUE → authorization check passes.
  No isActorOwner call. No session ownership verification whatsoever.
  Bob successfully invokes ctrlSavePortfolioDetail for Alice's portfolio item.
  Execution proceeds to dalUpsertLocksmithPortfolioDetail with Alice's portfolio item.
  Only gate remaining: RLS on vport.locksmith_portfolio_details via actor_can_manage_profile.
  RLS blocks because auth.uid() = Bob → actor_can_manage_profile on Alice's profile → false.
  Result: RLS is the SOLE blocking gate. App layer is completely bypassable.
- Defense Gate: ABSENT (app layer); PRESENT (RLS DB layer — sole effective gate)
- Blast Radius: Any locksmith portfolio item on the platform. Any authenticated locksmith VPORT
  owner who knows another locksmith VPORT's actorId and any of their portfolioItemIds.
- Severity: CRITICAL — Full app-layer ownership bypass confirmed. DB RLS is sole gate.
- VENOM Finding Cross-Reference: PORT-V-004 (VENOM HIGH, marked as patched). BW finds the fix
  is architecturally broken — it added actorId but still derives callerProfileId from caller-supplied
  actorId rather than from the authenticated session. The fix is a false remediation.
- Recommended Fix:
  Replace the profile lookup pattern. The correct fix:
    1. Fetch the authenticated session's actorId via supabase.auth.getSession() — do not
       trust the caller-supplied actorId for the "caller" side of the assertion.
    2. Alternatively, require an isActorOwner check against the caller-supplied actorId using
       the actor_owners table (same pattern as setup.js isActorOwner fix).
    3. The canonical pattern is assertActorOwnsVportActorController used by upsertVportRateController
       and publishExchangeRateUpdateAsPostController — import and call it here.
    4. Only after assertActorOwnsVportActorController passes, verify item.profile_id matches the
       caller's own profileId (derived from their session actorId, not the supplied actorId).
- Layer to Fix: CONTROLLER (locksmithOwner.controller.js — ctrlSavePortfolioDetail)
- Required Follow-up Command: ELEKTRA (precise patch), SPIDER-MAN (regression — cross-actor test)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-PORT-005
- Scenario: Scenario 4 — URL Surface (portfolio item UUID exposure)
- Target: VportPortfolioView.jsx, PortfolioItemModal.jsx, PortfolioCard.jsx
- Application Scope: VCSM
- Platform Surface: PWA — Public portfolio tab, portfolio item modal
- Attack Vector: Inspect public URLs and share links for embedded raw portfolio item UUIDs
- Exploit Chain Type: Information disclosure via URL surface
- Governance Status: DRAFT
- Result: BLOCKED — No raw UUIDs in public URLs
- Evidence:
  - Portfolio items open via in-page modal state (click handler → openItem → setShowModal).
    No route navigation. No URL param push. itemId values are not URL-embedded.
  - PortfolioCard.jsx renders items as grid cards with click handlers — no href with itemId.
  - VportPortfolioView.jsx uses item.id only as React key prop (DOM, not URL).
  - No share/copy-link feature observed on individual portfolio items.
  - itemId values are observable in network requests (Supabase REST response body) but
    this is an acceptable surface — network-layer IDs are not the same as URL-layer UUIDs.
- Defense Gate: PRESENT — no UUID in URL routes or share links. Platform norms satisfied.
- Blast Radius: N/A (no finding)
- Severity: N/A (BLOCKED)
- VENOM Finding Cross-Reference: N/A (new BLACKWIDOW scenario — no VENOM finding for URL surface)
- Recommended Fix: None. Maintain current modal-only pattern for portfolio item viewing.
  If a shareable portfolio item link is added in future, enforce slug-based URLs.
- Layer to Fix: N/A
- Required Follow-up Command: None
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-PORT-006
- Scenario: Scenario 5 — RLS Verification Under Hostile actorId
- Target: vport.portfolio_items, vport.portfolio_media, vport.portfolio_tags (DB layer)
- Application Scope: VCSM + ENGINE
- Platform Surface: Supabase REST API (direct DB access with user JWT)
- Attack Vector: Attacker uses Supabase REST API directly with valid session JWT to bypass
  app-layer and attempt cross-actor INSERT, UPDATE, DELETE on portfolio tables.
- Exploit Chain Type: Direct REST DB manipulation bypassing VCSM application controllers
- Governance Status: DRAFT
- Result: BLOCKED — RLS verified on all portfolio write paths
- Evidence:
  - portfolio_items: INSERT/UPDATE/DELETE all gated by actor_can_manage_profile (VERIFIED live DB 2026-05-23 17:30).
    auth.uid() = attacker → actor_can_manage_profile on victim profileId → false → blocked.
  - portfolio_media: INSERT/UPDATE/DELETE gated by actor_can_manage_profile (VERIFIED).
    DELETE confirmed via portfolio_media_delete policy.
  - portfolio_tags: INSERT/DELETE gated by owner_user_id = auth.uid() OR actor_owners join (VERIFIED WITH CAVEAT).
    Direct REST writes blocked for non-owner authenticated users.
  - No service-role bypass present in any client-reachable portfolio path.
  - No SECURITY DEFINER function that accepts caller-controlled input for write operations
    (the broken RPCs — vc.get_vport_portfolio, etc. — are read-only and reference non-existent tables, BROKEN).
- Defense Gate: PRESENT — DB-layer RLS confirmed on all 3 primary portfolio tables.
- Blast Radius: N/A (blocked at DB layer)
- Severity: N/A (BLOCKED)
- VENOM Finding Cross-Reference: PORT-V-007 (VERIFIED — reclassified to LOW by VENOM 2026-05-23 17:30).
  BW independently confirms VENOM live DB finding. No regression detected.
- Recommended Fix: None (BLOCKED). Maintain RLS policies. Periodic CARNAGE re-verification
  recommended as new migrations land.
- Layer to Fix: N/A
- Required Follow-up Command: CARNAGE (verify RLS policy continuity after next migration batch)
```

---

## MODULE 1 — PORTFOLIO: DEFENSE SUMMARY

| Attack Scenario | Result | App-Layer Gate | DB-Layer Gate | Severity |
|---|---|---|---|---|
| Ownership bypass — createItem/deleteItem/manageTags/removeMedia | BLOCKED | PRESENT (isActorOwner fixed) | PRESENT (RLS verified) | N/A |
| Cross-feature engine direct call | BLOCKED | PRESENT (engine DI) | PRESENT (RLS) | N/A |
| Viewer fuzz — null/anon viewerActorId | BLOCKED (anon) / PARTIAL (auth non-owner) | WEAK (no visibility filter) | PARTIAL (media role=public) | MEDIUM |
| URL surface — raw UUID in routes | BLOCKED | PRESENT (modal-only pattern) | N/A | N/A |
| Direct REST hostile actorId | BLOCKED | N/A (bypassed) | PRESENT (RLS verified) | N/A |
| ctrlSavePortfolioDetail — false ownership fix | BYPASSED | ABSENT (fix is broken) | PRESENT (RLS sole gate) | CRITICAL |

---

---

## MODULE 2 — EXCHANGE-PROFILE (Public Profile Page)

**Clarification of scope:** This module is the PUBLIC-FACING exchange VPORT profile page
(`/vport/exchange` — VportProfileViewScreen.jsx, VportRatesView.jsx, `getVportPublicDetailsController`).
This is NOT the exchange rate DASHBOARD (which is fully audited and COMPLETE). The audit covers:
what data is exposed on the public profile, whether deleted/inactive VPORTs resolve, URL surface,
and whether the publish path has any post-hardening replay vulnerability.

### Attack Surface Entry Points

| Surface | Path | Layer | Prior VENOM | BLACKWIDOW Scope |
|---|---|---|---|---|
| Public profile view | `VportProfileViewScreen.jsx` | UI Screen | VE-2705-05 (OPEN) | Scenarios 1–3 |
| Public details controller | `getVportPublicDetailsController` | VCSM controller | N/A | Scenarios 1–3 |
| Public details DAL | `fetchVportPublicDetailsByActorId` | DAL | N/A | Scenarios 1, 3 |
| Public rates read | `VportRatesView.jsx` + `readVportRatesByActorDal` | UI + DAL | VE-2705-05 | Scenario 2 |
| Rates model | `mapVportPublicDetails.model.js` | Model | VE-2705-03 | Scenario 2 |
| Feed publish controller | `publishExchangeRateUpdateAsPost.controller.js` | Controller | VE-2705-01 (CLOSED) | Scenario 5 |

---

### SCENARIO 1 — Ownership Bypass: Can non-owner update exchange profile details via profile endpoint?

**Attacker:** Bob (authenticated), targets Alice's exchange VPORT profile.
**Goal:** Modify Alice's profile name, bio, avatar, or public_details via the profile page endpoint.

Reading `VportProfileViewScreen.jsx` in full: this is a READ-ONLY view screen. It uses:
- `useProfileView` (read)
- `useVportProfileBySlug` (read)
- `getVportPublicDetailsController` (read, TTL-cached 60s)
- `deriveVportIsOwner` (UI state derivation, not mutation)

There is NO mutation entrypoint on the public profile view screen. The screen does not expose
any form, write controller, or mutation hook for profile editing. Profile details (name, bio,
avatar, public_details) are managed through the dashboard settings module, which is separately
gated.

The `isOwner` flag controls only the "owner" tab visibility — it does not gate any write path
on this screen because there are no write paths on this screen.

**Result: BLOCKED — no mutation surface exists on the public profile page.**

**Defense Gate: PRESENT** (read-only architecture — no write paths to attack).

---

### SCENARIO 2 — Runtime Abuse: Does the public profile page expose internal rate-history, actor_id, profile_id fields?

**Goal:** Determine if the public profile response leaks internal identifiers (profile_id, vportId,
internal DB IDs) or rate-setting internal data (rate history, admin rates, profile_id in rate rows).

#### Public Details model trace:

`getVportPublicDetailsController` → `fetchVportPublicDetailsByActorId` → `mapVportPublicDetailsModel`

DAL SELECT on `vport.profiles`:
```sql
SELECT id, name, slug, bio, avatar_url, banner_url,
       public_details:profile_public_details(city_id, website_url, email_public,
       phone_public, location_text, address, hours, price_tier, highlights,
       languages, payment_methods, social_links, booking_url, logo_url, accent_color)
```

The `id` column (vport.profiles internal UUID = profileId) IS selected in the DAL. It is stored
in the raw return object but NOT mapped in `mapVportPublicDetailsModel`. The model explicitly
excludes internal IDs — only `actorId` (the canonical public identity) appears on the output.

Comment in model (line 1–8): "This model must NOT expose internal DB IDs (profileId, vportId)
or internal lifecycle/moderation flags." The model respects this.

**Residual concern:** The raw `data.id` (profileId) is present in the DAL response object
that flows into `mapVportPublicDetailsModel(raw, ...)`. The function ignores it (it maps
`raw.actor_id` as `actorId`, no `raw.id` mapping). If the raw object is ever logged, traced,
or serialized before model mapping, the profileId leaks. This is a low-risk latent concern,
not a current user-facing leak.

#### Public rates trace:

`VportRatesView` → `useVportRates` → `readVportRatesByActorDal`

`RATES_SELECT` = `"id,profile_id,rate_type,base_currency,quote_currency,buy_rate,sell_rate,meta,updated_at,created_at"`

`profile_id` IS in the DAL select. The raw rows contain `profile_id`. However, `VportRateCard`
receives only `{ baseCurrency, quoteCurrency, buyRate, sellRate, updatedAt }` — `profile_id`
is not passed to the rendered component.

But `readVportRatesByActorDal` returns raw rows directly to the hook (`useVportRates`), which
stores them in React Query cache. `profile_id` sits in the cache state. This matches VENOM
finding VE-2705-03 (OPEN — not closed). In a production build, React Query devtools or any
error boundary that serializes state could expose `profile_id`.

**Result: PARTIAL.** No profile_id or internal ID is rendered to the user. VportRatesView
correctly destructures only public rate fields. But profile_id flows through hook state uncleaned
(VE-2705-03 confirmed active, unmitigated). No rate-history or admin rate data is exposed —
only the current published rates.

**Defense Gate: PRESENT** (rendered fields correct). **WEAK** (profile_id in cache state — VE-2705-03).

---

### SCENARIO 3 — Viewer Context Fuzz: Deleted/inactive exchange VPORT — does public profile still resolve?

**Goal:** Navigate to a deleted or inactive exchange VPORT's profile. Does it render? Does it
return partial data? Does it expose any information about the deleted profile?

Trace through `fetchVportPublicDetailsByActorId`:

```js
const { data: newData } = await vportSchema
  .from("profiles")
  .select(...)
  .eq("actor_id", actorId)
  .eq("is_deleted", false)   // ← hard filter
  .eq("is_active", true)     // ← hard filter
  .maybeSingle();

if (newData) { ... return rawObject ... }
return null;  // ← if deleted or inactive: returns null
```

`getVportPublicDetailsController` → `mapVportPublicDetailsModel(raw, vportTypeRow)`:
- If raw = null → returns null.

`VportProfileViewScreen`:
```jsx
const isVportUnavailable = !publicDetailsLoading && publicDetails === null;
if (isVportUnavailable) {
  return <UnavailableProfileGate />;
}
```

**Result: BLOCKED.** Deleted/inactive VPORTs resolve as null at the DAL layer via hard filters.
The screen renders `UnavailableProfileGate` — no profile data is shown. No information about
the deleted profile leaks through the public page. The lifecycle gate is correctly implemented
at the DAL query layer, not at the UI layer.

**Defense Gate: PRESENT** — query-layer lifecycle gate confirmed effective.

---

### SCENARIO 4 — URL Surface: Exchange share links — raw UUID exposure?

**Goal:** Examine how the exchange VPORT profile is addressed in URLs. Does the public URL
expose the actor's raw UUID?

`VportProfileViewScreen` is mounted via `useParams()` which reads `actorId` as the route slug.
The route is `/profile/:actorId` or `/actor/:actorId` (React Router).

Examining `VportProfileViewScreen.jsx` line 73:
```js
const { actorId: routeSlug } = useParams();
const { publicDetails, isLoading: publicDetailsLoading } = useVportProfileBySlug(routeSlug);
```

The URL parameter is named `actorId` in params but the comment "routeSlug" suggests it may
be used as a slug lookup. `useVportProfileBySlug` resolves by slug — the actual DB query in
`vportPublicDetails.read.dal.js` uses `.eq("actor_id", actorId)` directly, which means if
the URL contains a raw UUID, it is treated as actorId.

Reading the navigation patterns: exchange VPORT profiles are linked from feed posts via
actorId-based URLs (e.g., `/profile/<actorId>`). The exchange VPORT profile is NOT accessed
via a human-readable slug in the current implementation — the `slug` field is stored in
`vport.profiles` and mapped by the model but is NOT used as the URL parameter in the
profile route.

**Result: PARTIAL** — raw actorId UUIDs appear in exchange VPORT profile URLs.
This is a known platform-level concern (MEMORY: "No raw IDs in public URLs"). The exchange
profile public URL exposes the actor's UUID. An attacker who observes the URL can enumerate
other VPORT actors on the platform.

However: actorId exposure in URLs is a platform-wide issue, not an exchange-profile-specific
vulnerability. The exchange module does not add additional UUID exposure beyond what the profile
routing system already does. This is an existing platform concern, not a new finding from this module.

**Defense Gate: ABSENT** (no slug-based routing for exchange VPORT profiles — raw actorId in URL).
**Blast Radius:** Information disclosure only — actorId is publicly observable; ownership,
financial data, and private data remain protected.

---

### SCENARIO 5 — Mutation Replay: Can a stale exchange rate publish be replayed by a non-owner?

**Goal:** Replay a captured `publishExchangeRateUpdateAsPostController` call with a different
identityActorId (or a stale session) to publish a duplicate post.

Post-hardening trace through `publishExchangeRateUpdateAsPostController`:

```
publishExchangeRateUpdateAsPostController({
  identityActorId: 'stale-or-attacker-actor',
  actorId: 'victim-actor',
  baseCurrency: 'USD', quoteCurrency: 'MXN',
  buyRate: 17.5, sellRate: 17.8
})
  → if (!actorId) throw ✅
  → if (!identityActorId) throw ✅
  → assertActorOwnsVportActorController({
      requestActorId: 'stale-or-attacker-actor',
      targetActorId: 'victim-actor'
    })
    → DB: actor_owners WHERE actor_id = 'victim-actor' AND user_id = auth.uid()
    → If attacker (auth.uid() = attacker's userId) → no actor_owners row → throws ✅ BLOCKED
    → If stale session (expired JWT) → Supabase auth rejects JWT → 401 → BLOCKED
  → assertValidRate(buyRate) ✅ (positive finite required)
  → hasRecentExchangeRatePostDAL → dedup 1h window ✅
  → createSystemPost → vc.posts INSERT RLS: posts_insert_actor_owner (auth.uid() = actor_owners match) ✅
```

**Dedup window caller-overridable (VEN-EXCH-004):** The DAL exports `hasRecentExchangeRatePostDAL`
with a `windowMs` parameter. The controller does NOT pass a custom `windowMs` — it uses the default
1-hour window. A direct DAL call with `windowMs: 0` would collapse the window.

**Adversarial simulation of windowMs: 0 bypass:**
```
hasRecentExchangeRatePostDAL({ actorId: 'actorA', windowMs: 0 })
  → since = new Date(Date.now() - 0).toISOString() = now
  → SELECT WHERE created_at >= now → no posts since "now" (exact timestamp) → returns false
  → Dedup bypassed: false means "no recent post" → publish proceeds
```

But this bypass requires direct DAL access. The controller call chain does not expose `windowMs`.
The DAL export is the exposure surface. Any code that imports `hasRecentExchangeRatePostDAL`
and passes `windowMs: 0` can bypass the dedup. In a production Vite bundle, the DAL is bundled
and not directly callable from the browser console without module reference access.

Additionally, even with dedup bypassed, `createSystemPost` goes through RLS:
`posts_insert_actor_owner` requires `actor_owners` link. An attacker who doesn't own the VPORT
cannot publish under it even with dedup bypassed. A legitimate owner flooding their own feed
with rate posts is a self-harm scenario (allowed by ownership semantics, throttled by dedup).

**Result: BLOCKED for non-owner replay (assertActorOwnsVportActorController). PARTIAL for
owner self-flood via windowMs DAL bypass.**

**Defense Gate: PRESENT** (ownership gate blocks non-owner replay). **WEAK** (dedup window
caller-overridable in DAL export — VEN-EXCH-004 confirmed active).

---

## MODULE 2 — EXCHANGE-PROFILE FINDINGS SUMMARY

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-EXPROFILE-001
- Scenario: Scenario 1 — Ownership Bypass on public profile mutation
- Target: VportProfileViewScreen.jsx — public exchange profile page
- Application Scope: VCSM
- Platform Surface: PWA — Public VPORT profile view (/vport/exchange public page)
- Attack Vector: Non-owner attempts to trigger profile mutations from the public profile page
- Exploit Chain Type: N/A — no mutation surface exists on public profile page
- Governance Status: DRAFT
- Result: BLOCKED — read-only architecture
- Evidence: VportProfileViewScreen.jsx contains zero mutation hooks, zero write controllers,
  zero form submissions. isOwner flag controls tab visibility only. No write surface exists.
- Defense Gate: PRESENT — architecture is read-only; all mutations are dashboard-only
- Blast Radius: N/A
- Severity: N/A (BLOCKED)
- VENOM Finding Cross-Reference: VE-2705-08 (architecture layer concern — screen doing too much in
  DASHBOARD context; NOT this public profile context). Public profile screen is correctly scoped.
- Recommended Fix: None
- Layer to Fix: N/A
- Required Follow-up Command: None
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-EXPROFILE-002
- Scenario: Scenario 2 — Runtime Abuse (internal data exposure on public profile page)
- Target: readVportRatesByActorDal RATES_SELECT + mapVportPublicDetailsModel
- Application Scope: VCSM
- Platform Surface: PWA — Public exchange profile (VportRatesView embedded in profile)
- Attack Vector: Inspect React component state, React Query devtools cache, or error serialization
  to extract internal identifiers (profile_id, vportId) from exchange profile page
- Exploit Chain Type: Information disclosure via unclean state — internal ID in cache
- Governance Status: DRAFT
- Result: PARTIAL
- Evidence:
  - profile_id IS in RATES_SELECT → flows into React Query cache via readVportRatesByActorDal.
    VE-2705-03 confirmed active. profile_id not rendered but present in cache state.
  - mapVportPublicDetailsModel correctly strips profile_id (raw.id from vport.profiles select)
    — only actorId is exposed in the model output. Public details model is clean.
  - No rate-history, admin rate, or internal rate-setting data is exposed on public profile.
    Only current published rates (baseCurrency, quoteCurrency, buyRate, sellRate, updatedAt)
    reach the rendered component via VportRateCard.
  - No actor_id raw UUID is exposed in rendered HTML or API response beyond the canonical
    actorId field (which is intentionally public).
- Defense Gate: PRESENT (rendered output clean). WEAK (profile_id in React Query cache).
- Blast Radius: Internal UUID (profile_id) visible in dev tools / error serialization only.
  Not user-facing. Not accessible to unauthenticated visitors.
- Severity: LOW (VE-2705-03 active — profile_id in cache state)
- VENOM Finding Cross-Reference: VE-2705-03 (MEDIUM in VENOM — BW confirms active, no new escalation
  for public profile context where the finding has lower impact than dashboard context).
- Recommended Fix: Remove profile_id from RATES_SELECT in readVportRatesByActorDal.
  Apply model mapping at the controller boundary before returning to hook state.
- Layer to Fix: DAL (readVportRatesByActorDal) + CONTROLLER (getVportRates.controller.js)
- Required Follow-up Command: ELEKTRA (patch advisory for RATES_SELECT cleanup)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-EXPROFILE-003
- Scenario: Scenario 3 — Deleted/inactive VPORT profile resolution
- Target: fetchVportPublicDetailsByActorId + VportProfileViewScreen.jsx lifecycle gate
- Application Scope: VCSM
- Platform Surface: PWA — Public exchange VPORT profile page
- Attack Vector: Navigate to a deleted or inactive exchange VPORT's profile URL to extract data
- Exploit Chain Type: Lifecycle bypass — access data for voided/deleted profile
- Governance Status: DRAFT
- Result: BLOCKED
- Evidence:
  fetchVportPublicDetailsByActorId applies hard query filters: .eq("is_deleted", false) AND
  .eq("is_active", true). Any deleted or inactive VPORT returns null from the DAL.
  mapVportPublicDetailsModel(null) → returns null.
  VportProfileViewScreen: if (publicDetails === null) → renders UnavailableProfileGate.
  No profile name, bio, rates, or any data is returned for deleted/inactive VPORTs.
  The lifecycle gate is enforced at the DB query layer — not the UI layer — making it
  resilient to UI state manipulation.
- Defense Gate: PRESENT — query-layer lifecycle filter confirmed effective for deleted/inactive VPORTs
- Blast Radius: N/A (blocked)
- Severity: N/A (BLOCKED)
- VENOM Finding Cross-Reference: VEN-EXCH-003 (VENOM LOW — target void state not checked in
  assertActorOwnsVportActorController). That finding affects WRITE paths. This BLACKWIDOW scenario
  tests the READ path — BW VERIFIES read path is correctly lifecycle-gated. VEN-EXCH-003 remains
  open for write path (void VPORT rate upsert still possible per VENOM).
- Recommended Fix: None for read path. VEN-EXCH-003 write path fix (assertActorOwnsVportActorController
  void check) remains outstanding — see VENOM report.
- Layer to Fix: N/A (read path blocked). Write path: see CARNAGE/Wolverine for VEN-EXCH-003.
- Required Follow-up Command: None for this finding.
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-EXPROFILE-004
- Scenario: Scenario 4 — URL Surface (raw UUID in exchange profile URLs)
- Target: React Router profile route / VportProfileViewScreen.jsx URL parameter pattern
- Application Scope: VCSM
- Platform Surface: PWA — Public exchange VPORT profile URL (e.g. /profile/<actorId-uuid>)
- Attack Vector: Observe public exchange VPORT profile URL to extract raw actorId UUID for
  enumeration of other VPORTs on the platform
- Exploit Chain Type: Information disclosure via URL surface
- Governance Status: DRAFT
- Result: PARTIAL — raw actorId UUID in profile URLs is a platform-wide existing pattern
- Evidence:
  VportProfileViewScreen.jsx uses useParams() actorId directly as the actorId for data fetch.
  fetchVportPublicDetailsByActorId: .eq("actor_id", actorId) — UUID required.
  vport.profiles.slug is stored and mapped but NOT used as the URL routing parameter.
  Exchange VPORT profile URLs expose the actor UUID in the URL path.
  This is consistent across all VPORT types — not specific to exchange VPORTs.
  Enumeration risk: attacker can observe actorId from URL and attempt API calls against it.
  Impact: actorId is already intentionally public (it is the canonical public identity) — the
  actual risk is the UUID format rather than slug, which makes URLs less human-friendly and
  harder to reason about, but does not expose non-public data.
- Defense Gate: ABSENT (no slug-based routing for VPORT profiles). Data behind the actorId
  is correctly access-controlled — actorId enumeration does not grant additional access.
- Blast Radius: Information disclosure (UUID enumerable from URL). No data access beyond
  what is publicly available via profile slug.
- Severity: LOW — matches platform-wide UUID URL concern (MEMORY: "No raw IDs in public URLs").
  The exchange profile shares this with all VPORT types. Not an exchange-specific new finding.
- VENOM Finding Cross-Reference: None directly. Relates to platform-level slug routing work.
  The exchange VPORT profile does not aggravate this concern beyond existing platform behavior.
- Recommended Fix: Implement slug-based routing for VPORT public profiles platform-wide.
  Exchange VPORT profile URL: /profile/<vport-slug> rather than /profile/<actorId-uuid>.
  `vport.profiles.slug` is already populated — the routing layer needs to use it.
  This is a platform-wide fix, not exchange-specific.
- Layer to Fix: ROUTING (React Router route definition) + DAL (lookup by slug instead of actorId)
- Required Follow-up Command: LOGAN (document slug routing gap), Wolverine (platform slug routing ticket)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-EXPROFILE-005
- Scenario: Scenario 5 — Stale exchange rate publish replay by non-owner
- Target: publishExchangeRateUpdateAsPost.controller.js + hasRecentExchangeRatePostDAL
- Application Scope: VCSM
- Platform Surface: PWA — Feed engine / vc.posts
- Attack Vector A: Non-owner replays a captured publish call with attacker's identityActorId
  and victim's actorId.
- Attack Vector B: Owner floods own feed via hasRecentExchangeRatePostDAL windowMs: 0 bypass.
- Exploit Chain Type: A — Identity substitution post-hardening. B — App-layer rate limit bypass.
- Governance Status: DRAFT
- Result: BLOCKED (Attack A — non-owner replay). PARTIAL (Attack B — owner self-flood).
- Evidence:
  Attack A: assertActorOwnsVportActorController blocks any caller whose identityActorId does not
  own the targetActorId via actor_owners. Post-hardening fix confirmed: ELEK-001 closed.
  Even if an attacker intercepts and replays a network call, their JWT's auth.uid() will not
  match the victim's actor_owners row. vc.posts RLS also blocks at DB layer.
  Attack B: hasRecentExchangeRatePostDAL exports windowMs as a parameter default.
  Passing windowMs: 0 collapses the dedup window to 0ms — effectively disabling throttle
  for a direct DAL call. However: (1) direct DAL call requires module access in the bundle,
  (2) RLS on vc.posts does not restrict post volume — only actor ownership, (3) ownership
  is verified before dedup, so only a legitimate owner can flood their own feed.
  VEN-EXCH-004 remains open: the dedup is app-only and caller-overridable.
- Defense Gate: PRESENT for non-owner (assertActorOwnsVportActorController + vc.posts RLS).
  WEAK for owner self-flood (dedup is app-layer-only, windowMs caller-overridable).
- Blast Radius: Attack A: N/A (blocked). Attack B: Feed noise from one VPORT (owner self-harm).
- Severity: LOW (Attack A blocked; Attack B is self-harm by legitimate owner — VEN-EXCH-004).
- VENOM Finding Cross-Reference: VEN-EXCH-004 (MEDIUM in VENOM). BW confirms the dedup bypass
  vector exists at DAL export level. The primary attack (non-owner replay) is fully blocked.
  The residual risk is owner self-flood — low business impact, medium spam concern.
- Recommended Fix: Make windowMs internal to hasRecentExchangeRatePostDAL (remove from exported
  signature or enforce minimum floor). Add DB-level rate limit (partial index or trigger on
  vc.posts per actor_id + post_type + time window). See VEN-EXCH-004 for full recommendation.
- Layer to Fix: DAL (hasRecentExchangeRatePostDAL — remove windowMs from export) + DB (Carnage)
- Required Follow-up Command: CARNAGE (DB-level rate limit), Wolverine (DAL windowMs hardening)
```

---

## MODULE 2 — EXCHANGE-PROFILE: DEFENSE SUMMARY

| Attack Scenario | Result | App-Layer Gate | DB-Layer Gate | Severity |
|---|---|---|---|---|
| Non-owner mutation via public profile | BLOCKED | PRESENT (read-only architecture) | N/A | N/A |
| Internal data in public profile response | PARTIAL | PRESENT (rendered clean) | N/A | LOW |
| Deleted/inactive VPORT profile resolution | BLOCKED | PRESENT (query-layer lifecycle filter) | N/A | N/A |
| Raw UUID in exchange profile URL | PARTIAL | ABSENT (no slug routing) | N/A | LOW |
| Non-owner publish replay | BLOCKED | PRESENT (assertActorOwnsVportActorController) | PRESENT (RLS) | N/A |
| Owner dedup bypass (self-flood) | PARTIAL | WEAK (windowMs caller-overridable) | ABSENT | LOW |

---

---

## CONSOLIDATED ADVERSARIAL FINDINGS BY SEVERITY

| Finding ID | Module | Severity | Result | Status | Release Blocker |
|---|---|---|---|---|---|
| BW-PORT-004 | portfolio | CRITICAL | BYPASSED | NEW — false remediation of PORT-V-004 | YES |
| BW-PORT-003 | portfolio | MEDIUM | PARTIAL | PORT-V-013 confirmed active; media role:public gap added | NO |
| BW-EXPROFILE-002 | exchange-profile | LOW | PARTIAL | VE-2705-03 confirmed active in public profile context | NO |
| BW-EXPROFILE-004 | exchange-profile | LOW | PARTIAL | Platform-wide UUID URL concern | NO |
| BW-EXPROFILE-005 | exchange-profile | LOW | PARTIAL (Attack B) | VEN-EXCH-004 confirmed — owner self-flood via windowMs | NO |
| BW-PORT-001 | portfolio | N/A | BLOCKED | PORT-V-001 fix confirmed effective | N/A |
| BW-PORT-002 | portfolio | N/A | BLOCKED | Engine DI gate cross-feature bypass confirmed blocked | N/A |
| BW-PORT-005 | portfolio | N/A | BLOCKED | No UUID in portfolio item URLs | N/A |
| BW-PORT-006 | portfolio | N/A | BLOCKED | RLS on all portfolio tables confirmed effective | N/A |
| BW-EXPROFILE-001 | exchange-profile | N/A | BLOCKED | Read-only public profile — no mutation surface | N/A |
| BW-EXPROFILE-003 | exchange-profile | N/A | BLOCKED | Deleted/inactive VPORT lifecycle gate confirmed | N/A |

---

## CRITICAL FINDING SPOTLIGHT — BW-PORT-004

**This finding represents a false remediation of PORT-V-004.**

The VENOM report classified PORT-V-004 as HIGH/Release Blocker because `ctrlSavePortfolioDetail`
had no actorId parameter and no ownership check. The "fix" added actorId as a parameter and
added a profile_id cross-check. BLACKWIDOW adversarial simulation reveals the fix is architecturally
broken: both sides of the cross-check derive from the caller-supplied actorId. The check proves
item-to-actor coherence, not session-to-actor ownership. The check passes for any attacker who
knows the victim's actorId and any of their portfolio item IDs.

**The correct fix** is to verify session ownership via `assertActorOwnsVportActorController`
before resolving any profileId from the caller-supplied actorId. The canonical pattern is already
implemented in `upsertVportRateController` and `publishExchangeRateUpdateAsPostController`.
`ctrlSavePortfolioDetail` must mirror it.

**RLS is the sole blocking gate.** The application layer provides zero protection for this path.

---

## REMEDIATION PRIORITY ORDER

```
P0 (Release Blocker):
  BW-PORT-004: Fix ctrlSavePortfolioDetail ownership check — replace profile_id self-referential
               cross-check with assertActorOwnsVportActorController call before any DB operation.
               ELEKTRA patch advisory required. SPIDER-MAN regression required.

P2 (Hardening):
  BW-PORT-003: Add visibility='public' filter to dalListPortfolioItemsByProfileId for non-owner
               callers. Add ownerMode param. Document portfolio_media RLS role:public intention.
  BW-EXPROFILE-002: Remove profile_id from RATES_SELECT. Apply model at controller boundary.
  BW-EXPROFILE-004: Implement slug-based routing for VPORT public profiles. (Platform-wide — P3 if
               exchange is deprioritized.)
  BW-EXPROFILE-005: Make windowMs internal in hasRecentExchangeRatePostDAL. Add DB rate limit via
               CARNAGE.

P3 (Governance):
  Verify portfolio_media RLS SELECT policy intent (role:public) — if unintentional, add auth gate.
  Add portfolio item visibility awareness to public-facing list controllers.
```

---

## THOR RELEASE GATE VERDICT — PORTFOLIO MODULE

**RELEASE BLOCK MAINTAINED.**

- BW-PORT-004 (CRITICAL): false remediation of PORT-V-004 confirmed by adversarial simulation.
  `ctrlSavePortfolioDetail` is fully bypassed at app layer — RLS is sole gate. Must be fixed.
- PORT-V-001 fix: CONFIRMED EFFECTIVE (BW-PORT-001 blocked).
- PORT-V-002 (manageTags fix): CONFIRMED EFFECTIVE (trace shows correct profile_id pattern).
- PORT-V-003 (removeMedia fix): CONFIRMED EFFECTIVE (media + profileId parallel fetch present).
- PORT-V-NEW-RPC-001 (broken SECURITY DEFINER RPCs): NOT re-tested in this session — remains
  open from VENOM. CARNAGE delegation still required.

**THOR RELEASE GATE VERDICT — EXCHANGE-PROFILE MODULE**

**CONDITIONAL PASS (for public profile page only).**

No CRITICAL or HIGH findings on the exchange-profile PUBLIC PAGE. The public profile page is
read-only and correctly lifecycle-gated. Findings (BW-EXPROFILE-002, BW-EXPROFILE-004,
BW-EXPROFILE-005) are LOW severity and non-blocking for the public profile surface.

Note: The exchange rate DASHBOARD is separately COMPLETE in the governance matrix. This module
review covers only the public profile page — no dashboard mutations were in scope.

---

## CISSP DOMAIN COVERAGE

| CISSP Domain | Portfolio Findings | Exchange-Profile Findings | Notes |
|---|---|---|---|
| Identity and Access Management | BW-PORT-001, BW-PORT-004 | BW-EXPROFILE-001, BW-EXPROFILE-005 | Root of BW-PORT-004 CRITICAL |
| Asset Security | BW-PORT-003, BW-PORT-005 | BW-EXPROFILE-002, BW-EXPROFILE-004 | Data exposure (UUID, visibility, profile_id) |
| Security Architecture and Engineering | BW-PORT-002, BW-PORT-004 | BW-EXPROFILE-001 | Defense-in-depth architecture gaps |
| Software Development Security | BW-PORT-004 | BW-EXPROFILE-005 | False remediation pattern; dedup bypass |
| Security Assessment and Testing | BW-PORT-006 | BW-EXPROFILE-003 | RLS/lifecycle verification |
| Security Operations | BW-PORT-003 | BW-EXPROFILE-005 | Media public read; owner self-flood |
| Communication and Network Security | BW-PORT-005 | BW-EXPROFILE-004 | URL surface (in-scope) |
| Security and Risk Management | BW-PORT-004 | BW-EXPROFILE-004 | Risk acceptance decisions for UUID URLs |

---

*BLACKWIDOW is adversarial simulation only. No code was modified. No production calls were made.*
*All findings are adversarial classifications — remediation is the responsibility of ELEKTRA (patch) and SPIDER-MAN (regression).*
*Scope: VCSM. No cross-root access occurred.*
