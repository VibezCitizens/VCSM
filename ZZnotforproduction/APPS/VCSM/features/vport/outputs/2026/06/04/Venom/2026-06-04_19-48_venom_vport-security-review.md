# VENOM V2 SECURITY REVIEW — vport

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | APPS/VCSM/features/vport |
| Feature | vport |
| Command | VENOM V2 |
| Ticket | TICKET-VENOM-VPORT-0001 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/vport/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_vport-security-review.md |
| Timestamp | 2026-06-04T19:48:00 |
| Reviewer | VENOM |
| App Scope | VCSM |

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
| write-surface-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 7 | Primary attack surface inventory |
| rpc-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 4 | RPC surface inventory |
| edge-function-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Edge function surface inventory |
| security-path-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 11 | Security path inventory |
| route-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Route→write chain resolution |
| write-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 7 | Write surface caller chain resolution |
| rpc-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 4 | RPC caller chain resolution |
| edge-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Edge caller chain resolution |

Scanner Version: 1.1.0
Overall Preflight: FRESH
Preflight Action: PASSED
Total surfaces in scope: 7 write + 4 rpc + 0 edge
Total security paths in scope: 11
HIGH confidence paths (resolved): 0
LOW confidence paths (unresolved): 11

**Note:** All 11 security paths carry LOW scanner confidence — the static analyzer could not resolve caller chains from any route. Per LOW Confidence Review Protocol (V2.4), every surface was manually traced from DAL to controller to hook to caller. Findings below are grounded in source verification.

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: vport
Scan Date: 2026-06-04T19:48:25.152Z

Write Surfaces: 7
  RPC (via Supabase): 4 — create_vport, soft_delete_vport, hard_delete_vport, restore_vport
  UPDATE (direct table): 3 — updateVport (profiles), updateVportAvatarMediaAssetIdDAL (profiles), updateVportBannerMediaAssetIdDAL (profiles)
  Tables affected: vport.profiles

RPC Calls: 4
  Schema: vport:create_vport, vport:soft_delete_vport, vport:hard_delete_vport, vport:restore_vport

Edge Functions: 0
  Functions: NONE

Security Paths: 11
  HIGH confidence (caller chain resolved): 0
  LOW confidence (caller chain unresolved): 11
  Access=protected: 0 (scanner could not determine — manually verified: all require auth)
  Access=public: 0
  Access=unknown: 11

Execution Paths Resolved (manual trace): 7 / 7 writes + 4 / 4 RPCs (all traced from source)
```

---

## 4. Scanner Signals

| Signal | Source Map | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|
| RPC create_vport at vport.core.dal.js | rpc-map | HIGH | YES — line 73, requireUser() present, DB RPC enforces auth; slug client-generated | [SOURCE_VERIFIED] | VEN-VPORT-001 |
| UPDATE profiles at vport.core.dal.js (updateVport) | write-surface-map | HIGH | YES — line 215, .eq("id", vportId) only; NO app-layer ownership check | [SOURCE_VERIFIED] | VEN-VPORT-002 |
| RPC soft_delete_vport at vport.core.dal.js | rpc-map | HIGH | YES — line 234, requireUser check absent in app layer; RPC auth only | [SOURCE_VERIFIED] | VEN-VPORT-003 |
| RPC restore_vport at vport.core.dal.js | rpc-map | HIGH | YES — line 267, ctrlRestoreVport has no ownership check in app layer | [SOURCE_VERIFIED] | VEN-VPORT-003 |
| RPC hard_delete_vport at vport.core.dal.js | rpc-map | HIGH | YES — line 251, ctrlHardDeleteVport has assertActorOwnsVportActorController — VERIFIED SAFE | [SOURCE_VERIFIED] | SAFE |
| UPDATE profiles at vport.write.profileMedia.dal.js (avatar) | write-surface-map | HIGH | YES — line 5, no session/auth guard in DAL; relies on actorId param from caller | [SOURCE_VERIFIED] | VEN-VPORT-004 |
| UPDATE profiles at vport.write.profileMedia.dal.js (banner) | write-surface-map | HIGH | YES — line 16, no session/auth guard in DAL; relies on actorId param from caller | [SOURCE_VERIFIED] | VEN-VPORT-004 |
| Migration barrel vport.public.js exports updateVport to non-owner paths | write-surface-map (indirect) | HIGH | YES — vport.public.js line 16, exported; only diagnostic consumer confirmed | [SOURCE_VERIFIED] | VEN-VPORT-005 |
| owner_user_id exposed in getVportById and getVportBySlug SELECT | write-surface-map (indirect) | HIGH | YES — vport.core.dal.js lines 137,153; owner_user_id in SELECT column list | [SOURCE_VERIFIED] | VEN-VPORT-006 |
| vportCoreOps.controller.js re-exports DAL functions directly | security-path-map (low conf) | LOW | YES — vportCoreOps.controller.js lines 1-3; controller is a pass-through to DAL | [SOURCE_VERIFIED] | VEN-VPORT-007 |
| All write surfaces have LOW confidence security paths (no route resolution) | security-path-map | LOW | YES — manually traced all 7 surfaces to hooks/controllers | [SOURCE_VERIFIED] | Informational |

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/vport/BEHAVIOR.md
BEHAVIOR.md exists: YES
BEHAVIOR.md status: PLACEHOLDER
§5 Security Rules declared: 0 (file is a PLACEHOLDER — no §5 section exists)
§5 Rules verified in source: N/A
§5 Rules unenforced: N/A — contract not yet written
§9 Must Never Happen declared: 0 (file is a PLACEHOLDER — no §9 section exists)
§9 Invariants protected in source: N/A
§9 Invariants unprotected: N/A — contract not yet written
```

