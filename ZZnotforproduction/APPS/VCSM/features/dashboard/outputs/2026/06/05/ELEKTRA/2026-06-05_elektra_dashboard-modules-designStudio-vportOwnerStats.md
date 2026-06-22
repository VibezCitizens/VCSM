# ELEKTRA Security Report — Dashboard Modules: designStudio + vportOwnerStats

**Date:** 2026-06-05
**Scope:** VCSM — dashboard/modules/designStudio, dashboard/modules/vportOwnerStats
**Reviewer:** ELEKTRA
**Scan Trigger:** MANUAL — governance pass, module table audit
**Findings Summary:** 0 CRITICAL | 0 HIGH | 1 MEDIUM | 1 LOW | 0 INFO
**False Positives Rejected:** 3
**Suggested Patches:** 2

Upstream Reports:
- VENOM: ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/Venom/2026-06-05_venom_dashboard-modules-designStudio-vportOwnerStats.md (this session)
- BLACKWIDOW: ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/BlackWidow/2026-06-05_blackwidow_dashboard-modules-designStudio-vportOwnerStats.md (this session)

**ELEKTRA PREFLIGHT PASS**

---

## ELEKTRA SCAN TARGET

```
Feature / Route / Engine: dashboard/modules/designStudio + vportOwnerStats
Application Scope: VCSM
Reason for scan: First-time module-scoped ELEKTRA scan (STUB → ACTIVE)
Scan trigger: MANUAL
Upstream VENOM report: this session
Upstream BLACKWIDOW report: this session
```

---

## ENTRY POINT MAP

```
ENTRY POINT MAP — designStudio
Route / API / Controller: /actor/:actorId/menu/flyer/edit → VportActorMenuFlyerEditorScreen → VportDesignStudioViewScreen
Input sources (user-controlled):
  - actorId (route param)
  - ownerActorId (derived from viewerActorId from identity hook — SESSION DERIVED)
  - documentId (from DB load — server-derived after owner gate)
  - pageId (from DB load — server-derived after document binding)
  - scene (canvas state — client-provided, normalized by ensureSceneContent)
  - file (asset upload — client-provided)
  - format (export format: "png" | "pdf" — client-provided)
Trusted input boundary: requireOwnerActorAccess (controller layer) + requireDesignDocumentOwnerAccess
Validation present at boundary: YES for ownership + document binding; PARTIAL for is_void
```

---

## HIGH FINDINGS

None.

---

## MEDIUM FINDINGS

### ELEK-2026-06-05-001

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-001
- Title:              Revoked Owner Bypass — dalReadActorOwnerRow Missing is_void Filter
- Category:           IDOR/BOLA
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/dal/designStudio.read.dal.js:5-15
- Source:             ownerActorId (caller-supplied — validated by session at userId layer but not at is_void layer)
- Sink:               designStudio.write.dal.js — INSERT/UPDATE/DELETE on vc.design_* tables
- Trust Boundary:     dalReadActorOwnerRow — should filter is_void on actor_owners JOIN
- Impact:             Revoked VPORT owner retains full design studio write access
- Evidence:
    SELECT actor_id,user_id FROM vc.actor_owners
    WHERE actor_id = {actorId} AND user_id = {userId}
    -- Missing: AND is_void = false

- Reproduction Steps:
    1. Own VPORT actor P (actor_owners row: actor_id=P, user_id=A_uid, is_void=false)
    2. Trigger ownership revocation (is_void set to true on the row)
    3. Call any designStudio controller endpoint with ownerActorId=P
    4. dalReadActorOwnerRow returns the is_void=true row (non-null)
    5. requireOwnerActorAccess: !ownerRow → false → gate PASSES
    6. Write access to design tables granted

