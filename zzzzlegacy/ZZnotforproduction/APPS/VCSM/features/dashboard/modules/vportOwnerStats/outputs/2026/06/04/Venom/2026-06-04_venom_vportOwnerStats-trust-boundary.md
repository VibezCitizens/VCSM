# VENOM V2 SECURITY REVIEW

## Output Metadata

| Field | Value |
|---|---|
| Category Key | dashboard |
| Feature | dashboard/modules/vportOwnerStats |
| Command | VENOM |
| Application Scope | VCSM |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/vportOwnerStats/outputs/2026/06/04/Venom/2026-06-04_venom_vportOwnerStats-trust-boundary.md |
| Timestamp | 2026-06-04T00:00:00 |

---

## 1. VENOM Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 3 days

| Map                  | Generated At             | Age   | Freshness | Status |
|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z | 0.7h  | FRESH     | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z | 0.7h  | FRESH     | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z | 0.7h  | FRESH     | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z | 0.7h  | FRESH     | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z | 0.7h  | FRESH     | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z | 0.7h  | FRESH     | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z | 0.7h  | FRESH     | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z | 0.7h  | FRESH     | PASS   |

Overall Preflight: PASS
Write surfaces in scope: 0
RPC surfaces in scope: 0
Edge function surfaces in scope: 0
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Surfaces In Scope | Used For |
|---|---|---|---|---|---|
| write-surface-map | 2026-06-04T19:48:25.152Z | 0.7h | FRESH | 0 | Primary attack surface inventory |
| rpc-map | 2026-06-04T19:48:25.152Z | 0.7h | FRESH | 0 | RPC surface inventory |
| edge-function-map | 2026-06-04T19:48:25.152Z | 0.7h | FRESH | 0 | Edge function surface inventory |

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: dashboard/modules/vportOwnerStats
Scan Date: 2026-06-04T19:48:25.152Z

Write Surfaces: 0
  INSERT: 0 | UPDATE: 0 | DELETE: 0 | UPSERT: 0
  Tables affected: NONE

RPC Calls: 0

Edge Functions: 0

Read Surfaces (source-traced, not scanner-tracked):
  - vportProfile.profiles (SELECT: id, actor_id, name, slug, is_active, is_deleted)
  - vportResource.resources (SELECT: id, profile_id, owner_actor_id, member_actor_id, resource_type, name, is_active, sort_order, meta) — twice (resources + staff)
  - vportBookings.bookings (SELECT: 14 cols incl. customer_name, customer_note, customer_actor_id) — twice (today + upcoming)
  - actor_owners (SELECT via assertActorOwnsVportActorController)
  - actors (SELECT via getActorByIdDAL — requester + target)

Execution Paths Resolved: N/A — read-only module, no write execution paths.
```

---

## 4. Scanner Signals

| Signal | Source Map | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|
| 0 write surfaces for vportOwnerStats | write-surface-map | HIGH | YES — controller:vportOwnerStats.controller.js reads only | [SOURCE_VERIFIED] | CONFIRMED SAFE |
| 0 RPCs for vportOwnerStats | rpc-map | HIGH | YES — no RPC calls in controller or DALs | [SOURCE_VERIFIED] | CONFIRMED SAFE |
| Booking DAL returns 14 cols including PII | — (source trace) | — | YES — listVportBookingsForProfileDayDAL.js:3, controller uses .length only | [SOURCE_VERIFIED] | VEN-VPORTOS-001 |
| Profile DAL fetches is_active, is_deleted but controller does not validate them | — (source trace) | — | YES — vportProfile.read.dal.js:8, controller:37 only checks profile?.id | [SOURCE_VERIFIED] | VEN-VPORTOS-002 |

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/vportOwnerStats/BEHAVIOR.md
BEHAVIOR.md exists: YES
BEHAVIOR.md status: APPROVED
§5 Security Rules declared: 5
§5 Rules verified in source: 5 / 5
§5 Rules unenforced: NONE
§9 Must Never Happen declared: 10
§9 Invariants protected in source: 9 / 10
§9 Invariants unprotected: MNH-007 (cancelled/no-show bookings) — source verified via DAL filter; dedicated test still required per BEHAVIOR.md
```

### §5 Cross-Check