**BEHAVIOR.md is a PLACEHOLDER.** The file exists but contains only:
```
Status: PLACEHOLDER
Feature: vport
Notes: Behavior contract pending source review.
```

No §5 Security Rules or §9 Must Never Happen invariants have been declared. VENOM cannot perform Behavior Contract Cross-Check. This is classified as a HIGH finding below (VEN-VPORT-008). Security posture cannot be fully evaluated without declared security invariants.

---

## 6. Trust Boundary Findings

---

### VEN-VPORT-001 — Client-side Slug Generation Creates Enumeration and Collision Risk

```
VENOM SECURITY FINDING
- Finding ID: VEN-VPORT-001
- Location: apps/VCSM/src/features/vport/dal/vport.core.dal.js:62-71
- Application Scope: VCSM
- Platform Surface: PWA / Supabase RPC
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Client constructs slug value sent to DB RPC — slug is input from the client
- Contract Violated: Actor Ownership Contract / VPORT Lifecycle Contract
- Current behavior: Slug is assembled client-side from the VPORT name + a 4-character Math.random()
  base-36 suffix. The slug is sent as p_slug to the create_vport RPC. The DB raises
  SLUG_ALREADY_EXISTS on collision, requiring client retry — there is no server-side uniqueness
  guarantee enforced before the RPC is called.
- Risk: (1) A 4-character base-36 suffix (~1.7M combinations) collides non-trivially at scale.
  Retry logic is exposed to the error boundary in CreateVportForm without explicit retry flow,
  leaving users stranded on collision. (2) The slug is composed of the VPORT name — an attacker
  who knows a target's intended business name can pre-register a slug with matching name prefix
  before the victim, occupying the slug namespace for that name. (3) The client controls the
  slug value entirely — no server-side normalization occurs before the RPC receives it
  (normalizeSlug runs client-side).
- Severity: LOW
- Exploitability: LOW
- Attack Preconditions:
  - Authenticated Citizen account required
  - Knowledge of target's intended VPORT name
  - Timing advantage required for squatting
- Blast Radius: Single VPORT creation flow — user-facing UX failure on collision
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: REQUIRED — DB RPC must enforce uniqueness; client slug uniqueness is not guaranteed
- Why it matters: Slug squatting degrades brand integrity for Citizen creators; collisions without
  retry UX leave users unable to create a VPORT with their intended name.
- Recommended mitigation: Move slug generation to the create_vport DB function (server-side).
  Remove p_slug parameter from the RPC signature. If client slug is retained, add a uniqueness
  pre-check DAL call before RPC invocation, or implement retry-with-new-suffix logic on
  SLUG_ALREADY_EXISTS errors.
- Rationale: Server-side slug generation eliminates the entire squatting surface and removes
  client control over a persistent public identifier.
- Follow-up command: DB (verify create_vport RPC signature; confirm whether slug uniqueness is
  enforced by DB constraint)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering
```

---

### VEN-VPORT-002 — updateVport Performs Ownership-Free Table UPDATE — App Layer Relies Entirely on RLS

