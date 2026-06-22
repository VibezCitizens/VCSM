# BLACKWIDOW V2 — Adversarial Review Report
## Feature: services (VCSM)
## Date: 2026-06-04
## Reviewer: BLACKWIDOW V2 (BW2.5)

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Date | 2026-06-04 |
| Feature | services |
| App | VCSM |
| Scanner Version | 1.1.0 |
| Scanner Maps Timestamp | 2026-06-04T19:48:25.152Z (FRESH — approx 7h old) |
| BW Protocol | BW2.5 V2 |
| Behavior Contract | PLACEHOLDER — §9 invariants are UNANCHORED |
| VENOM Open Findings | VEN-SERVICES-001, VEN-SERVICES-002, VEN-SERVICES-003 (HIGH x3) |
| ELEKTRA Run | NEVER |
| Total BW Findings | 9 (1 CRITICAL, 3 HIGH, 3 MEDIUM, 2 LOW) |

---

## 2. Scanner Preflight

| Field | Value |
|---|---|
| Scanner Version | 1.1.0 |
| Maps Generated | 2026-06-04T19:48:25.152Z |
| Freshness | FRESH (approx 7h old at time of review) |
| Security Paths Attributed (this feature) | 11 |
| Total Platform Security Paths | 598 |
| Write Execution Paths (VCSM services) | 0 resolved (no write-execution-map entries for VCSM services) |
| RPC Paths (services) | 0 |
| Callgraph Nodes (VCSM services) | 209 |
| Callgraph Edges (VCSM services) | 353 |

Note: All 11 scanner-attributed security paths belong to apps/wentrex (misattributed by scanner due to shared "services" feature label). Zero VCSM-specific services write paths are resolved in scanner maps. All attack surfaces were derived from direct source survey.

---

## 3. Scanner Inputs

```
security-path-map.json:  11 paths attributed to feature:services
                          ALL 11 are apps/wentrex — NOT VCSM
                          confidence: LOW on all (no resolved routes)
callgraph.json:          209 nodes, 353 edges scoped to /services/ paths
                          6 controller entry points
                          6 hook entry points
write-execution-map.json: 0 VCSM services entries
rpc-execution-map.json:   0 services entries
```

Scanner coverage gap: VCSM services write surfaces are NOT represented in scanner maps. All findings in this report are SOURCE_VERIFIED from direct file reads.

---

## 4. Attack Surface Inventory

### Write Mutation Surfaces (VCSM)

| Surface | Path | Ownership Gate | Hook Passes Identity |
|---|---|---|---|
| upsertVportServicesController | controller/services/upsertVportServices.controller.js | assertActorOwnsVportActorController (line 43) | YES — identityActorId from useIdentity |
| createOrUpdateVportServiceAddonController | controller/services/createOrUpdateVportServiceAddon.controller.js | RLS ONLY — no controller-layer ownership check | NO identity passed from hook |
| deleteVportServiceAddonController | controller/services/deleteVportServiceAddon.controller.js | assertActorOwnsVportActorController (line 23) | NO — callerActorId never passed by hook (hook always throws) |
| reorderVportServiceAddonController | controller/services/reorderVportServiceAddon.controller.js | RLS ONLY — no controller-layer ownership check | NO identity passed from hook |

### Read Surfaces

| Surface | Ownership Gate |
|---|---|
| getVportServicesController (asOwner=true) | assertActorOwnsVportActorController (line 50–53) — BEFORE returning disabled services |
| getVportServicesController (asOwner=false) | None — public viewer access |

### Infrastructure Write Surfaces (VCSM services layer)

| Surface | File | Ownership Gate |
|---|---|---|
| uploadToCloudflare | src/services/cloudflare/uploadToCloudflare.js | JWT via Cloudflare Worker (server-enforced) |
| dalInsertLocksmithServiceDetailDefaults | dal/locksmith/locksmithServiceDetails.write.dal.js | RLS only; no actor_id in upsert conflict key |

### Missing DAL Files (referenced but absent)

| Import | Importing Controller | Status |
|---|---|---|
| createVportServiceAddon.dal | createOrUpdateVportServiceAddon.controller.js | MISSING — file does not exist on disk |
| updateVportServiceAddon.dal | createOrUpdateVportServiceAddon.controller.js | MISSING — file does not exist on disk |
| reorderVportServiceAddon.dal | reorderVportServiceAddon.controller.js | MISSING — file does not exist on disk |

