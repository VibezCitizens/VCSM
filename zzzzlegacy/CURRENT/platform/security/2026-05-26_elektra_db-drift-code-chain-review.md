# ELEKTRA Security Report

**Date:** 2026-05-26  
**Scope:** VCSM  
**Reviewer:** ELEKTRA  
**Scan Trigger:** VENOM cross-reference — 4 DB-drift findings passed from `2026-05-26_venom_db-drift-rls-review.md`  
**Input:** VENOM report + DB reconciliation report (`2026-05-26_18-00_db_migration-reconciliation.md`)  
**Findings Summary:** 0 HIGH | 2 MEDIUM | 0 LOW | 1 INFO  
**False Positives Rejected:** 2  
**Suggested Patches:** 3  

---

## Executive Summary

ELEKTRA traced the DAL source code paths for all four VENOM DB-drift findings. Two code-level findings are confirmed. For **F-002** (media_assets missing soft-delete policy), the DAL file `mediaAssets.softDelete.dal.js` contains explicit comments asserting DB-level RLS column protection that does not currently exist — the code documents an assumption of a policy that was never applied. Any authenticated actor can bypass the app-layer column restriction by calling the Supabase REST API directly and modifying unrestricted columns on their own media assets. For **F-003** (moderation.actions policy condition mismatch), `insertModerationActionDAL` accepts arbitrary `actionType` values with no allowlist validation and two controllers insert `"unhide"` action types — if the live policy `actions_insert_self_hide` restricts inserts to `action_type = 'hide'` only, user-initiated unhide operations silently fail at the DB layer. VENOM findings F-001 and F-004 were traced to their code paths and rejected as code-level findings — both have adequate app-layer guards; risks are confined to DB governance.

---

## Medium Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-26-001
- Title:              DAL explicitly assumes missing RLS policy — platform.media_assets UPDATE path is column-unrestricted
- Category:           Supabase RLS
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/media/dal/mediaAssets.softDelete.dal.js:16–23 (comment)
                      apps/VCSM/src/features/media/dal/mediaAssets.softDelete.dal.js:33–40 (UPDATE payload)
                      apps/VCSM/src/features/media/controller/softDeleteMediaAsset.controller.js:13–18

- Source:             Any authenticated Supabase client session (bypassing app controller)
                      Direct REST API call: PATCH /rest/v1/platform/media_assets?id=eq.<assetId>
                      Or code directly importing supabase client without going through softDeleteMediaAssetController

- Sink:               platform.media_assets UPDATE via media_assets_vc_owner_update RLS policy
                      ({public} role, owner_source='vc', actor_owners join — no column restriction)

- Trust Boundary:     RLS WITH CHECK on platform.media_assets
                      Migration 20260519200000 intended to create:
                        "actor owner can soft delete media asset" — WITH CHECK (status = 'deleted' AND ...)
                      This policy was NEVER APPLIED. The trust boundary DOES NOT EXIST.

- Impact:             An authenticated actor who owns a media asset can directly UPDATE
                      any column on that asset via Supabase REST API, including:
                        - storage_key: point asset record to a different storage object
                        - owner_actor_id: re-assign ownership to a different actor
                        - status: set to any arbitrary value ('active', 'archived', 'flagged', etc.)
                      This corrupts the media registry for that actor's profile or VPORT.
                      No cross-actor impact (ownership check is present).

- Evidence:
    // mediaAssets.softDelete.dal.js:16–23 — DAL COMMENT (explicit assumption of missing protection)
    /**
     * DB UPDATE RLS enforces that the authenticated user owns the actor identified
     * by owner_actor_id. The WITH CHECK constraint on the policy additionally
     * enforces that status must be 'deleted' and deleted_by_actor_id is not null.
     * A caller cannot use this DAL to set arbitrary status values.
     */

    The comment is factually INCORRECT. The WITH CHECK constraint it describes
    does not exist on the live DB. The comment was written in anticipation of
    migration 20260519200000 which was never applied.

    // DAL UPDATE payload — correct columns, but only enforced at app layer:
    .update({
      status:              'deleted',
      deleted_at:          now,
      deleted_by_actor_id: deletedByActorId,
      updated_at:          now,
    })
    // No DB-layer enforcement that only these columns can be changed.

    // media_assets_vc_owner_update (live policy — no column restriction):
    // FOR UPDATE, TO {public}
    // USING: owner_source = 'vc' AND EXISTS actor_owners
    // WITH CHECK: (none beyond ownership — no column restriction, no status constraint)

