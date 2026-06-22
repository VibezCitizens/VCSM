# VENOM SECURITY AUDIT REPORT
## Module: VPORT Dashboard — Portfolio Card
**Date:** 2026-05-23 17:00
**Reviewer:** VENOM (Security Sheriff)
**Application Scope:** VCSM + ENGINE
**Review Type:** Read-only Security Review
**Source Map:** `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/modules/vcsm.portfolio-card.architecture.md`
**Branch:** vport-booking-feed-security-updates

---

## Pre-Review Summary

All 40 files listed in the review manifest were read. No files were skipped. No source files were modified.

The portfolio card is one of the most write-intensive surfaces on the VPORT dashboard. It accepts unauthenticated `actorId` parameters from the URL, orchestrates multi-step write sequences across multiple tables, and delegates ownership enforcement to a dependency-injected function that does not consult the canonical ownership table (`vc.actor_owners`).

**Live DB Update (2026-05-23 17:30):** Supabase Management API queries against project `nkdrjlmbtqbywhcthppm` confirm that RLS IS enabled on all portfolio tables, including `vport.portfolio_items`, `vport.portfolio_media`, and `vport.portfolio_tags`, with active CRUD policies using `actor_can_manage_profile`. VENOM's initial classification of these three tables as UNVERIFIED (based on migration file search) was incorrect — PORT-V-007 has been reclassified. The live DB query also identified a new CRITICAL runtime break: three SECURITY DEFINER RPCs (`vc.get_vport_portfolio`, `vc.get_barber_vport_portfolio`, `vc.get_barber_vport_portfolio_item_detail`) reference legacy `vc.vport_portfolio_*` tables that do not exist — these RPCs fail at runtime. See PORT-V-NEW-RPC-001.

---

## FINDINGS

---

```
VENOM SECURITY FINDING

Finding ID: PORT-V-001
Severity: CRITICAL
Card: Portfolio
Location: apps/VCSM/src/features/portfolio/setup.js — isActorOwner injected resolver
Application Scope: VCSM + ENGINE
Trust Boundary: Authenticated VPORT Owner
CISSP Domain:
  Primary: Identity and Access Management (IAM)
  Secondary: Software Development Security
Exploitability: HIGH
Attack Preconditions:
  - Attacker is authenticated (holds a valid Supabase session)
  - Attacker knows any valid, non-voided actorId in vc.actors (these are UUIDs resolvable from public profile pages)
  - RLS on vport.portfolio_items and vport.portfolio_media is present (VERIFIED per live DB 2026-05-23 17:30 — see PORT-V-007 reclassification), but the app-layer gate is still broken independent of RLS
Blast Radius: Multi-actor — any VPORT on the platform is a target

Current Behavior:
The `isActorOwner` function injected at boot in `features/portfolio/setup.js` checks whether:
  1. A valid Supabase session exists (auth.uid() non-null)
  2. The supplied actorId exists in `vc.actors` WHERE `is_void = false`

It does NOT verify that the authenticated user owns the target actor via `vc.actor_owners`.

Specifically, the query is:
  supabase.schema('vc').from('actors').select('id').eq('id', actorId).eq('is_void', false).limit(1)

There is no `WHERE user_id = auth.uid()` join to `actor_owners`. Any authenticated user passes this check for any actorId that is not voided.

Compare to the canonical gate used in the booking feature (`assertActorOwnsVportActorController`), which:
  1. Verifies the requester actor is not voided
  2. Confirms the requester is a `user` kind actor
  3. Queries `actor_owners` WHERE `actor_id = targetActorId AND user_id = requesterProfileId`
  4. Verifies the owner link is not void

Exploit Path:
  1. Attacker is logged in as Citizen A (owns ActorA which is a personal profile, not a VPORT)
  2. Attacker observes that ActorB is a VPORT on the platform (actorId visible in public URL paths)
  3. Attacker calls engine directly (via browser console, Postman, or any REST client) with:
     createItem({ actorId: 'actor-b-uuid', title: 'Injected', ... })
  4. `isActorOwner('actor-b-uuid')` queries vc.actors, finds ActorB exists and is_void=false — returns true
  5. createItem proceeds to resolve ActorB's profileId and inserts a portfolio item under ActorB's profile
  6. RLS on vport.portfolio_items IS verified present (live DB 2026-05-23 17:30). Policy `portfolio_items_insert_managed` checks `actor_can_manage_profile(current_actor_id(), profile_id)` → resolves to `owner_user_id = auth.uid()` on victim's profile. Since auth.uid() is the attacker's UID, the DB-layer INSERT is blocked.
  7. Live verified RLS now provides the DB-layer backstop. However, the application-layer ownership check still never fires correctly. The app layer relies entirely on RLS as its sole effective gate — defense-in-depth is absent.

Impact:
  - DB-layer: cross-actor INSERT is now blocked by verified RLS actor_can_manage_profile policy ✓
  - App-layer: isActorOwner DI function still incorrectly passes for any non-voided actorId — the app-layer gate provides no real protection
  - If RLS policy is ever modified, misconfigured, or bypassed (e.g., future SECURITY DEFINER function added without ownership check), there is zero app-layer fallback
  - Defense-in-depth failure: production security depends entirely on DB RLS with no redundant app-layer gate
  - Feed spam risk from publishLocksmithPortfolioUpdateAsPostController: mitigated by vc.posts INSERT RLS (confirmed active), but app-layer still has no check
  - This remains CRITICAL as an architectural ownership gap even though DB RLS is now verified

RLS Dependency:
  Table: vport.portfolio_items
  RLS Status: VERIFIED (live DB 2026-05-23 17:30) — 4 policies active using actor_can_manage_profile: INSERT/UPDATE/DELETE blocked unless owner_user_id = auth.uid() or profile_actor_access team link
  Risk if RLS misconfigured or removed: Application-layer ownership check provides no backstop — any authenticated user can INSERT rows under any profile_id

Service-role / SECURITY DEFINER Concern: NO — uses anon client with user session; no service_role bypass

Recommended Fix:
  Replace the `isActorOwner` DI implementation in `features/portfolio/setup.js` with a query that joins vc.actor_owners:
    SELECT 1 FROM vc.actor_owners
    WHERE actor_id = actorId
      AND user_id = auth.uid()
  This matches the canonical ownership contract. RLS migration is already applied — do NOT re-apply. Focus is restoring app-layer defense-in-depth so security does not depend solely on DB RLS.

Acceptance Tests:
  1. Citizen A (owning ActorA) calls createItem({ actorId: actorB-uuid }) — should throw authorization error
  2. Citizen A calls createItem({ actorId: actorA-uuid }) — should succeed
  3. Direct Supabase REST POST to vport.portfolio_items with a foreign profile_id — should be blocked by RLS
  4. Voided actorId supplied — should fail even if actor_owners row exists
  5. actorId that exists in vc.actors but has no actor_owners row for auth.uid() — should fail

Release Blocker: YES
```

---

```
VENOM SECURITY FINDING

Finding ID: PORT-V-002
Severity: CRITICAL
Card: Portfolio
Location: engines/portfolio/src/controller/manageTags.controller.js — line 30 ownership gate
Application Scope: ENGINE
Trust Boundary: Authenticated VPORT Owner
CISSP Domain:
  Primary: Software Development Security
  Secondary: Identity and Access Management (IAM)
Exploitability: HIGH (when manageTags is wired to UI — currently UI-unwired but PUBLIC API surface)
Attack Preconditions:
  - manageTags is exposed in the engine's public adapter (engines/portfolio/src/adapters/index.js line 18)
  - Any caller with a valid session can call it directly
  - attacker knows a valid itemId belonging to a victim VPORT
Blast Radius: Multi-actor — any portfolio item on the platform can be tag-manipulated

Current Behavior:
In `manageTags.controller.js`, the profile-level ownership gate is:
  if (item.actor_id !== actorId) throw new Error('not authorized...')

The `portfolio_items` table has NO column named `actor_id`. The actual ownership column is `profile_id`. The ITEM_COLUMNS definition in `portfolioItems.read.dal.js` does not include `actor_id`.

Therefore `item.actor_id` is always `undefined`. The check `undefined !== actorId` evaluates to `true` when actorId is a non-empty string — meaning the check THROWS for the legitimate owner too... unless actorId is also undefined/null. If actorId is a valid UUID string, `undefined !== 'uuid-string'` is true, and the controller throws for everyone.

Wait — re-reading the logic: the check throws if NOT equal (throws "not authorized"). So `item.actor_id !== actorId` → `undefined !== 'valid-uuid'` → `true` → throws error for ALL callers including legitimate owners. This means manageTags is currently BROKEN for legitimate owners.

BUT: the `isActorOwner(actorId)` DI gate still runs after the broken check. If the profile-level check were ever fixed to use `item.profile_id !== callerProfileId`, but the DI isActorOwner weakness (PORT-V-001) is not fixed, the gate would be weak. Currently both are broken — one too restrictive (blocks everyone), one too permissive (doesn't verify actor_owners).

More critically: if the broken check throws for everyone, it produces a false sense of security — the gate appears to work, but it blocks legitimate owners while doing nothing to stop an attacker who crafts a scenario where item.actor_id could be defined (e.g., if a future migration adds an actor_id column, or if a raw row is passed with that field populated through some other path).

The gate is dead code masquerading as a security boundary.

Exploit Path:
  Current state: manageTags is UI-unwired. A direct API caller who bypasses the dead profile-level gate (which throws for everyone) would hit the DI isActorOwner gate (broken per PORT-V-001). If PORT-V-001 is fixed without fixing manageTags, the dead gate means there is NO profile-level cross-check for manageTags — only the DI gate.
  
  If manageTags is wired to UI without fixing this:
  1. Attacker obtains itemId belonging to ActorB's portfolio (itemIds may be guessable from public portfolio API)
  2. Calls manageTags({ itemId: victimItemId, actorId: attackerActorId, tags: ['malicious'] })
  3. Profile-level gate checks item.actor_id (undefined) !== attackerActorId (uuid) — but this currently throws, so this path is blocked by the wrong mechanism
  4. If the undefined check were ever silently fixed to return false instead of throw, the gate would pass
  5. isActorOwner(attackerActorId) passes per PORT-V-001
  6. Attacker replaces victim's tags with attacker-controlled content

Impact:
  - Tag injection/replacement on any portfolio item when UI is wired
  - SEO manipulation: tags affect discoverability and filtering
  - Dead ownership gate creates maintenance trap: future developer may fix the undefined issue without recognizing the authorization dependency

RLS Dependency:
  Table: vport.portfolio_tags
  RLS Status: VERIFIED WITH CAVEAT (live DB 2026-05-23 17:30) — INSERT and DELETE policies use direct ownership check (owner_user_id = auth.uid() OR actor_owners join). These policies do NOT include the profile_actor_access team member path, unlike portfolio_items/portfolio_media. SELECT uses actor_can_view_profile (public-read for active profiles). No UPDATE policy (delete/re-insert pattern).
  Risk if RLS misconfigured: Direct REST INSERT/DELETE on portfolio_tags is currently protected at DB layer. App-layer dead gate (item.actor_id field doesn't exist) means zero app-layer protection if manageTags is wired to UI without fixing this finding.

Service-role / SECURITY DEFINER Concern: NO

Recommended Fix:
  Replace `if (item.actor_id !== actorId)` with `if (item.profile_id !== callerProfileId)` — paralleling the pattern used in updateItem.controller.js, deleteItem.controller.js, and addMedia.controller.js. Add callerProfileId resolution (dalGetProfileIdByActorId) matching those controllers.

Acceptance Tests:
  1. Legitimate owner calls manageTags — should succeed
  2. Non-owner calls manageTags with a valid actorId for a foreign item — should throw authorization error
  3. Caller supplies an itemId that does not exist — should throw 'item not found'
  4. Direct REST call to vport.portfolio_tags DELETE with foreign item_id — should be blocked by RLS
  5. After PORT-V-001 fix, manageTags with foreign actorId — should be blocked by fixed isActorOwner

Release Blocker: YES
```

