---
# ELEKTRA Security Report

**Date:** 2026-05-28
**Scope:** VCSM
**Reviewer:** ELEKTRA
**Scan Trigger:** MANUAL — P1/P2 HIGH risk modules (settings + delete-lifecycle two-module sprint)
**Findings Summary:** 2 HIGH | 2 MEDIUM | 1 LOW | 1 INFO
**False Positives Rejected:** 2
**Suggested Patches:** 4

---

## Executive Summary

ELEKTRA traced all source→sink chains in the settings module: vports CRUD paths (directory visibility, business card, account deletion, VPORT hard/soft/restore), privacy blocks, and actor privacy visibility.

Two HIGH findings are confirmed. `ctrlSetVportBusinessCardPublishState` is the only write path in the settings feature that carries no controller-layer ownership check — the RPC (`set_business_card_publish_state`, SECURITY DEFINER) is the sole gate. If the RPC's ownership check is misconfigured or toggled, there is no defense-in-depth layer at the application boundary. `ctrlSetActorPrivacy` accepts `actorId` directly from the caller (the React hook supplies it) with no server-side verification that the caller owns that actor — the only identity check in the entire chain is the DAL's upsert, which trusts the actorId parameter completely.

Two MEDIUM findings are confirmed. `syncDirectoryVisibleToPublicDetailsDAL` performs a secondary ownership re-check against `vport.profiles.owner_user_id`, but the target table `vport.profile_public_details` has no RLS (confirmed by CARNAGE 2026-05-27), meaning the UPDATE that follows is unscoped if the ownership pre-check is bypassed or the DAL is called directly. `dalSetActorPrivacy` has no `auth.getUser()` call anywhere in its body — it trusts the `actorId` parameter fully, meaning any caller with a valid Supabase session can upsert the privacy row for any `actor_id`.

One LOW finding: `dalDeleteOwnedVportById` remains exported and live in the bundle despite a code comment marking it deprecated. It uses the legacy `owner_user_id` ownership model (not `actor_owners`) and calls `.update({ is_deleted: true })` without triggering any actor-chain cascade logic.

Two false positives were rejected: `listMyVportsDAL` (VENOM-SETTINGS-004 already open; chain confirmed and assigned) and `ctrlGetAuthedUserId` (correctly delegates to server-session DAL; no trust boundary crossed).

---

## High Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-28-001
- Title:              ctrlSetVportBusinessCardPublishState — no controller-layer ownership check before calling SECURITY DEFINER RPC
- Category:           Missing Authorization
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/settings/vports/controller/vportBusinessCard.controller.js : lines 3–5
- Source:             `vportId` parameter accepted directly from hook caller (useVportsController.js line 113)
- Sink:               `setVportBusinessCardPublishStateDAL(vportId, published)` → `vportSchema.rpc("set_business_card_publish_state", { p_vport_id: vportId, ... })`
- Trust Boundary:     Controller layer — no ownership verification present
- Impact:             Any authenticated user who can call ctrlSetVportBusinessCardPublishState (via hook or direct import) may attempt to publish or unpublish any VPORT's business card by supplying an arbitrary vportId. The sole defense is the SECURITY DEFINER RPC's internal ownership check. If the RPC ownership logic is misconfigured, updated, or the function is replaced by a differently-scoped version, there is no application-layer fallback. The pattern is asymmetric with all other write controllers in this feature (ctrlSetVportDirectoryVisible, ctrlSetVportBusinessCardSettings) which both call assertActorOwnsVportActorController before delegating to the DAL.
- Evidence:
    // vportBusinessCard.controller.js (full file)
    import { setVportBusinessCardPublishStateDAL } from '@/features/settings/vports/dal/vports.write.dal'

    export async function ctrlSetVportBusinessCardPublishState({ vportId, published }) {
      return setVportBusinessCardPublishStateDAL(vportId, published)   // ← no ownership check
    }

    // Compare: ctrlSetVportDirectoryVisible (vportDirectoryVisibility.controller.js:35)
    await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: vportActorId });
    // and: ctrlSetVportBusinessCardSettings (vportBusinessCardSettings.controller.js:34)
    await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: vportActorId });