```
VENOM SECURITY FINDING
- Finding ID: VEN-VPORT-002
- Location: apps/VCSM/src/features/vport/dal/vport.core.dal.js:183-228 (line 215 key)
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table (vport.profiles)
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Authenticated Citizen → VPORT Owner (no app-layer ownership check)
- Contract Violated: Actor Ownership Contract
- Current behavior: updateVport(vportId, patch) calls requireUser() to verify authentication,
  then executes: .from("profiles").update(patch).eq("id", vportId). The update is filtered
  only by the vportId primary key. No app-layer check verifies that the authenticated user
  owns the VPORT identified by vportId. Ownership enforcement (if any) relies entirely on
  the vport.profiles RLS UPDATE policy at the DB layer.
  
  Additionally, updateVport is exported via the migration barrel vport.public.js, making
  it directly callable from any code that imports that file. Current confirmed callers:
  dev/diagnostics only. However the barrel remains in the codebase without a removal
  deadline or access guard.

  By contrast, profile.write.dal.js updateProfile (vport mode) correctly adds
  .eq("owner_user_id", userId) — a defense-in-depth ownership check in the app layer.
  updateVport in vport.core.dal.js lacks this pattern.

- Risk: If the vport.profiles RLS UPDATE policy is absent, permissive, or misconfigured,
  any authenticated Citizen can update any other Citizen's VPORT name, bio, slug, avatar,
  or active status by supplying an arbitrary vportId. The app layer provides no ownership
  guard.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions:
  - Authenticated Citizen account required
  - Target VPORT ID (UUID) must be known — obtainable from public profiles, bookings, etc.
  - RLS UPDATE policy on vport.profiles must be absent or permissive
- Blast Radius: Multi-VPORT — any VPORT in the platform could be modified if RLS fails
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive (VPORT name/bio/avatar can be defaced)
- RLS Dependency: REQUIRED — correct security requires RLS defense-in-depth;
  app layer provides NONE (UNVERIFIED at DB layer — requires DB inspection)
- Why it matters: VPORT identity is the trust anchor for service providers on the platform.
  Unauthorized modification of a VPORT's name, bio, or avatar is brand defacement. Modifying
  is_active enables unauthorized deactivation of another provider's VPORT.
- Recommended mitigation: Add .eq("owner_user_id", userId) to the updateVport UPDATE query
  (match the pattern in profile.write.dal.js line 32-33). Additionally route DB command
  to verify the vport.profiles RLS UPDATE policy enforces auth.uid() = owner_user_id.
  Close the migration barrel: deprecate and remove updateVport from vport.public.js.
- Rationale: Defense-in-depth requires both app-layer owner filtering AND RLS. The parallel
  implementation in profile.write.dal.js proves the correct pattern already exists in the
  codebase.
- Follow-up command: DB (verify vport.profiles RLS UPDATE policy); ELEKTRA (trace updateVport
  call chain in detail for patch surface coverage)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security, Security Architecture and Engineering
```

---

### VEN-VPORT-003 — ctrlSoftDeleteVport and ctrlRestoreVport Have No App-Layer Ownership Check

```
VENOM SECURITY FINDING
- Finding ID: VEN-VPORT-003
- Location:
  apps/VCSM/src/features/settings/account/controller/account.controller.js:19-21 (ctrlSoftDeleteVport)
  apps/VCSM/src/features/settings/account/controller/account.controller.js:34-36 (ctrlRestoreVport)
- Application Scope: VCSM
- Platform Surface: PWA / Supabase RPC (soft_delete_vport, restore_vport)
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Authenticated Citizen → VPORT Owner
- Contract Violated: Actor Ownership Contract / VPORT Lifecycle Contract
- Current behavior:
  ctrlSoftDeleteVport({ vportId }) — takes only vportId, delegates directly to
  dalDeleteMyVport(vportId) → vportSchema.rpc("soft_delete_vport"). No callerActorId
  parameter, no assertActorOwnsVportActorController call in the controller.

  ctrlRestoreVport({ vportId }) — takes only vportId, delegates directly to
  dalRestoreVport(vportId) → vportSchema.rpc("restore_vport"). No callerActorId
  parameter, no assertActorOwnsVportActorController call in the controller.

  Both functions rely solely on the DB RPC to enforce session-based ownership.
  The RPCs surface AUTH_REQUIRED and VPORT_NOT_FOUND_OR_UNAUTHORIZED errors,
  suggesting DB-level enforcement exists, but this is UNVERIFIED at the app layer.

  By contrast, ctrlHardDeleteVport correctly uses assertActorOwnsVportActorController
  before calling the RPC — establishing the pattern that exists but is inconsistently applied.

- Risk: If the soft_delete_vport or restore_vport RPCs have defective ownership
  enforcement, any authenticated Citizen can soft-delete or restore any VPORT by
  supplying an arbitrary vportId. The inconsistency with ctrlHardDeleteVport
  suggests accidental omission.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions:
  - Authenticated Citizen account required
  - Target vportId (UUID) must be known
  - RPC ownership check must be absent or defective
- Blast Radius: Any VPORT on the platform — soft-delete would de-activate any VPORT;
  restore could re-activate deleted VPORTs owned by others
- Identity Leak Type: None
- Cache Trust Type: Booking-sensitive (deactivated VPORT disables all booking surfaces)
- RLS Dependency: REQUIRED — correct security requires app-layer ownership check PLUS
  DB RPC enforcement; only DB enforcement is present (UNVERIFIED state)
- Why it matters: Soft-deleting a competitor's VPORT is a platform abuse vector.
  A malicious Citizen could disable any active service provider's VPORT.
  restoreVport without ownership check enables reactivation of deleted VPORTs
  that the caller does not own.
- Recommended mitigation: Add callerActorId parameter to ctrlSoftDeleteVport and
  ctrlRestoreVport. Add assertActorOwnsVportActorController({ requestActorId: callerActorId,
  targetActorId: vportActorId }) before the RPC call, matching the pattern in
  ctrlHardDeleteVport. Callers (useVportsController, useAccountController) already have
  access to identity.actorId — the parameter addition is low-effort.
- Rationale: ctrlHardDeleteVport already shows the correct implementation. ctrlSoftDeleteVport
  and ctrlRestoreVport are inconsistent with it. Defense-in-depth requires app-layer ownership
  verification regardless of DB RPC enforcement.
- Follow-up command: DB (verify soft_delete_vport and restore_vport RPC ownership enforcement);
  SPIDER-MAN (add regression test: attempt soft-delete with non-owner actorId)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering, Security Assessment and Testing
```

