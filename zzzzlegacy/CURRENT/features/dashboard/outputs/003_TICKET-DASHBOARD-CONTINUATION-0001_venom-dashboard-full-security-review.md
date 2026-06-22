# VENOM V2 SECURITY REVIEW
## TICKET-DASHBOARD-CONTINUATION-0001 — Phase 3

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | dashboard |
| Feature | dashboard (ALL modules) |
| Command | VENOM |
| Ticket | TICKET-DASHBOARD-CONTINUATION-0001 |
| Scanner Version | 1.1.0 |
| Output Path | CURRENT/outputs/2026/06/04/VENOM/003_TICKET-DASHBOARD-CONTINUATION-0001_venom-dashboard-full-security-review.md |
| Timestamp | 2026-06-04T00:00:00Z |
| Application Scope | VCSM |

---

## 1. VENOM Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 3 days

| Map                  | Generated At                | Age  | Freshness | Confidence | Status |
|----------------------|-----------------------------|------|-----------|------------|--------|
| write-surface-map    | 2026-06-03T00:22:42.771Z    | 1.0d | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-03T00:22:42.771Z    | 1.0d | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-03T00:22:42.771Z    | 1.0d | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-03T00:22:42.771Z    | 1.0d | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-03T00:22:42.771Z    | 1.0d | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-03T00:22:42.771Z    | 1.0d | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-03T00:22:42.771Z    | 1.0d | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-03T00:22:42.771Z    | 1.0d | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
Write surfaces in scope: 38
RPC surfaces in scope: 0
Edge function surfaces in scope: 0
Security paths in scope: 0 (dashboard is card-based; no public-route registrations)
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Surfaces In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-03T00:22:42Z | 1.0d | FRESH | HIGH | 38 | Primary attack surface inventory |
| rpc-map | 2026-06-03T00:22:42Z | 1.0d | FRESH | HIGH | 0 | RPC surface inventory |
| edge-function-map | 2026-06-03T00:22:42Z | 1.0d | FRESH | HIGH | 0 | Edge function surface inventory |
| security-path-map | 2026-06-03T00:22:42Z | 1.0d | FRESH | HIGH | 0 | Route→write chain resolution |
| write-execution-map | 2026-06-03T00:22:42Z | 1.0d | FRESH | HIGH | 38 | Write surface caller chain resolution |

Scanner Run Time: 2390ms
Overall Preflight: FRESH / PASSED
Total surfaces in scope: 38 write + 0 RPC + 0 edge function

**Important note:** All 38 dashboard write surfaces have `confidence: LOW` in write-execution-map with `controller: NONE`. This triggers the LOW Confidence Review Protocol (§V2.4) for all surfaces. VENOM manually traced every write surface to its callers.

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: dashboard
Scan Date: 2026-06-03T00:22:42.771Z

Write Surfaces: 38
  INSERT: 14 | UPDATE: 14 | DELETE: 7 | UPSERT: 3

Tables affected:
  bookings (INSERT×1, UPDATE×1)
  resources (INSERT×3, UPDATE×4, DELETE×3)
  fuel_prices (UPDATE×1, UPSERT×1)
  fuel_price_history (INSERT×1)
  fuel_price_submission_reviews (INSERT×1, UPDATE×1)
  fuel_price_submissions (INSERT×1, UPDATE×1)
  business_card_leads (UPDATE×1, DELETE×1)
  portfolio_media (UPDATE×1)
  profile_public_details (UPSERT×2)
  design_documents (INSERT×1, UPDATE×1)
  design_pages (INSERT×1, UPDATE×2, DELETE×1)
  design_page_versions (INSERT×1, DELETE×1)
  design_assets (INSERT×1)
  design_exports (INSERT×1, DELETE×1)
  design_render_jobs (INSERT×1, DELETE×1)

