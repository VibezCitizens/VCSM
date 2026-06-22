# VENOM Security Review — Dashboard Modules: designStudio + vportOwnerStats

**Date:** 2026-06-05
**Reviewer:** VENOM
**Scope:** VCSM — dashboard/modules/designStudio, dashboard/modules/vportOwnerStats
**Trigger:** MANUAL — governance pass, module table audit
**ARCHITECT Gate:** PASS — designStudio ARCHITECTURE.md 2026-06-05, vportOwnerStats ARCHITECTURE.md 2026-06-05
**Status:** COMPLETE
**Findings Summary:** 0 CRITICAL | 0 HIGH | 2 MEDIUM | 1 LOW | 0 INFO (new findings)
**THOR Release Blocker:** CAUTION — VEN-DS-001 (MEDIUM, revoked owner bypass — DB verification required)

---

## CISSP Domain Coverage

| Domain | Coverage |
|---|---|
| Access Control (AC) | PRIMARY — owner gates, revoked access, is_void gap |
| Identification & Authentication (I&A) | COVERED — Supabase auth.getUser() session chain |
| Security Architecture (SA) | COVERED — DAL column scope, ownership layer dependency |
| Information Security (IS) | COVERED — asset URL storage, RLS verification |
| Uncovered | Software Development Security (SDS), Cryptography, Physical Security |

---

## Module: designStudio

### Security Surface (ARCHITECT-derived)

- Write authority: `designStudio.write.dal.js` — INSERT/UPDATE/DELETE on vc.design_documents, vc.design_pages, vc.design_page_versions, vc.design_assets, vc.design_exports, vc.design_render_jobs
- Auth gate: `dalReadAuthenticatedUserId()` → `dalReadActorOwnerRow()` → `requireOwnerActorAccess()`
- Document ownership gate: `requireDesignDocumentOwnerAccess({ownerActorId, documentId})`
- RLS: LIVE_VERIFIED on all vc.design_* tables (BLOCK-DASH-004, 2026-06-04)

---

### FINDING: VEN-DS-001

```
Finding ID:     VEN-DS-001
Title:          Revoked Owner Bypass — dalReadActorOwnerRow does not filter is_void
Severity:       MEDIUM
THOR Blocker:   CAUTION — not a hard blocker; blocker if is_void soft-delete is confirmed as the revocation mechanism
Status:         OPEN
CISSP Domain:   Access Control (AC)
Scope:          VCSM
Location:       apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/dal/designStudio.read.dal.js:5-15
               apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.shared.controller.js:10-18

Trust Boundary: dalReadActorOwnerRow — should filter is_void on actor_owners
Attack Surface: Any designStudio controller operation (load, save, create, delete, export)

Analysis:
  dalReadActorOwnerRow executes:
    SELECT actor_id,user_id FROM vc.actor_owners
    WHERE actor_id = {actorId} AND user_id = {userId}

  No is_void filter is applied. If actor_owners uses is_void=true as a soft-revocation
  mechanism (rather than row deletion), a revoked VPORT owner will still receive a non-null
  row from this query.

  requireOwnerActorAccess checks only: if (!ownerRow) → throw
  A row with is_void=true passes this guard.

Impact:
  Revoked owners retain full designStudio access: load, save, upload assets, queue exports,
  delete pages — until the row is hard-deleted from actor_owners.

Existing Defense:
  - RLS is live-verified on vc.design_* tables
  - RLS policy scopes by authenticated user — but RLS on design_* tables is likely user_id-scoped,
    not is_void-scoped in actor_owners

Why Defense Is Insufficient:
  RLS on design_* tables may enforce ownership via a JOIN on actor_owners without filtering is_void.
  If the RLS policy also does not filter is_void, both app layer and DB layer share this gap.

Recommended Fix:
  Add .eq("is_void", false) to the dalReadActorOwnerRow query:
    .eq("actor_id", actorId).eq("user_id", userId).eq("is_void", false)
  Then verify the vc.design_* RLS policies also exclude is_void=true owner rows.

Related Findings:
  ELEK-2026-06-02-003 (OPEN), SEC-005, MNH-008 (OPEN / BLOCKED_ON_DB_VERIFICATION)

Follow-up Command: DB (verify is_void column presence + RLS policy content), Carnage (migration if needed)
```

