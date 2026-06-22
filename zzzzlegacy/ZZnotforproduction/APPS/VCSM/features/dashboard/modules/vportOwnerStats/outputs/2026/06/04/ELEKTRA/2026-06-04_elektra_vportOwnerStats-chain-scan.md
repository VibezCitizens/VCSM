# ELEKTRA V2 VULNERABILITY SCAN

## Output Metadata

| Field | Value |
|---|---|
| Category Key | dashboard |
| Feature | dashboard/modules/vportOwnerStats |
| Command | ELEKTRA |
| Application Scope | VCSM |
| Scanner Version | 1.1.0 |
| Scan Trigger | VENOM cross-reference + Write 2 (SECURITY.md creation) |
| Output Path | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/vportOwnerStats/outputs/2026/06/04/ELEKTRA/2026-06-04_elektra_vportOwnerStats-chain-scan.md |
| Timestamp | 2026-06-04T00:00:00 |
| Findings Summary | 0 HIGH \| 0 MEDIUM \| 1 LOW \| 1 INFO |
| False Positives Rejected | 5 |
| Suggested Patches | 2 |

---

## Executive Summary

`vportOwnerStats` is a pure read-only aggregation module with zero write surfaces, zero RPCs, and zero edge functions — confirmed by scanner and source. The callgraph traces a single clean chain from `VportBarberShopOwnerBand` through two adapter hops into `loadOwnerQuickStatsController`, where `assertActorOwnsVportActorController` fires unconditionally before any DAL read. No IDOR, injection, auth bypass, or privilege escalation chain could be completed. Two low-severity hardening items were found: a missing profile lifecycle guard (LOW) and a booking DAL that over-fetches customer PII columns never consumed by the controller (INFO). Neither blocks THOR. All prior HIGH findings (VEN-DASH-001, ELEK-003) remain SOURCE VERIFIED PATCHED.

---

## 1. ELEKTRA Scanner Preflight

```
ELEKTRA SCANNER PREFLIGHT
===========================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 3 days

| Map                 | Generated At             | Age   | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| security-path-map   | 2026-06-04T19:48:25.152Z | 0.7h  | FRESH     | HIGH       | PASS   |
| write-surface-map   | 2026-06-04T19:48:25.152Z | 0.7h  | FRESH     | HIGH       | PASS   |
| rpc-map             | 2026-06-04T19:48:25.152Z | 0.7h  | FRESH     | HIGH       | PASS   |
| edge-function-map   | 2026-06-04T19:48:25.152Z | 0.7h  | FRESH     | HIGH       | PASS   |
| callgraph           | 2026-06-04T19:48:25.152Z | 0.7h  | FRESH     | HIGH       | PASS   |
| write-execution-map | 2026-06-04T19:48:25.152Z | 0.7h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map   | 2026-06-04T19:48:25.152Z | 0.7h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
Write sinks in scope: 0
RPC sinks in scope: 0
Edge function sinks in scope: 0
Callgraph chain candidates: 5 (all read chains, no write sinks)
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Sinks / Chains In Scope | Used For |
|---|---|---|---|---|---|
| write-surface-map | 2026-06-04T19:48:25.152Z | 0.7h | FRESH | 0 | Sink inventory — confirmed no write sinks |
| rpc-map | 2026-06-04T19:48:25.152Z | 0.7h | FRESH | 0 | RPC sink inventory — confirmed no RPCs |
| edge-function-map | 2026-06-04T19:48:25.152Z | 0.7h | FRESH | 0 | Edge function inventory — confirmed none |
| callgraph | 2026-06-04T19:48:25.152Z | 0.7h | FRESH | 8 nodes, 15 edges | Source-to-sink chain pre-computation |
| security-path-map | 2026-06-04T19:48:25.152Z | 0.7h | FRESH | 0 (no write paths) | Security path pre-computation |

Chain candidates from callgraph: 5 (read-only paths only)

---

## 3. Vulnerability Surface Inventory

```
ELEKTRA VULNERABILITY SURFACE INVENTORY
=========================================
Feature: dashboard/modules/vportOwnerStats
Scan Date: 2026-06-04T19:48:25.152Z

