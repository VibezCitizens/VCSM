# VENOM V2 Security Review — media

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report ID | VENOM-MEDIA-2026-06-04 |
| Feature | media |
| Application Scope | VCSM |
| Review Date | 2026-06-04 |
| Reviewer | VENOM (automated security review) |
| VENOM Version | V2 |
| Scanner Version | 1.1.0 |
| Report File | ZZnotforproduction/APPS/VCSM/features/media/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_media-security-review.md |

---

## 2. Scanner Preflight Block

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                  | Generated At             | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs Block

| Surface | Count |
|---|---|
| Write Surfaces | 2 |
| RPCs | 0 |
| Security Paths | 2 |
| Write Execution Paths | 2 |
| RPC Execution Paths | 0 |
| Edge Functions | 0 |

Write surfaces identified:
1. `softDeleteMediaAssetDAL` — UPDATE on `platform.media_assets` (confidence: HIGH)
2. `insertMediaAssetDAL` — INSERT on `platform.media_assets` (confidence: HIGH)

Both security paths have confidence: LOW — neither has a confirmed route execution path (service-layer feature, no routes).

---

## 4. Security Surface Inventory

| Surface | Operation | Table | File | Layer |
|---|---|---|---|---|
| `softDeleteMediaAssetDAL` | UPDATE | platform.media_assets | apps/VCSM/src/features/media/dal/mediaAssets.softDelete.dal.js | dal |
| `insertMediaAssetDAL` | INSERT | platform.media_assets | apps/VCSM/src/features/media/dal/mediaAssets.write.dal.js | dal |

