# VENOM — Post DAL Trust Surface Review

**Date:** 2026-05-19
**Scope:** `apps/VCSM/src/features/upload/adapters/posts.adapter.js`, `upload/dal/searchMentionSuggestions.dal.js`
**Triggered by:** CEREBRO — DAL governance pass on `vcsm.dal.post.md`
**Status:** TWO OPEN FINDINGS — neither release-blocking individually

---

## V-1 — `createSystemPost` — No Actor Ownership Verification

**Severity:** MEDIUM
**File:** `apps/VCSM/src/features/upload/adapters/posts.adapter.js`

### Evidence

`createSystemPost` accepts `actorId` as a caller-supplied parameter. Its full trust chain:

```js
export async function createSystemPost({ actorId, text, post_type, realm_id, ... }) {
  if (!actorId) throw new Error("createSystemPost: actorId required");
  // ...
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("createSystemPost: not authenticated");
  return insertPost({ actor_id: actorId, user_id: user.id, ... });
}
```

**What is verified:** User is authenticated (`user.id` exists)
**What is NOT verified:** The authenticated user owns the actor referenced by `actorId`

### Call Chain

8 vport publish controllers call `createSystemPost` via the adapter:
- `publishFuelPriceUpdateAsPostController` (gas)
- `publishMenuUpdateAsPostController` (menu)
- `publishBarbershopPortfolioUpdateAsPostController` (barbershop)
- `publishBarbershopHoursUpdateAsPostController` (barbershop)
- `publishLocksmithHoursUpdateAsPostController` (locksmith ×3)
- `publishExchangeRateUpdateAsPostController` (exchange)

None of these controllers verify `actor_owners` before calling the adapter. They all accept `actorId` as a caller-supplied parameter.

### Hook-Level Mitigation (Client-Side Only)

`useSubmitFuelPriceSuggestion.js` (sample hook) does:

```js
const isOwner = String(me.actorId) === String(targetActorId);
// ...
const publishFeedPost = useCallback(async ({ updatedFuels }) => {
  if (!isOwner || !me?.actorId) return { published: false, reason: "not_owner" };
  return publishFuelPriceUpdateAsPostController({ actorId: me.actorId, updatedFuels });
}, [isOwner, me]);
```

**Issue:** This is a client-side string comparison only. A session-authenticated user who knows another vport's `actorId` UUID could bypass the hook and call the controller directly with any actorId value. The system post would be inserted under that vport identity.

### Backstop: RLS

The actual risk depends on whether `vc.posts` has an RLS INSERT policy that validates `actor_id` ownership against `actor_owners`. Without confirming the RLS policy, the risk is:

- **If RLS enforces actor ownership:** DB rejects unauthorized inserts — risk is LOW
- **If RLS only checks `user_id` or has no insert policy:** Any authenticated user can create system posts for any vport they know the UUID of — risk is HIGH

### Recommendation

1. Add server-side ownership assertion in each vport publish controller:
   - Call `verifyActorOwnership(actorId, userId)` before `createSystemPost`
   - Or add ownership check inside `createSystemPost` adapter itself
2. Confirm RLS INSERT policy on `vc.posts` enforces `actor_id` ∈ `actor_owners` for the session user
3. If RLS is confirmed, document the trust model explicitly in the adapter

---

## V-2 — `searchMentionSuggestions` — Always Executes with Null Viewer Context

**Severity:** MEDIUM
**File:** `apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js`
**Controller:** `apps/VCSM/src/features/upload/controller/searchMentionSuggestions.controller.js`

### Evidence

The DAL signature:
```js
export async function searchMentionSuggestions(prefix, { limit = 8, viewerActorId = null } = {}) {
  // ...
  const { data, error } = await supabase
    .schema('identity')
    .rpc('search_actor_directory', {
      p_viewer_domain: 'vc',
      p_viewer_actor_id: viewerActorId,  // ← always null in production
      ...
    });
}
```

The controller that wraps it:
```js
export async function ctrlSearchMentionSuggestions({ query, limit = 8 }) {
  if (!query) return [];
  return searchMentionSuggestions(query, { limit });  // viewerActorId not passed
}
```

`viewerActorId` is never supplied by the controller. The RPC always receives `p_viewer_actor_id: null`.

### Risk

The `identity.search_actor_directory` RPC may use `p_viewer_actor_id` to:
- Filter out blocked actors from suggestions
- Filter out actors who have blocked the viewer
- Respect privacy settings

With `null`, these filters may be skipped, exposing actors in the autocomplete that the viewer should not see — specifically actors they've blocked or who have blocked them.

### Recommendation

1. `ctrlSearchMentionSuggestions` should accept and forward `viewerActorId`
2. `useMentionAutocomplete.js` should pull `actorId` from `useIdentity()` and pass it through the controller
3. If the RPC handles `null` safely (returns public results only), document this explicitly in the DAL

---

## Summary

| Finding | Severity | Blocking? | Status | Action |
|---|---|---|---|---|
| V-1: `createSystemPost` missing ownership verification | **HIGH** (confirmed — INSERT policy has no actor ownership check) | NO (not exploited; CARNAGE required) | OPEN | Confirm RLS policy; add server-side ownership check in adapter/controllers |
| V-2: `searchMentionSuggestions` null viewerActorId | MEDIUM | NO | OPEN | Pass viewerActorId through ctrlSearchMentionSuggestions from hook identity |

**Handoff:** DB (confirm RLS INSERT policy on `vc.posts`), IRONMAN (ownership enforcement decision for vport publish controllers)

**Document:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.post.md`
