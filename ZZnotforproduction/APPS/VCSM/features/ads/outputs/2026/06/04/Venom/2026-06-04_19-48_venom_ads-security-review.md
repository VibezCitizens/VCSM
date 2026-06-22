# VENOM V2 SECURITY REVIEW
## Feature: ads

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | APPS/VCSM/features/ads |
| Feature | ads |
| Command | VENOM |
| Ticket | TICKET-VENOM-ADS-0001 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/ads/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_ads-security-review.md |
| Timestamp | 2026-06-04T19:48:00 |

---

## 1. VENOM Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                  | Generated At                  | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Surfaces In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Primary attack surface inventory |
| rpc-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | RPC surface inventory |
| edge-function-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Edge function surface inventory |
| security-path-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Security path inventory |
| route-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Route->write chain resolution |
| write-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Write surface caller chain resolution |
| rpc-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | RPC caller chain resolution |
| edge-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Edge caller chain resolution |

Scanner Version: 1.1.0
Overall Preflight: FRESH / PASS
Total surfaces in scope: 0 write + 0 rpc + 0 edge
Total security paths in scope: 0
HIGH confidence paths (resolved): 0
LOW confidence paths (unresolved): 0

**Scanner Note:** The ads feature has zero write/RPC surfaces in the scanner maps. This is consistent with source inspection — all persistence is localStorage-only (no Supabase writes, no RPCs, no edge functions). Source inspection was performed directly on all source files to surface architectural, identity, and trust boundary risks invisible to the database-focused scanner.

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: ads
Scan Date: 2026-06-04T19:48:25.152Z

Write Surfaces: 0 (scanner)
  Note: All writes are localStorage — not tracked by scanner (which targets Supabase mutations)
  Actual localStorage writes (source-verified):
    - window.localStorage.setItem(ADS_STORAGE_KEY, ...) in ad.storage.dal.js:30
    - window.localStorage.getItem(ADS_STORAGE_KEY) in ad.storage.dal.js:25

RPC Calls: 0
Edge Functions: 0
Security Paths: 0 (scanner)

Source-Identified Risk Surfaces:
  1. Route /ads/vport/:actorId — no OwnerOnlyDashboardGuard wrapping
  2. VportAdsSettingsScreen — actorId from URL param, no session cross-check
  3. ad.storage.dal.js — localStorage keyed to single ADS_STORAGE_KEY with no actorId namespace
  4. adPipeline.usecase.js deleteAdUseCase — accepts raw id, no ownership verification
  5. ads.feature.js — exports usecases (DAL-adjacent) through public feature barrel

Execution Paths Resolved: 5 / 5 (source verified)
```

---

## 4. Scanner Signals

| Signal | Source Map | Map Entry | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|---|
| Zero write surfaces (ads) | write-surface-map | counts.writes = 0 | HIGH | YES — all writes are localStorage, not Supabase; confirmed in ad.storage.dal.js:25-31 | [SOURCE_VERIFIED] | Architecture note |
| Route /ads/vport/:actorId without OwnerOnlyDashboardGuard | route-execution-map | 0 entries for ads | HIGH | YES — app.routes.jsx line 154-160: ads route NOT inside OwnerOnlyDashboardGuard block | [SOURCE_VERIFIED] | VEN-ADS-001 |
| actorId from URL param trusted directly | write-execution-map | 0 entries | HIGH | YES — VportAdsSettingsScreen.jsx line 17-19: actorIdParam used without identity cross-check | [SOURCE_VERIFIED] | VEN-ADS-002 |
| localStorage key not namespaced per actor | write-execution-map | 0 entries | HIGH | YES — ad.storage.dal.js line 25-30: ADS_STORAGE_KEY = "vc.ads.pipeline.v1" global, no per-actor key | [SOURCE_VERIFIED] | VEN-ADS-003 |
| deleteAdUseCase accepts bare id | write-execution-map | 0 entries | HIGH | YES — adPipeline.usecase.js line 50-52: deleteAdUseCase(id) passes id directly to removeAd without ownership check | [SOURCE_VERIFIED] | VEN-ADS-004 |
| ads.feature.js exports usecases | route-execution-map | 0 entries | HIGH | YES — ads.feature.js line 3: export * from usecases | [SOURCE_VERIFIED] | VEN-ADS-005 |
| BEHAVIOR.md is placeholder — no §5 or §9 | behavior contract | BEHAVIOR.md | N/A | YES — BEHAVIOR.md: Status: PLACEHOLDER, no §5 or §9 sections | [SOURCE_VERIFIED] | VEN-ADS-006 |

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/ads/BEHAVIOR.md
BEHAVIOR.md exists: YES
BEHAVIOR.md status: PLACEHOLDER
§5 Security Rules declared: 0
§5 Rules verified in source: 0 / 0
§5 Rules unenforced: NONE DECLARED
§9 Must Never Happen declared: 0
§9 Invariants protected in source: 0 / 0
§9 Invariants unprotected: NONE DECLARED
```

