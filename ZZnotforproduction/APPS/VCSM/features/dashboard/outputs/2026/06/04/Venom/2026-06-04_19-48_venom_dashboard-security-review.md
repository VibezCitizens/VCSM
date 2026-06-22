# VENOM V2 SECURITY REVIEW
## dashboard — Full Feature Security Audit

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | VCSM:dashboard |
| Feature | dashboard |
| Command | VENOM V2 |
| Ticket | TICKET-VENOM-DASHBOARD-0001 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_dashboard-security-review.md |
| Timestamp | 2026-06-04T19:48:00 |
| Reviewer | VENOM V2 |

---

## 1. VENOM Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                  | Generated At              | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Surfaces In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 38 | Primary attack surface inventory |
| rpc-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | RPC surface inventory |
| edge-function-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Edge function surface inventory |
| security-path-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 38 | Security path inventory |
| route-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Route→write chain resolution |
| write-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 38 | Write surface caller chain resolution |
| rpc-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | RPC caller chain resolution |
| edge-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Edge caller chain resolution |

Scanner Version: 1.1.0
Overall Preflight: FRESH
Preflight Action: PASSED
Total surfaces in scope: 38 write + 0 rpc + 0 edge
Total security paths in scope: 38
HIGH confidence paths (resolved): 0
LOW confidence paths (unresolved): 38

Note: All 38 security paths were LOW confidence (no route-confirmed path in scanner). Per Rule V-002, all received priority manual trace treatment.

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: dashboard
Scan Date: 2026-06-04T19:48:25.152Z

Write Surfaces: 38
  INSERT: 13 | UPDATE: 14 | DELETE: 8 | UPSERT: 3
  Tables affected:
    - profile_public_details (vport schema) — 2 surfaces (upsert ×2)
    - design_documents — 2 surfaces (insert, update)
    - design_pages — 4 surfaces (insert, update ×2, delete)
    - design_page_versions — 2 surfaces (insert, delete)
    - design_assets — 1 surface (insert)
    - design_exports — 2 surfaces (insert, delete)
    - design_render_jobs — 2 surfaces (insert, delete)
    - bookings — 2 surfaces (insert, update)
    - resources — 14 surfaces (insert ×5, update ×6, delete ×3)
    - fuel_price_history — 1 surface (insert)
    - fuel_price_submission_reviews — 2 surfaces (insert, update)
    - fuel_price_submissions — 2 surfaces (insert, update)
    - fuel_prices — 2 surfaces (update, upsert)
    - business_card_leads — 2 surfaces (delete, update)
    - portfolio_media — 1 surface (update)

RPC Calls: 0
Edge Functions: 0

Security Paths: 38
  HIGH confidence (caller chain resolved): 0
  LOW confidence (caller chain unresolved): 38
  Access=protected: 0 (per scanner)
  Access=public: 0 (per scanner)
  Access=unknown: 38

Execution Paths Resolved: 0 / 38 (all LOW — manual trace required and performed)
```

---

## 4. Scanner Signals

| Signal | Source Map | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|
| UPSERT profile_public_details — saveFlyerPublicDetails | write-surface-map | HIGH | YES — flyer.write.dal.js:3: profileId param only, no actorId binding | [SOURCE_VERIFIED] | VEN-DASHBOARD-001 |
| UPSERT profile_public_details — upsertVportPublicDetailsDAL | write-surface-map | HIGH | YES — vportPublicDetails.write.dal.js:27: dual ownership model (owner_user_id check in DAL, assertActorOwnsVportActorController in controller) | [SOURCE_VERIFIED] | VEN-DASHBOARD-002 |
| UPDATE bookings — updateVportBookingDAL | write-surface-map | HIGH | YES — updateVportBooking.write.dal.js:19: scoped to profileId, auth verified in controller | [SOURCE_VERIFIED] | VERIFIED_SAFE |
| INSERT bookings — insertVportBookingDAL | write-surface-map | HIGH | YES — insertVportBooking.write.dal.js:19: no actorId binding in DAL; controller-layer auth required | [SOURCE_VERIFIED] | VEN-DASHBOARD-003 |
| INSERT resources — insertVportResourceDAL | write-surface-map | HIGH | YES — vportResource.write.dal.js:5: raw INSERT, no ownerActorId binding, no controller found in scope | [SOURCE_VERIFIED] | VEN-DASHBOARD-004 |
| INSERT/UPDATE resources (team) — multiple | write-surface-map | HIGH | YES — vportTeam.write.dal.js + vportTeamInvite.write.dal.js: all scoped to profileId; controllers verified via assertActorOwnsVportActorController | [SOURCE_VERIFIED] | VERIFIED_SAFE |
| UPDATE/INSERT fuel_price_submissions | write-surface-map | HIGH | YES — reviewFuelPriceSuggestion.controller.js:48: ownership verified via checkVportOwnershipController | [SOURCE_VERIFIED] | VERIFIED_SAFE |
| UPDATE fuel_prices — updateFuelPriceUnitForActorDAL | write-surface-map | HIGH | YES — vportFuelPrices.write.dal.js:11: no session binding in DAL, actorId accepted as param; controller (updateStationFuelUnit.controller.js:11) verifies ownership | [SOURCE_VERIFIED] | VEN-DASHBOARD-005 |
| INSERT/UPDATE design_* surfaces — multiple | write-surface-map | HIGH | YES — designStudio.write.dal.js: no auth in DAL; all callers verified through requireOwnerActorAccess or requireDesignDocumentOwnerAccess | [SOURCE_VERIFIED] | VERIFIED_SAFE (controller layer) |
| DELETE business_card_leads / UPDATE business_card_leads | write-surface-map | HIGH | YES — vportLeads.write.dal.js: scoped to vport_profile_id; controller verifies assertActorOwnsVportActorController | [SOURCE_VERIFIED] | VERIFIED_SAFE |
| ownerUpdate flag in submitFuelPriceSuggestionController | hooks/useSubmitFuelPriceSuggestion.js | N/A | YES — useSubmitFuelPriceSuggestion.js:45: isOwner prop from UI, not re-verified at controller level for path selection | [SOURCE_VERIFIED] | VEN-DASHBOARD-006 |

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md
BEHAVIOR.md exists: YES
BEHAVIOR.md status: PLACEHOLDER
§5 Security Rules declared: 0
§5 Rules verified in source: N/A
§5 Rules unenforced: NONE (no rules declared)
§9 Must Never Happen declared: 0
§9 Invariants protected in source: N/A
§9 Invariants unprotected: NONE (no invariants declared)
```