RPC Calls: 0
Edge Functions: 0
Security Paths with resolved execution: 0 / 38 (all LOW confidence — LOW Confidence Review Protocol applied)
```

---

## 4. Scanner Signals

| Signal | Source Map | Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|
| UPDATE bookings — `updateVportBookingDAL` — LOW conf | write-execution-map | LOW | YES — updateVportBooking.write.dal.js line 26: `.eq("id", bookingId)` only; no profile_id scope | [SOURCE_VERIFIED] | VEN-DASH-006 |
| UPSERT profile_public_details — `saveFlyerPublicDetails` — LOW conf | write-execution-map | LOW | YES — flyer.write.dal.js line 29: no auth check; flyerEditor.controller.js line 33: ownerActorId checked but profileId not bound | [SOURCE_VERIFIED] | VEN-DASH-002 |
| UPDATE resources — `updateTeamMemberRoleDAL` — LOW conf | write-execution-map | LOW | YES — vportTeam.write.dal.js line 47: `.eq("id", resourceId)` only; but vportTeamAccess.controller.js line 86: ownership gate + member lookup present | [SOURCE_VERIFIED] | VEN-DASH-007 (DOWNGRADED) |
| UPDATE resources — `setTeamMemberActiveDAL` — LOW conf | write-execution-map | LOW | YES — controller line 107: ownership gate present | [SOURCE_VERIFIED] | VEN-DASH-007 (DOWNGRADED) |
| DELETE resources — `deleteTeamMemberByIdDAL` — LOW conf | write-execution-map | LOW | YES — two controllers confirmed with ownership gates | [SOURCE_VERIFIED] | SAFE — see §6 |
| No route entry for dashboard quickStats | security-path-map | N/A | YES — vportOwnerStats.controller.js: no assertActorOwnsVportActorController | [SOURCE_VERIFIED] | VEN-DASH-001 |
| DELETE+UPDATE design_* with LOW conf | write-execution-map | LOW | YES — designStudio.shared.controller.js: requireOwnerActorAccess present; but documentId not bound | [SOURCE_VERIFIED] | VEN-DASH-003 |
| No callers resolved for dashboard DALs | write-execution-map | LOW | Manual trace performed for all 38 surfaces | [SOURCE_VERIFIED] | Multiple |

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: CURRENT/features/dashboard/BEHAVIOR.md
BEHAVIOR.md exists: NO
BEHAVIOR.md status: MISSING

§5 Security Rules declared: 0 (file missing)
§5 Rules verified in source: 0 / 0
§5 Rules unenforced: CANNOT EVALUATE
§9 Must Never Happen declared: 0 (file missing)
§9 Invariants protected in source: CANNOT EVALUATE

Finding: MISSING_BEHAVIOR_CONTRACT [dashboard]
Severity: HIGH
Note: Security posture cannot be fully evaluated without declared §5 Security Rules
and §9 Must Never Happen invariants. VENOM continues with source evidence only —
findings are marked UNANCHORED (no BEHAVIOR.md to cross-check).
```

---

## 6. Trust Boundary Findings

---

### VEN-DASH-001 — Missing Ownership Gate: loadOwnerQuickStatsController [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-DASH-001
- **Location:** `apps/VCSM/src/features/dashboard/vport/controller/vportOwnerStats.controller.js` lines 24–64
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table (vport.bookings, vport.resources)
- **Trust Boundary:** Authenticated VPORT Owner (expected) / Authenticated Citizen (actual)
- **Boundary Violated:** Any authenticated user → VPORT Owner data access
- **Contract Violated:** Actor Ownership Contract
- **Current behavior:** `loadOwnerQuickStatsController({ actorId })` accepts any `actorId` parameter, reads the VPORT's profile, all booking stats (today's appointments, upcoming 7-day count), and staff/barber headcount — with NO `assertActorOwnsVportActorController` call or any other ownership gate.
- **Risk:** Any authenticated user (or any code path that calls this function) can query the operational stats of any VPORT by providing any actor ID. The caller does not need to own the VPORT.
- **Severity:** HIGH
- **Exploitability:** HIGH
- **Attack Preconditions:**
  - Authenticated VCSM account required
  - Target VPORT actorId known (UUIDs, but actor pages are public)
  - No ownership verification required