---

### VEN-VPORT-004 — updateVportAvatarMediaAssetIdDAL and updateVportBannerMediaAssetIdDAL Have No Session Auth Guard

```
VENOM SECURITY FINDING
- Finding ID: VEN-VPORT-004
- Location:
  apps/VCSM/src/features/vport/dal/vport.write.profileMedia.dal.js:5-13 (avatar)
  apps/VCSM/src/features/vport/dal/vport.write.profileMedia.dal.js:16-23 (banner)
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table (vport.profiles)
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Caller-provided actorId trusted as ownership proof
- Contract Violated: Actor Ownership Contract
- Current behavior: Both DAL functions accept actorId as a plain parameter and execute
  .from("profiles").update(patch).eq("actor_id", actorId) without any session
  validation (no requireUser() call, no auth.getUser() check). Ownership depends entirely
  on the callerActorId being the authenticated user's own actor, enforced only at the
  caller layer.

  Confirmed callers:
  1. submitCreateVportController (line 84) — passes res.actorId from just-created VPORT.
     This is safe in context: actorId is returned by the create_vport RPC for the
     authenticated user's own VPORT.
  2. recordProfileMediaAssetController (lines 50, 57) — passes actorId from the controller
     parameter. This controller itself has no session guard — it receives actorId from
     upstream callers.

  The DAL provides no independent session verification. If a future caller passes an
  arbitrary actorId, the DAL will update that actor's VPORT media fields with no resistance.

- Risk: A future refactor or new caller passing an attacker-controlled actorId can update
  any VPORT's avatar or banner media asset record without auth verification in the DAL.
  The security boundary is caller-layer only — the DAL is fully permissive.
- Severity: MEDIUM
- Exploitability: LOW (current callers are safe; risk is from future callers)
- Attack Preconditions:
  - Requires a future code path that accepts an externally-controlled actorId parameter
    and routes it to these DAL functions
  - Current callers are constrained to session-owned actorId values
- Blast Radius: Single VPORT — avatar/banner media asset ID for one VPORT
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive (avatar/banner are public-facing)
- RLS Dependency: REQUIRED — vport.profiles UPDATE RLS should be the backstop;
  status UNVERIFIED
- Why it matters: Media DAL functions without session guards are unsafe for future callers
  and violate the VCSM DAL pattern (compare: vport.core.dal.js requireUser() on all writes).
  The inconsistency creates a footgun for any future code that imports these functions.
- Recommended mitigation: Add requireUser() or equivalent session validation to both
  functions, matching the pattern in vport.core.dal.js lines 22-28. Or restrict these
  DALs to internal module access only (unexported) and enforce the caller-layer contract
  in documentation. Add a comment clearly stating the trust assumption.
- Rationale: DAL functions that mutate vport.profiles should verify the session,
  not rely on callers to pass safe actorId values.
- Follow-up command: ELEKTRA (trace all import paths of these DAL functions to verify
  no external actorId injection path exists)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Identity and Access Management
```