### Hook-to-Controller Identity Tracing

| Hook | Passes Identity? | How |
|---|---|---|
| useUpsertVportServices | YES | identityActorId from useIdentity() line 22-24 |
| useCreateOrUpdateVportServiceAddon | NO | No useIdentity() call; no callerActorId |
| useDeleteVportServiceAddon | NO | No useIdentity() call; callerActorId always undefined |
| useReorderVportServiceAddon | NO | No useIdentity() call; no callerActorId |
| useVportServices (asOwner=true) | YES | identityActorId passed as callerActorId |

---

## 5. Scanner Signals

| Signal | Value |
|---|---|
| Security paths resolved (VCSM services) | 0 of 11 (all 11 are Wentrex misattribution) |
| Scanner confidence (all paths) | LOW — no route-confirmed paths |
| Callgraph hook entries | 6 (useUpsertVportServices, useCreateOrUpdateVportServiceAddon, useDeleteVportServiceAddon, useReorderVportServiceAddon, useVportServices x2) |
| Callgraph controller entries | 6 (upsert, createOrUpdate, delete, reorder, getVportServices, invalidateVportServices) |
| Write map VCSM entries | 0 — PRIMARY ATTACK SURFACE GAP per Rule BW-002 |

All findings classified as LOW confidence from scanner lead; elevated to SOURCE_VERIFIED after direct file reads.

---

## 6. Adversarial Path Analysis

---

### A. Ownership Bypass (§5.1)

**Attack: Submit upsertVportServices with victim targetActorId and attacker identityActorId**

- Controller: `upsertVportServices.controller.js:43` calls `assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId })`
- If requestActorId does not own targetActorId via `actor_owners`, throws "Actor does not own this vport actor." (line 50 of assertActorOwnsVportActor.controller.js)
- Result: **BLOCKED** [SOURCE_VERIFIED: upsertVportServices.controller.js:43, assertActorOwnsVportActor.controller.js:43-50]

**Attack: Submit createOrUpdateVportServiceAddon with victim targetActorId**

- Controller: `createOrUpdateVportServiceAddon.controller.js` — no `assertActorOwnsVportActorController` call. Controller comment states "Ownership enforced by RLS (DB is source of truth)" (line 8-9).
- The controller has NO application-layer ownership check.
- RLS is the only barrier. RLS posture on `vport.service_addons` is UNVERIFIED in any documented DB audit.
- Result: **PARTIAL** [SOURCE_VERIFIED: createOrUpdateVportServiceAddon.controller.js:8-10 — no ownership assertion exists at lines 1-61]
- Finding: BW-SERV-002 (HIGH)

**Attack: Submit reorderVportServiceAddon with victim targetActorId and arbitrary orderedIds**

- Controller: `reorderVportServiceAddon.controller.js:9` explicitly states "No auth/ownership check here — Ownership enforced by RLS (DB is source of truth)"
- No application-layer ownership check present.
- RLS posture on the underlying table is UNVERIFIED.
- Result: **PARTIAL** [SOURCE_VERIFIED: reorderVportServiceAddon.controller.js:9-10]
- Finding: BW-SERV-003 (HIGH)

---

### B. Session Mutation (§5.2)

**Attack: Pass null identityActorId to upsertVportServices**

- Hook `useUpsertVportServices` reads `identity?.actorId ?? null` (line 22-24). If identity is null (unauthenticated), identityActorId === null.
- Controller line 30-32: `if (!identityActorId) throw new Error("upsertVportServicesController: identityActorId is required")`
- Result: **BLOCKED** [SOURCE_VERIFIED: upsertVportServices.controller.js:30-32]

**Attack: Pass null callerActorId to deleteVportServiceAddon via hook**

- Hook `useDeleteVportServiceAddon` NEVER reads identity context. It calls controller with `{ targetActorId, addonId }` — `callerActorId` is never included.
- Controller `deleteVportServiceAddon.controller.js:11-13`: `if (!callerActorId) throw new Error("...callerActorId is required")`
- Result: Hook always throws at controller gate. The delete operation is effectively BROKEN for all callers (always throws "callerActorId is required").
- Secondary risk: callerActorId is never validated — but the error prevents execution. The hook is non-functional.
- Finding: BW-SERV-001 (CRITICAL) — ownership verification chain is structurally broken at hook layer. The feature cannot delete add-ons through the established UI path. Any direct API call that supplies a callerActorId bypasses the hook layer entirely. The controller gate itself is sound but unreachable from the UI hook.
- Result: **PARTIAL** [SOURCE_VERIFIED: useDeleteVportServiceAddon.js:19-23, deleteVportServiceAddon.controller.js:7-13]