Write Sinks: 0
  INSERT: 0 | UPDATE: 0 | DELETE: 0 | UPSERT: 0
  Tables affected: NONE

RPC Sinks: 0

Edge Function Sinks: 0

Callgraph Chain Candidates: 5
  CHAIN-vportOwnerStats-001: actorId (route param) → controller → lifecycle check → DAL reads
  CHAIN-vportOwnerStats-002: callerActorId (prop → session) → ownership gate → DAL reads
  CHAIN-vportOwnerStats-003: profileId (server-resolved) → listVportBookingsForProfileDayDAL (PII select)
  CHAIN-vportOwnerStats-004: profileId (server-resolved) → listVportResourcesByProfileIdDAL
  CHAIN-vportOwnerStats-005: staffRows (server-fetched) → controller meta.status filter
```

---

## 4. Scanner Signals

| Chain Candidate | Callgraph Path | Scanner Confidence | Source Verified | Chain Verdict | Provenance | Finding |
|---|---|---|---|---|---|---|
| actorId → controller → no lifecycle guard | VportBarberShopOwnerBand → useVportOwnerQuickStats → loadOwnerQuickStatsController → readVportProfileByActorIdDAL | HIGH | YES — controller.js:36-38 only checks `profile?.id` | VALID — lifecycle gap | [SOURCE_VERIFIED] | ELEK-2026-06-04-001 |
| profileId → listVportBookingsForProfileDayDAL 14-col SELECT | loadOwnerQuickStatsController → listVportBookingsForProfileDayDAL | HIGH | YES — dal:3 `SELECT_COLS` includes customer_name, customer_note, customer_actor_id; controller:63-64 uses .length only | VALID — data minimization | [SOURCE_VERIFIED] | ELEK-2026-06-04-002 |
| callerActorId → ownership gate | VportBarberShopOwnerBand:callerActorId={viewerActorId} → useOwnerQuickStats → loadOwnerQuickStatsController:31 assertActorOwnsVportActorController | HIGH | YES — viewerActorId from useIdentity (session); gate fires before reads | SAFE — session-bound, ownership verified | [SOURCE_VERIFIED] | No finding — FP-001 |
| actorId (route param) → IDOR via ownership bypass | actorId from route → assertActorOwnsVportActorController → actor_owners DB lookup | HIGH | YES — assertActorOwnsVportActor.controller.js:23-57 — kind check + actor_owners + is_void check | SAFE — full ownership verification present | [SOURCE_VERIFIED] | No finding — FP-002 |
| staffRows.meta.status user-controlled? | listVportStaffResourcesByProfileIdDAL → staffRows → controller meta.status filter | HIGH | YES — meta is DB JSON column, written by platform not user; controller filter at :59 is server-side | SAFE — server-written data | [SOURCE_VERIFIED] | No finding — FP-003 |

---

## 5. Source-to-Sink Chain Analysis

### CHAIN-vportOwnerStats-001 — Profile Lifecycle Bypass

```
Source:   actorId — route parameter (user-attacker-controlled value)
Boundary: loadOwnerQuickStatsController — assertActorOwnsVportActorController verifies OWNERSHIP only
Sink:     readVportProfileByActorIdDAL → listVportResourcesByProfileIdDAL → listVportBookingsForProfileDayDAL
Impact:   Verified owner reads booking counts and staff counts for their own soft-deleted or inactive VPORT
Missing:  Lifecycle guard — controller never checks profile.is_active or profile.is_deleted after DAL returns
```

Chain verdict: VALID — lifecycle check absent at controller:36-38  
Finding: ELEK-2026-06-04-001

---

### CHAIN-vportOwnerStats-002 — callerActorId Source Verification

```
Source:    callerActorId — passed as prop from VportProfileViewScreen:185 callerActorId={viewerActorId}
           viewerActorId sourced from useIdentity() → authenticated Supabase session
Boundary:  loadOwnerQuickStatsController:31 — assertActorOwnsVportActorController
           Verified: kind === "user" (controller.js:28) → actor_owners lookup (controller.js:43) → is_void check (controller.js:48)