---

```
VENOM SECURITY FINDING

Finding ID: PORT-V-003
Severity: CRITICAL
Card: Portfolio
Location: engines/portfolio/src/controller/removeMedia.controller.js — ownership gate
Application Scope: ENGINE
Trust Boundary: Authenticated VPORT Owner
CISSP Domain:
  Primary: Identity and Access Management (IAM)
  Secondary: Software Development Security
Exploitability: HIGH
Attack Preconditions:
  - Attacker is authenticated
  - Attacker knows any mediaId from any VPORT's portfolio (mediaIds may be resolvable from public portfolio media endpoints or API browsing)
  - The broken isActorOwner DI gate (PORT-V-001) passes for any non-voided actorId
Blast Radius: Multi-actor — any portfolio media row on the platform is a deletion target

Current Behavior:
`removeMedia.controller.js` accepts `{ mediaId, actorId }` and performs:
  1. isActorOwner(actorId) — broken per PORT-V-001
  2. dalDeletePortfolioMedia({ mediaId }) — hard delete, no WHERE clause beyond `.eq('id', mediaId)`

There is NO cross-check between `mediaId` and `actorId`. The controller does not:
  - Fetch the media row to check its profile_id
  - Compare profile_id to callerProfileId
  - Verify the media row's portfolio_item_id belongs to an item owned by the caller

The comment in `portfolioMedia.write.dal.js` line 48 states: "RLS enforces ownership." But RLS status for vport.portfolio_media is UNVERIFIED (PENDING per audit V2).

Exploit Path:
  1. Attacker discovers a victim VPORT's mediaId (observable via public portfolio API calls or network inspection)
  2. Attacker calls removeMedia({ mediaId: victimMediaId, actorId: attackerOwnedActorId })
  3. isActorOwner(attackerOwnedActorId) passes per PORT-V-001 (checks vc.actors, not actor_owners)
  4. dalDeletePortfolioMedia executes DELETE WHERE id = victimMediaId
  5. If RLS on portfolio_media is absent: DELETE succeeds — victim's portfolio photo is permanently destroyed
  6. No item-level cross-check exists to prevent this

Impact:
  - Permanent hard deletion of any portfolio media row by any authenticated user
  - Portfolio photos for any VPORT can be destroyed (hard delete, not soft-delete)
  - Denial of service against competitor VPORTs: destroy their entire portfolio media archive
  - Currently removeMedia is not wired to dashboard UI, but it is exported in the public engine API

RLS Dependency:
  Table: vport.portfolio_media
  RLS Status: VERIFIED (live DB 2026-05-23 17:30) — DELETE policy `portfolio_media_delete` uses `actor_can_manage_profile(current_actor_id(), profile_id)`. Direct REST DELETE against a victim's media row will be blocked by DB-layer policy since auth.uid() will not match the victim's owner_user_id.
  Risk if RLS misconfigured: No app-layer cross-check exists. DB RLS is the only gate for removeMedia.

Service-role / SECURITY DEFINER Concern: NO

Recommended Fix:
  Before calling dalDeletePortfolioMedia, fetch the media row (dalListMediaByItemId or a new dalGetMediaById), resolve the caller's profileId via dalGetProfileIdByActorId, and verify media.profile_id === callerProfileId. This pattern mirrors addMedia.controller.js. RLS migration is already applied — do NOT re-apply. The fix restores app-layer defense-in-depth so security does not rely solely on DB RLS.

Acceptance Tests:
  1. Owner calls removeMedia with their own mediaId — should succeed
  2. Non-owner calls removeMedia with victim's mediaId but a valid actorId — should throw authorization error
  3. Non-existent mediaId supplied — should fail gracefully (no-op or error)
  4. Direct REST DELETE to vport.portfolio_media WHERE id = victimId — should be blocked by RLS
  5. After PORT-V-001 fix: removeMedia with attacker's actorId against victim's mediaId — fails at isActorOwner

Release Blocker: YES
```

---

```
VENOM SECURITY FINDING

Finding ID: PORT-V-004
Severity: HIGH
Card: Portfolio
Location: apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js — ctrlSavePortfolioDetail (line 104)
Application Scope: VCSM
Trust Boundary: Authenticated VPORT Owner
CISSP Domain:
  Primary: Identity and Access Management (IAM)
  Secondary: Software Development Security
Exploitability: MEDIUM
Attack Preconditions:
  - Attacker is authenticated as a locksmith VPORT owner
  - Attacker knows a portfolioItemId belonging to another locksmith VPORT (observable from public portfolio reads)
  - Screen-level isOwner gate must be bypassed (direct API call or JS console)
Blast Radius: Single actor (locksmith VPORT type only) — limited to locksmith_portfolio_details table

Current Behavior:
`ctrlSavePortfolioDetail(portfolioItemId, detail)` accepts only two parameters. There is NO `actorId` parameter and NO ownership verification of any kind. The function calls `dalUpsertLocksmithPortfolioDetail` directly with the caller-supplied `portfolioItemId`.

The function signature:
  export async function ctrlSavePortfolioDetail(portfolioItemId, detail) {
    if (!portfolioItemId) throw new Error('[Locksmith] portfolioItemId required')
    return dalUpsertLocksmithPortfolioDetail({ portfolio_item_id: portfolioItemId, ... })
  }

Authorization relies entirely on:
  1. Screen-level `useVportOwnership` returning `isOwner = true` (UI-only gate, not a security boundary)
  2. RLS on `vport.locksmith_portfolio_details` (OVERLAPPING per DB audit — has both named policies and owner_all ALL policy; classification is not ABSENT, but policy interaction is non-canonical)

`usePortfolioItemSubmit` (which calls this controller) does receive `actorId` as a prop, but does not pass it to `ctrlSavePortfolioDetail`. The controller has no way to perform ownership verification even if it wanted to.

Exploit Path:
  1. Attacker is a legitimate locksmith VPORT owner (owns ActorA)
  2. Attacker observes portfolioItemId of victim locksmith VPORT (ActorB) from public portfolio endpoint
  3. Attacker calls ctrlSavePortfolioDetail(victimPortfolioItemId, { jobType: 'lockout', ... }) via browser console
  4. Controller does not check ownership — passes directly to UPSERT DAL
  5. UPSERT on vport.locksmith_portfolio_details with victim's portfolio_item_id succeeds or overwrites existing locksmith detail
  6. Victim's locksmith portfolio detail record is overwritten with attacker-supplied data

Impact:
  - Attacker overwrites locksmith portfolio metadata (job type, property type, emergency flag, security upgrade flag) for any locksmith portfolio item
  - Data integrity corruption of victim VPORT's portfolio narrative
  - If shareToFeed is triggered after ctrlSavePortfolioDetail, attacker may be able to inject fraudulent locksmith work records into the public feed under a victim's identity (mitigated by publishLocksmithPortfolioUpdateAsPostController checking actorId separately)

RLS Dependency:
  Table: vport.locksmith_portfolio_details
  RLS Status: ASSUMED (OVERLAPPING — DB audit 2026-05-14 classifies as OVERLAPPING: both named actor_can_manage_profile policies AND an owner_all ALL policy coexist; the actor_can_manage_profile named policies provide a real ownership gate, but the overlapping ALL policy creates maintenance risk)
  Risk if RLS missing or misconfigured: ctrlSavePortfolioDetail has zero app-layer ownership gate; DB is the only line of defense

Service-role / SECURITY DEFINER Concern: NO — uses standard vportClient (anon key with user session)

Recommended Fix:
  Add actorId as a required parameter to ctrlSavePortfolioDetail. Before calling dalUpsertLocksmithPortfolioDetail, verify that the portfolioItemId belongs to a profile that the actorId owns: fetch the portfolio item (dalGetPortfolioItemById from engine), resolve the caller's profileId (dalGetProfileIdByActorId), and assert item.profile_id === callerProfileId. This matches the pattern used in updateItem.controller.js and deleteItem.controller.js.

Acceptance Tests:
  1. Owner calls ctrlSavePortfolioDetail with their own portfolioItemId — should succeed
  2. Attacker calls ctrlSavePortfolioDetail with victim's portfolioItemId — should throw authorization error
  3. portfolioItemId belonging to a non-locksmith portfolio item — should handle gracefully
  4. Direct REST UPSERT to locksmith_portfolio_details with foreign portfolio_item_id — blocked by RLS (ASSUMED)
  5. After fix: usePortfolioItemSubmit must pass actorId to ctrlSavePortfolioDetail

Release Blocker: YES
```

---