BEHAVIOR.md exists but is a PLACEHOLDER with status "pending source review" — no §5 Security Rules and no §9 Must Never Happen invariants are declared. This is a governance gap: security posture cannot be fully anchored to a declared behavioral contract.

Finding: MISSING_BEHAVIOR_CONTRACT_CONTENT (HIGH) — BEHAVIOR.md file exists but contains no §5 or §9 content. All findings in this review are marked UNANCHORED to BEH IDs.

VENOM continues with available source evidence. All findings below are SOURCE_VERIFIED or SCANNER_LEAD where noted.

---

## 6. Trust Boundary Findings

---

### VEN-DASHBOARD-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-DASHBOARD-001
- Location: apps/VCSM/src/features/dashboard/flyerBuilder/dal/flyer.write.dal.js:3
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table (vport.profile_public_details)
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Authenticated VPORT Owner → Any Actor with profileId
- Contract Violated: Actor Ownership Contract
- Current behavior: saveFlyerPublicDetails({ profileId, patch }) accepts a raw profileId
  as input. The DAL performs no auth check, no actor_owners lookup, and no session binding.
  The caller supplies profileId directly. The controller (flyerEditor.controller.js:33)
  does call requireOwnerActorAccess(ownerActorId) before resolving profileId, which is
  correct. However, the DAL is exported and callable independently by any future caller
  that supplies an arbitrary profileId without triggering the controller gate.
- Risk: Any caller that imports saveFlyerPublicDetails and provides an arbitrary profileId
  can upsert public-facing flyer details (headline, phone, logo, URLs, hours) for any
  VPORT without passing the actor_owners gate. The protection is entirely app-layer
  (controller-only) with no DAL-layer or RLS backstop confirmed.
- Severity: MEDIUM
- Exploitability: MEDIUM
- Attack Preconditions:
  - Authenticated session
  - Knowledge of a target VPORT profileId (UUID)
  - Direct import of saveFlyerPublicDetails bypassing flyerEditor.controller.js
- Blast Radius: Any VPORT on the platform — public profile data (headline, phone_public,
  logo, hours, accent color) can be overwritten for any VPORT
- Identity Leak Type: None (write-side only)
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: UNVERIFIED — no RLS inspection performed on vport.profile_public_details;
  code relies entirely on controller-layer gate
- Why it matters: flyer content is public-facing marketing data. An attacker who bypasses
  the controller layer (e.g., via a future code path added without the gate, or direct
  import) can vandalize any VPORT's public flyer details.
- Recommended mitigation: Add a session-bound ownership check inside saveFlyerPublicDetails,
  or at minimum document clearly in the DAL file that this function MUST only be called
  via flyerEditor.controller.js. Preferred: route to DB to verify RLS on
  vport.profile_public_details covers upsert by authenticated user matching profile owner.
- Rationale: DAL-layer auth creates defense-in-depth. Controller-only gates create
  a single point of failure.
