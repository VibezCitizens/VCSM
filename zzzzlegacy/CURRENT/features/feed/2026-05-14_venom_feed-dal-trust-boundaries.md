---
report: venom_feed-dal-trust-boundaries
date: 2026-05-14
scope: apps/VCSM/src/features/feed/dal/
triggered_by: CEREBRO verification pass on vcsm.dal.feed.md
authority: GOVERNANCE_WRITABLE
---

# VENOM — Feed DAL Trust Boundary Review
_Date:_ 2026-05-14  
_Scope:_ `apps/VCSM/src/features/feed/dal/` — all 17 DAL files  
_Triggered by:_ CEREBRO verification pass on `vcsm.dal.feed.md`

---

## Surfaces Under Review

| Surface | Table | Operation | Risk Area |
|---|---|---|---|
| `readHiddenPostsForViewer` | `moderation.actions` | READ | Client-supplied `viewerActorId` |
| `readViewerReactionsBatch` | `vc.post_reactions` | READ | Client-supplied `actorId` |
| `markWelcomeFeedCardSeenDAL` | `vc.actor_onboarding_steps` | UPSERT | Client-supplied `actorId`, write path |
| `readWelcomeFeedCardStateDAL` | `vc.actor_onboarding_steps` | READ | Client-supplied `actorId` |
| `readFeedBlockRowsDAL` | `moderation.blocks` | READ | Client-supplied `viewerActorId`, UUID-validated |
| `readFeedFollowRowsDAL` | `vc.actor_follows` | READ | Client-supplied `viewerActorId`, UUID-validated |
| `readActorsBundle` | `vc.actors`, `public.profiles`, `vport.profiles`, `vc.actor_privacy_settings` | READ | Multi-schema read, no caller auth |
| `readFeedPostsPage` | `vc.posts` | READ | Realm-scoped, no viewer auth |
| `readPostMediaMap` | `vc.post_media` | READ | Post-ID scoped, no viewer auth |
| `readCommentCountsBatch` | `vc.post_comments` | READ | Post-ID scoped, no viewer auth |
| `readReactionCountsBatch` | `vc.post_reactions`, `vc.post_rose_gifts` | READ | Post-ID scoped, no viewer auth |
| `resolvePublicRealmIdDAL` | — | CONSTANT | No DB access |
| DEV-ONLY group (5 functions) | various | READ | Gated by `import.meta.env.DEV` — not in production |

---

## Finding V1 — `readHiddenPostsForViewer`: Client-Supplied Actor ID (MODERATE)

**File:** `apps/VCSM/src/features/feed/dal/feed.read.hiddenPosts.dal.js`

```js
export async function readHiddenPostsForViewer({ viewerActorId, postIds }) {
  const { data: actions } = await supabase
    .schema("moderation")
    .from("actions")
    .select("target_id, action_type, created_at")
    .eq("actor_id", viewerActorId)   // ← client-supplied
    .eq("target_type", "post")
    .in("target_id", postIds)
    .in("action_type", ["hide", "unhide"])
```

**Risk:** `viewerActorId` comes from the caller (the pipeline), which receives it from the hook, which reads it from `useIdentity()`. If the session identity is correctly scoped to the authenticated user's actor, this is safe. **If RLS on `moderation.actions` enforces `actor_id = (SELECT id FROM vc.actors WHERE ... user_id = auth.uid())`**, the client-supplied filter is redundant and the data layer is protected.

**Required RLS shape:**
```sql
-- moderation.actions RLS policy (expected)
USING (
  actor_id IN (SELECT id FROM vc.actors WHERE user_id = auth.uid())
)
```

**Verdict:** TRUST THE DATABASE if RLS is present. Without RLS, a session with a forged `viewerActorId` could read another actor's hidden post state. Cannot verify RLS from source scan — **CARNAGE review required** for `moderation.actions`.

---

## Finding V2 — `readViewerReactionsBatch`: Client-Supplied Actor ID (MODERATE)

**File:** `apps/VCSM/src/features/feed/dal/feed.read.viewerReactions.dal.js`

```js
.eq("actor_id", actorId)   // ← client-supplied
```

**Risk:** Same pattern as V1. If RLS on `vc.post_reactions` enforces `actor_id = auth.uid()`'s actor, then the filter is safe and the RLS is the trust boundary. Without RLS, a caller with a forged `actorId` could read another actor's reactions.

**Verdict:** Needs RLS confirmation on `vc.post_reactions`. Flag for CARNAGE.

---

## Finding V3 — `markWelcomeFeedCardSeenDAL`: Write Path with Client-Supplied Actor ID (HIGH)

**File:** `apps/VCSM/src/features/feed/dal/feedWelcomeCard.dal.js`

```js
export async function markWelcomeFeedCardSeenDAL({ actorId }) {
  const { error } = await supabase
    .schema('vc')
    .from('actor_onboarding_steps')
    .upsert(
      {
        actor_id: actorId,   // ← client-supplied
        step_key: STEP_KEY,
        status: 'completed',
        ...
      },
      { onConflict: 'actor_id,step_key' },
    )
```

**Risk:** This is a **write path**. If RLS on `vc.actor_onboarding_steps` does not enforce `actor_id = authenticated user's actor`, then any authenticated session could mark another actor's onboarding steps as completed by passing a different `actorId`. This is a data integrity risk.

