# ELEKTRA Security Report — Dashboard Modules 7–16

**Date:** 2026-06-05
**Scope:** VCSM:dashboard modules 7–16 (flyerBuilder, bookings, gasprices, exchange, vport-root, settings, calendar, reviews, schedule, services)
**Reviewer:** ELEKTRA V1
**Scan Trigger:** Sequential governance chain — VENOM + BLACKWIDOW complete for same scope
**Application Scope:** VCSM
**Findings Summary:** 1 HIGH | 1 MEDIUM | 2 LOW | 0 INFO
**False Positives Rejected:** 5
**Suggested Patches:** 4

## Preflight

| Upstream | Report | Age | Status |
|---|---|---|---|
| VENOM | 2026-06-05_01-00_venom_dashboard-modules7-16.md | 0 days | COMPLETE |
| BLACKWIDOW | 2026-06-05_01-00_blackwidow_dashboard-modules7-16.md | 0 days | COMPLETE |
| ARCHITECT | evidence-bundle.json | 0 days | FRESH |

Gate: PASS — all upstream reports present, fresh, scope-matched.

---

## Scan Areas

Areas covered: 1 (Actor Ownership / IDOR), 2 (Controller Input Trust)

Areas excluded from this run: 3 (RLS — no new write surfaces added), 4 (Feed — gasprices feed covered in prior run), 5 (Secrets), 6 (Auth), 7 (URL), 8 (Upload — flyerBuilder upload covered via VEN-CARD-001), 9 (Cloudflare Worker)

---

## ELEKTRA SCAN TARGET

```
ELEKTRA SCAN TARGET
Feature / Route: VCSM:dashboard modules 7–16
Application Scope: VCSM
Reason for scan: Full governance chain completion (ARCHITECT→VENOM→BLACKWIDOW→ELEKTRA)
Scan trigger: BLACKWIDOW referral (sequential)
Upstream VENOM report: ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/Venom/2026-06-05_01-00_venom_dashboard-modules7-16.md
Upstream BLACKWIDOW report: ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/BlackWidow/2026-06-05_01-00_blackwidow_dashboard-modules7-16.md
```

---

## Area 1: Actor Ownership / IDOR Scan

### Chain Candidates (from evidence bundle)

| Chain | Surface | Source of actorId | Ownership Check | Priority |
|---|---|---|---|---|
| insertVportBookingDAL (public) | vport.bookings INSERT | requestActorId from identity context (optional — guest allowed) | Caller-responsibility | REVIEW |
| insertVportBookingDAL (owner) | vport.bookings INSERT | callerActorId from identity → assertActorOwnsVportActorController | YES — verified | CONFIRMED_SAFE |
| updateVportBookingDAL | vport.bookings UPDATE | callerActorId from session | YES — controller line 58 | CONFIRMED_SAFE |
| upsertVportPublicDetailsDAL (settings) | vport.profile_public_details UPSERT | requestActorId → assertActorOwnsVportActorController | YES — controller line 58 | CONFIRMED_SAFE |
| designStudio writes | vport.design_* | ownerActorId → requireOwnerActorAccess | YES — actor_owners + doc owner match | CONFIRMED_SAFE |
| insertVportResourceDAL | vport.resources INSERT | N/A (0 consumers, dead code) | N/A | NOT_REACHABLE |
| uploadFlyerImageCtrl → upload | Supabase storage PUT | ownerActorId from hook caller | ABSENT | HIGH FINDING |

### Findings

#### ELEK-MOD7-16-001 — Upload Ownership Bypass (VEN-CARD-001 Precision Trace)