**Callers of `insertMediaAssetDAL` (via `createMediaAssetController`):**
- `apps/VCSM/src/features/settings/profile/hooks/useProfileUploads.js` — user/vport avatar + banner uploads
- `apps/VCSM/src/features/chat/conversation/controller/recordChatAttachment.controller.js` — chat image attachments
- `apps/VCSM/src/features/vport/controller/submitCreateVport.controller.js` — VPORT creation avatar
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/controller/addPortfolioMediaWithRecord.controller.js` — portfolio media
- `apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js` — flyer image uploads (NO ownership pre-check)
- `apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js` — design studio assets
- `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/saveVportActorMenuItem.controller.js` — menu item photos
- `apps/VCSM/src/features/wanders/core/controllers/cards.controller.js` — wanders card media (userId/actorId mismatch on upload)
- `apps/VCSM/src/features/wanders/core/controllers/publishWandersFromBuilder.controller.js` — wanders builder card media
- `apps/VCSM/src/features/upload/controller/recordPostMedia.controller.js` — post media records

**Callers of `softDeleteMediaAssetDAL` (via `softDeleteMediaAssetController`):**
- No external callers found outside media feature boundary. The adapter exports it but no other feature currently calls it directly.

---

## 5. Scanner Signals Block

| Signal | Confidence | Detail |
|---|---|---|
| Write surface `softDeleteMediaAssetDAL` discovered | HIGH | DAL UPDATE confirmed by AST |
| Write surface `insertMediaAssetDAL` discovered | HIGH | DAL INSERT confirmed by AST |
| No route execution path resolved for either surface | LOW | Feature has no routes — service layer. Expected. |
| No RPCs detected | N/A | Media feature does not use stored procedures |
| No edge functions | N/A | Not applicable |

Scanner note: LOW path confidence is expected for this feature — it is a pure service layer with no routes of its own. Source inspection confirmed both surfaces are reachable from multiple caller paths.

---

## 6. Behavior Contract Status

**BEHAVIOR.md Path:** `ZZnotforproduction/APPS/VCSM/features/media/BEHAVIOR.md`
**BEHAVIOR.md Status:** PLACEHOLDER — contains only stub text

```
Status: PLACEHOLDER
Notes: Behavior contract pending source review.
```

**§5 Security Rules extracted:** NONE (PLACEHOLDER — no rules authored)
**§9 Must Never Happen extracted:** NONE (PLACEHOLDER — no invariants authored)

**FINDING:** MISSING_BEHAVIOR_CONTRACT

The BEHAVIOR.md for the media feature exists as a file but is a non-functional placeholder. No security rules, no invariants, and no contract language have been authored. This means:
- Cross-check against BEH IDs is impossible
- No authoritative definition of what this module guarantees to callers
- Security review must rely entirely on source inspection and architecture docs

This is a HIGH governance finding — the media feature is called by 10+ features across the platform and has no formal contract.

---

## 7. Trust Boundary Findings

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-MEDIA-001
- Location: apps/VCSM/src/features/media/dal/mediaAssets.softDelete.dal.js:28-30
- Application Scope: VCSM
- Platform Surface: Supabase Table (platform.media_assets UPDATE)
- Trust Boundary: authenticated users via Supabase RLS
- Boundary Violated: Privilege over-grant — broad column UPDATE policy for public role persists on live DB
- Contract Violated: Principle of least privilege; TICKET-PLATFORM-RLS-001 (open)
- Current behavior: A {public} role UPDATE policy named `media_assets_vc_owner_update` coexists on platform.media_assets alongside the actor-owner soft-delete policy. This policy grants unrestricted column-level UPDATE to the public role, meaning unauthenticated requests (or any authenticated request) can attempt column updates beyond the soft-delete columns (status, deleted_at, deleted_by_actor_id, updated_at). The soft-delete DAL comment explicitly documents this and defers cleanup to Phase 6.
- Risk: An unauthenticated or incorrectly-scoped actor could attempt to UPDATE arbitrary columns on any media_assets row if the public policy's USING/WITH CHECK predicates are insufficiently restrictive. The migration migration history does NOT include any DROP or ALTER for this policy — it was created out-of-band via SQL editor and has never been migrated down.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions: Attacker must know a valid media asset UUID. The policy's own predicates may still provide meaningful restriction, but they cannot be verified from migration files alone since the policy was created out-of-band.
- Blast Radius: All rows in platform.media_assets across all owner_source types. Could affect any feature that records media assets.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — policy exists on live DB but was not created via migrations; exact USING/WITH CHECK predicates cannot be verified from source files
- Why it matters: platform.media_assets is an infrastructure table consumed by 10+ features. A broad UPDATE surface that bypasses ownership enforcement would allow any authenticated actor to overwrite storage URLs, change media status, or corrupt metadata on assets owned by others.
- Recommended mitigation: Execute the Phase 6 cleanup migration: DROP the `media_assets_vc_owner_update` policy; verify that `media_assets_vc_owner_insert`, `media_assets_vc_owner_select`, and the actor-owner soft-delete policy provide complete coverage for all legitimate use cases. Schedule as CARNAGE migration.
- Rationale: The policy is documented as "deferred cleanup" with known risk. TICKET-PLATFORM-RLS-001 is already open. This finding formally records it in the VENOM audit trail and elevates it to MEDIUM with THOR-blocking consideration.
- Follow-up command: Carnage (migration), DB (live policy inspection)
- Provenance: SOURCE_VERIFIED — documented at apps/VCSM/src/features/media/dal/mediaAssets.softDelete.dal.js:28-30 and ARCHITECTURE.md
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Security Architecture and Engineering
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-MEDIA-002
- Location: apps/VCSM/src/features/media/dal/mediaAssets.write.dal.js:59-93 (insertMediaAssetDAL); apps/VCSM/src/features/media/controller/createMediaAsset.controller.js:25-79
- Application Scope: VCSM
- Platform Surface: Supabase Table (platform.media_assets INSERT)
- Trust Boundary: authenticated users; caller-supplied actorId flows to DB without app-layer session verification
- Boundary Violated: Caller identity trusted without cross-reference to authenticated session
- Contract Violated: VCSM identity contract — actorId must always be derived from or verified against the authenticated session; caller-supplied actor IDs must not be trusted blindly
- Current behavior: `insertMediaAssetDAL` accepts `owner_actor_id` and `created_by_actor_id` directly from the caller. `createMediaAssetController` passes `ownerActorId` and `createdByActorId` as parameters with no verification that these values correspond to the currently authenticated user's session. The DB INSERT RLS policy "actor owner can insert media asset" (migration 20260430300000) checks `vc.actor_owners WHERE actor_id = owner_actor_id AND user_id = auth.uid()` — this IS ownership enforcement, but it operates only at the DB layer. If a caller mistakenly or maliciously passes another user's actorId, the RLS will block the write — however there is no app-layer early rejection, meaning every mismatched call generates a DB round-trip and a 403 error leaking that the actorId exists.
- Risk: A misconfigured caller could pass a foreign actorId. The RLS provides a backstop but the app layer provides no pre-validation. More critically, for the `vport` owner_source uploads (avatar, banner, portfolio), the INSERT RLS relies on the ORIGINAL broad policy (no owner_source restriction, only vc.actor_owners check) — there is no `media_assets_vport_owner_insert` policy scoped to `owner_source = 'vport'`. The hardening migration 20260527 added `vc_owner_insert` (owner_source='vc' only) but left vport/chat scopes relying on the unscoped original policy. This creates a gap: a user could insert a row with owner_source='vport' while only being a 'vc'-typed actor, passing the original policy.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions: Authenticated user. Must know a target vport actorId that they own (already in vc.actor_owners). Could insert media with owner_source='vport' even when only a 'vc' actor. The vc.actor_owners check is the same for both owner types since vport actors are also registered in vc.actor_owners.
- Blast Radius: platform.media_assets rows with incorrect owner_source tagging. Data integrity impact — does not grant access to others' assets, but corrupts the owner_source classification used by queries and policies.
- Identity Leak Type: Actor identity spoofing via owner_source mismatch
- Cache Trust Type: None
- RLS Dependency: ASSUMED — original insert policy provides coverage but does not enforce owner_source discipline
- Why it matters: The owner_source field is used in RLS policies (vc_owner_insert, learning_owner_insert, vc_owner_select, learning_owner_select). Allowing insertion with a mismatched owner_source means those newer per-source policies will not match the row, leading to invisible assets or policy gaps in future enforcement.
- Recommended mitigation: (1) Add app-layer actorId session verification in `createMediaAssetController` — call `supabase.auth.getUser()` and verify `ownerActorId` is in the caller's actor set. (2) Add a `media_assets_vport_owner_insert` policy scoped to `owner_source = 'vport'` using `vport.actor_can_manage_profile` or a direct vc.actor_owners join. (3) Add `media_assets_chat_owner_insert` for `owner_source = 'chat'`. (4) Consider dropping the original unscoped "actor owner can insert media asset" policy once per-source policies are complete.
- Rationale: Defense-in-depth requires both app-layer and DB-layer enforcement. The DB-layer backstop exists but is insufficiently granular. The app layer has no guard.
- Follow-up command: DB (live RLS inspection), Carnage (owner_source-scoped insert policies), SPIDER-MAN (test coverage for insert scenarios)
- Provenance: SOURCE_VERIFIED — migrations 20260430300000 + 20260527130000 read; controller source read
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Identity and Access Management
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-MEDIA-003
- Location: apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js:8-31
- Application Scope: VCSM
- Platform Surface: PWA (upload trigger in flyerEditor controller)
- Trust Boundary: Dashboard — authenticated VPORT owner
- Boundary Violated: Upload proceeds before ownership is verified at app layer
- Contract Violated: VCSM security contract — write operations on actor-owned resources must verify ownership before initiating any I/O
- Current behavior: `uploadFlyerImageCtrl({ vportId, file })` calls `uploadMediaController` (Cloudflare R2 upload) and then calls `createMediaAssetController` to record the asset — all WITHOUT calling `requireOwnerActorAccess(vportId)` first. The ownership check is present in `saveFlyerPublicDetailsCtrl` (same file, line 35) but is absent from `uploadFlyerImageCtrl`. Compare: `designStudio.assetsExports.controller.js:ctrlUploadDesignAsset` (same feature) DOES call `requireOwnerActorAccess` before upload — this is an inconsistent ownership enforcement pattern within the same subsystem.
- Risk: An authenticated user who obtains a valid vportId (e.g., from a public URL) can trigger Cloudflare R2 uploads attributed to that VPORT and insert `platform.media_assets` rows with that VPORT's `owner_actor_id`. The RLS on `platform.media_assets` INSERT provides a backstop (vc.actor_owners check), but the R2 upload itself (Cloudflare storage write) is NOT RLS-protected — it happens outside Supabase. The media_assets row insertion will be blocked by RLS if the user doesn't own the vportId, but the storage object will have already been written to R2 under that VPORT's path prefix.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions: Authenticated VCSM user. Must know a valid vportId (publicly visible in profiles, URLs). Does not need to own the vport.
- Blast Radius: Cloudflare R2 storage pollution — arbitrary files written under any VPORT's path prefix. R2 storage costs, path namespace pollution, potential CDN cache poisoning if storage keys overlap with legitimate assets.
- Identity Leak Type: Unauthorized write to another actor's storage namespace
- Cache Trust Type: None
- RLS Dependency: REQUIRED (INSERT is RLS-blocked) but upload transport (R2) has no RLS — the damage occurs at the R2 layer before RLS is invoked
- Why it matters: R2 storage is not free; unlimited writes to a target VPORT's storage namespace constitutes a denial-of-wallet attack surface. The media_assets record write will fail (RLS), but R2 objects persist. The designStudio sibling controller enforces ownership before upload — this inconsistency is a regression risk.
- Recommended mitigation: Add `await requireOwnerActorAccess(vportId)` at line 8 of `uploadFlyerImageCtrl`, before the `uploadMediaController` call, matching the pattern used in `ctrlUploadDesignAsset` in the same subsystem.
- Rationale: Ownership must be verified before any I/O (storage, DB, external service) is initiated. The fix is a single line matching the established pattern already used in the adjacent controller.
- Follow-up command: ELEKTRA (patch advisor), SPIDER-MAN (regression test)
- Provenance: SOURCE_VERIFIED — apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js:8-31 read; designStudio.assetsExports.controller.js lines 24-37 confirm the correct pattern
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-MEDIA-004
- Location: apps/VCSM/src/features/wanders/core/controllers/cards.controller.js:225-228
- Application Scope: VCSM
- Platform Surface: PWA (wanders card upload path)
- Trust Boundary: Authenticated wanders sender
- Boundary Violated: userId passed as ownerActorId to uploadMediaController — identity field mismatch
- Contract Violated: VCSM identity contract — ownerActorId must always be an actorId (vc.actors.id), never a userId (auth.users.id)
- Current behavior: At line 225-228, `uploadMediaController` is called with `ownerActorId: user.id`. `user.id` is an `auth.users` UUID, not a `vc.actors` UUID. These are different identity namespaces. The upload engine uses `ownerActorId` to construct the R2 storage key path. The subsequent `createMediaAssetController` call at line 277 correctly uses `senderActorId` (from `resolveUserActorId(user.id)`) — so the media_assets DB record gets the correct actorId. But the R2 storage key path is built using `user.id`, while the media_assets record references `senderActorId`. This creates a permanent mismatch between where the file lives in R2 and which actor "owns" it in the DB.
- Risk: Storage key path includes `user.id` but DB record references `senderActorId`. If these values ever need to be correlated (e.g., for cleanup, re-keying, access audit, or forensics), the mismatch makes it impossible to definitively link a storage object to an actor. The storage path namespace is also inconsistent with every other upload path in the platform which correctly uses actorId.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions: None required — this is a bug in the upload call, not an exploitable vulnerability in isolation. Impact is data integrity and observability.
- Blast Radius: All wanders card uploads. The storage namespace for wanders_card scope uses user.id-based paths instead of actorId-based paths, diverging from the platform standard.
- Identity Leak Type: Identity namespace confusion (userId vs actorId)
- Cache Trust Type: None
- RLS Dependency: NONE (R2 upload is pre-auth; DB insert uses correct actorId)
- Why it matters: The VCSM platform identity contract is explicit — ownerActorId must always be an actorId. Mixing user.id into storage paths breaks the actor-centric ownership model, complicates any future storage audit or per-actor cleanup, and could expose the auth.users UUID in storage key paths (which are CDN-public).
- Recommended mitigation: Replace `ownerActorId: user.id` at line 228 with `ownerActorId: senderActorId || user.id` — `senderActorId` is already resolved at line 168. Guard with a null-check: if `senderActorId` is null, throw rather than falling back to `user.id`.
- Rationale: The actorId is already available at this point in the function (line 168). The fix is trivial. Using user.id as ownerActorId is an identity namespace violation per the VCSM contract.
- Follow-up command: SPIDER-MAN (regression test for wanders card upload path), DEADPOOL (root cause — was this always wrong or a regression?)
- Provenance: SOURCE_VERIFIED — apps/VCSM/src/features/wanders/core/controllers/cards.controller.js:168, 228, 277 read
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-MEDIA-005
- Location: ZZnotforproduction/APPS/VCSM/features/media/BEHAVIOR.md (doc root)
- Application Scope: VCSM
- Platform Surface: Governance / Contract
- Trust Boundary: N/A
- Boundary Violated: Missing behavior contract for a platform-critical infrastructure feature
- Contract Violated: VCSM governance contract — all features must have an authored BEHAVIOR.md; placeholder stubs are not acceptable for infrastructure features
- Current behavior: BEHAVIOR.md contains only 9 lines of placeholder text with no security rules, no invariants, no §5 Security Rules section, and no §9 Must Never Happen section. The media feature is called by 10+ features across the platform but has zero formal behavioral guarantees documented.
- Risk: Without a contract, callers cannot know what guarantees the media feature makes. Security rules (e.g., "never accept upload without authenticated session", "ownerActorId must always be a vc.actors UUID", "mime_type must never be SVG", "status must always be 'uploaded' on insert") are implied by source but not contractually binding. Any future change to the controllers could silently violate these implied guarantees with no contract to catch the regression.
- Severity: HIGH
- Exploitability: LOW
- Attack Preconditions: N/A — this is a governance/documentation finding, not an exploitable vulnerability
- Blast Radius: All 10+ consuming features have no authoritative contract to test against. SPIDER-MAN tests cannot be written without a behavior contract. THOR eligibility is not determinable without §5 security rules being verified.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The media feature is infrastructure — every upload in the entire platform routes through it. The absence of a formal contract means security invariants are undocumented, unchecked, and untestable. This is a prerequisite for meaningful test coverage (SPIDER-MAN) and governs whether the feature is THOR-eligible.
- Recommended mitigation: Author BEHAVIOR.md with full contract including: §5 Security Rules covering authentication requirement, actorId namespace enforcement, mime type restrictions, scope validation, status immutability on insert, and owner_source correctness. Add §9 Must Never Happen invariants for SVG acceptance, unauthenticated inserts, userId-as-actorId, and foreign actorId inserts.
- Rationale: VCSM governance rules require authored contracts for all features. The media feature's criticality makes this P1.
- Follow-up command: Logan (author BEHAVIOR.md)
- Provenance: SOURCE_VERIFIED — ZZnotforproduction/APPS/VCSM/features/media/BEHAVIOR.md read
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Software Development Security
```