**Note:** BEHAVIOR.md exists but is a PLACEHOLDER with no content in §5 Security Rules or §9 Must Never Happen. Security posture cannot be fully anchored to declared invariants. All findings in this report are UNANCHORED — derived from source evidence only. WOLVERINE intake is required to complete the behavior contract.

---

## 6. Trust Boundary Findings

---

### VEN-ADS-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-ADS-001
- Location: apps/VCSM/src/app/routes/protected/app.routes.jsx:154-160
- Application Scope: VCSM
- Platform Surface: PWA / Router
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Authenticated Citizen -> Authenticated VPORT Owner
- Contract Violated: Actor Ownership Contract
- Current behavior: Route /ads/vport/:actorId is defined directly in the flat protected route list
  at app.routes.jsx:154-160. It is NOT nested inside the OwnerOnlyDashboardGuard block (lines
  199-222). Any authenticated Citizen who knows another actor's actorId can navigate to
  /ads/vport/<target-actorId> and reach that actor's ad pipeline settings screen without any
  ownership check.
- Risk: Any authenticated Citizen can load and operate the ad pipeline settings UI for any
  VPORT actor. Because all persistence is localStorage (not Supabase), they would be operating
  on their own local data but within the context of another actor's screen — enabling confusion,
  spoofed ad creation under another actor's identity, and a structural ownership violation.
  If this feature transitions to Supabase persistence (planned), this gap becomes a direct
  unauthorized write path.
- Severity: HIGH
- Exploitability: HIGH
- Attack Preconditions:
  - Authenticated Citizen account required
  - Target actorId known (public from profile URLs)
  - No owner/admin verification exists at route level
  - Exploit repeatable against any VPORT actor
- Blast Radius: All VPORT actors; every actor's ad pipeline URL is reachable by any Citizen
- Identity Leak Type: Ownership inference — actor's ad pipeline accessible without owning that actor
- Cache Trust Type: None (localStorage, not cache layer)
- RLS Dependency: NONE — no Supabase surface; but route ownership gap will become REQUIRED
  when persistence migrates to Supabase
- Why it matters: This is a structural ownership enforcement failure. Other dashboard routes
  (/actor/:actorId/dashboard, /actor/:actorId/settings, etc.) are gated by OwnerOnlyDashboardGuard.
  The ads route is the only owner-scoped dashboard route that omits this guard. If ads migrates
  to server persistence, this becomes a CRITICAL unauthorized write path.
- Recommended mitigation: Nest /ads/vport/:actorId inside the existing OwnerOnlyDashboardGuard +
  BlockedVportGuard block alongside other dashboard routes, or create a dedicated guard for this route.
  Example:
    { element: <OwnerOnlyDashboardGuard />, children: [
        { path: "/ads/vport/:actorId", element: <VportAdsSettingsScreen /> }
    ]}
- Rationale: Defense-in-depth requires route-layer ownership enforcement even when server-side
  persistence does not yet exist. This is consistent with every other actor-scoped dashboard route.
- Follow-up command: SPIDER-MAN (add regression test that non-owner Citizen cannot access
  /ads/vport/:otherActorId), THOR (release blocker check before ads Supabase migration)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering, Software Development Security