- Reproduction Steps:
    1. Authenticate as a VCSM actor that owns at least one media asset (normal upload flow)
    2. Obtain the asset's UUID (visible from the actor's media gallery)
    3. Issue a direct Supabase REST request:
       PATCH https://nkdrjlmbtqbywhcthppm.supabase.co/rest/v1/platform/media_assets?id=eq.<assetId>
       Headers: Authorization: Bearer <session_jwt>, apikey: <anon_key>
       Body: { "storage_key": "crafted/path/to/another/object" }
    4. DB RLS evaluates media_assets_vc_owner_update — ownership check passes
    5. No WITH CHECK column restriction exists — update succeeds
    ⚠️ DO NOT reproduce on production. This is a code-analysis finding only.

- Existing Defense:
    - App-layer: softDeleteMediaAssetController and softDeleteMediaAssetDAL send only soft-delete
      columns in the update payload. App-path is correctly scoped.
    - DB-layer: media_assets_vc_owner_update enforces actor ownership (EXISTS actor_owners)
      preventing cross-actor modification.

- Why Defense Is Insufficient:
    - App-layer column restriction is bypassed by any direct API call to the Supabase
      REST endpoint — the controller is not a mandatory gateway.
    - DB-layer ownership check is present but there is no WITH CHECK column restriction.
    - The DAL comment documents this as if protection exists — creating false confidence
      during code review and future audit.

- Recommended Fix:
    1. Apply migration 20260519200000 (CARNAGE Phase 1, Fix 1a):
       - GRANT UPDATE (status, deleted_at, deleted_by_actor_id, updated_at) TO authenticated
       - CREATE POLICY "actor owner can soft delete media asset" WITH CHECK (status = 'deleted' AND ...)
    2. Evaluate media_assets_vc_owner_update for narrowing or removal
       (it currently allows unrestricted column UPDATE for {public} role)
    3. Update the DAL comment to accurately reflect the ACTUAL RLS state until the policy is applied

- Suggested Patch:

    // Patch 1 — IMMEDIATE: Correct the misleading DAL comment until policy is applied
    // File: apps/VCSM/src/features/media/dal/mediaAssets.softDelete.dal.js
    // Lines 16–23 — REPLACE comment with accurate state:

    /**
     * softDeleteMediaAssetDAL — set status = 'deleted' on one platform.media_assets row.
     *
     * ⚠️ DB POLICY STATE: The restrictive soft-delete UPDATE policy
     * ("actor owner can soft delete media asset") from migration 20260519200000
     * has NOT yet been applied to the live DB. Until it is applied, the DB-layer
     * only enforces actor ownership (media_assets_vc_owner_update) — NOT column
     * restriction. Column restriction is currently enforced at the app layer only.
     *
     * TODO: After applying migration 20260519200000, restore the original comment.
     *
     * @param {string} assetId          — UUID of the asset to soft-delete
     * @param {string} deletedByActorId — actorId of the authenticated actor requesting deletion
     */

    // Patch 2 — DB FIX (text only, via SQL editor): Apply migration 20260519200000
    // See CARNAGE Phase 1, Fix 1a for full SQL proposal.

- Follow-up Command:  CARNAGE (Phase 1 Fix 1a), THOR (release gate — missing policy is release-adjacent)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-26-002
- Title:              insertModerationActionDAL accepts arbitrary actionType — unverified live policy may reject "unhide" inserts causing silent functional break
- Category:           Supabase RLS
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/moderation/dal/moderationActions.dal.js:44 (no allowlist guard)
                      apps/VCSM/src/features/moderation/controllers/postVisibility.controller.js:88 (unhide insert)
                      apps/VCSM/src/features/moderation/controllers/postVisibility.controller.js:53 (hide insert)
                      apps/VCSM/src/features/moderation/controllers/commentVisibility.controller.js:103, 123 (hide/unhide inserts)

- Source:             User-triggered hide/unhide post or comment action in the VCSM UI
                      actorId comes from useIdentity() session; actionType hardcoded at controller call site

