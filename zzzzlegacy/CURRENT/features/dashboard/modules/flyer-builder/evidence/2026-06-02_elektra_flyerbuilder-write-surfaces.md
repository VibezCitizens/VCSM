# ELEKTRA Security Report

**Date:** 2026-06-02
**Scope:** VCSM
**Reviewer:** ELEKTRA
**Scan Trigger:** BLACKWIDOW referral — flyerBuilder VENOM FAIL (CRITICAL fixed), BLACKWIDOW CAUTION pass
**Findings Summary:** 0 HIGH | 2 MEDIUM | 1 LOW | 1 INFO
**False Positives Rejected:** 3
**Suggested Patches:** 4

---

## Executive Summary

ELEKTRA scanned all write surfaces inside `apps/VCSM/src/features/dashboard/flyerBuilder/` following a VENOM FAIL (VEMON-FLYER-001 CRITICAL, now fixed) and a BLACKWIDOW CAUTION pass. Two MEDIUM-severity IDOR findings are confirmed at the code level: (1) the flyer save controller accepts a caller-supplied `profileId` without binding it to the owned actor's profile — DB RLS is the only enforcement; (2) the three design studio page-write controllers accept a caller-supplied `documentId` without verifying it belongs to `ownerActorId`, creating an app-layer IDOR where a caller with knowledge of a victim's document and page UUIDs can write to or delete their design pages. Both findings are gated at DB RLS (which may or may not be active — VENOM-DESIGN-001 unresolved). One LOW finding identifies a missing `is_void` filter in the design studio's ownership gate DAL.

---

## High Findings

*None.*

---

## Medium Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-02-001
- Title:              IDOR — saveFlyerPublicDetailsCtrl accepts caller-supplied profileId without
                      binding it to ownerActorId
- Category:           IDOR/BOLA
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js:31–35
- Source:             profileId parameter — caller-supplied (from FlyerEditorPanel props → useFlyerEditor
                      → saveFlyerPublicDetailsCtrl)
- Sink:               saveFlyerPublicDetails({ profileId, patch }) in flyer.write.dal.js:26–43
                      → supabase.upsert("vport.profile_public_details") WHERE profile_id = profileId
- Trust Boundary:     saveFlyerPublicDetailsCtrl — should validate profileId belongs to ownerActorId
- Impact:             An authenticated actor who owns any VPORT (ActorA) can supply a victim VPORT's
                      profileId. The controller verifies ownership of ActorA (correct) but does not
                      verify that profileId is ActorA's profile. The upsert targets any profileId
                      supplied. DB RLS actor_can_manage_profile(profile_id) is the only enforcement.
- Evidence:
    // flyerEditor.controller.js:31–35
    export async function saveFlyerPublicDetailsCtrl({ profileId, patch, ownerActorId }) {
      await requireOwnerActorAccess(ownerActorId)  // ← verifies ActorA ownership ✓
      return saveFlyerPublicDetails({ profileId, patch })  // ← profileId not validated against ActorA
    }

    // flyer.write.dal.js:26–29
    const { data, error } = await supabase
      .schema("vport")
      .from("profile_public_details")
      .upsert({ profile_id: profileId, ...cleanPatch }, { onConflict: "profile_id" })
- Reproduction Steps:
    1. Authenticate as a user who owns VPORT ActorA (their own VPORT)
    2. Obtain the profileId of a victim VPORT (profileId is a UUID — not directly exposed in URLs
       but may be discoverable via other read surfaces)
    3. Call saveFlyerPublicDetailsCtrl({
         profileId: victimProfileId,
         patch: { flyer_headline: "MODIFIED" },
         ownerActorId: actorAId
       })
    4. requireOwnerActorAccess(actorAId) passes (caller owns ActorA)
    5. saveFlyerPublicDetails fires with victimProfileId
    6. DB RLS actor_can_manage_profile(victimProfileId) evaluates — blocks if RLS active
    7. If RLS absent or bypassed: victim's profile_public_details are overwritten
- Existing Defense:   requireOwnerActorAccess(ownerActorId) — verifies actor ownership ✓
                      DB RLS actor_can_manage_profile(profile_id) — canonical backstop
- Why Defense Is Insufficient:
    The controller gate verifies that the caller owns ownerActorId, but does not verify that
    profileId belongs to ownerActorId. These are separate checks. The DB RLS is the only
    enforcement of the profile→actor binding. Relying on DB RLS alone violates defense-in-depth;
    if RLS is misconfigured or bypassed via service role, no app-layer check catches the mismatch.