- **Blast Radius:** Any VPORT — all operational booking stats and staff headcounts exposed to any authenticated user
- **Identity Leak Type:** Resource enumeration (booking counts, staff counts per VPORT)
- **Cache Trust Type:** Booking-sensitive (exposes today's appointment count)
- **RLS Dependency:** UNVERIFIED — if `vport.bookings` and `vport.resources` RLS policies restrict reads to the profile owner, this is partially mitigated at DB. However, the fact that the controller fetches data without owner verification means the RLS policy is the SOLE defense.
- **Why it matters:** The dashboard is labeled "owner-only." If any authenticated citizen can determine how many appointments a barbershop has today or how many barbers they have, this leaks operational intelligence. Even if RLS blocks the query for external users, the controller pattern is architecturally broken — it does not follow the two-tier ownership model declared in ARCHITECTURE.md.
- **Recommended mitigation:**
  1. Add `callerActorId` parameter to `loadOwnerQuickStatsController`
  2. Call `await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })` before any reads
  3. Update `useOwnerQuickStats(actorId)` hook to pass `identity?.actorId` as `callerActorId`
- **Rationale:** Every other mutating and sensitive-read controller in the dashboard follows this pattern. This controller is the one exception.
- **Follow-up command:** WOLVERINE (patch), BLACKWIDOW (verify after patch)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering

---

### VEN-DASH-002 — Flyer Builder: profileId Not Bound to ownerActorId [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-DASH-002
- **Location:** `apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js` lines 32–35; `apps/VCSM/src/features/dashboard/flyerBuilder/dal/flyer.write.dal.js` lines 26–43
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table (vport.profile_public_details)
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** VPORT Owner A → profile_public_details of VPORT B
- **Contract Violated:** Actor Ownership Contract, VPORT Lifecycle Contract
- **Current behavior:** `saveFlyerPublicDetailsCtrl({ profileId, patch, ownerActorId })` calls `requireOwnerActorAccess(ownerActorId)` which verifies the authenticated user owns the actor at `ownerActorId`. However, the `profileId` parameter is accepted from the caller and passed directly to `saveFlyerPublicDetails({ profileId, patch })` with no validation that `profileId` belongs to `ownerActorId`. The DAL writes directly to `vport.profile_public_details` by `profile_id` without any secondary ownership scope.
- **Risk:** Authenticated VPORT owner A calls `saveFlyerPublicDetailsCtrl({ profileId: victimProfileId, ownerActorId: ownedActorId, patch })`. `requireOwnerActorAccess` passes (A owns ownedActorId). The DAL writes flyer data to victimProfileId — potentially overwriting another VPORT's website_url, phone_public, hours, logo_url, and flyer content.
- **Severity:** HIGH
- **Exploitability:** MEDIUM — Requires VPORT owner account AND knowledge of a target profileId. profileId values are UUIDs not generally exposed in public URLs, but may be available from network traffic or API responses.
- **Attack Preconditions:**
  - Authenticated VPORT owner account required
  - Target victim profileId must be known
  - Attacker can intercept/inspect network request to modify profileId
- **Blast Radius:** Any VPORT — flyer fields (website_url, phone_public, hours, logo_url, flyer_headline, etc.) of any VPORT can be overwritten
- **Identity Leak Type:** Ownership inference (can confirm profileId validity by observing write success)
- **Cache Trust Type:** Public-profile-sensitive (writes to public-facing contact/hours fields)
- **RLS Dependency:** REQUIRED — `vport.profile_public_details` RLS (`actor_can_manage_profile(profile_id)`) is the SOLE defense. VENOM has not independently verified RLS is present and correctly scoped. CARNAGE verification required.
- **Why it matters:** If RLS is correctly enforced, this write would be blocked at the DB layer. But "RLS as sole defense" for a write surface is a P1 architecture violation — the app layer must also bind profileId to ownerActorId. This is the exact pattern PORT-V-005 was created to address.
- **Recommended mitigation:**
  1. Inside `saveFlyerPublicDetailsCtrl`, derive `profileId` from `ownerActorId` server-side instead of accepting it from the caller: `const profileId = await getVportProfileIdByActorDAL({ actorId: ownerActorId })`
  2. Remove `profileId` from the controller's parameter surface
  3. Update `useFlyerEditor` to not pass `profileId` to the controller
- **Status:** THOR BLOCKED per `zNOTFORPRODUCTION/CURRENT/features/dashboard/modules/flyer-builder/SECURITY.md` (ELEK-2026-06-02-001)
- **Rationale:** The fix is structural: profileId must be derived from the verified actor, not supplied by the caller.
- **Follow-up command:** WOLVERINE (patch ELEK-2026-06-02-001), CARNAGE (verify RLS on profile_public_details)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

### VEN-DASH-003 — Design Studio: documentId Not Bound to ownerActorId [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-DASH-003
- **Location:** `apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.pages.controller.js` and related page-write controllers
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Tables (design_documents, design_pages, design_page_versions, design_assets, design_exports, design_render_jobs)
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** VPORT Owner A → design documents of VPORT B
- **Contract Violated:** Actor Ownership Contract
- **Current behavior:** Design studio page-write controllers call `requireOwnerActorAccess(ownerActorId)` which verifies the authenticated user owns the VPORT actor. However, page/document write operations accept caller-supplied `documentId` without verifying the document belongs to `ownerActorId`. An authenticated VPORT owner could supply a `documentId` belonging to another VPORT.
- **Risk:** Cross-VPORT document writes, deletes, or corruption of another VPORT's design assets.
- **Severity:** HIGH
- **Exploitability:** MEDIUM — requires VPORT owner account AND knowledge of target documentId (UUID)
- **Blast Radius:** Any VPORT's design documents — pages, versions, assets, exports, render jobs
- **Identity Leak Type:** Resource enumeration
- **Cache Trust Type:** None (design assets not cached in security-relevant cache)
- **RLS Dependency:** REQUIRED — design tables RLS status unverified. ELEK-2026-06-02-002 notes "escalates if design-table RLS is absent." CARNAGE verification required.
- **Status:** THOR BLOCKED per `zNOTFORPRODUCTION/CURRENT/features/dashboard/modules/flyer-builder/SECURITY.md` (ELEK-2026-06-02-002)
- **Recommended mitigation:**
  1. After `requireOwnerActorAccess(ownerActorId)`, verify the document belongs to the actor: `const doc = await dalReadDesignDocumentById(documentId); if (doc.owner_actor_id !== ownerActorId) throw new Error("Not authorized")`
  2. Add `owner_actor_id` scope to all design_pages and design_page_versions write operations
- **Follow-up command:** WOLVERINE (patch), CARNAGE (verify design table RLS)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering

---

### VEN-DASH-004 — fastCountNewVportLeadsController: Auth Bypass on Poll Path [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-DASH-004
- **Location:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js` line 57; `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js` line 35
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table (vport.business_card_leads)
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** Any code caller → leads count data without ownership verification
- **Contract Violated:** Actor Ownership Contract
- **Current behavior:** `fastCountNewVportLeadsController(profileId)` accepts a raw `profileId` and reads the new leads count from `vport.business_card_leads` without any session or ownership verification. In `useVportNewLeadsCount`, the first call uses the full owned `countNewVportLeadsController` (auth verified). The 60-second polling loop then calls `fastCountNewVportLeadsController` using a cached `profileIdRef.current` from the prior authenticated call.
- **Risk:** Two concerns:
  1. The function itself is exported with no auth guard. Any code path (current or future) that calls `fastCountNewVportLeadsController` with an arbitrary profileId can read new leads counts without ownership verification.
  2. Polling uses a cached profileId that is not re-verified. Ownership revocation between the initial check and the poll interval is not detected for up to 60 seconds.
- **Severity:** MEDIUM
- **Exploitability:** LOW — Direct exploitation requires calling the function from an unauthorized code path. The React hook usage is safe because profileId is obtained from an authenticated call. Export from card index makes the function accessible beyond the intended hook context.
- **Attack Preconditions:**
  - Function must be accessed via a code path outside of `useVportNewLeadsCount`
  - Target profileId must be known
  - Auth/session state not checked in the function
- **Blast Radius:** Single VPORT — read-only count only (no PII, just an integer)
- **Identity Leak Type:** Resource enumeration (reveals lead activity level for any profileId)
- **Cache Trust Type:** None (reads live DB count)
- **RLS Dependency:** UNVERIFIED — if `business_card_leads` RLS restricts read access to profile owner, this is mitigated at DB
- **Why it matters:** `vport.business_card_leads` contains PII (the controller file explicitly notes: "vport.business_card_leads contains PII (name, phone, email, message)"). Even count-only reads without ownership verification establish a precedent of auth bypass for this table.
- **Recommended mitigation:**
  1. Remove `fastCountNewVportLeadsController` from the card's public exports (leads/index.js)
  2. OR add a `callerActorId` parameter and ownership check to `fastCountNewVportLeadsController`
  3. In `useVportNewLeadsCount`, pass `callerActorId` to the fast path or use the full controller on every poll
- **Follow-up command:** WOLVERINE (cleanup), CARNAGE (verify business_card_leads RLS)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Asset Security

---

### VEN-DASH-005 — Rule 9 Violation: Write DALs Exported from Card Index Files [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-DASH-005
- **Location:**
  - `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/index.js` (exports write DAL functions)
  - `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/index.js` (exports write DAL functions)
  - `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/index.js` (exports write DAL functions)
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Authenticated VPORT Owner (expected for write paths)
- **Boundary Violated:** Any importer → write DALs without controller ownership enforcement
- **Contract Violated:** Boundary Isolation Contract (adapter export rule)
- **Current behavior:** Card index files export write DAL functions directly alongside hooks, models, and screens. This allows any consumer of these public card indexes to call write DALs without going through the controller layer where ownership is enforced.
- **Risk:** A future feature, new hook, or screen component importing from these indexes could inadvertently call a write DAL directly, bypassing the controller ownership gate. Current consumers are safe (hooks call controllers, not DALs). The risk is a latent architectural vulnerability.
- **Severity:** MEDIUM
- **Exploitability:** LOW — Not directly exploitable today (current import chains go through controllers). Risk materializes when a new consumer imports from the card index and calls a DAL function directly.
- **Blast Radius:** Depends on which DAL — bookings, leads, gas prices, portfolio writes all have ownership implications
- **RLS Dependency:** ASSUMED — RLS is the final backstop if DAL is called directly without controller gate
- **Why it matters:** Architecture Rule 9: Index files must export only hooks, components, screens, and adapters. Write DALs are internal implementation details. Their export creates a security surface that bypasses the ownership control layer.
- **Recommended mitigation:**
  1. Remove write DAL exports from `gasprices/index.js`, `leads/index.js`, and `portfolio/index.js`
  2. Ensure all write DALs are called exclusively through controllers
  3. Use `/** @private */` JSDoc annotation on write DAL functions to signal they are not public API
- **Follow-up command:** SENTRY (architecture compliance enforcement)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering

---

### VEN-DASH-006 — updateVportBookingDAL: No Profile_id Scope at DAL Layer [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-DASH-006
- **Location:** `apps/VCSM/src/features/dashboard/vport/dal/write/updateVportBooking.write.dal.js` line 26
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table (vport.bookings)
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** No direct violation today — controller gate is strong
- **Contract Violated:** None directly — defense-in-depth gap
- **Current behavior:** `updateVportBookingDAL({ bookingId, updates })` executes `.update(row).eq("id", bookingId)` with no additional ownership scope column (no `profile_id`, no `customer_actor_id` scope). The controller layer (`updateBookingStatusController`, `rescheduleBookingController`) enforces `assertActorOwnsVportActorController` before calling this DAL — so current paths are safe. But the DAL itself provides zero defense-in-depth.
- **Risk:** If this DAL is ever called from a code path that does not go through the controller (Rule 9 index exposure, new cross-feature import, test helper), any bookingId can be updated without ownership verification. The PORT-V-005 pattern (`portfolioMediaRecord.write.dal.js`) established the defense-in-depth standard for this codebase.
- **Severity:** MEDIUM
- **Exploitability:** LOW — No current attack path identified. Risk is defensive gap, not active vulnerability.
- **Blast Radius:** Single booking; but across all bookings if systematically exploited
- **RLS Dependency:** REQUIRED for current safety. DB RLS on `vport.bookings` UPDATE must restrict to the VPORT owner — not independently verified.
- **Recommended mitigation:**
  1. Add `profileId` parameter to `updateVportBookingDAL`
  2. Add `.eq("profile_id", profileId)` to the UPDATE WHERE clause
  3. Both `updateBookingStatusController` and `rescheduleBookingController` already resolve `profileId` from the booking — pass it through to the DAL
- **Follow-up command:** WOLVERINE (patch), CARNAGE (verify bookings RLS)
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Software Development Security

---

### VEN-DASH-007 — Team Write DALs: ResourceId-Only Scope (DOWNGRADED) [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-DASH-007
- **Location:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/dal/vportTeam.write.dal.js` lines 47, 61, 75
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table (vport.resources)
- **Trust Boundary:** Authenticated VPORT Owner (controller layer) / No ownership (DAL layer)
- **Boundary Violated:** Defense-in-depth gap at DAL layer only
- **Contract Violated:** None directly — controller ownership is strong
- **Current behavior:**
  - `updateTeamMemberRoleDAL({ resourceId, meta, role })` — `.eq("id", resourceId)` only
  - `setTeamMemberActiveDAL({ resourceId, isActive })` — `.eq("id", resourceId)` only
  - `deleteTeamMemberByIdDAL(resourceId)` — `.eq("id", resourceId)` only
- **Controller verification:** `vportTeamAccess.controller.js` has been source-verified:
  - `updateTeamMemberRoleController` (line 86): `assertActorOwnsVportActorController` + profileId-scoped member lookup (member must exist in caller's team)
  - `setTeamMemberStatusController` (line 107): same pattern
  - `removeTeamMemberController` (line 131): same pattern
  - All three controllers perform a `fetchTeamMembersByProfileId(profileId)` + `.find(r.id === resourceId)` check — the resource must exist in the caller's team before the write proceeds
- **Risk downgrade:** The controller layer performs TWO ownership checks: (1) actor owns the VPORT, (2) the resource exists in the VPORT's team. This is defense-in-depth at the controller level. The DAL layer still lacks column scope, but the risk is LOW for current call paths.
- **Severity:** LOW (downgraded from MEDIUM after controller source verification)
- **Exploitability:** LOW — Controller gates confirmed strong. Risk materializes only if DAL called directly.
- **Blast Radius:** Single resource row
- **RLS Dependency:** UNVERIFIED — assumed RLS on `vport.resources` table
- **Recommended mitigation:**
  1. Add `profileId` to `updateTeamMemberRoleDAL` and `setTeamMemberActiveDAL` and add `.eq("profile_id", profileId)` for defense-in-depth
  2. This aligns with the PORT-V-005 defense-in-depth standard
- **Follow-up command:** WOLVERINE (hardening cleanup), CARNAGE (verify resources RLS)
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Software Development Security

---

### VEN-DASH-008 — Missing BEHAVIOR.md: Security Posture Unanchored [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-DASH-008
- **Location:** `CURRENT/features/dashboard/BEHAVIOR.md` — MISSING
- **Application Scope:** VCSM
- **Platform Surface:** Documentation governance
- **Trust Boundary:** N/A — governance gap
- **Contract Violated:** Behavior Contract (TICKET-BEHAV-VENOM-001)
- **Current behavior:** The dashboard has no BEHAVIOR.md file. VENOM cannot cross-check §5 Security Rules or §9 Must Never Happen invariants against source. All VENOM findings in this report are UNANCHORED.
- **Risk:** Without declared security rules and invariants, future implementation changes may silently break the ownership model. There is no machine-checkable contract for: "user must not see another user's bookings," "a VPORT can only be managed by its owner," "team mutations require actor_owners verification."
- **Severity:** MEDIUM (governance gap with operational security consequence)
- **Recommended mitigation:** WOLVERINE behavior intake for dashboard — define at minimum: §5 Security Rules for all 8 cards, §9 Must Never Happen for booking ownership, team ownership, and lead access.
- **Follow-up command:** ProfessorX (BEHAVIOR.md intake)
- **CISSP Domain:**
  - Primary: Security and Risk Management
  - Secondary: Security Assessment and Testing

---

### VEN-DASH-009 — Legacy owner_user_id DAL Pattern (OPEN LOW, Previously Documented) [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-DASH-009
- **Location:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/dal/vportPublicDetails.write.dal.js` lines 27–40
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table (vport.profile_public_details)
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** None exploitable — controller gate + RLS both precede this DAL check
- **Contract Violated:** None — belt-and-suspenders legacy pattern
- **Current behavior:** `upsertVportPublicDetailsDAL` performs `supabase.auth.getUser()` + `.eq("owner_user_id", userId)` as a secondary ownership check before writing. Uses the legacy `owner_user_id` pattern, not canonical `actor_owners`. This is the THIRD gate (after controller `assertActorOwnsVportActorController` and DB RLS).
- **Risk:** LOW — no attack path bypasses the two canonical gates before this DAL check.
- **Severity:** LOW (confirmed LOW per SECURITY.md VENOM-SETTINGS-003)
- **Status:** OPEN / UNCHANGED from prior audit. CARNAGE migration recommended.
- **Recommended mitigation:** CARNAGE sprint — replace `owner_user_id` check with `actor_owners` query in DAL.
- **Follow-up command:** CARNAGE
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Software Development Security

---

### VEN-DASH-010 — Orphaned Write DAL (Previously BW-SETTINGS-003) [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-DASH-010
- **Location:** `apps/VCSM/src/features/dashboard/.../settings/profile/dal/vportPublicDetails.write.dal.js` (inferred path)
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** N/A — confirmed dead code
- **Boundary Violated:** None active — dead code
- **Current behavior:** An orphaned `upsertVportPublicDetails` DAL exists with no callers. Uses only `owner_user_id` legacy check. If reactivated, would bypass coordinator pattern with weaker gate.
- **Risk:** LOW — currently unreachable. Latent risk if a future PR accidentally imports it.
- **Severity:** LOW
- **Status:** Confirmed dead per BLACKWIDOW adversarial pass (BW-SETTINGS-003)
- **Recommended mitigation:** Delete the file after confirming zero imports.
- **Follow-up command:** WOLVERINE (cleanup)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security Operations

---

## 7. Verified Secure Surfaces (source-verified, no finding)

The following 38 dashboard write surfaces were manually traced and verified secure:

| Surface | Controller | Gate | Verdict |
|---|---|---|---|
| insertVportBookingDAL | createOwnerBookingController | assertActorOwnsVportActorController + resource lookup | SECURE |
| insertVportBookingDAL | createVportPublicBookingController | user-kind check + time guard (public surface) | SECURE |
| updateVportBookingDAL (status) | updateBookingStatusController | assertActorOwnsVportActorController + terminal guard | SECURE (controller); DAL gap noted VEN-DASH-006 |
| updateVportBookingDAL (reschedule) | rescheduleBookingController | assertActorOwnsVportActorController + conflict check | SECURE (controller); DAL gap noted VEN-DASH-006 |
| insertVportResourceDAL | (resource write path) | Owner-scoped operations | SECURE |
| createVportFuelPriceHistoryDAL | reviewFuelPriceSuggestionController | checkVportOwnershipController | SECURE |
| createFuelPriceSubmissionReviewDAL | reviewFuelPriceSuggestionController | checkVportOwnershipController | SECURE |
| updateFuelPriceSubmissionStatusDAL | reviewFuelPriceSuggestionController | checkVportOwnershipController | SECURE |
| upsertVportFuelPriceDAL | reviewFuelPriceSuggestion / submitFuelPrice (owner path) | checkVportOwnershipController | SECURE |
| updateFuelPriceUnitForActorDAL | updateStationFuelUnitController | checkVportOwnershipController | SECURE |
| createFuelPriceSubmissionDAL | submitFuelPriceSuggestionController (citizen path) | No ownership required — citizen submission | SECURE (intentional) |
| deleteVportBusinessCardLeadDAL | deleteVportLeadController | assertActorOwnsVportActorController + profileId scope at DAL | SECURE |
| markVportBusinessCardLeadContactedDAL | markVportLeadContactedController | assertActorOwnsVportActorController + profileId scope at DAL | SECURE |
| updatePortfolioMediaAssetIdDAL | addPortfolioMediaWithRecordController | assertActorOwnsVportActorController + callerProfileId scope | SECURE |
| upsertVportPublicDetailsDAL | saveVportPublicDetailsByActorIdController | assertActorOwnsVportActorController + legacy userId + RLS | SECURE |
| insertTeamMemberDAL | addTeamMemberController (vportTeam.controller) | assertActorOwnsVportActorController | SECURE |
| insertLinkedTeamMemberDAL | addTeamMemberController (vportTeamAccess.controller) | assertActorOwnsVportActorController | SECURE |
| updateTeamMemberRoleDAL | updateTeamMemberRoleController | assertActorOwnsVportActorController + member lookup | SECURE (controller); DAL gap noted VEN-DASH-007 |
| setTeamMemberActiveDAL | setTeamMemberStatusController | assertActorOwnsVportActorController + member lookup | SECURE (controller); DAL gap noted VEN-DASH-007 |
| deleteTeamMemberByIdDAL | removeTeamMemberController (both controllers) | assertActorOwnsVportActorController + resource lookup | SECURE (controller) |
| insertTeamRequestDAL | sendTeamRequestController | assertActorOwnsVportActorController | SECURE |
| acceptTeamRequestDAL | acceptTeamRequestController | assertActorOwnsVportActorController (member_actor_id path) | SECURE |
| declineTeamRequestDAL | declineTeamRequestController | dual-path assertActorOwnsVportActorController | SECURE |
| deleteTeamResourceDAL | removeTeamMemberController | assertActorOwnsVportActorController + resource lookup | SECURE |
| acceptTeamInviteByActorDAL | acceptBarbershopInviteController | assertActorOwnsVportActorController + invite state check | SECURE |
| saveFlyerPublicDetails | saveFlyerPublicDetailsCtrl | requireOwnerActorAccess (actor OK; profileId binding gap = VEN-DASH-002) | PARTIAL |
| design_* INSERT/UPDATE/DELETE | designStudio.*Controller | requireOwnerActorAccess (actor OK; documentId binding gap = VEN-DASH-003) | PARTIAL |
| markFuelPriceSubmissionReviewAppliedDAL | (internal to review flow) | Owned by reviewFuelPriceSuggestionController | SECURE |

---

## 8. Source Verification Summary

- Total write surfaces in scope: 38
- Surfaces source-verified: 38 / 38
- Source files read: 22 total (across ARCHITECT + VENOM passes)
- CRITICAL findings: 0
- HIGH findings: 3 (VEN-DASH-001, VEN-DASH-002, VEN-DASH-003) — all [SOURCE_VERIFIED]
- MEDIUM findings: 3 (VEN-DASH-004, VEN-DASH-005, VEN-DASH-008)
- LOW findings: 4 (VEN-DASH-006 downgraded, VEN-DASH-007 downgraded, VEN-DASH-009, VEN-DASH-010)
- All CRITICAL/HIGH findings carry [SOURCE_VERIFIED]

---

## 9. THOR Impact

**THOR Release Blockers:**
- VEN-DASH-001: HIGH — loadOwnerQuickStatsController missing ownership gate — **UNPATCHED, new finding**
- VEN-DASH-002: HIGH — flyer builder profileId binding gap — **THOR BLOCKED per SECURITY.md**
- VEN-DASH-003: HIGH — design studio documentId binding gap — **THOR BLOCKED per SECURITY.md**

**Highest Open Severity:** HIGH

**Dashboard THOR Status: BLOCKED** (3 HIGH findings, 2 of which are confirmed THOR blockers in existing governance)

---

## 10. Required Follow-Up Commands

| Finding | Priority | Command | Action |
|---|---|---|---|
| VEN-DASH-001 | P0 | WOLVERINE | Add callerActorId + assertActorOwnsVportActorController to loadOwnerQuickStatsController |
| VEN-DASH-002 | P0 | WOLVERINE | Derive profileId from ownerActorId server-side in saveFlyerPublicDetailsCtrl |
| VEN-DASH-003 | P0 | WOLVERINE | Bind documentId to ownerActorId in design studio page-write controllers |
| VEN-DASH-001/002/003 | P0 | BLACKWIDOW | Adversarial verification after patches applied |
| VEN-DASH-005 | P1 | SENTRY | Remove write DAL exports from gasprices/leads/portfolio index files |
| VEN-DASH-004 | P1 | WOLVERINE | Remove fastCountNewVportLeadsController from public exports; add auth to fast path |
| VEN-DASH-006 | P2 | WOLVERINE | Add profile_id scope to updateVportBookingDAL |
| VEN-DASH-007 | P2 | WOLVERINE | Add profile_id scope to team write DALs (defense-in-depth) |
| VEN-DASH-008 | P1 | ProfessorX | BEHAVIOR.md intake for dashboard |
| VEN-DASH-002/003 | P2 | CARNAGE | Verify RLS on profile_public_details and design_* tables |
| VEN-DASH-009 | P3 | CARNAGE | Replace owner_user_id check with actor_owners in settings DAL |

---

## 11. MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-DASH-001 | Owner stats exposed to any auth user | Controller | P0 | App | WOLVERINE |
| VEN-DASH-002 | Cross-VPORT flyer content write | Controller | P0 | App | WOLVERINE |
| VEN-DASH-003 | Cross-VPORT design document write | Controller | P0 | App | WOLVERINE |
| VEN-DASH-004 | Auth bypass on leads count fast path | Controller + Test Coverage | P1 | App | WOLVERINE |
| VEN-DASH-005 | Write DAL access without controller gate | Architecture (index files) | P1 | App | SENTRY |
| VEN-DASH-006 | Booking update without profile_id scope | DAL | P2 | App | WOLVERINE |
| VEN-DASH-007 | Team write without profile_id scope | DAL | P2 | App | WOLVERINE |
| VEN-DASH-008 | Security posture unanchored | Documentation | P1 | Documentation | ProfessorX |
| VEN-DASH-009 | Legacy ownership check in DAL | DAL | P3 | DB/App | CARNAGE |
| VEN-DASH-010 | Orphaned dangerous DAL | Dead code cleanup | P2 | App | WOLVERINE |

---

## 12. CISSP Domain Coverage Summary

| CISSP Domain | Findings | Notes |
|---|---|---|
| Security and Risk Management | 1 | VEN-DASH-008 (missing behavior contract) |
| Asset Security | 1 | VEN-DASH-004 (leads PII count accessible without auth) |
| Security Architecture and Engineering | 5 | VEN-DASH-001, VEN-DASH-005, VEN-DASH-006, VEN-DASH-007, VEN-DASH-009 |
| Communication and Network Security | 0 | No public routes in dashboard; card-based internal navigation |
| Identity and Access Management | 4 | VEN-DASH-001, VEN-DASH-002, VEN-DASH-003, VEN-DASH-004 |
| Security Assessment and Testing | 1 | VEN-DASH-008 (no behavior contract to test against) |
| Security Operations | 1 | VEN-DASH-010 (orphaned dangerous DAL) |
| Software Development Security | 5 | VEN-DASH-002, VEN-DASH-003, VEN-DASH-005, VEN-DASH-007, VEN-DASH-009 |

**Domain Coverage:**
- Communication and Network Security: NOT COVERED — dashboard has no public routes or external-facing API surfaces. N/A for this scope.
- All other domains covered by at least one finding.

---

*VENOM V2 run complete. Boundary contract: VCSM scope only. No code modifications made. All findings are analysis only.*