- Follow-up command: DB (verify RLS on vport.profile_public_details), ELEKTRA (source→sink patch advisory)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering, Software Development Security
```

---

### VEN-DASHBOARD-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-DASHBOARD-002
- Location: apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/dal/vportPublicDetails.write.dal.js:27-40
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table (vport.profile_public_details)
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract — dual-model ownership check inconsistency
- Contract Violated: Actor Ownership Contract
- Current behavior: upsertVportPublicDetailsDAL performs its own inline auth check:
  it calls supabase.auth.getUser() to get userId, then queries vport.profiles WHERE
  id = row.profile_id AND owner_user_id = userId. This is a user-ID-based ownership
  check inside the DAL. The calling controller (saveVportPublicDetailsByActorId.controller.js:58)
  ALSO calls assertActorOwnsVportActorController with actorId/requestActorId. Result:
  two separate, inconsistent ownership models are applied in series. The DAL uses
  owner_user_id (legacy user-centric model). The controller uses actor_owners table
  (canonical VCSM model).
- Risk: Inconsistency between ownership models creates maintenance risk. If the canonical
  actor_owners model diverges from owner_user_id (e.g., a VPORT is transferred, a delegate
  is added via actor_owners but not reflected in owner_user_id), the DAL check may reject
  legitimate callers who passed the canonical controller gate, or vice versa. More
  critically: the DAL check constitutes a secondary ownership gate that references a
  potentially stale/non-canonical model (owner_user_id), not actor_owners.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions:
  - Divergence between actor_owners and owner_user_id for a given VPORT
  - Authenticated session as a user with actor_owners entry but mismatched owner_user_id
- Blast Radius: VPORT settings updates (public details) — affects any VPORT where the
  two ownership models disagree
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: UNVERIFIED — the DAL adds its own app-layer check; RLS state unknown
- Why it matters: The platform's canonical ownership model is actor_owners. A DAL that
  duplicates ownership logic using a different identity model (owner_user_id) violates
  the single-responsibility principle and creates a security inconsistency that will
  be hard to audit and maintain.
- Recommended mitigation: Remove the inline ownership check from upsertVportPublicDetailsDAL.
  Rely exclusively on the controller-layer assertActorOwnsVportActorController call.
  Add RLS on vport.profile_public_details as the DB-layer backstop. The DAL should
  be a clean write operation scoped to profile_id, not a secondary auth surface.
- Rationale: Two ownership models applied in series on the same resource create
  inconsistency and a maintenance trap. The canonical model (actor_owners) should be
  authoritative.
- Follow-up command: DB (verify RLS, review owner_user_id vs actor_owners divergence), ELEKTRA
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering, Security and Risk Management
```

---

### VEN-DASHBOARD-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-DASHBOARD-003
- Location: apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/dal/insertVportBooking.write.dal.js:19
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table (vport.bookings)
- Trust Boundary: Authenticated Citizen / Authenticated VPORT Owner
- Boundary Violated: Booking Trust Contract — customer_actor_id injection surface
- Contract Violated: Booking Trust Contract, Actor Ownership Contract
- Current behavior: insertVportBookingDAL({ row }) accepts an entire row object and
  inserts all allowed fields including customer_actor_id and created_by_actor_id.
  The WRITE_COLS array permits both fields to flow in from the caller. The calling
  controller (vportPublicBooking.controller.js:82) correctly derives customer_actor_id
  from requestActorId (line 82) with a clear comment about VPD-V-019. The createOwnerBooking
  controller (line 57) correctly omits customer_actor_id. However: the DAL exports
  insertVportBookingDAL as a generic row-accept function. Any caller with access to
  this export can supply an arbitrary customer_actor_id.
- Risk: A caller that imports insertVportBookingDAL directly can create a booking
  attributed to any actor, effectively injecting booking identity. The only protection
  is controller-layer convention, not DAL or RLS enforcement. The booking's
  customer_actor_id field is used to drive notifications, ownership in the customer's
  booking history, and cancellation rights (isCustomer check in updateBookingStatusController).
- Severity: MEDIUM
- Exploitability: MEDIUM
- Attack Preconditions:
  - Authenticated session
  - Direct import of insertVportBookingDAL (bypasses controller)
  - Knowledge of a target actor ID to inject as customer_actor_id
- Blast Radius: Booking records for any VPORT — attacker can create bookings attributed
  to arbitrary actors, polluting their booking history and notification inbox
- Identity Leak Type: Booking identity exposure
- Cache Trust Type: Booking-sensitive
- RLS Dependency: UNVERIFIED — if RLS does not enforce customer_actor_id matches auth.uid(),
  this is exploitable at the DB layer too
- Why it matters: customer_actor_id drives cancellation rights (isCustomer path in
  updateBookingStatusController). A booking created with a forged customer_actor_id
  gives the injected actor the ability to cancel, and sends notifications to that actor.
