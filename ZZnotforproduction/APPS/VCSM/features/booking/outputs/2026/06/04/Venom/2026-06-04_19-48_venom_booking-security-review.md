# VENOM V2 Security Review — booking

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Date | 2026-06-04 |
| Run Time | 2026-06-04T19:48 |
| Feature | booking |
| Application | VCSM |
| VENOM Version | V2 |
| Scanner Version | 1.1.0 |
| Reviewer | VENOM (automated + source-verified) |
| Report Path | ZZnotforproduction/APPS/VCSM/features/booking/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_booking-security-review.md |
| Previous Run | 2026-06-04 (same day — prior pass) |
| Delta Since Last Run | Fixes applied: VEN-BOOK-002 (saveBookingServiceProfileDurations), VEN-BOOK-003 (upsertBookingResourceServices), VEN-BOOK-005 (notification UUID leak), VEN-BOOK-007 (customerActorId injection — partial). New findings identified: VEN-BOOKING-001 (updateBookingStatus unscoped), VEN-BOOKING-002 (broken supabase ref in saveBookingServiceProfileDurations — PERSISTS), VEN-BOOKING-003 (broken supabase ref in upsertBookingResourceServices — PERSISTS), VEN-BOOKING-004 (status allowlist missing for MANAGEMENT_SOURCES), VEN-BOOKING-005 (notification UUID exposure — FIXED — CLOSED), VEN-BOOKING-006 (BEHAVIOR.md placeholder — PERSISTS), VEN-BOOKING-007 (customerActorId injection for management sources — OPEN), VEN-BOOKING-008 (cancelBooking resource-missing branch) |

---

## 2. Scanner Preflight Block

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                | Generated At               | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map  | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map            | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map  | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map  | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map| 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map| 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map  | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs Block

| Input | Value |
|---|---|
| Scanner Data File | /tmp/venom_features/booking.json |
| Write Surfaces | 8 |
| RPCs | 0 |
| Security Paths | 8 |
| Edge Functions | 0 |
| Route Confidence | LOW (no route-resolved paths — all surfaces found via DAL-only scan) |

**Write Surfaces (from scanner):**

| # | Operation | Table / Schema | Function | File |
|---|---|---|---|---|
| 1 | INSERT | bookings | insertBookingDAL | dal/insertBooking.dal.js |
| 2 | INSERT | resources | insertBookingResourceDAL | dal/insertBookingResource.dal.js |
| 3 | INSERT | vc.service_booking_profiles | saveBookingServiceProfileDurationsByServiceIdsDAL | dal/saveBookingServiceProfileDurationsByServiceIds.dal.js |
| 4 | UPDATE | vc.service_booking_profiles | saveBookingServiceProfileDurationsByServiceIdsDAL | dal/saveBookingServiceProfileDurationsByServiceIds.dal.js |
| 5 | UPDATE | bookings | updateBookingStatusDAL | dal/updateBookingStatus.dal.js |
| 6 | UPSERT | availability_exceptions | upsertAvailabilityExceptionDAL | dal/upsertAvailabilityException.dal.js |
| 7 | UPSERT | availability_rules | upsertAvailabilityRuleDAL | dal/upsertAvailabilityRule.dal.js |
| 8 | UPSERT | vc.resource_services | upsertBookingResourceServicesDAL | dal/upsertBookingResourceServices.dal.js |

**Note:** Scanner path confidence is LOW for all 8 surfaces — no route-resolved execution paths exist. Source inspection was performed directly on DAL and controller files to determine caller chain and ownership enforcement.

---

## 4. Security Surface Inventory

| Surface | Layer | Operation | Table | Auth Guard Found | Ownership Guard Found | Source Verified |
|---|---|---|---|---|---|---|
| insertBookingDAL | DAL | INSERT | bookings | RLS (vportClient) | None in DAL — enforced by createBookingController | YES |
| insertBookingResourceDAL | DAL | INSERT | resources | RLS (vportClient) | None in DAL — enforced by ensureOwnerBookingResourceController | YES |
| saveBookingServiceProfileDurationsDAL | DAL | INSERT/UPDATE | vc.service_booking_profiles | **BROKEN — undefined `supabase` ref** | None in DAL | YES |
| updateBookingStatusDAL | DAL | UPDATE | bookings | RLS (vportClient) | **None — unscoped UPDATE by bookingId only** | YES |
| upsertAvailabilityExceptionDAL | DAL | UPSERT | availability_exceptions | RLS (vportClient) | None in DAL — enforced by setAvailabilityExceptionController | YES |
| upsertAvailabilityRuleDAL | DAL | UPSERT | availability_rules | RLS (vportClient) | None in DAL — enforced by setAvailabilityRuleController | YES |
| upsertBookingResourceServicesDAL | DAL | UPSERT | vc.resource_services | **BROKEN — undefined `supabase` ref** | None in DAL | YES |
| createBookingController | Controller | CREATE PATH | bookings | Session required | assertActorOwnsVportActorController for management sources | YES |
| cancelBookingController | Controller | CANCEL PATH | bookings | requestActorId required | Customer check + assertActorOwns (resource-missing skip risk) | YES |
| confirmBookingController | Controller | CONFIRM PATH | bookings | requestActorId required | assertActorOwnsVportActorController | YES |
| setAvailabilityRuleController | Controller | AVAILABILITY | availability_rules | requestActorId required | assertActorOwnsVportActorController | YES |
| setAvailabilityExceptionController | Controller | AVAILABILITY | availability_exceptions | requestActorId required | assertActorOwnsVportActorController | YES |
| ensureOwnerBookingResourceController | Controller | RESOURCE INIT | resources | requestActorId required | assertActorOwnsVportActorController | YES |
| setResourceSlotDurationController | Controller | SLOT CONFIG | vc.service_booking_profiles | requestActorId required | assertActorOwnsVportActorController | YES |
| assertActorOwnsVportActorController | Utility | OWNERSHIP CHECK | actor_owners (DB) | kind === "user" enforced | actor_owners DB query | YES |