```

---

### VEN-ADS-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-ADS-002
- Location: apps/VCSM/src/features/ads/screens/VportAdsSettingsScreen.jsx:17-19
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Authenticated Citizen -> Authenticated VPORT Owner
- Contract Violated: Actor Ownership Contract; Public Identity Surface Contract
- Current behavior: actorId is resolved at line 17-19:
    const { actorId: actorIdParam } = useParams();
    const { identity } = useIdentity();
    const actorId = actorIdParam || identity?.actorId || null;
  The screen accepts actorId from the URL parameter with no cross-check against the
  authenticated session identity. Any authenticated user who navigates to
  /ads/vport/<any-actorId> will operate the ads screen under that foreign actorId.
  There is no assertion that actorIdParam === identity.actorId before proceeding.
- Risk: actorId from URL is trusted as the authority for all ad operations within the screen.
  This means any authenticated Citizen can create, modify, delete, publish, or archive ads
  attributed to a foreign actor — within localStorage — with no session ownership gate.
  The fallback to identity.actorId only activates when actorIdParam is absent, not when
  actorIdParam differs from the session identity.
- Severity: HIGH
- Exploitability: HIGH
- Attack Preconditions:
  - Authenticated Citizen account required
  - Target actorId known (inferrable from public URLs)
  - No session identity cross-check in screen or hook
- Blast Radius: All VPORT actors (their localStorage ad data); escalates to all Supabase
  ad records if persistence migrates without this fix
- Identity Leak Type: Ownership inference; actor correlation via URL
- Cache Trust Type: None
- RLS Dependency: NONE currently; REQUIRED when Supabase persistence is introduced
- Why it matters: VCSM's identity model requires actorId to be session-derived, not
  URL-provided without verification. This pattern — actorIdParam used directly without
  session cross-check — directly violates the Actor Ownership Contract. This is the
  same class of vulnerability that the OwnerOnlyDashboardGuard was designed to prevent
  at the route layer. Even with localStorage persistence, a session cross-check in the
  screen is a required defense-in-depth layer.
- Recommended mitigation: After resolving actorIdParam, assert ownership:
    if (actorIdParam && identity?.actorId && actorIdParam !== identity.actorId) {
      return <Navigate to="/feed" replace />;
    }
  This check should be placed at the top of VportAdsSettingsScreen before any hooks
  that accept actorId. Alternatively, delegate this check to a dedicated OwnerOnlyGuard
  component at the route layer (see VEN-ADS-001).
- Rationale: URL params are untrusted client input. actorId must be verified against
  the session identity before use in any ownership-scoped operation.
- Follow-up command: SPIDER-MAN (regression test: cross-actor actorId param rejected),
  ELEKTRA (source-to-sink chain verification)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security, Security Architecture and Engineering
```

---

### VEN-ADS-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-ADS-003
- Location: apps/VCSM/src/features/ads/dal/ad.storage.dal.js:1,25-31
           apps/VCSM/src/features/ads/constants.js:1
- Application Scope: VCSM
- Platform Surface: PWA / Client Storage
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Authenticated Citizen (Actor A) -> Authenticated Citizen (Actor B)
- Contract Violated: Actor Ownership Contract
- Current behavior: All ad data for all actors is stored under a single global localStorage key:
    ADS_STORAGE_KEY = "vc.ads.pipeline.v1"
  The readAll() and writeAll() functions at dal lines 23-31 operate on this global key
  with no per-actor namespacing. Data is only segregated at query-time via the actorId
  filter in listAdsByActor (line 38-41). The key itself is shared across all actors
  on the same browser session.
- Risk: In a multi-identity browser session (which VCSM explicitly supports — actors can be
  switched), all ad drafts, published ads, and archived ads for all actor identities share
  the same localStorage bucket. Any code path that calls readAll() without strict actorId
  filtering can read across actor boundaries. Additionally, a corrupted or tampered
  localStorage entry can pollute all actors' ad data simultaneously. deleteAdUseCase deletes
  by id with no actorId filter, meaning a draft from Actor A could be deleted while
  operating as Actor B if IDs collide or are guessable.
