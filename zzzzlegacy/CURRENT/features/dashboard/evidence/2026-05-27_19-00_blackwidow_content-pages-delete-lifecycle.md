# BLACKWIDOW Adversarial Simulation Report
# Modules: content-pages + delete-lifecycle

**Date:** 2026-05-27
**Reviewer:** BLACKWIDOW — Ethical Red Team
**Trigger:** VENOM BLOCKED on both modules (3H each). Adversarial stress-test of unresolved HIGH findings.
**Mode:** READ-ONLY adversarial simulation. No source code modified.
**Prior VENOM Reports:**
- `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_18-30_venom_content-pages.md`
- `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_18-30_venom_delete-lifecycle.md`

---

## MODULE 1 — CONTENT-PAGES

### Source Files Examined

| File | Role |
|---|---|
| `dal/content/updateVportContentPage.dal.js` | Open patch passthrough |
| `dal/content/toggleVportContentPagePublish.dal.js` | TOCTOU toggle — no actor_id WHERE |
| `dal/content/listVportPublicContentPages.dal.js` | actor_id in PUBLIC_SELECT |
| `dal/content/readVportPublicContentPage.dal.js` | actor_id in PUBLIC_FULL_SELECT |
| `dal/content/deleteVportContentPage.dal.js` | Hard DELETE — no soft-delete |
| `dal/content/createVportContentPage.dal.js` | Inspected for ownership gate |
| `controller/content/updateVportContentPage.controller.js` | Allowlist at controller layer only |
| `controller/content/toggleVportContentPagePublish.controller.js` | Pre-flight read, then toggle |
| `controller/content/createVportContentPage.controller.js` | assertActorOwnsVportActorController present |
| `controller/content/deleteVportContentPage.controller.js` | Hard delete passthrough |

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-CONTENT-001
- Governance Status Update: MITIGATED — 2026-05-28 (branch: vport-booking-feed-security-updates)
- Patch Cross-Reference: ELEK-2026-05-27-001
- Mitigation Summary:
    ALLOWED_UPDATE_FIELDS = {title, excerpt, body, category, service_keys} added to
    updateVportContentPageDAL. Patch stripped before .update(). actorId param added;
    .eq("actor_id", actorId) in WHERE clause. Controller passes actorId. DAL throws on
    0-row result. Privilege escalation path via DAL bypass closed.
- Pending Re-Test: BLACKWIDOW re-test required to confirm bypass is closed (HARDENED status requires re-run)
- Scenario: Open Patch Passthrough — Simulate updateVportContentPageDAL called with privileged patch fields
- Target: dal/content/updateVportContentPage.dal.js : updateVportContentPageDAL
- Application Scope: VCSM
- Platform Surface: Supabase Table — vport.content_pages (UPDATE)
- Attack Vector:
  Attacker is authenticated as the legitimate VPORT owner. They import updateVportContentPageDAL
  directly (bypassing updateVportContentPageController) and call:
    updateVportContentPageDAL({ id: '<page-uuid>', patch: { is_published: true, actor_id: '<other_actor_uuid>', profile_id: '<other_profile_uuid>' } })
  The DAL code is confirmed:
    .update(patch).eq("id", id)
  No field stripping occurs. The patch object is passed directly into Supabase .update().
- Exploit Chain Type: Insider / developer bypass — DAL imports directly, skipping controller allowlist
- Governance Status: DRAFT
- Result: BYPASSED
- Evidence:
  Line 16: `.update(patch)` — no ALLOWED_FIELDS stripping before this call.
  The controller (updateVportContentPage.controller.js lines 31-54) builds a safe patch from an explicit
  set of fields (title, excerpt, body, category, service_keys). This allowlist is ONLY at the controller.
  The DAL has zero field validation. Confirmed: patch is passed through in its entirety.

  Attack outcome (simulated):
  (a) `is_published: true` — escalates a draft to published without going through toggleVportContentPagePublish,
      which means invalidateVportPublicContentCache is NOT called. The cache becomes stale and continues
      serving the old list (draft excluded) for up to 5 minutes. The DB row IS updated.
  (b) `actor_id: <other_actor_uuid>` — reassigns the content page to a different actor. If RLS
      (content_pages_update_owner using actor_can_manage_profile()) checks only that the caller can manage
      the CURRENT row's profile_id, and the row's profile_id has not yet changed, the write may succeed.
      After the UPDATE, the page now belongs to the other actor. This is the most severe sub-vector.
  (c) `is_indexable: true` — flips indexability without any controller constraint. Low immediate harm,
      but bypasses intent.

  RLS mitigation assessment: The modern content_pages_update_owner policy uses actor_can_manage_profile().
  This is a row-level gate, not a column-level gate. It confirms the session actor can manage the row's
  profile_id, but it does NOT prevent updating actor_id or profile_id to different values. RLS provides
  no field-level protection.