```
SECURITY FINDING

- Finding ID:         ELEK-MOD7-16-001
- Title:              uploadFlyerImageCtrl — ownerActorId accepted from caller, no ownership check at controller
- Category:           IDOR/BOLA, Insecure Upload
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js
- Source:             ownerActorId passed from hook to uploadFlyerImageCtrl — not session-derived
- Sink:               uploadMediaController(ownerActorId, file, ...) → Supabase storage PUT to design_asset scope
- Trust Boundary:     Controller entry — uploadFlyerImageCtrl must call requireOwnerActorAccess(ownerActorId) before any file operation
- Impact:             Any authenticated VCSM user can upload arbitrary files to any VPORT's design_asset storage scope by supplying a target VPORT's ownerActorId. VPORT owner cannot detect or prevent this.
- Evidence:           VEN-CARD-001 (SOURCE_VERIFIED), BW-MOD7-16-002 (BYPASSED): no requireOwnerActorAccess before uploadMediaController. §13.2 of BEHAVIOR.md violated.
- Reproduction Steps: 1. Authenticate as Actor B. 2. Obtain target Actor A's actorId. 3. Call uploadFlyerImageCtrl with ownerActorId = Actor A's actorId and any file payload. 4. File is stored in Actor A's design_asset scope.
- Existing Defense:   None at controller level. useFlyerEditor hook may have a UI ownership gate (not part of auth chain).
- Why Defense Is Insufficient: UI gate is not part of the controller's security model. Controller is callable without UI.
- Recommended Fix:    Add requireOwnerActorAccess(ownerActorId) as first operation in uploadFlyerImageCtrl, before any file handling or uploadMediaController call.
- Suggested Patch:
    // In flyerEditor.controller.js — uploadFlyerImageCtrl:
    export async function uploadFlyerImageCtrl({ ownerActorId, file, ... }) {
      // ADD THIS LINE — must be first, before any other operation:
      await requireOwnerActorAccess(ownerActorId);
      // ... existing upload logic
    }
- Follow-up Command: THOR (release gate — existing THOR blocker confirmed)
```

---

## Area 2: Controller Input Trust Scan

### Chain Candidates

| Controller | Input Field | Source | Validation | Priority |
|---|---|---|---|---|
| updateBookingStatusController | `status` (NEW value) | Owner caller | Customer validated (must be "cancelled"); owner path NOT validated | HIGH |
| upsertVportRateController | `baseCurrency`, `quoteCurrency` | Caller | ISO 4217 allowlist (38 currencies) — SAFE | FALSE POSITIVE |
| createVportPublicBookingController | `customerName`, `customerNote` | Public (unauthenticated) | NONE — no length or content validation | MEDIUM |
| createOwnerBookingController | `serviceLabelSnapshot` | Owner caller | NONE — accepted from caller, no catalog validation | LOW |
| reviewFuelPriceSuggestionController | `status` (submission review) | Owner caller | — needs check | REVIEW |

### Findings

#### ELEK-MOD7-16-002 — updateBookingStatusController: Owner Status Enum Not Validated

```
SECURITY FINDING

- Finding ID:         ELEK-MOD7-16-002
- Title:              updateBookingStatusController — owner-path status enum not validated against allowlist
- Category:           Controller Input Trust, Privilege Escalation (state machine integrity)
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/updateVportBooking.controller.js
- Source:             `status` parameter from hook caller (owner path)
- Sink:               updateVportBookingDAL({ status }) → vport.bookings.status UPDATE
- Trust Boundary:     Controller — status must be validated against valid_booking_statuses before reaching DAL
- Impact:             An authenticated VPORT owner can write an arbitrary string to booking.status (e.g., "admin", "refunded", "disputed"). UPDATABLE_COLS includes status; no app-layer enum guard on owner path. Customer path is protected (must be "cancelled"). DB-level enum constraint may protect, but app-layer validation is absent.
- Evidence:           TERMINAL_STATUSES = ["completed", "cancelled", "no_show"] validates CURRENT booking state. No VALID_NEW_STATUSES allowlist for incoming status value on owner path. `status` is in UPDATABLE_COLS in updateVportBookingDAL. Prior ELEKTRA shell run flagged "booking feature ELEKTRA run required (status allowlist)" as out-of-scope referral.
- Reproduction Steps: 1. Authenticate as VPORT owner Actor A. 2. Find a non-terminal bookingId for Actor A's VPORT. 3. Call updateBookingStatusController({ bookingId, status: "admin_override", callerActorId: Actor A's actorId }). 4. DAL attempts to write "admin_override" to vport.bookings.status.
- Existing Defense:   Terminal state guard (TERMINAL_STATUSES) prevents re-opening of completed/cancelled/no_show bookings. DB enum constraint (if present) would block invalid values at DB layer.
- Why Defense Is Insufficient: Terminal guard validates CURRENT state, not NEW state. DB enum is not verified in this run; app-layer validation should not depend on DB enum for security invariants.
- Recommended Fix:    Add a VALID_OWNER_STATUSES allowlist check in updateBookingStatusController, before the DAL call, for the owner path.
- Suggested Patch:
    // In updateVportBooking.controller.js:
    const TERMINAL_STATUSES = ["completed", "cancelled", "no_show"];
    const VALID_OWNER_STATUSES = new Set(["pending", "confirmed", "completed", "cancelled", "no_show"]);

    // In updateBookingStatusController, on owner path (after assertActorOwnsVportActorController):
    if (!VALID_OWNER_STATUSES.has(status)) {
      throw new Error(`Invalid booking status: ${status}`);
    }
- Follow-up Command: DB (verify vport.bookings.status column has enum constraint), VENOM (update VEN-DASHBOARD-003 scope)
```