- Severity: MEDIUM
- Exploitability: MEDIUM
- Attack Preconditions:
  - Multi-actor session (VCSM supports identity switching)
  - Access to the same browser session (shared device scenario)
  - No Supabase backend — exploit is entirely client-side
- Blast Radius: All ads for all actors in the same browser session; cross-actor data leakage
  within a shared device
- Identity Leak Type: Actor correlation; ownership inference
- Cache Trust Type: None (localStorage, not cache layer, but same isolation concern)
- RLS Dependency: NONE
- Why it matters: VCSM's actor switching model requires that data for each actor identity
  remain isolated. A global localStorage key with no actorId namespace is a shared-device
  vulnerability and an architectural time bomb. When a second actor is loaded on the same
  device, their ad pipeline data co-mingles in the same bucket. This is the same class
  of isolation failure that RLS provides at the database layer — here it must be enforced
  at the client storage layer.
- Recommended mitigation: Namespace the localStorage key per actorId:
    const storageKey = (actorId) => `vc.ads.pipeline.v1:${actorId}`;
  Update readAll/writeAll to accept actorId and use the namespaced key.
  This eliminates cross-actor storage sharing entirely.
- Rationale: Actor isolation is a core VCSM invariant. Client storage must enforce
  the same isolation boundaries as the server layer.
- Follow-up command: SPIDER-MAN (test: Actor A ads not visible when switched to Actor B),
  ELEKTRA (verify no other features use similar global localStorage keys)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Identity and Access Management, Security Architecture and Engineering
```

---

### VEN-ADS-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-ADS-004
- Location: apps/VCSM/src/features/ads/usecases/adPipeline.usecase.js:50-52
           apps/VCSM/src/features/ads/api/ad.api.js:11-13
           apps/VCSM/src/features/ads/dal/ad.storage.dal.js:61-65
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Authenticated Citizen -> VPORT Owner (ownership not verified before delete)
- Contract Violated: Actor Ownership Contract
- Current behavior: deleteAdUseCase(id) at usecase line 50-52:
    export async function deleteAdUseCase(id) {
      return deleteAd(id);
    }
  This chains to deleteAd(id) -> removeAd({ id }) -> filters by id in localStorage.
  No caller verification: the use case does not check that the caller owns the ad being deleted.
  No actorId parameter is passed to the delete chain. Any code path calling
  deleteAdUseCase with any id will delete that ad without ownership pre-check.
  The useVportAds hook at line 86-89 passes the ad's id directly from UI to deleteAdUseCase
  with no ownership assertion at the hook layer either.
- Risk: Any caller can delete any ad by id with no ownership verification at any layer
  (usecase, api, or DAL). In the current localStorage model, the blast radius is limited
  to the local browser session. However, this pattern will become a server-side
  unauthorized delete vulnerability when ads migrates to Supabase persistence — an explicit
  future intent flagged in the screen ("Pricing and payout controls will be enabled later").
- Severity: MEDIUM
- Exploitability: MEDIUM
- Attack Preconditions:
  - Ad id must be known (guessable from UUID or predictable from ad_${Date.now()} fallback)
  - Currently limited to same browser session (localStorage)
  - Escalates to HIGH / CRITICAL on Supabase migration
- Blast Radius: Any ad in localStorage (current); any ad in DB (future, if pattern is preserved)
- Identity Leak Type: None directly; ownership bypass
- Cache Trust Type: None
- RLS Dependency: NONE currently; REQUIRED when Supabase persistence is introduced
- Why it matters: The ownership check gap at the use case layer is an architectural smell
  that will become exploitable when persistence moves server-side. The correct pattern in
  VCSM is ownership verification before any mutating operation. Establishing this pattern
  now prevents a high-severity vulnerability from shipping with the Supabase migration.
- Recommended mitigation: Add actorId ownership check in deleteAdUseCase:
    export async function deleteAdUseCase(id, actorId) {
      const ad = await fetchAdById(id, actorId);
      if (!ad || ad.actorId !== actorId) throw new Error('Not authorized');
      return deleteAd(id);
    }
  Alternatively, pass actorId through the entire chain and enforce in the DAL:
    export async function removeAd({ id, actorId }) {
      const all = readAll().map(normalizeStoredAd).filter(Boolean);
      const target = all.find((item) => item.id === id);
      if (!target || target.actorId !== actorId) throw new Error('Not authorized');
      ...
    }
- Rationale: Ownership must be verified before mutation at the use case or DAL layer,
  not only inferred from UI context. This is consistent with VCSM's Actor Ownership Contract.
- Follow-up command: SPIDER-MAN (test: deleteAdUseCase rejects non-owner actorId),
  THOR (gate Supabase migration on this fix)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Identity and Access Management, Security Architecture and Engineering
```