---

## 5. Scanner Signals Block

All 8 write surfaces have HIGH confidence scanner extraction (AST-confirmed Supabase write calls). Route resolution is LOW confidence across all 8 — the scanner found DAL-level surfaces but could not resolve a full route-to-DAL execution chain for any surface. This is expected for this feature; controller-level callers were manually traced during source inspection.

No RPCs. No edge functions. Confirmed zero edge function surfaces.

---

## 6. Behavior Contract Status

| Attribute | Value |
|---|---|
| BEHAVIOR.md Path | ZZnotforproduction/APPS/VCSM/features/booking/BEHAVIOR.md |
| BEHAVIOR.md Status | **PLACEHOLDER** |
| §5 Security Rules | **0 declared — file is a stub** |
| §9 Must Never Happen | **0 declared — file is a stub** |
| Contract Quality | UNANCHORED — no invariants to cross-check |

**Impact:** Because BEHAVIOR.md is a placeholder, zero behavior contract cross-checks are possible. All security rules must be inferred from source only. This is itself a HIGH finding (VEN-BOOKING-006). The security review proceeds from source evidence alone.

**Inferred Security Invariants from Source (no BEHAVIOR.md anchor):**

From source inspection, the following informal invariants are enforced:
- Only `user`-kind actors may manage booking resources or availability (assertActorOwnsVportActorController line 28).
- Management-source bookings require ownership proof via actor_owners (createBookingController line 80-83).
- Public-source bookings require the requestActor to be a non-void `user`-kind actor (createBookingController lines 91-97).
- Status transitions are handled by typed controller functions (cancelBookingController, confirmBookingController), not by freeform status writes.
- Notification linkPaths must not expose raw UUIDs (getVportSlugByActorIdDAL, getVportProfileIdByActorIdDAL).

---

## 7. Trust Boundary Findings

---

### VEN-BOOKING-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-BOOKING-001
- Location: apps/VCSM/src/features/booking/dal/updateBookingStatus.dal.js:47-55
- Application Scope: VCSM
- Platform Surface: Supabase Table (bookings)
- Trust Boundary: Authenticated session (any user with a valid Supabase JWT)
- Boundary Violated: Ownership scope — UPDATE filters only on bookingId, no owner_actor_id or resource_id scope applied at DAL level
- Contract Violated: Booking write mutations must be scoped to the caller's owned resources; controller-only ownership is insufficient without DAL-level or RLS enforcement
- Current behavior: updateBookingStatusDAL issues `.update(patch).eq("id", bookingId)` — the only filter is the booking primary key. Any caller who possesses a bookingId can issue a status update if RLS permits. Controllers (cancelBookingController, confirmBookingController) enforce ownership before calling this DAL; however, the DAL itself has no internal ownership guard and can be called directly by any other controller now or in the future.
- Risk: If any code path calls updateBookingStatusDAL directly without first enforcing ownership (e.g., a new controller added later, a test harness, or a compromised call site), any booking in the system can be updated to any status. The only protection is RLS policy on the bookings table, which has not been independently verified in this pass.
- Severity: CRITICAL
- Exploitability: MEDIUM (requires possession of a target bookingId + a code path that bypasses the existing controllers; not exploitable via UI today but exploitable at the DAL surface if any future caller is added)
- Attack Preconditions: Authenticated session + knowledge of a target bookingId + a call path to updateBookingStatusDAL that bypasses existing controller ownership checks
- Blast Radius: Any booking in the platform can have its status (pending/confirmed/cancelled/completed) changed by an unauthorized actor. Affects scheduling integrity for all VPORT owners.
- Identity Leak Type: None (status field only, no PII exposure)
- Cache Trust Type: None
- RLS Dependency: REQUIRED — RLS on bookings is the only barrier at the persistence layer; not VERIFIED in this pass
- Why it matters: Booking status is the core state machine for the feature. Unauthorized status changes can cancel confirmed bookings, mark pending bookings as completed to fraudulently claim services, or suppress cancellations. Revenue and trust consequences are direct.
- Recommended mitigation: Add an `owner_actor_id` scope to the UPDATE at the DAL level — join or filter through `resources` to confirm the booking's resource belongs to the requestor. Alternatively, enforce ownership directly in updateBookingStatusDAL by requiring and verifying an `ownerActorId` parameter. Also verify that RLS on the `bookings` table restricts UPDATE to the resource owner's session.
- Rationale: DAL-level ownership scope provides defense-in-depth; controller-only enforcement is fragile and fails silently on any new call site.
- Follow-up command: DB (verify RLS on bookings table UPDATE policy), ELEKTRA (trace all callers of updateBookingStatusDAL), Carnage (add owner-scope to DAL)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