- Recommended mitigation: In insertVportBookingDAL, strip customer_actor_id and
  created_by_actor_id from WRITE_COLS. These should be derived server-side (session auth)
  and never accepted from the row input. Alternatively: route to DB/Carnage to add RLS
  enforcing customer_actor_id = auth.uid() on INSERT.
- Rationale: Attribution fields (customer_actor_id, created_by_actor_id) must be
  session-derived, not caller-provided.
- Follow-up command: DB (RLS audit on vport.bookings INSERT), SPIDER-MAN (regression coverage for attribution injection), ELEKTRA
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security, Security Architecture and Engineering
```

---

### VEN-DASHBOARD-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-DASHBOARD-004
- Location: apps/VCSM/src/features/dashboard/vport/dal/write/vportResource.write.dal.js:5
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table (vport.resources)
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract — unrestricted resources INSERT
- Contract Violated: Actor Ownership Contract
- Current behavior: insertVportResourceDAL({ row }) accepts a full row object and
  inserts it with no ownership verification, no session binding, and no actor check.
  The only validation is that row.profile_id is present. No controller calling this
  function was found within the dashboard feature scope; it is exposed as an exported
  function from a shared vport DAL write module. The team-specific DALs
  (insertTeamMemberDAL, insertLinkedTeamMemberDAL) have their own inserts and are
  called through verified controllers. insertVportResourceDAL appears to be a generic
  low-level write surface with no caller chain resolved.
- Risk: This is a SCANNER_LOW_CONF surface per the LOW Confidence Review Protocol —
  the caller chain was not resolved by scanner, and manual trace found no controller
  calling this function in scope. A fully generic resources INSERT with only a
  profile_id guard creates a surface that any authenticated caller can use to insert
  arbitrary resource records (staff, equipment, etc.) for any profile_id they supply.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions:
  - Authenticated session
  - Knowledge of a target VPORT profile_id
  - Direct import of insertVportResourceDAL
  - No RLS on vport.resources to prevent unauthorized INSERT
- Blast Radius: Any VPORT's resource/team roster — arbitrary staff/resource records
  can be inserted under any VPORT profile
- Identity Leak Type: None (write-only)
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — no RLS verification performed on vport.resources;
  code places no restriction other than profile_id presence
- Why it matters: vport.resources controls team membership, bookable staff, and
  availability. Unauthorized INSERT could add phantom staff to any VPORT's team roster,
  enabling availability manipulation or confusion for customers booking through the platform.
- Recommended mitigation: Either remove insertVportResourceDAL as a standalone export
  (replace with domain-specific insert functions that bind ownerActorId and verify
  actor_owners), or add a session-authenticated ownership check before the insert.
  Immediate action: route to DB to verify RLS on vport.resources INSERT.
- Rationale: Generic write functions that accept arbitrary row input without ownership
  verification are architectural gaps that become exploitable as the codebase grows.
- Follow-up command: DB (RLS audit on vport.resources INSERT), ELEKTRA (trace callers)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security, Security Architecture and Engineering
```

---

### VEN-DASHBOARD-005

```
VENOM SECURITY FINDING
- Finding ID: VEN-DASHBOARD-005
- Location: apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPrices.write.dal.js:11
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table (vport.fuel_prices)
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract — actorId accepted as DAL parameter
- Contract Violated: Actor Ownership Contract
- Current behavior: updateFuelPriceUnitForActorDAL({ actorId, unit }) accepts actorId
  as a direct parameter, resolves the profileId internally, and performs UPDATE on
  fuel_prices with no session check. The calling controller
  (updateStationFuelUnit.controller.js) does verify ownership via
  checkVportOwnershipController before calling the DAL. However, the DAL exports
  the function with actorId as a parameter — any caller that imports this function
  and passes a different actorId can trigger fuel unit updates for any VPORT
  without going through the ownership gate.
- Risk: Any code path that calls updateFuelPriceUnitForActorDAL directly with an
  arbitrary actorId bypasses the ownership check entirely. The protection is
  controller-layer only. This is a weaker version of the Actor Ownership Contract
  violation seen in VEN-DASHBOARD-001.
- Severity: LOW
- Exploitability: LOW
- Attack Preconditions:
  - Authenticated session
  - Direct import of updateFuelPriceUnitForActorDAL
  - Bypassing updateStationFuelUnit.controller.js
  - Impact: toggling fuel price unit (liter/gallon) for any VPORT
- Blast Radius: Fuel price display for any VPORT — unit toggled without owner consent
- Identity Leak Type: None
- Cache Trust Type: Financial-sensitive (unit affects price display)
- RLS Dependency: UNVERIFIED
- Why it matters: Fuel pricing is public-facing commercial data. Unit manipulation
  (liter vs gallon) affects displayed prices and could create consumer confusion.
- Recommended mitigation: Harden controller gate by verifying the DAL cannot be
  misused. Add ownerActorId binding inside the DAL alongside the actorId resolution,
  or route the update through a session-anchored RPC. Document the caller contract
  explicitly in the function signature.
- Rationale: Hardening — low direct risk but architecture drift if additional callers
  are added.
- Follow-up command: DB (RLS on vport.fuel_prices UPDATE), ELEKTRA
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Identity and Access Management
```