Sink:      readVportProfileByActorIdDAL, listVportResourcesByProfileIdDAL, listVportStaffResourcesByProfileIdDAL, listVportBookingsForProfileDayDAL
Impact:    None — session-bound identity, DB-verified ownership
```

Chain verdict: SAFE — full session binding and DB ownership verification  
Finding: None — recorded as FP-001

---

### CHAIN-vportOwnerStats-003 — Booking DAL PII Over-Fetch

```
Source:    profileId — server-resolved from actorId after ownership verification (NOT user-controlled)
Boundary:  controller — ownership already verified; profileId is DB-derived, not prop/URL
Sink:      listVportBookingsForProfileDayDAL (dal:3) — SELECT 14 cols including:
           customer_name, customer_note, customer_actor_id, service_label_snapshot, duration_minutes
           controller (controller.js:63-64): return { todayCount: todayBookings.length, ... }
           14 columns fetched; 0 columns returned
Impact:    customer_name, customer_note, customer_actor_id loaded into memory on every stats view;
           never returned to UI in current source; future change risk if return value expanded
```

Chain verdict: VALID — data minimization gap; not a current exploit but PII in memory  
Finding: ELEK-2026-06-04-002

---

### CHAIN-vportOwnerStats-004 — IDOR via actorId (rejected)

```
Source:    actorId — route parameter (user-attacker-controlled)
Boundary:  assertActorOwnsVportActorController (controller.js:31-34):
           - requester actor fetched from DB: getActorByIdDAL (not trusted from client)
           - kind === "user" verified (controller.js:28)
           - actor_owners row fetched and is_void checked (controller.js:43-48)
           - target actor is_void checked (controller.js:52-54)
Sink:      readVportProfileByActorIdDAL, resource/booking DALs
Missing:   Nothing — ownership verification is complete and unconditional
```

Chain verdict: SAFE  
Finding: None — FP-002

---

### CHAIN-vportOwnerStats-005 — Staff meta.status filter (rejected)

```
Source:    staffRows — result of listVportStaffResourcesByProfileIdDAL (DB rows, server-written)
           meta is JSONB column populated by platform staff-link operations, not user input
Boundary:  controller.js:59-61: m.is_active !== false && m.meta?.status === "linked"
           Both fields read from DB result, not from request payload
Sink:      activeBarbers count returned to UI
```

Chain verdict: SAFE — server-written data  
Finding: None — FP-003

---

## 6. Verified Vulnerabilities

---

### ELEK-2026-06-04-001 — Profile Lifecycle Bypass [SOURCE_VERIFIED]

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-001
- Title:              Profile lifecycle state not validated before stat reads
- Category:           Auth Bypass (VPORT Lifecycle)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/vport/controller/vportOwnerStats.controller.js:36-38
- Source:             actorId (route parameter) → resolves VPORT profile via readVportProfileByActorIdDAL
- Sink:               listVportResourcesByProfileIdDAL, listVportBookingsForProfileDayDAL — reads proceed for any
                      profile that resolves, regardless of is_active or is_deleted state
- Trust Boundary:     loadOwnerQuickStatsController — ownership is verified but lifecycle is not
- Impact:             A verified owner of a soft-deleted or deactivated VPORT can retrieve their
                      booking counts and staff counts. Only the owner is affected — no cross-actor
                      escalation is possible because assertActorOwnsVportActorController still fires.
- Evidence:
    // vportProfile.read.dal.js:8 — DAL selects lifecycle fields but controller ignores them
    .select("id, actor_id, name, slug, is_active, is_deleted")

    // controller.js:36-38 — only null check, no lifecycle guard
    const profile = await readVportProfileByActorIdDAL({ actorId });
    if (!profile?.id) throw new Error("Could not resolve vport profile.");
    const profileId = profile.id;  // proceeds to resource/booking reads

- Reproduction Steps:
    1. Create a barbershop VPORT and link a barber actor to it
    2. Soft-delete the VPORT profile (set is_deleted: true or is_active: false)
    3. Log in as the VPORT owner and navigate to their barbershop profile
    4. Observe: VportBarberShopOwnerBand still renders booking counts and barber count
    Note: No production action required — this is a read-only observation.

- Existing Defense:   assertActorOwnsVportActorController verifies actor_owners — non-owners are blocked
- Why Defense Is Insufficient: Lifecycle state (is_active, is_deleted) is not evaluated after profile resolves

- Recommended Fix:    Add lifecycle guard in controller after profile resolution:
    if (!profile.is_active || profile.is_deleted) {
      throw new Error("VPORT profile is not available.");
    }

- Suggested Patch:    See PATCH-ELEK-2026-06-04-001 below
- Follow-up Command:  BLACKWIDOW — confirm with runtime test against deactivated VPORT
```