- Reproduction Steps:
    1. Authenticate as user A (owns VPORT-A)
    2. Import ctrlSetVportBusinessCardPublishState directly
    3. Call with { vportId: <VPORT-B-id>, published: true }
    4. Observe: call reaches set_business_card_publish_state RPC — SECURITY DEFINER may reject but no application-layer audit trail is generated
    (Do not test on production — use a local Supabase dev instance with a cloned schema)
- Existing Defense:     SECURITY DEFINER RPC `set_business_card_publish_state` performs ownership check at DB layer (confirmed in vports.write.dal.js lines 11–24)
- Why Defense Is Insufficient: DB-layer defense only. Zero application-layer defense-in-depth. The pattern is inconsistent with all other write controllers in this module which carry assertActorOwnsVportActorController. A future RPC schema change or misconfiguration removes the sole defense entirely. No callerActorId or vportActorId is passed to the controller; adding them later requires a hook-surface API change.
- Recommended Fix:    Add callerActorId and vportActorId parameters to ctrlSetVportBusinessCardPublishState. Call assertActorOwnsVportActorController before delegating to the DAL. Mirror the signature of ctrlSetVportDirectoryVisible exactly.
- Suggested Patch:
    // vportBusinessCard.controller.js — replace entire file

    import { setVportBusinessCardPublishStateDAL } from '@/features/settings/vports/dal/vports.write.dal'
    import assertActorOwnsVportActorController from '@/features/booking/controller/assertActorOwnsVportActor.controller'

    export async function ctrlSetVportBusinessCardPublishState({ vportId, published, callerActorId, vportActorId }) {
      if (!vportId)       throw new Error('ctrlSetVportBusinessCardPublishState: vportId required')
      if (!callerActorId) throw new Error('ctrlSetVportBusinessCardPublishState: callerActorId required')
      if (!vportActorId)  throw new Error('ctrlSetVportBusinessCardPublishState: vportActorId required')

      await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: vportActorId })

      return setVportBusinessCardPublishStateDAL(vportId, published)
    }

    // Caller update required: useVportsController.js setBusinessCardPublished() must pass callerActorId + vportActorId
- Follow-up Command:  SPIDER-MAN — add regression test asserting that an attacker supplying a foreign vportId is rejected at the controller layer
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-28-002
- Title:              ctrlSetActorPrivacy — actorId accepted from caller with no server-side ownership verification
- Category:           Insecure Authorization / Actor Impersonation
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/settings/privacy/controller/actorPrivacy.controller.js : lines 13–21
                      apps/VCSM/src/features/settings/privacy/dal/visibility.dal.js : lines 41–57
- Source:             `actorId` parameter from `useUpdateVportVisibility` hook (useUpdateVportVisibility.js line 17)
- Sink:               `dalSetActorPrivacy(actorId, isPrivate)` → `supabase.schema('vc').from('actor_privacy_settings').upsert({ actor_id: actorId, is_private: isPrivate, ... })`
- Trust Boundary:     Controller layer — no ownership check present
- Impact:             Any authenticated user can toggle the `is_private` flag for any actor_id they supply. The Supabase client-side SDK call carries the caller's JWT for RLS evaluation — but if `actor_privacy_settings` has no RLS write policy, or its policy does not scope to `actor_owners`, any actor_id value is accepted. The UPSERT will create a new row (or overwrite an existing one) for the target actor_id, silently setting any actor's profile private or public without their knowledge. This is an actor privacy hijack: actor A can be forced private by actor B, suppressing actor A from discovery, follow feeds, and directory listings.
- Evidence:
    // actorPrivacy.controller.js lines 13–21
    export async function ctrlSetActorPrivacy({ actorId, isPrivate, refreshActorFn }) {
      if (!actorId) throw new Error('Missing actorId')
      await dalSetActorPrivacy(actorId, Boolean(isPrivate))   // ← no ownership check
      invalidateActorPrivacyCacheAdapter(actorId)
      invalidateActorBundleEntry(actorId)
      refreshActorFn?.(actorId)
      return true
    }

    // visibility.dal.js lines 41–57
    export async function dalSetActorPrivacy(actorId, isPrivate) {
      if (!actorId) throw new Error('Missing actorId')
      const { error } = await supabase
        .schema ('vc')
        .from('actor_privacy_settings')
        .upsert(
          { actor_id: actorId, is_private: isPrivate, updated_at: new Date().toISOString() },
          { onConflict: 'actor_id' }
        )   // ← actorId passed through with no auth.getUser() binding
      if (error) throw error
      return true
    }