---

### VEN-DASHBOARD-006

```
VENOM SECURITY FINDING
- Finding ID: VEN-DASHBOARD-006
- Location: apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/hooks/useSubmitFuelPriceSuggestion.js:45
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen / Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract — client-side isOwner prop controls
  server-side path selection
- Contract Violated: Actor Ownership Contract, Booking Trust Contract (parallel pattern)
- Current behavior: The hook useSubmitFuelPriceSuggestion receives isOwner as a prop
  from the parent screen (line 14). It passes ownerUpdate: isOwner directly to
  submitFuelPriceSuggestionController (line 45). The controller uses this flag to
  select between the citizen suggestion pipeline and the owner direct-write pipeline
  (submitOwnerFuelPriceUpdateController). The ownerUpdate flag determines whether
  the write is a queue-able citizen suggestion (pending review) or an immediate
  official price update. The ownership re-verification (checkVportOwnershipController)
  IS performed inside submitOwnerFuelPriceUpdateController before any write. However:
  the isOwner prop flows from a client-side hook (useVportOwnership) via screen props.
  A client-side isOwner=true with no server-side re-check at the submitFuelPriceSuggestion
  controller level means the path-selection gate is client-influenced.
  NOTE: The server-side re-check does exist inside submitOwnerFuelPriceUpdateController —
  the attack surface is narrow. The risk is that the ownerUpdate flag bypasses the
  citizen sanity checks (pending review pipeline) and goes straight to official price write,
  with the only backstop being the checkVportOwnershipController inside the sub-controller.
- Risk: A non-owner citizen who can influence the isOwner prop (e.g., through state
  manipulation, component prop injection in a future refactor, or by calling the
  controller directly with ownerUpdate: true) would have their submission routed to
  the official price write pipeline. Because checkVportOwnershipController re-verifies
  ownership server-side, the write itself is blocked if not actually an owner. The
  risk is path-selection manipulation, not data corruption — currently mitigated
  by the server-side re-check.
- Severity: LOW
- Exploitability: LOW
- Attack Preconditions:
  - Non-owner citizen who can manipulate ownerUpdate=true at hook or controller call site
  - checkVportOwnershipController returns false (blocks the write) — so actual data
    mutation is prevented
  - Risk is architectural: future callers of submitFuelPriceSuggestionController that
    pass ownerUpdate=true without server-side re-verification downstream
- Blast Radius: Gas price path-selection only; actual price mutation blocked by
  checkVportOwnershipController
- Identity Leak Type: None
- Cache Trust Type: Financial-sensitive
- RLS Dependency: NONE (risk is app-layer path selection)
- Why it matters: Path-selection logic controlled by client state is an architectural
  pattern that can degrade over time. The current server-side re-check provides
  adequate protection, but the pattern should be documented and hardened to prevent
  future callers from omitting the re-check.
- Recommended mitigation: Add an explicit server-side ownership check inside
  submitFuelPriceSuggestionController before routing to the ownerUpdate path.
  This removes reliance on the sub-controller's internal check as the sole gate,
  creating defense-in-depth at the routing layer. One-line fix: call
  checkVportOwnershipController when ownerUpdate is true, before delegating.
- Rationale: Architectural defense-in-depth: ownership verification should occur
  at the routing point, not only inside the sub-controller.
- Follow-up command: ELEKTRA (propose concrete patch at submitFuelPriceSuggestion.controller.js)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering
```

---

### VEN-DASHBOARD-007 (Behavior Contract Gap)

```
VENOM SECURITY FINDING
- Finding ID: VEN-DASHBOARD-007
- Location: ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Documentation / Governance
- Trust Boundary: N/A
- Boundary Violated: N/A — governance gap
- Contract Violated: VENOM Behavior Contract Integration Protocol
- Current behavior: BEHAVIOR.md exists at the expected path but contains only a
  PLACEHOLDER stub with Status: PLACEHOLDER and the note "Behavior contract pending
  source review." No §5 Security Rules are declared. No §9 Must Never Happen
  invariants are declared. The dashboard feature manages critical write surfaces:
  bookings, team membership, fuel prices, VPORT public details, design documents,
  and business card leads.
- Risk: Without declared §5 Security Rules, VENOM cannot anchor findings to a
  behavioral contract. Without §9 invariants, SPIDER-MAN has no test targets for
  hard security invariants (e.g., "a non-owner must never be able to modify booking
  status", "fuel price official write must always verify ownership").
- Severity: MEDIUM
- Exploitability: N/A
- Attack Preconditions: N/A
- Blast Radius: All 38 write surfaces in the dashboard feature lack behavioral
  contract coverage
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The dashboard feature is one of the most write-intensive features
  in the platform (38 write surfaces, 7 sub-cards). Behavioral contracts are the
  contract-level anchors for security governance. Their absence means future regressions
  cannot be caught by contract-driven testing.
- Recommended mitigation: Route to WOLVERINE for intake. Populate BEHAVIOR.md §5
  Security Rules and §9 Must Never Happen for each sub-card: bookings, team,
  gasprices, leads, settings, flyerBuilder, designStudio.
- Rationale: Security posture requires declared invariants to be testable and auditable.
- Follow-up command: WOLVERINE (intake), SPIDER-MAN (test coverage after BEH declared)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Security Assessment and Testing
  - Secondary: Security and Risk Management, Software Development Security
```

