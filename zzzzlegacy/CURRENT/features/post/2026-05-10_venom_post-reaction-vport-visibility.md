# VENOM SECURITY AUDIT
## Post / Reaction / Comment Interaction Surfaces + VPORT Actor Visibility
**Date:** 2026-05-10
**Auditor:** VENOM (read-only, no source changes)
**Scope:** 9 recently-modified files across feed, post, profiles features

---

## Files Audited

1. `apps/VCSM/src/features/feed/model/feedRowVisibility.model.js`
2. `apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js`
3. `apps/VCSM/src/features/post/postcard/controller/togglePostReaction.controller.js`
4. `apps/VCSM/src/features/post/postcard/controller/sendRose.controller.js`
5. `apps/VCSM/src/features/post/commentcard/controller/postComments.controller.js`
6. `apps/VCSM/src/features/post/postcard/dal/post.read.dal.js`
7. `apps/VCSM/src/features/profiles/controller/photos/photoReactions.controller.js`
8. `apps/VCSM/src/features/profiles/model/photos/enrichPhotoPosts.model.js`
9. `apps/VCSM/src/features/post/postcard/hooks/usePostReactions.js`

Supporting files read for context:
- `dal/postReactions.read.dal.js`, `dal/postReactions.write.dal.js`, `dal/roseGifts.actor.dal.js`
- `dal/comments.dal.js`, `dal/postComments.read.dal.js`
- `dal/photos/listPostReactions.dal.js`, `listPostRoseCount.dal.js`, `listPostCommentsCount.dal.js`
- `state/identity/identityContext.jsx`
- `supabase/migrations/20260427020000_vport_traze_directory_visibility_fix.sql`
- `supabase/migrations/20260430600000_grant_vport_profile_public_details_select.sql`
- `zNOTFORPRODUCTION/_HISTORY/db/snapshots/full_schema.sql` (RLS policies)

---

## FINDINGS

---

### FINDING-01: RLS INSERT POLICIES DO NOT CHECK `deleted_at` ON POSTS

**Severity: HIGH**
**Area:** Trust Boundary (A)
**Tables:** `vc.post_comments`, `vc.post_reactions`, `vc.post_rose_gifts`

#### Description

The application-layer controller correctly guards against interactions on soft-deleted posts via `checkPostExistsDAL`, which filters on `deleted_at IS NULL`. However, the corresponding database-level RLS INSERT policies do NOT include this filter.

The policies in the schema snapshot:

**post_comments_insert_actor_owned:**
```sql
WITH CHECK (
  EXISTS (SELECT 1 FROM vc.actor_owners ao WHERE ao.actor_id = post_comments.actor_id AND ao.user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM vc.posts p WHERE p.id = post_comments.post_id)
  -- ⚠️  No: AND p.deleted_at IS NULL
)
```

**post_reactions_insert:**
```sql
WITH CHECK (
  EXISTS (SELECT 1 FROM vc.actor_owners ao WHERE ao.actor_id = post_reactions.actor_id AND ao.user_id = auth.uid())
  -- ⚠️  No post existence check at all — not even a foreign key guard in the policy
)
```

**post_rose_gifts_insert:**
```sql
WITH CHECK (
  EXISTS (SELECT 1 FROM vc.actor_owners ao WHERE ao.actor_id = post_rose_gifts.actor_id AND ao.user_id = auth.uid())
  -- ⚠️  No post existence check, no deleted_at filter
)
```

#### Attack Vector

A client that bypasses the JS controller layer (e.g., via a direct Supabase REST or PostgREST call with a valid JWT) can insert reactions, roses, and comments on soft-deleted posts. The controller-layer guard is not replicated at the database trust boundary.

#### Impact

- Reactions and comments accumulate on logically-deleted content.
- The notification system fires for deleted posts (`fetchPostByIdDAL` returns `null` which is guarded — but `publishVcsmNotification` is conditionally called only if `post?.actor_id` exists, so notification spam is blocked in-controller. At the DB layer though, the row still lands).
- Aggregation RPCs (`post_reactors_summary_one`) still count reactions on deleted posts.
- Soft-delete is a user-facing contract; ghost reactions break that contract silently.

#### Recommendation

Add `AND p.deleted_at IS NULL` to the `post_comments` and `post_reactions` insert policies. For `post_rose_gifts`, add both a post existence check and the `deleted_at IS NULL` filter.

---

### FINDING-02: VPORT VISIBILITY — "NO PROFILE ROW" DEFAULTS TO VISIBLE

**Severity: MEDIUM**
**Area:** VPORT Visibility (C)
**File:** `feedRowVisibility.model.js` lines 54–57