- Recommended Fix:    Eliminate profileId as an input parameter. Derive it server-side from
                      ownerActorId using the existing vportProfile read DAL. This removes the
                      IDOR surface entirely.
- Suggested Patch:

    // flyerEditor.controller.js — BEFORE (current after VENOM-FLYER-001 fix)
    import { saveFlyerPublicDetails } from '../dal/flyer.write.dal'
    import { requireOwnerActorAccess } from '...'

    export async function saveFlyerPublicDetailsCtrl({ profileId, patch, ownerActorId }) {
      await requireOwnerActorAccess(ownerActorId)
      return saveFlyerPublicDetails({ profileId, patch })
    }

    // flyerEditor.controller.js — AFTER (ELEKTRA patch)
    import { saveFlyerPublicDetails } from '../dal/flyer.write.dal'
    import { requireOwnerActorAccess } from '...'
    import { getVportProfileIdByActorDAL } from '@/features/dashboard/vport/dal/read/vportProfile.read.dal'

    export async function saveFlyerPublicDetailsCtrl({ patch, ownerActorId }) {
      await requireOwnerActorAccess(ownerActorId)
      const profileId = await getVportProfileIdByActorDAL({ actorId: ownerActorId })
      if (!profileId) throw new Error('VPORT profile not found.')
      return saveFlyerPublicDetails({ profileId, patch })
    }

    // useFlyerEditor.js — update call site (remove profileId from args)
    const res = await saveFlyerPublicDetailsCtrl({ patch: draft, ownerActorId: vportId })

    // FlyerEditorPanel.jsx — remove profileId prop dependency for save path
    // (profileId may still be needed elsewhere; verify callers before removing)

- Follow-up Command:  CARNAGE (confirm DB RLS on profile_public_details active — already
                      confirmed in settings VENOM; re-verify applies to flyer path)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-02-002
- Title:              IDOR — Design studio page-write controllers accept caller-supplied documentId
                      without binding it to ownerActorId
- Category:           IDOR/BOLA
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/
                      designStudio.pages.controller.js
                      ctrlSaveDesignPageScene:32–72
                      ctrlCreateDesignPage:74–121
                      ctrlDeleteDesignPage:123–145
- Source:             documentId parameter — caller-supplied in all three controllers
- Sink:               dalCreateDesignPageVersion (save), dalCreateDesignPage (create),
                      dalDeleteDesignPageById (delete) — all in designStudio.write.dal.js
- Trust Boundary:     Each controller calls requireOwnerActorAccess(ownerActorId) ✓ but does NOT
                      verify document.owner_actor_id === ownerActorId
- Impact:             An attacker owning ActorA who knows a victim's documentId + pageId (UUIDs)
                      can:
                      — ctrlSaveDesignPageScene: write arbitrary scene content to victim's design page
                      — ctrlCreateDesignPage: add pages to victim's document
                      — ctrlDeleteDesignPage: permanently delete pages from victim's document
                      (All contingent on DB RLS being absent — VENOM-DESIGN-001)
- Evidence:
    // ctrlSaveDesignPageScene (lines 32–41) — no document→owner binding check
    export async function ctrlSaveDesignPageScene({ ownerActorId, documentId, pageId, scene }) {
      await requireOwnerActorAccess(ownerActorId);   // ← verifies ActorA ✓
      if (!documentId) throw new Error("Document id is required.");

      const pageRow = await dalReadDesignPageById(pageId);
      if (!pageRow) throw new Error("Page not found.");
      if (String(pageRow.document_id) !== String(documentId)) {
        throw new Error("Page does not belong to this document.");  // ← verifies page→doc ✓
      }
      // ← NO: if (document.owner_actor_id !== ownerActorId) throw ...
      // dalCreateDesignPageVersion fires next — no owner binding
    }

    // ctrlDeleteDesignPage (lines 123–144) — no document→owner binding check
    export async function ctrlDeleteDesignPage({ ownerActorId, documentId, pageId }) {
      await requireOwnerActorAccess(ownerActorId);   // ← verifies ActorA ✓
      const pages = await dalListDesignPagesByDocument(documentId);  // victim's doc
      const targetPage = pages.find((row) => row.id === pageId);
      if (!targetPage) throw new Error("Page not found.");
      // ← deletes target page — no check that documentId belongs to ownerActorId
      await dalDeleteDesignPageById(pageId);
    }

    // dalReadDesignDocumentById (read.dal.js:33–42) — returns owner_actor_id but never called
    // to validate ownership in the write path
    export async function dalReadDesignDocumentById(documentId) {
      return VC().from("design_documents")
        .select("id,owner_actor_id,...")  // owner_actor_id available but not checked
        .eq("id", documentId).maybeSingle();
    }