---

## Verified Safe Surfaces (Non-Finding)

The following write surfaces were source-verified and found to have adequate app-layer ownership enforcement:

| Surface | Controller | Ownership Gate | Status |
|---|---|---|---|
| updateVportBookingDAL | updateVportBooking.controller.js | assertActorOwnsVportActorController + customer path | VERIFIED_SAFE |
| insertVportBookingDAL (owner path) | createOwnerBooking.controller.js | assertActorOwnsVportActorController | VERIFIED_SAFE |
| insertVportBookingDAL (public path) | vportPublicBooking.controller.js | actor kind check, server-side label resolution, VPD-V-019 | VERIFIED_SAFE |
| insertTeamMemberDAL | vportTeam.controller.js:addTeamMemberController | assertActorOwnsVportActorController | VERIFIED_SAFE |
| insertLinkedTeamMemberDAL | vportTeamAccess.controller.js:addTeamMemberController | assertActorOwnsVportActorController | VERIFIED_SAFE |
| updateTeamMemberRoleDAL | vportTeamAccess.controller.js | assertActorOwnsVportActorController | VERIFIED_SAFE |
| setTeamMemberActiveDAL | vportTeamAccess.controller.js | assertActorOwnsVportActorController | VERIFIED_SAFE |
| deleteTeamMemberByIdDAL | vportTeamAccess.controller.js | assertActorOwnsVportActorController | VERIFIED_SAFE |
| insertTeamRequestDAL | vportTeam.controller.js:sendTeamRequestController | assertActorOwnsVportActorController | VERIFIED_SAFE |
| acceptTeamRequestDAL | vportTeamInvite.controller.js | assertActorOwnsVportActorController (member path) | VERIFIED_SAFE |
| declineTeamRequestDAL | vportTeamInvite.controller.js | dual-path ownership check (ELEK-002 compliant) | VERIFIED_SAFE |
| acceptTeamInviteByActorDAL | vportTeamInvite.controller.js | assertActorOwnsVportActorController + state guard | VERIFIED_SAFE |
| deleteTeamResourceDAL | vportTeam.controller.js:removeTeamMemberController | assertActorOwnsVportActorController | VERIFIED_SAFE |
| markVportBusinessCardLeadContactedDAL | vportLeads.controller.js | assertActorOwnsVportActorController | VERIFIED_SAFE |
| deleteVportBusinessCardLeadDAL | vportLeads.controller.js | assertActorOwnsVportActorController | VERIFIED_SAFE |
| updatePortfolioMediaAssetIdDAL | (caller not found in scope) | callerProfileId scoping in DAL | PARTIAL — callerProfileId used not actorId |
| upsertVportFuelPriceDAL | submitOwnerFuelPriceUpdate.controller.js | checkVportOwnershipController | VERIFIED_SAFE (via controller) |
| createFuelPriceSubmissionDAL | submitCitizenFuelPriceSuggestion.controller.js | sanity checks, profile resolution | VERIFIED_SAFE |
| createFuelPriceSubmissionReviewDAL | reviewFuelPriceSuggestion.controller.js | checkVportOwnershipController | VERIFIED_SAFE |
| updateFuelPriceSubmissionStatusDAL | reviewFuelPriceSuggestion.controller.js | checkVportOwnershipController | VERIFIED_SAFE |
| markFuelPriceSubmissionReviewAppliedDAL | reviewFuelPriceSuggestion.controller.js | checkVportOwnershipController | VERIFIED_SAFE |
| createVportFuelPriceHistoryDAL | submitOwnerFuelPriceUpdate / reviewFuelPriceSuggestion controllers | checkVportOwnershipController | VERIFIED_SAFE |
| dalCreateDesignDocument | designStudio.load.controller.js | requireOwnerActorAccess | VERIFIED_SAFE |
| dalCreateDesignPage | designStudio.load/pages.controller.js | requireDesignDocumentOwnerAccess | VERIFIED_SAFE |
| dalCreateDesignPageVersion | designStudio.pages.controller.js | requireDesignDocumentOwnerAccess | VERIFIED_SAFE |
| dalCreateDesignAsset | designStudio.assetsExports.controller.js | requireOwnerActorAccess | VERIFIED_SAFE |
| dalCreateDesignExport | designStudio.assetsExports.controller.js | requireDesignDocumentOwnerAccess | VERIFIED_SAFE |
| dalCreateDesignRenderJob | designStudio.assetsExports.controller.js | requireDesignDocumentOwnerAccess | VERIFIED_SAFE |
| dalTouchDesignDocument | designStudio.pages/load.controller.js | requireOwnerActorAccess / requireDesignDocumentOwnerAccess | VERIFIED_SAFE |
| dalUpdateDesignPageCurrentVersion | designStudio.pages.controller.js | requireDesignDocumentOwnerAccess | VERIFIED_SAFE |
| dalClearDesignPageCurrentVersion | designStudio.pages.controller.js | requireDesignDocumentOwnerAccess | VERIFIED_SAFE |
| dalDeleteDesignPageVersionsByPageId | designStudio.pages.controller.js | requireDesignDocumentOwnerAccess | VERIFIED_SAFE |
| dalDeleteDesignExportsByPageId | designStudio.pages.controller.js | requireDesignDocumentOwnerAccess | VERIFIED_SAFE |
| dalDeleteDesignRenderJobsByPageId | designStudio.pages.controller.js | requireDesignDocumentOwnerAccess | VERIFIED_SAFE |
| dalDeleteDesignPageById | designStudio.pages.controller.js | requireDesignDocumentOwnerAccess | VERIFIED_SAFE |
| saveVportPublicDetailsByActorIdController | (is itself the controller) | assertActorOwnsVportActorController | VERIFIED_SAFE (controller) |