**Attack: Pass null targetActorId to createOrUpdateVportServiceAddon**

- Controller line 17-19: `if (!targetActorId) throw new Error("...targetActorId is required")`
- Result: **BLOCKED** [SOURCE_VERIFIED: createOrUpdateVportServiceAddon.controller.js:17-19]

---

### C. Runtime Abuse (§5.3)

**Attack: Non-owner actor type reaches upsert services with asOwner=true read path**

- getVportServicesController lines 44-54: `if (asOwner) { if (!callerActorId) throw; await assertActorOwnsVportActorController(...) }`
- A non-owner authenticated actor calling with `asOwner=true` hits the ownership check and is rejected.
- Result: **BLOCKED** [SOURCE_VERIFIED: getVportServices.controller.js:44-54]

**Attack: Pass a VPORT-kind actor as callerActorId to assertActorOwnsVportActorController**

- The controller (assertActorOwnsVportActor.controller.js:28-30) checks `requesterActor.kind !== "user"` BEFORE any shortcut, throwing "Only actor owners can manage this booking resource."
- Result: **BLOCKED** [SOURCE_VERIFIED: assertActorOwnsVportActor.controller.js:22-30]

---

### D. RLS Verification (§5.4)

**upsertVportServicesByActorDal — vport.services table**

- DAL scopes insert to resolved `profileId` from `resolveVportProfileId(actorId)` (line 25-27).
- The profileId is resolved from `vport.profiles.actor_id` — a trusted DB lookup.
- RLS on `vport.services` is documented as unverified in current posture (no CARNAGE audit on record).
- The application-layer controller ownership check fires BEFORE this DAL is reached.
- Finding: BW-SERV-007 (MEDIUM) — RLS posture on `vport.services` unverified; if bypassed, the profile_id scoping in DAL does not prevent inserting services for any profile the attacker can resolve.

**deleteVportServiceAddonDal — vport.service_addons table**

- DAL correctly scopes delete to `.eq("id", addonId).eq("profile_id", profileId)` (lines 14-17). Two-column scope prevents ID-guessing attacks.
- RLS posture on `vport.service_addons` is UNVERIFIED.
- Finding: BW-SERV-008 (MEDIUM) — RLS posture on `vport.service_addons` unverified.

**dalInsertLocksmithServiceDetailDefaults — vport.locksmith_service_details table**

- Upsert uses `onConflict: 'service_id'` (line 35) — NOT `service_id + actor_id`.
- If an attacker knows a victim's service_id and can reach this DAL, they can overwrite locksmith service details for that service row.
- Application-layer: this DAL is only called from `upsertVportServices.controller.js` which has ownership check. Not reachable without ownership.
- RLS posture on `vport.locksmith_service_details` is UNVERIFIED.
- Finding: BW-SERV-006 (MEDIUM) — upsert conflict key on `service_id` alone; actor_id is not part of conflict key, enabling overwrite if RLS has a gap and service_id is known.

---

### E. Viewer Context Fuzzing (§5.5)

**Fuzz: null viewerActorId passed to VportServicesView with allowOwnerEditing=true**

- Screen `VportDashboardServicesScreen.jsx:23`: `viewerActorId = identity?.actorId ?? null`
- Line 34: `if (!identity) return <div>Sign in required.</div>` — blocks unauthenticated access.
- When viewerActorId is null, `useVportOwnership(null, actorId)` returns `isOwner=false` (line 19-21 of useVportOwnership.js).
- Line 44: `if (!isOwner) return <div>You can only manage services...</div>`
- Result: **BLOCKED** at UI layer (defense-in-depth, not the security boundary). Controller gates are independent.

**Fuzz: callerActorId=null with asOwner=true in getVportServicesController**

- Line 45-48: `if (!callerActorId) throw new Error("...callerActorId is required when asOwner=true")`
- Result: **BLOCKED** [SOURCE_VERIFIED: getVportServices.controller.js:45-48]

---

### F. Mutation Replay (§5.6)

**Attack: Re-trigger upsertVportServices after services already saved**

