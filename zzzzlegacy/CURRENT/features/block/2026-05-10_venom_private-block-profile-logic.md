# VENOM SECURITY AUDIT — Private Profile & Block/Follow Enforcement
**Date:** 2026-05-10
**Auditor:** VENOM (Security Sheriff)
**Scope:** `apps/VCSM/` — block system, private profile gate, follow system, post detail bypass
**Mode:** Read-only analysis. No code modifications made.

---

## FINDING 001

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/block/dal/block.read.dal.js — fetchActorsWhoBlockedMe()
- Application Scope: VCSM
- Current behavior: fetchActorsWhoBlockedMe(actorId) queries moderation.blocks
  WHERE blocked_actor_id = actorId AND status = 'active' and returns all
  blocker_actor_ids. There is no RLS or controller guard preventing any
  authenticated actor from calling this directly with any arbitrary actorId.
  The function is exported from the DAL with no access gate.
- Risk: Block list enumeration. An actor can discover the complete list of
  actors who have blocked any other specific actor by passing a third-party
  actorId. Combined with fetchActorsIBlocked(), this allows a caller to map
  the full bidirectional block graph for any actor — not just themselves.
- Severity: HIGH
- Why it matters: A blocked actor could enumerate who has blocked them,
  circumventing the concealment intent of the block. In a social platform,
  block list visibility is a safety concern — domestic abuse or harassment
  scenarios can be exacerbated if a blocked user learns they are blocked.
- Recommended mitigation: Add an ownership assertion at the controller layer:
  the only valid actorId for fetchActorsWhoBlockedMe / fetchActorsIBlocked
  is the caller's own session actorId. This must be enforced server-side
  via Supabase RLS: moderation.blocks should only allow a row to be selected
  if auth.uid() maps to either the blocker OR the blocked actor in that row.
- Rationale: Defense in depth. Client-side guards are bypassable via direct
  API calls. Only RLS provides a server-enforced boundary.
- Follow-up command: /Carnage — add RLS policy to moderation.blocks:
  USING (blocker_actor_id = auth.uid()::uuid OR blocked_actor_id = auth.uid()::uuid)
```

---

## FINDING 002

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/block/controllers/blockActor.controller.js
            apps/VCSM/src/features/block/hooks/useBlockActions.js
- Application Scope: VCSM
- Current behavior: blockerActorId is passed as a prop/argument from the
  calling hook or component. In useBlockActions.js the hook receives
  myActorId as a parameter. In BlockButton.jsx this is correctly sourced
  from useIdentity(). However, in ActorActionsMenu.jsx (adapter UI), the
  viewerActorId is received as an incoming prop — it is not internally
  fetched from useIdentity(). The consumer is expected to pass the correct
  identity. The controller receives this actorId without verifying it
  against the current session.
- Risk: If a consumer component passes an arbitrary viewerActorId prop
  (e.g., the targetActorId by mistake, or a spoofed value), the block write
  path (the RPC moderation.block_actor) will be called with that identity.
  The actual RPC-level enforcement depends entirely on Supabase RLS on the
  RPC itself.
- Severity: MEDIUM
- Why it matters: The app-layer controller blockActorController() has a
  self-block guard (blockerActorId === blockedActorId → throw) and a
  missing-id guard. But there is no session-to-actorId binding check.
  If RLS on the RPC correctly enforces auth.uid() == p_blocker_actor_id,
  this is mitigated server-side. If it does not, a caller could block on
  behalf of another actor.
- Recommended mitigation: (1) Confirm that the moderation.block_actor RPC
  has server-side enforcement: SECURITY DEFINER with CHECK(auth.uid()::uuid
  = p_blocker_actor_id). (2) In the controller, add a session check —
  retrieve the current Supabase auth user and assert blockerActorId matches.
- Rationale: Defense in depth. The controller is the business logic layer;
  it should own the session binding assertion, not trust callers.
- Follow-up command: /DB — verify block_actor and unblock_actor RPC SECURITY
  definitions include auth.uid() == p_blocker_actor_id enforcement.
```

---

## FINDING 003

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/block/controllers/blockActor.controller.js
            — unblockActorController()
- Application Scope: VCSM
- Current behavior: unblockActorController(blockerActorId, blockedActorId) calls
  unblockActorDAL() directly without first verifying that a block row owned by
  blockerActorId actually exists. There is no ownership check before the unblock
  RPC fires.
- Risk: An actor could call unblockActorController with any pair of actorIds
  (not just their own block rows) and attempt to unblock a relationship they did
  not create. Whether this succeeds depends entirely on the RPC's internal WHERE
  clause.