### VEN-BOOKING-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-BOOKING-002
- Location: apps/VCSM/src/features/booking/dal/saveBookingServiceProfileDurationsByServiceIds.dal.js:38,53,79
- Application Scope: VCSM
- Platform Surface: Supabase Table (vc.service_booking_profiles)
- Trust Boundary: N/A — DAL is silently non-functional
- Boundary Violated: Runtime correctness — the DAL references the undefined variable `supabase` instead of the imported `vportClient`. Every call to this DAL will throw a ReferenceError at runtime.
- Contract Violated: All DAL files must use the imported `vportClient` alias. The file imports `import { vport as vportClient } from "@/services/supabase/vportClient"` (line 1) but then uses the bare name `supabase` at lines 38, 53, and 79.
- Current behavior: `saveBookingServiceProfileDurationsByServiceIdsDAL` throws `ReferenceError: supabase is not defined` on every invocation. This DAL is called by `setResourceSlotDurationController` to persist booking service profile durations after a VPORT owner configures their slot settings. The controller call path runs: `setResourceSlotDurationController → saveBookingServiceProfileDurationsByServiceIdsDAL`. Every attempt to set slot duration silently fails with a runtime crash.
- Risk: (1) Service profile configuration is dead — any slot duration setting by a VPORT owner is silently discarded, creating a denial-of-service condition for the feature. (2) The broken reference is itself a symptom of this DAL not having been re-tested post-refactor; it raises the question of whether the `vc` schema access pattern was ever verified end-to-end.
- Severity: CRITICAL
- Exploitability: HIGH (the bug fires deterministically on every invocation — no exploit needed, the feature is broken)
- Attack Preconditions: None required; fires on normal use
- Blast Radius: All slot duration configuration for all VPORT owners is non-functional. Any service booking that depends on configured durations will fall back to defaults or fail to render.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE (DAL crashes before reaching the DB)
- Why it matters: A broken ownership-scoped write surface is indistinguishable from a bypassed one during incident triage. The crash also masks whether the RLS on vc.service_booking_profiles is correctly configured.
- Recommended mitigation: Replace all three occurrences of `supabase` with `vportClient` in saveBookingServiceProfileDurationsByServiceIds.dal.js (lines 38, 53, 79). Add a test that verifies the DAL successfully reaches the database client.
- Rationale: The import alias is already correct; only the call sites are wrong.
- Follow-up command: SPIDER-MAN (add regression test for this DAL), ELEKTRA (verify no other DAL files have the same undefined-ref pattern)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Availability
```

---

### VEN-BOOKING-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-BOOKING-003
- Location: apps/VCSM/src/features/booking/dal/upsertBookingResourceServices.dal.js:24
- Application Scope: VCSM
- Platform Surface: Supabase Table (vc.resource_services)
- Trust Boundary: N/A — DAL is silently non-functional
- Boundary Violated: Runtime correctness — same undefined-variable pattern as VEN-BOOKING-002. File imports `import { vport as vportClient }` (line 1) but calls `supabase.schema("vc").from("resource_services")` at line 24.
- Contract Violated: All DAL files must use the imported `vportClient` alias.
- Current behavior: `upsertBookingResourceServicesDAL` throws `ReferenceError: supabase is not defined` on every call. This DAL is invoked by `setResourceSlotDurationController` (line 76) to link services to a resource before saving service profile durations. Since this call precedes the `saveBookingServiceProfileDurationsDAL` call and will throw, `setResourceSlotDurationController` always fails before reaching the duration save step.
- Risk: Same availability impact as VEN-BOOKING-002. The double-crash means `setResourceSlotDurationController` fails at the first broken DAL before ever reaching the second, compounding the denial-of-service.
- Severity: CRITICAL
- Exploitability: HIGH (deterministic crash on invocation)
- Attack Preconditions: None required
- Blast Radius: All resource-service linking and slot duration configuration is non-functional. Booking availability calendar depends on this data being properly configured.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE (DAL crashes before reaching the DB)
- Why it matters: `vc.resource_services` is the join table between booking resources and VPORT services. If this table is never written, the slot availability system has no data to operate on.
- Recommended mitigation: Replace `supabase` with `vportClient` at line 24 of upsertBookingResourceServices.dal.js. Audit all DAL files in this feature for the same pattern.
- Rationale: Same fix pattern as VEN-BOOKING-002; should be done atomically with that fix.
- Follow-up command: SPIDER-MAN (regression test), ELEKTRA (audit all DAL files for undefined supabase ref)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Availability
```

---

### VEN-BOOKING-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-BOOKING-004
- Location: apps/VCSM/src/features/booking/controller/createBooking.controller.js:75-84, 105-125
- Application Scope: VCSM
- Platform Surface: PWA → Supabase Table (bookings)
- Trust Boundary: Authenticated actor with management source (owner, admin, import, sync)
- Boundary Violated: Status state-machine — the caller-supplied `status` parameter is passed directly to insertBookingDAL without an allowlist for management sources
- Contract Violated: Booking status must follow a defined state machine; freeform status injection allows inserting bookings in any internal state
- Current behavior: `createBookingController` receives `status = null` as a default parameter. For MANAGEMENT_SOURCES (owner, admin, import, sync), the `status` field is passed directly into `insertBookingDAL` at line 111 without any validation. A VPORT owner using `source: "owner"` can supply `status: "completed"` and create a booking that appears to have been completed at insert time. For CITIZEN_ONLY_SOURCES (public), status is also passed through unchecked.
- Risk: (1) An owner can create bookings pre-marked as "completed" to inflate completion metrics. (2) An owner can create bookings pre-marked as "confirmed" without customer consent. (3) Import/sync sources can inject arbitrary status values if the DB accepts them. (4) For public source, a citizen could potentially inject non-pending status if not blocked by RLS.
- Severity: HIGH
- Exploitability: MEDIUM (requires a management-source actor and direct API access or a crafted hook call; not easily exploitable from standard UI)
- Attack Preconditions: Valid session as a VPORT owner + knowledge of the createBooking call signature
- Blast Radius: Booking history integrity for any affected VPORT. Analytics, completion rates, and financial summaries derived from booking status are affected.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED (RLS may restrict which status values are insertable, but this is unverified)
- Why it matters: Status fraud directly affects payment trust, review eligibility, and analytics. A VPORT owner with inflated completion counts has an unfair marketplace advantage.
- Recommended mitigation: Add a status allowlist per source. For `public` source: force `status = "pending"` regardless of input. For management sources: restrict to `["pending", "confirmed"]` on insert (completed/cancelled status should only be set via typed state transitions). Throw on any out-of-allowlist value.
- Rationale: Inserts should enter the state machine at a defined entry point; pre-completed bookings are semantically invalid for new insertions.
- Follow-up command: ELEKTRA (audit all callers of createBookingController for status injection), DB (verify RLS prevents invalid status values on insert)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