- Reproduction Steps:
    1. Authenticate as user A (owns actor-A)
    2. Import ctrlSetActorPrivacy directly or call the hook with a spoofed actorId
    3. Call with { actorId: '<actor-B-id>', isPrivate: true }
    4. Observe: UPSERT fires with actor_id = actor-B. If RLS on actor_privacy_settings does not enforce actor_owners, actor B is now forced private.
    5. Actor B's profile no longer appears in public discovery, follow feeds, or directory pages.
    (Do not test on production)
- Existing Defense:     None at controller or DAL layer. Sole defense is DB-level RLS on `vc.actor_privacy_settings` (policy status not confirmed in code).
- Why Defense Is Insufficient: Zero application-layer guard. No callerActorId is accepted or checked. The controller does not call auth.getUser() nor assertActorOwnsVportActorController. BW-SUB-004 in the subscribers module confirmed a related bypass pattern (ctrlSetActorPrivacy no assertingActorId gate) — this is the source file for that finding.
- Recommended Fix:    Add a `callerActorId` parameter to ctrlSetActorPrivacy. Before calling the DAL, assert that String(callerActorId) === String(actorId). For vport-kind actors, add an assertActorOwnsVportActorController check using the caller's user-kind actorId and the target vportActorId.
- Suggested Patch:
    // actorPrivacy.controller.js — add ownership gate

    export async function ctrlSetActorPrivacy({ actorId, isPrivate, refreshActorFn, callerActorId }) {
      if (!actorId) throw new Error('Missing actorId')
      if (!callerActorId) throw new Error('ctrlSetActorPrivacy: callerActorId required')
      if (String(callerActorId) !== String(actorId)) {
        throw new Error('ctrlSetActorPrivacy: caller does not own this actor')
      }
      await dalSetActorPrivacy(actorId, Boolean(isPrivate))
      invalidateActorPrivacyCacheAdapter(actorId)
      invalidateActorBundleEntry(actorId)
      refreshActorFn?.(actorId)
      return true
    }

    // Callers: pass callerActorId = identity.actorId from useIdentity()
    // Note: for vport-kind actor contexts, extend with assertActorOwnsVportActorController