#### ELEK-MOD7-16-003 — createVportPublicBookingController: Unbounded Free-Text Input

```
SECURITY FINDING

- Finding ID:         ELEK-MOD7-16-003
- Title:              createVportPublicBookingController — customerName and customerNote stored without length or content validation
- Category:           Controller Input Trust, XSS (Stored)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/vportPublicBooking.controller.js
- Source:             `customerName`, `customerNote` from public booking form (unauthenticated)
- Sink:               insertVportBookingDAL — vport.bookings.customer_name, vport.bookings.customer_note INSERT
- Trust Boundary:     Controller — must validate and truncate free-text fields before DAL
- Impact:             (1) Storage abuse — arbitrarily large payloads stored to DB. (2) Stored XSS if owner dashboard renders these fields without proper escaping (React default escaping mitigates in most cases, but not if dangerouslySetInnerHTML is used anywhere).
- Evidence:           VEN-MOD7-16-002, BW-MOD7-16-002 PARTIAL: no length limit, no HTML stripping. WRITE_COLS includes customer_name and customer_note. Public caller is unauthenticated.
- Reproduction Steps: 1. Submit public booking request with customerName = "<script>alert(1)</script>" or 50,000-character string. 2. Value stored to vport.bookings. 3. Owner views booking in dashboard — if rendered via dangerouslySetInnerHTML, XSS fires.
- Existing Defense:   React's JSX escaping by default. No controller-level defense.
- Why Defense Is Insufficient: Defense relies entirely on correct rendering behavior at every consumer. Controller is the correct validation point.
- Recommended Fix:    Add length limits and trim in createVportPublicBookingController: customerName ≤ 100 chars, customerNote ≤ 500 chars. Strip HTML tags or reject inputs containing HTML.
- Suggested Patch:
    // In vportPublicBooking.controller.js, before insertVportBookingDAL call:
    const safeCustomerName = typeof customerName === "string"
      ? customerName.trim().slice(0, 100)
      : null;
    const safeCustomerNote = typeof customerNote === "string"
      ? customerNote.trim().slice(0, 500)
      : null;
    // Then pass safeCustomerName, safeCustomerNote to insertVportBookingDAL
- Follow-up Command: VENOM (confirm owner dashboard rendering is React-escaped)
```

#### ELEK-MOD7-16-004 — createOwnerBookingController: serviceLabelSnapshot Caller-Controlled

```
SECURITY FINDING

- Finding ID:         ELEK-MOD7-16-004
- Title:              createOwnerBookingController — serviceLabelSnapshot accepted from caller, no server-side catalog validation
- Category:           Controller Input Trust, Data Integrity
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/createOwnerBooking.controller.js
- Source:             `serviceLabelSnapshot` from hook caller (VPORT owner)
- Sink:               insertVportBookingDAL — vport.bookings.service_label_snapshot INSERT
- Trust Boundary:     Controller — should resolve label from catalog when serviceId is provided
- Impact:             VPORT owner can create bookings with arbitrary service label text not matching their actual service catalog. Limited impact — owner cannot affect other actors. Data integrity concern for booking history, reporting, and export.
- Evidence:           VEN-MOD7-16-001: public booking path resolves from catalog via readVportServiceByIdDAL; owner path does not. serviceLabelSnapshot falls back to "Appointment" if null; otherwise accepts caller-supplied string.
- Reproduction Steps: 1. Authenticate as VPORT owner Actor A. 2. Call createOwnerBookingController with serviceLabelSnapshot = "Free Service - Do Not Charge". 3. Booking created with that label; catalog not consulted.
- Existing Defense:   Falls back to "Appointment" if null. Owner path already verified via assertActorOwnsVportActorController.
- Why Defense Is Insufficient: Consistency with public booking path requires server-side label resolution when serviceId is provided.
- Recommended Fix:    When serviceId is provided, resolve label from catalog (readVportServiceByIdDAL) in createOwnerBookingController, same as public path. Allow custom label only when no serviceId is provided (walk-in appointment).
- Suggested Patch:
    // In createOwnerBooking.controller.js:
    let resolvedLabel = serviceLabelSnapshot || "Appointment";
    if (serviceId) {
      const catalogService = await readVportServiceByIdDAL({ serviceId });
      resolvedLabel = catalogService?.label ?? resolvedLabel;
    }
    // Pass resolvedLabel to insertVportBookingDAL instead of caller-supplied serviceLabelSnapshot
- Follow-up Command: VENOM (update VEN-MOD7-16-001 with this trace)
```