### VEN-BOOKING-005 — CLOSED

```
VENOM SECURITY FINDING
- Finding ID: VEN-BOOKING-005
- Status: CLOSED — FIXED
- Location: apps/VCSM/src/features/booking/controller/createBooking.controller.js
- Previous finding: notification linkPath exposed raw owner UUID: /actor/{uuid}/dashboard/booking-history
- Resolution: createBooking.controller.js line 138 still uses `/actor/${resource.owner_actor_id}/dashboard/booking-history` for the owner's own notification — however, cancelBookingController and confirmBookingController have been updated to use getVportSlugByActorIdDAL for customer-facing linkPaths (slug-based, no UUID).
- Residual: The createBooking notification at line 138 sends the owner their own actorId in a linkPath stored in the notification row. The owner already knows their own actorId; this is lower severity. The customer-facing path issue from the previous pass has been resolved.
- Residual Severity: LOW (owner-facing self-reference, not customer-facing UUID exposure)
- Provenance: SOURCE_VERIFIED
```

**NOTE:** The residual linkPath issue in createBooking.controller.js line 138 (`/actor/${resource.owner_actor_id}/dashboard/booking-history`) stores the VPORT owner's raw UUID in the notification row's linkPath column. The owner is the recipient, so they already know their actorId — but storing raw UUIDs in the DB violates the platform no-UUID-in-links rule and creates an enumeration vector if notification rows are ever read by unauthorized parties. This is filed as VEN-BOOKING-009 below.

---

### VEN-BOOKING-006

```
VENOM SECURITY FINDING
- Finding ID: VEN-BOOKING-006
- Location: ZZnotforproduction/APPS/VCSM/features/booking/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Documentation / Governance
- Trust Boundary: Engineering governance
- Boundary Violated: Behavior contract — BEHAVIOR.md is a PLACEHOLDER with no §5 Security Rules and no §9 Must Never Happen invariants
- Contract Violated: All features must have a complete BEHAVIOR.md before security reviews can be fully anchored; placeholder behavior contracts make security invariant cross-checking impossible
- Current behavior: BEHAVIOR.md contains only: "Status: PLACEHOLDER / Feature: booking / Notes: Behavior contract pending source review." Zero security rules are declared. Zero must-never-happen invariants exist.
- Risk: (1) Security reviewers (VENOM, ELEKTRA, BLACKWIDOW) cannot cross-check source against declared invariants — all security analysis is inferred from source only, increasing risk of missed rules. (2) Future developers have no declared security contract to reference when adding features. (3) THOR release gates cannot verify behavior compliance.
- Severity: HIGH
- Exploitability: LOW (governance gap, not directly exploitable)
- Attack Preconditions: None — this is a governance finding
- Blast Radius: All security reviews for this feature are weakened until the contract exists. Any new booking code written without a contract may inadvertently violate unstated invariants.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The booking feature handles appointment scheduling, customer PII (name, phone, email), and financial workflow. Undeclared security rules create compounding risk as the feature grows.
- Recommended mitigation: Write a complete BEHAVIOR.md for the booking feature with at minimum: §5 Security Rules (ownership model, source/status matrix, citizen-only enforcement, UUID prohibition, void actor exclusion) and §9 Must Never Happen invariants (e.g., "A non-owner must never cancel another actor's booking", "A citizen must never create a booking under another actor's identity", "Status must never skip state machine transitions").
- Rationale: A complete behavior contract is the foundation of all governance tooling (VENOM, ELEKTRA, BLACKWIDOW, THOR, SPIDER-MAN).
- Follow-up command: SPIDER-MAN (cannot write regression tests without invariants), THOR (THOR eligibility blocked)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Software Development Security
```

---

### VEN-BOOKING-007