- Reproduction Steps:
    1. Authenticate as a user who owns ActorA
    2. Obtain victim's documentId and a pageId (UUIDs — not in public URLs, but discoverable
       if exposed via export URLs, logs, or another read surface)
    3. For scene overwrite: call ctrlSaveDesignPageScene({
         ownerActorId: actorAId, documentId: victimDocId,
         pageId: victimPageId, scene: maliciousScene
       })
    4. requireOwnerActorAccess(actorAId) passes (caller owns ActorA)
    5. dalReadDesignPageById(victimPageId) returns page; document_id === victimDocId ✓
    6. dalCreateDesignPageVersion fires — writes to victim's page
    7. If DB RLS absent on design tables: write succeeds
    8. For deletion: similar path via ctrlDeleteDesignPage → dalDeleteDesignPageById
- Existing Defense:   requireOwnerActorAccess(ownerActorId) — caller's actor verified ✓
                      page→document binding verified (page.document_id === documentId) ✓
                      DB RLS — status UNKNOWN (VENOM-DESIGN-001 unresolved)
- Why Defense Is Insufficient:
    The ownership gate confirms the caller's actor identity. The page→document binding confirms
    the page is in the expected document. But neither check confirms the document belongs to
    ownerActorId. dalReadDesignDocumentById returns owner_actor_id but is not called in any of
    the three write controllers for ownership verification.
- Recommended Fix:    In all three page-write controllers, after requireOwnerActorAccess:
                      (1) read the document by documentId
                      (2) assert document.owner_actor_id === ownerActorId before any write
- Suggested Patch:

    // designStudio.pages.controller.js — add to all three write functions

    // New shared helper (can live in designStudio.shared.controller.js)
    import { dalReadDesignDocumentById } from '.../designStudio.read.dal'

    async function requireDocumentOwnership(ownerActorId, documentId) {
      const doc = await dalReadDesignDocumentById(documentId)
      if (!doc) throw new Error('Design document not found.')
      if (String(doc.owner_actor_id) !== String(ownerActorId)) {
        throw new Error('You do not have access to this design document.')
      }
      return doc
    }

    // ctrlSaveDesignPageScene — add after requireOwnerActorAccess
    export async function ctrlSaveDesignPageScene({ ownerActorId, documentId, pageId, scene }) {
      await requireOwnerActorAccess(ownerActorId)
      await requireDocumentOwnership(ownerActorId, documentId)  // ADD THIS
      ...
    }

    // ctrlCreateDesignPage — add after requireOwnerActorAccess
    export async function ctrlCreateDesignPage({ ownerActorId, documentId }) {
      await requireOwnerActorAccess(ownerActorId)
      await requireDocumentOwnership(ownerActorId, documentId)  // ADD THIS
      ...
    }

    // ctrlDeleteDesignPage — add after requireOwnerActorAccess
    export async function ctrlDeleteDesignPage({ ownerActorId, documentId, pageId }) {
      await requireOwnerActorAccess(ownerActorId)
      await requireDocumentOwnership(ownerActorId, documentId)  // ADD THIS
      ...
    }

- Follow-up Command:  CARNAGE — confirm DB RLS on design tables (VENOM-DESIGN-001); if RLS
                      is absent these findings are HIGH not MEDIUM
