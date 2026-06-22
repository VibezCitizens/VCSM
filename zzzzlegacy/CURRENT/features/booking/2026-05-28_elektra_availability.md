# ELEKTRA Security Scan — Availability Module
**Date:** 2026-05-28
**Scanner:** ELEKTRA
**Scope:** apps/VCSM — booking/availability DALs + controllers + engine path
**Finding range:** ELEK-2026-05-28-060 to ELEK-2026-05-28-063
**Status:** COMPLETE

---

## Scope

Files scanned:

- `apps/VCSM/src/features/booking/dal/upsertAvailabilityRule.dal.js`
- `apps/VCSM/src/features/booking/dal/upsertAvailabilityException.dal.js`
- `apps/VCSM/src/features/booking/dal/listAvailabilityRulesByResourceId.dal.js`
- `apps/VCSM/src/features/booking/dal/listAvailabilityExceptionsInRange.dal.js`
- `apps/VCSM/src/features/dashboard/vport/dal/read/vportAvailabilityRules.read.dal.js`
- `apps/VCSM/src/features/booking/controller/setAvailabilityRule.controller.js`
- `apps/VCSM/src/features/booking/controller/setAvailabilityException.controller.js`
- `engines/booking/src/controller/setAvailabilityRule.controller.js`
- `engines/booking/src/controller/setAvailabilityException.controller.js`
- `engines/booking/src/controller/assertActorCanManageResource.controller.js`
- `engines/booking/src/dal/vportAvailability.write.dal.js`
- `engines/booking/src/dal/vportAvailability.read.dal.js`

---

## Executive Summary

The availability write path uses a two-track ownership chain: the app-level controllers (`setAvailabilityRule.controller.js`, `setAvailabilityException.controller.js`) gate on `assertActorOwnsVportActorController` via `getBookingResourceByIdDAL` (which returns `owner_actor_id`). The engine-level controllers (`engines/booking/src/controller/setAvailabilityRule.controller.js`) use `assertActorCanManageResource` which independently verifies actor validity (is_void guard) and multi-role ownership (direct, vport_owner, org, location, staff). The DALs themselves perform no ownership checks — they are passive upsert functions, relying entirely on controller-layer gating.

**BW-AVAIL-002 resolution:** RLS presence on `availability_rules` and `availability_exceptions` in the vport schema is unconfirmed from source code alone. The tables live in `vport.*` schema; the DALs use `vportClient`. No RLS policy definitions were found in source files — DB confirmation is required.

**Result:** 0 HIGH, 1 MEDIUM, 2 LOW, 1 INFO

---

## Findings

---

### ELEK-2026-05-28-060 — DAL Accepts `resource_id` With No Ownership Verification
**Severity:** MEDIUM
**Status:** OPEN — controller gate present but DAL is directly callable

**Source:**
`apps/VCSM/src/features/booking/dal/upsertAvailabilityRule.dal.js` line 36
`apps/VCSM/src/features/booking/dal/upsertAvailabilityException.dal.js` line 32

**Sink:**
Supabase `vport.availability_rules` / `vport.availability_exceptions` upsert

**Chain:**
```
upsertAvailabilityRuleDAL({ row: { resource_id: ANY_ID, ... } })
  → vportClient.from("availability_rules").upsert(payload, { onConflict: "id" })
  → DB INSERT/UPDATE with no actor ownership verification at DAL layer
```

**Description:**
Both DAL functions accept any `resource_id` value without verifying that the caller owns the resource. The expected defense is the controller gate (`setAvailabilityRuleController` / `setAvailabilityExceptionController`), which calls `assertActorOwnsVportActorController` before reaching the DAL. However, the DAL functions are exported and directly importable — any code path that calls the DAL directly (bypassing the controller) bypasses the ownership gate entirely.

The DAL is imported via `@/features/booking/dal/upsertAvailabilityRule.dal.js`. If any current or future code imports it directly rather than going through the controller, the IDOR chain is complete.

**CISSP Domain:** Identity and Access Management

**Proposed patch (text only — do not apply):**
Add an `ownerActorId` parameter to the DAL and call `getBookingResourceByIdDAL({ resourceId, ownerActorId })` with a non-null `ownerActorId` filter before upsert, or add a secondary ownership assertion inside the DAL that fetches the resource and verifies ownership before writing. This creates defense-in-depth even if the controller gate is bypassed.

---

### ELEK-2026-05-28-061 — No RLS Confirmation on `availability_rules` / `availability_exceptions`
**Severity:** MEDIUM (BW-AVAIL-002 confirmation)
**Status:** OPEN — DB policy confirmation required

**Source:**
`apps/VCSM/src/features/booking/dal/upsertAvailabilityRule.dal.js` line 55
`apps/VCSM/src/features/booking/dal/upsertAvailabilityException.dal.js` line 51

**Sink:**
Supabase `vport.availability_rules` / `vport.availability_exceptions`

**Chain:**
```
upsertAvailabilityRuleDAL → vportClient (vport schema)
  → availability_rules table
  → RLS policy existence: UNCONFIRMED
```

**Description:**
Source code does not contain RLS policy definitions. The `vportClient` uses the vport schema. The tables `availability_rules` and `availability_exceptions` are written to via upsert with `onConflict: "id"`. If RLS is not configured on these tables, an authenticated user with the Supabase anon or service role key could potentially write rows for arbitrary `resource_id` values without owning those resources, bypassing the application-layer controller gate.

This was flagged as BW-AVAIL-002 (MEDIUM: RLS unconfirmed). ELEKTRA confirms the source code provides no evidence that RLS policies exist. DB confirmation is the only way to resolve this finding.