#### Description

```js
const vportEntry = vportMap?.[rowActorId] ?? null;
const isActive = vportEntry === null
  || (vportEntry.is_active !== false && vportEntry.is_deleted !== true);
```

When `vportEntry` is `null` (no row in `vport.profiles` for that `actor_id`), the model defaults to `visible = true`. The comment in the code reads: "If no profile row exists yet (incomplete onboarding), default to visible."

#### Risk

An actor that is of `kind: 'vport'` but has no corresponding `vport.profiles` row — whether due to incomplete onboarding, a race condition during creation, or a manually-crafted actor — is treated as fully visible in the feed. This is a logic inversion: the safer default for an unverified/incomplete VPORT is to be hidden, not visible.

A VPORT that has been hard-deleted from `vport.profiles` (but whose `vc.actors` row still exists, e.g., orphaned) would also be shown as visible in the feed.

#### Attack Vector

Low-sophistication: if the `vport.profiles` row is deleted by an admin or via the hard-delete RPC without also cleaning up `vc.actors`, the actor continues to appear in feeds.

#### Recommendation

Invert the default: treat a missing `vportEntry` as invisible (`isActive = false`, reason: `missing_vport_profile`). Only allow visibility when `vportEntry` explicitly exists and `is_active = true` and `is_deleted = false`. Incomplete onboarding should be invisible until the profile is fully provisioned.

---

### FINDING-03: VPORT `is_active` / `is_deleted` ARE USER-WRITEABLE VIA OWNER UPDATE POLICY

**Severity: MEDIUM**
**Area:** VPORT Visibility (C)
**Table:** `vport.profiles`

#### Description

The RLS policy `profiles_update_by_actor_owner` (and `profiles_update_owner`) allows any authenticated user who owns the actor (via `actor_owners`) to UPDATE the `vport.profiles` row — including the `is_active` and `is_deleted` columns:

```sql
CREATE POLICY profiles_update_by_actor_owner ON vport.profiles FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM vc.actor_owners ao WHERE ao.actor_id = profiles.actor_id AND ao.user_id = auth.uid() AND COALESCE(ao.is_void, false) = false))
WITH CHECK (same);
```

There is no column-level grant restriction (PostgreSQL `GRANT UPDATE (col1, col2)` syntax) limiting which columns the owner can update. This means a VPORT owner could directly write `is_active = false` or `is_deleted = true` on their own profile via the Supabase client to make themselves invisible in the feed.

#### Risk

- Owners can self-deactivate and self-delete their own VPORT profile without going through any application flow, bypassing any billing or admin approval step.
- An owner who self-sets `is_deleted = true` would vanish from the feed immediately but could re-activate by setting `is_deleted = false` again. This enables on-demand ghost mode without admin visibility.

#### Note

Self-deactivation is arguably by design (owners should be able to deactivate). The risk is that `is_deleted` is conceptually an admin-controlled flag but is writeable by owners. If `is_deleted` is supposed to be admin-only, column-level UPDATE restriction is needed.

#### Recommendation

If `is_deleted` is an admin flag, restrict it with column-level grants: allow owners to update only non-administrative columns (name, bio, avatar, etc.) and require service_role or a privileged RPC to flip `is_active`/`is_deleted`.

---

### FINDING-04: OPTIMISTIC REACTION DELTA — CLIENT-SUPPLIED `currentCounts` IS TRUSTED FOR DISPLAY

**Severity: LOW**
**Area:** Reaction Optimistic Delta (D)
**File:** `togglePostReaction.controller.js` — `applyReactionDelta`

#### Description

```js
function applyReactionDelta(currentCounts, prevReaction, nextReaction) {
  const counts = { ...currentCounts };
  if (prevReaction) counts[prevReaction] = Math.max(0, (counts[prevReaction] ?? 0) - 1);
  if (nextReaction) counts[nextReaction] = (counts[nextReaction] ?? 0) + 1;
  return counts;
}
```

When `currentCounts` is not null, the function uses it as the baseline for the delta. The hook passes in the client-held `counts` state directly:

```js
// usePostReactions.js line 79
currentCounts: counts,
```

If `counts` contains negative numbers, excessively large numbers, missing keys, or NaN, `applyReactionDelta` will propagate that garbage into the returned counts object.

#### Specific Cases

| Input garbage | Outcome |
|---|---|
| `{ like: -9999 }` | Delta produces `{ like: -9999 + 1 }` = `-9998` rendered on UI |
| `{ like: null }` | `(null ?? 0) + 1` = `1` — safe |
| `{ like: "abc" }` | `"abc" - 1` = `NaN`, `Math.max(0, NaN)` = `NaN` — renders as NaN |
| Missing `rose` key | `undefined ?? 0` = `0` — safe |
| `{ like: Infinity }` | `Infinity + 1` = `Infinity` — renders as "Infinity" in UI |