- Follow-up Command:  SPIDER-MAN — regression test: unauthenticated caller and foreign actorId are both rejected
```

---

## Medium Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-28-003
- Title:              syncDirectoryVisibleToPublicDetailsDAL — writes to profile_public_details after soft ownership check; table has no RLS (VENOM-SETTINGS-002)
- Category:           Defense-in-Depth Gap / Insufficient Access Control at DB Layer
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/settings/vports/dal/vports.write.dal.js : lines 94–117
- Source:             `vportId` passed from ctrlSetVportDirectoryVisible (controller-layer ownership verified by assertActorOwnsVportActorController)
- Sink:               `vportSchema.from("profile_public_details").update({ directory_visible }).eq("profile_id", vportId)` — line 112–114
- Trust Boundary:     DAL layer — post-ownership-check write to an unscoped table
- Impact:             Two exploitation surfaces. (1) If syncDirectoryVisibleToPublicDetailsDAL is called directly (bypassing the controller), it performs a secondary ownership check (lines 102–109) using owner_user_id — but this check queries vport.profiles while the target write is to vport.profile_public_details which has no RLS (CARNAGE confirmed: no RLS policies exist on this table). A confirmed-authenticated caller who calls the DAL directly can silently hide or expose any VPORT in TRAZE directory pages, QR landing pages, and business cards. (2) The secondary check uses .maybeSingle() — if the attacker's session has a valid JWT and owner_user_id is NULL on any profile row, the check passes and the UPDATE fires unscoped.
- Evidence:
    // vports.write.dal.js lines 102–114
    const { data: owned, error: ownerError } = await vportSchema
      .from("profiles")
      .select("id")
      .eq("id", vportId)
      .eq("owner_user_id", userId)
      .maybeSingle();
    if (ownerError) throw ownerError;
    if (!owned) throw new Error("VPORT not found or not owned by you");

    const { error } = await vportSchema
      .from("profile_public_details")
      .update({ directory_visible: Boolean(visible) })
      .eq("profile_id", vportId);   // ← UPDATE with no RLS backing
- Reproduction Steps:
    1. Authenticate as any valid user
    2. Import syncDirectoryVisibleToPublicDetailsDAL directly
    3. Supply any vportId owned by the attacker (to pass the ownership pre-check)
    4. The UPDATE fires and modifies directory_visible on profile_public_details for that vportId
    5. If profile_public_details has no RLS (CARNAGE confirmed), the UPDATE is accepted regardless of any other ownership assertion
    (Note: VENOM-SETTINGS-002 migration not yet applied — table currently unprotected at DB layer)
- Existing Defense:     Secondary ownership pre-check (lines 102–109) blocks random vportId attacks; controller-layer assertActorOwnsVportActorController blocks the upstream caller
- Why Defense Is Insufficient: DAL is importable directly. The target table (profile_public_details) has no RLS per CARNAGE audit. Secondary check uses owner_user_id (legacy field), not actor_owners. Fix requires CARNAGE migration (VENOM-SETTINGS-002) and optionally replacing the secondary check with an actor_owners-based verification.
- Recommended Fix:    (1) Apply CARNAGE migration vport_profile_public_details_write_rls (VENOM-SETTINGS-002 action). (2) Optionally: replace the owner_user_id pre-check with an actor_owners-based check to align with the §1.4 Owner Meaning Rule.
- Suggested Patch:    Apply CARNAGE migration from zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-27_carnage_team-settings-rls-audit.md (VENOM-SETTINGS-002 block). No code change to DAL required once RLS is in place.
- Follow-up Command:  CARNAGE — migration vport_profile_public_details_write_rls must be applied before this finding can be downgraded
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-28-004
- Title:              dalSetActorPrivacy — no auth.getUser() binding; actorId accepted from caller without any session anchor
- Category:           Missing Session Binding at DAL Layer
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/settings/privacy/dal/visibility.dal.js : lines 41–57
- Source:             `actorId` parameter — supplied by controller caller
- Sink:               `supabase.schema('vc').from('actor_privacy_settings').upsert({ actor_id: actorId, ... })` — no session binding
- Trust Boundary:     DAL layer — no auth.getUser() call; no userId-to-actorId cross-reference
- Impact:             The DAL calls supabase directly with a caller-supplied actorId. There is no `auth.getUser()` call in dalSetActorPrivacy (contrast with setVportDirectoryVisibleDAL which calls auth.getUser() and binds owner_user_id). The Supabase client sends the authenticated JWT which RLS can evaluate — but if vc.actor_privacy_settings has no or weak RLS, any authenticated session can upsert any actorId. The combined impact with ELEK-2026-05-28-002 is that the controller accepts a spoofed actorId AND the DAL has no independent session anchor to catch it.
- Evidence:
    // visibility.dal.js dalSetActorPrivacy — full function (lines 41–57)
    export async function dalSetActorPrivacy(actorId, isPrivate) {
      if (!actorId) throw new Error('Missing actorId')
      const { error } = await supabase
        .schema ('vc')
        .from('actor_privacy_settings')
        .upsert(
          { actor_id: actorId, is_private: isPrivate, updated_at: new Date().toISOString() },
          { onConflict: 'actor_id' }
        )
      if (error) throw error
      return true
    }
    // No auth.getUser() anywhere in function. actorId is trusted directly.

    // Compare: setVportDirectoryVisibleDAL (vports.write.dal.js lines 63–83)
    const { data: auth, error: authError } = await supabase.auth.getUser();  // ← present
    const userId = auth?.user?.id;
    if (!userId) throw new Error("Not authenticated");
- Reproduction Steps:
    1. Authenticate as user A (owns actor-A)
    2. Call dalSetActorPrivacy('<actor-B-id>', true) directly
    3. Observe: UPSERT fires without any session cross-reference in the DAL
    4. If RLS on actor_privacy_settings is absent or weak: actor B is forced private
- Existing Defense:     Supabase JWT is carried on the request; RLS may apply depending on policy status (not confirmed)
- Why Defense Is Insufficient: Defensive posture is entirely dependent on RLS policy status on vc.actor_privacy_settings which has not been audited (not confirmed by CARNAGE). Architecture rule requires DAL to perform auth.getUser() before any write. No session anchor = no independent DAL-layer defense.
- Recommended Fix:    Add auth.getUser() to dalSetActorPrivacy. Validate the returned userId. Add an actor_owners query to confirm the authenticated user owns the actorId before proceeding with the upsert.
- Suggested Patch:
    // visibility.dal.js — dalSetActorPrivacy with session anchor

    export async function dalSetActorPrivacy(actorId, isPrivate) {
      if (!actorId) throw new Error('Missing actorId')

      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      const userId = authData?.user?.id
      if (!userId) throw new Error('dalSetActorPrivacy: not authenticated')

      // actor_owners check — confirms the authenticated user owns this actor
      const { data: ownerLink, error: ownerError } = await supabase
        .schema('vc')
        .from('actor_owners')
        .select('actor_id')
        .eq('actor_id', actorId)
        .eq('user_id', userId)
        .maybeSingle()
      if (ownerError) throw ownerError
      if (!ownerLink) throw new Error('dalSetActorPrivacy: actor not owned by authenticated user')

      const { error } = await supabase
        .schema('vc')
        .from('actor_privacy_settings')
        .upsert(
          { actor_id: actorId, is_private: isPrivate, updated_at: new Date().toISOString() },
          { onConflict: 'actor_id' }
        )
      if (error) throw error
      return true
    }
- Follow-up Command:  DB — confirm RLS status on vc.actor_privacy_settings; CARNAGE if migration required
```