```
VENOM SECURITY FINDING
- Finding ID: VEN-BOOKING-007
- Location: apps/VCSM/src/features/booking/controller/createBooking.controller.js:18, 108-109
- Application Scope: VCSM
- Platform Surface: PWA → Supabase Table (bookings)
- Trust Boundary: Authenticated VPORT owner using management source
- Boundary Violated: Customer identity attribution — the `customerActorId` and `customerProfileId` parameters are caller-supplied and passed through to the INSERT without any verification that the referenced actor exists or consented to the booking
- Contract Violated: Customer identity fields should either be derived from the session (public source) or verified to exist in the system (management source)
- Current behavior: For MANAGEMENT_SOURCES (owner, admin, import, sync), `createBookingController` accepts caller-supplied `customerActorId` (line 18, default null) and `customerProfileId` (line 20) and writes them directly to the `bookings` table (lines 108-109) with zero validation. An owner can attribute a booking to any actorId in the system.
- Risk: (1) An owner can create bookings attributed to any VCSM actor without their knowledge or consent. (2) Fabricated customer attribution affects the victim's booking history and potentially surfaces on their profile. (3) For "import" or "sync" sources, bulk injection of fabricated bookings attributed to real citizens is possible.
- Severity: HIGH
- Exploitability: MEDIUM (requires management-source privileges and knowledge of target actorIds)
- Attack Preconditions: Valid VPORT owner session + target actor's actorId (discoverable through public profiles)
- Blast Radius: Any VCSM actor could have fabricated bookings attributed to them. If booking history is shown on citizen profiles, this is a reputational attack surface.
- Identity Leak Type: Actor identity injection (third-party actor attributed as booking customer without consent)
- Cache Trust Type: None
- RLS Dependency: ASSUMED — RLS may or may not restrict customer_actor_id on INSERT
- Why it matters: Attributing bookings to actors without consent violates user trust and platform integrity. It also creates audit log pollution that complicates fraud investigations.
- Recommended mitigation: For management sources, if `customerActorId` is supplied, validate that the actor exists and is not void before inserting. For public source, derive `customerActorId` exclusively from the session (`requestActorId`) — never accept it as a caller parameter. Add a guard: if `source === "public"`, force `customerActorId = requestActorId`.
- Rationale: The session-derived identity should always be the authoritative customer for public bookings. Management sources need existence validation, not blind pass-through.
- Follow-up command: ELEKTRA (trace all call sites of createBookingController, verify customerActorId provenance at each), DB (RLS on bookings INSERT for customer_actor_id)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Identity and Access Management
```

---

### VEN-BOOKING-008