#### Boundary

This is a **display-only** issue. The actual database writes are atomic and correct — the RLS policies enforce ownership, and the authoritative RPC (`post_reactors_summary_one`) is always used when `currentCounts` is null. No persistence is affected. The mutation path (insert/update/delete reaction) is independent of `currentCounts`.

If garbage counts are rendered, the next page load or full fetch will reset them to authoritative values.

#### Recommendation

Add lightweight sanitization in `applyReactionDelta` before using `currentCounts`:

```js
function sanitizeCounts(raw) {
  const KEYS = ["like", "dislike", "rose"];
  const out = {};
  for (const k of KEYS) {
    const v = Number(raw?.[k] ?? 0);
    out[k] = Number.isFinite(v) && v >= 0 ? v : 0;
  }
  return out;
}
```

---

### FINDING-05: `sendRose` — NO UPPER BOUND ON `qty`

**Severity: LOW**
**Area:** Trust Boundary (A) / Reaction surfaces
**File:** `sendRose.controller.js` line 40, `roseGifts.actor.dal.js` line 33

#### Description

Both the controller and DAL validate `qty > 0` but place no upper ceiling on `qty`. The database constraint `post_rose_gifts_qty_check CHECK ((qty > 0))` also only enforces the lower bound.

A client (via direct REST call or a modified JS payload) could submit `qty = 999999999` in a single call. The insert would succeed.

#### Impact

- Artificially inflating rose counts on any post.
- No financial exposure currently (roses appear to be non-monetary in this surface), but if roses are ever tied to a premium currency or a leaderboard, this becomes HIGH severity.

#### Recommendation

Add an upper bound: `if (qty > 100) throw new Error("sendRose: qty cannot exceed 100 per call")` in the controller and add a matching DB CHECK constraint.

---

### FINDING-06: `post_comments_select_via_post` POLICY DOES NOT FILTER SOFT-DELETED POSTS

**Severity: LOW**
**Area:** Trust Boundary (A) / Data Exposure
**Table:** `vc.post_comments` SELECT policy

#### Description

```sql
CREATE POLICY post_comments_select_via_post ON vc.post_comments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM vc.posts p WHERE p.id = post_comments.post_id
    AND EXISTS (SELECT 1 FROM vc.actors a WHERE a.id = p.actor_id))
);
-- ⚠️  No: AND p.deleted_at IS NULL
```

The SELECT policy does not filter on `p.deleted_at IS NULL`. Comments on a soft-deleted post remain readable at the database level. The application-layer `listPostComments` DAL does correctly filter `deleted_at IS NULL` on the comments themselves, but any client calling `post_comments` directly with a known `post_id` will receive comments for deleted posts.

#### Impact

Content published on a deleted post (which may have been deleted due to a ToS violation or at user request) remains accessible via direct DB query. Moderate data exposure risk.

#### Recommendation

Add `AND p.deleted_at IS NULL` to `post_comments_select_via_post`.

---

### FINDING-07: `listPostReactions` DAL HAS NO VISIBILITY GATE — FETCHES ALL REACTIONS INCLUDING DELETED POST REACTIONS

**Severity: LOW**
**Area:** Trust Boundary (A) / Photo Reactions Surface
**File:** `profiles/dal/photos/listPostReactions.dal.js`

#### Description

```js
const { data, error } = await supabase
  .schema("vc")
  .from("post_reactions")
  .select("post_id, actor_id, reaction")
  .in("post_id", postIds);
```

No join to `vc.posts` to filter out soft-deleted posts. If `postIds` contains an ID of a soft-deleted post, reactions for that post are returned and counted in `enrichPhotoPostsModel`. The parent controller (`enrichPhotoPostsController`) receives the full `posts` array from the profile photo fetch — that upstream DAL would need to filter on `deleted_at`. If it does not, ghost reactions appear on the profile grid.

#### Impact

Limited to the profile photo grid surface. Reactions may be counted/displayed for deleted posts depending on whether the upstream photo-fetching DAL filters on `deleted_at`.

#### Recommendation

Verify the upstream DAL that feeds `posts` to `enrichPhotoPostsController` filters on `deleted_at IS NULL`. If not, add a join guard in `listPostReactions`.

---

### FINDING-08: COMMENT CONTROLLER — NO CONTENT LENGTH OR EMPTY-STRING VALIDATION

**Severity: LOW**
**Area:** Trust Boundary — Input Validation
**File:** `postComments.controller.js`