---

## 8. Source Verification Summary

| File | Read | Finding | Status |
|---|---|---|---|
| apps/VCSM/src/features/media/dal/mediaAssets.softDelete.dal.js | YES | VEN-MEDIA-001 (vc_owner_update policy documented) | SOURCE_VERIFIED |
| apps/VCSM/src/features/media/dal/mediaAssets.write.dal.js | YES | VEN-MEDIA-002 (no app-layer actorId session check) | SOURCE_VERIFIED |
| apps/VCSM/src/features/media/dal/resolveAppId.read.dal.js | YES | No finding — module-cached read-only query, low risk | VERIFIED_SAFE |
| apps/VCSM/src/features/media/controller/createMediaAsset.controller.js | YES | VEN-MEDIA-002 (parameter trust chain) | SOURCE_VERIFIED |
| apps/VCSM/src/features/media/controller/softDeleteMediaAsset.controller.js | YES | Delegates to DAL; params validated for presence | VERIFIED_SAFE (conditional on DB RLS) |
| apps/VCSM/src/features/media/model/mediaAsset.model.js | YES | status hardcoded 'uploaded', bucket hardcoded, SCOPE_MAP validated | VERIFIED_SAFE |
| apps/VCSM/src/features/media/adapters/media.adapter.js | YES | Clean export boundary — no logic | VERIFIED_SAFE |
| apps/VCSM/src/features/media/adapters/mediaAppId.adapter.js | YES | Pass-through only | VERIFIED_SAFE |
| apps/VCSM/src/features/media/setup.js | YES | Engine config injection — no auth surface | VERIFIED_SAFE |
| apps/VCSM/src/debuggers-stub/media/bugBunnyUploadDebugger.js | YES | Production stub — no-ops | VERIFIED_SAFE |
| apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js | YES | VEN-MEDIA-003 (missing requireOwnerActorAccess before upload) | SOURCE_VERIFIED |
| apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.shared.controller.js | YES | requireOwnerActorAccess verified pattern — DB + actor_owners join | VERIFIED_SAFE |
| apps/VCSM/src/features/wanders/core/controllers/cards.controller.js | YES | VEN-MEDIA-004 (user.id as ownerActorId) | SOURCE_VERIFIED |
| apps/VCSM/supabase/migrations/20260430300000_create_platform_media_assets.sql | YES | Original insert policy no owner_source restriction | VERIFIED |
| apps/VCSM/supabase/migrations/20260519200000_media_assets_soft_delete_policy.sql | YES | Column-restricted UPDATE grant + RLS WITH CHECK enforced | VERIFIED_SAFE |
| apps/VCSM/supabase/migrations/20260527130000_platform_media_assets_rls_role_hardening.sql | YES | vc_owner_update NOT addressed; vc_owner_insert added | VERIFIED |
| apps/VCSM/supabase/migrations/20260523190000_portfolio_card_p0_security.sql | YES | media_assets_deny_all renamed to base_permissive_noop | VERIFIED |
| engines/media/src/controller/uploadMedia.controller.js | YES | ownerActorId used for storage key only — no session check | VERIFIED |
| engines/media/src/config/uploadLimits.js | YES | SVG + script MIME types blocked | VERIFIED_SAFE |
| ZZnotforproduction/APPS/VCSM/features/media/BEHAVIOR.md | YES | VEN-MEDIA-005 (PLACEHOLDER — no contract) | SOURCE_VERIFIED |