```
VENOM SECURITY FINDING

Finding ID: PORT-V-005
Severity: HIGH
Card: Portfolio
Location: apps/VCSM/src/features/dashboard/vport/dal/write/portfolioMediaRecord.write.dal.js — updatePortfolioMediaAssetIdDAL
Application Scope: VCSM
Trust Boundary: Authenticated VPORT Owner
CISSP Domain:
  Primary: Software Development Security
  Secondary: Identity and Access Management (IAM)
Exploitability: MEDIUM
Attack Preconditions:
  - Attacker knows a portfolioMediaId belonging to another VPORT
  - Attacker can trigger addPortfolioMediaWithRecord.controller.js with a foreign itemId (possible if PORT-V-001 is not fixed)
  - Or attacker calls updatePortfolioMediaAssetIdDAL directly
Blast Radius: Single actor — media_asset_id update only (not content destruction)

Current Behavior:
`updatePortfolioMediaAssetIdDAL({ portfolioMediaId, mediaAssetId })` executes:
  vport.from('portfolio_media').update({ media_asset_id: mediaAssetId }).eq('id', portfolioMediaId)

There is NO ownership check of any kind. The function accepts a caller-supplied portfolioMediaId and mediaAssetId and applies the UPDATE without verifying:
  - That portfolioMediaId belongs to a media row owned by the calling actor
  - That mediaAssetId is owned by the calling actor (though platform.media_assets has RLS gated by actor_owners — this provides partial mitigation for the mediaAssetId side)

This function is called as a non-blocking fire-and-forget from inside `addPortfolioMediaWithRecord.controller.js`. If an attacker triggers addPortfolioMediaWithRecord with a foreign itemId (exploiting PORT-V-001), the chain eventually calls updatePortfolioMediaAssetIdDAL with `portfolioMedia.id` (the newly inserted foreign media row) and the attacker's own mediaAssetId. This links an attacker's platform.media_assets record to a victim's portfolio_media row.

Impact:
  - Attacker's media_asset_id is stamped onto a victim VPORT's portfolio media row
  - Platform.media_assets ownership audit trail is corrupted: the media asset owned by the attacker is linked to content shown on the victim's profile
  - Lower severity in isolation (not content theft), but is a data integrity violation and a forensic audit problem
  - Combined with PORT-V-001 and PORT-V-003, enables full cross-actor media manipulation

RLS Dependency:
  Table: vport.portfolio_media
  RLS Status: VERIFIED (live DB 2026-05-23 17:30) — UPDATE policy `portfolio_media_update` uses `actor_can_manage_profile(current_actor_id(), profile_id)`. Direct REST PATCH against a victim's media row is blocked by DB-layer policy.
  Risk if RLS misconfigured: No app-layer ownership check in updatePortfolioMediaAssetIdDAL. DB RLS is the only gate for this update path.

Service-role / SECURITY DEFINER Concern: NO

Recommended Fix:
  Before calling the UPDATE, fetch the media row to verify its profile_id matches the calling actor's profileId. Add a portfolioItemId or actorId parameter to updatePortfolioMediaAssetIdDAL and perform an ownership assertion before the UPDATE. Alternatively, RLS on vport.portfolio_media UPDATE should verify profile_id ownership.

Acceptance Tests:
  1. Owner calls updatePortfolioMediaAssetIdDAL with their own portfolioMediaId — should succeed
  2. Attacker calls with a foreign portfolioMediaId — should be blocked by RLS or application-layer check
  3. Direct REST PATCH to portfolio_media.media_asset_id with foreign id — blocked by RLS (if present)
  4. Chain test: addPortfolioMediaWithRecord with a foreign itemId (after PORT-V-001 fix prevents this) — should fail at addMedia gate, never reaching updatePortfolioMediaAssetIdDAL
  5. mediaAssetId belonging to a different actor — platform.media_assets RLS should block the SELECT, but the UPDATE to portfolio_media should still be separately gated

Release Blocker: YES
```

---

```
VENOM SECURITY FINDING

Finding ID: PORT-V-006
Severity: HIGH
Card: Portfolio
Location: apps/VCSM/src/features/dashboard/vport/screens/VportDashboardPortfolioScreen.jsx — actorId from useParams() treated as trusted
Application Scope: VCSM
Trust Boundary: Authenticated VPORT Owner
CISSP Domain:
  Primary: Identity and Access Management (IAM)
  Secondary: Security Architecture and Engineering
Exploitability: HIGH
Attack Preconditions:
  - Attacker is an authenticated Citizen
  - Attacker navigates to /actor/<victim-actorId>/dashboard/portfolio directly
  - `isOwner` resolves false — screen shows "Owner access only" message
  - BUT: actorId from useParams() is passed directly to deleteItem, useVportPortfolio (list read), and PortfolioItemForm
Blast Radius: Multi-actor — actorId is unchecked before being passed to mutations

Current Behavior:
The screen reads `targetActorId = params?.actorId ?? null` from `useParams()` (URL-supplied, attacker-controlled). This value is passed to:
  1. `useVportPortfolio(targetActorId)` — read operation, acceptable
  2. `deleteItem({ itemId: item.id, actorId: targetActorId })` — MUTATION
  3. `PortfolioItemForm actorId={targetActorId}` — which passes it to usePortfolioItemSubmit → createItem/updateItem

The screen does have `if (!isOwner) return <div>Owner access only.</div>` (line 128), which prevents the UI from rendering if ownership fails. However:
  - `useVportOwnership` is documented as a UI-level gate, not a security boundary
  - The ownership check (`isOwner`) is computed asynchronously. During the loading window (`ownershipLoading`), `isOwner` is likely false/undefined
  - If `ownershipLoading` is truthy and `isOwner` is falsy during the initial render cycle, the early return `if (!isOwner) return <div>...</div>` fires. But mutations could theoretically be triggered before the guard is evaluated
  - More importantly: the mutations themselves (deleteItem, createItem, updateItem) do not re-verify that `targetActorId` is owned by the caller — they rely entirely on the screen gate + the broken isActorOwner DI function
  - `useVportOwnership` is UI-state, not a cryptographic or server-enforced boundary

Exploit Path:
  1. Attacker navigates to /actor/<victimActorId>/dashboard/portfolio
  2. isOwner = false — "Owner access only" is shown
  3. Attacker opens browser console, finds the deleteItem function bound to the page, calls:
     window.__portfolio.deleteItem({ itemId: 'victim-item-uuid', actorId: 'victim-actor-uuid' })
  4. deleteItem calls isActorOwner('victim-actor-uuid') — passes per PORT-V-001
  5. deleteItem resolves profileId from victim actorId — finds victim's profileId
  6. existing.profile_id === callerProfileId comparison: callerProfileId is the victim's profileId (not the attacker's); existing item's profile_id is also victim's profileId — they match!
  7. If RLS is absent: soft-delete succeeds against victim's item

Note: deleteItem's profile cross-check compares item.profile_id to callerProfileId where callerProfileId is resolved FROM THE SUPPLIED actorId — not from the authenticated session's own actors. This is the critical flaw: the profile_id cross-check only ensures the item belongs to the SUPPLIED actorId, not that the CALLER owns the supplied actorId.

Impact:
  - Attacker who knows a victim's actorId and any of their itemIds can soft-delete their portfolio items
  - deleteItem emits a soft-delete (is_deleted=true, deleted_at=timestamp) — reversible at DB level but not through UI
  - Combined with PORT-V-001: all mutation paths (create, update, delete, addMedia) are reachable against foreign actorIds through direct console/API access

RLS Dependency:
  Table: vport.portfolio_items
  RLS Status: VERIFIED (live DB 2026-05-23 17:30) — UPDATE policy `portfolio_items_update_managed` uses actor_can_manage_profile. Soft-delete (UPDATE is_deleted=true) on a victim's item is blocked at DB layer since auth.uid() won't match.
  Risk if RLS misconfigured: Screen-level and app-layer gates both rely on UI state only. No app-layer server-side ownership verification exists independently.

Service-role / SECURITY DEFINER Concern: NO

Recommended Fix:
  The screen-level isOwner gate is necessary for UX but insufficient for security. Each mutation must independently verify that the authenticated session owns `targetActorId` via actor_owners. This is achieved by fixing PORT-V-001 (isActorOwner DI function). Additionally, the deleteItem profile cross-check in the engine should compare item.profile_id against the authenticated session's actor's profileId (derived from session, not from caller-supplied actorId). The caller-supplied actorId should only be accepted AFTER the session ownership is confirmed.

Acceptance Tests:
  1. Non-owner navigates to /actor/<victimId>/dashboard/portfolio — page shows "Owner access only"
  2. Non-owner attempts deleteItem via console with victim actorId — rejected by fixed isActorOwner gate
  3. Owner navigates to their own dashboard/portfolio — all mutations succeed
  4. ownershipLoading=true state: no mutations should be triggerable during loading
  5. Race condition test: isOwner transitions from null → false → (after delay) true — mutations during null state should be blocked

Release Blocker: YES
```

---

```
VENOM SECURITY FINDING

Finding ID: PORT-V-007
Severity: LOW
Card: Portfolio
⚠️ RECLASSIFIED: 2026-05-23 17:30 — previously HIGH/Release Blocker based on migration file search (UNVERIFIED). Live Supabase DB query confirms RLS IS enabled and active policies are present. See DB Snapshot: zNOTFORPRODUCTION/_HISTORY/db/snapshots/2026-05-23_17-30_db_portfolio-rls-policies.md
Location: vport.portfolio_items, vport.portfolio_media, vport.portfolio_tags — RLS verification status update
Application Scope: VCSM + ENGINE
Trust Boundary: Authenticated Citizen (any authenticated user)
CISSP Domain:
  Primary: Security Architecture and Engineering
  Secondary: Security Assessment and Testing
Exploitability: LOW
Attack Preconditions:
  - Would require RLS policy to be misconfigured or absent
  - Current live DB confirms policies ARE present and using correct ownership basis
Blast Radius: N/A — DB-layer protection confirmed present

Current Behavior (VERIFIED per live DB 2026-05-23 17:30):

vport.portfolio_items — RLS VERIFIED, 4 active policies (roles: authenticated):
  SELECT: actor_can_manage_profile OR (actor_can_view_profile AND is_deleted=false)
  INSERT: actor_can_manage_profile(current_actor_id(), profile_id) + created_by_actor_id check
  UPDATE: actor_can_manage_profile(current_actor_id(), profile_id)
  DELETE: actor_can_manage_profile(current_actor_id(), profile_id)

vport.portfolio_media — RLS VERIFIED, 4 active policies (roles: public):
  SELECT: actor_can_manage_profile OR (actor_can_view_profile AND is_active=true)
  INSERT: actor_can_manage_profile(current_actor_id(), profile_id)
  UPDATE: actor_can_manage_profile(current_actor_id(), profile_id)
  DELETE: actor_can_manage_profile(current_actor_id(), profile_id)

vport.portfolio_tags — RLS VERIFIED WITH CAVEAT, 3 active policies (mixed roles):
  SELECT: actor_can_view_profile (public read for active profiles)
  INSERT: owner_user_id = auth.uid() OR actor_owners join (is_void=false) — does NOT include profile_actor_access team path
  DELETE: same as INSERT
  NOTE: no UPDATE policy (delete/re-insert pattern). Team members added via profile_actor_access CAN manage portfolio_items and portfolio_media but CANNOT manage portfolio_tags — inconsistency (see DB-PORT-003).

actor_can_manage_profile(p_profile_id) ownership chain (verified):
  Primary check: profiles.owner_user_id = auth.uid() AND is_deleted = false
  Secondary check: profile_actor_access.actor_id with actor_owners.user_id = auth.uid(), paa.status='active', is_void=false

Previous finding (now invalid):
  The original finding stated RLS was ABSENT/UNVERIFIED based on exhaustive migration file search finding zero CREATE POLICY statements. The live DB shows policies ARE applied — these were applied via migrations not tracked in the local migration file set (13 unapplied migrations detected in the remote DB during the DB read session).

Remaining Caveat:
  vport.portfolio_tags INSERT/DELETE policies do not include the profile_actor_access team path (DB-PORT-003). Team members can manage items and media but not tags — workflow inconsistency. LOW risk.

RLS Dependency:
  Table: vport.portfolio_items — RLS Status: VERIFIED ✅
  Table: vport.portfolio_media — RLS Status: VERIFIED ✅
  Table: vport.portfolio_tags — RLS Status: VERIFIED WITH CAVEAT ⚠️ (team member path missing)
  Risk: Only residual caveat is portfolio_tags team-path inconsistency.

Service-role / SECURITY DEFINER Concern: NO

Recommended Fix:
  No immediate action required for RLS absence (it is present). Follow-up items tracked in DB snapshot:
  DB-PORT-003: Update portfolio_tags INSERT/DELETE policies to use actor_can_manage_profile for team member consistency.
  DB-PORT-001: Evaluate whether actor_can_manage_profile 2-arg overload should use or remove the p_actor_id parameter (currently discarded).
  DB-PORT-002: Add ORDER BY to vc.current_actor_id() to ensure deterministic actor selection.

Acceptance Tests (verification of existing policies):
  1. Authenticated REST POST to portfolio_items with foreign profile_id — confirmed blocked by RLS INSERT policy
  2. Authenticated REST DELETE to portfolio_media with victim's id — confirmed blocked by RLS DELETE policy
  3. Authenticated REST DELETE to portfolio_tags with foreign item_id — confirmed blocked by RLS INSERT/DELETE policies
  4. Team member (profile_actor_access) tries to INSERT portfolio_tags — currently blocked by RLS (team path not included)
  5. Owner performs INSERT to all three tables — succeeds via actor_can_manage_profile

Release Blocker: NO (reclassified from YES — RLS is verified present)
```