| BEH ID | Rule | Source Status |
|---|---|---|
| BEH-DASH-vportOwnerStats-201 | Owner quick stats are owner-only | ✅ assertActorOwnsVportActorController fires before all reads |
| BEH-DASH-vportOwnerStats-202 | UI checks not security boundaries | ✅ deriveVportIsOwner is display gate only; controller enforces independently |
| BEH-DASH-vportOwnerStats-203 | Controller must verify ownership before reads | ✅ assertActorOwnsVportActorController:line 31 fires before profile/resource/booking reads |
| BEH-DASH-vportOwnerStats-204 | RLS is defense-in-depth, not primary auth | ✅ App-layer controller is primary; RLS is defense-in-depth |
| BEH-DASH-vportOwnerStats-205 | Staff/resource errors surfaced, not silent | ✅ listVportStaffResourcesByProfileIdDAL throws on error; hook captures via captureMonitoringError |

### §9 Cross-Check

| BEH ID | Invariant | Source Status |
|---|---|---|
| BEH-DASH-vportOwnerStats-301 | Never read before ownership verified | ✅ assertActorOwnsVportActorController:line 31 is unconditional |
| BEH-DASH-vportOwnerStats-302 | Non-owner never receives booking counts | ✅ ownership throws before booking DAL calls |
| BEH-DASH-vportOwnerStats-303 | Non-owner never receives staff/barber count | ✅ ownership throws before staff DAL calls |
| BEH-DASH-vportOwnerStats-304 | Missing actorId never issues DB reads | ✅ controller:28-29 throws before any reads; hook:10 guards with early return |
| BEH-DASH-vportOwnerStats-305 | Supabase failures never leave loading stuck | ✅ hook finally block clears loading |
| BEH-DASH-vportOwnerStats-306 | Unmounted hook never updates React state | ✅ cancelled flag pattern:11,13,14 |
| BEH-DASH-vportOwnerStats-307 | Cancelled/no-show never counted | ✅ DAL filter:14 `.not("status","in",'("cancelled","no_show")')` SOURCE VERIFIED |
| BEH-DASH-vportOwnerStats-308 | Module never mutates | ✅ 0 write surfaces — scanner + source confirmed |
| BEH-DASH-vportOwnerStats-309 | Staff failures not silently zero | ✅ DAL throws Supabase errors |
| BEH-DASH-vportOwnerStats-310 | RLS alone is never sufficient authorization | ✅ controller ownership gate is primary |

---

## 6. Trust Boundary Analysis

### VENOM TARGET

```
Feature: dashboard/modules/vportOwnerStats
Application Scope: VCSM
Reason for review: Write 2 — SECURITY.md creation, full trust boundary verification
Primary trust boundary: Authenticated VPORT Owner → owner booking/resource read data
```

### Security Surface

```
Entry point: VportBarberShopOwnerBand → useVportOwnerQuickStats → useOwnerQuickStats → loadOwnerQuickStatsController
Auth source: Supabase session (viewerActorId from useIdentity hook, not client input)
Authorization layer: assertActorOwnsVportActorController — DB-verified via actor_owners table
Identity surface: actorId + callerActorId (both actor IDs — compliant with identity surface rules)
Sensitive objects: booking counts (aggregate), staff count (aggregate), customer PII in DAL result set (never returned to UI)
```

### Trust Boundary Trace

```
Client input: actorId (route param), callerActorId (from authenticated session via useIdentity)
Validated at: controller:28-29 (presence); assertActorOwnsVportActorController (ownership)
Identity resolved at: assertActorOwnsVportActorController — fetches requester actor from DB, checks kind, checks actor_owners
Authorization enforced at: Controller layer (before all reads) — primary auth
Data returned to: Hook → UI — only { todayCount, upcomingCount, activeBarbers } (3 integers)
```

---

## 7. Trust Boundary Findings

---

### VEN-VPORTOS-001 [SOURCE_VERIFIED]

```
VENOM SECURITY FINDING
- Finding ID: VEN-VPORTOS-001
- Location: apps/VCSM/src/features/dashboard/vport/dal/read/listVportBookingsForProfileDayDAL.js:3
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table (vport.bookings)
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Data minimization — PII fields loaded but never consumed
- Contract Violated: Asset Security (data minimization principle)
- Current behavior: listVportBookingsForProfileDayDAL selects 14 columns including
  customer_name, customer_note, customer_actor_id, service_label_snapshot, duration_minutes.
  The controller immediately calls .length on the result and discards all field data.
  PII is loaded into server memory on every stats request and never returned to the UI.
- Risk: If the controller or hook were ever extended to return raw booking rows instead
  of only counts, customer PII would be exposed to the owner band without any additional
  access gate. Additionally, unnecessarily loading PII on every profile view creates
  avoidable memory exposure surface.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions: Requires future controller change returning raw rows. Not exploitable in current source.
- Blast Radius: Single VPORT — owner-only context
- Identity Leak Type: Booking identity exposure (customer_actor_id), private contact exposure (customer_name, customer_note)
- Cache Trust Type: None
- RLS Dependency: ASSUMED — RLS on vport.bookings assumed present; resourceIds filter + status filter are app-layer
- Why it matters: PII in memory that is never used violates data minimization. Any future
  accidental logging, error serialization, or return-value expansion would expose customer
  contact data. The fix is low-effort and reduces surface permanently.
- Recommended mitigation: Change DAL select to count-only:
    .select("id", { count: "exact", head: true })
  or simply .select("id") and return data.length.
  Alternatively, create a dedicated count RPC in vport schema that returns only the integer count.
- Rationale: Controller uses only .length. All 13 other columns are dead weight on this path.
- Follow-up command: SPIDER-MAN — add test verifying controller returns only { todayCount, upcomingCount, activeBarbers }
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Software Development Security
```