**Verified safe surfaces:**
- `resolveAppId.read.dal.js` — module-cached SELECT on platform.apps, read-only, no write surface
- `softDeleteMediaAsset.controller.js` — presence validation + RLS-enforced DB update
- `mediaAsset.model.js` — pure mapping with hardcoded safe defaults (status='uploaded', bucket='post-media', SCOPE_MAP validation)
- Debugger stub — production no-op
- Upload engine MIME validation — SVG and script types blocked before storage write

---

## 9. Confidence Summary

| Finding | Confidence | Evidence Type |
|---|---|---|
| VEN-MEDIA-001 | HIGH | Migration files + DAL source comment + ARCHITECTURE.md |
| VEN-MEDIA-002 | HIGH | Migration policy text + controller/DAL source read |
| VEN-MEDIA-003 | HIGH | Two controller files read; inconsistency directly confirmed |
| VEN-MEDIA-004 | HIGH | Controller source line 228 read directly |
| VEN-MEDIA-005 | HIGH | BEHAVIOR.md read directly — placeholder confirmed |

All findings are SOURCE_VERIFIED. No findings based on scanner signal alone.

---

## 10. THOR Impact

| Finding | THOR Block | Reason |
|---|---|---|
| VEN-MEDIA-001 (MEDIUM) | NO (advisory) | Known open ticket TICKET-PLATFORM-RLS-001; MEDIUM severity with low exploitability; deferred by design |
| VEN-MEDIA-002 (MEDIUM) | NO (advisory) | DB RLS provides backstop; exploitability is LOW; owner_source mismatch is a data integrity issue not a privilege escalation |
| VEN-MEDIA-003 (HIGH) | YES | Storage upload without ownership check — any authenticated user can write to any VPORT's R2 namespace. R2 write happens before RLS; cannot be blocked by DB-layer policies alone. |
| VEN-MEDIA-004 (MEDIUM) | NO (advisory) | Data integrity issue; identity namespace confusion; no privilege escalation; actorId still used for DB record |
| VEN-MEDIA-005 (HIGH) | ADVISORY | Missing contract blocks SPIDER-MAN coverage and makes THOR eligibility indeterminate; advisory block pending BEHAVIOR.md authoring |