**Expected RLS:**
```sql
-- vc.actor_onboarding_steps write RLS (expected)
WITH CHECK (
  actor_id IN (SELECT id FROM vc.actors WHERE user_id = auth.uid())
)
```

**Verdict:** Write path with client-supplied primary key. This is the highest-risk surface in this DAL group. **CARNAGE must verify `vc.actor_onboarding_steps` has enforced WITH CHECK policy.**

---

## Finding V4 — `readFeedBlockRowsDAL` / `readFeedFollowRowsDAL`: UUID Validation Present (PASS)

Both `readFeedBlockRowsDAL` and `readFeedFollowRowsDAL` validate `viewerActorId` with `isUuid()` before querying:

```js
if (!viewerActorId || !isUuid(viewerActorId)) return [];
```

This prevents malformed inputs from reaching the DB. UUID validation at the client level is correct defense-in-depth. RLS is still the authoritative trust boundary, but input validation reduces attack surface.

**Verdict:** PASS — UUID validation present. RLS confirmation still recommended.

---

## Finding V5 — `readActorsBundle`: Multi-Schema Read, `profiles` Schema Ambiguity (MODERATE)

**File:** `apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js`

Two distinct `profiles` queries with different schemas:

```js
// Query 1 — user profiles (no .schema() call → defaults to public schema)
supabase
  .from("profiles")
  .select("id, display_name, username, photo_url")

// Query 2 — vport profiles (explicit vport schema)
vportSchema
  .from("profiles")
  .select("actor_id, name, slug, avatar_url, is_active, is_deleted")
```

**Risk 1:** The user `profiles` query uses no `.schema()` specifier. The Supabase default schema is `public`. If the `profiles` table for user data lives in `public`, this is correct. If it lives in `vc`, this is querying the wrong schema silently (returning no data rather than throwing).

**Risk 2:** The `vport.profiles` table is accessed via `vportClient` (`supabase.schema('vport')`). This is a different schema from `vc`. Actors of kind `'vport'` will only resolve if this schema is correct.

**Risk 3:** No UUID validation on `actorIds` input before DB query. If `actorIds` contains non-UUID values, `.in("id", actorIds)` will proceed and PostgreSQL will reject at query time (throwing an error).

**Verdict:** Schema ambiguity on `public.profiles` needs architectural confirmation. Not a security vulnerability if schemas are correct — but a correctness risk if `profiles` was ever moved.

---

## Finding V6 — `readFeedPostsPage`: Realm Scoping (PASS)

```js
if (realmId) {
  q = q.eq("realm_id", realmId);
}
```

Realm scoping is optional — if `realmId` is null, ALL posts in the table are returned (subject to RLS). For the public realm use case, this is correct. For future void/restricted realms, passing `null` as `realmId` would bypass realm filtering.

**Per memory:** System posts must use `resolvePublicRealmIdDAL()` — never viewer session `realmId`. This constraint is respected in all 8 vport publish controllers. Feed read path correctly receives `realmId` from `useIdentity()` which sources it from the authenticated session.

**Verdict:** ALIGNED — realm scoping is handled correctly in the current architecture.

---

## Finding V7 — DEV-ONLY Functions: Production Isolation (PASS)

`feed.read.debugPrivacyRows.dal.js` — all 5 exports gated by `import.meta.env.DEV` in callers (`DebugPrivacyPanel.jsx` and `CentralFeedScreen.jsx`).

Additionally, `@debuggers` alias in `vite.config.js` resolves to `src/debuggers-stub/` in production. All debugger imports in pipeline and CentralFeedScreen resolve to no-op stubs in production builds.

**Verdict:** PASS — dev-only isolation is correctly implemented via both env guard and Vite alias.

---

## Trust Boundary Summary

| Finding | Surface | Risk Level | RLS Required | Status |
|---|---|---|---|---|
| V1 | `readHiddenPostsForViewer` | MODERATE | YES — `moderation.actions` | NEEDS CARNAGE |
| V2 | `readViewerReactionsBatch` | MODERATE | YES — `vc.post_reactions` | NEEDS CARNAGE |
| V3 | `markWelcomeFeedCardSeenDAL` (WRITE) | HIGH | YES — `vc.actor_onboarding_steps` WITH CHECK | NEEDS CARNAGE |
| V4 | `readFeedBlockRowsDAL` / `readFeedFollowRowsDAL` | LOW | YES — UUID validation present | PASS (needs RLS confirm) |
| V5 | `readActorsBundle` schema ambiguity | MODERATE | N/A — schema correctness | NEEDS ARCH CONFIRM |
| V6 | `readFeedPostsPage` realm scoping | LOW | N/A — realm-correct | PASS |
| V7 | DEV-ONLY functions, debugger stubs | — | N/A | PASS |

---

## VENOM Verdict

**Status: REVIEW_PENDING**

No injection vulnerabilities found. No auth bypass confirmed. Trust boundary depends on RLS policies that cannot be verified from source scan:
- `moderation.actions` — must enforce actor-to-user mapping
- `vc.post_reactions` — must enforce actor-to-user mapping
- `vc.actor_onboarding_steps` — must enforce WITH CHECK for write path

Required downstream: **CARNAGE** — verify RLS on `moderation.actions`, `vc.post_reactions`, `vc.actor_onboarding_steps`, `vc.actor_follows`.