---

### VEN-ADS-005

```
VENOM SECURITY FINDING
- Finding ID: VEN-ADS-005
- Location: apps/VCSM/src/features/ads/ads.feature.js:3
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Engine Caller / Feature Consumer
- Boundary Violated: Adapter Boundary Contract
- Contract Violated: Boundary Isolation Contract (adapter boundary rule)
- Current behavior: ads.feature.js line 3 exports directly from the usecases layer:
    export * from "@/features/ads/usecases/adPipeline.usecase";
  This makes all usecase functions (listAdsUseCase, createDraftUseCase, saveDraftUseCase,
  publishAdUseCase, pauseAdUseCase, archiveAdUseCase, deleteAdUseCase) available to any
  feature importing from @/features/ads. Per VCSM architecture contract, feature barrel
  exports must only expose: hooks, components, view screens through adapters.
  DAL-adjacent functions (usecases that directly wrap dal/api calls) must not be in the
  public barrel.
- Risk: External feature consumers can bypass the hook layer and call use case functions
  directly, including deleteAdUseCase, without any ownership enforcement layer. This
  creates an ungated use case surface callable from any feature in the VCSM app.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions:
  - Feature must be imported by an attacker-controlled component
  - Internal developer (supply-chain or insider) abuse vector
  - No direct external exploit path
- Blast Radius: Any feature consuming the ads barrel export; architectural boundary erosion
- Identity Leak Type: None directly
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The adapter boundary rule exists to prevent DAL-adjacent logic from being
  callable outside the feature's own hook layer. Exporting usecases through the barrel
  creates an unguarded shortcut that bypasses the ownership-check gap in deleteAdUseCase
  and any future ownership enforcement added at the hook layer.
- Recommended mitigation: Remove the usecase export from ads.feature.js:
    // Remove: export * from "@/features/ads/usecases/adPipeline.usecase";
  The barrel should only export what is in the adapters/ directory:
    export * from "@/features/ads/adapters/hooks/useVportAds.adapter";
    export * from "@/features/ads/adapters/widgets/OnemoredaysAd.adapter";
    export { VportAdsSettingsScreen } from "@/features/ads/screens/adsScreens";
- Rationale: Aligns with VCSM architecture contract: adapters expose only hooks, components,
  view screens. Usecases and DAL functions are internal to the feature.
- Follow-up command: SPIDER-MAN (verify no external consumers import usecases directly),
  ELEKTRA (scan for cross-feature usecase import paths)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering
```

---

### VEN-ADS-006