- Sink:               moderation.actions INSERT via insertModerationActionDAL
                      SQL: supabase.schema("moderation").from("actions").insert({ action_type: actionType, ... })
                      File: moderationActions.dal.js:46–64

- Trust Boundary:     DB RLS INSERT policy on moderation.actions
                      Live policy: "actions_insert_self_hide" (name suggests action_type = 'hide' restriction)
                      Intended policy from migration 20260518020000: "actions_insert_own_actor"
                        WITH CHECK (actor_id IN (SELECT actor_id FROM vc.actor_owners WHERE user_id = auth.uid()))
                      Actual policy conditions: UNVERIFIED (pg_policies.qual not yet inspected)

- Impact:
    Scenario A (if policy restricts to action_type = 'hide' only):
      - Any call to insertModerationActionDAL with actionType = 'unhide' fails with RLS violation
      - postVisibility.controller.js:89 → unhidePostForActor breaks silently
      - commentVisibility.controller.js:122 → unhideCommentForActor breaks silently
      - Users who hide a post/comment cannot undo it — the unhide action is rejected at DB layer
      - The controller does not catch or surface the RLS error as a user-facing message

    Scenario B (if policy allows all action_types for owned actor_id):
      - Functional risk is LOW — hide/unhide both work
      - Security risk: caller-supplied actionType is not validated → any arbitrary string
        can be inserted as action_type in moderation.actions records
        (e.g., "promote", "escalate", "admin_review" — if downstream systems read this field)

- Evidence:
    // moderationActions.dal.js:44 — only truthy check, no enum validation
    if (!actionType) throw new Error("insertModerationActionDAL: actionType required");

    // postVisibility.controller.js:88–90 — "unhide" passed without guard
    await insertModerationActionDAL({
      actorId,
      ...
      actionType: "unhide",   // ← not validated against allowlist
      reason,
    });

    // commentVisibility.controller.js:122–130 — same pattern
    await insertModerationActionDAL({
      actorId,
      ...
      actionType: "unhide",   // ← not validated against allowlist
      reason,
    });

    // VENOM F-003: live DB has "actions_insert_self_hide" policy
    // — actual WITH CHECK condition has NOT been inspected
    // — policy name strongly implies action_type = 'hide' restriction

- Reproduction Steps:
    1. Authenticate as a VCSM user
    2. Open a post in the feed and hide it (calls insertModerationActionDAL with actionType="hide")
    3. Attempt to unhide the same post (calls insertModerationActionDAL with actionType="unhide")
    4. If live policy restricts to action_type='hide': step 3 returns DB error silently
    5. The post remains hidden with no way for the user to reverse it
    ⚠️ DO NOT test on production. Inspect live policy conditions first.

- Existing Defense:
    - actorId is required (line 41) — no unauthenticated insert possible
    - controller-layer validates actorId and targetId before calling DAL
    - DB-layer ownership check (if via actor_owners join) prevents cross-actor inserts

- Why Defense Is Insufficient:
    - actionType has no allowlist validation at any app layer (controller or DAL)
    - Live DB policy condition is unknown — risk severity depends on actual condition
    - If condition = 'hide' only: legitimate unhide operations silently fail
    - If condition is unconstrained: arbitrary action_type strings enter moderation.actions

- Recommended Fix:
    1. Run the DB inspection query (CARNAGE Phase 1, Fix 1b) to reveal live policy conditions:
       SELECT policyname, cmd, roles, qual, with_check
       FROM pg_policies WHERE schemaname = 'moderation' AND tablename = 'actions';
    2. Add actionType allowlist validation in insertModerationActionDAL:
       See Suggested Patch below.
    3. Depending on inspection result:
       a. If policy allows all action_types via actor_owners: allowlist is sufficient fix
       b. If policy restricts to 'hide': policy must be updated to include 'unhide', 'hide',
          and any other types the code intentionally inserts (conversation hide/unhide)