- Defense Gate: ABSENT (at DAL layer) / PRESENT (at controller layer only)
- Blast Radius: Single actor (own pages only — RLS gates the row to the caller's profile). Sub-vector (b)
  could move a page to a different actor_id within the same write, creating orphaned/stolen content.
- Severity: HIGH
- VENOM Finding Cross-Reference: CONTENT-002
- Recommended Fix: Add ALLOWED_UPDATE_FIELDS constant to updateVportContentPageDAL. Strip any key from patch
  that is not in the allowlist before calling .update(). Raise an error on any attempt to set is_published,
  is_indexable, actor_id, profile_id, slug, or id via this DAL. The DAL must be independently safe.
- Layer to Fix: DAL — updateVportContentPage.dal.js
- Required Follow-up Command: ELEKTRA (patch the DAL field stripping)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-CONTENT-002
- Governance Status Update: MITIGATED — 2026-05-28 (branch: vport-booking-feed-security-updates)
- Patch Cross-Reference: ELEK-2026-05-27-002
- Mitigation Summary:
    actor_id and profile_id removed from PUBLIC_SELECT (listVportPublicContentPages.dal.js)
    and PUBLIC_FULL_SELECT (readVportPublicContentPage.dal.js). Fields no longer fetched
    from DB on any public read. VportContentPageModel.fromPublicRow() and fromPublicRows()
    added — these methods omit actorId/profileId entirely. Public controllers updated to
    call fromPublicRow()/fromPublicRows(). TTL cache now stores safe rows only. Grep
    confirmed: no component reads actorId or profileId from a content page object.
- Pending Re-Test: BLACKWIDOW re-test required to confirm UUID no longer reachable in network
    response or React tree (HARDENED status requires re-run).
- Scenario: Actor ID in Public Read — Confirm actor_id and profile_id appear in unauthenticated API response
- Target: dal/content/listVportPublicContentPages.dal.js (PUBLIC_SELECT) + dal/content/readVportPublicContentPage.dal.js (PUBLIC_FULL_SELECT)
- Application Scope: VCSM
- Platform Surface: PWA — public content cards and viewer modal (no auth required)
- Attack Vector:
  Any unauthenticated visitor navigates to a VPORT public profile. The public content list is fetched.
  Attacker opens browser DevTools → Network tab → inspects the Supabase query response payload.
  No credentials required. No rate limiting on public reads.
- Exploit Chain Type: Passive enumeration — no authentication required
- Governance Status: DRAFT
- Result: BYPASSED
- Evidence:
  listVportPublicContentPages.dal.js line 8:
    PUBLIC_SELECT = "id,actor_id,profile_id,title,slug,excerpt,category,service_keys,published_at,created_at"
  readVportPublicContentPage.dal.js line 7:
    PUBLIC_FULL_SELECT = "id,actor_id,profile_id,title,slug,excerpt,body,category,service_keys,published_at,created_at"

  Both DALs explicitly select actor_id and profile_id. These fields are:
  (a) Returned in every Supabase wire response for public reads.
  (b) Stored in the 5-minute TTL in-memory cache (publicContentCache).
  (c) Propagated to the model object (actorId, profileId) and into the React component tree.
  (d) Accessible via browser DevTools → React tree inspection or Network → response JSON.

  actor_id is the canonical VCSM identity key for booking, reviews, and messaging.
  Exposure allows:
  1. Enumeration of all VPORT actor_ids from public content pages with zero auth.
  2. Direct Supabase API probing using the enumerated actor_id (e.g., querying bookings endpoint by actor_id).
  3. Correlation of actor identities across multiple VPORTs where the same actor appears.

  The 5-minute cache means once a single visitor loads the page, the leaked UUIDs are cached
  and served to all subsequent visitors in the same browser process until TTL expires.
- Defense Gate: ABSENT — no field stripping at DAL, model, controller, or hook layer
- Blast Radius: Multi-actor — every VPORT with published content pages exposes its actor_id to the public
  internet via passive observation.
- Severity: HIGH
- VENOM Finding Cross-Reference: CONTENT-003
- Recommended Fix: Remove actor_id and profile_id from PUBLIC_SELECT and PUBLIC_FULL_SELECT. Add a
  public-safe fromRow() variant in VportContentPageModel that omits actorId and profileId. Use this
  variant exclusively in listVportPublicContentPagesController and readVportPublicContentPageController.
- Layer to Fix: DAL (remove from SELECT string) + Model (add public-safe fromRow variant)
- Required Follow-up Command: ELEKTRA (patch public SELECT strings and model variant)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-CONTENT-003
- Scenario: Toggle-Publish TOCTOU — Race condition between pre-flight ownership check and toggle write
- Target: controller/content/toggleVportContentPagePublish.controller.js + dal/content/toggleVportContentPagePublish.dal.js
- Application Scope: VCSM
- Platform Surface: Supabase Table — vport.content_pages (UPDATE)
- Attack Vector:
  This is a Time-Of-Check / Time-Of-Use race. The attack sequence:
  Step 1 — Controller calls readVportContentPageDAL({ id }) → existing.actor_id === actorId → PASS
  Step 2 — [Concurrent: admin or platform event transfers content page actor_id to a different actor]
  Step 3 — Controller calls toggleVportContentPagePublishDAL({ id, isPublished })
  Step 4 — DAL executes: .update(patch).eq("id", id)
             WHERE clause is: id = ? ONLY — no AND actor_id = actorId
  Result: The toggle executes on a row the caller no longer owns at write time.
- Exploit Chain Type: TOCTOU race condition — narrow window, platform-level precondition required
- Governance Status: DRAFT
- Result: PARTIAL
- Evidence:
  toggleVportContentPagePublish.dal.js lines 19-24:
    .update(patch)
    .eq("id", id)
  No .eq("actor_id", actorId) in the WHERE clause.

  Controller lines 19-23:
    const existing = await readVportContentPageDAL({ id })
    if (!existing) throw new Error("Content page not found.")
    if (existing.actor_id !== actorId) throw new Error("Not allowed to modify this content page.")
    const updated = await toggleVportContentPagePublishDAL({ id, isPublished })
  The check and write are two separate DB round trips with no transaction.

  The gap is structurally confirmed. The practical exploitability is LOW:
  - Content page ownership transfer between two actors is not a platform-exposed operation (no
    bulk reassign endpoint found). The race window is small (~tens of milliseconds).
  - RLS (content_pages_update_owner via actor_can_manage_profile()) provides partial mitigation —
    if the session actor can no longer manage the new profile_id, the update will be rejected by RLS.
    However: if the former owner's stale RLS policy (VENOM-CONTENT-004, legacy owner_user_id) is still
    active, even the RLS gate may admit the former owner's write. This is a compound finding with CONTENT-004.
  - Without the stale RLS compounding factor, the TOCTOU is theoretical. With it, the window becomes
    real: a former owner who still passes the legacy RLS policy can toggle-publish any content page
    that belonged to their former VPORT, because the DAL WHERE clause has no actor_id guard.
- Defense Gate: WEAK (controller pre-flight check present, but no DB-layer actor_id guard in WHERE)
- Blast Radius: Single content page. Compounded to former-owner scope when combined with CONTENT-004
  stale RLS finding.
- Severity: MEDIUM (standalone) / HIGH (compounded with CONTENT-004 stale RLS — a former VPORT owner
  can leverage both gaps simultaneously)
- VENOM Finding Cross-Reference: CONTENT-006 (TOCTOU) + CONTENT-004 (stale RLS — compound vector)
- Recommended Fix: Add .eq("actor_id", actorId) to toggleVportContentPagePublishDAL WHERE clause. Pass
  actorId from the controller to the DAL. This eliminates the TOCTOU window independently of RLS. Also
  apply the same fix to updateVportContentPageDAL. Compound vector neutralized when CARNAGE executes
  the stale RLS policy drop (CONTENT-004).
- Layer to Fix: DAL (toggleVportContentPagePublish.dal.js + updateVportContentPage.dal.js) + Controller
  (pass actorId to DAL)
- Required Follow-up Command: ELEKTRA (DAL WHERE hardening) + DB + Carnage (CONTENT-004 RLS migration)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-CONTENT-004
- Scenario: Stale RLS OR-merge — Can a former VPORT owner still access content pages after ownership transfer?
- Target: vport.content_pages RLS policies — dual PERMISSIVE policy set (legacy + modern)
- Application Scope: VCSM
- Platform Surface: Supabase Table — vport.content_pages (ALL operations)
- Attack Vector:
  Precondition: Actor A previously owned VPORT-X. Ownership was transferred to Actor B.
  Actor A's user_id is still stored in profiles.owner_user_id (stale column — not updated on transfer).
  Attack sequence:
  1. Actor A retains their Supabase JWT.
  2. Actor A calls the Supabase REST API directly (PostgREST) or via Supabase client:
       GET /rest/v1/content_pages?profile_id=eq.<VPORT-X-profile-id>
     Authorization: Bearer <Actor-A-JWT>
  3. The request reaches the RLS layer. Two PERMISSIVE policies are evaluated with OR-merge:
     - Modern: content_pages_select_owner → actor_can_manage_profile(current_actor_id(), profile_id)
       → FAILS (Actor A no longer owns VPORT-X in actor_owners)
     - Legacy: content_pages_owner_read → profiles.owner_user_id = auth.uid()
       → PASSES (stale column still has Actor A's user_id)
  4. PERMISSIVE OR-merge: ANY passing policy grants access. Legacy policy passes → rows returned.
  5. Actor A reads ALL content pages including unpublished drafts.
  6. Actor A can similarly write, update, delete using the legacy INSERT/UPDATE/DELETE policies.
- Exploit Chain Type: Stale-ownership bypass — DB-layer grants access that application layer denies
- Governance Status: DRAFT
- Result: BYPASSED (structural — cannot execute live DB test, but the policy OR-merge mechanism is
  confirmed by VENOM/CARNAGE reports and the code audit confirms zero defense at DAL/controller
  against a direct Supabase API call that bypasses the app controller layer entirely)
- Evidence:
  VENOM-CONTENT-004 confirms: "Legacy policies (content_pages_owner_read, content_pages_owner_insert,
  content_pages_owner_update, content_pages_owner_delete) use profiles.owner_user_id = auth.uid() —
  a stale-ownership column. Modern policies (content_pages_select_owner, etc.) use actor_can_manage_profile.
  Because Supabase PERMISSIVE policies OR-merge, any user who satisfies EITHER condition is granted access."

  CARNAGE migration 2026-05-14_carnage_content-pages-legacy-policy-cleanup.md documents the dual-policy
  state as confirmed present in the live DB. The migration has NOT been executed.

  The application controller layer (assertActorOwnsVportActorController) correctly denies former owners.
  But this gate only exists in the app code path. A direct Supabase API call with a valid JWT bypasses
  every controller and lands on RLS alone — where the former owner is still admitted via the legacy policy.

  Attack does NOT require any exploit tooling — the Supabase JS client or a simple curl with the JWT is
  sufficient. The JWT remains valid as long as the former owner's Supabase Auth account exists.
- Defense Gate: ABSENT (at DB layer — legacy policy still live; application controller gate bypassed by
  direct API call)
- Blast Radius: Platform-wide — any VPORT that has undergone an ownership transfer is affected. Every
  content page (including drafts) for those VPORTs is readable/writable by the former owner.
- Severity: HIGH
- VENOM Finding Cross-Reference: CONTENT-004
- Recommended Fix: Execute CARNAGE migration plan (2026-05-14_carnage_content-pages-legacy-policy-cleanup.md).
  Drop the 4 legacy policies (content_pages_owner_read, content_pages_owner_insert,
  content_pages_owner_update, content_pages_owner_delete) after pre-flight validation.
  This is the only fix — there is no application-layer defense against a direct PostgREST call
  that bypasses the controller.
- Layer to Fix: DB (RLS migration — CARNAGE + THOR gate required)
- Required Follow-up Command: DB (pre-flight queries) + Carnage (migration execution) + THOR (release gate)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-CONTENT-005
- Scenario: Ownership Bypass — Can Actor B call createVportContentPage or deleteVportContentPage with Actor A's actorId?
- Target: controller/content/createVportContentPage.controller.js + controller/content/deleteVportContentPage.controller.js
- Application Scope: VCSM
- Platform Surface: PWA — VPORT content page management write path
- Attack Vector:
  Actor B is authenticated with their own session. They attempt to create or delete a content page
  belonging to Actor A by supplying actorId=<Actor-A-uuid> while callerActorId derives from their session.
  Attack via the hook layer: Actor B modifies the React state or intercepts the hook call to pass
  actorId=<Actor-A-uuid> with their own callerActorId.
- Exploit Chain Type: Cross-actor identity substitution via client-supplied actorId parameter
- Governance Status: DRAFT
- Result: BLOCKED
- Evidence:
  createVportContentPage.controller.js line 46:
    await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })

  deleteVportContentPage.controller.js line 12:
    await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })

  The assertActorOwnsVportActorController function queries actor_owners to verify that the requestActorId
  (session-derived callerActorId) is an authorized owner of the targetActorId. If Actor B's actorId
  is not in actor_owners for Actor A's VPORT, the assertion throws and the write is aborted.

  For deleteVportContentPage.controller.js additionally:
    const existing = await readVportContentPageDAL({ id })
    if (existing.actor_id !== actorId) throw new Error("Not allowed to delete this content page.")
  A secondary check ensures the page belongs to the actorId param before the delete DAL is called.

  The callerActorId comes from useIdentity() in the hook layer → identity.actorId, which is session-derived.
  Actor B cannot forge callerActorId at the hook layer to match Actor A's session without compromising
  Actor A's JWT.

  The defense is solid for the primary scenario. The residual risk is the stale RLS OR-merge (BW-CONTENT-004)
  — a former owner can bypass the entire controller path via direct Supabase API call.
