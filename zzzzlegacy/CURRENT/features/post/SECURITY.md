# Post Feature — Security

**Last VENOM audit:** 2026-05-19
**Report:** `CURRENT/features/dashboard/evidence/2026-05-19_venom_post-dal-trust-surfaces.md`
**Triggered by:** CEREBRO — DAL governance pass on `vcsm.dal.post.md`
**Verdict:** TWO OPEN FINDINGS — neither release-blocking individually

---

## Trust Boundary Overview

The post feature has two trust surfaces reviewed by VENOM:

1. `createSystemPost` in `apps/VCSM/src/features/upload/adapters/posts.adapter.js`
2. `searchMentionSuggestions` in `apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js`

---

## V-1 — `createSystemPost`: No Actor Ownership Verification

**Severity:** HIGH (confirmed — INSERT policy on `vc.posts` has no actor ownership check)
**File:** `apps/VCSM/src/features/upload/adapters/posts.adapter.js`
**Status:** OPEN

**What is verified:** User is authenticated (`user.id` exists via `supabase.auth.getUser()`)

**What is NOT verified:** The authenticated user owns the actor referenced by the caller-supplied `actorId`

**Call chain affected (8 vport publish controllers):**
- `publishFuelPriceUpdateAsPostController`
- `publishMenuUpdateAsPostController`
- `publishBarbershopPortfolioUpdateAsPostController`
- `publishBarbershopHoursUpdateAsPostController`
- `publishLocksmithHoursUpdateAsPostController` (×3)
- `publishExchangeRateUpdateAsPostController`

None of these controllers verify `actor_owners` before calling the adapter.

**Hook-level mitigation exists but is client-side only.** A session-authenticated user who knows another vport's `actorId` UUID could bypass the hook and call the controller directly with any actorId value.

**Recommended fix:**
1. Add `verifyActorOwnership(actorId, userId)` in each vport publish controller, or add ownership check inside `createSystemPost` adapter itself
2. Confirm RLS INSERT policy on `vc.posts` enforces `actor_id` ∈ `actor_owners` for the session user (CARNAGE required)
3. If RLS is confirmed, document the trust model explicitly in the adapter

**Handoff:** DB/CARNAGE (confirm RLS), IRONMAN (ownership enforcement decision)

---

## V-2 — `searchMentionSuggestions`: Null `viewerActorId`

**Severity:** MEDIUM
**File:** `apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js`
**Controller:** `apps/VCSM/src/features/upload/controller/searchMentionSuggestions.controller.js`
**Status:** OPEN

**Issue:** `ctrlSearchMentionSuggestions` never passes `viewerActorId` to the DAL. The RPC `identity.search_actor_directory` always receives `p_viewer_actor_id: null`.

**Risk:** Blocked actors or actors who have blocked the viewer may appear in mention autocomplete suggestions, because the null viewer context skips those filters in the RPC.

**Recommended fix:**
1. `ctrlSearchMentionSuggestions` should accept and forward `viewerActorId`
2. `useMentionAutocomplete.js` should pull `actorId` from `useIdentity()` and pass it through the controller
3. If the RPC handles `null` safely (returns public results only), document this explicitly

---

## Summary

| Finding | Severity | Blocking? | Status |
|---|---|---|---|
| V-1: `createSystemPost` missing actor ownership verification | HIGH | NO (not exploited; CARNAGE required) | OPEN |
| V-2: `searchMentionSuggestions` null viewerActorId | MEDIUM | NO | OPEN |
