---
title: VENOM Security Review — dashboard / modules / dashboard (shell)
category-key: vcsm.dashboard.shell
feature: dashboard
module: dashboard (shell)
command: VENOM
ticket: TICKET-ARCHITECT-MODULE-0001
scanner-version: 1.1.0
timestamp: 2026-06-05T00:00:00
output-path: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/outputs/2026/06/05/Venom/2026-06-05_venom_dashboard-shell.md
---

# VENOM V2 SECURITY REVIEW
**Module:** dashboard / modules / dashboard (shell)
**Application Scope:** VCSM
**Ticket:** TICKET-ARCHITECT-MODULE-0001
**Scanner Version:** 1.1.0
**Timestamp:** 2026-06-05

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | vcsm.dashboard.shell |
| Feature / Scope | dashboard |
| Module | dashboard (shell) |
| Command | VENOM |
| Ticket | TICKET-ARCHITECT-MODULE-0001 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/outputs/2026/06/05/Venom/2026-06-05_venom_dashboard-shell.md |
| Timestamp | 2026-06-05T00:00:00 |

---

## 1. VENOM ARCHITECT GATE PASS

```
VENOM ARCHITECT GATE PASS
===========================
Upstream Report:
- ARCHITECT: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/outputs/2026/06/05/ARCHITECT/vcsm.dashboard.shell.architecture.md
  Scope: vcsm.dashboard.shell
  Date: 2026-06-05
  Status: SUCCESS
  Age: 0 days

Proceeding with VENOM analysis.
```

---

## 2. VENOM ARCHITECT OUTPUT CHECK (Scanner Integration — V2.1)

```
VENOM ARCHITECT OUTPUT CHECK
==============================
ARCHITECT Output: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/outputs/2026/06/05/ARCHITECT/vcsm.dashboard.shell.architecture.md
Generated At: 2026-06-05T00:00:00
Age: 0 days
Freshness: FRESH
Scope: vcsm.dashboard.shell
Status: PASS

Note: architect-security-surface.json NOT generated for this module-scoped ARCHITECT run.
      Security surface inventory derived from ARCHITECT .md report + direct source verification.
      All findings carry [SOURCE_VERIFIED] or [SCANNER_LEAD] provenance tags accordingly.

Security Surface Counts (from ARCHITECT module report):
Write surfaces: 0 (shell dispatches navigation only; mutations in card sub-modules)
RPC surfaces: 0 (shell makes no direct RPC calls)
Edge function surfaces: 0
Security paths (structural): 3 (ownership gate, self-access bypass, route auth chain)
Execution paths resolved: 3 / 3
```

---

## 3. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Used For |
|---|---|---|---|---|---|
| feature-map | 2026-06-05T03:29:11Z | ~20h | FRESH | HIGH | Scope discovery, feature boundary |
| callgraph | 2026-06-04T20:29:00Z | ~27h | FRESH | HIGH | 42 nodes in shell scope — layer classification |
| route-map | 2026-06-04T20:29:00Z | ~27h | FRESH | HIGH | 0 routes for dashboard feature (imperative routing confirmed) |
| dependency-map | 2026-06-04T20:29:00Z | ~27h | FRESH | HIGH | Cross-feature dependency detection |

Scanner Version: 1.1.0
Overall Preflight: FRESH
Preflight Action: PASSED
Total write surfaces in scope: 0 (shell only — no mutations)
Total security paths in scope: 3 (structural — ownership gate, route guard, self-access bypass)

---

## 4. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: dashboard
Module: dashboard (shell)
Scan Date: 2026-06-05

