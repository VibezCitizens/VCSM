# upload — SECURITY.md
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Status: CURRENT SOURCE OF TRUTH

Security posture for the upload feature. Based on VENOM audits dated 2026-05-10 and 2026-05-19,
ELEKTRA audit dated 2026-05-28 (portfolio, upload-adjacent), and the 2026-05-10 full security sweep.
A dedicated VENOM+ELEKTRA pass on the upload post-creation flow has NOT run. See pending section.

---

## Command Coverage

| Command | Status | Last Run | Scope |
|---|---|---|---|
| VENOM | RUN (partial) | 2026-05-19 | vport-create-avatar-upload + media-dal-trust-boundary — NOT scoped to post-creation upload flow |
| ELEKTRA | RUN (partial) | 2026-05-28 | portfolio (upload-adjacent) — NOT scoped to upload/controller(s)/ directly |
| BLACKWIDOW | NOT_RUN | NEVER | — |
| SENTRY | NOT_RUN | NEVER | — |
| THOR | RUN | 2026-05-19 | media-dal-release-gate — READY |

---

## Security Posture Summary

**Overall:** PARTIAL — gated write paths partially confirmed; post-creation flow not fully audited
**Highest Open Severity:** CRITICAL (R2 worker wildcard CORS)
**THOR Blocker State:** MEDIA DAL gate CLEARED 2026-05-19; post-creation upload not separately gated
**VENOM Status:** PARTIAL — avatar/media DAL paths audited; post-creation flow NOT YET audited
**ELEKTRA Status:** PARTIAL — portfolio overlap only
**BLACKWIDOW Status:** NOT_RUN

---

## Trust Boundary Map (Upload Post-Creation Flow)

```
Client
  ↓ UploadScreenModern.jsx — GATE: session required (auth surface: OWNER)
  ↓ useUploadSubmit (submission orchestration)
  ↓
  ┌──────────────────────────────────────────────────────┐
  │  BOUNDARY 0 — Cloudflare R2 Upload                   │
  │  uploadToCloudflare.js (app-specific, not shared)    │
  │  Worker: apps/WT/cloudflare-worker-upload/worker.js  │
  │  ⚠️ CRITICAL: Access-Control-Allow-Origin: *         │
  │  No Supabase JWT verification; no origin allowlist   │
  └──────────────────────────────────────────────────────┘
  ↓
  ┌──────────────────────────────────────────────────────┐
  │  BOUNDARY 1 — Post Creation Controller               │
  │  upload/controllers/createPost.controller.js         │
  │  → insertPost.dal.js → vc.posts                      │
  │  Gate status: PARTIAL — not verified by VENOM        │
  └──────────────────────────────────────────────────────┘
  ↓
  ┌──────────────────────────────────────────────────────┐
  │  BOUNDARY 2 — Media Asset Record Controller          │
  │  upload/controller/recordPostMedia.controller.js     │
  │  → createMediaAssetController → platform.media_assets│
  │  Gate: DB RLS (vc.actor_owners JOIN) — CONFIRMED     │
  │  App layer: owner_actor_id caller-supplied (gap)     │
  └──────────────────────────────────────────────────────┘
  ↓
  ┌──────────────────────────────────────────────────────┐
  │  BOUNDARY 3 — Database RLS Gate (canonical)          │
  │  platform.media_assets                               │
  │  INSERT WITH CHECK: vc.actor_owners join             │
  │  SELECT: owner-scoped policies active                │
  └──────────────────────────────────────────────────────┘
```

---

## Findings

### RESOLVED

**V-01 | PASS | actorId ownership correct**
- Severity: PASS
- Status: RESOLVED
- Finding: actorId used for upload ownership — correctly uses vport's own actorId (res.actorId) from DB RPC, not auth user.id
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom_vport-create-avatar-upload.md`

**V-05 | LOW | console.log DEV-guarded**
- Severity: LOW
- Status: RESOLVED
- Finding: console.log in createMediaAsset.controller.js — DEV-guarded, tree-shaken in production; insertPayload includes ownerActorId, storageKey, scopeId but never leaks to production
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom_vport-create-avatar-upload.md`

**V-06 | INFORMATIONAL | console.warn DEV-only**
- Severity: INFORMATIONAL
- Status: RESOLVED
- Finding: console.warn in submitCreateVportController — DEV-only, correctly guarded
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom_vport-create-avatar-upload.md`

**V-07 | PASS | @debuggers alias production-safe**
- Severity: PASS
- Status: RESOLVED
- Finding: @debuggers alias resolves to no-op stub in production; zNOTFORPRODUCTION never ships
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom_vport-create-avatar-upload.md`