```
VENOM SECURITY FINDING
- Finding ID: VEN-ADS-006
- Location: ZZnotforproduction/APPS/VCSM/features/ads/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Documentation / Governance
- Trust Boundary: N/A (governance finding)
- Boundary Violated: Behavior Contract Governance
- Contract Violated: Behavior Contract (TICKET-BEHAV-VENOM-001)
- Current behavior: BEHAVIOR.md exists but contains only:
    Status: PLACEHOLDER
    Notes: Behavior contract pending source review.
  No §5 Security Rules declared. No §9 Must Never Happen invariants declared.
  VENOM cannot anchor any security finding to declared invariants.
  All 5 source-verified findings in this report are UNANCHORED.
- Risk: Without declared §5 Security Rules, ownership requirements and rejection conditions
  are not formally specified. Without §9 Must Never Happen invariants, SPIDER-MAN has no
  mandatory test targets. Security posture is dependent solely on VENOM inference from source
  code, which is less reliable than contract-anchored enforcement.
- Severity: LOW
- Exploitability: LOW (governance gap, not a direct exploit path)
- Attack Preconditions: N/A
- Blast Radius: Governance — all findings for this feature are UNANCHORED
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The BEHAVIOR.md contract is the authoritative source of security invariants
  for this feature. SPIDER-MAN tests are generated from §9. VENOM anchors findings to §5.
  A placeholder contract leaves the feature without formal security ownership requirements.
- Recommended mitigation: Complete BEHAVIOR.md with at minimum:
  §5 Security Rules:
    BEH-ADS-SEC-001: Only the owning actor (verified by session identity) may create, modify,
      delete, or publish ads attributed to their actorId.
    BEH-ADS-SEC-002: actorId must be derived from session identity, never trusted from URL param
      without cross-check.
    BEH-ADS-SEC-003: Ad pipeline screen must reject requests where actorIdParam differs from
      session identity.actorId.
  §9 Must Never Happen:
    BEH-ADS-INV-001: An actor must never be able to delete, publish, pause, or archive an ad
      they do not own.
    BEH-ADS-INV-002: An ad created for Actor A must never be visible or accessible when the
      active session is Actor B.
- Rationale: Formal contract declaration enables SPIDER-MAN regression coverage and THOR
  gating. Without it, the feature cannot achieve THOR-eligible security posture.
- Follow-up command: Wolverine (BEHAVIOR.md intake), SPIDER-MAN (pending contract completion)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Security Assessment and Testing
```

---

## 7. Source Verification Summary

Total surfaces in scope: 5 (source-identified; 0 from scanner — localStorage only feature)
Surfaces source-verified: 5 / 5
Source files read:
- apps/VCSM/src/features/ads/dal/ad.storage.dal.js
- apps/VCSM/src/features/ads/hooks/useVportAds.js
- apps/VCSM/src/features/ads/api/ad.api.js
- apps/VCSM/src/features/ads/usecases/adPipeline.usecase.js
- apps/VCSM/src/features/ads/screens/VportAdsSettingsScreen.jsx
- apps/VCSM/src/features/ads/constants.js
- apps/VCSM/src/features/ads/ads.feature.js
- apps/VCSM/src/features/ads/screens/adsScreens.js
- apps/VCSM/src/features/ads/lib/ad.validation.js
- apps/VCSM/src/features/ads/model/ad.model.js
- apps/VCSM/src/features/ads/model/vportAdsSettingsShell.model.js
- apps/VCSM/src/features/ads/adapters/hooks/useVportAds.adapter.js
- apps/VCSM/src/features/ads/adapters/widgets/OnemoredaysAd.adapter.js
- apps/VCSM/src/features/ads/widgets/OnemoredaysAd.jsx
- apps/VCSM/src/features/ads/hooks/useDesktopBreakpoint.js
- apps/VCSM/src/app/routes/protected/app.routes.jsx (lines 1-270)
- apps/VCSM/src/app/routes/protected/appRoutes.redirects.jsx (lines 55-70)
- ZZnotforproduction/APPS/VCSM/features/ads/BEHAVIOR.md

CRITICAL findings: 0 — all [SOURCE_VERIFIED]: N/A (no CRITICAL findings emitted)

---

## 8. Confidence Summary

HIGH confidence surfaces: 5 (all source-verified)
LOW confidence surfaces: 0
[SOURCE_VERIFIED] findings: 6 / 6
[SCANNER_LEAD] findings: 0
[SCANNER_LOW_CONF] findings: 0

All findings were derived from direct source file inspection. Scanner maps returned zero surfaces for this feature, which is correct — the ads feature has no Supabase writes, RPCs, or edge functions at this time. Source inspection was the primary review method.

---

## 9. THOR Impact

THOR Release Blockers: NONE — current findings are HIGH/MEDIUM/LOW
Highest Open Severity: HIGH (VEN-ADS-001, VEN-ADS-002)