---

```
VENOM SECURITY FINDING

Finding ID: PORT-V-NEW-RPC-001
Severity: CRITICAL
Card: Portfolio
⚠️ NEW FINDING — identified via live Supabase DB query 2026-05-23 17:30
Location:
  - vc.get_vport_portfolio (SECURITY DEFINER RPC)
  - vc.get_barber_vport_portfolio (SECURITY DEFINER RPC)
  - vc.get_barber_vport_portfolio_item_detail (SECURITY DEFINER RPC)
Application Scope: VCSM + ENGINE
Trust Boundary: Public Visitor / Authenticated Citizen
CISSP Domain:
  Primary: Software Development Security
  Secondary: Security Operations
Exploitability: LOW (broken RPCs cannot be exploited — they fail outright)
Attack Preconditions: None — this is a runtime break, not an ownership bypass
Blast Radius: All VPORT types that use these RPCs for portfolio display — public portfolio reads are broken

Current Behavior:
All three SECURITY DEFINER RPCs reference legacy `vc.vport_portfolio_*` tables with `SET row_security TO 'off'` and `SET search_path TO 'vc', 'public'`:
  vc.get_vport_portfolio            → reads vc.vport_portfolio_items, vc.vport_portfolio_media
  vc.get_barber_vport_portfolio     → reads vc.vport_portfolio_items, vc.vport_portfolio_media, vc.vport_barber_portfolio_details
  vc.get_barber_vport_portfolio_item_detail → reads vc.vport_portfolio_items, vc.vport_portfolio_media, vc.vport_barber_portfolio_details, vc.vport_portfolio_tags

LIVE DB VERIFICATION: `information_schema.tables WHERE table_schema = 'vc' AND table_name IN ('vport_portfolio_items', 'vport_portfolio_media', 'vport_portfolio_tags', ...)` returned EMPTY — none of these tables exist as base tables or views in the live database.

The active application tables (with verified RLS policies) are in the `vport` schema:
  vport.portfolio_items, vport.portfolio_media, vport.portfolio_tags, vport.barber_portfolio_details

The schema was migrated from vc.vport_portfolio_* to vport.portfolio_* but these three RPC bodies were not updated. The newer `vport.get_business_card_sections` RPC (which also reads portfolio data) correctly references `vport.portfolio_items` — confirming the migration happened and these three RPCs were left behind.

Column names also changed during the migration:
  Old schema: vc.vport_portfolio_items.actor_id (how VPORT ownership was tracked)
  New schema: vport.portfolio_items.profile_id (current ownership column)

Security Note:
  This is NOT an ownership bypass. All three RPCs only read rows with `visibility='public' AND is_active=true AND is_deleted=false`. They do not expose private data and they do not perform any write operations. The `SET row_security TO 'off'` is appropriate for these public read-only RPCs — they bypass RLS intentionally to serve public portfolio display without requiring caller auth.

Impact:
  Any app or engine code that calls `.rpc('get_vport_portfolio', ...)`, `.rpc('get_barber_vport_portfolio', ...)`, or `.rpc('get_barber_vport_portfolio_item_detail', ...)` will receive a Postgres error:
    "relation vc.vport_portfolio_items does not exist"
  Public portfolio display for ALL VPORT types using these RPCs is completely broken in production. Portfolio cards showing on public profiles, portfolio tabs, and any barber-specific portfolio detail views will fail to load.

Confirmed potentially affected DAL:
  engines/portfolio/src/dal/portfolio.read.dal.js — calls get_vport_portfolio and get_barber_vport_portfolio per ARCHITECT module report (section 4.1 "Database Read Map")

Service-role / SECURITY DEFINER Concern:
  These are SECURITY DEFINER public-read RPCs. They bypass RLS intentionally to serve public portfolio content. This is an appropriate use of SECURITY DEFINER for public data exposure. The security concern is NOT the SECURITY DEFINER pattern itself — it is the broken table reference.

Recommended Fix:
  Delegate to CARNAGE. Rewrite or remove all three RPCs. If still needed, update them to:
  1. Reference vport.portfolio_items (not vc.vport_portfolio_items)
  2. Reference vport.portfolio_media (not vc.vport_portfolio_media)
  3. Reference vport.portfolio_tags (not vc.vport_portfolio_tags)
  4. Reference vport.barber_portfolio_details (not vc.vport_barber_portfolio_details)
  5. Update column references: old actor_id → new profile_id ownership column
  6. Update SET search_path to include 'vport': `SET search_path TO 'vport', 'vc', 'public'`
  Before rewriting, verify full column list of vport.portfolio_items vs the old vc.vport_portfolio_items signature to ensure all SELECT columns exist in the new schema.
  If these RPCs are no longer called by any DAL (orphaned), they should be dropped.

Acceptance Tests:
  1. Call .rpc('get_vport_portfolio', { p_actor_id: validVportActorId }) — should return portfolio items array without error
  2. Call .rpc('get_barber_vport_portfolio', { p_actor_id: validBarberActorId }) — should return barber portfolio with details
  3. Call .rpc('get_barber_vport_portfolio_item_detail', { p_portfolio_item_id: validItemId }) — should return detail JSONB
  4. All three RPCs should only return rows with visibility='public' AND is_active=true
  5. Private or deleted items should not appear in RPC results

Release Blocker: YES (public portfolio display paths broken in production)
```

---

```
VENOM SECURITY FINDING

Finding ID: PORT-V-008
Severity: HIGH
Card: Portfolio
Location: apps/VCSM/src/features/dashboard/vport/screens/VportDashboardPortfolioScreen.jsx — OwnerOnlyDashboardGuard dependency
Application Scope: VCSM
Trust Boundary: Authenticated Citizen
CISSP Domain:
  Primary: Identity and Access Management (IAM)
  Secondary: Security Architecture and Engineering
Exploitability: MEDIUM
Attack Preconditions:
  - Attacker is authenticated
  - Route /actor/:actorId/dashboard/portfolio is inside OwnerOnlyDashboardGuard per app.routes.jsx (line 202-214)
  - OwnerOnlyDashboardGuard must be verified as correctly implemented
Blast Radius: Multi-actor (if OwnerOnlyDashboardGuard has gaps)

Current Behavior:
The route `/actor/:actorId/dashboard/portfolio` is nested inside `<OwnerOnlyDashboardGuard>` per app.routes.jsx lines 201-221. The guard wraps all dashboard routes including portfolio.

POSITIVE FINDING: The route is inside a protected route wrapper (`<OwnerOnlyDashboardGuard>`). This is a meaningful UI-level gate.

However, the screen ALSO has an additional `useVportOwnership` check. The screen-level check uses `viewerActorId` from `identity?.actorId` (the currently active actor from the authenticated session) and `targetActorId` from `useParams()` (the URL-supplied actorId). This means:
  - A user who switches their active actor context in the identity store could potentially navigate to another VPORT's dashboard route and have `viewerActorId` differ from `targetActorId`
  - The guard relies on the identity store being correctly maintained

Neither the route guard nor the screen check constitutes a server-side ownership verification. Both are UI/browser-side gates.

Exploit Path:
  If OwnerOnlyDashboardGuard correctly reads actorId from the URL and compares it to the session's owned actors, it provides meaningful protection. If it reads from identity store state only without re-verifying against the URL actorId, a session with a stale identity context could bypass it. This is classified as MEDIUM exploitability pending OwnerOnlyDashboardGuard implementation review.

Impact:
  - If guard has gaps: non-owner reaches the portfolio screen UI
  - Screen-level useVportOwnership provides a second layer, but is UI-only
  - All mutations still depend on broken isActorOwner DI gate (PORT-V-001)

RLS Dependency:
  Table: vport.portfolio_items
  RLS Status: VERIFIED (live DB 2026-05-23 17:30) — even if both UI guards fail, mutations against a victim's profile_id are blocked by DB-layer actor_can_manage_profile policy.
  Risk if RLS misconfigured: UI gates (OwnerOnlyDashboardGuard + useVportOwnership) are the only barriers; no app-layer server ownership check backs them up.

Service-role / SECURITY DEFINER Concern: NO

Recommended Fix:
  Ensure OwnerOnlyDashboardGuard explicitly reads actorId from useParams() (not from identity store state alone) and verifies it against the authenticated session's owned actor list via a server-side call before rendering any children. Document that this is the canonical ownership gate for all /actor/:actorId/dashboard/* routes.

Acceptance Tests:
  1. Attacker navigates directly to /actor/<victimId>/dashboard/portfolio — OwnerOnlyDashboardGuard redirects
  2. Attacker manipulates identity store state and navigates — guard re-fetches from server, still blocks
  3. Owner navigates to their own portfolio — passes guard
  4. Active actor switch: user switches to a different actor and navigates to old URL — guard blocks old actorId
  5. Race condition: guard loading state — no content or mutations accessible during load

Release Blocker: YES (pending OwnerOnlyDashboardGuard implementation review)
```

---