- upsert is idempotent by design (conflict on `profile_id,key`). No terminal state concept applies.
- Re-submitting the same payload is functionally a no-op.
- No state machine in services — enable/disable is a flag, not a state machine.
- Result: **BLOCKED** (not applicable — idempotent upsert design) [SOURCE_VERIFIED: upsertVportServicesByActor.dal.js:42-43]

**Attack: Re-trigger deleteVportServiceAddon after addon already deleted**

- Delete of a non-existent row: Supabase DELETE with `.eq("id", addonId).eq("profile_id", profileId)` on a non-existent row returns empty data without error.
- Controller returns `{ ok: true, addonId }` even if no row was affected.
- This is benign — no integrity violation from re-delete.
- Result: **BLOCKED** (idempotent delete) [SOURCE_VERIFIED: deleteVportServiceAddon.dal.js:14-22]

---

### G. Hydration Poisoning (§5.7)

**Viewer cache poisoning: can a mutation cause stale viewer data?**

- `getVportServices.controller.js:29` maintains a 60-second module-level TTL cache for viewer mode.
- `invalidateVportServices()` is exported at line 124 but never imported or called anywhere in the codebase. (Confirmed: grep shows zero callers outside the definition.)
- After `upsertVportServices`, the viewer cache is NOT invalidated.
- Observers visiting the same actor's services page within 60 seconds of an owner update will receive stale data.
- This is an integrity/consistency issue, not a direct security exploit. No data can be poisoned by an attacker — only stale by legitimate mutations.
- Finding: BW-SERV-004 (LOW) — `invalidateVportServices` exported but never called; viewer cache stale up to 60s post-mutation.
- Result: **PARTIAL** [SOURCE_VERIFIED: getVportServices.controller.js:124, confirmed no callers via grep]

---

### H. URL Surface (§5.9)

**Attack: Check if services-related notification links or share links expose raw UUIDs**

- No notification construction found in any services controller file. (Confirmed: grep for linkPath/notificationLink in controller/services/ returned 0 results.)
- The dashboard route for services is `/actor/:actorId/dashboard/services` — `actorId` in this URL is a UUID (raw actor UUID exposed in URL).
- Per platform memory rule "No raw IDs in public URLs", this is a pre-existing platform-wide convention concern but is an authenticated-only route, not a public share link.
- Result: No new notification URL surface. Route URL uses raw actorId per existing platform pattern (authenticated route only).
- Finding: BW-SERV-005 (LOW) — Dashboard services route exposes raw actorId UUID in URL; authenticated only, no share link surface. Low priority.

---

### I. §9 Invariant Attack Map

BEHAVIOR.md status is PLACEHOLDER. §9 Must Never Happen invariants are UNANCHORED.

Since no §9 invariants are formally declared, the following source-inferred invariants are constructed from the controller architecture and attacked:

**Inferred Invariant 1: "An actor must never mutate services for a vport they do not own."**
- Attack surface: upsertVportServicesController, deleteVportServiceAddonController
- Result: BLOCKED for upsert (ownership check fires). PARTIALLY BLOCKED for delete (hook is broken — callerActorId never passed, controller throws before reaching DAL). createOrUpdate and reorder have NO controller-layer ownership check — relying solely on RLS.
- Invariant Status: PARTIALLY UNANCHORED

**Inferred Invariant 2: "Disabled services must only be returned to the verified owner."**
- Attack: pass asOwner=true without callerActorId, or with a non-owner callerActorId.
- Result: BLOCKED — getVportServicesController:44-54 gates on asOwner before returning disabled services.
- Invariant Status: ANCHORED

**Inferred Invariant 3: "The Cloudflare upload endpoint must require authentication."**
- uploadToCloudflare.js:14-33: tries main supabase session first, falls back to `globalThis.__WANDERS_SB__` (Wentrex/cross-product client).
- If neither session has a token, auth headers are empty (line 29: `return {}`). The function proceeds with no auth header.
- The Cloudflare Worker is documented to enforce JWT verification server-side; if it is misconfigured or absent, files could be uploaded unauthenticated.
- Client-side fallback chain includes a cross-product auth leak (VEN-SERVICES-004, already open).
- Invariant Status: PARTIALLY ANCHORED (depends on Worker enforcement)

---

## 7. Exploitability Assessment