---

### VEN-VPORT-005 — Migration Barrel (vport.public.js) Exports updateVport Without Removal Deadline

```
VENOM SECURITY FINDING
- Finding ID: VEN-VPORT-005
- Location: apps/VCSM/src/features/vport/vport.public.js:1-19
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Any code in the VCSM codebase
- Boundary Violated: Adapter boundary — DAL function exported through an uncontrolled barrel
- Contract Violated: Actor Ownership Contract / Boundary Isolation Contract
- Current behavior: vport.public.js is self-described as a "MIGRATION BARREL — not a model."
  It exports updateVport, createVport, getVportById, getVportBySlug, getVportsByIds,
  listMyVports directly from the DAL. The comment states "Do not add new exports here.
  Remove once CreateVportForm is split (Phase 2 remediation)."

  Confirmed callers: dev/diagnostics/groups/vportFeature.group.js only (imports updateVport,
  getVportById, getVportBySlug, createVport, listMyVports).

  updateVport has NO app-layer ownership check (see VEN-VPORT-002). Its presence in
  this barrel means any future import from this file gets direct access to an
  ownership-unchecked write function.

- Risk: The barrel has no enforcement preventing future feature code from importing
  updateVport and using it without ownership verification. Phase 2 remediation has
  no tracked deadline. As the codebase grows, the risk of accidental direct DAL
  import increases.
- Severity: MEDIUM
- Exploitability: LOW (architectural risk, not currently exploitable)
- Attack Preconditions:
  - Requires a developer to import updateVport from vport.public.js in a feature path
    that receives an external vportId
- Blast Radius: Any VPORT — if updateVport is called from a production path
  without ownership check
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: REQUIRED — same as VEN-VPORT-002
- Why it matters: Migration barrels with ownership-unchecked write functions are
  architectural security debt. "Phase 2 remediation" without a tracked ticket is
  a permanent deferral risk.
- Recommended mitigation: Open a tracked engineering ticket for Phase 2 remediation.
  Mark vport.public.js with a JSDoc @deprecated annotation. Restrict diagnostics import
  to use the DAL directly (the diagnostics tool already has the correct import path).
  Remove the barrel file once the sole consumer is migrated.
- Rationale: The barrel is a vestigial indirection that creates persistent import surface
  for an ownership-unsafe function. Deprecation without a tracked deadline is insufficient.
- Follow-up command: SPIDER-MAN (grep for future imports of vport.public.js outside diagnostics)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering
```

---

### VEN-VPORT-006 — owner_user_id Exposed in getVportById and getVportBySlug SELECT Columns

```
VENOM SECURITY FINDING
- Finding ID: VEN-VPORT-006
- Location:
  apps/VCSM/src/features/vport/dal/vport.core.dal.js:137 (getVportById SELECT)
  apps/VCSM/src/features/vport/dal/vport.core.dal.js:153 (getVportBySlug SELECT)
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table (vport.profiles)
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Internal UUID (Supabase Auth user UUID) returned with VPORT read results
- Contract Violated: Public Identity Surface Contract / Asset Security
- Current behavior: Both getVportById and getVportBySlug include owner_user_id in their
  SELECT column lists:
  SELECT = "id,owner_user_id,name,slug,avatar_url,banner_url,bio,is_active,created_at,updated_at,actor_id"

  owner_user_id is the Supabase auth.users UUID — a raw internal authentication identifier.
  Returning it in VPORT read results means any caller of these functions receives the raw
  auth UUID of the VPORT owner.

  Current callers of these functions: vport.public.js (migration barrel, diagnostics only).
  The functions are not currently called from production UI paths, but they are exported and
  available for future use.

  Note: listMyVports also includes owner_user_id but is scoped to the authenticated user's
  own VPORTs — acceptable in that context.

- Risk: If getVportById or getVportBySlug are called from a production path that returns
  data to the client (e.g., profile viewing, SEO, public VPORT page), the owner's Supabase
  auth UUID would be exposed to any viewer. This enables auth user enumeration, correlation
  attacks, and may violate data minimization principles.
- Severity: MEDIUM
- Exploitability: LOW (not on a production path currently; risk if added to a public call)
- Attack Preconditions:
  - These functions must be used in a production read path
  - The response data must be returned to the client
- Blast Radius: Any VPORT owner whose profile is read via these functions
- Identity Leak Type: Internal UUID exposure / Actor correlation
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: UNVERIFIED — read policy on vport.profiles unknown
- Why it matters: Supabase auth user UUIDs are internal identifiers. Exposing them enables
  correlation across tables and violates the VCSM identity surface contract which restricts
  public surfaces to actorId + kind.
- Recommended mitigation: Remove owner_user_id from the SELECT string in getVportById
  and getVportBySlug. The platform identity surface is actorId. If owner resolution is
  needed internally, add a separate scoped query. Apply the same cleanup to listMyVports
  if those results are ever passed to non-owner callers.
- Rationale: Data minimization — return only what callers need. actorId is the canonical
  VCSM identity field; owner_user_id has no legitimate use in public VPORT read payloads.
- Follow-up command: ELEKTRA (verify these functions are not on any production public path)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Identity and Access Management
```