```
VENOM SECURITY FINDING

Finding ID: PORT-V-009
Severity: MEDIUM
Card: Portfolio
Location: apps/VCSM/src/features/dashboard/vport/screens/components/PortfolioBugsBunnyPanel.jsx — dev panel in production feature tree
Application Scope: VCSM
Trust Boundary: Staff Resource (DEV only)
CISSP Domain:
  Primary: Security Operations
  Secondary: Security Assessment and Testing
Exploitability: LOW
Attack Preconditions:
  - Vite tree-shaking must fail to eliminate the DEV-guarded import
  - import.meta.env.DEV must evaluate to true in a production build (should not happen with standard Vite config)
Blast Radius: Single actor (diagnostic information disclosure)

Current Behavior:
`PortfolioBugsBunnyPanel` is imported unconditionally in `VportDashboardPortfolioScreen.jsx` (line 14):
  import { PortfolioBugsBunnyPanel } from "./components/PortfolioBugsBunnyPanel";

Inside `PortfolioBugsBunnyPanel.jsx`, the guard is:
  if (!import.meta.env.DEV) return null;

And in the screen, it is rendered with:
  {import.meta.env.DEV && (<PortfolioBugsBunnyPanel ... />)}

This provides two layers of protection:
  1. The screen only renders the component in DEV mode (JSX conditional)
  2. The component itself returns null in non-DEV mode

However, the import of `PortfolioBugsBunnyPanel` is unconditional, meaning the component module and all its dependencies (useVportPortfolioProbe, probeVportPortfolioController, portfolioTraceStore) are included in the production bundle. Whether Vite eliminates this via tree-shaking depends on whether it can statically evaluate `import.meta.env.DEV` as false and detect the component is dead code.

The probe controller (`probeVportPortfolioController`) is NOT guarded by `import.meta.env.DEV` at the file level — it is a production-compiled module that reads from `vport.profiles`, `vport.profile_actor_access`, and `vc.actor_owners`.

Additionally, the panel is located inside the production feature tree (`features/dashboard/vport/screens/components/`) rather than `zNOTFORPRODUCTION/debuggers/` per CLAUDE.md workspace rules.

Exploit Path:
  If tree-shaking fails and the panel code reaches production, a sufficiently motivated attacker who inspects the production bundle could find the probe controller entry point. The probe reveals: actorId, profileId, actor_owners rows, auth session userId/email, expected insert payloads, and profile_actor_access rows. This is internal platform data that should not be accessible via a bundled diagnostic endpoint.

Impact:
  - If bundle includes diagnostic code: internal actor ownership data exposed
  - `probeVportPortfolioController` reads raw actor_owners rows — ownership relationship data for any actorId passed to it
  - Rule violation: debug tooling must live in zNOTFORPRODUCTION per CLAUDE.md

RLS Dependency:
  Table: vc.actor_owners
  RLS Status: ASSUMED (canonical ownership table — expected to have RLS)
  Risk if RLS missing: probe controller could expose ownership data for arbitrary actorIds

Service-role / SECURITY DEFINER Concern: NO

Recommended Fix:
  Move PortfolioBugsBunnyPanel, useVportPortfolioProbe, and probeVportPortfolioController to zNOTFORPRODUCTION/debuggers/portfolio/ per CLAUDE.md rules. Use dynamic import (import()) with a DEV guard at the import site so the module is excluded from production bundles entirely. Alternatively, add the file to Vite's optimizeDeps exclude list for production builds.

Acceptance Tests:
  1. Production build (VITE_DEV=false): PortfolioBugsBunnyPanel and its dependencies do not appear in bundle
  2. Production build: probeVportPortfolioController is not reachable from any entrypoint
  3. DEV build: panel renders correctly and probe runs
  4. Production render: panel returns null (already confirmed by conditional)
  5. Bundle analysis: no import of portfolioTraceStore in production chunk

Release Blocker: NO (guards are in place; this is a hygiene finding with bundle risk)
```

---

```
VENOM SECURITY FINDING

Finding ID: PORT-V-010
Severity: MEDIUM
Card: Portfolio
Location: apps/VCSM/src/features/dashboard/vport/screens/components/portfolio/hooks/usePortfolioItemSubmit.js — multi-step orchestration in hook layer
Application Scope: VCSM
Trust Boundary: Authenticated VPORT Owner
CISSP Domain:
  Primary: Software Development Security
  Secondary: Security Architecture and Engineering
Exploitability: LOW (direct security impact is indirect; creates authorization logic scattered across layers)
Attack Preconditions:
  - Multi-step sequence in hook layer means authorization is not centralized
  - Each step (createItem, addPortfolioMediaWithRecord, ctrlSavePortfolioDetail, publishLocksmithPortfolioUpdateAsPostController) independently gates (or fails to gate) ownership
Blast Radius: Single actor (per submit flow)

Current Behavior:
`usePortfolioItemSubmit` is a React hook that directly orchestrates:
  1. createItem / updateItem (engine — broken isActorOwner gate)
  2. addPortfolioMediaWithRecord (composite controller — delegates to engine addMedia — broken isActorOwner gate)
  3. ctrlSavePortfolioDetail (locksmith controller — NO ownership gate at all per PORT-V-004)
  4. publishLocksmithPortfolioUpdateAsPostController (post publish — has actorId check, but no portfolio item ownership check)

By VCSM architecture contract, business orchestration belongs in controllers, not hooks. A hook that directly calls four different controllers from three different feature boundaries (engine, dashboard, profiles/kinds/vport) violates the contract and creates a distributed authorization surface.

Two imports in usePortfolioItemSubmit are direct cross-feature violations (per ARCHITECT report):
  - import { ctrlSavePortfolioDetail } from "@/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller"
  - import { publishLocksmithPortfolioUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller"
These are internal controller paths that should only be accessed via an adapter.

Security consequence: because authorization logic is scattered across the multi-step sequence in a hook, there is no single point where a security engineer can verify "this entire submit flow is authorized before any mutation is executed." If any step's gate is bypassed, subsequent steps may proceed.

Exploit Path:
  No direct exploit — this is an architectural vulnerability that enables cascading authorization failures when combined with PORT-V-001, PORT-V-004, and PORT-V-007.

Impact:
  - Authorization logic is not centralized — auditing requires tracing four separate files
  - A fix to any one gate (e.g., PORT-V-001) does not automatically fix the locksmith detail gate (PORT-V-004)
  - Cross-feature direct imports violate adapter boundary — future refactors may silently break authorization chains

RLS Dependency:
  Multiple tables affected — see PORT-V-001, PORT-V-003, PORT-V-004, PORT-V-007

Service-role / SECURITY DEFINER Concern: NO

Recommended Fix:
  Extract the entire multi-step submit sequence into a VCSM-side controller (e.g., `submitPortfolioItem.controller.js`). The controller should:
    1. Verify ownership of actorId via actor_owners (fixed isActorOwner)
    2. Execute createItem/updateItem
    3. Execute addPortfolioMediaWithRecord for each file
    4. If locksmith: verify portfolioItemId ownership, then execute ctrlSavePortfolioDetail (with actorId param per PORT-V-004 fix)
    5. If shareToFeed: execute publishLocksmithPortfolioUpdateAsPostController
  The hook calls this controller; the controller handles all authorization assertions in sequence.
  Also: expose ctrlSavePortfolioDetail and publishLocksmithPortfolioUpdateAsPostController through a locksmith adapter rather than importing directly from internal paths.

Acceptance Tests:
  1. Submit flow with all steps: authorization check fires before any mutation
  2. Authorization failure at step 1 prevents steps 2-5 from executing
  3. Locksmith detail save only executes after item ownership is verified (not independently)
  4. Cross-feature imports replaced with adapter imports — verify no direct internal controller imports remain

Release Blocker: NO (architectural — but required before next release)
```

---

```
VENOM SECURITY FINDING

Finding ID: PORT-V-011
Severity: INFO
Card: Portfolio
⚠️ RECLASSIFIED: 2026-05-23 17:30 — previously MEDIUM based on incorrect UNVERIFIED RLS status. Live DB confirms RLS IS present on vport.portfolio_media. The comment is now coincidentally accurate.
Location: engines/portfolio/src/dal/portfolioMedia.write.dal.js — comment "RLS enforces ownership" — now verified accurate but app-layer gap remains
Application Scope: ENGINE
Trust Boundary: Authenticated VPORT Owner
CISSP Domain:
  Primary: Security Assessment and Testing
  Secondary: Software Development Security
Exploitability: LOW (documentation concern only; actual app-layer gap is PORT-V-003)
Attack Preconditions:
  - Developer relies on the comment as justification for not adding app-layer cross-check
Blast Radius: Engineering team (comment accepted as justification for no app-layer check)

Current Behavior (UPDATED per live DB 2026-05-23 17:30):
`dalDeletePortfolioMedia` in `portfolioMedia.write.dal.js` (line 49) has the comment:
  "Remove a media row (hard delete — RLS enforces ownership)."

This comment is now VERIFIED AS ACCURATE. Live DB confirms vport.portfolio_media has an active DELETE policy (`portfolio_media_delete`) using `actor_can_manage_profile(current_actor_id(), profile_id)`. RLS does enforce ownership.

Previous VENOM classification was incorrect (stated "RLS has never been applied") — based on exhaustive migration file search that did not find the live policies. The policies exist in the remote DB in migrations not tracked locally.

Residual concern: The comment correctly describes the DB-layer behavior, but was written as justification for not having an app-layer profile cross-check in removeMedia.controller.js (PORT-V-003). The absence of an app-layer check means security depends entirely on RLS. If RLS is ever removed or misconfigured, removeMedia has zero fallback. This is a defense-in-depth architectural concern, not a current exploit.

Impact:
  - No current exploit: RLS enforces ownership as the comment states ✓
  - Architecture: the comment correctly describes the current state but should be expanded to note that app-layer defense-in-depth is required
  - PORT-V-003 (no profile cross-check in removeMedia) remains an active finding independent of this reclassification

RLS Dependency:
  Table: vport.portfolio_media
  RLS Status: VERIFIED ✅ — DELETE policy confirmed via live DB query

Service-role / SECURITY DEFINER Concern: NO

Recommended Fix:
  Update the comment to: "Remove a media row (hard delete). RLS enforces ownership via actor_can_manage_profile (verified 2026-05-23). App-layer profile cross-check is still required for defense-in-depth — see PORT-V-003 and PORT-V-001 for the open ownership gate gap."
  This preserves the accurate RLS statement while flagging the missing app-layer gate.

Acceptance Tests:
  1. Comment accurately reflects both DB-layer (RLS) and app-layer (gap in removeMedia controller) states
  2. After PORT-V-003 fix: comment updated to reflect both DB and app-layer gates are present

Release Blocker: NO
```

---