---

### ELEK-2026-06-04-002 — Booking DAL PII Over-Fetch [SOURCE_VERIFIED]

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-002
- Title:              Booking read DAL fetches 14 columns including customer PII; controller uses count only
- Category:           Insecure Data Exposure (data minimization)
- Severity:           INFO
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/vport/dal/read/listVportBookingsForProfileDay.read.dal.js:3
                      apps/VCSM/src/features/dashboard/vport/controller/vportOwnerStats.controller.js:63-64
- Source:             profileId (server-resolved after ownership check — NOT user-controlled)
- Sink:               vport.bookings SELECT 14 columns including:
                      customer_name, customer_note, customer_actor_id, service_label_snapshot, duration_minutes
- Trust Boundary:     Controller return value — only { todayCount, upcomingCount, activeBarbers } (3 integers)
- Impact:             customer_name, customer_note, and customer_actor_id are loaded into JS heap on every
                      profile view where the owner band renders. They are never returned to UI in current
                      source. No current exploit path. Future risk: if controller return value is expanded
                      to pass raw booking rows, PII would flow to UI without a separate access gate.
- Evidence:
    // dal:3 — 14-column SELECT
    const SELECT_COLS = "id,resource_id,service_id,customer_actor_id,status,source,starts_at,ends_at,
                         timezone,service_label_snapshot,duration_minutes,customer_name,customer_note,
                         created_at,updated_at";

    // controller:63-64 — only .length used
    todayCount:    todayBookings.length,
    upcomingCount: upcomingBookings.length,

- Reproduction Steps: N/A — no current exploit path
- Existing Defense:   Controller never returns raw booking data to hook or UI
- Why Defense Is Insufficient: PII is loaded unnecessarily; defense is behavioral, not structural

- Recommended Fix:    Reduce DAL SELECT to count-only:
    Change SELECT_COLS to "id" only, or use Supabase count query:
    .select("id", { count: "exact", head: true })
    Return data.length from count result.
    This structurally prevents PII from ever being in memory on this path.

- Suggested Patch:    See PATCH-ELEK-2026-06-04-002 below
- Follow-up Command:  SPIDER-MAN — add regression test verifying controller returns only the 3 count integers
```

---

## 7. Patch Recommendations

---

### PATCH-ELEK-2026-06-04-001

```
ELEKTRA PATCH ADVISORY
========================
Finding ID: ELEK-2026-06-04-001
Chain ID: CHAIN-vportOwnerStats-001
Scanner Signal: callgraph — loadOwnerQuickStatsController → readVportProfileByActorIdDAL
Provenance: [SOURCE_VERIFIED]
Severity: LOW

CHAIN:
  Source: actorId (route param, user-supplied) — VportProfileViewScreen passes actorId from route
  Boundary: loadOwnerQuickStatsController:31 — assertActorOwnsVportActorController (ownership only)
  Sink: listVportResourcesByProfileIdDAL, listVportBookingsForProfileDayDAL
  Impact: Verified owner reads stats for soft-deleted / inactive VPORT
  Missing Defense: Lifecycle guard after profile resolution at controller.js:38

ROOT CAUSE:
  readVportProfileByActorIdDAL already fetches is_active and is_deleted (line 8) but the controller
  only checks profile?.id, ignoring lifecycle state.

