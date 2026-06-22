---
title: Assets Module — Security
status: STUB
feature: media
module: assets
source: venom+bw-derived
created: 2026-06-05
---

# media / modules / assets — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — ASSETS-SEC-001, ASSETS-SEC-002**

Note: Both THOR blockers originate in cross-feature callers (dashboard, wanders), not in the media feature itself. The media feature's own write paths are medium-severity.

## Findings

### ASSETS-SEC-001 — R2 Upload Without Ownership Check (Cross-Feature) [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | ASSETS-SEC-001 |
| Source Findings | VEN-MEDIA-003, BW-MEDIA-001 |
| Severity | HIGH — THOR BLOCKER |
| Surface | dashboard/flyerBuilder/controller/flyerEditor.controller.js → uploadFlyerImageCtrl |
| Description | uploadFlyerImageCtrl uploads to Cloudflare R2 without calling requireOwnerActorAccess. Any authenticated user can write media to any VPORT's R2 storage namespace by supplying a foreign actorId. Adversarially confirmed BYPASSED. Fix: add requireOwnerActorAccess call before R2 upload in flyerEditor.controller.js. |
| Owning Feature | dashboard/flyerBuilder |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### ASSETS-SEC-002 — userId Passed as actorId in R2 Storage Key (Cross-Feature) [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | ASSETS-SEC-002 |
| Source Findings | VEN-MEDIA-004, BW-MEDIA-002 |
| Severity | HIGH — THOR BLOCKER |
| Surface | wanders/core/controllers/cards.controller.js:228 → uploadMediaController |
| Description | Wanders publishWandersFromBuilder and cards.controller pass auth.users.id (UUID from auth.users table) as ownerActorId. The correct value is vc.actors.id. Consequence: R2 storage keys are namespaced under the wrong identity type; media_assets records reference an invalid ownerActorId; query joins on actor data silently return no results. Adversarially confirmed BYPASSED. |
| Owning Feature | wanders (FROZEN) |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### ASSETS-SEC-003 — {public} UPDATE Policy on media_assets (Open Ticket)
| Field | Value |
|---|---|
| ID | ASSETS-SEC-003 |
| Source Findings | VEN-MEDIA-001 |
| Severity | MEDIUM |
| Surface | platform.media_assets — media_assets_vc_owner_update policy |
| Description | A {public} role policy grants unrestricted column UPDATE to the public role on platform.media_assets. Coexists with the correctly-scoped RLS policy. The public policy is the broader of the two — any authenticated user can UPDATE any media_assets row. Tracked in TICKET-PLATFORM-RLS-001; deferred to Phase 6 migration. |
| Status | OPEN — DEFERRED (TICKET-PLATFORM-RLS-001) |
| THOR | Deferred per migration plan |

### ASSETS-SEC-004 — INSERT No Session Ownership Verification
| Field | Value |
|---|---|
| ID | ASSETS-SEC-004 |
| Source Findings | VEN-MEDIA-002, BW-MEDIA-003, BW-MEDIA-004 |
| Severity | MEDIUM |
| Surface | controller/createMediaAsset.controller.js + dal/mediaAssets.write.dal.js |
| Description | createMediaAssetController validates actorId presence but does not cross-check against the authenticated session. Caller-supplied ownerActorId and createdByActorId are trusted. INSERT RLS policies are incomplete — no WITH CHECK policies exist for vport or chat owner_source values. DB RLS is the sole ownership guard for the sources that do have policies. |
| Status | OPEN |
| THOR | Not blocked |

### ASSETS-SEC-005 — Actor UUID in Public R2 CDN URLs
| Field | Value |
|---|---|
| ID | ASSETS-SEC-005 |
| Source Findings | BW-MEDIA-005 |
| Severity | MEDIUM |
| Surface | R2 storage key format → public CDN URL |
| Description | ownerActorId (actor UUID) is embedded in the R2 storage key, which becomes the public CDN URL path. Violates platform no-raw-IDs-in-public-URLs policy. All media URLs expose the actor's UUID. |
| Status | OPEN |
| THOR | Not blocked |

### ASSETS-SEC-006 — No storage_key Uniqueness Guard
| Field | Value |
|---|---|
| ID | ASSETS-SEC-006 |
| Source Findings | BW-MEDIA-006 |
| Severity | LOW |
| Surface | dal/mediaAssets.write.dal.js → insertMediaAssetDAL |
| Description | No unique constraint or ON CONFLICT guard on storage_key. Duplicate media_assets records for the same R2 object are possible if two concurrent uploads generate the same key. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature. Run before next release.

## Remediation Priority

1. ASSETS-SEC-001: add requireOwnerActorAccess in flyerEditor.controller.js before R2 upload
2. ASSETS-SEC-002: fix wanders cards.controller.js:228 to pass actorId not userId (note: wanders FROZEN)
3. ASSETS-SEC-003: execute TICKET-PLATFORM-RLS-001 Phase 6 — drop {public} UPDATE policy
4. ASSETS-SEC-004: add session-derived ownerActorId verification in createMediaAssetController
5. ASSETS-SEC-005: refactor R2 storage key format to use slug or opaque ID instead of actor UUID