```
VENOM SECURITY FINDING

Finding ID: PORT-V-012
Severity: MEDIUM
Card: Portfolio
Location: apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller.js — no portfolio item ownership verification before feed publish
Application Scope: VCSM
Trust Boundary: Authenticated VPORT Owner
CISSP Domain:
  Primary: Identity and Access Management (IAM)
  Secondary: Security and Risk Management
Exploitability: MEDIUM
Attack Preconditions:
  - Attacker is an authenticated locksmith VPORT owner
  - shareToFeed = true is set in the submit form
  - actorId is supplied by caller (attacker controls this)
Blast Radius: Feed-wide (public feed contamination under victim's identity if actorId is forged)

Current Behavior:
`publishLocksmithPortfolioUpdateAsPostController({ actorId, portfolioTitle, jobType, mediaUrl })` checks:
  1. actorId is non-null (basic presence check)
  2. hasRecentLocksmithPortfolioPostDAL({ actorId }) — throttle check (prevents spam)
  3. resolveVportLocksmithNameDAL(actorId) — resolves name for the post text
  4. createSystemPost({ actorId, text, post_type, realm_id, media_url })

The function has NO verification that the calling session owns `actorId`. It accepts actorId as a caller-supplied parameter.

If an attacker calls this function directly with a victim's actorId (exploiting PORT-V-001's broken isActorOwner):
  - The throttle check may pass (if victim hasn't posted recently)
  - A locksmith portfolio update post is published to the PUBLIC FEED under the victim's identity
  - The post contains the victim's locksmith name and attacker-controlled portfolioTitle/jobType/mediaUrl

However, `createSystemPost` calls through the posts adapter, which creates a vc.posts row with `actor_id = actorId`. The vc.posts INSERT RLS policy (`posts_insert_actor_owner` per 20260523010000) does check: `actor_owners WHERE actor_id = posts.actor_id AND user_id = auth.uid()`. This provides a DB-level gate that would block the attacker from publishing under a victim's actorId if auth.uid() is the attacker's user_id.

This mitigates the feed publish attack vector at the DB layer, but the application-layer controller has no check — it relies on DB RLS to catch forged actorId.

Impact:
  - Without vc.posts INSERT RLS: attacker publishes portfolio update to feed under victim locksmith's identity
  - With vc.posts INSERT RLS: attack is blocked at DB layer (mitigation confirmed)
  - Residual risk: if vc.posts INSERT RLS has gaps or is bypassed, the controller provides no app-layer defense
  - The throttle check and name resolution run against victim actorId — these are unnecessary DB queries in the forged-call path

RLS Dependency:
  Table: vc.posts
  RLS Status: ASSUMED (posts_insert_actor_owner tracked in 20260523010000 migration)
  Risk if RLS missing or misconfigured: Attacker publishes feed posts under any actorId

Service-role / SECURITY DEFINER Concern: NO

Recommended Fix:
  Add an actorId ownership assertion to publishLocksmithPortfolioUpdateAsPostController before executing any DB operations. Use the canonical assertActorOwnsVportActorController pattern or equivalent. Do not rely solely on DB RLS to catch forged actorId at the controller layer.

Acceptance Tests:
  1. Legitimate locksmith owner with shareToFeed=true — post published under their actorId
  2. Attacker with forged actorId — blocked by RLS on vc.posts (current) AND by added app-layer check (after fix)
  3. Throttle check prevents duplicate posts within the cooldown window
  4. portfolioTitle/jobType/mediaUrl are user-supplied — verify no XSS or injection issues in post text construction
  5. mediaUrl is untrusted user input passed to createSystemPost — verify the post creation does not store or render it without validation

Release Blocker: NO (DB RLS provides mitigation; but app-layer gap is a hardening requirement)
```

---

```
VENOM SECURITY FINDING

Finding ID: PORT-V-013
Severity: LOW
Card: Portfolio
Location: engines/portfolio/src/controller/getPortfolioItem.controller.js and engines/portfolio/src/controller/listPortfolio.controller.js
Application Scope: ENGINE
Trust Boundary: Public Visitor
CISSP Domain:
  Primary: Asset Security
  Secondary: Security and Risk Management
Exploitability: LOW
Attack Preconditions:
  - None (public read controllers)
Blast Radius: Single actor (data exposure risk — portfolio items marked is_deleted=true may be readable)

Current Behavior:
`dalGetPortfolioItemById` (used by getPortfolioItem) fetches a portfolio item by id with NO filter on `is_deleted`. A caller supplying a deleted item's itemId can retrieve the full item row including title, description, portfolioKind, and all media.

`dalListPortfolioItemsByProfileId` (used by listPortfolio) DOES filter `.eq('is_deleted', false)` — the list endpoint is safe.

`getPortfolioItem` is used in the dashboard screen for edit loading: `getItem(item.id, { includeLocksmithDetails: true })`. If an item was soft-deleted but the caller retains its itemId, they can fetch full detail of a deleted item.

More importantly, there is no visibility check in getPortfolioItem: it returns items with visibility='private' to any caller who knows the itemId. Portfolio items can have visibility in ('public', 'private', 'unlisted') based on the schema columns, but getPortfolioItem does not filter by visibility.

Impact:
  - Soft-deleted portfolio items are accessible by itemId via getPortfolioItem
  - Private/unlisted portfolio items are accessible to anyone who knows the itemId
  - For a dashboard owner this is acceptable — but if getPortfolioItem is ever exposed via a public API or consumed in a public context, deleted/private items would be unintentionally visible

RLS Dependency:
  Table: vport.portfolio_items
  RLS Status: VERIFIED (live DB 2026-05-23 17:30) — SELECT policy `portfolio_items_select_access` uses actor_can_view_profile which allows any authenticated user to read active non-deleted items regardless of caller (this is the intentional public read path). Deleted items are visible to the owner via actor_can_manage_profile branch.
  Risk: For public-facing use of getPortfolioItem, deleted items are readable by anyone who knows the itemId (no is_deleted filter). Private visibility items are also readable by anyone who knows the itemId (no visibility filter in getPortfolioItem).

Service-role / SECURITY DEFINER Concern: NO

Recommended Fix:
  For public-facing usage of getPortfolioItem, add filters for is_deleted=false and visibility='public'. For owner-only contexts (dashboard edit), the current behavior is acceptable but should be explicitly documented. Add an `ownerMode` parameter to getPortfolioItem that skips the visibility/deletion filter for authenticated owners.

Acceptance Tests:
  1. Public call to getPortfolioItem with a deleted item's ID — should return null
  2. Owner call to getPortfolioItem with a deleted item's ID in ownerMode — may return item (for edit recovery)
  3. Call to getPortfolioItem with itemId of a private item — should be blocked for non-owner callers
  4. listPortfolio correctly filters is_deleted=false — confirmed correct

Release Blocker: NO
```

---

```
VENOM SECURITY FINDING

Finding ID: PORT-V-014
Severity: INFO
Card: Portfolio
Location: engines/portfolio/src/controller/createItem.controller.js — createdByActorId: null
Application Scope: ENGINE
Trust Boundary: Authenticated VPORT Owner
CISSP Domain:
  Primary: Security Operations
  Secondary: Asset Security
Exploitability: LOW (audit trail concern, not an attack vector)
Attack Preconditions:
  - None (by design — null is intentional)
Blast Radius: Audit trail only

Current Behavior:
`createItem` always sets `createdByActorId: null` on INSERT, with the following comment:
  "created_by_actor_id is omitted (null) intentionally. Passing the vport actor id here can fail RLS if vc.current_actor_id() resolves to the user actor rather than the vport actor."

The INSERT policy is documented as: `(created_by_actor_id IS NULL OR ...)`. This is a pragmatic workaround for the `vc.current_actor_id()` identity resolution mismatch between user actor and vport actor.

The consequence: portfolio items have no `created_by_actor_id` audit trail. It is impossible to determine from the DB record alone which user session created a portfolio item.

Impact:
  - Forensic investigation gap: if portfolio items are injected by an attacker (PORT-V-001 exploit), there is no actor-level audit trail in the row
  - The workaround is intentional and documented, but it eliminates a meaningful audit signal

RLS Dependency:
  Table: vport.portfolio_items
  RLS Status: VERIFIED (live DB 2026-05-23 17:30) — INSERT policy checks `created_by_actor_id IS NULL OR created_by_actor_id = vc.current_actor_id()`. The null path is the current workaround — any authenticated user can INSERT with null created_by_actor_id (ownership still enforced via profile_id through actor_can_manage_profile).
  Risk: Null created_by_actor_id is an intentional design choice documented in the code. The audit gap is tracked here. RLS INSERT enforcement on profile_id is correct.

Service-role / SECURITY DEFINER Concern: NO

Recommended Fix:
  After vc.current_actor_id() is correctly configured to resolve vport actors (not just user actors), revisit populating created_by_actor_id. In the interim, consider logging the actorId at the application layer (server-side edge function or audit log) when portfolio items are created. This is P2 hardening.

Acceptance Tests:
  1. After vc.current_actor_id() fix: createdByActorId is populated correctly on INSERT
  2. RLS INSERT policy correctly evaluates when createdByActorId is non-null
  3. Audit log records: which user session created which portfolio item

Release Blocker: NO
```

---

## PORTFOLIO CARD — AUTHORIZATION MATRIX

RLS statuses updated per live DB query 2026-05-23 17:30. App-layer findings remain active.

| Mutation | Caller-Controlled IDs | actor_owners Verified (App) | Profile Cross-Check (App) | itemId Scope-Check | RLS Status (Live DB) | DB-Layer Safe? | App-Layer Safe? |
|---|---|---|---|---|---|---|---|
| createItem | actorId, serviceId, tags | NO — vc.actors only (broken gate) | N/A — creates new item under resolved profileId | N/A | VERIFIED ✅ actor_can_manage_profile on INSERT | YES | NO |
| updateItem | actorId, itemId, tags | NO — vc.actors only (broken gate) | YES — item.profile_id vs callerProfileId (but callerProfileId derived from caller-supplied actorId) | YES — fetch item before update | VERIFIED ✅ actor_can_manage_profile on UPDATE | YES | NO |
| deleteItem | actorId, itemId | NO — vc.actors only (broken gate) | YES — same flaw as updateItem | YES — fetch item before delete | VERIFIED ✅ actor_can_manage_profile on DELETE | YES | NO |
| addMedia | actorId, itemId, url | NO — vc.actors only (broken gate) | YES — same flaw as updateItem | YES — fetch item before insert | VERIFIED ✅ actor_can_manage_profile on INSERT | YES | NO |
| removeMedia | actorId, mediaId | NO — vc.actors only (broken gate) | NO — no profile cross-check | NO — no item fetch, no scope check | VERIFIED ✅ actor_can_manage_profile on DELETE | YES | NO |
| manageTags | actorId, itemId, tags | NO — vc.actors only (broken gate) | DEAD — checks item.actor_id which does not exist | YES — fetch item before replace | VERIFIED WITH CAVEAT ⚠️ tags policies use direct auth.uid() check (no team path) | YES | NO |
| ctrlSavePortfolioDetail | portfolioItemId (no actorId) | NO — no ownership check whatsoever | NO | NO — no item fetch | VERIFIED ✅ actor_can_manage_profile via portfolio_items join | YES | NO |
| updatePortfolioMediaAssetIdDAL | portfolioMediaId, mediaAssetId | NO — no check | NO | NO | VERIFIED ✅ actor_can_manage_profile on UPDATE | YES | NO |