- Severity: MEDIUM
- Why it matters: Compare blockActorController — it does a checkBlockStatus()
  pre-read before writing. unblockActorController has no equivalent guard. This
  is an inconsistency in the ownership verification pattern across sibling
  operations. Even if the RPC restricts by auth.uid(), the lack of a controller-
  level ownership assertion is an architecture contract violation.
- Recommended mitigation: Before calling unblockActorDAL, call checkBlockStatus
  and assert blockedByMe === true. If the caller does not own the block row,
  return an error rather than forwarding to the RPC.
- Rationale: Write paths must verify ownership at the controller layer before
  touching the DAL. The DAL is a dumb adapter; ownership is a business rule.
- Follow-up command: /Wolverine — add pre-check to unblockActorController.
```

---

## FINDING 004

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/feed/dal/feed.read.blockRows.dal.js
            apps/VCSM/src/features/feed/dal/feed.read.followRows.dal.js
- Application Scope: VCSM
- Current behavior: Both DALs maintain a 60-second TTL client-side cache keyed
  by viewerActorId. The cache is populated on first read and served for all
  subsequent reads within the TTL window. The exported invalidation functions
  (invalidateFeedBlockCache, invalidateFeedFollowCache) are defined but have
  ZERO call sites outside the DAL files themselves — confirmed by grep.
- Risk: After a block or unblock action, the feed block cache is not invalidated.
  The blocked actor's posts can remain visible in the feed for up to 60 seconds.
  After an unfollow, the unfollowed actor's private posts can remain visible in
  the feed for up to 60 seconds. These are real windows during which a fresh
  block does not protect the blocker from seeing the blocked actor's content.
- Severity: HIGH
- Why it matters: A user blocks an abusive actor. For up to 60 seconds, that
  actor's posts remain visible. For the unfollow case: a user who was following
  a private account unfollows — for up to 60 seconds they can still see private
  posts in the cached feed. The feed model correctly applies the visibility check
  at render time, but it consults the stale cached block/follow rows.
- Recommended mitigation: Call invalidateFeedBlockCache(viewerActorId) from
  blockActorController and unblockActorController immediately after the write
  succeeds. Call invalidateFeedFollowCache(viewerActorId) from ctrlUnsubscribe
  immediately after deactivating the follow edge. These functions exist but are
  orphaned — they must be wired into the write paths.
- Rationale: Cache invalidation on write is a fundamental data consistency
  requirement for any safety-affecting cache. Block state is safety-critical.
- Follow-up command: /Wolverine — wire invalidateFeedBlockCache into
  blockActorController / unblockActorController; wire invalidateFeedFollowCache
  into ctrlUnsubscribe.
```

---

## FINDING 005

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js
- Application Scope: VCSM
- Current behavior: The actor bundle cache (30s TTL, keyed per actor:${actorId})
  stores is_private alongside actor profile data. When a user toggles their
  privacy setting (public → private or private → public), this cache is not
  invalidated. The invalidateActorsBundleCache() function has no call sites
  in the privacy write path (confirmed: ctrlSetActorPrivacy does not call it).
- Risk: After a user switches their profile to private, the feed bundle cache
  retains the old is_private=false value for up to 30 seconds. During this
  window, non-following actors can still see the newly-private user's posts
  in their feed — because feedRowVisibilityModel reads isPrivate from the
  stale cached bundle.
- Severity: MEDIUM
- Why it matters: A user who switches to private expects immediate effect.
  The 30-second window is short but exploitable: a non-follower who has the
  newly-private actor's posts on screen (or refreshes the feed) during this
  window will see posts that should now be gated.
- Recommended mitigation: Call invalidateActorsBundleCache() (or the targeted
  per-actor invalidation) from ctrlSetActorPrivacy after the DB write succeeds.
  Also call invalidateActorPrivacyCache() from the same location — this function
  exists in actorPrivacy.dal.js but has only one call site (its own file) and
  is not called from the settings controller.
- Rationale: Privacy writes must bust the actor bundle cache and the
  actor-privacy-settings cache simultaneously.