---

## Low Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-28-005
- Title:              dalDeleteOwnedVportById — deprecated DAL still exported and live in bundle; uses legacy owner_user_id model; omits cascade logic
- Category:           Dead Code / Unsafe Fallback Export
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/settings/account/dal/account.write.dal.js : lines 93–105
- Source:             `vportId` and `userId` parameters — caller-supplied
- Sink:               `vportSchema.from('profiles').update({ is_deleted: true }).eq('id', vportId).eq('owner_user_id', userId)` — direct table mutation
- Trust Boundary:     Export boundary — function is exported from file; no audit trail, no cascade
- Impact:             The function is marked "deprecated" in a code comment but remains exported from account.write.dal.js and confirmed live in the diagnostics bundle (settingsAccountFeature.group.js line 14, 108). Any caller with access to this import can delete a VPORT using only vportId + userId without triggering: (1) actor-chain cascade logic (deleted_at not set), (2) booking cancellation, (3) actor soft-delete state machine, (4) push subscription cleanup. The write uses legacy owner_user_id (violates §1.4 Owner Meaning Rule), bypassing actor_owners entirely. Replacement functions (dalDeleteMyVport/dalHardDeleteVport) use SECURITY DEFINER RPCs with proper cascade chains.
- Evidence:
    // account.write.dal.js lines 92–105
    // Deprecated — use dalDeleteMyVport (RPC) instead.
    // Kept for backward compatibility; does not set deleted_at or fire actor chain logic.
    export async function dalDeleteOwnedVportById({ vportId, userId }) {
      if (!vportId) throw new Error('dalDeleteOwnedVportById: vportId required')
      if (!userId) throw new Error('dalDeleteOwnedVportById: userId required')
      const { error } = await vportSchema
        .from('profiles')
        .update({ is_deleted: true })
        .eq('id', vportId)
        .eq('owner_user_id', userId)
      if (error) throw error
    }
- Reproduction Steps:
    1. Import dalDeleteOwnedVportById directly
    2. Call with valid { vportId, userId } for any owned VPORT
    3. Observe: is_deleted set without deleted_at, without actor cascade, without booking cancellation
    4. VPORT appears deleted in the UI but actor, bookings, and related data remain inconsistently live
- Existing Defense:     Code comment warning; no compile-time enforcement
- Why Defense Is Insufficient: Exported symbol = callable at runtime. Comment provides no enforcement. Diagnostics group imports the symbol, confirming it is in the live bundle.
- Recommended Fix:    Remove the export. If backward compatibility is required, throw an Error inside the function body: "dalDeleteOwnedVportById is deprecated — use dalDeleteMyVport". Remove from settingsAccountFeature.group.js diagnostics imports.
- Suggested Patch:
    // account.write.dal.js — replace export with error-throw stub
    /** @deprecated Use dalDeleteMyVport instead. */
    export async function dalDeleteOwnedVportById({ vportId, userId }) {
      throw new Error('dalDeleteOwnedVportById is deprecated and must not be called. Use dalDeleteMyVport (RPC) instead.')
    }