- Defense Gate: PRESENT (assertActorOwnsVportActorController + secondary actor_id check on pre-flight read)
- Blast Radius: None — attack blocked at controller layer
- Severity: LOW (residual: stale RLS path from BW-CONTENT-004 remains open for direct API calls)
- VENOM Finding Cross-Reference: None (BLOCKED scenario — positive finding)
- Recommended Fix: No change needed for the controller path. Residual risk fully addressed by fixing
  BW-CONTENT-004 (CARNAGE RLS migration).
- Layer to Fix: No controller change needed. DB layer (stale RLS) — see BW-CONTENT-004.
- Required Follow-up Command: None for this finding. See BW-CONTENT-004 for residual path.
```

---

## MODULE 2 — DELETE-LIFECYCLE

### Source Files Examined

| File | Role |
|---|---|
| `features/settings/account/dal/account.write.dal.js` | Deprecated DAL still exported (dalDeleteOwnedVportById) |
| `features/settings/account/controller/account.controller.js` | ctrlHardDeleteVport — no ownership assertion |
| `features/settings/vports/hooks/useVportsController.js` | hardDeleteVport hook — no pre-check |
| `features/settings/vports/ui/VportsHardDeleteModal.jsx` | UI-only name-match gate |
| `supabase/functions/delete-citizen-account/index.ts` | CORS wildcard confirmed |

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-DELETE-001
- Scenario: Deprecated DAL Bypass — dalDeleteOwnedVportById called directly, bypassing RPC lifecycle
- Target: features/settings/account/dal/account.write.dal.js : dalDeleteOwnedVportById (line 94-105)
- Application Scope: VCSM
- Platform Surface: PWA — DAL layer (exported, present in live production bundle)
- Attack Vector:
  The function is marked deprecated in a comment but remains a live named export from account.write.dal.js.
  Any code that imports from this module (via import { dalDeleteOwnedVportById } from '...account.write.dal')
  can call it with valid { vportId, userId } parameters.

  Confirmed from source:
    export async function dalDeleteOwnedVportById({ vportId, userId }) {
      await vportSchema.from('profiles').update({ is_deleted: true }).eq('id', vportId).eq('owner_user_id', userId)
    }

  This issues a direct UPDATE to vport.profiles, bypassing the soft_delete_vport SECURITY DEFINER RPC.
  The resulting DB state:
    - is_deleted = true
    - deleted_at = NULL (RPC sets this; direct UPDATE does not)
    - is_active = unchanged (possibly still true)
    - vc.actors.is_void = unchanged (not touched — actor remains live in the social graph)
    - push subscriptions = not cleared
    - booking data = not affected

  The function IS imported by the dev diagnostics group (settingsAccountFeature.group.js) as confirmed
  by VENOM-DELETE-001, meaning it is present in the diagnostic bundle at minimum.

  The RLS on vport.profiles enforces `AND owner_user_id = userId` — so cross-user deletion is blocked.
  But the attacker (who is the legitimate owner) can use this to create an inconsistent partial-delete
  state that breaks admin tooling, orphan detection, and the hard-delete precondition check.

  Hard-delete precondition: The vport.hard_delete_vport RPC checks for is_deleted=true to confirm
  soft-delete has occurred. If dalDeleteOwnedVportById set is_deleted=true but deleted_at is NULL,
  the precondition check may pass (if it checks is_deleted, not deleted_at IS NOT NULL). This would
  allow hard delete to proceed on a VPORT that bypassed the full soft-delete lifecycle — with no
  deleted_at audit trail.
- Exploit Chain Type: Deprecated code path — direct DAL call bypasses SECURITY DEFINER lifecycle RPC
- Governance Status: DRAFT
- Result: BYPASSED (partial state — callable without RPC chain)
- Evidence:
  account.write.dal.js line 94: `export async function dalDeleteOwnedVportById` — confirmed exported.
  Line 101-103: `.update({ is_deleted: true }).eq('id', vportId).eq('owner_user_id', userId)` — no
  deleted_at, no actor void, no cascade. VENOM-DELETE-001 confirms dev diagnostics imports this function
  and hasDalDeleteOwnedVportById surface contract test verifies its presence.
- Defense Gate: ABSENT — no mechanism prevents a module from importing and calling this exported function
- Blast Radius: Single actor — scoped to the calling user's own VPORTs via owner_user_id RLS gate.
  Secondary blast: inconsistent DB state corrupts admin tooling and breaks audit trail for the affected VPORT.
- Severity: HIGH
- VENOM Finding Cross-Reference: DELETE-001
- Recommended Fix: Remove the `export` keyword from dalDeleteOwnedVportById. The function body can remain
  as a tombstone comment but must not be callable from any external module. Remove the import from the
  dev diagnostics group (settingsAccountFeature.group.js) and remove the hasDalDeleteOwnedVportById
  surface contract assertion.
- Layer to Fix: DAL (account.write.dal.js) — remove export keyword only. Diagnostics group — remove import.
- Required Follow-up Command: SPIDER-MAN (regression test asserting dalDeleteOwnedVportById is not exported)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-DELETE-002
- Scenario: Name-Match UI Bypass — Call hardDeleteVport(id) directly without modal confirmation
- Target: features/settings/vports/ui/VportsHardDeleteModal.jsx + features/settings/vports/hooks/useVportsController.js : hardDeleteVport
- Application Scope: VCSM
- Platform Surface: PWA — Hook layer (hardDeleteVport callable without UI gate)
- Attack Vector:
  The VportsHardDeleteModal renders a name-match text input. The `onConfirm` button is disabled
  unless `confirmText === target.name` (VportsHardDeleteModal.jsx line 59). This is a client-side
  boolean check in JSX: `disabled={busy || confirmText !== target.name}`.

  However, `hardDeleteVport` in useVportsController.js (line 93-106) is a plain async function
  returned from the hook. It accepts only `targetVportId` (a string) with one guard: `if (!targetVportId)`.
  There is no server-side confirmation token, no session challenge, and no confirmation state tracked
  server-side.

  Attack vectors:
  1. XSS: A cross-site scripting payload on any page that renders user-generated content in this session
     can call `hardDeleteVport('<vportId>')` directly via the hook — no modal required.
  2. Browser console (DevTools): Any developer with console access to the app (or a user who inspects the
     React tree and extracts the hook return value) can call hardDeleteVport directly. No modal, no
     name-match, no confirmation.
  3. Supply-chain compromise of the diagnostics bundle: Any code imported into the app can call
     the hook return value if it can access React context.

  The only server-side guard is the DB RPC's `WHERE owner_user_id = auth.uid()` clause — which prevents
  cross-user deletion but does not prevent the legitimate user's session from calling the function
  bypassing the UI safety net.
- Exploit Chain Type: UI confirmation bypass — modal is client-side state only; function is directly
  invocable by any code in the same JS context
- Governance Status: DRAFT
- Result: BYPASSED (UI gate only — no server-side confirmation enforcement)
- Evidence:
  VportsHardDeleteModal.jsx line 59: `disabled={busy || confirmText !== target.name}` — client-side only.
  useVportsController.js lines 93-106: hardDeleteVport takes targetVportId string, no confirmation state.
  account.controller.js lines 21-23: ctrlHardDeleteVport({ vportId }) → immediately calls dalHardDeleteVport.
  account.write.dal.js lines 75-90: dalHardDeleteVport calls vport.hard_delete_vport RPC — no server token.
  No server-side confirmation field in the RPC signature or the controller signature.
- Defense Gate: ABSENT at server side. PRESENT (name-match) at UI layer only.
- Blast Radius: Single actor — the XSS/console attacker can only delete VPORTs that the victim user
  owns (DB ownership check enforced). But the victim may own multiple VPORTs — all are accessible.
- Severity: MEDIUM (UI bypass within own session; cross-user deletion blocked at DB)
- VENOM Finding Cross-Reference: DELETE-006
- Recommended Fix:
  Short-term: Log hard delete attempts to a server-side audit table (actorId, vportId, timestamp,
  caller_user_id) before executing the RPC. This does not prevent the bypass but creates forensic trail.
  Medium-term: Add a server-side delete token — generate a one-time token server-side when the modal
  opens, require the token to be submitted with the RPC call, and expire it after 60 seconds. This
  makes the modal's name-match a prerequisite for obtaining the server token, not just a client boolean.
- Layer to Fix: DB (audit log table — Carnage) + Controller (token generation/validation)
- Required Follow-up Command: Carnage (audit log migration) + LOGAN (document server-side confirmation
  requirement for hard delete)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-DELETE-003
- Scenario: Cascade Gap — Can a customer create a booking against a soft-deleted VPORT's resource?
- Target: vport.resources (orphaned after soft-delete), vport.bookings pipeline
- Application Scope: VCSM
- Platform Surface: Booking engine — customer booking creation path
- Attack Vector:
  A VPORT is soft-deleted. The soft_delete_vport RPC sets vport.profiles.is_deleted=true and
  vc.actors.is_void=true. However, vport.resources rows (bookable resources: staff, rooms, equipment)
  for that VPORT's profile_id are NOT touched by the soft-delete or hard-delete chains (confirmed by
  VENOM-DELETE-003: Logan spec Section 9 explicitly acknowledges this gap).

  Attack scenario:
  1. Customer holds a cached resource_id from a prior booking or browsing session.
  2. Customer submits a booking creation request with resource_id=<orphaned-resource-uuid>.
  3. The booking controller checks the VPORT's availability and ownership, but if it queries
     vport.resources directly by resource_id without joining to vport.profiles WHERE is_deleted=false,
     the resource row is still present and the lookup succeeds.
  4. Booking INSERT proceeds against the deleted VPORT's resource.
  5. The orphaned booking now references a deleted VPORT — breaking booking integrity.

  Secondary scenario: Booking slot queries. If the booking availability engine queries
  vport.availability_rules or vport.availability_exceptions by profile_id without filtering is_deleted,
  slot data for the deleted VPORT is still returned.
- Exploit Chain Type: Cascade gap — orphaned rows accessible post-deletion via stale references
- Governance Status: DRAFT
- Result: PARTIAL
- Evidence:
  VENOM-DELETE-003 confirms: "vport.resources, vport.portfolio_items, vport.availability_exceptions,
  and vport.availability_rules are NOT covered by the 11-phase deletion chain."
  VENOM-DELETE-003 also notes: "The Logan spec explicitly acknowledges (Section 9, Risk 4)" this gap.

  The soft-delete path does set vc.actors.is_void=true. RLS policies on booking creation presumably
  check VPORT active status. However, without being able to inspect the live booking RLS policies
  or the booking controller's resource validation logic in this session, the exact defense posture
  is partially unverified.

  BLACKWIDOW assessment: The booking controller has been security-hardened (per governance matrix —
  booking module COMPLETE). The booking controller likely validates VPORT active status before
  permitting a new booking. However, the orphaned vport.resources rows represent a data integrity
  gap regardless: a hard-deleted VPORT's resources remain in the DB with profile_id pointing to
  a deleted profile row, creating confusion in admin tooling, potential FK join failures, and
  GDPR data residue.

  The cascade gap is confirmed. Full exploitability of the booking path requires deeper inspection
  of the booking controller's resource validation — deferred to the booking engine BLACKWIDOW log.
- Defense Gate: PARTIAL (vc.actors.is_void=true is set on soft-delete; booking controller likely
  checks VPORT status; but orphaned rows remain and create latent risk)
- Blast Radius: Multi-actor — orphaned booking resources could affect any customer who had active
  bookings or cached resource references for the deleted VPORT.
- Severity: HIGH (data integrity + GDPR residue + potential booking integrity failure)
- VENOM Finding Cross-Reference: DELETE-003
- Recommended Fix: Extend the hard_delete_vport RPC chain to cover:
  DELETE FROM vport.resources WHERE profile_id = p_vport_id (before bookings — FK ordering)
  DELETE FROM vport.portfolio_items WHERE profile_id = p_vport_id
  DELETE FROM vport.availability_exceptions WHERE profile_id = p_vport_id
  DELETE FROM vport.availability_rules WHERE profile_id = p_vport_id
  DELETE FROM notification.push_subscriptions WHERE actor_id = v_actor_id
  DB introspection required first to confirm FK ordering (Carnage + DB sprint).
- Layer to Fix: DB (RPC chain extension — Carnage migration)
- Required Follow-up Command: Carnage (extend deletion chain) + DB (verify FK ordering)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-DELETE-004
- Scenario: Ownership at Controller — Can Actor B hard-delete Actor A's VPORT via ctrlHardDeleteVport?
- Target: features/settings/account/controller/account.controller.js : ctrlHardDeleteVport
- Application Scope: VCSM
- Platform Surface: PWA — Controller / Hook layer
- Attack Vector:
  Actor B is authenticated with their own session. They call ctrlHardDeleteVport({ vportId: '<Actor-A-vportId>' }).
  No assertActorOwnsVportActorController is present in the controller. The only ownership gate is
  the DB RPC's `WHERE owner_user_id = auth.uid()`.

  Confirmed from source:
    export async function ctrlHardDeleteVport({ vportId }) {
      await dalHardDeleteVport(vportId)
    }
  Zero pre-flight. Zero ownership assertion at controller layer.

  The DB RPC enforces `WHERE owner_user_id = auth.uid()`. Actor B's auth.uid() will not match
  Actor A's owner_user_id. The RPC will return VPORT_NOT_FOUND_OR_NOT_DELETED and the DAL
  will throw "Vport must be soft-deleted before hard delete" (or equivalent).
- Exploit Chain Type: Cross-actor ownership bypass attempt — single-layer defense only
- Governance Status: DRAFT
- Result: BLOCKED (by DB RPC ownership gate)
- Evidence:
  account.controller.js lines 21-23: ctrlHardDeleteVport — no assertActorOwnsVportActorController.
  account.write.dal.js lines 75-90: dalHardDeleteVport calls vport.hard_delete_vport RPC, which
  enforces `WHERE owner_user_id = auth.uid()` at DB level.
  The error handling: `if (msg.includes('VPORT_NOT_FOUND_OR_NOT_DELETED')) throw new Error('Vport must be soft-deleted before hard delete')`
  — cross-actor deletion attempt returns an error, the operation does not proceed.

  HOWEVER: The defense is single-layer (DB only). Platform convention requires controller-layer
  ownership assertion as defense-in-depth for all destructive operations (booking, exchange, team
  management all use assertActorOwnsVportActorController at controller layer). The most destructive
  operation in the platform has the weakest controller-layer defense posture.

  Regression risk: If a future developer replaces the RPC call with a direct table operation
  (to work around a migration or test an alternative), the only ownership gate disappears.
- Defense Gate: PRESENT (DB layer) / ABSENT (controller layer — defense-in-depth gap)
- Blast Radius: None — attack blocked at DB. Residual: single-layer defense creates regression fragility.
- Severity: MEDIUM (defense-in-depth gap — not a current exploit, but a structural posture failure)
- VENOM Finding Cross-Reference: DELETE-005
- Recommended Fix: Add assertActorOwnsVportActorController at the controller layer:
    export async function ctrlHardDeleteVport({ vportId, callerActorId }) {
      const actorId = await dalReadVportActorIdByVportId(vportId)
      await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })
      await dalHardDeleteVport(vportId)
    }
  callerActorId passed from hook (identity.actorId — session-derived).
- Layer to Fix: Controller (account.controller.js) + Hook (useVportsController.js — pass callerActorId)
- Required Follow-up Command: Wolverine (implementation) + SPIDER-MAN (regression test)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-DELETE-005
- Scenario: Edge Function Auth — Can external domain call delete-citizen-account? Does it require valid JWT?
- Target: supabase/functions/delete-citizen-account/index.ts
- Application Scope: VCSM
- Platform Surface: Edge Function (destructive — citizen full account deletion)
- Attack Vector:
  CORS wildcard test: External origin `https://evil.attacker.com` sends:
    OPTIONS /functions/v1/delete-citizen-account
    Origin: https://evil.attacker.com
  The function returns: `Access-Control-Allow-Origin: *`
  This tells the browser that cross-origin requests are permitted from any origin.

  Unauthenticated POST test: External attacker sends:
    POST /functions/v1/delete-citizen-account
    (no Authorization header)
  The function (line 45-47):
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401)
    }
  Returns 401. Unauthenticated calls are blocked.

  JWT-required test: Attacker sends:
    POST /functions/v1/delete-citizen-account
    Authorization: Bearer <stolen-victim-JWT>
  The function (lines 61-64):
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) { return json({ error: "Unauthorized" }, 401) }
  Verifies the JWT via Supabase auth.getUser(). If the JWT is valid and not expired,
  this passes. The function then deletes the JWT owner's account.

  The wildcard CORS origin has two concrete consequences:
  1. Any website can make a preflight request and discover the endpoint exists and accepts
     Authorization + content-type headers. This is endpoint reconnaissance with no auth needed.
  2. If an attacker can perform XSS on the VCSM app (or any site the victim visits while
     sharing the same browser storage for the Supabase JWT), the XSS payload can read the
     Supabase session token from localStorage and make a cross-origin POST to this endpoint.
     The CORS * header means the browser will not block the cross-origin read of the response.