- Follow-up command: /Wolverine — add cache bust to ctrlSetActorPrivacy.
```

---

## FINDING 006

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/post/postcard/dal/post.read.dal.js — fetchPostByIdDAL()
            apps/VCSM/src/features/post/postcard/controller/getPostById.controller.js
            apps/VCSM/src/features/post/postcard/hooks/usePostDetailPost.js
            apps/VCSM/src/features/post/screens/PostDetail.view.jsx
- Application Scope: VCSM
- Current behavior: PostDetail fetches a post by ID using fetchPostByIdDAL()
  which queries vc.posts with no viewer context, no follow check, no block check,
  and no privacy gate. The DAL only filters deleted_at IS NULL. The controller
  getPostById() performs no visibility enforcement. The view usePostDetailPost()
  calls getPostById(postId) with only the postId from URL params — viewerActorId
  is derived from useIdentity() in the view layer but is NEVER passed to the
  controller or DAL.
- Risk: A viewer can navigate directly to /post/<postId> for a post authored by
  a private actor they do not follow, and the post will render in full. The
  private gate that exists in the feed (feedRowVisibilityModel) is completely
  absent in the PostDetail path. Similarly, a blocked actor can access any post
  by direct URL — the block gate in the feed does not apply here.
- Severity: CRITICAL
- Why it matters: Private profile enforcement at the feed level can be entirely
  bypassed by direct deep-link. Any post URL shared (e.g., via QR or external
  link) exposes the post to anyone who has it, regardless of the author's
  privacy setting or whether a block relationship exists. This is a complete
  bypass of both the private gate and the block gate for post content.
- Recommended mitigation: The getPostById controller must accept viewerActorId,
  then: (1) fetch the post's actor_id, (2) check block status between viewer and
  post author — if blocked in either direction, return null, (3) fetch
  actor_privacy_settings for the post author, (4) if private, verify the viewer
  follows the author via dalGetFollowStatus — if not, return null. Only then
  return the post. This enforcement must live at the controller layer, not the
  view. Alternatively, enforce this in Supabase RLS on vc.posts (preferred).
- Rationale: The feed's visibility model is a client-side presentation filter.
  It cannot protect content accessed by direct URL. Content access must be
  enforced at the data access layer.
- Follow-up command: /Carnage — add RLS policy to vc.posts for private actor
  enforcement; /Wolverine — add viewerActorId to getPostById controller.
```

---

## FINDING 007

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js
            apps/VCSM/src/features/profiles/controller/post/getActorPosts.controller.js
            apps/VCSM/src/features/profiles/screens/views/ActorProfilePostsView.jsx
- Application Scope: VCSM
- Current behavior: ActorProfilePostsView loads posts via useActorPosts(profileActorId)
  → getActorPostsController({ actorId }) → fetchPostsForActorDAL({ actorId }).
  The DAL queries vc.posts WHERE actor_id = actorId with no viewer context, no
  privacy check, no follow status verification, and no block check.
  The ActorProfileViewScreen wraps this view inside a gate check (useProfileGate),
  and the posts tab is conditionally rendered only if canViewContent is true.
  However, useActorPosts is called unconditionally on line 62 of
  ActorProfilePostsView — it does not receive canViewContent.
- Risk: The profile-level gate (useProfileGate → canView) controls whether the
  tab content is *rendered* in the UI. But useActorPosts fetches the posts
  regardless of whether the gate is open — the React Query query fires as soon
  as actorId is truthy (enabled: !!actorId). Posts for a private, non-followed
  actor are loaded into memory even if the tab is hidden behind a privacy wall.
  Additionally, this path has no block check at the data layer.
- Severity: HIGH
- Why it matters: Data should not be fetched for an actor whose posts a viewer
  is not authorized to see. Even if the UI hides the posts, the network request
  is made and the data is accessible in React Query's cache (queryClient),
  DevTools, or intercepted via browser network tab. A determined user can
  extract the post data without the UI gate.
- Recommended mitigation: (1) Add enabled: !!actorId && canViewContent to the
  useInfiniteQuery in useActorPosts (or gate the call at the view layer).
  (2) Enforce privacy and block status at the DAL/controller level, not only
  in UI rendering. (3) Enforce via Supabase RLS (preferred server-side gate).
- Rationale: Client-side rendering gates are not data access controls. React
  Query fetches data regardless of render state unless explicitly gated via
  the enabled flag.
- Follow-up command: /Wolverine — add enabled gate to useActorPosts; /Carnage
  — RLS on vc.posts.