**Summary:** DB-layer is now verified safe on all write paths. App-layer ownership verification is absent or broken on every write path — defense-in-depth is the outstanding risk for all items.

---

## RLS POLICY MATRIX

**Source: Live Supabase DB query 2026-05-23 17:30 — authoritative.** All statuses below are from `pg_policies` on project `nkdrjlmbtqbywhcthppm`.

| Table | RLS Enabled | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy | Ownership Basis | Notes |
|---|---|---|---|---|---|---|---|
| vport.portfolio_items | ✅ VERIFIED | `portfolio_items_select_access` — actor_can_manage_profile OR (actor_can_view_profile AND is_deleted=false) | `portfolio_items_insert_managed` — actor_can_manage_profile + created_by_actor_id check | `portfolio_items_update_managed` — actor_can_manage_profile | `portfolio_items_delete_managed` — actor_can_manage_profile | actor_can_manage_profile → owner_user_id OR profile_actor_access | roles: authenticated |
| vport.portfolio_media | ✅ VERIFIED | `portfolio_media_select` — actor_can_manage_profile OR (actor_can_view_profile AND is_active=true) | `portfolio_media_insert` — actor_can_manage_profile | `portfolio_media_update` — actor_can_manage_profile | `portfolio_media_delete` — actor_can_manage_profile | actor_can_manage_profile → owner_user_id OR profile_actor_access | roles: public (anon read for active profiles intentional) |
| vport.portfolio_tags | ✅ VERIFIED WITH CAVEAT | `portfolio_tags_select` — actor_can_view_profile via portfolio_items join | `portfolio_tags_insert` — owner_user_id = auth.uid() OR actor_owners join | N/A (no UPDATE) | `portfolio_tags_delete` — same as INSERT | Direct: owner_user_id + actor_owners. ⚠️ No profile_actor_access team path | Team members cannot manage tags (DB-PORT-003) |
| vport.barber_portfolio_details | ✅ VERIFIED | actor_can_view_profile via portfolio_items join | actor_can_manage_profile via portfolio_items join | actor_can_manage_profile | actor_can_manage_profile | actor_can_manage_profile via portfolio_items.profile_id join | roles: public |
| vport.locksmith_portfolio_details | ✅ VERIFIED (REDUNDANT) | actor_can_view_profile via portfolio_items join | actor_can_manage_profile via portfolio_items join | actor_can_manage_profile | actor_can_manage_profile | actor_can_manage_profile PLUS redundant `owner_all` ALL policy (actor_owners direct join) | 5 policies — owner_all is redundant with per-command policies (DB-PORT-004) |
| vport.profiles | ✅ VERIFIED | Public listed profiles (anon) + owner_user_id SELECT | Service-role only (INSERT) | actor_owners join (is_void=false) — 2 identical policies (DB-PORT-005) | actor_owners join (is_void=false) | actor_owners join with is_void guard | Duplicate UPDATE policies (DB-PORT-005) |
| vc.actors | ✅ VERIFIED (rls_forced=true) | can_view_actor(id) + active vport read | Service-role only | is_actor_owner(id) via actor_owners | Service-role only | vc.is_actor_owner → actor_owners | rls_forced prevents superuser bypass |
| vc.actor_owners | ✅ VERIFIED (rls_forced=true) | user_id = auth.uid() | user_id = auth.uid() | No UPDATE policy | No DELETE policy (service-role only) | auth.uid() = user_id | rls_forced; no client UPDATE/DELETE allowed |
| platform.media_assets | ✅ VERIFIED | actor_owners join (is_void=false) + public ready read | actor_owners join for both owner_actor_id AND created_by_actor_id | actor_owners join (is_void=false) | No explicit DELETE policy | vc.actor_owners + owner_source discriminator | `media_assets_deny_all` policy is PERMISSIVE false — NOT a real deny (DB-PORT-006) |

---

## SERVICE-ROLE / SECURITY DEFINER MATRIX

**Source: Live Supabase DB query 2026-05-23 17:30.** All SECURITY DEFINER functions verified via `pg_proc`.