---

## 7. Source Verification Summary

```
Total surfaces in scope: 38
Surfaces source-verified: 38 / 38
Source files read: 
  - flyer.write.dal.js
  - designStudio.write.dal.js
  - updateVportBooking.write.dal.js
  - insertVportBooking.write.dal.js
  - vportResource.write.dal.js
  - vportFuelPriceReviews.write.dal.js
  - vportFuelPrices.write.dal.js
  - vportFuelPriceSubmissions.write.dal.js
  - vportFuelPriceHistory.write.dal.js
  - vportLeads.write.dal.js
  - portfolioMediaRecord.write.dal.js
  - vportPublicDetails.write.dal.js
  - vportTeam.write.dal.js
  - vportTeamInvite.write.dal.js
  - flyerEditor.controller.js
  - designStudio.shared.controller.js
  - designStudio.assetsExports.controller.js
  - designStudio.pages.controller.js
  - designStudio.load.controller.js
  - updateVportBooking.controller.js
  - createOwnerBooking.controller.js
  - vportPublicBooking.controller.js
  - vportTeam.controller.js
  - vportTeamAccess.controller.js
  - vportTeamInvite.controller.js
  - vportLeads.controller.js
  - reviewFuelPriceSuggestion.controller.js
  - submitFuelPriceSuggestion.controller.js
  - submitOwnerFuelPriceUpdate.controller.js
  - submitCitizenFuelPriceSuggestion.controller.js
  - updateStationFuelUnit.controller.js
  - saveVportPublicDetailsByActorId.controller.js
  - useSubmitFuelPriceSuggestion.js
  - bookings/index.js
  - BEHAVIOR.md

CRITICAL findings: 0
HIGH findings: 1 — all [SOURCE_VERIFIED]: YES
MEDIUM findings: 3 — all [SOURCE_VERIFIED]: YES
LOW findings: 2 — all [SOURCE_VERIFIED]: YES
MEDIUM (governance): 1 — [SOURCE_VERIFIED]: YES
```

---

## 8. Confidence Summary

```
HIGH confidence surfaces: 38 (all write surfaces — scanner confidence HIGH)
LOW confidence security paths: 38 (scanner could not resolve route chains)
[SOURCE_VERIFIED] findings: 7 / 7
[SCANNER_LEAD] findings: 0
[SCANNER_LOW_CONF] findings: 0
[SCANNER_STALE] findings: 0
```

All 7 findings are SOURCE_VERIFIED. All 38 LOW confidence security paths were manually traced per Rule V-002. No findings rely solely on scanner confidence.

---

## 9. THOR Impact