**THOR Release Blocker: YES — VEN-MEDIA-003**

VEN-MEDIA-003 must be resolved before any release including the flyerBuilder feature. The fix is one line of code.

---

## 11. Required Follow-Up Commands

| Command | Finding(s) | Action |
|---|---|---|
| Carnage | VEN-MEDIA-001, VEN-MEDIA-002 | Write Phase 6 migration: DROP `media_assets_vc_owner_update`; add vport/chat owner_source-scoped INSERT policies |
| DB | VEN-MEDIA-001 | Inspect live DB to confirm `media_assets_vc_owner_update` policy USING/WITH CHECK predicates |
| ELEKTRA | VEN-MEDIA-003 | Propose patch for `uploadFlyerImageCtrl` — add `requireOwnerActorAccess` guard |
| SPIDER-MAN | VEN-MEDIA-003, VEN-MEDIA-004, VEN-MEDIA-005 | Write controller tests covering ownership enforcement + wanders actorId path + contract invariants |
| Logan | VEN-MEDIA-005 | Author full BEHAVIOR.md with §5 Security Rules and §9 Must Never Happen |
| DEADPOOL | VEN-MEDIA-004 | Root cause analysis — was user.id passed intentionally or is this a regression? |

---

## 12. Mitigation Plan

| Finding ID | Severity | Surface | Effort | Priority | Owner |
|---|---|---|---|---|---|
| VEN-MEDIA-003 | HIGH | flyerEditor.controller.js:uploadFlyerImageCtrl | TRIVIAL (1 line) | P0 — THOR BLOCKER | ELEKTRA |
| VEN-MEDIA-005 | HIGH | BEHAVIOR.md | MEDIUM (authoring) | P1 | Logan |
| VEN-MEDIA-001 | MEDIUM | platform.media_assets RLS (live DB) | MEDIUM (migration) | P2 | Carnage |
| VEN-MEDIA-002 | MEDIUM | createMediaAssetController + DB RLS | MEDIUM (app + migration) | P2 | ELEKTRA + Carnage |
| VEN-MEDIA-004 | MEDIUM | wanders/core/controllers/cards.controller.js:228 | LOW (1 line) | P2 | ELEKTRA |

---

## 13. CISSP Domain Coverage Summary

| CISSP Domain | Findings Covered |
|---|---|
| Access Control | VEN-MEDIA-001 (RLS over-grant), VEN-MEDIA-002 (missing ownership enforcement), VEN-MEDIA-003 (upload without auth gate) |
| Identity and Access Management | VEN-MEDIA-002 (caller identity trust), VEN-MEDIA-004 (userId vs actorId confusion) |
| Software Development Security | VEN-MEDIA-002, VEN-MEDIA-003, VEN-MEDIA-004 (defense-in-depth violations) |
| Security and Risk Management | VEN-MEDIA-005 (missing behavior contract, governance gap) |
| Security Architecture and Engineering | VEN-MEDIA-001 (policy hygiene), VEN-MEDIA-002 (layered enforcement gap) |

---

*VENOM V2 Report Complete — media — 2026-06-04*