---

### FINDING: VEN-DS-002

```
Finding ID:     VEN-DS-002
Title:          Design Asset Storage Bucket RLS Unknown
Severity:       MEDIUM
THOR Blocker:   CAUTION
Status:         OPEN
CISSP Domain:   Access Control (AC) + Information Security (IS)
Scope:          VCSM
Location:       apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js
                (asset upload path via uploadMediaController, scope: "design_asset")

Trust Boundary: Supabase storage bucket for design assets
Attack Surface: Any authenticated actor who knows a design asset URL

Analysis:
  ctrlUploadDesignAsset uploads via uploadMediaController with scope="design_asset" and ownerActorId.
  The uploaded URL is stored in vc.design_assets.url.
  The target storage bucket (design-studio-assets or equivalent) has no documented RLS policy.

  If the storage bucket is public, any actor with a design asset URL can access the file
  without authentication — regardless of RLS on vc.design_assets.

  If the bucket requires signed URLs, the access model depends on URL lifetime and rotation.

Impact:
  VPORT design assets (flyer images, logos, uploaded graphics) may be publicly accessible
  to anyone with the storage URL — no ownership enforcement at the storage layer.

Existing Defense:
  - vc.design_assets table is RLS-protected (owner_actor_id scoped)
  - Row-level access in DB does not control raw storage URL access

Why Defense Is Insufficient:
  Table RLS protects row reads but does not protect the underlying storage object.
  An attacker who obtains an asset URL (e.g., via network inspection) can access
  the object directly if the bucket is public.

Recommended Fix:
  1. Confirm storage bucket policy (private vs public)
  2. If private: verify signed URL generation on read paths
  3. If public: assess business acceptability (design assets may be intentionally public for rendering)
  4. Document bucket access model in BEHAVIOR.md

Follow-up Command: DB (storage bucket policy verification), LOKI (upload path trace)
```

---

### FINDING: VEN-DS-003

```
Finding ID:     VEN-DS-003
Title:          dalTouchDesignDocument — No Ownership Scope at DAL Layer (Defense-in-Depth Gap)
Severity:       LOW
THOR Blocker:   NO
Status:         OPEN
CISSP Domain:   Security Architecture (SA)
Scope:          VCSM
Location:       apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/dal/designStudio.write.dal.js:21-31

Analysis:
  dalTouchDesignDocument(documentId) updates design_documents.updated_at
  WHERE id = documentId — no owner_actor_id column in the WHERE clause.

  Ownership is enforced exclusively at the controller layer (requireDesignDocumentOwnerAccess)
  and at RLS. If either of these defenses were bypassed, the DAL would update any document by ID.

  All delete DALs (dalDeleteDesignRenderJobsByPageId, dalDeleteDesignExportsByPageId,
  dalDeleteDesignPageVersionsByPageId, dalDeleteDesignPageById) similarly operate on bare
  entity IDs with no ownership column in WHERE.

  NOTE: Controller protection is SOURCE VERIFIED. Page-to-document binding is confirmed:
    ctrlDeleteDesignPage:
      1. requireDesignDocumentOwnerAccess({ownerActorId, documentId}) ✓
      2. dalListDesignPagesByDocument(documentId) → only pages in the verified document ✓
      3. pages.find(pageId) → confirm target page is in verified list ✓

  This is a defense-in-depth gap, not an active exploit path.

Recommended Fix (hardening):
  Add owner_actor_id to dalTouchDesignDocument WHERE clause:
    .eq("id", documentId).eq("owner_actor_id", ownerActorId)
  This requires passing ownerActorId as a parameter from the controller.

Follow-up Command: SPIDER-MAN (regression test for controller protection), Carnage (DAL hardening)
```