---

### VEN-VPORTOS-002 [SOURCE_VERIFIED]

```
VENOM SECURITY FINDING
- Finding ID: VEN-VPORTOS-002
- Location: apps/VCSM/src/features/dashboard/vport/controller/vportOwnerStats.controller.js:36-38
             apps/VCSM/src/features/dashboard/vport/dal/read/vportProfile.read.dal.js:8
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: VPORT Lifecycle Contract — soft-deleted/inactive VPORT resolves without lifecycle check
- Contract Violated: VPORT Lifecycle Contract
- Current behavior: readVportProfileByActorIdDAL selects is_active and is_deleted fields.
  Controller only checks: if (!profile?.id) throw new Error("Could not resolve vport profile.")
  A profile with is_deleted: true or is_active: false will still resolve, and the controller
  will proceed to read resources and booking counts for it.
- Risk: A verified owner whose VPORT has been soft-deleted or deactivated can still retrieve
  their booking counts and active staff counts through the owner band. This is owner-to-own-data
  only — no cross-actor risk. However, it means the lifecycle gate is decorative on this path.
- Severity: LOW
- Exploitability: LOW — only the verified owner is affected; no other actor can reach this path
- Attack Preconditions: Authenticated user must own the target VPORT actor. VPORT profile must
  have is_deleted: true or is_active: false. No cross-actor escalation possible.
- Blast Radius: Single actor — owner sees their own data from a logically unavailable VPORT
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — RLS on vport.profiles not inspected
- Why it matters: If a VPORT is deactivated or deleted, its owner should not be able to read
  operational data through any surface. Lifecycle consistency is important for the platform's
  trust model — inactive VPORTs should be uniformly invisible to all queries, including owner ones.
- Recommended mitigation: Add lifecycle guard in controller after profile resolution:
    if (!profile.is_active || profile.is_deleted) {
      throw new Error("VPORT profile is not available.");
    }
- Rationale: The DAL already fetches these fields — the check is zero-cost. Makes lifecycle
  enforcement consistent across all dashboard read paths.
- Follow-up command: None — simple controller change, LOW severity
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Security Architecture and Engineering
```

---

## 8. Confirmed Safe Surfaces [SOURCE_VERIFIED]

| Surface | Evidence | Status |
|---|---|---|
| callerActorId required and passed from session | VportProfileViewScreen:185 `callerActorId={viewerActorId}`; viewerActorId from authenticated hook (not client input) | ✅ SAFE |
| assertActorOwnsVportActorController — kind check before self-shortcut | assertActorOwnsVportActor.controller.js:28 — kind === "user" required before line 34 self-shortcut | ✅ SAFE |
| actor_owners DB lookup with is_void check | controller.js:43-49 — ownerLink && ownerLink.is_void !== true | ✅ SAFE |
| target actor is_void check | controller.js:52-54 — targetActor.is_void !== true | ✅ SAFE |
| No write surfaces | Scanner: 0 write surfaces; source: no INSERT/UPDATE/DELETE in module | ✅ SAFE |
| No RPCs, no edge functions | Scanner: 0 RPCs, 0 edge functions | ✅ SAFE |
| Cancelled/no-show excluded from counts | listVportBookingsForProfileDayDAL.js:14 `.not("status","in",'("cancelled","no_show")')` | ✅ SAFE |
| Staff filter at controller layer | controller.js:59-61 `m.is_active !== false && m.meta?.status === "linked"` | ✅ SAFE |
| Zero-resource short-circuit | controller.js:50-57 — booking DALs skipped when resourceIds.length === 0 | ✅ SAFE |
| UI owner check is display gate only | deriveVportIsOwner.model.js:23-26 — pure ID equality, documented as display-only | ✅ SAFE |
| VEN-DASH-001 (original HIGH finding) | callerActorId now required: controller:29, passed from session identity: VportProfileViewScreen:185 | ✅ PATCHED / SOURCE VERIFIED |
| ELEK-003 (original HIGH finding) | Same as VEN-DASH-001 — source binding verified | ✅ PATCHED / SOURCE VERIFIED |
| BLOCK-DASH-005 (original P0) | assertActorOwnsVportActorController fires before all reads | ✅ PATCHED / SOURCE VERIFIED |