**MEDIA-F1 | CRITICAL | RLS policy confirmed active**
- Severity: CRITICAL
- Status: RESOLVED
- Finding: RLS policy status on platform.media_assets was UNCERTAIN at time of 2026-05-19 audit; subsequently confirmed via DB audit — INSERT + SELECT owner-scoped policies active via vc.actor_owners join
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-19_venom_media-dal-trust-boundary.md`

**MEDIA-F5 | LOW | Module-level cache acceptable**
- Severity: LOW
- Status: RESOLVED
- Finding: Module-level cache risk in resolveVcsmAppIdDAL — confirmed acceptable for client-side Vite SPA (per-browser-session module scope)
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-19_venom_media-dal-trust-boundary.md`

**ELEK-2026-05-28-042 | INFO | Engine isActorOwner injection correct**
- Severity: INFO
- Status: RESOLVED
- Finding: Engine isActorOwner injection correct; no exploit path
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_portfolio.md`

---

### OPEN — CRITICAL

**FULL-SWEEP-FINDING | CRITICAL | R2 upload worker wildcard CORS**
- Severity: CRITICAL
- Status: OPEN — no remediation evidence found
- Finding: R2 upload worker at `apps/WT/cloudflare-worker-upload/worker.js` responds to all POST with `Access-Control-Allow-Origin: *`, no origin allowlist, no Supabase JWT verification; any origin can write to post-media R2 bucket
- Recommendation: Add origin allowlist (VCSM domain only) and verify Supabase JWT before accepting any upload
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_pre-push_venom_full-security-sweep.md`

---

### OPEN — MEDIUM

**V-03 | MEDIUM | Write-back DAL no returned-row verification**
- Severity: MEDIUM
- Status: OPEN (non-blocking)
- Finding: Write-back DAL has no returned-row verification — silent 0-row update if RLS blocks or session expires during fire-and-forget IIFE
- Recommendation: Add `.select()` to update call and verify returned rows count > 0
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom_vport-create-avatar-upload.md`

**V-04 | MEDIUM | updateVportAvatarMediaAssetIdDAL relies 100% on RLS**
- Severity: MEDIUM
- Status: OPEN — was BLOCKING pre-merge, now deferred hardening
- Finding: updateVportAvatarMediaAssetIdDAL relies 100% on RLS with no app-layer ownership re-check; RLS on vport.profiles UPDATE policy required verification before merge
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom_vport-create-avatar-upload.md`

**MEDIA-F2 | CRITICAL (downgraded to MEDIUM post-DB-confirmation) | Controller-layer owner_actor_id gap**
- Severity: CRITICAL at discovery; MEDIUM post-mitigation
- Status: OPEN (mitigated at DB layer)
- Finding: owner_actor_id and created_by_actor_id are caller-supplied to createMediaAssetController with no session ownership check at controller layer; DB RLS WITH CHECK enforces vc.actor_owners join, making controller gap defense-in-depth only
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-19_venom_media-dal-trust-boundary.md`

**ELEK-2026-05-28-040 | MEDIUM | ctrlSavePortfolioDetail missing ownership gate**
- Severity: MEDIUM
- Status: OPEN
- Finding: ctrlSavePortfolioDetail — actorId is caller-supplied with no session binding; ownership check uses profile_id cross-match (DB-correct) but never calls assertActorOwnsVportActorController; a user knowing another VPORT's actorId + portfolioItemId can corrupt that item's data
- Proposed patch: add `await assertActorOwnsVportActorController({ requestActorId: sessionActorId, targetActorId: actorId })` before portfolio mutation
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_portfolio.md`

**MEDIA-F3 | HIGH (downgraded to LOW after DB confirmation) | Inconsistent app-layer validation**
- Severity: HIGH at discovery; LOW post-DB-confirmation
- Status: OPEN (downgraded)
- Finding: Inconsistent app-layer validation across callers: recordChatAttachment.controller.js accepts ownerActorId as raw parameter with no validation; flyerEditor.controller.js assumes caller owns vportId
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-19_venom_media-dal-trust-boundary.md`

**MEDIA-F4 | MEDIUM | insertMediaAssetDAL has no auth check**
- Severity: MEDIUM
- Status: OPEN (acceptable — DB is authoritative gate)
- Finding: insertMediaAssetDAL has no auth check; defense-in-depth gap only
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-19_venom_media-dal-trust-boundary.md`

---

### OPEN — LOW

**V-02 | LOW | Partial write risk — avatar_url / avatar_media_asset_id split**
- Severity: LOW
- Status: OPEN (non-blocking)
- Finding: avatar_url only written when truthy; if R2 upload succeeds but URL generation fails, avatar_media_asset_id written without matching avatar_url, causing broken avatar reference
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom_vport-create-avatar-upload.md`

**V-08 | LOW | Dead appId parameter**
- Severity: LOW
- Status: OPEN (non-blocking)
- Finding: Dead appId parameter passed to createMediaAssetController — silently dropped; resolveVcsmAppIdDAL called twice (cached, safe); cleanup deferred
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom_vport-create-avatar-upload.md`