```

---

## Low Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-02-003
- Title:              dalReadActorOwnerRow (design studio) missing is_void filter — revoked
                      ownership links may still grant access
- Category:           Auth Bypass
- Severity:           LOW
- Status:             Open (requires DB schema verification)
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/dal/
                      designStudio.read.dal.js:5–15
- Source:             actor_owners table row — row may exist with is_void = true (revoked link)
- Sink:               requireOwnerActorAccess (designStudio.shared.controller.js) — uses the
                      return value of dalReadActorOwnerRow to gate all design studio writes
- Trust Boundary:     dalReadActorOwnerRow — should filter is_void = false if column exists
- Impact:             If actor_owners.is_void column exists and a revoked link has is_void = true,
                      the design studio's ownership gate passes for a user whose VPORT ownership
                      was revoked. They retain write access to design documents, pages, and assets.
- Evidence:
    // designStudio.read.dal.js:5–15 — no is_void filter
    export async function dalReadActorOwnerRow({ actorId, userId }) {
      const { data, error } = await VC()
        .from("actor_owners")
        .select("actor_id,user_id")   // ← is_void NOT selected
        .eq("actor_id", actorId)
        .eq("user_id", userId)        // ← no .eq("is_void", false) filter
        .maybeSingle();
      return data;
    }

    // Compare with canonical assertActorOwnsVportActorController:
    // booking/controller/assertActorOwnsVportActor.controller.js
    const ownerLink = await readActorOwnerLinkByActorAndUserProfileDAL(...)
    if (!ownerLink || ownerLink.is_void === true) {   // ← explicitly checks is_void
      throw new Error("Actor does not own this vport actor.");
    }
- Reproduction Steps:
    1. (DB-level setup required) Set actor_owners.is_void = true for a user→VPORT link
    2. User attempts to use the design studio for that VPORT
    3. requireOwnerActorAccess calls dalReadActorOwnerRow
    4. dalReadActorOwnerRow returns the row (is_void not filtered)
    5. requireOwnerActorAccess passes — user retains design studio access despite revoked ownership
- Existing Defense:   dalReadActorOwnerRow queries by (actor_id, user_id) — correct table/columns
- Why Defense Is Insufficient:
    Without filtering is_void = false, a soft-deleted (revoked) ownership row satisfies the check.
    This is inconsistent with the canonical pattern used throughout the platform.
    DB schema verification required — if actor_owners.is_void does not exist, this is INFO only.
- Recommended Fix:    Add .eq("is_void", false) filter and select is_void in the query,
                      consistent with platform canonical ownership checks.
- Suggested Patch:

    // designStudio.read.dal.js:5–15 — AFTER
    export async function dalReadActorOwnerRow({ actorId, userId }) {
      const { data, error } = await VC()
        .from("actor_owners")
        .select("actor_id,user_id,is_void")   // ← include is_void
        .eq("actor_id", actorId)
        .eq("user_id", userId)
        .eq("is_void", false)                 // ← add is_void filter
        .maybeSingle();

      if (error) throw error;
      return data;
    }

    // NOTE: If actor_owners.is_void column does not exist on the DB schema,
    // this patch would cause a PostgREST error. Verify column existence via CARNAGE
    // before applying.

- Follow-up Command:  CARNAGE — verify actor_owners.is_void column exists;
                      DB (schema inspection)
```

---

## Info Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-02-004
- Title:              uploadFlyerImageCtrl silently ignores caller-supplied kind and bucket params
- Category:           IDOR/BOLA (INFO — no exploit path)
- Severity:           INFO
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js:6–28
- Source:             kind parameter (caller-supplied), bucket parameter (passed from useFlyerEditor)
- Sink:               uploadMediaController — receives file, scope, ownerActorId, opts only
- Trust Boundary:     uploadFlyerImageCtrl
- Impact:             None — parameters are accepted but never forwarded. Upload always targets
                      scope='design_asset' and extraPath='assets' regardless of caller input.
                      Effectively safer than if they were used, but represents interface drift
                      (callers believe they control routing but they do not).
- Evidence:
    // flyerEditor.controller.js:6–28
    export async function uploadFlyerImageCtrl({ vportId, file, kind }) {
      const result = await uploadMediaController({
        file,
        scope: 'design_asset',        // ← hardcoded, kind ignored
        ownerActorId: vportId,
        opts: { extraPath: 'assets' }, // ← hardcoded, bucket ignored
      })
      ...
    }

    // useFlyerEditor.js:12
    const url = await uploadFlyerImageCtrl({ bucket, vportId, file, kind })
    // ← bucket and kind passed but discarded in controller
- Reproduction Steps:  N/A — no exploitable path. Parameters ignored.
- Existing Defense:   N/A — parameters are silently dropped
- Why Defense Is Insufficient: N/A — not a security finding
- Recommended Fix:    Either (a) remove kind and bucket from the function signature to
                      eliminate false interface, or (b) use them if upload routing flexibility
                      is intentional. Document the decision.