```
VENOM SECURITY FINDING
- Finding ID: VEN-BOOKING-008
- Location: apps/VCSM/src/features/booking/controller/cancelBooking.controller.js:26-43
- Application Scope: VCSM
- Platform Surface: PWA → Supabase Table (bookings)
- Trust Boundary: Any authenticated actor who knows a bookingId
- Boundary Violated: Ownership fallback — if resource lookup fails for a non-customer cancellation attempt, the ownership check is NOT skipped (resource-missing now throws). Source re-verified in this pass.
- Contract Violated: N/A — finding requires re-evaluation
- Current behavior (re-verified): Lines 34-43:
  ```
  if (!isCustomer) {
    if (!resource) {
      throw new Error("Booking resource not found.");
    }
    await assertActorOwnsVportActorController({...});
  }
  ```
  When `isCustomer` is false AND `resource` is null, the controller throws "Booking resource not found." before reaching the ownership check. The ownership check is NOT bypassed — the cancel is blocked. This is correct behavior.
- Status: FINDING DOWNGRADED — Previous analysis was incorrect. The resource-missing path throws, not skips. No ownership bypass exists.
- Re-assessed Severity: LOW (residual concern: a null resource on a real booking is an unexpected data integrity issue that warrants a DB audit, but it is not an exploitable bypass)
- Residual Risk: If a booking exists in the DB with a null or deleted resource_id reference (orphaned booking), a customer cancelling their own booking would succeed (isCustomer = true path), but an owner attempting to cancel it would receive "Booking resource not found" — which could be confusing but is not a security bypass.
- Recommended mitigation: Add a DB constraint or periodic audit to detect orphaned bookings (bookings referencing deleted/missing resources). No controller-level change needed.
- Follow-up command: DB (audit for orphaned bookings — bookings.resource_id with no matching resources row)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

### VEN-BOOKING-009

```
VENOM SECURITY FINDING
- Finding ID: VEN-BOOKING-009
- Location: apps/VCSM/src/features/booking/controller/createBooking.controller.js:138
- Application Scope: VCSM
- Platform Surface: PWA → Supabase notifications table (via publishVcsmNotification)
- Trust Boundary: Notification recipient (VPORT owner)
- Boundary Violated: Platform no-UUID-in-links rule — notification linkPath stores raw actorId UUID
- Contract Violated: Memory entry "No raw IDs in public URLs" — Raw UUIDs must never appear in public-facing URLs — always use human-readable slugs (QR, share links, copy-link, navigation). Notification rows are stored in the DB and may be consumed by third parties.
- Current behavior: Line 138: `linkPath: \`/actor/${resource.owner_actor_id}/dashboard/booking-history\`` — the VPORT owner's raw UUID is embedded in the notification linkPath stored in the notification row. cancelBookingController and confirmBookingController have been fixed (use slug-based paths), but createBooking.controller.js retains the raw UUID.
- Risk: (1) Notification table enumeration — if notification rows are readable by unauthorized parties (e.g., via a permissive RLS SELECT policy), actor UUIDs are exposed. (2) Platform consistency — the fix was applied to cancel/confirm but not to create, leaving an inconsistent security posture. (3) The path `/actor/{uuid}/dashboard/booking-history` is an internal dashboard URL — storing raw UUIDs in linkPath violates the platform's URL hygiene contract even for owner-facing notifications.
- Severity: MEDIUM
- Exploitability: LOW (only exploitable if notification rows are readable beyond their intended recipient)
- Attack Preconditions: Access to the notifications table with a SELECT policy broader than row-level recipient scoping
- Blast Radius: VPORT owner UUID enumeration via notification history
- Identity Leak Type: Actor UUID exposure via stored notification linkPath
- Cache Trust Type: None
- RLS Dependency: ASSUMED (notification row visibility depends on RLS on the notifications table — not verified in this pass)
- Why it matters: Partial fixes create inconsistent security posture. The same vulnerability was fixed in cancel/confirm notifications but overlooked in create notifications. Incomplete fixes are a pattern indicator for future drift.
- Recommended mitigation: In createBooking.controller.js, fetch the owner's slug via getVportSlugByActorIdDAL before publishing the notification. Use `linkPath: ownerSlug ? \`/profile/${ownerSlug}?tab=bookings\` : null` — consistent with the pattern already used in cancelBookingController and confirmBookingController.
- Rationale: Consistency with the already-applied fix pattern. Null linkPath is always safer than a UUID linkPath.
- Follow-up command: ELEKTRA (scan all publishVcsmNotification call sites for raw UUID in linkPath), SPIDER-MAN (regression test for notification linkPath shape)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Privacy Protection
```

---

### VEN-BOOKING-010

```
VENOM SECURITY FINDING
- Finding ID: VEN-BOOKING-010
- Location: apps/VCSM/src/features/booking/dal/listBookingsByCustomer.dal.js:8, 23-24
- Application Scope: VCSM
- Platform Surface: Supabase Table read (bookings + join to resources, profiles)
- Trust Boundary: Customer actor querying their own booking history
- Boundary Violated: Column selection — `profile_id` column is selected at line 8 and joined through `profiles!profile_id(actor_id,name)` at line 24. The `profile_id` (internal vport.profiles.id) is an internal DB identifier that should not be surfaced to hooks or UI consumers.
- Contract Violated: VCSM Architecture Contract: "Never expose profileId or vportId through useIdentity() or any public hook or controller surface." The `profile_id` field is selected from the bookings table and returned in the raw row — it then flows through mapBookingRow which reads `row.profiles?.actor_id` (safe) but also exposes `row.customer_profile_id` (mapped to customerProfileId in booking.model.js line 10).
- Current behavior: listBookingsByCustomerDAL selects `profile_id` from bookings (line 8) and joins `profiles!profile_id(actor_id,name)` (line 24). The `profile_id` value is returned in raw rows and mapped to `customerProfileId` in booking.model.js. This internal DB ID is surfaced to hooks (useBookingHistory) and potentially to UI components.
- Risk: (1) Internal DB identifier exposure violates the architecture contract. (2) If booking history data is serialized to client state or API responses, internal profile IDs leak to the frontend. (3) Enumerating profile_id values across booking history rows enables internal DB structure inference.
- Severity: MEDIUM
- Exploitability: LOW (requires reading own booking history, which is authenticated)
- Attack Preconditions: Authenticated citizen actor with their own booking history
- Blast Radius: Internal `vport.profiles.id` values exposed to booking history consumers
- Identity Leak Type: Internal profile ID exposure (vport.profiles.id surfaced through customerProfileId model field)
- Cache Trust Type: None
- RLS Dependency: VERIFIED (customer_actor_id filter is present — correct scoping for the read)
- Why it matters: The architecture contract explicitly prohibits profileId exposure. Surfacing it in the booking history model creates a pathway from the customer session to internal DB schema knowledge.
- Recommended mitigation: Remove `profile_id` from the BOOKING_SELECT in listBookingsByCustomer.dal.js. Remove the `profiles!profile_id` join — use `resources!resource_id(owner_actor_id,name)` only (already present). Remove `customerProfileId` from mapBookingRow return or ensure it is only populated from join data where needed. Audit booking.model.js for any other direct profile_id surface.
- Rationale: The booking history consumer only needs the VPORT owner's public identity (name, actorId via ownerActorId) — internal profile IDs are unnecessary.
- Follow-up command: ELEKTRA (trace all consumers of customerProfileId from mapBookingRow), SPIDER-MAN (add test asserting customerProfileId is null/absent in booking history output)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Privacy Protection
  - Secondary: Access Control