---

### VEN-VPORT-007 — vportCoreOps.controller.js Violates Controller Layer — DAL Functions Exported Directly

```
VENOM SECURITY FINDING
- Finding ID: VEN-VPORT-007
- Location: apps/VCSM/src/features/vport/controller/vportCoreOps.controller.js:1-3
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Any code importing from this "controller"
- Boundary Violated: Architecture boundary — controller layer bypassed; DAL exported directly
- Contract Violated: Boundary Isolation Contract / VCSM Architecture Contract
- Current behavior: vportCoreOps.controller.js contains only:
  ```
  import { createVport, restoreVport } from '@/features/vport/dal/vport.core.dal'
  export { createVport, restoreVport }
  ```
  This file is named a "controller" but performs zero business logic, zero auth enforcement,
  and zero validation. It is a transparent pass-through that re-exports DAL functions.

  Callers: useVportCoreOps hook imports from this file. The hook is then used by
  useJoinBarbershop and useVportAccountOps.

  In the join barbershop flow (useJoinBarbershop.js:43), createVport is called with
  a name string from user input and vportType hardcoded to "barber". No controller-level
  validation layer exists between the UI and the DAL call.

- Risk: The missing controller layer means business rules that should belong at the controller
  (ownership verification, input validation, type enforcement beyond the DAL's toCategoryKey)
  have no guaranteed enforcement point. Any future code path using this file treats the DAL
  as the public API.
- Severity: MEDIUM
- Exploitability: LOW (createVport uses DB RPC with auth; restoreVport similarly)
- Attack Preconditions:
  - A future code path must exploit the missing controller layer to bypass a business rule
- Blast Radius: Any VPORT created or restored via this path
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED — DAL calls RPC which enforces auth
- Why it matters: Architecture contract violation. The mandatory build order is
  DAL → Model → Controller → Hook → Component. A controller that only re-exports DAL
  functions breaks this contract, reducing the security surface area of the controller layer
  to zero. Security rules that belong in the controller must be placed elsewhere or duplicated.
- Recommended mitigation: Implement actual controller logic in vportCoreOps.controller.js
  or remove this file and have callers use the proper submitCreateVportController path
  (which exists and has input validation). Rename this file to vportCoreOps.dal.bridge.js
  with a removal deadline if a proper refactor is planned.
- Rationale: Architecture layers exist partly to provide security enforcement points.
  A zero-logic "controller" eliminates that point.
- Follow-up command: ARCHITECT (flag this as a layer violation in the architecture map)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Software Development Security
```

---

### VEN-VPORT-008 — BEHAVIOR.md Is a PLACEHOLDER — Security Invariants Undeclared

```
VENOM SECURITY FINDING
- Finding ID: VEN-VPORT-008
- Location: ZZnotforproduction/APPS/VCSM/features/vport/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Documentation
- Trust Boundary: Governance / Audit
- Boundary Violated: Security governance boundary — no declared security rules for a
  lifecycle-critical feature
- Contract Violated: Behavior Contract (§5 Security Rules, §9 Must Never Happen)
- Current behavior: BEHAVIOR.md exists but contains only:
  "Status: PLACEHOLDER / Feature: vport / Notes: Behavior contract pending source review."
  There are no §5 Security Rules and no §9 Must Never Happen invariants defined.
  This means:
  - No declared rule about who can create a VPORT
  - No declared rule about who can delete/restore a VPORT
  - No declared invariant preventing one user from modifying another user's VPORT
  - No declared invariant about VPORT lifecycle transitions
  - No declared rule about what fields can be updated by the owner
- Risk: Without declared invariants, VENOM cannot certify that security rules are
  fully enforced. Future developers have no contract to test against. SPIDER-MAN
  has no anchor for regression tests. THOR cannot gate on invariant coverage.
- Severity: HIGH
- Exploitability: N/A — governance gap, not directly exploitable
- Attack Preconditions: N/A
- Blast Radius: Full feature security posture — all 7 write surfaces lack a declared
  security contract
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: None
- Why it matters: vport is a lifecycle-critical feature — VPORT creation, deletion,
  and restoration are irreversible or semi-reversible operations affecting platform
  identity. Without a BEHAVIOR.md §5/§9, security coverage cannot be assessed,
  tested, or gated at release.
- Recommended mitigation: Write the vport BEHAVIOR.md with at minimum:
  §5 Security Rules covering: create (authenticated user only, one VPORT per type per user),
  update (owner only, verified via owner_user_id or actor_owners), soft-delete (owner only),
  hard-delete (owner only, must be pre-soft-deleted), restore (owner only).
  §9 Must Never Happen: one user must never modify another's VPORT; a deleted VPORT must
  not be publicly visible; VPORT lifecycle state must not be modifiable without ownership proof.
- Rationale: BEHAVIOR.md §5/§9 are the security contract that anchors VENOM, ELEKTRA,
  SPIDER-MAN, and THOR. A PLACEHOLDER is a governance void for a critical feature.
- Follow-up command: Wolverine (intake for BEHAVIOR.md authoring); SPIDER-MAN (once
  BEHAVIOR.md §9 exists, create mandatory regression tests)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Security Assessment and Testing
```

