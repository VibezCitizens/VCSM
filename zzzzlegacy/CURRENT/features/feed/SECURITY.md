# Feed Feature — Security

**Last VENOM audit:** 2026-05-14
**Report:** `CURRENT/features/dashboard/evidence/2026-05-14_venom_feed-dal-trust-boundaries.md`
**Scope:** `apps/VCSM/src/features/feed/dal/` — all 17 DAL files
**Triggered by:** CEREBRO verification pass on `vcsm.dal.feed.md`
**VENOM Verdict:** REVIEW_PENDING — no injection vulnerabilities found; trust boundary depends on unverified RLS policies

---

## Surfaces Reviewed

| Surface | Table | Operation | Risk Area |
|---|---|---|---|
| `readHiddenPostsForViewer` | `moderation.actions` | READ | Client-supplied `viewerActorId` |
| `readViewerReactionsBatch` | `vc.post_reactions` | READ | Client-supplied `actorId` |
| `markWelcomeFeedCardSeenDAL` | `vc.actor_onboarding_steps` | UPSERT | Client-supplied `actorId`, write path |
| `readWelcomeFeedCardStateDAL` | `vc.actor_onboarding_steps` | READ | Client-supplied `actorId` |
| `readFeedBlockRowsDAL` | `moderation.blocks` | READ | Client-supplied `viewerActorId`, UUID-validated |
| `readFeedFollowRowsDAL` | `vc.actor_follows` | READ | Client-supplied `viewerActorId`, UUID-validated |
| `readActorsBundle` | `vc.actors`, `public.profiles`, `vport.profiles`, `vc.actor_privacy_settings` | READ | Multi-schema read |
| `readFeedPostsPage` | `vc.posts` | READ | Realm-scoped |
| `readPostMediaMap` | `vc.post_media` | READ | Post-ID scoped |
| `readCommentCountsBatch` | `vc.post_comments` | READ | Post-ID scoped |
| `readReactionCountsBatch` | `vc.post_reactions`, `vc.post_rose_gifts` | READ | Post-ID scoped |
| `resolvePublicRealmIdDAL` | — | CONSTANT | No DB access |
| DEV-ONLY group (5 functions) | various | READ | Gated by `import.meta.env.DEV` — not in production |

---

## V1 — `readHiddenPostsForViewer`: Client-Supplied Actor ID

**Severity:** MODERATE
**File:** `apps/VCSM/src/features/feed/dal/feed.read.hiddenPosts.dal.js`
**Status:** NEEDS CARNAGE

`viewerActorId` is client-supplied from the pipeline, sourced from `useIdentity()`. Safety depends entirely on whether `moderation.actions` has RLS enforcing `actor_id IN (SELECT id FROM vc.actors WHERE user_id = auth.uid())`. Without this RLS, a forged `viewerActorId` could read another actor's hidden post state.

**Required:** CARNAGE verification of `moderation.actions` RLS policy.

---

## V2 — `readViewerReactionsBatch`: Client-Supplied Actor ID

**Severity:** MODERATE
**File:** `apps/VCSM/src/features/feed/dal/feed.read.viewerReactions.dal.js`
**Status:** NEEDS CARNAGE

Same pattern as V1. `actorId` is client-supplied. If `vc.post_reactions` RLS does not enforce actor-to-user mapping, a caller with a forged `actorId` could read another actor's reactions.

**Required:** CARNAGE verification of `vc.post_reactions` RLS policy.

---

## V3 — `markWelcomeFeedCardSeenDAL`: Write Path with Client-Supplied Actor ID

**Severity:** HIGH
**File:** `apps/VCSM/src/features/feed/dal/feedWelcomeCard.dal.js`
**Status:** NEEDS CARNAGE

This is the highest-risk surface in this DAL group. A write path UPSERT uses `actorId` as the primary key in the upsert. If `vc.actor_onboarding_steps` does not have an enforced `WITH CHECK` policy, any authenticated session could mark another actor's onboarding steps as completed.

**Required:** CARNAGE must verify `vc.actor_onboarding_steps` has enforced WITH CHECK policy.

---

## V4 — `readFeedBlockRowsDAL` / `readFeedFollowRowsDAL`: UUID Validation Present

**Severity:** LOW
**Status:** PASS

Both DALs validate `viewerActorId` with `isUuid()` before querying. UUID validation is correct defense-in-depth. RLS confirmation still recommended.

---

## V5 — `readActorsBundle`: Multi-Schema Read, `profiles` Schema Ambiguity

**Severity:** MODERATE
**File:** `apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js`
**Status:** NEEDS ARCH CONFIRM

The user `profiles` query uses no `.schema()` specifier (defaults to `public`). If the `profiles` table was ever moved, this would silently return no data. No UUID validation on `actorIds` input before DB query. Not a security vulnerability if schemas are correct — correctness risk only.

---

## V6 — `readFeedPostsPage`: Realm Scoping

**Severity:** LOW
**Status:** PASS

Realm scoping is optional. When `realmId` is null, all posts are returned subject to RLS. System posts correctly use `resolvePublicRealmIdDAL()` — never viewer session `realmId`. Constraint respected in all 8 vport publish controllers.

---

## V7 — DEV-ONLY Functions: Production Isolation

**Status:** PASS

`feed.read.debugPrivacyRows.dal.js` — all 5 exports gated by `import.meta.env.DEV`. `@debuggers` alias resolves to `src/debuggers-stub/` in production builds.

---

## Trust Boundary Summary

| Finding | Surface | Risk Level | Status |
|---|---|---|---|
| V1 | `readHiddenPostsForViewer` | MODERATE | NEEDS CARNAGE — `moderation.actions` |
| V2 | `readViewerReactionsBatch` | MODERATE | NEEDS CARNAGE — `vc.post_reactions` |
| V3 | `markWelcomeFeedCardSeenDAL` (WRITE) | HIGH | NEEDS CARNAGE — `vc.actor_onboarding_steps` WITH CHECK |
| V4 | `readFeedBlockRowsDAL` / `readFeedFollowRowsDAL` | LOW | PASS (UUID validation present; RLS confirm recommended) |
| V5 | `readActorsBundle` schema ambiguity | MODERATE | NEEDS ARCH CONFIRM |
| V6 | `readFeedPostsPage` realm scoping | LOW | PASS |
| V7 | DEV-ONLY functions, debugger stubs | — | PASS |