```
THOR Release Blockers: NONE
Highest Open Severity: HIGH (VEN-DASHBOARD-004)

VEN-DASHBOARD-004 (HIGH) — insertVportResourceDAL: unrestricted resources INSERT
  with no ownership gate and no resolved caller chain. Requires DB RLS audit before
  risk can be downgraded.

VEN-DASHBOARD-001 (MEDIUM) — saveFlyerPublicDetails: controller-only gate, no DAL
  or RLS backstop confirmed.

VEN-DASHBOARD-002 (MEDIUM) — upsertVportPublicDetailsDAL: dual ownership model
  inconsistency (owner_user_id vs actor_owners).

VEN-DASHBOARD-003 (MEDIUM) — insertVportBookingDAL: customer_actor_id and
  created_by_actor_id accepted from caller row input.

VEN-DASHBOARD-007 (MEDIUM) — BEHAVIOR.md is a PLACEHOLDER — no §5/§9 declared.

VEN-DASHBOARD-005 (LOW) — updateFuelPriceUnitForActorDAL: actorId accepted as param.

VEN-DASHBOARD-006 (LOW) — ownerUpdate flag controlled by client-side isOwner prop.
```

THOR may proceed. No CRITICAL findings. No release blockers identified for current sprint. HIGH finding (VEN-DASHBOARD-004) requires DB follow-up but is not a sprint blocker if RLS is in place on vport.resources.

---

## 10. Required Follow-Up Commands

| Priority | Command | Reason |
|---|---|---|
| P1 | DB | Verify RLS on vport.resources INSERT — VEN-DASHBOARD-004 (HIGH). If RLS absent, escalate to P0. |
| P1 | DB | Verify RLS on vport.profile_public_details UPSERT — VEN-DASHBOARD-001, VEN-DASHBOARD-002. |
| P1 | DB | Verify RLS on vport.bookings INSERT for customer_actor_id enforcement — VEN-DASHBOARD-003. |
| P2 | ELEKTRA | Source→sink patch advisory for VEN-DASHBOARD-001, VEN-DASHBOARD-003, VEN-DASHBOARD-004, VEN-DASHBOARD-006. |
| P2 | SPIDER-MAN | Regression test coverage: ownership bypass on insertVportResourceDAL, booking attribution injection, fuel price path-selection. |
| P3 | WOLVERINE | Intake for BEHAVIOR.md population — VEN-DASHBOARD-007. Dashboard is a high-priority feature for §5/§9 declaration. |
| P3 | CARNAGE | If DB audit confirms RLS absent on vport.resources or vport.bookings, migration planning required. |

---

## 11. MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-DASHBOARD-004 | Unrestricted resources INSERT — no ownership gate | RLS + DAL | P1 | DB + App | DB, ELEKTRA |
| VEN-DASHBOARD-001 | saveFlyerPublicDetails: controller-only gate, no DAL/RLS backstop | RLS + DAL | P2 | DB + App | DB, ELEKTRA |
| VEN-DASHBOARD-003 | Booking customer_actor_id injection via row input | DAL + RLS | P2 | App + DB | DB, ELEKTRA, SPIDER-MAN |
| VEN-DASHBOARD-002 | Dual ownership model (owner_user_id vs actor_owners) in settings DAL | DAL | P2 | App | DB, ELEKTRA |
| VEN-DASHBOARD-007 | BEHAVIOR.md placeholder — no §5/§9 declared | Documentation | P2 | Documentation | WOLVERINE |
| VEN-DASHBOARD-006 | ownerUpdate path-selection via client-side isOwner prop | Controller | P3 | App | ELEKTRA |
| VEN-DASHBOARD-005 | updateFuelPriceUnitForActorDAL: actorId param (no session binding) | DAL | P3 | App | ELEKTRA |

---

## 12. CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VEN-DASHBOARD-007 — governance gap, no behavioral contract |
| Asset Security | 0 | No sensitive data overfetch found; leads/PII access is owner-gated |
| Security Architecture and Engineering | 5 | VEN-001 through VEN-006 all touch architectural trust boundary design |
| Communication and Network Security | 0 | No edge functions, no public RPC surfaces in this feature |
| Identity and Access Management | 4 | VEN-001, VEN-002, VEN-003, VEN-004 — ownership gaps, dual models, attribution injection |
| Security Assessment and Testing | 1 | VEN-DASHBOARD-007 — no behavioral contract = no test anchors |
| Security Operations | 0 | No debug leakage, no audit trail gaps found |
| Software Development Security | 4 | VEN-003, VEN-004, VEN-005, VEN-006 — DAL-layer input trust, generic write exports |

### CISSP Domain Coverage Notes

- **Communication and Network Security**: Not applicable — this feature has no edge functions, no public RPCs, and no direct API surface. Traffic flows through Supabase row-level client calls only.
- **Asset Security**: Covered by source inspection — no overfetching of PII found in write surfaces. Leads data is owner-gated. No private data fields returned in write SELECT columns beyond what callers need.
- **Security Operations**: No debug leakage, console.log production exposure, or unsafe error payloads found in any controller or DAL reviewed.
- All 8 CISSP domains were evaluated; 5 have active coverage, 3 were not applicable for this feature's surface area.