SUGGESTED PATCH:
  File: apps/VCSM/src/features/dashboard/vport/controller/vportOwnerStats.controller.js
  After line 37 (after profile null check):

  // Before
  const profile = await readVportProfileByActorIdDAL({ actorId });
  if (!profile?.id) throw new Error("Could not resolve vport profile.");
  const profileId = profile.id;

  // After (suggested — human must review before applying)
  const profile = await readVportProfileByActorIdDAL({ actorId });
  if (!profile?.id) throw new Error("Could not resolve vport profile.");
  if (!profile.is_active || profile.is_deleted) throw new Error("VPORT profile is not available.");
  const profileId = profile.id;

  Explanation: The DAL already fetches these fields at zero extra cost. The guard makes lifecycle
  enforcement consistent with every other dashboard path and prevents stats from leaking
  for logically-unavailable VPORTs.

  DB Change Required: NO — is_active and is_deleted already in DAL SELECT
  Test Required: TESTREQ — controller throws for is_active: false profile (SPIDER-MAN)
```

---

### PATCH-ELEK-2026-06-04-002

```
ELEKTRA PATCH ADVISORY
========================
Finding ID: ELEK-2026-06-04-002
Chain ID: CHAIN-vportOwnerStats-003
Scanner Signal: callgraph — loadOwnerQuickStatsController → listVportBookingsForProfileDayDAL
Provenance: [SOURCE_VERIFIED]
Severity: INFO

CHAIN:
  Source: profileId (server-resolved — NOT user-controlled)
  Boundary: controller — ownership already verified; profileId is DB-derived
  Sink: vport.bookings — SELECT 14 cols including customer_name, customer_note, customer_actor_id
  Impact: PII in memory; never returned to UI in current code
  Missing Defense: Structural — SELECT includes unnecessary PII columns

ROOT CAUSE:
  SELECT_COLS was likely copied from a booking-display DAL. This path only needs the count.

SUGGESTED PATCH:
  File: apps/VCSM/src/features/dashboard/vport/dal/read/listVportBookingsForProfileDay.read.dal.js

  // Option A — minimal column select (preferred)
  // Before
  const SELECT_COLS = "id,resource_id,service_id,customer_actor_id,status,source,starts_at,ends_at,...";

  // After
  const SELECT_COLS = "id";

  // Option B — count-only query (no rows in memory)
  // Replace the select block with:
  const { count, error } = await vportSchema
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .in("resource_id", resourceIds)
    .gte("starts_at", rangeStart)
    .lt("starts_at", rangeEnd)
    .not("status", "in", '("cancelled","no_show")');

  if (error) throw error;
  return count ?? 0;  // return integer directly

  // Controller usage becomes:
  todayCount:    await listVportBookingsForProfileDayDAL({ resourceIds, rangeStart: today.start, rangeEnd: today.end }),
  upcomingCount: await listVportBookingsForProfileDayDAL({ resourceIds, rangeStart: upcoming.start, rangeEnd: upcoming.end }),
  // (remove .length — DAL returns integer)

  Explanation: Option B is preferred because it eliminates the row-loading step entirely —
  no booking PII ever enters the JS heap on this code path.

  DB Change Required: NO
  Test Required: TESTREQ — controller returns numeric counts, not booking row arrays (SPIDER-MAN)
```

---

## 8. False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate:        IDOR via callerActorId prop
- Location:         VportBarberShopOwnerBand.jsx:13, useOwnerQuickStats.js:5
- Rejection reason: callerActorId sourced from useIdentity() authenticated session (viewerActorId from VportProfileViewScreen:34), not from user input; assertActorOwnsVportActorController independently verifies DB ownership before reads
- Chain gap:        Source — callerActorId is session-derived, not user-controlled
- Notes:            VEN-DASH-001 / ELEK-003 patch confirmed in place and source-verified
```

```
FALSE POSITIVE REJECTED

- Candidate:        IDOR via actorId route parameter
- Location:         loadOwnerQuickStatsController:31 — assertActorOwnsVportActorController
- Rejection reason: assertActorOwnsVportActorController unconditionally verifies kind === "user", fetches actor_owners row from DB, checks is_void on both requester and target — full ownership chain prevents cross-actor reads
- Chain gap:        Trust Boundary — defense is present and unconditional
- Notes:            SOURCE VERIFIED at assertActorOwnsVportActor.controller.js:11-60
```