- Follow-up Command:  SPIDER-MAN — confirm no test or hook calls dalDeleteOwnedVportById after stub is in place
```

---

## Info Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-28-006
- Title:              readActorOwnersByUserDAL — userId accepted from controller caller without server-session binding in DAL
- Category:           Defense-in-Depth Gap (INFO — exploitation requires auth layer failure)
- Severity:           INFO
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/settings/vports/dal/actorOwners.read.dal.js : lines 3–18
- Source:             `userId` parameter from ctrlGetProfileActorId controller
- Sink:               `supabase.schema('vc').from('actor_owners').select(...).eq('user_id', userId)`
- Trust Boundary:     DAL layer — no auth.getUser() binding; userId is trusted from caller
- Impact:             INFO only — the SELECT is read-only and the returned data (actor kind + id) is not personally sensitive. However, the DAL reads actor_owners for any userId the caller supplies without binding to the current authenticated session. If the Supabase anon key is exposed (currently a finding in tripoint/external-site) and the RLS policy on actor_owners permits SELECT for authenticated, any session could enumerate another user's actor list by supplying their userId. No direct exploit path on this surface alone.
- Evidence:
    // actorOwners.read.dal.js lines 3–18
    export async function readActorOwnersByUserDAL({ userId }) {
      if (!userId) return []
      const { data, error } = await supabase
        .schema("vc")
        .from("actor_owners")
        .select(`actor:actors (id, kind)`)
        .eq("user_id", userId)
      if (error) throw error
      return Array.isArray(data) ? data : []
    }
    // No auth.getUser() — userId trusted from caller
- Existing Defense:     RLS on vc.actor_owners (status not audited but assumed present); Supabase JWT required
- Why Defense Is Insufficient: Hygiene gap — DAL should bind to auth.uid() and assert userId matches session, consistent with other DALs in this feature. Not exploitable in isolation given required auth.
- Recommended Fix:    Add auth.getUser() and assert userId === session.user.id before executing the query.
- Suggested Patch:    Add: const { data: authData } = await supabase.auth.getUser(); const sessionUserId = authData?.user?.id; if (!sessionUserId || sessionUserId !== userId) throw new Error('readActorOwnersByUserDAL: session mismatch')
- Follow-up Command:  DB — confirm RLS SELECT policy on vc.actor_owners
```

---

## False Positives Rejected

| Candidate | Reason Rejected |
|---|---|
| VENOM-SETTINGS-004 (`listMyVportsDAL` legacy owner_user_id) | Finding already open and assigned (VENOM-SETTINGS-004). Full chain confirmed but out of scope for new ELEKTRA numbering — tracked in settings/findings.md. |
| `ctrlGetAuthedUserId` trust boundary | readAuthedUserDAL calls supabase.auth.getUser() — server-session bound. No caller-supplied ID. Chain does not cross a trust boundary. Rejected. |

---

## Suggested Patch Queue

| Finding ID | File | Type | Patch Complexity | Prerequisite |
|---|---|---|---|---|
| ELEK-2026-05-28-001 | vportBusinessCard.controller.js | Add assertActorOwnsVportActorController + callerActorId/vportActorId params | LOW — 8-line change + hook caller update | None |
| ELEK-2026-05-28-002 | actorPrivacy.controller.js | Add callerActorId ownership gate | LOW — 5-line change + hook caller update | None |
| ELEK-2026-05-28-004 | visibility.dal.js (dalSetActorPrivacy) | Add auth.getUser() + actor_owners ownership check | MEDIUM — 15-line addition | DB confirm RLS on vc.actor_privacy_settings |
| ELEK-2026-05-28-005 | account.write.dal.js (dalDeleteOwnedVportById) | Replace export with error-throw stub | LOW — replace 10 lines with 2 | None |

---

## Required Follow-up Commands

| Command | Reason |
|---|---|
| SPIDER-MAN | Regression tests for ELEK-001 (ownership gate on business card publish), ELEK-002 (foreign actorId rejected on privacy toggle), ELEK-005 (deprecated DAL stub confirmed uncallable) |
| CARNAGE | VENOM-SETTINGS-002 migration (vport_profile_public_details_write_rls) — blocks ELEK-003 resolution |
| DB | Confirm RLS status on vc.actor_privacy_settings (feeds ELEK-002/004 risk level) |
| DB | Confirm RLS status on vc.actor_owners SELECT policy (feeds ELEK-006 risk level) |