- Suggested Patch:

    // Patch 3 — apps/VCSM/src/features/moderation/dal/moderationActions.dal.js
    // Add allowlist validation before the insert (lines 41–44 region)

    // BEFORE (line 44 only):
    if (!actionType) throw new Error("insertModerationActionDAL: actionType required");

    // AFTER (add allowlist guard):
    const ALLOWED_ACTION_TYPES = Object.freeze([
      'hide',
      'unhide',
      'mute',
      'report',
      'dismiss',
      'block',
    ]);

    if (!actionType) throw new Error("insertModerationActionDAL: actionType required");
    if (!ALLOWED_ACTION_TYPES.includes(actionType)) {
      throw new Error(`insertModerationActionDAL: actionType "${actionType}" is not in the allowlist`);
    }

    // Note: expand ALLOWED_ACTION_TYPES as new action types are added to the system.
    // This list must stay in sync with the DB-level policy conditions.

- Follow-up Command:  DB (inspect live policy conditions first), CARNAGE (Phase 3 registration decision), THOR
```

---

## Info Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-26-003
- Title:              assertActorOwnsVportActorController uses profile_id as ownership lookup intermediary
- Category:           IDOR/BOLA (potential identity surface compliance)
- Severity:           INFO
- Status:             Open (hygiene / architecture contract compliance)
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js:28–37

- Source:             requestActorId passed from hook layer (useIdentity().actorId)
- Sink:               readActorOwnerLinkByActorAndUserProfileDAL({ targetActorId, userProfileId: requesterProfileId })
- Trust Boundary:     app-layer ownership check via actor_owners join (profile_id as lookup key)

- Impact:
    LOW — no active exploit path. profile_id is read from the DB (via getActorByIdDAL), not
    from client input. The value is DB-trusted before it reaches the ownership check.
    Architecture contract compliance concern only: VCSM identity contract prohibits
    profile_id as an authority surface. Here profile_id is an intermediate DB-derived
    lookup value, not a client-supplied authority claim.

- Evidence:
    // assertActorOwnsVportActorController.js:28–37
    const requesterProfileId = requesterActor.profile_id ?? null;   // line 28 — from DB
    if (!requesterProfileId) {
      throw new Error("Requester actor is missing profile ownership identity.");
    }

    const ownerLink = await readActorOwnerLinkByActorAndUserProfileDAL({
      targetActorId,
      userProfileId: requesterProfileId,   // profile_id used as ownership lookup key
    });

    The identity contract mandates ownership verification via actorId + auth.uid()
    through actor_owners (actorId → userId → auth.uid()). Using profile_id as an
    intermediary step is a deviation from the canonical pattern, even if the profile_id
    is read from a trusted DB source.

- Existing Defense:
    - profile_id comes from getActorByIdDAL (DB read), not from client input
    - If profile_id is null, the check throws — no silent bypass
    - The ownership lookup via profile_id still resolves to the correct actor_owners check

- Why Defense Is Insufficient:
    - profile_id is nominally a forbidden identity intermediary per the architecture contract
    - If actor ownership is ever restructured to decouple profile_id from user ownership,
      this check would silently stop working correctly
    - The canonical pattern (actorId → actor_owners → user_id = auth.uid()) is more robust
      and future-proof

- Recommended Fix:
    Refactor readActorOwnerLinkByActorAndUserProfileDAL to use user_id (from auth.uid())
    instead of profile_id as the ownership lookup key:
      actor_owners WHERE actor_id = targetActorId AND user_id = auth.uid()
    Remove the profile_id intermediary step from assertActorOwnsVportActorController.

- Suggested Patch:
    // This patch requires verifying the DAL and DB schema support user_id lookup.
    // Defer to a separate refactor task — do not block the current release on this finding.
    // Tag for VCSM identity contract compliance review.

- Follow-up Command:  VENOM (identity surface review), LOGAN (architecture contract docs)
```

---

## False Positives Rejected

---

```
FALSE POSITIVE REJECTED

- Candidate:       F-001 code-level — vport.availability_rules write path bypassed via direct API
- Location:        apps/VCSM/src/features/booking/controller/setAvailabilityRule.controller.js
                   apps/VCSM/src/features/booking/dal/upsertAvailabilityRule.dal.js
- Rejection reason: App-layer ownership check is present and correctly implemented.
                    DB-layer SECURITY DEFINER guards block anon writes. No code-level bypass path confirmed.
- Chain gap:        Sink — could not confirm that direct API bypass produces an exploitable outcome.
                    DB-layer SECURITY DEFINER functions (actor_can_manage_profile, current_actor_can_manage_resource)
                    return false for non-owners regardless of {public} role on the policy.
- Notes:           The {public} role issue is a real DB governance concern (VENOM F-001, MEDIUM).
                    At the code level: controller has assertActorOwnsVportActorController before the DAL call.
                    DAL uses vportClient (supabase.schema('vport') — regular auth client, not service role).
                    Column allowlist RULE_WRITE_COLUMNS is applied via pickDefined() before upsert.
                    No code-level IDOR chain confirmed. Governance risk deferred to CARNAGE Phase 6A + DB cleanup.
```