```
FALSE POSITIVE REJECTED

- Candidate:        staff meta.status user-controlled filter bypass
- Location:         controller.js:59-61 m.meta?.status === "linked"
- Rejection reason: meta is a JSONB column written by platform staff-link operations; the value is read from the DB row returned by listVportStaffResourcesByProfileIdDAL, not from request payload
- Chain gap:        Source — meta.status is server-written, not user-controlled
- Notes:            No exploit path
```

```
FALSE POSITIVE REJECTED

- Candidate:        resourceIds enumeration via profileId
- Location:         listVportResourcesByProfileIdDAL — returns resource rows for given profileId
- Rejection reason: profileId is server-resolved from actorId after ownership verification; client cannot supply an arbitrary profileId; listVportResourcesByProfileIdDAL adds is_active filter; booking DALs only receive the resulting resourceIds
- Chain gap:        Source — profileId is server-resolved, not user-controlled
- Notes:            No exploit path
```

```
FALSE POSITIVE REJECTED

- Candidate:        Zero-resource short-circuit bypass
- Location:         controller.js:50-57 resourceIds.length > 0 guard
- Rejection reason: resourceIds are derived from listVportResourcesByProfileIdDAL result (DB rows); an attacker cannot inject a non-empty resourceIds value; guard correctly short-circuits booking reads when no resources exist
- Chain gap:        Source — resourceIds are not user-controlled
- Notes:            Confirmed safe behavioral pattern
```

---

## 9. Source Verification Summary

```
Chain candidates evaluated: 5
Chains source-verified: 5 / 5
Source files read:
  - vportOwnerStats.controller.js
  - assertActorOwnsVportActor.controller.js
  - useOwnerQuickStats.js
  - VportBarberShopOwnerBand.jsx
  - VportProfileViewScreen.jsx (callerActorId threading)
  - listVportBookingsForProfileDayDAL.js
  - vportResource.read.dal.js
  - vportProfile.read.dal.js
  - vportOwnership.model.js
Valid findings: 2 (1 LOW, 1 INFO)
Rejected (false positive): 5
Incomplete (scanner leads): 0
```

---

## 10. Confidence Summary

```
HIGH confidence chains: 5
LOW confidence chains: 0
[SOURCE_VERIFIED] findings: 2 (ELEK-2026-06-04-001, ELEK-2026-06-04-002)
[SCANNER_LEAD] findings: 0
[SCANNER_LOW_CONF] findings: 0
```

---

## 11. THOR Impact

```
THOR Release Blockers: NONE
Highest ELEKTRA Severity: LOW (ELEK-2026-06-04-001 — profile lifecycle; owner-only impact)
BLACKWIDOW Confirmation Required for CRITICAL: N/A — no HIGH findings
THOR Status: CLEAR
```

---

## 12. Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| BLACKWIDOW | Runtime validation of ELEK-2026-06-04-001 — confirm lifecycle guard blocks owner band for deactivated VPORT | NEXT |
| SPIDER-MAN | Add test: controller returns only count integers; add lifecycle-deactivated VPORT test for ELEK-001 patch | PENDING |
| VENOM | Cross-reference complete — VEN-VPORTOS-001/002 confirmed by ELEKTRA chains | DONE |
| DB | Not required — no RLS gaps found; all reads are ownership-gated at controller layer | N/A |
| Carnage | Not required — no schema changes needed for patches | N/A |
| THOR | Clear to run — no blocking findings | READY |

---

## 13. ELEKTRA Status Summary

ELEKTRA Status: COMPLETE
Highest Open Severity: LOW
THOR Release Blocker: NO
Open Findings: 2 (LOW + INFO — hardening only, no blocking items)
False Positives Rejected: 5
Write 2: SECURITY.md updated — see ZZnotforproduction/APPS/VCSM/features/dashboard/modules/vportOwnerStats/SECURITY.md