Write Surfaces: 0
  Shell dispatches navigation only. No INSERT, UPDATE, DELETE, or UPSERT in shell scope.
  Note: mutations exist in card sub-modules (outside this module's scope).

RPC Calls: 0

Edge Functions: 0

Security Paths (structural — from ARCHITECT report + source verification):
  1. Route auth chain:   /actor/:actorId/dashboard → ProtectedRoute → ProfileGatedOutlet → VportDashboardScreen
  2. Ownership gate:     VportDashboardScreen → useVportOwnership → checkVportOwnershipController
  3. Self-access bypass: checkVportOwnershipController L8-11 — callerActorId === targetActorId + kind check

Execution Paths Resolved: 3 / 3

Trust Boundary Notes:
  - Auth boundary: Supabase session (user-level, not actor-level) enforced at ProtectedRoute
  - Ownership boundary: async screen-level check, not router-level
  - Write surface boundary: 0 writes in shell (card sub-modules are outside scope)
```

---

## 5. Scanner Signals

| Signal | Source | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|
| Route /actor/:actorId/dashboard inside ProtectedRoute | app.routes.jsx:205 | HIGH | YES — index.jsx L171, L176, L205: ProtectedRoute → ProfileGatedOutlet → VportDashboardScreen | [SOURCE_VERIFIED] | VEN-SHELL-003 |
| booking.adapter.js exports getActorByIdDAL (DAL function) | booking.adapter.js:20 | HIGH | YES — line 20: `export { default as getActorByIdDAL } from "@/features/booking/dal/getActorById.dal"` | [SOURCE_VERIFIED] | VEN-SHELL-001 |
| useVportOwnership isOwner UI-only comment | useVportOwnership.js:4-10 | HIGH | YES — lines 4-10: explicit comment "UI convenience state only. All privileged mutations MUST independently verify" | [SOURCE_VERIFIED] | VEN-SHELL-002 |
| Self-access bypass in checkVportOwnershipController | checkVportOwnership.controller.js:8-11 | HIGH | YES — lines 8-11: callerActorId === targetActorId path skips assertActorOwnsVportActorController | [SOURCE_VERIFIED] | VEN-SHELL-004 |
| dashboardViewByVportType client-side card filter | dashboardViewByVportType.model.js | HIGH | YES — BEHAVIOR.md §7: "card visibility controlled client-side by dashboardViewByVportType.model.js; not a security control" | [SOURCE_VERIFIED] | VEN-SHELL-005 |

---

## 6. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/BEHAVIOR.md
BEHAVIOR.md exists: YES
BEHAVIOR.md status: ACTIVE (upgraded from STUB — ARCHITECT 2026-06-05)
§5 Security Rules declared: 0 (module BEHAVIOR.md has §7 Security Notes, not §5 Security Rules)
§5 Rules verified in source: N/A
§5 Rules unenforced: N/A
§9 Must Never Happen declared: 0 (not present in module BEHAVIOR.md)
§9 Invariants protected in source: N/A
§9 Invariants unprotected: N/A

Note: The module BEHAVIOR.md uses §7 Security Notes instead of the §5/§9 format.
      §7 documents three key security constraints that VENOM has verified:
      1. isOwner is UI-only — verified [SOURCE_VERIFIED]
      2. Self-access bypass is documented — verified [SOURCE_VERIFIED]
      3. Card visibility is UX-only, not a security control — verified [SOURCE_VERIFIED]
      Recommend: add formal §5 Security Rules and §9 Must Never Happen sections
      in a future BEHAVIOR.md revision (SPIDER-MAN + WOLVERINE ticket required).
```

---

## 7. VENOM Target

```
VENOM TARGET
=============
Feature / Route / Engine: dashboard shell module — VportDashboardScreen — /actor/:actorId/dashboard
Application Scope: VCSM
Reason for review: Module-level ARCHITECT + VENOM chain (TICKET-ARCHITECT-MODULE-0001)
Primary trust boundary: Authenticated VPORT Owner vs. Authenticated Citizen
```

---

## 8. Security Surface Trace

```
SECURITY SURFACE
=================
Entry point: /actor/:actorId/dashboard (actorId from URL path param)
Auth source: Supabase session via useAuth() — ProtectedRoute
Authorization layer: Screen-level async ownership check — useVportOwnership
Identity surface: identity.actorId (session-derived, from useIdentity), actorId from useParams
Sensitive objects involved:
  - actor ownership (actor_owners table — checked via assertActorOwnsVportActorController)
  - actor kind/void status (actor record — checked via getActorByIdDAL on self-access path)
  - VPORT public profile (non-sensitive — public data)
  - Dashboard card catalog (client-side UX model — not sensitive)
```

---

## 9. Trust Boundary Trace

```
TRUST BOUNDARY TRACE
=====================
Client input:   actorId from URL path parameter (:actorId) — untrusted
Validated at:   VportDashboardScreen — useVportOwnership hook (async, on render)
Identity resolved at: ProtectedRoute (Supabase session) → useIdentity (session actorId)
Authorization enforced at: checkVportOwnershipController (via assertActorOwnsVportActorController or self-access kind check)
Data returned to: Owner only (guarded by isOwner === true render check)

Boundary gap: actorId is accepted from the URL without router-level ownership assertion.
              A Supabase-authenticated user can render the shell for any actorId.
              Ownership check deferred to async screen render.
              Current exposure during loading window: VPORT public profile only (non-sensitive).
```

---

## 10. Trust Boundary Findings

---

### VEN-SHELL-001 — booking.adapter.js DAL Export: Cross-Domain Trust Boundary Violation [MEDIUM]

VENOM SECURITY FINDING
- Finding ID: VEN-SHELL-001
- Location: `apps/VCSM/src/features/booking/adapters/booking.adapter.js:20` | `apps/VCSM/src/features/dashboard/vport/controller/checkVportOwnership.controller.js:1`
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Adapter Boundary Contract → dashboard controller consuming booking-domain DAL via booking adapter
- Contract Violated: Boundary Isolation Contract (Adapter Boundary: "Adapters expose only: hooks, components, view screens. Adapters never export DAL functions, models, or controllers.")
- Current behavior: `booking.adapter.js` line 20 exports `getActorByIdDAL` — a raw DAL function. `checkVportOwnership.controller.js` imports and calls `getActorByIdDAL` from the booking adapter for the self-access path (actor kind lookup). This places dashboard trust logic into the booking-domain trust chain.
- Risk: The dashboard ownership controller depends on the booking adapter for actor identity resolution. This creates mixed-domain trust: any future modification to `booking.adapter.js` that expands its DAL exports could silently extend the attack surface accessible via the dashboard ownership controller. The adapter boundary contract violation also means the booking adapter is not protected from DAL-function consumers — a second importer could call `getActorByIdDAL` with any actorId and receive actor records without further authorization.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions:
  - Requires modification of booking.adapter.js to export an exploitable booking DAL function
  - Current usage (`getActorByIdDAL`) is read-only and fetches only actor kind/void status
  - No direct exploit path exists with current export set
- Blast Radius: Single VPORT (dashboard shell ownership chain); future booking-domain DAL exposure risk
- Identity Leak Type: Internal UUID exposure (actor kind check exposes actor.kind and actor.is_void field)
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — `getActorByIdDAL` reads from actor records; RLS policy on actors table not inspected
- Why it matters: The VCSM adapter boundary contract exists to isolate trust domains. When a booking-domain adapter exports DAL functions, any consumer (dashboard, settings, profiles) can import and call those functions without the booking controller's authorization layer. The current usage is benign (read-only actor kind check), but the pattern creates a precedent and a future risk vector.
- Recommended mitigation: Move `getActorByIdDAL` out of `booking.adapter.js`. Create a dedicated `@/shared/dal/getActorById.dal.js` (actor identity DAL belongs in shared, not booking domain) or expose it via the identity adapter/shared actor service. The dashboard controller should import actor lookups from a neutral, cross-domain location.
- Rationale: Fixes the architectural violation (ARCH-001) AND eliminates the mixed-domain trust pattern. Actor-kind resolution is a shared concern, not a booking-domain concern.
- Follow-up command: SENTRY (adapter boundary enforcement), ELEKTRA (source→sink chain for getActorByIdDAL consumers)
- CISSP Domain:
  - Primary: Software Development Security (adapters, dependency isolation, DAL boundary)
  - Secondary: Security Architecture and Engineering (defense-in-depth, domain isolation)
- Provenance: [SOURCE_VERIFIED]

---

### VEN-SHELL-002 — UI-Only Ownership Gate: Implicit Trust Assumption for Card Sub-Modules [HIGH]

VENOM SECURITY FINDING
- Finding ID: VEN-SHELL-002
- Location: `apps/VCSM/src/features/dashboard/vport/hooks/useVportOwnership.js:4-10`
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract — "isOwner is a UI convenience state only. All privileged mutations MUST independently verify ownership through controller-layer actor_owners checks."
- Contract Violated: Actor Ownership Contract (hook comment explicitly documents the requirement but cannot enforce it)
- Current behavior: `useVportOwnership.isOwner` gates the shell render only. Card sub-modules receive `actorId` via route params and the session identity — neither the shell nor any framework enforces that sub-modules call `assertActorOwnsVportActorController`. The hook documentation warns of this, but the enforcement is decentralized.
- Risk: If any dashboard card sub-module performs mutations (INSERT, UPDATE, DELETE) without independently calling `assertActorOwnsVportActorController`, those mutations are unprotected by ownership verification. An authenticated attacker who manually navigates to a card sub-module route (bypassing the shell) would trigger the card module without going through the shell's isOwner gate at all. The shell ownership gate is bypassed entirely by direct route navigation.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions:
  - Authenticated Citizen account required
  - Target VPORT's actorId known (observable from public profiles)
  - Direct navigation to card sub-module route (e.g., /actor/target-id/dashboard/calendar) — bypasses the shell entirely
  - Card sub-module must fail to independently call assertActorOwnsVportActorController
- Blast Radius: Multi-card, multi-VPORT — all dashboard card sub-modules that miss the independent ownership check
- Identity Leak Type: Ownership inference (if card returns data scoped to actorId, non-owner can observe it)
- Cache Trust Type: Booking-sensitive (calendar, booking-history), Identity-sensitive (team, settings)
- RLS Dependency: REQUIRED — if card sub-modules do not independently verify ownership in the app layer, DB RLS becomes the sole defense
- Why it matters: The VCSM dashboard shell is a navigation dispatcher only. Card sub-modules are independent routes — any authenticated user can navigate directly to `/actor/target-id/dashboard/calendar`, `/actor/target-id/dashboard/locksmith`, etc. without going through the shell. The shell's ownership check does not protect those routes. Each card module must independently call `assertActorOwnsVportActorController` before loading privileged data or accepting mutations. VENOM cannot verify sub-module ownership enforcement from this shell-scope review — that is an explicit remaining risk.
- Recommended mitigation: (1) SPIDER-MAN: add regression tests that navigate directly to each card sub-module route with a non-owner authenticated session and verify 403/rejection. (2) ARCHITECT: run a module-level audit on each card sub-module to confirm independent ownership verification. (3) Consider a route-level ownership guard HOC that wraps all /actor/:actorId/dashboard/* routes and enforces ownership before rendering any card sub-module.
- Rationale: Ownership enforcement should not rely on every developer remembering to add it. A structural guard at the route or parent layout level would eliminate the risk class entirely.
- Follow-up command: SPIDER-MAN (regression coverage for direct card route access), ARCHITECT (card sub-module ownership audit), WOLVERINE (route-level ownership guard implementation)
- CISSP Domain:
  - Primary: Identity and Access Management (authorization, actor ownership enforcement)
  - Secondary: Security Architecture and Engineering (defense-in-depth, decentralized authorization risk)
- Provenance: [SOURCE_VERIFIED]

ACTOR OWNERSHIP WARNING
Location: useVportOwnership.js:4-10 + all dashboard card sub-module routes
Caller actor: session identity.actorId
Target actor: URL :actorId param
Ownership verification: Shell — YES (async, UI gate only). Card sub-modules — UNVERIFIED from this scope.
Risk: Direct navigation to card sub-module routes bypasses the shell ownership gate entirely.
Recommended mitigation: Route-level ownership guard HOC wrapping all /actor/:actorId/dashboard/* routes.

---

### VEN-SHELL-003 — Route Ownership Deferred to Screen Layer: Async Authorization Gap [MEDIUM]

VENOM SECURITY FINDING
- Finding ID: VEN-SHELL-003
- Location: `apps/VCSM/src/app/routes/protected/app.routes.jsx:205` | `apps/VCSM/src/app/guards/ProtectedRoute.jsx`
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen → Authenticated VPORT Owner
- Boundary Violated: /actor/:actorId/dashboard authorizes at Supabase-user level (auth), not at actor-ownership level
- Contract Violated: Actor Ownership Contract (actor ownership not verified at route layer)
- Current behavior: `/actor/:actorId/dashboard` is inside `ProtectedRoute` (Supabase session + email verified + legal consent) and `ProfileGatedOutlet` (profile completeness gate). These guards confirm the visitor is an authenticated VCSM citizen. Actor ownership of `:actorId` is NOT verified at the route layer — it is deferred to `useVportOwnership` inside `VportDashboardScreen`. Any authenticated Citizen can load the shell for any `actorId`; the screen renders skeleton and public profile data while the async ownership check runs; it rejects non-owners once the check resolves.
- Risk: During the ownership check loading window, `useVportDashboardDetails(actorId)` fetches the public VPORT profile (banner, avatar, name, tagline). This data is intentionally public — no privileged data is exposed in this window. However, the pattern means: (1) the public profile of any VPORT is loaded for any authenticated visitor before authorization, and (2) if a future code change adds non-public data to the early loading window, the authorization gap becomes exploitable.
- Severity: MEDIUM (low immediate exploitability — public data only in loading window; moderate architectural risk for future changes)
- Exploitability: LOW (current form — only public data in loading window)
- Attack Preconditions:
  - Authenticated Citizen account required
  - Target VPORT actorId known
  - Attacker can observe the loading-window data fetch (network inspection)
- Blast Radius: Single VPORT (only public profile loaded during window)
- Identity Leak Type: None (public profile data is public by design)
- Cache Trust Type: Public-profile-sensitive (public profile loads before authorization)
- RLS Dependency: ASSUMED — public profile reads rely on Supabase anon/auth RLS for non-public data exclusion
- Why it matters: The authorization gap is architecturally fragile. The current safety relies on the invariant "all early-load data is public." If any developer adds a privileged data hook to VportDashboardScreen before the isOwner gate check, it will load for any authenticated visitor. This is a MEDIUM risk today; it is a CRITICAL risk if the invariant is broken.
- Recommended mitigation: Add a router-level ownership guard for the `/actor/:actorId/dashboard` route tree. HAWKEYE should verify auth guard contract for all dashboard routes. Consider a `VportOwnerGatedRoute` wrapper that resolves ownership before rendering any dashboard child — preventing accidental loading of privileged data during the async window.
- Rationale: Defense-in-depth: route-level + screen-level ownership checks ensures the authorization gap cannot be accidentally widened by future additions to the early loading logic.
- Follow-up command: HAWKEYE (endpoint auth contract verification for all /actor/:actorId/dashboard/* routes), ARCHITECT (dashboard route guard pattern)
- CISSP Domain:
  - Primary: Identity and Access Management (async authorization gap, route-level ownership missing)
  - Secondary: Security Architecture and Engineering (defense-in-depth, loading-window exposure risk)
- Provenance: [SOURCE_VERIFIED]

---

### VEN-SHELL-004 — Self-Access Bypass Skips actor_owners Table Check [LOW]

VENOM SECURITY FINDING
- Finding ID: VEN-SHELL-004
- Location: `apps/VCSM/src/features/dashboard/vport/controller/checkVportOwnership.controller.js:8-11`
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: actor_owners table bypass (intentional — VPORT-as-actor mode)
- Contract Violated: None formally — the bypass is intentional and documented in the comment at lines 7-9
- Current behavior: When `callerActorId === targetActorId` (i.e., a VPORT actor viewing its own dashboard after switching to VPORT mode), the controller calls `getActorByIdDAL({ actorId: callerActorId })` and checks `actor.kind === 'vport' && !actor.is_void`. If true, access is granted WITHOUT consulting the `actor_owners` table. This bypass path is invoked when a VPORT actor has switched identity and is viewing their own VPORT dashboard. The `callerActorId` comes from `identity?.actorId` in `VportDashboardScreen`, which is session-derived.
- Risk: The bypass path does not verify that the calling user's Supabase account is the account that controls this VPORT actor. It only verifies: (a) the actor exists, (b) actor.kind === 'vport', (c) !actor.is_void. If the session somehow provides an actorId that is not the user's own actor, the bypass would grant access to that VPORT's dashboard without an actor_owners check. In practice, identity.actorId is session-derived from the identity context, which is populated from the authenticated Supabase session — so this requires session compromise to exploit. For the shell specifically (no write surfaces), the practical impact is limited to dashboard visibility only.
- Severity: LOW
- Exploitability: LOW
- Attack Preconditions:
  - Session compromise or session actorId manipulation required
  - Extremely unlikely under normal Supabase session management
  - Impact limited to dashboard shell visibility (no write surfaces in shell)
- Blast Radius: Single VPORT (shell visibility only)
- Identity Leak Type: None (dashboard shell shows navigation cards, no private data beyond public profile)
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — actor record is read via getActorByIdDAL; actor table RLS policy not inspected
- Why it matters: The bypass is intentionally documented ("a navigation/visibility gate only — mutations require a user-kind actor"), and the comment notes that mutations independently verify. However, the actor_owners table is bypassed for the self-access path, meaning the most authoritative ownership record is not consulted. If actor identity switching has a race condition or vulnerability, this bypass path is the weakest link in the ownership chain.
- Recommended mitigation: Consider adding an explicit `user_id → actor` binding check before granting self-access bypass. The check should verify that the calling Supabase user's `user_id` corresponds to the VPORT actor via the `actor_owners` table, OR ensure the identity context already enforces this binding. Document the exact session→actorId chain to confirm the bypass is unreachable without session compromise.
- Rationale: Low risk today; hardening the bypass documentation and adding a binding check ensures session-compromise scenarios cannot escalate to VPORT dashboard access.
- Follow-up command: DB (actor table RLS policy for actor kind lookup), DEADPOOL (trace identity.actorId session→actor binding chain)
- CISSP Domain:
  - Primary: Identity and Access Management (actor_owners bypass, actor kind verification)
  - Secondary: Security and Risk Management (bypass documentation, exception path governance)
- Provenance: [SOURCE_VERIFIED]

---

### VEN-SHELL-005 — Card Catalog Visibility is Client-Side Model Only — Not a Security Boundary [MEDIUM]

VENOM SECURITY FINDING
- Finding ID: VEN-SHELL-005
- Location: `apps/VCSM/src/features/dashboard/vport/model/dashboardViewByVportType.model.js` | `apps/VCSM/src/features/dashboard/vport/model/buildDashboardCards.model.js`
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Card type restriction model is bypassed by direct route navigation
- Contract Violated: BEHAVIOR.md §7: "Card visibility controlled client-side by dashboardViewByVportType.model.js. Restricting visible cards by VPORT type is a UX feature, not a security control. Card sub-modules must enforce their own access checks."
- Current behavior: The dashboard shell builds a filtered card set for the authenticated VPORT owner based on their `vportType`. A gas station VPORT sees gas cards; a barber VPORT sees barber cards. The `isDashboardCardEnabled(key)` release flag provides additional visibility filtering. However, this filtering is entirely client-side. An authenticated user can navigate directly to `/actor/target-id/dashboard/gas` even if the gas card is not shown in the dashboard view for that VPORT type. The card sub-module route is still registered in the router and accessible to any authenticated user.
- Risk: A VPORT owner can directly navigate to card sub-modules that the dashboard model would not show them (e.g., a barber navigating to the gas module). Card sub-module access control relies entirely on each sub-module's independent ownership verification, NOT on the dashboard model's card set restriction. If a card sub-module does not independently verify ownership AND VPORT type, a non-owner could potentially access or mutate data in a card module that doesn't appear in their dashboard.
- Severity: MEDIUM
- Exploitability: MEDIUM
- Attack Preconditions:
  - Authenticated Citizen account required (own or non-owner of target VPORT)
  - Target VPORT actorId known
  - Direct navigation to a card sub-module route
  - Card sub-module must fail to independently verify ownership and/or VPORT type
- Blast Radius: Multi-card — any card sub-module accessible directly by route
- Identity Leak Type: None (risk is data access, not identity leak)
- Cache Trust Type: None directly from shell
- RLS Dependency: REQUIRED — card sub-modules' data reads and mutations must be backed by RLS or independent app-layer ownership checks
- Why it matters: The dashboard shell is a trusted navigator, but it provides ZERO enforcement of card access restrictions. All 17 card sub-module routes are reachable directly by URL. If any card sub-module lacks independent ownership verification, VPORT type validation, or RLS coverage, it is exploitable regardless of the dashboard shell's card catalog model. BEHAVIOR.md §7 documents this constraint, but documentation does not enforce it.
- Recommended mitigation: (1) Audit each of the 17 card sub-module routes for independent ownership verification. (2) Consider a shared `useDashboardCardGate(actorId)` hook that all card sub-modules must call before loading data — this would centralize the ownership + VPORT type check without requiring each module to implement it independently. (3) SPIDER-MAN: add regression tests for direct card route access with non-owner actors.
- Rationale: Defense-in-depth: the shell's UX-level card filter is not a security control. The card sub-modules are the trust boundary. Centralizing the guard eliminates the risk class.
- Follow-up command: SPIDER-MAN (regression coverage — direct card route access), ARCHITECT (card sub-module ownership audit), SENTRY (route access contract verification)
- CISSP Domain:
  - Primary: Identity and Access Management (access control, card-level authorization)
  - Secondary: Security Architecture and Engineering (defense-in-depth, client-side filter limitations)
- Provenance: [SOURCE_VERIFIED]

---

## 11. Source Verification Summary

| Field | Value |
|---|---|
| Total write surfaces in scope | 0 (shell only) |
| Total structural security paths | 3 |
| Surfaces source-verified | 5/5 (all findings SOURCE_VERIFIED) |
| Source files read | checkVportOwnership.controller.js, useVportOwnership.js, booking.adapter.js, app/routes/index.jsx, app/routes/protected/app.routes.jsx, ProtectedRoute.jsx, ProfileGatedOutlet.jsx, dashboardViewByVportType.model.js, buildDashboardCards.model.js |
| CRITICAL findings | 0 |
| HIGH findings | 1 — all [SOURCE_VERIFIED]: YES |
| MEDIUM findings | 3 — all [SOURCE_VERIFIED]: YES |
| LOW findings | 1 — all [SOURCE_VERIFIED]: YES |

---

## 12. Confidence Summary

| Metric | Value |
|---|---|
| HIGH confidence surfaces | 3 |
| LOW confidence surfaces | 0 |
| [SOURCE_VERIFIED] findings | 5 |
| [SCANNER_LEAD] findings | 0 |
| [SCANNER_LOW_CONF] findings | 0 |
| CRITICAL findings | 0 |
| ARCHITECT freshness | 0 days (FRESH) |

---

## 13. THOR Impact

| Finding | Severity | THOR Blocker | Reason |
|---|---|---|---|
| VEN-SHELL-001 | MEDIUM | NO | Architectural violation, low immediate exploitability |
| VEN-SHELL-002 | HIGH | YES — until card sub-modules independently verified | Direct route bypass of shell gate — unverified card sub-modules at risk |
| VEN-SHELL-003 | MEDIUM | NO | Public data only in loading window; architectural recommendation |
| VEN-SHELL-004 | LOW | NO | Session compromise required; shell has no writes |
| VEN-SHELL-005 | MEDIUM | YES — until card sub-module audit complete | Card sub-module access from direct routes unverified |

**THOR Release Blocker:** YES — VEN-SHELL-002 + VEN-SHELL-005 pending card sub-module ownership audit
**Highest Open Severity:** HIGH (VEN-SHELL-002)

---

## 14. Enhanced Mitigation Plan

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-SHELL-001 | booking.adapter DAL export — cross-domain trust | Controller / Engine | P2 | App | SENTRY, ELEKTRA |
| VEN-SHELL-002 | Shell ownership gate UI-only — card sub-modules not enforced | Router / Controller | P1 | App | SPIDER-MAN, ARCHITECT |
| VEN-SHELL-003 | Route ownership deferred to screen — async authorization gap | Router | P2 | App | HAWKEYE, ARCHITECT |
| VEN-SHELL-004 | Self-access bypass skips actor_owners | Controller | P3 | App | DB, DEADPOOL |
| VEN-SHELL-005 | Card catalog visibility client-side only — not a security control | Controller / Router | P1 | App | SPIDER-MAN, ARCHITECT |

---

## 15. Required Follow-Up Commands

| Command | Reason | Priority |
|---|---|---|
| SPIDER-MAN | Regression tests for direct card sub-module route access with non-owner sessions | P1 |
| ARCHITECT | Module-level audit of each card sub-module to confirm independent ownership verification | P1 |
| HAWKEYE | Auth/ownership contract verification for all /actor/:actorId/dashboard/* routes | P2 |
| SENTRY | Adapter boundary enforcement — booking.adapter DAL export violation | P2 |
| ELEKTRA | Source→sink chain for getActorByIdDAL consumers beyond checkVportOwnership.controller.js | P2 |
| DB | Actor table RLS policy inspection — actor kind lookup in self-access bypass | P3 |
| DEADPOOL | Trace identity.actorId session→actor binding chain — confirm self-access bypass requires session compromise | P3 |
| BLACKWIDOW | Adversarial verification of VEN-SHELL-002 (direct card route bypass) | P1 |
| THOR | Release gate pending card sub-module ownership audit | P1 |

---

## 16. CISSP Domain Coverage Summary

| CISSP Domain | Findings | Notes |
|---|---|---|
| Security and Risk Management | 1 | VEN-SHELL-004 (secondary) — exception path governance |
| Asset Security | 0 | Shell has no write surfaces; no privileged data assets in scope |
| Security Architecture and Engineering | 5 | All findings touch architectural defense-in-depth |
| Communication and Network Security | 0 | No public RPCs, edge functions, or external API surfaces in shell |
| Identity and Access Management | 5 | All findings involve actor ownership, authorization, or identity surface |
| Security Assessment and Testing | 1 | VEN-SHELL-002/005 — no regression coverage for direct card route access |
| Security Operations | 0 | No debug leakage in shell scope |
| Software Development Security | 2 | VEN-SHELL-001 (adapter boundary), VEN-SHELL-005 (client-side filter limitation) |

**Uncovered domains:** Asset Security (no privileged data in shell scope — N/A), Communication and Network Security (no network surfaces in shell — N/A), Security Operations (no debug tooling in shell — N/A).
All uncovered domains are out of scope for the dashboard shell module (navigation dispatcher, no write surfaces, no debug tooling).

---

## 17. VENOM V2 Completion Checklist

- [x] Loaded boundary isolation contract
- [x] Stayed read-only — no files modified
- [x] ARCHITECT Mapping Gate passed
- [x] ARCHITECT output freshness verified (0 days — FRESH)
- [x] Behavior contract checked (BEHAVIOR.md exists, ACTIVE, §7 security notes verified)
- [x] Trust boundaries identified (auth layer, ownership layer, async gap)
- [x] Auth and authorization traced (ProtectedRoute → screen-level ownership check)
- [x] Identity surfaces inspected (actorId from session vs. URL param)
- [x] Exploitability classified (all findings)
- [x] Blast radius classified (all findings)
- [x] Platform surface classified (all findings)
- [x] RLS dependency classified (all findings)
- [x] Contract violations mapped (all findings)
- [x] CISSP domains mapped (all findings)
- [x] Mitigation plan included (all findings)
- [x] CISSP summary table included
- [x] Uncovered CISSP domains stated
- [x] All findings carry [SOURCE_VERIFIED]
- [x] 0 CRITICAL findings without [SOURCE_VERIFIED]
- [x] Scanner Inputs block included
- [x] Scanner Signals block included
- [x] Source Verification Summary included
- [x] Confidence Summary included
- [x] THOR impact documented
- [x] Required follow-up commands listed
- [x] Write 2 — SECURITY.md update required (module-level + feature-level)