- Exploit Chain Type: CORS wildcard + JWT theft via XSS → cross-origin account deletion
- Governance Status: DRAFT
- Result: BLOCKED (JWT required — unauthenticated calls blocked) / PARTIAL (CORS wildcard enables
  XSS-assisted token exfiltration → cross-origin delete)
- Evidence:
  index.ts line 23: `"Access-Control-Allow-Origin": "*"` — confirmed wildcard.
  index.ts lines 45-47: Authorization header check — unauthenticated calls return 401.
  index.ts lines 61-64: JWT verified via auth.getUser(). Identity derived from JWT only — no
  userId accepted from request body (line 82: soft_delete_citizen_account via user-scoped client,
  auth.uid() enforced — correct). Service role key never in response.

  The function IS correctly designed for JWT-anchored identity. The wildcard CORS is the sole
  hardening gap. Under normal operation (no XSS), it is not exploitable. Under XSS, the wildcard
  CORS removes the last browser-enforced defense.
- Defense Gate: PRESENT (JWT verification + identity-from-JWT only) / ABSENT (CORS origin restriction)
- Blast Radius: Single actor — the JWT owner's account. No cross-user deletion possible.
- Severity: LOW (JWT required; CORS wildcard is a hardening gap, not an active exploit path without
  prior XSS or token theft)