---

## 9. THOR Impact

```
THOR Release Blockers: NONE
Highest Open Severity: MEDIUM (VEN-VPORTOS-001 — data minimization, not exploitable in current source)
THOR Status: CLEAR — no blocking findings. VEN-VPORTOS-001 and -002 are MEDIUM/LOW hardening items.
```

---

## 10. Mitigation Plan

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-VPORTOS-001 | Booking DAL over-fetches customer PII | DAL | MEDIUM | App | SPIDER-MAN (add count-only test) |
| VEN-VPORTOS-002 | Profile lifecycle not validated post-retrieval | Controller | LOW | App | None — simple guard |

---

## 11. Source Verification Summary

```
Total surfaces in scope: 5 read surfaces (0 write, 0 RPC, 0 edge)
Surfaces source-verified: 5 / 5
Source files read:
  - vportOwnerStats.controller.js
  - useOwnerQuickStats.js (hook)
  - useVportOwnerQuickStats.js (adapter hook)
  - VportBarberShopOwnerBand.jsx
  - VportProfileViewScreen.jsx (caller, callerActorId threading)
  - assertActorOwnsVportActor.controller.js (ownership gate)
  - listVportBookingsForProfileDayDAL.js
  - vportResource.read.dal.js
  - vportProfile.read.dal.js
  - vportOwnership.model.js (deriveVportIsOwner)
CRITICAL findings: 0
```

---

## 12. Confidence Summary

```
HIGH confidence surfaces: 5 (scanner confirmed 0 write/RPC/edge; source verified reads)
LOW confidence surfaces: 0
[SOURCE_VERIFIED] findings: 2 (VEN-VPORTOS-001, VEN-VPORTOS-002)
[SCANNER_LEAD] findings: 0
[SCANNER_LOW_CONF] findings: 0
```

---

## 13. Required Follow-Up Commands

- **ELEKTRA** — source-to-sink trace on VEN-VPORTOS-001 (booking DAL select columns) + VEN-VPORTOS-002 (profile lifecycle guard)
- **BLACKWIDOW** — adversarial runtime: attempt non-owner stats read with valid actor session; confirm ownership gate blocks cross-actor access
- **SPIDER-MAN** — add test: controller returns only count integers, no booking row data; add lifecycle-check regression for VEN-VPORTOS-002

---

## 14. CISSP Domain Coverage Summary

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VEN-VPORTOS-002 — VPORT lifecycle governance |
| Asset Security | 1 | VEN-VPORTOS-001 — customer PII over-fetch |
| Security Architecture and Engineering | 1 | VEN-VPORTOS-002 secondary — lifecycle defense consistency |
| Communication and Network Security | 0 | No public endpoints, no RPCs, no edge functions — N/A |
| Identity and Access Management | 0 | All IAM checks SOURCE VERIFIED as SAFE |
| Security Assessment and Testing | 0 | Test requirements routed to SPIDER-MAN |
| Security Operations | 0 | Monitoring via captureMonitoringError verified present |
| Software Development Security | 1 | VEN-VPORTOS-001 secondary — data minimization in DAL |

**Uncovered domains:**
- Communication and Network Security: OUT OF SCOPE — module has zero network surfaces (0 RPCs, 0 edge functions, no public routes)
- Identity and Access Management: VERIFIED CLEAN — all IAM paths source-verified as correctly enforced
- Security Assessment and Testing: ROUTED — test requirements handed to SPIDER-MAN
- Security Operations: VERIFIED — monitoring capture confirmed present in hook

---

## 15. VENOM Status Summary

VENOM Status: COMPLETE
Highest Open Severity: MEDIUM
THOR Release Blocker: NO
Open Findings: 2 (MEDIUM + LOW — hardening only)
Confirmed Safe: All original HIGH findings (VEN-DASH-001, ELEK-003, BLOCK-DASH-005) SOURCE VERIFIED PATCHED
Write 2: SECURITY.md written — see ZZnotforproduction/APPS/VCSM/features/dashboard/modules/vportOwnerStats/SECURITY.md