---

## 7. Source Verification Summary

| Surface | File | Source Read | Auth Verified | Ownership Verified | Finding |
|---|---|---|---|---|---|
| create_vport RPC | vport.core.dal.js:46-116 | YES | requireUser() at line 54 | YES — RPC enforces auth | VEN-VPORT-001 (slug) |
| updateVport UPDATE | vport.core.dal.js:183-228 | YES | requireUser() at line 196 | NO — no .eq(owner_user_id) in app layer | VEN-VPORT-002 |
| soft_delete_vport RPC | vport.core.dal.js:231-245 | YES | None in app controller | UNVERIFIED — RPC only | VEN-VPORT-003 |
| restore_vport RPC | vport.core.dal.js:265-280 | YES | None in app controller | UNVERIFIED — RPC only | VEN-VPORT-003 |
| hard_delete_vport RPC | vport.core.dal.js:248-263 + account.controller.js:23-31 | YES | assertActorOwnsVportActorController | VERIFIED | SAFE |
| updateVportAvatarMediaAssetIdDAL | vport.write.profileMedia.dal.js:5-13 | YES | No session guard | Caller-dependent | VEN-VPORT-004 |
| updateVportBannerMediaAssetIdDAL | vport.write.profileMedia.dal.js:16-23 | YES | No session guard | Caller-dependent | VEN-VPORT-004 |

Total surfaces in scope: 7 write + 4 rpc
Surfaces source-verified: 7 / 7 writes (all traced)
RPCs source-verified: 4 / 4
Source files read: vport.core.dal.js, vport.write.profileMedia.dal.js, vport.read.vportRecords.dal.js, vportCoreOps.controller.js, submitCreateVport.controller.js, getVportServiceCatalog.controller.js, account.controller.js (settings), useCreateVport.js, useRestoreVport.js, useVportCoreOps.js, vport.public.js, vport.adapter.js, vport.public.adapter.js, CreateVportForm.jsx, CreateVportDebugPanel.jsx, createVportForm.model.js, recordProfileMediaAsset.controller.js, profile.write.dal.js, account.write.dal.js, useVportAccountOps.js, useVportsController.js (partial), upsertVportServices.controller.js, barberVport.read.dal.js

CRITICAL findings: 0 — threshold not reached
HIGH findings: 2 (VEN-VPORT-002, VEN-VPORT-003) — both [SOURCE_VERIFIED]: YES

---

## 8. Confidence Summary

HIGH confidence scanner surfaces: 11 (all 7 write + 4 RPC)
LOW confidence security paths: 11 (scanner could not resolve caller chains — all manually traced)
[SOURCE_VERIFIED] findings: 8
[SCANNER_LEAD] findings: 0
[SCANNER_LOW_CONF] findings: 0

All findings are SOURCE_VERIFIED. No findings were derived from scanner confidence alone.

---

## 9. THOR Impact

THOR Release Blockers: NONE

Highest Open Severity: HIGH (VEN-VPORT-002, VEN-VPORT-003)

THOR Assessment:
- No CRITICAL findings — no immediate THOR block.
- VEN-VPORT-002 (updateVport no ownership check) and VEN-VPORT-003 (soft-delete/restore
  no ownership check) are HIGH and should be resolved before the next vport lifecycle
  feature ships. They are not standalone release blockers if RLS is confirmed present
  by the DB command — however they BECOME release blockers if DB confirms RLS is absent
  on vport.profiles UPDATE.