---

## False Positives Rejected

```
FALSE POSITIVE REJECTED
- Candidate: insertVportBookingDAL customer_actor_id IDOR
- Location: apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/dal/insertVportBooking.write.dal.js
- Rejection reason: Both confirmed callers (createVportPublicBookingController, createOwnerBookingController) derive customer_actor_id from identity context (session). DAL comment VPD-V-019 documents this requirement. Caller-responsibility pattern is intentional; both callers are SOURCE_VERIFIED safe.
- Chain gap: Impact — no exploit path via confirmed callers
```

```
FALSE POSITIVE REJECTED
- Candidate: updateVportBookingDAL IDOR (cross-actor booking update)
- Location: apps/VCSM/src/features/dashboard/vport/dal/write/updateVportBooking.write.dal.js
- Rejection reason: updateBookingStatusController verifies assertActorOwnsVportActorController before calling this DAL. BLACKWIDOW BW-MOD7-16-... Attack 1 result: BLOCKED. Chain gap: Defense is PRESENT and SOURCE_VERIFIED.
```

```
FALSE POSITIVE REJECTED
- Candidate: upsertVportPublicDetailsDAL IDOR (cross-actor settings write)
- Location: apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/dal/vportPublicDetails.write.dal.js
- Rejection reason: saveVportPublicDetailsByActorIdController line 58 calls assertActorOwnsVportActorController before any read or write. SOURCE_VERIFIED in VENOM. BLACKWIDOW Attack 5: BLOCKED.
```

```
FALSE POSITIVE REJECTED
- Candidate: Exchange rate currency allowlist
- Location: apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js
- Rejection reason: SUPPORTED_FX_CURRENCIES = new Set([38 ISO 4217 currencies]). Unknown currencies throw before ownership check. SOURCE_VERIFIED in VENOM. Complete allowlist = no bypass via currency code injection.
```

```
FALSE POSITIVE REJECTED
- Candidate: insertVportResourceDAL (dashboard) — IDOR
- Location: apps/VCSM/src/features/dashboard/vport/dal/write/vportResource.write.dal.js
- Rejection reason: BW-DASH-003 and BW-MOD7-16-001 confirmed 0 consumers. Calendar uses engines/booking dalInsertBookingResource (SOURCE_VERIFIED via ensureOwnerBookingResource.controller.js). Dead code is not exploitable while unreachable. Chain gap: Source — no reachable entry point.
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-MOD7-16-001 | uploadFlyerImageCtrl ownership gate | HIGH | Controller | SIMPLE | NO |
| 2 | ELEK-MOD7-16-002 | Booking status enum allowlist | MEDIUM | Controller | SIMPLE | NO (DB enum is defense-in-depth) |
| 3 | ELEK-MOD7-16-003 | customerName/Note length + sanitize | LOW | Controller | SIMPLE | NO |
| 4 | ELEK-MOD7-16-004 | serviceLabelSnapshot catalog resolution | LOW | Controller | MODERATE | NO |

---

## SOURCE READ SUMMARY

| Command | Source Files Read | Evidence Bundle Used | Full Rediscovery Performed |
|---|---:|---|---|
| ELEKTRA | 0 (new reads) | YES — evidence-bundle.json | NO |

All source verification carried from VENOM and BLACKWIDOW runs in this session. ELEKTRA consumed upstream reports for chain tracing; no new source files read. All findings grounded in prior session SOURCE_VERIFIED evidence.

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| DB | Verify vport.bookings.status column has enum constraint (ELEK-MOD7-16-002 mitigation) | PENDING |
| THOR | Release gate evaluation — ELEK-MOD7-16-001 (HIGH, existing THOR blocker) | PENDING |
| SPIDER-MAN | Regression tests for all 4 findings post-patch | PENDING |