- Suggested Patch:

    // OPTION A — remove dead params from signature
    export async function uploadFlyerImageCtrl({ vportId, file }) {
      // kind and bucket removed — upload always goes to design_asset scope
      ...
    }

    // useFlyerEditor.js — update call site
    const url = await uploadFlyerImageCtrl({ bucket: undefined, vportId, file, kind: undefined })
    // simplify to:
    const url = await uploadFlyerImageCtrl({ vportId, file })

- Follow-up Command:  None required — hygiene only
```

---

## False Positives Rejected

---

```
FALSE POSITIVE REJECTED

- Candidate:       Double-submit on useFlyerEditor.onSave creating duplicate profile_public_details writes
- Location:        apps/VCSM/src/features/dashboard/flyerBuilder/hooks/useFlyerEditor.js
- Rejection reason: Sink is not dangerous — profile_public_details upsert is idempotent on
                   profile_id conflict. Both calls pass ownership independently. No data corruption,
                   no auth bypass. Already noted as BW-FLYER-001 (INFO) in BLACKWIDOW pass.
- Chain gap:        Impact — no exploitable consequence
- Notes:           FlyerEditorPanel button uses disabled={saving} as UI mitigation.
```

```
FALSE POSITIVE REJECTED

- Candidate:       Direct flyerBuilder DAL access via public adapter bypass
- Location:        apps/VCSM/src/features/dashboard/flyerBuilder/dal/
- Rejection reason: Write DALs are internal files not exported from any public adapter.
                   saveFlyerPublicDetails is only imported by flyerEditor.controller.js.
                   designStudio write DALs are only imported by their controllers.
                   No external consumer can reach these DALs without going through controllers.
- Chain gap:        Source — no external import path exists
- Notes:           None
```

```
FALSE POSITIVE REJECTED

- Candidate:       ctrlLoadDesignStudio fetches victim documents by supplying victim ownerActorId
- Location:        apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/
                   designStudio.load.controller.js:117–140
- Rejection reason: ctrlLoadDesignStudio uses dalListDesignDocumentsByOwner({ ownerActorId, ... })
                   which filters by owner_actor_id. Documents returned always belong to ownerActorId.
                   No way to retrieve victim documents through the load path.
                   The IDOR only exists in the write path where documentId is caller-supplied.
- Chain gap:        Source — load path does not accept arbitrary documentId
- Notes:           ELEK-2026-06-02-002 correctly scopes IDOR to write controllers only
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-02-001 | IDOR — profileId not bound to ownerActorId in flyer save | MEDIUM | Controller + Hook | MODERATE | NO — but CARNAGE verify RLS |
| 2 | ELEK-2026-06-02-002 | IDOR — documentId not verified against ownerActorId in page writes | MEDIUM | Controller (×3) | SIMPLE — shared helper | NO — but CARNAGE verify RLS |
| 3 | ELEK-2026-06-02-003 | is_void filter missing in dalReadActorOwnerRow | LOW | DAL | SIMPLE — one filter line | YES — verify column exists |
| 4 | ELEK-2026-06-02-004 | Dead params in uploadFlyerImageCtrl | INFO | Controller | SIMPLE — signature cleanup | NO |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| CARNAGE | Verify DB RLS on `vc.design_documents`, `vc.design_pages`, `vc.design_page_versions`, `vc.design_assets`, `vc.design_exports`, `vc.design_render_jobs` — if absent ELEK-2026-06-02-002 escalates to HIGH. Also verify `actor_owners.is_void` column for ELEK-2026-06-02-003. | REQUIRED |
| WOLVERINE | Apply ELEK-2026-06-02-001 patch (derive profileId from ownerActorId) and ELEK-2026-06-02-002 patch (requireDocumentOwnership helper in 3 controllers) | REQUIRED before THOR |
| THOR | Release gate evaluation — 2 MEDIUM open (IDOR), 1 LOW (auth bypass, DB-contingent). THOR BLOCKED until ELEK-2026-06-02-001 and ELEK-2026-06-02-002 resolved. | PENDING |

---

## THOR Release Gate Assessment

| Finding | Blocks THOR | Condition |
|---|---|---|
| ELEK-2026-06-02-001 — IDOR profileId | **YES** | MEDIUM IDOR with confirmed app-layer code path |
| ELEK-2026-06-02-002 — IDOR documentId | **YES** | MEDIUM IDOR; escalates to HIGH if CARNAGE confirms absent RLS |
| ELEK-2026-06-02-003 — is_void gap | CAUTION | LOW; DB verification required |
| ELEK-2026-06-02-004 — dead params | NO | INFO / hygiene |