**CISSP Domain:** Identity and Access Management

**Resolution path:**
Run `SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'vport' AND tablename IN ('availability_rules', 'availability_exceptions')` and confirm INSERT/UPDATE policies exist that enforce `resource_id` ownership via actor ownership join.

---

### ELEK-2026-05-28-062 — `listAvailabilityRulesByResourceId` / `listAvailabilityExceptionsInRange` Accept Arbitrary `resourceId` — Read IDOR Risk
**Severity:** LOW
**Status:** OPEN — informational; exploitability depends on RLS

**Source:**
`apps/VCSM/src/features/booking/dal/listAvailabilityRulesByResourceId.dal.js` line 17
`apps/VCSM/src/features/booking/dal/listAvailabilityExceptionsInRange.dal.js` line 30

**Sink:**
Supabase `vport.availability_rules` / `vport.availability_exceptions` SELECT

**Chain:**
```
listAvailabilityRulesByResourceIdDAL({ resourceId: ANY_UUID })
  → vportClient.from("availability_rules").select(...).eq("resource_id", resourceId)
  → Returns rules for any resource — no ownership check in DAL
```

**Description:**
Both read DALs accept any `resourceId` and return all active rules/exceptions without verifying the caller owns the resource. Availability rules include time windows and working hours — not immediately sensitive, but leaks operational data (staffing patterns, hours of operation). The read data does not contain PII.

Exploitability depends on whether RLS SELECT policies exist on these tables (ref ELEK-2026-05-28-061). If no RLS SELECT policy exists, any authenticated session can enumerate any VPORT's availability rules by guessing resource UUIDs.

The engine-level read path (`getResourceAvailability`) does not assert caller ownership before calling the read DALs — it is used for both the owner view and the public booking flow (`publicMode` flag), so read access to availability rules is intentionally broader than write access.

**CISSP Domain:** Asset Security

**Proposed patch (text only — do not apply):**
For owner-facing reads (non-public mode), add an optional `ownerActorId` parameter to both read DALs and, when provided, join against the resources table to filter by `owner_actor_id`. This ensures DAL-layer ownership scoping without breaking the public booking flow.

---

### ELEK-2026-05-28-063 — `vportAvailabilityRules.read.dal.js` Uses Non-Standard Client Import
**Severity:** INFO
**Status:** NOTE only — no exploit path

**Source:**
`apps/VCSM/src/features/dashboard/vport/dal/read/vportAvailabilityRules.read.dal.js` line 1

```js
import vportSchema from "@/services/supabase/vportClient";
```

**Description:**
This DAL imports `vportClient` as the default export (`vportSchema`) rather than the named export (`vport`). The booking DALs import it as `import { vport as vportClient } from "@/services/supabase/vportClient"`. If the default export and the named export resolve differently (e.g., different schema, different role, different JWT), the behavior could diverge. This is a hygiene finding — no exploit path was identified, but it is worth verifying that both export paths produce equivalent Supabase clients scoped to the vport schema.

**CISSP Domain:** Software Development Security

---

## Resolved Findings

| BW Finding | ELEKTRA Assessment | Date |
|---|---|---|
| BW-AVAIL-001 (LOW: dupe gate) | NOT_A_RISK — upsert `onConflict: "id"` is correct duplicate handling; no race window at DAL layer | 2026-05-28 |
| BW-AVAIL-002 (MEDIUM: RLS unconfirmed) | CONFIRMED OPEN — ELEK-2026-05-28-061 | 2026-05-28 |
| BW-AVAIL-003 (INFO: void) | CONFIRMED MITIGATED — `assertActorCanManageResource` (engine path) calls `dalGetActorById` and checks `is_void === true` at line 20; app path `assertActorOwnsVportActorController` checks `is_void === true` at line 24 | 2026-05-28 |

---

## Ownership Chain Trace Summary

**App-level path (vc.booking_resources):**
```
setAvailabilityRuleController
  → getBookingResourceByIdDAL({ resourceId }) → returns resource.owner_actor_id
  → assertActorOwnsVportActorController({ requestActorId, targetActorId: resource.owner_actor_id })
      → getActorByIdDAL (kind check: must be "user", is_void check)
      → readActorOwnerLinkByActorAndUserProfileDAL (actor_owners table)
  → upsertAvailabilityRuleDAL
```
Chain is complete. Ownership is verified through `actor_owners` before write.

**Engine-level path (vport.resources):**
```
setAvailabilityRule (engine)
  → dalGetVportResourceById({ resourceId })  [if vport resource]
  → assertActorCanManageResource({ requestActorId, resourceId })
      → dalGetActorById (is_void check)
      → assertActorOwnsVportActor (actor_owners)
      → OR org/location/staff membership checks
  → dalUpsertVportAvailabilityRule
```
Chain is complete. Multi-role ownership verified before write.

**Gap:** DAL layer has no independent ownership enforcement. Ownership is entirely controller-layer. If DALs are called directly, the IDOR chain is open (ELEK-2026-05-28-060).

---

## Summary Table

| ID | Severity | Status | Description |
|---|---|---|---|
| ELEK-2026-05-28-060 | MEDIUM | OPEN | DAL upsert accepts any resource_id — no DAL-layer ownership check |
| ELEK-2026-05-28-061 | MEDIUM | OPEN | RLS on availability_rules/exceptions unconfirmed — DB verification required |
| ELEK-2026-05-28-062 | LOW | OPEN | Read DALs accept any resourceId — no caller ownership scoping |
| ELEK-2026-05-28-063 | INFO | NOTE | Non-standard vportClient import in dashboard DAL |