#### Description

`createRootComment` and `createReplyComment` do not validate the `content` field before calling `createComment`. The database schema has `content text NOT NULL` but no CHECK constraint enforcing minimum length or trimmed non-empty. Empty string `""` would pass the `NOT NULL` constraint and be inserted.

`createReplyComment` short-circuits on `!postId || !actorId || !parentCommentId` but has no guard on `!content`.

#### Impact

- Empty or whitespace-only comments can be created.
- Very large comment payloads (no length limit) could be submitted.
- Downstream, the notification context trims content to 120 chars: `(content ?? '').slice(0, 120) || null` — so the notification preview is safe, but the stored content is not bounded.

#### Recommendation

Add controller-layer validation: `if (!content?.trim()) throw new Error("Comment content is required.")` and enforce a max length (e.g., 2000 chars). Add a matching DB CHECK constraint: `CHECK (length(trim(content)) > 0 AND length(content) <= 2000)`.

---

## IDENTITY SURFACE SUMMARY

**FINDING-09: `user_id` Column Exists on `vc.post_comments` but Is Not Actor-Scoped**

**Severity: LOW (informational)**
**Area:** Identity Surface (E)

The `vc.post_comments` table schema includes a `user_id uuid` column alongside `actor_id uuid NOT NULL`. This raw `user_id` is not selected by any of the audited DALs and not surfaced through any controller or hook. It appears to be a legacy column.

**Risk:** Low — the column is not consumed by any audited path. However, its presence represents a latent identity anti-pattern. If future code selects or trusts `user_id` instead of `actor_id`, it would violate the actor-based identity contract.

**Recommendation:** Confirm whether `user_id` is needed (e.g., for a trigger or RLS policy). If not, drop or deprecate the column in a migration.

No other `profileId`, `vportId`, or raw `userId` values were found being trusted in place of `actorId` across the 9 audited files. The identity surface in these files is compliant with the actor-based contract.

---

## FINDINGS SUMMARY TABLE

| ID | Severity | Area | Issue | Fix Layer |
|---|---|---|---|---|
| FINDING-01 | HIGH | Trust Boundary | RLS INSERT policies don't filter deleted posts | DB migration |
| FINDING-02 | MEDIUM | VPORT Visibility | Missing vport profile row defaults to visible | Model logic |
| FINDING-03 | MEDIUM | VPORT Visibility | Owner can self-write `is_deleted` / `is_active` | DB column grants |
| FINDING-04 | LOW | Reaction Delta | Client-supplied counts not sanitized (display only) | Controller |
| FINDING-05 | LOW | Rose Gifts | No upper bound on `qty` | Controller + DB CHECK |
| FINDING-06 | LOW | Trust Boundary | comment SELECT policy reads through deleted posts | DB migration |
| FINDING-07 | LOW | Trust Boundary | `listPostReactions` fetches reactions for deleted posts | DAL / upstream |
| FINDING-08 | LOW | Input Validation | No content length/empty-string validation on comments | Controller + DB CHECK |
| FINDING-09 | LOW | Identity Surface | Legacy `user_id` column on `vc.post_comments` | Migration cleanup |

---

## POSITIVES OBSERVED

The following were correctly implemented:

- `checkPostExistsDAL` uses `is("deleted_at", null)` — correct soft-delete filter.
- `fetchPostByIdDAL` uses `is("deleted_at", null)` — data exposure gap on the fetch path is closed.
- `togglePostReactionController` validates `reaction` against `VALID_REACTIONS` allowlist before any DB call.
- `postReactions.write.dal.js` scopes all mutations to `(post_id, actor_id)` — no cross-actor mutation possible at the DAL level.
- RLS on `post_reactions` INSERT/UPDATE/DELETE enforces `actor_owners` ownership via `auth.uid()`. Controller-layer `actorId` is substantiated by the RLS policy independently.
- `sendRoseController` validates `qty > 0` at the controller level, mirroring the DB CHECK.
- `createReplyComment` guards on `parentCommentId` presence before looking up the parent actor for notification.
- `useIdentity()` exposes only `actorId` + `kind` — no `profileId`, `vportId`, or `userId` leaks through the public identity surface.
- The `vport.profiles` SELECT policy (`profiles_select_public`) enforces `is_active = true AND is_deleted = false` at the DB level, preventing the visibility bypass described in FINDING-02 from reaching the feed DAL — the mitigation in FINDING-02 is about the model-layer default when the DAL returns no row (race condition / orphan actor scenario).
- The actors bundle cache has a 30s TTL and `invalidateActorsBundleCache()` exists for write-path invalidation — correct cache discipline.