- Existing Defense:   Controller null-check on ownerRow (insufficient — doesn't check is_void)
- Why Defense Is Insufficient: is_void=true rows are not filtered at DAL or controller layer
- Recommended Fix:    Add .eq("is_void", false) to dalReadActorOwnerRow query
- Suggested Patch:
    // designStudio.read.dal.js:5-15
    export async function dalReadActorOwnerRow({ actorId, userId }) {
      const { data, error } = await VC()
        .from("actor_owners")
        .select("actor_id,user_id,is_void")
        .eq("actor_id", actorId)
        .eq("user_id", userId)
        .eq("is_void", false)   // ← add this
        .maybeSingle();

      if (error) throw error;
      return data;
    }
    NOTE: Verify DB to confirm is_void column exists on vc.actor_owners before applying.

- Follow-up Command:  DB (confirm is_void column + RLS policy content)

BLACKWIDOW Cross-Reference: BW-DS-001 — PARTIAL (code confirmed, DB state unverified)
VENOM Cross-Reference: VEN-DS-001 — MEDIUM
Prior Finding: ELEK-2026-06-02-003 (OPEN) — this finding CONFIRMS it from source chain
```

---

## LOW FINDINGS

### ELEK-2026-06-05-002

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-002
- Title:              Asset Storage Bucket RLS Unknown — Design Asset URL Access Unverified
- Category:           Supabase RLS (storage policy gap)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js
                      (ctrlUploadDesignAsset)
- Source:             Asset file (user-uploaded)
- Sink:               Supabase storage bucket (design-studio-assets or equivalent)
- Trust Boundary:     Storage bucket access policy
- Impact:             IF bucket is public: any actor with an asset URL can access design assets
                      without authentication. VPORT design assets (logos, brand images) exposed.
- Evidence:
    ctrlUploadDesignAsset uploads via uploadMediaController with scope: "design_asset".
    Result URL stored in vc.design_assets.url.
    Bucket access policy: NOT DOCUMENTED. Not verifiable from app-layer source alone.

- Existing Defense:   vc.design_assets table RLS (owner-scoped at row level)
- Why Defense Is Insufficient: Table RLS protects DB row reads; storage bucket policy
  controls raw object URL access — independent access control layer
- Recommended Fix:    1. Confirm storage bucket policy (private/signed vs public)
                       2. If private: ensure all asset URL reads go through signed URL generation
                       3. Document bucket access policy in BEHAVIOR.md §3 storage section
- Suggested Patch:    N/A — storage configuration, not app-layer code
- Follow-up Command:  DB (storage bucket policy audit), BEHAVIOR.md update

VENOM Cross-Reference: VEN-DS-002 — MEDIUM (downgraded to LOW here — asset URLs may be
  intentionally accessible if design is for public flyer distribution)
```

---

## False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate:       dalTouchDesignDocument — no owner_actor_id in WHERE (VEN-DS-003)
- Location:        designStudio.write.dal.js:21-31
- Rejection reason: Trust boundary (controller) is SOURCE VERIFIED at every call site.
    ctrlSaveDesignPageScene:33 requireDesignDocumentOwnerAccess called first.
    ctrlDeleteDesignPage:123 requireDesignDocumentOwnerAccess called first.
    ctrlCreateDesignPage:74 requireDesignDocumentOwnerAccess called first.
    RLS is LIVE_VERIFIED (BLOCK-DASH-004). Defense-in-depth gap, not exploit path.
- Chain gap:       Impact — no impact path exists with current controller protection
- Notes:           Hardening patch recommended but not a security finding.
```

```
FALSE POSITIVE REJECTED

- Candidate:       dalDeleteDesignPageById / sibling delete DALs — no owner scope in WHERE
- Location:        designStudio.write.dal.js
- Rejection reason: page-to-document binding confirmed in ctrlDeleteDesignPage:
    dalListDesignPagesByDocument(documentId) → pages.find(pageId) → not found → throw
    Cross-owner pageId cannot reach delete DAL without first matching the verified document list.
- Chain gap:       Trust boundary confirmed at controller layer — no gap in exploit chain.
```

```
FALSE POSITIVE REJECTED

- Candidate:       IDOR via ownerActorId route param (UI injects attacker-controlled actorId)
- Location:        VportActorMenuFlyerEditorScreen.jsx (route: /actor/:actorId/menu/flyer/edit)
- Rejection reason: ownerActorId passed to controllers is viewerActorId from identity hook
    (session-derived), not the :actorId route param. Route param selects WHICH vport to open
    but the ownership check uses the authenticated session's actor.
    useVportOwnership(viewerActorId, actorId) — checks if viewer (session) owns the target (route).
- Chain gap:       Source — route param is target, not actor performing the operation.
```

---

## Confirmed Patched Findings — vportOwnerStats

```
ELEK-2026-06-04-001 (LOW) — PATCHED: Lifecycle guard added in controller.
ELEK-2026-06-04-002 (INFO) — PATCHED: SELECT_COLS reduced to "id" in listVportBookingsForProfileDayDAL.
ELEK-003 (HIGH) — PATCHED: callerActorId bound to session; assertActorOwnsVportActorController fires before reads.
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-05-001 | Revoked owner bypass — is_void filter | MEDIUM | DAL | SIMPLE | NO (code change) / YES (verify column) |
| 2 | ELEK-2026-06-05-002 | Asset storage bucket policy | LOW | Config | N/A (infra) | NO |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| DB | Confirm is_void on vc.actor_owners + verify RLS policies | PENDING |
| DB | Storage bucket policy audit (design-studio-assets) | PENDING |
| Wolverine | Apply suggested patch for ELEK-2026-06-05-001 | PENDING |
| SPIDER-MAN | Add regression: revoked is_void=true owner rejected | PENDING — blocked on DB |
| Thor | Release gate — CAUTION from ELEK-2026-06-05-001 (MEDIUM) | PENDING |