- VEN-VPORT-008 (BEHAVIOR.md PLACEHOLDER) is a governance debt that should be resolved
  before THOR clears this feature for a major release.

---

## 10. Required Follow-Up Commands

| Command | Reason | Priority |
|---|---|---|
| DB | Verify vport.profiles RLS UPDATE policy — confirms whether VEN-VPORT-002 is a standalone risk or covered by DB | P0 before next vport lifecycle ship |
| DB | Verify soft_delete_vport and restore_vport RPC ownership enforcement (VEN-VPORT-003) | P0 before next vport lifecycle ship |
| DB | Verify hard_delete_vport and create_vport RPC auth enforcement as a baseline check | P1 |
| ELEKTRA | Trace all import paths for updateVportAvatarMediaAssetIdDAL and updateVportBannerMediaAssetIdDAL to confirm no external actorId injection path (VEN-VPORT-004) | P1 |
| ELEKTRA | Confirm getVportById and getVportBySlug are not on any public production call path (VEN-VPORT-006) | P1 |
| SPIDER-MAN | Add regression test: attempt updateVport with non-owner user — must fail (VEN-VPORT-002) | P1 |
| SPIDER-MAN | Add regression test: attempt soft_delete with non-owner actorId — must fail (VEN-VPORT-003) | P1 |
| SPIDER-MAN | Add regression test: attempt restore_vport with non-owner actorId — must fail (VEN-VPORT-003) | P1 |
| Wolverine | Intake for vport BEHAVIOR.md authoring — §5 Security Rules + §9 Must Never Happen (VEN-VPORT-008) | P2 |
| ARCHITECT | Flag vportCoreOps.controller.js as layer violation in architecture map (VEN-VPORT-007) | P2 |

---

## 11. MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-VPORT-001 | Slug squatting + collision UX failure | DAL / RPC | P3 | App / DB | DB |
| VEN-VPORT-002 | VPORT update with no app-layer ownership check | DAL | P1 | App | DB, ELEKTRA |
| VEN-VPORT-003 | Soft-delete / restore no app-layer ownership check | Controller | P1 | App | DB, SPIDER-MAN |
| VEN-VPORT-004 | Media asset DAL missing session guard | DAL | P2 | App | ELEKTRA |
| VEN-VPORT-005 | Migration barrel exposes ownership-unsafe updateVport | Documentation / Architecture | P2 | App | SPIDER-MAN |
| VEN-VPORT-006 | owner_user_id in public VPORT read SELECT columns | DAL | P2 | App | ELEKTRA |
| VEN-VPORT-007 | vportCoreOps.controller.js is a zero-logic DAL bridge | Architecture | P2 | App | ARCHITECT |
| VEN-VPORT-008 | BEHAVIOR.md is a PLACEHOLDER for a lifecycle-critical feature | Documentation | P1 | App | Wolverine |

---

## 12. CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VEN-VPORT-008 — governance contract missing for lifecycle-critical feature |
| Asset Security | 1 | VEN-VPORT-006 — owner_user_id (auth UUID) in read SELECT payloads |
| Security Architecture and Engineering | 4 | VEN-VPORT-002, VEN-VPORT-003, VEN-VPORT-005, VEN-VPORT-007 — missing defense-in-depth; layer violations |
| Communication and Network Security | 0 | No edge function, public API, or network surface findings in scope |
| Identity and Access Management | 3 | VEN-VPORT-002, VEN-VPORT-003, VEN-VPORT-004 — ownership unchecked at app layer |
| Security Assessment and Testing | 2 | VEN-VPORT-003, VEN-VPORT-008 — no tests for ownership enforcement; no behavior contract |
| Security Operations | 0 | Debug panel correctly guarded by import.meta.env.DEV — no production debug leakage found |
| Software Development Security | 3 | VEN-VPORT-001, VEN-VPORT-004, VEN-VPORT-005 — input trust, session-less DAL, unsafe barrel |

**Uncovered Domains:**
- Communication and Network Security — No edge functions in scope; vport schema uses server-side Supabase RPC; no public/external API surface found in this feature. Not applicable to this scan.
- Security Operations — CreateVportDebugPanel correctly uses `import.meta.env.DEV` guard (line 2). No unguarded console.log found in vport feature source. No production debug leakage detected. Domain covered, findings = 0.

---

*VENOM V2 Review Complete — vport — 8 findings (0 CRITICAL, 2 HIGH, 4 MEDIUM, 2 LOW)*
*All findings SOURCE_VERIFIED. Report written to outputs/2026/06/04/Venom/*