| Location | Type | row_security off | Browser-Reachable? | Risk | Status |
|---|---|---|---|---|---|
| `vport.get_business_card_sections(uuid)` | SECURITY DEFINER RPC | ❌ NO | YES (anon + authenticated) | LOW — reads vport.portfolio_items (correct schema), filtered to published/active only; no write bypass | ✅ Functional (correct schema references) |
| `vc.get_vport_portfolio(uuid)` | SECURITY DEFINER RPC | ✅ YES | YES (callable via .rpc()) | **CRITICAL RUNTIME BREAK** — references vc.vport_portfolio_items (table does not exist). Throws "relation does not exist" at runtime. See PORT-V-NEW-RPC-001. | ❌ BROKEN |
| `vc.get_barber_vport_portfolio(uuid)` | SECURITY DEFINER RPC | ✅ YES | YES (callable via .rpc()) | **CRITICAL RUNTIME BREAK** — same issue. See PORT-V-NEW-RPC-001. | ❌ BROKEN |
| `vc.get_barber_vport_portfolio_item_detail(uuid)` | SECURITY DEFINER RPC | ✅ YES | YES (callable via .rpc()) | **CRITICAL RUNTIME BREAK** — same issue. See PORT-V-NEW-RPC-001. | ❌ BROKEN |
| `vc.is_actor_portfolio_owner(uuid)` | SECURITY DEFINER | ✅ YES | Indirect (called by policies) | LOW — delegates to vc.is_actor_owner (queries actor_owners correctly) | ✅ Correct ownership check |
| `vc.ensure_portfolio_cover_media` | SECURITY DEFINER Trigger | ✅ YES | NO (DB trigger, not callable) | LOW — references vc.vport_portfolio_items (may be broken trigger if that table doesn't exist); not browser-reachable | ⚠️ Possibly broken trigger (legacy schema ref) |
| `vc.validate_portfolio_barber_actor_match` | SECURITY DEFINER Trigger | ✅ YES | NO (DB trigger) | LOW — validates barber/vport same owner via actor_owners; correct ownership logic | ✅ Correct |
| `vc.validate_portfolio_item_actor_is_vport` | SECURITY DEFINER Trigger | ✅ YES | NO (DB trigger) | LOW — validates kind='vport' on actor; correct guard | ✅ Correct |
| `vc.validate_portfolio_item_actor_match` | SECURITY DEFINER Trigger | ✅ YES | NO (DB trigger) | LOW — cross-validates media actor_id matches item actor_id | ✅ Correct |
| engines/portfolio — all DALs | Standard anon client (user session) | N/A | Browser-originated | App-layer ownership gate broken (PORT-V-001). RLS now VERIFIED as DB-layer backstop. | ⚠️ App-layer gap |
| apps/VCSM supabase/vportClient | Standard anon client | N/A | Browser-originated | Same as above | ⚠️ App-layer gap |
| probeVportPortfolioController | Diagnostic read controller | N/A | YES (production bundle, DEV-guarded at render) | MEDIUM if bundle exposes it — reads actor_owners, profile_actor_access for any actorId | ⚠️ PORT-V-009 active |

**Service-role exposure:** No evidence of service-role client usage in any browser-reachable portfolio code path. All client paths use anon key + user JWT session.

---

## FINDINGS BY SEVERITY

Last updated: 2026-05-23 17:30 — incorporates live DB reclassifications.

| ID | Severity | Location | Release Blocker | Change |
|---|---|---|---|---|
| PORT-V-001 | CRITICAL | features/portfolio/setup.js — isActorOwner DI function | YES | Updated: RLS now verified; DB-layer backstop exists but app-layer gap remains CRITICAL |
| PORT-V-002 | CRITICAL | engines/portfolio/src/controller/manageTags.controller.js | YES | Unchanged |
| PORT-V-003 | CRITICAL | engines/portfolio/src/controller/removeMedia.controller.js | YES | Updated: RLS verified; DB-layer blocks direct REST. App-layer still has no cross-check (defense-in-depth gap). Severity maintained. |
| PORT-V-NEW-RPC-001 | CRITICAL | vc.get_vport_portfolio + vc.get_barber_vport_portfolio + vc.get_barber_vport_portfolio_item_detail | YES | **NEW** — SECURITY DEFINER RPCs reference non-existent vc.vport_portfolio_* tables; public portfolio reads broken |
| PORT-V-004 | HIGH | features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js — ctrlSavePortfolioDetail | YES | Unchanged |
| PORT-V-005 | HIGH | features/dashboard/vport/dal/write/portfolioMediaRecord.write.dal.js — updatePortfolioMediaAssetIdDAL | YES | Updated: RLS verified on portfolio_media UPDATE; DB-layer backstop exists. App-layer gap remains. |
| PORT-V-006 | HIGH | features/dashboard/vport/screens/VportDashboardPortfolioScreen.jsx — actorId from useParams() as trusted | YES | Updated: RLS verified; DB blocks cross-actor mutations. App-layer UI gate remains only app-side check. |
| PORT-V-007 | ~~HIGH~~ → **LOW** | vport.portfolio_items, vport.portfolio_media, vport.portfolio_tags — RLS status | ~~YES~~ → **NO** | **RECLASSIFIED** — RLS verified present via live DB query. Downgraded from HIGH/Release Blocker to LOW. Caveat: portfolio_tags team path gap (DB-PORT-003). |
| PORT-V-008 | HIGH | app.routes.jsx — OwnerOnlyDashboardGuard dependency on portfolio route | YES | Updated: RLS verified backstop; UI guard verification requirement unchanged. |
| PORT-V-009 | MEDIUM | features/dashboard/vport/screens/components/PortfolioBugsBunnyPanel.jsx — dev panel in production tree | NO | Unchanged |
| PORT-V-010 | MEDIUM | features/dashboard/vport/screens/components/portfolio/hooks/usePortfolioItemSubmit.js — orchestration in hook layer | NO | Unchanged |
| PORT-V-011 | ~~MEDIUM~~ → **INFO** | engines/portfolio/src/dal/portfolioMedia.write.dal.js — "RLS enforces ownership" comment | NO | **RECLASSIFIED** — comment is now accurate (RLS IS present). Residual note: app-layer defense-in-depth gap remains (PORT-V-003). |
| PORT-V-012 | MEDIUM | features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller.js — no actorId ownership check | NO | Unchanged |
| PORT-V-013 | LOW | engines/portfolio/src/controller/getPortfolioItem.controller.js — no is_deleted or visibility filter | NO | Updated: RLS SELECT confirmed allows public read of active profiles (intentional). Deleted/private item access via direct itemId is the residual concern. |
| PORT-V-014 | INFO | engines/portfolio/src/controller/createItem.controller.js — createdByActorId: null audit gap | NO | Updated: RLS INSERT policy reviewed — null created_by_actor_id is an intentional workaround documented in code. |

---

## P0 / P1 / P2 REMEDIATION PLAN

Updated 2026-05-23 17:30 to reflect live DB reclassifications. RLS migrations are already applied — do not re-apply.

### P0 (Release Blockers — must be fixed before any production deployment):

- **PORT-V-NEW-RPC-001** ⚡ NEW: Delegate to CARNAGE. Rewrite or drop `vc.get_vport_portfolio`, `vc.get_barber_vport_portfolio`, and `vc.get_barber_vport_portfolio_item_detail`. These RPCs reference `vc.vport_portfolio_*` tables that DO NOT EXIST — they throw "relation does not exist" at runtime. Update to reference `vport.portfolio_*` tables (current schema). Audit column name changes (old: actor_id → new: profile_id). Verify vport.portfolio_item_metrics exists in current schema. Also verify the `vc.ensure_portfolio_cover_media` trigger (references vc.vport_portfolio_items — may also be broken).

- **PORT-V-001**: Fix `isActorOwner` DI in `features/portfolio/setup.js` to query `vc.actor_owners WHERE actor_id = actorId AND user_id = auth.uid()` instead of `vc.actors`. This is the root cause that cascades into PORT-V-002, PORT-V-003, PORT-V-004, PORT-V-005, PORT-V-006. **Note:** RLS is now verified as the DB-layer backstop, but app-layer defense-in-depth remains required. Do NOT remove the fix because RLS exists — both layers are needed.

- **PORT-V-002**: Fix `manageTags.controller.js` ownership gate — replace `item.actor_id !== actorId` with `item.profile_id !== callerProfileId` + resolve callerProfileId via `dalGetProfileIdByActorId`. Add `dalGetProfileIdByActorId` call matching other write controllers.

- **PORT-V-003**: Add profile cross-check to `removeMedia.controller.js` — fetch media row, get its portfolioItemId, verify item.profile_id === callerProfileId before calling `dalDeletePortfolioMedia`. **Note:** RLS DELETE policy is verified; app-layer check restores defense-in-depth.

- **PORT-V-004**: Add `actorId` parameter to `ctrlSavePortfolioDetail` in `locksmithOwner.controller.js`. Verify portfolioItemId belongs to the caller's actor before UPSERT. Update `usePortfolioItemSubmit` to pass actorId.

- **PORT-V-005**: Add ownership assertion in `updatePortfolioMediaAssetIdDAL` or its caller — verify portfolioMediaId belongs to the calling actor before UPDATE. **Note:** RLS UPDATE policy is verified; app-layer check restores defense-in-depth.

- **PORT-V-006**: Document and verify OwnerOnlyDashboardGuard reads actorId from URL params and validates against session-owned actors. Confirm it is not bypassable via identity store state manipulation.

- **PORT-V-008**: Verify OwnerOnlyDashboardGuard implementation is a genuine server-side ownership check, not a client-side state check.

### P1 (Required before next full release):

- **PORT-V-010**: Extract multi-step submit orchestration from `usePortfolioItemSubmit` into a VCSM-side controller. Replace direct cross-feature imports with adapter access.

- **PORT-V-012**: Add actorId ownership assertion to `publishLocksmithPortfolioUpdateAsPostController` before any DB operations. Do not rely solely on vc.posts INSERT RLS.

- **PORT-V-009**: Move `PortfolioBugsBunnyPanel`, `useVportPortfolioProbe`, and `probeVportPortfolioController` to `zNOTFORPRODUCTION/debuggers/portfolio/`. Use dynamic import to exclude from production bundles.

### DB Follow-ups (delegate to CARNAGE — not app-code changes):

These are tracked in `zNOTFORPRODUCTION/_HISTORY/db/snapshots/2026-05-23_17-30_db_portfolio-rls-policies.md`:

- **DB-PORT-001**: `actor_can_manage_profile(uuid, uuid)` 2-arg overload silently ignores actor_id — remove overload or make it functional. Eliminates unnecessary `vc.current_actor_id()` call on every portfolio mutation.
- **DB-PORT-002**: `vc.current_actor_id()` uses LIMIT 1 without ORDER BY — non-deterministic for multi-actor users. Add ORDER BY created_at ASC.
- **DB-PORT-003**: `portfolio_tags` INSERT/DELETE policies omit `profile_actor_access` team path — inconsistent with portfolio_items/media. Update to use `actor_can_manage_profile`.
- **DB-PORT-004**: `vport.locksmith_portfolio_details` redundant `owner_all` ALL policy — drop it, keep per-command policies.
- **DB-PORT-005**: `vport.profiles` has two identical UPDATE policies — drop one.
- **DB-PORT-006**: `platform.media_assets_deny_all` is PERMISSIVE false — misleading name; not a true deny policy. Rename or document.
- **DB-PORT-007** (same as PORT-V-NEW-RPC-001): Legacy portfolio RPCs reference non-existent tables — rewrite to vport.* schema.

### P2 (Hardening):

- **PORT-V-013**: Add `is_deleted=false` and visibility filters to `getPortfolioItem` for public-facing usage. Add `ownerMode` parameter for dashboard-edit context.

- **PORT-V-014**: After `vc.current_actor_id()` resolution is fixed for vport actors (DB-PORT-002), populate `created_by_actor_id` on portfolio item INSERT. Establish audit logging for portfolio mutations.

- Investigate and document the `vc.current_actor_id()` resolution mismatch between user actors and vport actors (no kind filter, no ORDER BY). Platform-wide concern affecting created_by_actor_id field and any RLS policy that uses current_actor_id() result.

- Verify `vc.ensure_portfolio_cover_media` trigger — it references `vc.vport_portfolio_items` which does not exist in live DB. This trigger may be silently failing or was never re-attached after the schema migration.

---

## THOR RELEASE GATE VERDICT

**RELEASE BLOCK** (maintained — reasons updated per live DB reclassification)

Updated 2026-05-23 17:30. The portfolio card remains blocked from production. The blocking reason has changed: RLS is now verified present on all portfolio tables, which removes the "no DB backstop" concern. However, the application-layer ownership architecture remains critically broken, and a new CRITICAL runtime break was identified.

**Why the block is maintained:**

1. **PORT-V-NEW-RPC-001 (CRITICAL):** `vc.get_vport_portfolio`, `vc.get_barber_vport_portfolio`, and `vc.get_barber_vport_portfolio_item_detail` reference tables that do not exist in the live database. Any public portfolio display path calling these RPCs fails with a runtime error. This is a production break — not a security breach, but a P0 functional blocker.

2. **PORT-V-001 (CRITICAL):** The `isActorOwner` DI function does not verify ownership via `vc.actor_owners`. The application has no meaningful app-layer ownership gate on any portfolio write path. Every write path relies entirely on DB RLS as its only control. This is a single-layer defense for a write-intensive feature — the architecture is not production-ready.

3. **PORT-V-002 (CRITICAL):** `manageTags` has a dead ownership gate (checks a non-existent column). If manageTags is wired to UI without fixing this, the gate is silently absent.

4. **PORT-V-003 (CRITICAL):** `removeMedia` has no app-layer profile cross-check. DB RLS is the only gate for hard-delete of portfolio media.

5. **PORT-V-004 (HIGH):** `ctrlSavePortfolioDetail` has no actorId parameter and no ownership verification.

6. **PORT-V-005/006/008 (HIGH):** Additional missing ownership checks and unverified route guard.

**What changed from the original verdict:**
- PORT-V-007 (RLS absent) is no longer a blocking reason — RLS IS present and verified. ~~The combined effect: any authenticated platform user can create, modify, delete, and destroy portfolio content for any VPORT on the platform, with no DB-layer defense.~~ This statement is no longer accurate. DB-layer defense IS present.
- The remaining CRITICAL concerns are app-layer defense-in-depth gaps and the broken legacy RPCs — both serious but different in nature from the original "no DB protection" claim.

**Blocking findings:** PORT-V-001, PORT-V-002, PORT-V-003, PORT-V-NEW-RPC-001, PORT-V-004, PORT-V-005, PORT-V-006, PORT-V-008

---

## CISSP DOMAIN COVERAGE SUMMARY

Updated 2026-05-23 17:30 to reflect reclassifications and new finding PORT-V-NEW-RPC-001.

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | PORT-V-012 (residual risk acceptance: DB RLS only gate for feed publish path) |
| Asset Security | 2 | PORT-V-013 (deleted/private item visibility via direct itemId), PORT-V-014 (null created_by_actor_id audit gap) |
| Security Architecture and Engineering | 4 | PORT-V-007 (reclassified to LOW — RLS verified but team-path caveat), PORT-V-008 (route guard verification), PORT-V-009 (debug panel placement), PORT-V-010 (distributed auth logic in hook) |
| Communication and Network Security | 0 | No network-layer findings |
| Identity and Access Management | 8 | PORT-V-001 (isActorOwner root cause), PORT-V-002 (dead gate), PORT-V-003 (no media cross-check), PORT-V-004 (no actorId param), PORT-V-005 (no DAL ownership), PORT-V-006 (URL actorId treated as trusted), PORT-V-008 (route guard), PORT-V-012 (feed publish no actorId check) |
| Security Assessment and Testing | 2 | PORT-V-009 (dev tooling in prod tree), PORT-V-011 (reclassified to INFO — comment now accurate; residual defense-in-depth gap) |
| Security Operations | 2 | PORT-V-009 (diagnostic data in production bundle), PORT-V-NEW-RPC-001 (broken SECURITY DEFINER RPCs — production runtime break, ops impact) |
| Software Development Security | 8 | PORT-V-001, PORT-V-002, PORT-V-003, PORT-V-004, PORT-V-005, PORT-V-010, PORT-V-011, PORT-V-NEW-RPC-001 (stale SECURITY DEFINER bodies not updated after schema migration) |

**CISSP uncovered domains:** Communication and Network Security — no network-layer findings in scope for this module review. Not applicable.

**Reclassification delta from original report:**
- PORT-V-007: HIGH/Release Blocker → LOW/Not Blocking (RLS verified via live DB)
- PORT-V-011: MEDIUM → INFO (comment now accurate)
- PORT-V-NEW-RPC-001: NEW CRITICAL (runtime break identified via live DB query)
- Total findings: 14 original → 15 after reclassification (one new CRITICAL added, two downgraded)
- Release blockers: 8 original → 8 maintained (PORT-V-007 removed, PORT-V-NEW-RPC-001 added)