**V-09 | LOW | listMyVports uses owner_user_id**
- Severity: LOW
- Status: OPEN (non-blocking)
- Finding: listMyVports uses owner_user_id (raw auth UUID) instead of actorId — read-only, scope-safe but deviates from actor-based identity contract
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom_vport-create-avatar-upload.md`

**V-10 | LOW | createVport DAL returns alias IDs**
- Severity: LOW
- Status: OPEN (non-blocking)
- Finding: createVport DAL returns profileId/vportId aliases alongside canonical actorId — internal only, controller correctly uses actorId for upload/navigation
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom_vport-create-avatar-upload.md`

**ELEK-2026-05-28-041 | LOW | updatePortfolioMediaAssetIdDAL null callerProfileId bypass**
- Severity: LOW
- Status: OPEN
- Finding: updatePortfolioMediaAssetIdDAL — callerProfileId sourced from engine return value portfolioMedia.profileId; if null/undefined, Supabase JS drops the .eq('profile_id', callerProfileId) filter silently, allowing media_asset_id write to any portfolioMedia row
- Proposed patch: add `if (!callerProfileId) throw new Error(...)` guard at DAL entry
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_portfolio.md`

---

### OPEN — INFORMATIONAL

**ELEK-2026-05-28-043 | INFO | isActorOwner order inverted from best practice**
- Severity: INFO
- Status: OPEN (no security impact)
- Finding: updateItem/deleteItem engine — isActorOwner called after profile_id cross-check; order inverted from best practice
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_portfolio.md`

**ELEK-2026-05-28-044 | INFO | usePortfolioItemSubmit actorId from prop not session**
- Severity: INFO
- Status: OPEN (acceptable given screen-level gate)
- Finding: usePortfolioItemSubmit actorId flows from parent component prop, not re-derived from session inside hook; screen protected by useVportOwnership at screen level
- Evidence: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_portfolio.md`

---

## Write Surface Risk Assessment

| Surface | Write Type | Gate | Risk |
|---|---|---|---|
| upload/controllers/createPost.controller.js | POST INSERT to vc.posts | UNKNOWN — not VENOM-verified | HIGH |
| upload/controller/recordPostMedia.controller.js | MEDIA_UPLOAD to platform.media_assets | DB RLS confirmed; app layer PARTIAL | MEDIUM |
| insertPost.dal.js → vc.posts | WRITE | Not audited directly | NEEDS_REVIEW |
| insertPostMedia.dal.js → vc.post_media | WRITE | Not audited directly | NEEDS_REVIEW |
| insertPostMentions.dal.js → vc.post_mentions | WRITE | Not audited directly | NEEDS_REVIEW |
| updatePostMediaAssetId.write.dal.js | WRITE | Not audited directly | NEEDS_REVIEW |
| postAuthRollback.dal.js | DELETE rollback | Active usage unclear | NEEDS_REVIEW |
| R2 upload worker (apps/WT/) | BINARY UPLOAD | No JWT; wildcard CORS | CRITICAL |

**Overall auth gate status: PARTIAL — dual-controller anomaly (GAP-039) unresolved; controller-layer ownership verification incomplete on post-creation path**

---

## Pending Full Audit

VENOM and ELEKTRA have not run a complete pass on the upload post-creation flow.
All findings above are from:
- Avatar upload pipeline audit (2026-05-10)
- Media DAL trust boundary audit (2026-05-19)
- Portfolio ELEKTRA audit (2026-05-28, upload-adjacent only)
- Pre-push full security sweep (2026-05-10)

Recommended: run `/VENOM` + `/ELEKTRA` scoped to `apps/VCSM/src/features/upload/` before next release.

---

## Security History

| Date | Command | Event |
|---|---|---|
| 2026-05-10 | VENOM | vport-create-avatar-upload — 10 findings; V-01/05/06/07 RESOLVED |
| 2026-05-10 | VENOM (full sweep) | R2 worker wildcard CORS flagged as CRITICAL |
| 2026-05-19 | VENOM | media-dal-trust-boundary — 5 findings; MEDIA-F1/F5 RESOLVED |
| 2026-05-19 | THOR | media-dal-release-gate — READY |
| 2026-05-28 | ELEKTRA | portfolio (upload-adjacent) — 5 findings; ELEK-042 RESOLVED |

Evidence files:
- `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom_vport-create-avatar-upload.md`
- `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-19_venom_media-dal-trust-boundary.md`
- `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_portfolio.md`
- `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_pre-push_venom_full-security-sweep.md`