```

---

## FINDING 008

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/notifications/types/follow/FollowRequestItem.view.jsx
- Application Scope: VCSM
- Current behavior: When a follow request notification is rendered, targetActorId
  is read from notification.context.targetActorId — a value stored in the
  notification payload at the time the request was created. The user clicks
  Accept, and ctrlAcceptFollowRequest({ requesterActorId, targetActorId }) fires.
  The controller does not verify that the calling session's actorId equals
  targetActorId before executing the accept/decline.
- Risk: If notification.context.targetActorId is tampered with or points to a
  different actor (e.g., via a crafted notification payload or a stale/corrupt
  notification), the accept action could create a follow edge between two actors
  the session user has no authority over. The RLS on vc.social_follow_requests
  and vc.actor_follows is the only defense.
- Severity: MEDIUM
- Why it matters: The controller should pin targetActorId to the authenticated
  session's actorId rather than trusting a value from the notification payload.
  An attacker who can inject or manipulate notification context data could
  potentially trigger follow edge creation on behalf of another actor.
- Recommended mitigation: In ctrlAcceptFollowRequest, retrieve the current
  session actorId (supabase.auth.getUser()) and assert targetActorId === session
  actorId before proceeding. This makes the accept/decline operations self-
  referential — the caller can only act as themselves.
- Rationale: Trust boundaries require that write operations validate identity
  from the session, not from untrusted payload data.
- Follow-up command: /Wolverine — add session assertion to ctrlAcceptFollowRequest
  and ctrlDeclineFollowRequest.
```

---

## FINDING 009

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/social/friend/subscribe/controllers/follow.controller.js
            — ctrlSubscribe()
- Application Scope: VCSM
- Current behavior: ctrlSubscribe({ followerActorId, followedActorId }) calls
  ctrlGetFollowRelationshipState() which reads isPrivate from ctrlGetActorPrivacy()
  → dalGetActorPrivacy() (vc.actor_privacy_settings). If isPrivate is false,
  dalInsertFollow() is called directly to create an active follow edge —
  no approval step. If isPrivate is true, a follow request is created via
  ctrlSendFollowRequest() which sets status='pending'. The follow edge is NOT
  created until ctrlAcceptFollowRequest() runs.
- Risk: The follow approval gate is correctly implemented for private accounts
  (request → pending → accept → insert follow edge). However, dalInsertFollow()
  does an UPSERT that can reactivate a previously deactivated follow edge
  (onConflict: 'follower_actor_id,followed_actor_id' sets is_active: true).
  If an actor previously followed a public account and then unfollowed, and the
  account later switches to private, re-following still goes through the public
  path immediately — because the privacy check fires at follow initiation time
  against the current cached privacy value (30s TTL on actorPrivacy.dal.js).
- Risk: No immediate private gate bypass — the approved flow is correct for
  clean follow paths. The upsert reactivation path is a concern: if the cache
  still shows is_private=false for a newly-private account, ctrlSubscribe will
  bypass the request gate and directly reactivate the follow edge.
- Severity: MEDIUM (combined with FINDING 005 — the 30s privacy cache window)
- Why it matters: The 30-second window where is_private=false is cached (FINDING
  005) means that in the brief window after an account switches to private,
  ctrlSubscribe will bypass the request flow and directly insert an active follow
  edge for any actor who initiates a follow during that window.
- Recommended mitigation: (1) Fix FINDING 005 (cache bust on privacy toggle).
  (2) Consider re-reading privacy from the DB (not cache) inside ctrlSubscribe
  before the write, since the stakes here are access control, not performance.
- Rationale: The privacy gate in the follow path relies on cached data. Cache
  staleness on a security-relevant flag creates a bypass window.
- Follow-up command: /Wolverine — consider cache bypass for privacy read inside
  ctrlSubscribe.
```

---

## FINDING 010

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js
- Application Scope: VCSM
- Current behavior: assertModerationAccessDAL checks learning.platform_admins
  to authorize moderation actions (hide post, dismiss report). If the table
  does not exist (error code 42P01), the function returns false (no access) —
  correct. But if any OTHER database error occurs, _isModerationAuthorized()
  catches the error and returns false (line: catch { return false }). The
  assertModerationAccessDAL then throws a FORBIDDEN error. This means DB
  connectivity failures silently block all moderation, which is correct for
  safety. However, moderators table (moderation.moderators) is referenced in
  comments as "extend the query here when that table is created" — it is NOT
  currently checked.
- Risk: If a moderation.moderators table is created later without updating
  this DAL, actors in that table will have no moderation access. This is a
  documentation/future-state risk rather than an active vulnerability.
  More critically: the authorization check reads from learning.platform_admins,
  which is a cross-schema dependency (learning → moderation). An actor with
  write access to learning.platform_admins can escalate to moderation privileges.
- Severity: LOW (current state) / MEDIUM (if learning.platform_admins write
  is not properly RLS-restricted)
- Why it matters: Cross-schema privilege escalation is possible if
  learning.platform_admins lacks proper RLS. The moderation system's auth
  gate depends on a table from a different domain.
- Recommended mitigation: (1) Add moderation.moderators table and update
  assertModerationAccessDAL to check it. (2) Confirm learning.platform_admins
  has RLS that restricts INSERT/UPDATE to superadmin-level roles only. (3)
  Consider consolidating admin roles into a single auth table to eliminate
  cross-schema dependency.
- Rationale: Authorization sources should be single-domain and clearly owned.
  Cross-schema auth checks create implicit coupling and escalation vectors.
- Follow-up command: /DB — audit learning.platform_admins RLS policies.
```