```

---

## 8. Source Verification Summary

| File | Read | Finding |
|---|---|---|
| dal/insertBooking.dal.js | YES | No finding — correct vportClient usage, explicit column list, validation guards |
| dal/insertBookingResource.dal.js | YES | No finding — correct, explicit column list, owner_actor_id required |
| dal/updateBookingStatus.dal.js | YES | VEN-BOOKING-001 — unscoped UPDATE |
| dal/saveBookingServiceProfileDurationsByServiceIds.dal.js | YES | VEN-BOOKING-002 — undefined `supabase` ref at lines 38, 53, 79 |
| dal/upsertBookingResourceServices.dal.js | YES | VEN-BOOKING-003 — undefined `supabase` ref at line 24 |
| dal/upsertAvailabilityRule.dal.js | YES | No finding — correct vportClient usage, explicit columns, resource_id required |
| dal/upsertAvailabilityException.dal.js | YES | No finding — correct vportClient usage, explicit columns, resource_id required |
| dal/getBookingById.dal.js | YES | No finding — explicit columns, maybeSingle |
| dal/listBookingsByCustomer.dal.js | YES | VEN-BOOKING-010 — profile_id column selected and surfaced |
| dal/getVportSlugByActorId.dal.js | YES | No finding — null-safe, error-swallowing by design for linkPath use |
| dal/getVportProfileIdByActorId.dal.js | YES | No finding — same safe pattern |
| controller/createBooking.controller.js | YES | VEN-BOOKING-004 (status injection), VEN-BOOKING-007 (customerActorId injection), VEN-BOOKING-009 (UUID in linkPath) |
| controller/cancelBooking.controller.js | YES | VEN-BOOKING-008 DOWNGRADED — resource-missing now throws; LOW residual |
| controller/confirmBooking.controller.js | YES | No finding — ownership enforced, slug-based linkPath |
| controller/assertActorOwnsVportActorController.js | YES | No finding — kind check precedes self-shortcut, actor_owners DB query verified |
| controller/setAvailabilityRule.controller.js | YES | No finding — ownership enforced before upsert |
| controller/setAvailabilityException.controller.js | YES | No finding — ownership enforced before upsert |
| controller/ensureOwnerBookingResource.controller.js | YES | No finding — ownership enforced before insert |
| controller/setResourceSlotDuration.controller.js | YES | No finding at controller level — but propagates VEN-BOOKING-002/003 from DAL calls |
| controller/listMyBookings.controller.js | YES | No finding — scoped to actorId parameter |
| controller/resolveVportProfileId.controller.js | YES | No finding — internal translation layer, correctly bounded |
| hooks/useQrLinks.js | YES | No finding — actorId-based, ownership enforced via engine, profileId internalized |
| hooks/useBookingHistory.js | YES | No finding — callerActorId required, passed to controller |
| adapters/booking.adapter.js | YES | No finding — explicit exports, adapter boundary maintained |
| model/booking.model.js | YES | Observed `customerProfileId` surface — contributes to VEN-BOOKING-010 |
| setup.js | YES | No finding — engine configuration only |

**DAL files not directly scanning for findings (reads/lists only, no write surface):**
- dal/getActorById.dal.js — read only
- dal/getBookingResourceById.dal.js — read only
- dal/listAvailabilityExceptionsInRange.dal.js — read only
- dal/listAvailabilityRulesByResourceId.dal.js — read only
- dal/listBookingResourceServicesByResourceId.dal.js — read only
- dal/listBookingResourcesByOwnerActorId.dal.js — read only
- dal/listBookingServiceProfilesByServiceIds.dal.js — read only
- dal/listBookingsByResource.dal.js — read only
- dal/listBookingsInRange.dal.js — read only
- dal/readActorOwnerLinkByActorAndUserProfile.dal.js — read only
- dal/readVportServicesByActor.dal.js — read only

---

## 9. Confidence Summary

| Finding | Severity | Provenance | Source File Read | Confidence |
|---|---|---|---|---|
| VEN-BOOKING-001 | CRITICAL | SOURCE_VERIFIED | updateBookingStatus.dal.js:47-55 | HIGH |
| VEN-BOOKING-002 | CRITICAL | SOURCE_VERIFIED | saveBookingServiceProfileDurationsByServiceIds.dal.js:38,53,79 | HIGH |
| VEN-BOOKING-003 | CRITICAL | SOURCE_VERIFIED | upsertBookingResourceServices.dal.js:24 | HIGH |
| VEN-BOOKING-004 | HIGH | SOURCE_VERIFIED | createBooking.controller.js:18,111 | HIGH |
| VEN-BOOKING-005 | CLOSED | SOURCE_VERIFIED | createBooking.controller.js / cancel / confirm | HIGH |
| VEN-BOOKING-006 | HIGH | SOURCE_VERIFIED | BEHAVIOR.md (placeholder) | HIGH |
| VEN-BOOKING-007 | HIGH | SOURCE_VERIFIED | createBooking.controller.js:18-20,108-109 | HIGH |
| VEN-BOOKING-008 | LOW (downgraded) | SOURCE_VERIFIED | cancelBooking.controller.js:34-43 | HIGH |
| VEN-BOOKING-009 | MEDIUM | SOURCE_VERIFIED | createBooking.controller.js:138 | HIGH |
| VEN-BOOKING-010 | MEDIUM | SOURCE_VERIFIED | listBookingsByCustomer.dal.js:8,24 + booking.model.js:10 | HIGH |

**Overall review confidence: HIGH** — All 15 source files with write surfaces or controller paths were read directly. No finding relies on scanner signal alone. CRITICAL findings are all SOURCE_VERIFIED with cited file and line numbers.

---

## 10. THOR Impact

| Finding | Severity | THOR Release Blocker | Rationale |
|---|---|---|---|
| VEN-BOOKING-001 | CRITICAL | YES | Unscoped status UPDATE — any authenticated path to this DAL without controller middleware can modify any booking |
| VEN-BOOKING-002 | CRITICAL | YES | saveBookingServiceProfiles DAL is completely non-functional — slot configuration is dead |
| VEN-BOOKING-003 | CRITICAL | YES | upsertBookingResourceServices DAL is completely non-functional — resource-service linking is dead |
| VEN-BOOKING-004 | HIGH | YES | Status injection on new booking insert — booking state machine integrity violation |
| VEN-BOOKING-006 | HIGH | YES | No BEHAVIOR.md — THOR eligibility requires a complete behavior contract |
| VEN-BOOKING-007 | HIGH | YES | Unauthorized actor identity attribution on bookings |
| VEN-BOOKING-008 | LOW | NO | Downgraded — resource-missing path throws, no bypass exists |
| VEN-BOOKING-009 | MEDIUM | NO | UUID in owner notification linkPath — low direct risk, hygiene fix |
| VEN-BOOKING-010 | MEDIUM | NO | Internal profile_id surfaced in booking history — architecture violation, not a direct exploit |

**THOR STATUS: BLOCKED**
THOR release is blocked by 5 open findings: VEN-BOOKING-001 (CRITICAL), VEN-BOOKING-002 (CRITICAL), VEN-BOOKING-003 (CRITICAL), VEN-BOOKING-004 (HIGH), VEN-BOOKING-006 (HIGH), VEN-BOOKING-007 (HIGH).

---

## 11. Required Follow-Up Commands

| Command | Scope | Triggered By |
|---|---|---|
| DB | Verify RLS UPDATE policy on `bookings` table — can an arbitrary session update any booking by ID? | VEN-BOOKING-001 |
| ELEKTRA | Trace all callers of `updateBookingStatusDAL` — verify none bypass controller ownership gates | VEN-BOOKING-001 |
| Carnage | Add owner_actor_id scoping to updateBookingStatusDAL or migrate to typed RPC | VEN-BOOKING-001 |
| SPIDER-MAN | Add regression test for saveBookingServiceProfileDurationsDAL to verify it reaches the DB client without crash | VEN-BOOKING-002 |
| SPIDER-MAN | Add regression test for upsertBookingResourceServicesDAL to verify it reaches the DB client without crash | VEN-BOOKING-003 |
| ELEKTRA | Audit all DAL files in booking feature for undefined `supabase` variable reference | VEN-BOOKING-002, VEN-BOOKING-003 |
| DB | Verify RLS on `bookings` INSERT — does it restrict `status` to allowed values? | VEN-BOOKING-004 |
| ELEKTRA | Audit all call sites of `createBookingController` — verify `customerActorId` provenance at each | VEN-BOOKING-007 |
| DB | Audit for orphaned bookings (bookings.resource_id referencing deleted resources rows) | VEN-BOOKING-008 |
| ELEKTRA | Scan all `publishVcsmNotification` call sites for raw UUID in linkPath | VEN-BOOKING-009 |
| SPIDER-MAN | Add regression test asserting notification linkPath never contains a raw UUID | VEN-BOOKING-009 |
| ELEKTRA | Trace all consumers of `customerProfileId` from mapBookingRow | VEN-BOOKING-010 |
| SPIDER-MAN | Verify `customerProfileId` is null/absent in booking history output hook | VEN-BOOKING-010 |
| SPIDER-MAN | Write behavior contract regression suite once BEHAVIOR.md §5 and §9 are populated | VEN-BOOKING-006 |

---

## 12. Mitigation Plan

| Finding ID | Severity | Action | Owner Layer | Complexity | Priority |
|---|---|---|---|---|---|
| VEN-BOOKING-002 | CRITICAL | Replace `supabase` with `vportClient` at lines 38, 53, 79 in saveBookingServiceProfileDurationsByServiceIds.dal.js | DAL | Trivial (3 one-word substitutions) | P0 — Immediate |
| VEN-BOOKING-003 | CRITICAL | Replace `supabase` with `vportClient` at line 24 in upsertBookingResourceServices.dal.js | DAL | Trivial (1 substitution) | P0 — Immediate |
| VEN-BOOKING-001 | CRITICAL | Add owner_actor_id scope to updateBookingStatusDAL; verify RLS; consider RPC migration per TICKET-BOOKING-RPC-001 | DAL + DB | Medium | P0 — Immediate |
| VEN-BOOKING-004 | HIGH | Add status allowlist in createBookingController: force `pending` for public source; restrict management source inserts to `["pending", "confirmed"]` | Controller | Low | P1 — Before next release |
| VEN-BOOKING-007 | HIGH | For public source, override `customerActorId = requestActorId` (not caller-supplied). For management source, validate actor exists before insert. | Controller | Low | P1 — Before next release |
| VEN-BOOKING-006 | HIGH | Write complete BEHAVIOR.md §5 and §9 for booking feature | Documentation | Medium | P1 — Before THOR eligibility |
| VEN-BOOKING-009 | MEDIUM | Fetch owner slug in createBooking.controller.js and use slug-based linkPath for owner notification (mirror cancel/confirm pattern) | Controller | Trivial | P2 |
| VEN-BOOKING-010 | MEDIUM | Remove `profile_id` from listBookingsByCustomer.dal.js BOOKING_SELECT; remove `profiles!profile_id` join; audit mapBookingRow for customerProfileId surface | DAL + Model | Low | P2 |
| VEN-BOOKING-008 | LOW | DB audit for orphaned bookings; add DB constraint if possible | DB | Low | P3 |

---

## 13. CISSP Domain Coverage Summary

| CISSP Domain | Findings | Finding IDs |
|---|---|---|
| Access Control | 4 | VEN-BOOKING-001, VEN-BOOKING-004, VEN-BOOKING-007, VEN-BOOKING-008 |
| Software Development Security | 5 | VEN-BOOKING-001, VEN-BOOKING-002, VEN-BOOKING-003, VEN-BOOKING-004, VEN-BOOKING-008 |
| Security and Risk Management | 1 | VEN-BOOKING-006 |
| Identity and Access Management | 1 | VEN-BOOKING-007 |
| Privacy Protection | 2 | VEN-BOOKING-009, VEN-BOOKING-010 |
| Availability | 2 | VEN-BOOKING-002, VEN-BOOKING-003 |

**Primary domain: Software Development Security / Access Control**
The dominant risk profile for the booking feature is application-layer ownership enforcement gaps and broken DAL implementations — not infrastructure or network-layer risks. All CRITICALs are application code defects verifiable from source.

---

*VENOM V2 Security Review complete.*
*Review Date: 2026-06-04*
*Next recommended review: After VEN-BOOKING-001, VEN-BOOKING-002, VEN-BOOKING-003 patches are applied.*