THOR Pre-Migration Gate Required:
Before any Supabase persistence migration for the ads feature:
- VEN-ADS-001 (missing OwnerOnlyDashboardGuard) MUST be resolved — becomes CRITICAL at migration
- VEN-ADS-002 (actorId URL param not session-cross-checked) MUST be resolved — becomes CRITICAL at migration
- VEN-ADS-004 (deleteAdUseCase no ownership check) MUST be resolved — becomes CRITICAL at migration

---

## 10. Required Follow-Up Commands

| Command | Reason | Priority |
|---|---|---|
| SPIDER-MAN | Write regression tests for: non-owner Citizen blocked from /ads/vport/:otherId; cross-actor actorId param rejected in screen; Actor A ads not visible as Actor B; deleteAdUseCase rejects non-owner | HIGH |
| ELEKTRA | Source-to-sink chain verification for VEN-ADS-002 (actorId trust chain) and VEN-ADS-005 (barrel export reach analysis) | MEDIUM |
| Wolverine | BEHAVIOR.md intake — complete §5 Security Rules and §9 Must Never Happen before ads Supabase migration | HIGH |
| THOR | Register pre-migration gate: VEN-ADS-001, VEN-ADS-002, VEN-ADS-004 must be resolved before ads Supabase write surfaces ship | HIGH |
| DB | When ads migrates to Supabase: verify RLS policies enforce actor ownership on ads table; no bypass via service role in client paths | FUTURE |

---

## 11. Mitigation Plan

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-ADS-001 | Missing OwnerOnlyDashboardGuard on /ads/vport/:actorId | Router | P1 (before Supabase migration) | App | SPIDER-MAN |
| VEN-ADS-002 | actorId from URL param trusted without session cross-check | Controller (Screen) | P1 (before Supabase migration) | App | SPIDER-MAN, ELEKTRA |
| VEN-ADS-003 | localStorage key not namespaced per actorId | DAL | P2 | App | SPIDER-MAN |
| VEN-ADS-004 | deleteAdUseCase no ownership pre-check | Use Case / DAL | P1 (before Supabase migration) | App | SPIDER-MAN, THOR |
| VEN-ADS-005 | Usecase functions exported via feature barrel | DAL / Adapter Boundary | P2 | App | SPIDER-MAN, ELEKTRA |
| VEN-ADS-006 | BEHAVIOR.md placeholder — no §5 or §9 | Documentation | P2 | Documentation | Wolverine |

---

## 12. CISSP Domain Coverage Summary

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VEN-ADS-006 (governance gap — missing behavior contract) |
| Asset Security | 1 | VEN-ADS-003 (localStorage not namespaced per actor — data isolation failure) |
| Security Architecture and Engineering | 5 | VEN-ADS-001, 002, 003, 004, 005 (all findings touch arch enforcement) |
| Communication and Network Security | 0 | No network surfaces — feature is localStorage only |
| Identity and Access Management | 3 | VEN-ADS-001, VEN-ADS-002, VEN-ADS-003 (primary IAM violations) |
| Security Assessment and Testing | 1 | VEN-ADS-006 (no §9 invariants = no mandatory test targets for SPIDER-MAN) |
| Security Operations | 0 | No debug leakage, no logging issues found |
| Software Development Security | 3 | VEN-ADS-004, VEN-ADS-005 (usecase ownership gap, barrel boundary violation), VEN-ADS-002 (URL param trust) |

**Uncovered Domains:**
- **Communication and Network Security** — Out of scope for this feature. The ads feature has no network write surfaces, no RPCs, no edge functions, and no external API consumers. The OnemoredaysAd widget uses a hardcoded, validated HTTPS URL with noopener/noreferrer — no finding.
- **Security Operations** — Not applicable at current scope. No debug panels, no console.log of sensitive data, no moderation surfaces found in source inspection.

---

*VENOM V2 Security Review — ads — 2026-06-04*
*Reviewer: VENOM | Scanner: 1.1.0 | Preflight: ALL PASS*