---

## FINDING 011

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/settings/privacy/dal/blocks.dal.js — dalListMyBlocks()
            apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js — ctrlListMyBlocks()
- Application Scope: VCSM
- Current behavior: dalListMyBlocks({ actorId }) queries moderation.blocks WHERE
  blocker_actor_id = actorId AND status = 'active'. This correctly scopes to
  the caller's own blocks. ctrlListMyBlocks verifies actorId is present and
  scope is valid. The actorId is passed from useBlockedCitizens() which receives
  it as a prop from the calling component.
- Risk: The controller does not bind actorId to the session. If a consumer
  passes a different actor's actorId, the controller will return that actor's
  block list. This is analogous to FINDING 001 but on the Settings read path
  rather than the feed read path.
- Severity: MEDIUM
- Why it matters: An actor's block list is sensitive — it reveals who they
  have chosen to block. Session binding at the controller layer prevents
  components from accidentally (or maliciously) exposing another actor's list.
- Recommended mitigation: In ctrlListMyBlocks, assert actorId matches the
  current Supabase auth session (supabase.auth.getUser()). RLS on
  moderation.blocks should also enforce blocker_actor_id = auth.uid()::uuid
  for SELECT operations.
- Rationale: Sensitive read paths must verify the caller is requesting their
  own data, not any arbitrary actor's data.
- Follow-up command: /Carnage — add RLS SELECT policy to moderation.blocks.
```

---

## SUMMARY TABLE

| # | Area | Severity | Short Description |
|---|------|----------|-------------------|
| 001 | Block enumeration | HIGH | fetchActorsWhoBlockedMe has no caller ownership guard |
| 002 | Block write ownership | MEDIUM | blockerActorId not verified against session in controller |
| 003 | Unblock ownership | MEDIUM | unblockActorController has no pre-ownership check |
| 004 | Feed block/follow cache orphaned | HIGH | invalidateFeedBlockCache / invalidateFeedFollowCache never called on write |
| 005 | Actor bundle privacy cache | MEDIUM | Privacy toggle does not bust actor bundle or privacy cache |
| 006 | PostDetail bypasses all gates | CRITICAL | Direct URL to any post bypasses private gate and block gate |
| 007 | Profile posts fetched regardless of gate | HIGH | useActorPosts fires unconditionally; private posts hit the wire |
| 008 | Follow request accept trusts payload actorId | MEDIUM | targetActorId from notification context is not session-verified |
| 009 | Follow path uses cached privacy | MEDIUM | 30s stale cache can bypass private-account request gate |
| 010 | Moderation auth cross-schema dependency | LOW | Auth gate depends on learning schema; moderation.moderators table missing |
| 011 | Block list read path no session binding | MEDIUM | ctrlListMyBlocks does not bind actorId to session |

---

## PRIORITY ORDER FOR REMEDIATION

1. **FINDING 006 — CRITICAL** — PostDetail bypasses all gates. This is the highest-risk finding. Enforce at DB level (RLS on vc.posts) and at controller level.
2. **FINDING 004 — HIGH** — Feed block/follow cache is never invalidated on write. Simple wire-up fix; high safety impact.
3. **FINDING 001 — HIGH** — Block list enumeration. Needs RLS on moderation.blocks.
4. **FINDING 007 — HIGH** — Profile posts fetched unconditionally. Add `enabled` gate and RLS.
5. **FINDING 002 / 003 / 008 / 011 — MEDIUM** — Session binding on write/read paths. Controller-level hardening.
6. **FINDING 005 / 009 — MEDIUM** — Cache staleness on privacy toggle creating bypass windows.
7. **FINDING 010 — LOW** — Cross-schema auth dependency. Structural cleanup.

---

*This report reflects the state of the codebase as of 2026-05-10. No code was modified during this audit.*