- VENOM Finding Cross-Reference: DELETE-007
- Recommended Fix: Replace `"Access-Control-Allow-Origin": "*"` with:
    `"Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "https://app.vibezcitizens.com"`
  Add APP_ORIGIN as a Supabase Edge Function secret. This eliminates the browser's willingness
  to make cross-origin requests from arbitrary domains to this endpoint.
- Layer to Fix: Edge Function (delete-citizen-account/index.ts CORS header)
- Required Follow-up Command: ELEKTRA (patch CORS header) + LOGAN (document CORS policy for all
  Edge Functions)
```

---

## ADVERSARIAL SIMULATION SUMMARY TABLE

### Content-Pages

| Finding ID | Scenario | VENOM Ref | Result | Severity | Defense Gate |
|---|---|---|---|---|---|
| BW-CONTENT-001 | Open patch passthrough — DAL accepts privileged fields | CONTENT-002 | BYPASSED → MITIGATED (2026-05-28) | HIGH | PATCHED — ELEK-2026-05-27-001 |
| BW-CONTENT-002 | actor_id in public read — confirmed in SELECT strings | CONTENT-003 | BYPASSED → MITIGATED (2026-05-28) | HIGH | PATCHED — ELEK-2026-05-27-002 |
| BW-CONTENT-003 | TOCTOU toggle-publish — no actor_id in WHERE | CONTENT-006 + CONTENT-004 | PARTIAL → MITIGATED (2026-05-28) | MEDIUM | PATCHED — ELEK-2026-05-27-003 |
| BW-CONTENT-004 | Stale RLS OR-merge — former owner bypasses app layer | CONTENT-004 | BYPASSED | HIGH | ABSENT at DB |
| BW-CONTENT-005 | Ownership bypass — Actor B targets Actor A's pages | None (positive) | BLOCKED | LOW | PRESENT |

### Delete-Lifecycle

| Finding ID | Scenario | VENOM Ref | Result | Severity | Defense Gate |
|---|---|---|---|---|---|
| BW-DELETE-001 | Deprecated DAL exported — bypass RPC lifecycle | DELETE-001 | BYPASSED → MITIGATED (2026-05-28) | HIGH | PATCHED — export removed; diagnostics import removed |
| BW-DELETE-002 | Name-match UI only — hardDeleteVport callable without modal | DELETE-006 | BYPASSED | MEDIUM | ABSENT at server — P2 sprint |
| BW-DELETE-003 | Cascade gap — orphaned resources post-delete | DELETE-003 | PARTIAL | HIGH | PARTIAL — CARNAGE migration required |
| BW-DELETE-004 | Ownership at controller — Actor B targets Actor A's VPORT | DELETE-005 | BLOCKED → MITIGATED (2026-05-28) | MEDIUM | PATCHED — assertActorOwnsVportActorController added to ctrlHardDeleteVport |
| BW-DELETE-005 | CORS wildcard on Edge Function + JWT auth | DELETE-007 | BLOCKED (JWT) / PARTIAL (CORS) | LOW | OPEN — P1 sprint |

---

## BLACKWIDOW GOVERNANCE VERDICTS

### content-pages

| Command | Prior Status | BW Verdict | Rationale |
|---|---|---|---|
| BLACKWIDOW | NOT_STARTED | BLOCKED | BW-CONTENT-001 (BYPASSED/HIGH), BW-CONTENT-002 (BYPASSED/HIGH), BW-CONTENT-004 (BYPASSED/HIGH) — three HIGH findings confirmed exploitable through adversarial simulation. Module cannot advance until CARNAGE migration (CONTENT-004) and ELEKTRA patches (CONTENT-002, CONTENT-003) are applied. |

**Status Update — 2026-05-28:**

| Finding | Prior Status | Current Status | Blocker Remaining |
|---|---|---|---|
| BW-CONTENT-001 | BYPASSED | MITIGATED | Re-test required → HARDENED |
| BW-CONTENT-002 | BYPASSED | MITIGATED | Re-test required → HARDENED |
| BW-CONTENT-003 | PARTIAL | MITIGATED | Patched 2026-05-28 — .eq("actor_id", actorId) added to toggle and update DAL WHERE clauses (ELEK-003). Re-test required → HARDENED |
| BW-CONTENT-004 | BYPASSED | OPEN — DB BLOCKED | CARNAGE migration `2026-05-14_carnage_content-pages-legacy-policy-cleanup.md` not yet executed. Legacy RLS policies still live. This is the sole remaining BLOCKED item for the content-pages module. |
| BW-CONTENT-005 | BLOCKED | BLOCKED (unchanged) | Depends on BW-CONTENT-004 RLS migration for residual path |

**Module gate: content-pages remains BLOCKED on BW-CONTENT-004 (DB migration) until CARNAGE executes the legacy policy drop + THOR approves.**

### delete-lifecycle

| Command | Prior Status | BW Verdict | Rationale |
|---|---|---|---|
| BLACKWIDOW | NOT_STARTED | BLOCKED | BW-DELETE-001 (BYPASSED/HIGH), BW-DELETE-003 (PARTIAL/HIGH) — deprecated DAL export confirmed callable and cascade gap confirmed. BW-DELETE-002 (BYPASSED/MEDIUM) — UI bypass confirmed. Module cannot advance until deprecated DAL export is removed and cascade migration is executed. |

**Status Update — 2026-05-28:**

| Finding | Prior Status | Current Status | Blocker Remaining |
|---|---|---|---|
| BW-DELETE-001 | BYPASSED | MITIGATED | `export` removed from `dalDeleteOwnedVportById`; diagnostics import removed. Re-test required → HARDENED |
| BW-DELETE-002 | BYPASSED | OPEN — P2 | Server-side audit log + one-time confirmation token (Carnage + controller sprint) |
| BW-DELETE-003 | PARTIAL | OPEN — DB BLOCKED | CARNAGE migration required to extend `hard_delete_vport` RPC chain (resources, portfolio, availability, push) |
| BW-DELETE-004 | BLOCKED (DB only) | MITIGATED | `assertActorOwnsVportActorController` added to `ctrlHardDeleteVport`; `dalReadActorIdByVportId` added to account.read.dal. Re-test required → HARDENED |
| BW-DELETE-005 | PARTIAL (CORS) | OPEN — P1 | CORS wildcard on `delete-citizen-account` Edge Function — replace `"*"` with `APP_ORIGIN` env var |

**Module gate: delete-lifecycle remains BLOCKED on BW-DELETE-003 (CARNAGE cascade migration) until that sprint executes + THOR approves.**

---

## PRIORITY REMEDIATION ORDER

### Immediate (before next release — no migration required)

| Item | Finding | Action | Owner |
|---|---|---|---|
| Remove export from dalDeleteOwnedVportById | BW-DELETE-001 | Remove `export` keyword — one word change | Wolverine |
| Remove actor_id + profile_id from PUBLIC_SELECT strings | BW-CONTENT-002 | Edit 2 DAL files — remove 2 fields from SELECT string | ELEKTRA |
| Add ALLOWED_UPDATE_FIELDS strip to updateVportContentPageDAL | BW-CONTENT-001 | Add field stripping before .update(patch) | ELEKTRA |
| Replace CORS wildcard in delete-citizen-account | BW-DELETE-005 | Replace "*" with APP_ORIGIN env var | ELEKTRA |

### P1 Sprint (migration required — CARNAGE + DB + THOR gate)

| Item | Finding | Action | Owner |
|---|---|---|---|
| Execute CARNAGE legacy RLS policy drop (content_pages) | BW-CONTENT-004 | Drop 4 legacy PERMISSIVE policies | DB + Carnage + THOR |
| Add actor_id to WHERE in toggle and update DALs | BW-CONTENT-003 | .eq("actor_id", actorId) in toggle + update DAL | ELEKTRA |
| Extend hard_delete_vport chain (resources + portfolio + availability + push) | BW-DELETE-003 | Extend RPC — 5 new DELETE phases | Carnage + DB |
| Add controller-layer ownership assertion to ctrlHardDeleteVport | BW-DELETE-004 | Add assertActorOwnsVportActorController | Wolverine |

### P2 Sprint

| Item | Finding | Action | Owner |
|---|---|---|---|
| Server-side audit log for hard delete | BW-DELETE-002 | Create delete_audit_log table + controller logging | Carnage + Wolverine |
| Add public-safe fromRow() variant in VportContentPageModel | BW-CONTENT-002 | Model variant for public paths | ELEKTRA |

---

---

## THOR GATE RESULT — 2026-05-28

**THOR reviewed this report as part of the content-pages + delete-lifecycle release gate.**

**FINAL DECISION: CAUTION** — release may proceed.

| Finding | Status at THOR Gate | THOR Verdict |
|---|---|---|
| BW-CONTENT-001 | MITIGATED | ACCEPTED — patch confirmed by THOR review |
| BW-CONTENT-002 | MITIGATED | ACCEPTED — patch confirmed by THOR review |
| BW-CONTENT-003 | MITIGATED | ACCEPTED — patch confirmed by THOR review |
| BW-CONTENT-004 | OPEN — DB BLOCKED | ACCEPTED WITH EXPIRATION — CARNAGE migration required before next content-pages release; must have separate THOR gate |
| BW-DELETE-001 | MITIGATED | ACCEPTED — patch confirmed by THOR review |
| BW-DELETE-002 | OPEN — P2 | ACCEPTED — P2 sprint; not blocking |
| BW-DELETE-003 | OPEN — DB BLOCKED | ACCEPTED WITH EXPIRATION — CARNAGE cascade migration required; must have separate THOR gate |
| BW-DELETE-004 | MITIGATED | ACCEPTED — patch confirmed by THOR review |
| BW-DELETE-005 | OPEN — P1 | ACCEPTED — single-line CORS fix; P1 sprint |

**BLACKWIDOW re-test required:** All MITIGATED findings must be re-tested by BLACKWIDOW to advance from MITIGATED → HARDENED. Schedule after SPIDER-MAN tests are written.

**THOR report:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_thor_content-pages-delete-lifecycle-security-gate.md`

---

*BLACKWIDOW — Ethical Red Team — READ-ONLY ADVERSARIAL SIMULATION COMPLETE*
*Audit persisted to: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_19-00_blackwidow_content-pages-delete-lifecycle.md`*
*No source files were modified during this simulation.*