| BW Finding | Severity | Exploit Chain | Steps | Confidence |
|---|---|---|---|---|
| BW-SERV-001 | CRITICAL | Broken ownership verification chain (delete addon hook) | Single-step (hook never passes callerActorId) | [SOURCE_VERIFIED] |
| BW-SERV-002 | HIGH | No controller-layer ownership check on addon create/update — RLS sole barrier | Single-step (controller comment confirms RLS-only) | [SOURCE_VERIFIED] |
| BW-SERV-003 | HIGH | No controller-layer ownership check on addon reorder — RLS sole barrier | Single-step (controller comment confirms RLS-only) | [SOURCE_VERIFIED] |
| BW-SERV-009 | HIGH | Missing DAL files (createVportServiceAddon, updateVportServiceAddon, reorderVportServiceAddon) — controllers import non-existent modules | Single-step (runtime import error on first invocation) | [SOURCE_VERIFIED] |
| BW-SERV-006 | MEDIUM | locksmith_service_details upsert conflict key is service_id alone — actor_id not in conflict key | Multi-step (requires ownership bypass at controller first) | [SOURCE_VERIFIED] |
| BW-SERV-007 | MEDIUM | RLS posture on vport.services unverified — no CARNAGE audit on record | Single-step (RLS gap verification required) | [SCANNER_LOW_CONF] |
| BW-SERV-008 | MEDIUM | RLS posture on vport.service_addons unverified | Single-step (RLS gap verification required) | [SCANNER_LOW_CONF] |
| BW-SERV-004 | LOW | invalidateVportServices exported but never called — viewer cache stale up to 60s post-mutation | Single-step (observe stale data) | [SOURCE_VERIFIED] |
| BW-SERV-005 | LOW | Dashboard services route exposes raw actorId UUID in URL path | Single-step (URL observation) | [SOURCE_VERIFIED] |

---

## 8. Source Verification Summary

All BYPASSED or PARTIAL findings have [SOURCE_VERIFIED] provenance with file:line citations:

| Finding | File | Lines | Verification |
|---|---|---|---|
| BW-SERV-001 | useDeleteVportServiceAddon.js | 7, 19-23 | Hook calls controller without callerActorId |
| BW-SERV-001 | deleteVportServiceAddon.controller.js | 7-13 | Controller requires callerActorId; always throws when called from hook |
| BW-SERV-002 | createOrUpdateVportServiceAddon.controller.js | 8-10, 1-61 | No assertActorOwnsVportActorController call anywhere in file |
| BW-SERV-003 | reorderVportServiceAddon.controller.js | 9-10 | Explicit comment: no ownership check |
| BW-SERV-006 | locksmithServiceDetails.write.dal.js | 35 | onConflict: 'service_id' — actor_id excluded |
| BW-SERV-004 | getVportServices.controller.js | 124-126 | invalidateVportServices defined; grep confirms 0 callers |
| BW-SERV-009 | createOrUpdateVportServiceAddon.controller.js | 3-4 | Imports createVportServiceAddon.dal, updateVportServiceAddon.dal — both missing from filesystem |
| BW-SERV-009 | reorderVportServiceAddon.controller.js | 3 | Imports reorderVportServiceAddon.dal — missing from filesystem |

---

## 9. Confidence Summary

| Category | Count | Confidence Level |
|---|---|---|
| Source-verified findings | 7 | [SOURCE_VERIFIED] |
| Scanner-lead (RLS unverified) | 2 | [SCANNER_LOW_CONF] |
| BYPASSED claims requiring source | 0 | — (no bypass claimed without source) |
| BLOCKED claims | 8 | [SOURCE_VERIFIED] |
| PARTIAL claims | 4 | [SOURCE_VERIFIED] |

---

## 10. §9 Invariant Attack Map

BEHAVIOR.md is PLACEHOLDER — no §9 invariants are formally defined.

All invariants below are SOURCE-INFERRED from architecture patterns.

| Inferred Invariant | Attack Attempted | Result |
|---|---|---|
| Actor must not mutate services for unowned vport | Ownership bypass on all 4 write surfaces | MIXED — upsert BLOCKED; createOrUpdate and reorder UNANCHORED (RLS-only); delete STRUCTURALLY BROKEN at hook |
| Disabled services visible to verified owner only | asOwner=true without ownership | BLOCKED |
| Upload auth required | Auth header absent | PARTIALLY ANCHORED (Worker enforces server-side) |
| Viewer cache eventually consistent | Mutation without cache invalidation | LOW RISK — stale reads only, no data leak |