---

```
FALSE POSITIVE REJECTED

- Candidate:       F-004 code-level — fuel_price_submissions write bypasses new policies via legacy path
- Location:        apps/VCSM/src/features/profiles/kinds/vport/dal/gas/vportFuelPriceSubmissions.write.dal.js
                   apps/VCSM/src/features/profiles/kinds/vport/controller/gas/submitFuelPriceSuggestion.controller.js
- Rejection reason: No service role bypass. Standard anon client used. Legacy policies have auth guards
                    (auth.uid() IS NOT NULL). Controller validates actorId. Ownership verified for owner path.
- Chain gap:        Sink — could not confirm that legacy policy presence creates an exploitable code path.
                    Legacy INSERT policy has auth.uid() IS NOT NULL, so anon is blocked. Authenticated callers
                    go through the new canonical policies as well (PERMISSIVE OR — both evaluate, most permissive wins).
- Notes:           The legacy policy accumulation is a DB governance issue (VENOM F-004, LOW).
                    No code-level bypass exists. Deferred to CARNAGE Phase 6B cleanup migration.
                    submitFuelPriceSuggestion controller owner path correctly verifies ownership via
                    checkVportOwnershipController before bypassing the submission pipeline.
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-05-26-001 | Correct misleading DAL comment (immediate) | MEDIUM | DAL | SIMPLE | No (comment fix only; DB fix is separate) |
| 2 | ELEK-2026-05-26-001 | Apply restrictive soft-delete RLS policy | MEDIUM | RLS | MODERATE | YES — migration 20260519200000 + media_assets_vc_owner_update evaluation |
| 3 | ELEK-2026-05-26-002 | Add actionType allowlist in insertModerationActionDAL | MEDIUM | DAL | SIMPLE | Depends on DB inspection result (CARNAGE Phase 1 Fix 1b) |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| DB | Inspect live `moderation.actions` policy conditions (Fix 1b) — required before ELEK-002 patch can be finalized | BLOCKED ON: live psql inspection |
| CARNAGE | Phase 1 Fix 1a (apply soft-delete policy) + Phase 3 registration (after fix applied) | READY — plan already produced |
| VENOM | ELEK-003 identity surface note — profile_id intermediary in assertActorOwnsVportActorController | OPEN |
| THOR | ELEK-001 (missing policy) is a release-adjacent risk; ELEK-002 (functional break risk) must be resolved before shipping unhide functionality | PENDING |
| BLACKWIDOW | Runtime validation of ELEK-001 — verify direct REST API update bypasses app-layer column restriction | OPTIONAL — code evidence is sufficient for MEDIUM classification |

---

## THOR Release Gate Assessment

From ELEKTRA's perspective:

| Finding | Release Gate? | Reason |
|---|---|---|
| ELEK-2026-05-26-001 | CAUTION | DB policy gap causes column-unrestricted UPDATE for own assets. No cross-actor impact. Fix is in CARNAGE plan. |
| ELEK-2026-05-26-002 | CAUTION | Unhide operations may silently fail if live policy restricts to 'hide' only. Must be verified (DB inspection) before shipping hide/unhide flow. |
| ELEK-2026-05-26-003 | NO BLOCK | INFO finding — architecture hygiene only. No active exploit path. |

**THOR Note:** Neither MEDIUM finding is release-BLOCKING on its own because (1) ELEK-001 has no cross-actor impact, and (2) ELEK-002 requires DB inspection confirmation. THOR may allow release with CAUTION status if both mitigations are tracked and the DB inspection is completed before shipping.

---

*ELEKTRA analysis complete — read-only. No source files modified. No database changes made.*  
*Generated: 2026-05-26*