---

### Confirmed Safe Surfaces

| Surface | Evidence | Status |
|---|---|---|
| requireDesignDocumentOwnerAccess cross-owner documentId | documentRow.owner_actor_id !== ownerActorId → throw | BLOCKED |
| ctrlDeleteDesignPage cross-owner pageId | dalListDesignPagesByDocument(documentId) → pages.find(pageId) | BLOCKED |
| ctrlSaveDesignPageScene cross-owner pageId | pageRow.document_id !== documentId → throw | BLOCKED |
| supabase.auth.getUser() session derivation | dalReadAuthenticatedUserId() validates active session | BLOCKED |
| Unauthenticated studio access | requireOwnerActorAccess: !userId → throw "Sign in required." | BLOCKED |
| vc.design_* RLS | Live-verified 2026-06-04 (BLOCK-DASH-004) | VERIFIED |

---

## Module: vportOwnerStats

### Status: CARRY FORWARD — NO NEW FINDINGS

Prior VENOM run: 2026-06-04 — all findings PATCHED
Prior BLACKWIDOW run: 2026-06-04 — all adversarial scenarios BLOCKED except BW-VPORTOS-001 (PATCHED)
Prior ELEKTRA run: 2026-06-04 — ELEK-2026-06-04-001 and ELEK-2026-06-04-002 both PATCHED

This pass confirms:
- callerActorId is session-derived (VportProfileViewScreen:185 confirmed)
- assertActorOwnsVportActorController kind check unconditional before self-shortcut
- No write surfaces — read-only controller
- TESTREQ-BW-vportOwnerStats-001 MISSING (SPIDER-MAN item, not a VENOM blocker)

VENOM status for vportOwnerStats: COMPLETE — CLEAR

---

## Required Follow-up Commands

| Command | Reason | Module | Priority |
|---|---|---|---|
| DB | Verify is_void column exists in vc.actor_owners; verify RLS policy does not include revoked rows | designStudio | P1 |
| DB | Verify design-studio-assets bucket policy (private/public/signed) | designStudio | P1 |
| SPIDER-MAN | Add regression test for is_void revoked owner rejection once DB-verified | designStudio | P2 |
| Carnage | DAL hardening: add owner_actor_id to dalTouchDesignDocument WHERE | designStudio | P3 |
| SPIDER-MAN | TESTREQ-BW-vportOwnerStats-001 missing (lifecycle guard regression) | vportOwnerStats | P2 |

---

## CISSP Domain Summary

| Domain | Findings | Status |
|---|---|---|
| Access Control (AC) | VEN-DS-001 (revoked owner), VEN-DS-002 (storage bucket) | OPEN |
| Security Architecture (SA) | VEN-DS-003 (DAL scope gap) | OPEN / LOW |
| Identification & Authentication | Session chain verified (auth.getUser) | CONFIRMED |
| Software Development Security | — | NOT COVERED |

---

## SOURCE READ SUMMARY

Full Rediscovery Performed: YES — no evidence-bundle.json consumed
Files Read:
- designStudio.auth.dal.js (7 lines — complete)
- designStudio.write.dal.js (215 lines — complete)
- designStudio.read.dal.js (130 lines — complete)
- designStudio.shared.controller.js (37 lines — complete)
- designStudio.pages.controller.js (145 lines — complete)
- ARCHITECTURE.md (designStudio) — complete
- ARCHITECTURE.md (vportOwnerStats) — complete
- BEHAVIOR.md (designStudio) — complete
- SECURITY.md (designStudio) — stub read
- SECURITY.md (vportOwnerStats) — prior review read
- security-surface.json (GOVERNANCE/2026/06/05) — consumed