**CRITICAL NOTE:** BEHAVIOR.md must be authored to formalize §9 invariants. Until then, all invariant attacks remain UNANCHORED — security posture for this feature cannot be fully governed.

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md Status: PLACEHOLDER
§4 Failure Paths: UNANCHORED
§9 Must Never Happen: UNANCHORED

Finding: BW-SERV-MISSING-BEHAVIOR (HIGH) — absence of BEHAVIOR.md means §9 invariants are unverified governance contract, not tested invariants. All ownership invariants are source-inferred only.

RISK: Any future refactor could silently remove the ownership checks in upsertVportServices.controller.js and deleteVportServiceAddon.controller.js without a contract violation being detectable at governance review time.

---

## 12. THOR Impact

THOR Release Blockers from this review:

| Finding | Severity | THOR Blocker | Reason |
|---|---|---|---|
| BW-SERV-001 | CRITICAL | YES | Delete addon is non-functional from UI; ownership chain structurally broken at hook layer |
| BW-SERV-009 | HIGH | YES | Three DAL files referenced by controllers do not exist; runtime import error crashes createOrUpdate and reorder |
| BW-SERV-002 | HIGH | YES | No controller-layer ownership check on addon create/update; RLS-only with unverified posture |
| BW-SERV-003 | HIGH | YES | No controller-layer ownership check on addon reorder; RLS-only with unverified posture |
| BW-SERV-006 | MEDIUM | NO | Mitigated by controller-layer ownership check upstream |
| BW-SERV-007 | MEDIUM | NO — pending CARNAGE | RLS verification deferred to DB governance sprint |
| BW-SERV-008 | MEDIUM | NO — pending CARNAGE | RLS verification deferred to DB governance sprint |
| BW-SERV-004 | LOW | NO | Consistency issue only |
| BW-SERV-005 | LOW | NO | Pre-existing authenticated-route pattern |

---

## 13. SPIDER-MAN Test Requirements

The following test cases are required to close THOR blockers:

### BW-SERV-001
```
TEST: deleteVportServiceAddon — hook passes callerActorId from identity
- GIVEN: useDeleteVportServiceAddon is mounted with authenticated identity
- WHEN: mutate({ addonId }) is called
- THEN: controller receives callerActorId equal to identity.actorId

TEST: deleteVportServiceAddon — non-owner callerActorId is rejected
- GIVEN: callerActorId does not own targetActorId
- WHEN: deleteVportServiceAddonController({ callerActorId, targetActorId, addonId })
- THEN: throws "Actor does not own this vport actor."
```

### BW-SERV-002
```
TEST: createOrUpdateVportServiceAddon — non-owner targetActorId is rejected
- GIVEN: authenticated actor does not own targetActorId
- WHEN: createOrUpdateVportServiceAddonController({ targetActorId, addon })
- THEN: either controller throws ownership error, or RLS rejects at DB layer (must verify which)

TEST: createOrUpdateVportServiceAddon — hook passes callerActorId from identity
- Requires hook to be refactored to use useIdentity() and pass callerActorId
```

### BW-SERV-003
```
TEST: reorderVportServiceAddon — non-owner targetActorId is rejected
- GIVEN: authenticated actor does not own targetActorId
- WHEN: reorderVportServiceAddonController({ targetActorId, orderedIds })
- THEN: either controller throws ownership error, or RLS rejects at DB layer (must verify which)
```

### BW-SERV-009
```
TEST: createVportServiceAddon.dal exists and is importable
TEST: updateVportServiceAddon.dal exists and is importable
TEST: reorderVportServiceAddon.dal exists and is importable
- GIVEN: controllers import these DAL files
- WHEN: module is imported in test environment
- THEN: no import error thrown
```

### BW-SERV-007 / BW-SERV-008
```
TEST: Requires CARNAGE DB audit on vport.services and vport.service_addons RLS policies
- Confirm INSERT/UPDATE policies restrict to profile owner (via actor_owners join)
- Confirm no {public} insert/update policies exist on either table
```

---

*BLACKWIDOW V2 Review Complete — 2026-06-04*
*All BYPASSED/PARTIAL findings are SOURCE_VERIFIED with file:line citations.*
*BEHAVIOR.md must be authored before next BW run to anchor §9 invariants.*
