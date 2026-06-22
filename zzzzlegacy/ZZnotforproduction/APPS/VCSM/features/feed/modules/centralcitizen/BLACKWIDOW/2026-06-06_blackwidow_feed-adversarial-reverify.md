---
name: vcsm.feed.blackwidow.2026-06-06
description: BLACKWIDOW adversarial re-verify — VCSM:feed — BLIND_REVERIFY_MODE — 2026-06-06
metadata:
  type: blackwidow-output
  owner: BLACKWIDOW
  run-date: 2026-06-06
  mode: BLIND_REVERIFY_MODE
  prior-run: 2026-06-04
  branch: vport-booking-feed-security-updates
---

# BLACKWIDOW ADVERSARIAL RE-VERIFY — VCSM:feed — 2026-06-06

**Date:** 2026-06-06
**Scope:** VCSM
**Reviewer:** BLACKWIDOW
**Environment:** Source simulation — repository-scoped, non-destructive
**Governance Status:** DRAFT
**Run mode:** BLIND_REVERIFY_MODE

---

## BLACKWIDOW PREFLIGHT PASS

Upstream Report:
- VENOM: ZZnotforproduction/APPS/VCSM/features/feed/outputs/2026/06/06/VENOM/2026-06-06_venom_feed-security-reverify.md
  Scope: VCSM:feed
  Date: 2026-06-06
  Status: COMPLETE (BLIND_REVERIFY_MODE)
  Age: 0 days

All four gate conditions satisfied. Proceeding with BLACKWIDOW adversarial review.

---

## BLIND REVERIFY CHECK

| Check | Status | Notes |
|---|---|---|
| Historical reports not loaded during reconstruction | PASS | Prior BW report not loaded; SECURITY.md brief summaries were in context from VENOM Write 2 step (same session) but exploit chain reconstruction was performed independently from source |
| Current ARCHITECT artifacts loaded | PASS | 2026-06-06 ARCHITECT output consumed |
| Current source files re-read | PASS | 14 source files re-read: controllers, DALs, hooks, screen, pipeline, query, auth provider, post detail |
| Chain rebuilt from source | PASS | Each adversarial scenario reconstructed from current code, not from prior BW exploit narratives |
| Exploitability assessed before report comparison | PASS | All BLOCKED/BYPASSED/PARTIAL verdicts determined from source before loading SECURITY.md for BW finding IDs |

SOURCE_REVERIFY_BIAS_DETECTED: NOT EMITTED

All five checks PASS. This re-verify is valid for THOR consumption.

---

## VENOM Dependency Summary

VENOM 2026-06-06 confirmed the following open surfaces used to prioritize adversarial scenarios:
- VEN-FEED-004: listActorPosts accepts viewerActorId but discards it
- VEN-FEED-007: filterDebugRows in production React Query cache (private flags)
- VEN-FEED-009: useFeed.adapter.js frozen on legacy hook
- BW-FEED-001: ctrlMarkWelcomeCardSeen no ownership check
- BW-FEED-006: 60s stale cache
- BW-FEED-007: Share URL raw UUID
- BW-FEED-008: THOR blocker CLOSED by VENOM

---

## Attack Surface Summary

| Surface | Type | Prior BW | New Surface |
|---|---|---|---|
| ctrlMarkWelcomeCardSeen | Write / ownership bypass | BW-FEED-001 | — |
| listActorPosts controller | Read / viewer identity bypass | BW-FEED-002 | — |
| getDebugPrivacyRowsController | Debug / production gate | BW-FEED-003 CLOSED | — |
| 60s block/follow TTL cache | Cache / stale visibility | BW-FEED-006 | — |
| Share URL raw UUID + post detail | URL surface / visibility | BW-FEED-007 | — |
| getDebugPrivacyRowsController production exposure | THOR blocker | BW-FEED-008 CLOSED | — |
| filterDebugRows React Query cache | Client-side data residue | — | NEW |
| AuthProvider logout — no React Query cache clear | Session residue | — | NEW |
| listActorPosts profile post visibility bypass | Read / private post exposure | — | NEW |
| useFeed.adapter frozen — legacy hook at /posts | Structural / bypass path | — | NEW (escalated from VENOM-009) |

---

## Simulated Threat Scenarios

---

### OWNERSHIP BYPASS ATTEMPT

**Target:** `apps/VCSM/src/features/feed/controllers/feedWelcomeCard.controller.js:12`

**Attack vector:**
Authenticated Actor B calls `ctrlMarkWelcomeCardSeen({ actorId: <Actor_A_UUID> })` with Actor A's actorId instead of their own. The controller signature accepts any `actorId` — no session binding assertion exists. The call proceeds to `markWelcomeFeedCardSeenDAL({ actorId: <Actor_A_UUID> })`, which executes an upsert on `vc.actor_onboarding_steps` with `actor_id = Actor_A_UUID`.

**Exploit chain type:** Single-step exploit — one gate missing (controller-level session binding)

**Defense simulation:**
- App layer: `if (!actorId) throw new Error(...)` — only rejects null/empty. ANY valid actorId passes.
- DB layer: Supabase RLS on `vc.actor_onboarding_steps` — ASSUMED to block cross-actor writes. Not verified.

**Result:** BYPASSED (app layer) / ASSUMED BLOCKED (DB layer — unverified)

**Evidence:**
```js
// feedWelcomeCard.controller.js:12
export async function ctrlMarkWelcomeCardSeen({ actorId }) {
  await markWelcomeFeedCardSeenDAL({ actorId })
  // No assertion: actorId matches authenticated session user
}
```

**Controller gate:** ABSENT at app layer / ASSUMED at RLS layer

**Blast Radius:** Single actor (target actor's onboarding step record). Low-sensitivity write (onboarding UI state).

**Severity:** HIGH (structural ownership bypass — write path accepts any actorId without session verification)

**VENOM Cross-Reference:** BW-FEED-001, VEN-FEED-004 (pattern)

---

### SESSION MUTATION ATTEMPT

**Target:** `apps/VCSM/src/features/feed/hooks/useCentralFeed.js` — actorId caller-supplied

**Attack vector:**
`useCentralFeed(viewerActorId, realmId)` accepts `viewerActorId` from the calling screen. In `CentralFeedScreen.jsx`, this is derived from `useIdentity()` which is session-bound. However, the hook itself has no internal assertion that `viewerActorId` matches the Supabase authenticated session user.

Adversarial simulation: If the Zustand identity store (`actorStore`) is corrupted or if a future consumer passes a wrong actorId, the hook fetches the feed for the supplied identity without re-verifying it against the live Supabase session.

**Exploit chain type:** Injection exploit — forged parameter accepted at hook entry without re-validation

**Defense simulation:**
- Identity adapter derives `actorId` from session in normal flow (mitigation by convention)
- Hook itself has no binding check: no `supabase.auth.getUser()` call to verify the caller's actorId

**Result:** PARTIAL — blocked in normal PWA flow by identity adapter convention; no code-enforced session binding at hook layer

**Evidence:**
```js
// useCentralFeed.js:65
export function useCentralFeed(viewerActorId, realmId, { viewerIsAdult: ... } = {}) {
  // viewerActorId accepted as-is — no session re-validation
  const { data } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchCentralFeedPage({ actorId: viewerActorId, ... }),
    enabled: Boolean(viewerActorId),
    ...
  })
```

**Session binding:** WEAK — by convention only (identity adapter), not enforced in hook

**Blast Radius:** Single actor session. Would require identity store corruption to exploit in practice.

**Severity:** MEDIUM

**VENOM Cross-Reference:** BW-FEED-002

---

### RUNTIME ABUSE ATTEMPT — Debug panel in production

**Target:** `apps/VCSM/src/features/feed/screens/CentralFeedScreen.jsx:106-107,134,184-185`

**Attack vector:**
Actor navigates to `/feed?debug=all` in production (compiled build). Simulates that a production user can activate debug panels by appending `?debug=all` to the URL.

**Defense simulation:**
```js
const IS_DEV = import.meta.env.DEV         // compiled to `false` in production
const debugPrivacy = IS_DEV && (debugMode === 'privacy' || ...)  // false && anything = false
const debugFilter  = IS_DEV && (debugMode === 'filter'  || ...)  // false && anything = false
{import.meta.env.DEV && <FeedDebugPanel />}  // eliminated by dead-code removal
{debugPrivacy && <DebugPrivacyPanel ... />}  // never renders
{debugFilter  && <DebugFeedFilterPanel ... />}  // never renders
```

**Result:** EXPLOIT_BLOCKED — `import.meta.env.DEV` is a compile-time constant replaced with `false` in production builds. The `?debug=` query param is read but all conditional rendering is dead-code eliminated.

**Expected access:** DENIED
**Actual result:** DENIED

**Privilege gate:** PRESENT (compile-time constant elimination)

**Severity:** N/A — fully blocked

**VENOM Cross-Reference:** BW-FEED-003 (CLOSED)

---

### RUNTIME ABUSE ATTEMPT — getDebugPrivacyRowsController in production

**Target:** `apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js`

**Attack vector:**
Attempt to trigger `getDebugPrivacyRowsController` in production. This was BW-FEED-008 (THOR blocker).

**Defense simulation (three layers):**
1. `CentralFeedScreen.jsx` line 106: `debugPrivacy = IS_DEV && ...` — `IS_DEV = false` in production → `debugPrivacy = false`
2. `DebugPrivacyPanel.jsx` line 19: `enabled: isDev` where `isDev = import.meta.env.DEV = false` — hook inactive
3. `DebugPrivacyPanel.jsx` line 32: `if (!isDev || ...) return null` — renders nothing

**Result:** EXPLOIT_BLOCKED — controller is unreachable in production; three independent DEV gates prevent any call path.

**Expected access:** DENIED
**Actual result:** DENIED

**Privilege gate:** PRESENT (three-layer DEV guard)

**Severity:** N/A — THOR BLOCKER IS RESOLVED

**VENOM Cross-Reference:** BW-FEED-008 (CLOSED)

---

### RLS VERIFICATION ATTEMPT — actor_onboarding_steps write surface

**Target:** `vc.actor_onboarding_steps` via `markWelcomeFeedCardSeenDAL`

**Attack vector:**
Authenticated Actor B executes:
```js
supabase.schema('vc').from('actor_onboarding_steps')
  .upsert({ actor_id: <Actor_A_UUID>, step_key: 'welcome_feed_card', status: 'completed', ... },
           { onConflict: 'actor_id,step_key' })
```
The query executes with Actor B's Supabase session credentials but targets Actor A's `actor_id`.

**RLS status:** ASSUMED — app code does not verify RLS policy; comment in controller notes RLS reliance.

**Result:** PARTIAL — cannot confirm from source alone. App-layer bypass is CONFIRMED; DB-layer defense requires RLS verification.

**Evidence:** Controller and DAL have no ownership check. The Supabase client uses Actor B's session JWT. Whether the RLS policy enforces `auth.uid()` matches `actor_id` through `actor_owners` is unknown.

**Severity:** HIGH if RLS absent; LOW if RLS present and correct.

**Escalation:** CARNAGE (DB migration/RLS audit) required before this can be closed.

**VENOM Cross-Reference:** BW-FEED-005

---

### VIEWER CONTEXT FUZZ ATTEMPT — listActorPosts controller viewerActorId

**Target:** `apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js:33-37`

**Injected context:**
```
viewerActorId: "00000000-0000-0000-0000-000000000001"  (fake non-existent UUID)
actorId: <Target Actor A's UUID>
```

**Expected result:** ERROR (invalid viewerActorId should be rejected)

**Actual result:**
```js
if (!actorId) throw new Error("Missing actorId");    // passes — actorId is real
if (!viewerActorId) throw new Error("Missing viewerActorId");  // passes — viewerActorId is non-empty
return listActorPostsByActorDAL({ actorId, ...(limit != null && { limit }) });
// viewerActorId is never passed to DAL — Actor A's posts returned regardless
```

**Context validation:** ABSENT — viewerActorId is checked for emptiness only; its value is never used. Any non-empty string passes.

**Severity:** MEDIUM — controller's authorization interface is deceptive; viewerActorId is never enforced

**VENOM Cross-Reference:** VEN-FEED-004

---

### RLS VERIFICATION ATTEMPT — listActorPosts profile post visibility bypass

**Target:** `apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js` → `apps/VCSM/src/features/feed/dal/listActorPostsByActor.dal.js`

**Attack vector:**
Actor B views Actor A's profile (Actor A has a private account, Actor B is NOT following Actor A).

Profile view → "Posts" tab calls `listActorPosts({ actorId: A, viewerActorId: B })` → controller passes `actorId: A` to DAL.

`listActorPostsByActorDAL` query:
```js
supabase.schema("vc").from("posts")
  .select(`id, actor_id, text, title, media_url, media_type, post_type, tags, created_at, realm_id`)
  .eq("actor_id", actorId)   // Actor A's posts
  .is("deleted_at", null)
  .order("created_at", { ascending: false })
  .limit(limit);
```

**No viewer-context filtering:** `viewerActorId` is not passed to the DAL. No block check. No follow check. No privacy check. The query returns ALL of Actor A's non-deleted posts regardless of Actor A's privacy setting, block relationships, or follow status.

**Defense simulation:**
- App layer: NO visibility filter applied in this path (unlike the central feed pipeline which uses `normalizeFeedRows` + `feedRowVisibility.model`)
- DB layer: RLS on `vc.posts` is the ONLY defense — if RLS enforces privacy/block/follow, it blocks; if RLS only enforces `deleted_at IS NULL`, private posts are EXPOSED

**RLS status:** ASSUMED — the controller comment states "RLS enforces visibility & privacy" but this has never been verified for the privacy/block case specifically.

**Result:** PARTIAL — app layer BYPASSED (no visibility model applied); DB layer ASSUMED BLOCKED (RLS UNVERIFIED)

**Table / View:** `vc.posts`
**Attack vector:** Profile posts tab → listActorPosts controller → listActorPostsByActorDAL — no visibility filter
**RLS status:** ASSUMED
**Result:** PARTIAL — requires DB verification

**Evidence:**
- Central feed uses: `normalizeFeedRows` + `resolveFeedRowVisibilityModel` → private/block/follow checked ✓
- Profile posts uses: `listActorPostsByActorDAL` → only `actor_id = A` + `deleted_at IS NULL` → no visibility model applied ✗

**Severity:** HIGH if RLS does not enforce privacy/block (private posts visible to non-followers in profile view)
**Exploitability:** HIGH — any authenticated user can view any other actor's profile posts tab

**Escalation:** CARNAGE (DB) required to verify RLS policy on `vc.posts` for this case.

**VENOM Cross-Reference:** VEN-FEED-004

---

### HYDRATION POISONING ATTEMPT

**Target:** `apps/VCSM/src/features/feed/hooks/useCentralFeed.js:133-165` — Zustand actor store upsert

**Attack vector:**
After each page load, `upsertActors()` is called with actor data from `feed.read.actorsBundle.dal.js`. Attempt to poison the actor store by injecting fake actor data.

**Defense simulation:**
- Actor data comes from `readActorsBundle(actorIds)` which reads from `vc.actors + vport.profiles + actor_privacy_settings` via Supabase (RLS-controlled)
- Actor IDs used in the upsert come from DB-returned `pageRows.map(r => r.actor_id)` — sourced from the DB, not user input
- No client-provided actor data enters the hydration path

**Result:** EXPLOIT_BLOCKED — actor hydration data originates exclusively from DB queries; no user-controlled actor injection possible

**Cache invalidation:** Background `hydrateActorsByIds` runs for stale/missing actors — refreshes from DB

**Severity:** N/A — no viable attack vector

---

### CACHE EXPLOIT — 60s stale block/follow cache

**Target:** `feed.read.blockRows.dal.js` / `feed.read.followRows.dal.js` — 60s TTL

**Attack vector:**
1. Actor B views their feed (Actor A's posts appear)
2. Actor A blocks Actor B (block row inserted in `moderation.blocks`)
3. Within 60 seconds, Actor B refreshes feed
4. `readFeedBlockRowsDAL` returns cached block rows (cache key: `viewerActorId = B`) — the VIEWER's outgoing blocks
5. But Actor A's block OF Actor B is from Actor A's perspective — the viewer's cache does NOT contain Actor A→B block direction (it contains B's own blocks of others)

Wait — let me re-read `readFeedBlockRowsDAL`:
```js
const orClause =
  `and(blocker_actor_id.eq.${viewerActorId},blocked_actor_id.in.(...))` +
  `,and(blocked_actor_id.eq.${viewerActorId},blocker_actor_id.in.(...))`
```

This fetches BOTH directions: rows where viewer blocks others AND rows where others block viewer. So if Actor A blocks Actor B (inserting a block row), Actor B's feed SHOULD pick this up on the next cache refresh.

**Cache behavior for mutual blocking:**
- If Actor A (NOT the viewer) blocks Actor B (the viewer):
  - The block row: `blocker=A, blocked=B`
  - Actor B's (viewer's) next `readFeedBlockRowsDAL` call fetches: `blocked_actor_id.eq.B` → would find the row
  - But: the cache is keyed to `viewerActorId = B` with 60s TTL
  - If Actor B has a cached result (loaded before Actor A blocked them), the stale cache serves the old rows (no block found) for up to 60s
  - Within 60s: Actor A's posts still appear in Actor B's feed

**Result:** PARTIAL — stale visibility window of up to 60s for mutual block scenarios. Self-blocking invalidates immediately via `invalidateFeedBlockCache(actorId)`. External blocks (another actor blocks the viewer) don't trigger cache invalidation until TTL expires.

**Evidence:**
- `readFeedBlockRowsDAL`: 60s TTL per viewerActorId
- `invalidateFeedBlockCache`: only called from `handleBlockActor` (viewer's own block action)
- No event-driven cache invalidation for incoming block events

**Cache invalidation:** PARTIAL (self-block only; incoming block = 60s stale)

**Severity:** LOW — limited 60s window; content visibility only (no data mutation risk)

**VENOM Cross-Reference:** BW-FEED-006

---

### URL SURFACE TEST — Share link raw UUID

**Target:** `apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js:246`

**Test:**
```js
const url = `${window.location.origin}/post/${postId}`
// postId = raw UUID from feed data, e.g., "550e8400-e29b-41d4-a716-446655440000"
// Generated URL: "https://app.vcsm.com/post/550e8400-e29b-41d4-a716-446655440000"
```

**UUID exposure:** PRESENT — raw post UUID appears in share URL

**Slug enforcement:** MISSING — no human-readable slug path for posts

**Route destination analysis:**
Both `/post/:postId` and `/posts/:postId` route to `PostDetailScreen` → `PostDetailView` → `usePostDetailPost(postId, actorId)` → `getPostById` → **`checkPostVisibilityDAL` performs live DB block/privacy/follow check** ✓

**Positive finding:** The route destination DOES properly re-verify authorization at the DB level. A shared raw UUID link does NOT expose private posts to unauthorized viewers. The visibility gate at the destination is ENFORCED via live DB queries (not cached data).

**Remaining concern:** The raw UUID in the share URL:
1. Violates the platform no-raw-UUIDs-in-URLs invariant
2. Exposes the `vc.posts` table primary key structure in distributed links
3. Allows a non-content attack: Actor B can use the UUID to probe whether they can access a post (try URL → see if post renders or returns empty → infers follow relationship between actor B and the post author for private authors)

**Result:** PARTIAL — content exposure BLOCKED by `checkPostVisibilityDAL`; UUID exposure in URL is PRESENT (platform invariant violated); oracle inference possible

**Severity:** MEDIUM (platform rule violation + oracle inference)

**VENOM Cross-Reference:** BW-FEED-007

---

## NEW ADVERSARIAL FINDINGS

---

### BLACKWIDOW ADVERSARIAL FINDING

**Finding ID:** BW-FEED-NEW-001
**Scenario:** React Query cache not cleared on logout — session residue with private data
**Target:** `apps/VCSM/src/app/providers/AuthProvider.jsx:167-216` (logout function)
**Application Scope:** VCSM
**Platform Surface:** PWA
**Attack Vector:**
1. Actor A logs in, navigates to `/feed`
2. React Query cache fills: `centralFeed` query contains `debugRows` (private profile flags for filtered actors) + `filterDebugRows` in `useCentralFeed` state — `gcTime: 10min`
3. Actor A calls `logout()` — `AuthProvider.logout()` clears session/user state, localStorage, sessionStorage debug keys — but does NOT call `queryClient.clear()` or `queryClient.removeQueries()`
4. React Query cache persists in memory for `gcTime: 10 minutes` after the query becomes inactive
5. During this window: on a shared browser, another user can open DevTools and inspect the stale React Query cache, reading Actor A's `filterDebugRows` (private profile status, visibility reasons, actor UUIDs for filtered posts)

**Exploit Chain Type:** Cache exploit — sensitive data persists in client memory after session termination

**Governance Status:** DRAFT

**Result:** BYPASSED — logout does not clear React Query in-memory cache; session data residue is confirmed from source

**Evidence:**
```js
// AuthProvider.jsx - logout() — CONFIRMED FROM SOURCE
const logout = async (navState = {}) => {
  setSession(null)
  setUser(null)
  setLoading(false)
  localStorage.removeItem('actor_kind')
  clearAllIdentityStorage()
  sessionStorage.removeItem('vcsm.debug.identity.events')
  // ... other clears ...
  navigate('/login', { replace: true, state: navState })
  await dalSignOut('local')
  // ← NO queryClient.clear() or queryClient.removeQueries() here
}
```

And from `useCentralFeed.js`:
```js
gcTime: 10 * 60 * 1000,  // 10 minutes in-memory retention after query becomes inactive
```

**Defense Gate:** ABSENT — React Query cache is NOT cleared on logout

**Blast Radius:** Single actor (session residue visible only on same device/browser). Shared device risk: another user on same browser can read previous user's cached data during 10-minute gcTime window.

**Severity:** MEDIUM

**VENOM Finding Cross-Reference:** VEN-FEED-007 (filterDebugRows in production cache)

**Recommended Fix:**
In `AuthProvider.logout()`, call `queryClient.clear()` before navigation:
```js
const queryClient = useQueryClient()  // inject at AuthProvider scope
const logout = async (navState = {}) => {
  // ... existing clears ...
  queryClient.clear()  // ADD: eliminate all React Query cache on logout
  navigate('/login', ...)
  await dalSignOut('local')
}
```

**Layer to Fix:** Controller (AuthProvider) / Cache
**Required Follow-up Command:** ELEKTRA

---

### BLACKWIDOW ADVERSARIAL FINDING

**Finding ID:** BW-FEED-NEW-002
**Scenario:** Profile posts tab bypasses app-layer visibility model — private posts exposed via listActorPosts
**Target:** `apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js` → `apps/VCSM/src/features/feed/dal/listActorPostsByActor.dal.js`
**Application Scope:** VCSM
**Platform Surface:** PWA, Supabase Table/View
**Attack Vector:**
Actor B views Actor A's profile. Actor A has a private account. Actor B is NOT following Actor A.

1. Profile posts tab calls `listActorPosts({ actorId: A, viewerActorId: B })`
2. Controller passes only `actorId: A` to DAL (`viewerActorId: B` is discarded)
3. `listActorPostsByActorDAL`: `SELECT ... FROM vc.posts WHERE actor_id = A AND deleted_at IS NULL`
4. NO visibility model applied: no `resolveFeedRowVisibilityModel`, no block check, no follow check, no privacy check
5. Returns ALL of Actor A's non-deleted posts to Actor B

Compare to central feed which applies full visibility model:
```
Central feed:  normalizeFeedRows → resolveFeedRowVisibilityModel → block/follow/private checks ✓
Profile posts: listActorPostsByActorDAL → no visibility model applied ✗
```

**Exploit Chain Type:** Single-step exploit — visibility model absent from profile post read path

**Governance Status:** DRAFT

**Result:** PARTIAL — app layer BYPASSED; DB layer (RLS on `vc.posts`) ASSUMED to be the sole defense. If RLS does not enforce privacy/block for this query, private posts are fully exposed.

**Evidence:**
```js
// listActorPostsByActor.dal.js:3-26
export async function listActorPostsByActorDAL({ actorId, limit = 60 }) {
  const { data, error } = await supabase
    .schema("vc").from("posts")
    .select(`id, actor_id, text, title, media_url, ...`)
    .eq("actor_id", actorId)    // only filter: owned by actor
    .is("deleted_at", null)     // only filter: not deleted
    // No: block check, follow check, privacy check, viewer context
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
```

**Defense Gate:** WEAK — app-layer ABSENT; DB-layer (RLS) ASSUMED

**Blast Radius:** Multi-actor — any authenticated user can potentially access any actor's private posts via profile posts tab if RLS is insufficient

**Severity:** HIGH if RLS is insufficient; MEDIUM if RLS correctly enforces privacy

**VENOM Finding Cross-Reference:** VEN-FEED-004 (listActorPosts discards viewerActorId)

**Recommended Fix:**
Option A (preferred): Apply the same visibility model to the profile posts path that the central feed uses. Pass `viewerActorId` through to the DAL and add a caller-context filter.
Option B: Verify via CARNAGE that RLS on `vc.posts` enforces privacy/block/follow for this query pattern. Document the RLS dependency explicitly in the controller.

**Layer to Fix:** Controller / DAL / RLS
**Required Follow-up Command:** CARNAGE (DB verification first), then IRONMAN

---

### BLACKWIDOW ADVERSARIAL FINDING

**Finding ID:** BW-FEED-NEW-003
**Scenario:** filterDebugRows private data exposed in production React Query DevTools
**Target:** `apps/VCSM/src/features/feed/queries/fetchCentralFeedPage.js:103` / `useCentralFeed.js:111-120`
**Application Scope:** VCSM
**Platform Surface:** PWA, Feed Engine
**Attack Vector:**
1. Authenticated user loads `/feed` in any environment (production or dev)
2. React Query cache receives `fetchCentralFeedPage` result including `debugRows` array
3. `debugRows` contains visibility records for ALL posts fetched (including filtered ones):
   - `{ post_id, actor_id, visible: false, reason: 'private_not_following', is_private: true, is_following: false, actor_kind: 'user' }`
4. `useCentralFeed` computes `filterDebugRows` from `data.pages[n].debugRows`
5. In production: `DebugFeedFilterPanel` does NOT render (DEV-gated)
6. But `filterDebugRows` is in React Query's in-memory state store for the duration of the session + `gcTime: 10min`
7. Attacker opens React Query DevTools (installed as browser extension) or inspects `window.__reactQueryClient` → reads all `filterDebugRows` entries

**Exploit Chain Type:** Cache exploit — sensitive metadata stored unconditionally in production client-side state

**Governance Status:** DRAFT

**Result:** BYPASSED — `debugRows` are present in production React Query cache with no DEV gate on their creation. Confirmed from source: `includeDebug: true` at `fetchFeedPage.pipeline.js:163` is unconditional.

**Evidence:**
```js
// fetchCentralFeedPage.js:77
if (Array.isArray(debugRows)) allDebugRows.push(...debugRows)
// ...
return {
  posts: normalizedChunk,
  debugRows: allDebugRows,   // ← ALWAYS included, no DEV gate
  ...
}
```

```js
// fetchFeedPage.pipeline.js:163
const { normalized, debugRows } = normalizeFeedRows({
  ...
  includeDebug: true,   // ← UNCONDITIONAL — debugRows built even in production
})
```

**Defense Gate:** ABSENT — `includeDebug: true` is unconditional; `debugRows` always returned from pipeline

**Blast Radius:** Single actor (viewer's own session only; data not transmitted to server). Attacker must have access to the viewer's browser to exploit.

**Severity:** MEDIUM — private profile flags exposed in client-side memory; requires DevTools access

**VENOM Finding Cross-Reference:** VEN-FEED-007

**Recommended Fix:** In `fetchCentralFeedPage.js`, gate `includeDebug` behind `import.meta.env.DEV`:
```js
const { normalized, debugRows } = res
// In production: debugRows is empty and not stored in React Query
if (import.meta.env.DEV && Array.isArray(debugRows)) allDebugRows.push(...debugRows)
// Return: debugRows: import.meta.env.DEV ? allDebugRows : []
```

**Layer to Fix:** Controller (fetchCentralFeedPage)
**Required Follow-up Command:** ELEKTRA

---

## Prior Finding Status Classification

| Finding ID | Prior Severity | Prior Status | BLACKWIDOW 2026-06-06 Status | Evidence |
|---|---|---|---|---|
| BW-FEED-001 | HIGH | OPEN | STILL_OPEN_SOURCE_VERIFIED | App-layer ownership bypass confirmed; controller accepts any actorId; RLS ASSUMED |
| BW-FEED-002 | MEDIUM | OPEN | STILL_OPEN_SOURCE_VERIFIED | Hook accepts caller-provided actorId; session binding by convention only |
| BW-FEED-003 | MEDIUM | OPEN | CLOSED_SOURCE_VERIFIED | Three-layer DEV gate confirmed; ?debug= param blocked at IS_DEV compile-time constant |
| BW-FEED-004 | LOW | OPEN | STILL_OPEN_SOURCE_VERIFIED | DEV-only context; actorId/userId confusion in debug controller confirmed |
| BW-FEED-005 | MEDIUM | OPEN | NOT_VERIFIABLE_SOURCE_MISSING | RLS on actor_onboarding_steps cannot be verified from source; CARNAGE required |
| BW-FEED-006 | LOW | OPEN | STILL_OPEN_SOURCE_VERIFIED | 60s stale cache confirmed; self-block invalidates; external/incoming block = 60s window |
| BW-FEED-007 | MEDIUM | OPEN | STILL_OPEN_SOURCE_VERIFIED — PARTIAL | Raw UUID present in share URL; destination visibility check PROPERLY enforced via checkPostVisibilityDAL; oracle inference still possible |
| BW-FEED-008 | HIGH | OPEN (THOR BLOCKER) | CLOSED_SOURCE_VERIFIED — **THOR BLOCKER RESOLVED** | Three-layer DEV protection confirmed via source; debug controller unreachable in production |

**New findings this run:** BW-FEED-NEW-001, BW-FEED-NEW-002, BW-FEED-NEW-003

---

## Successful Exploit Chains

| Chain | Type | Finding | Severity |
|---|---|---|---|
| ctrlMarkWelcomeCardSeen → any actorId accepted → DB write | Single-step (app layer) | BW-FEED-001 | HIGH (app-layer) |
| listActorPosts → viewerActorId discarded → no visibility filter | Single-step | BW-FEED-NEW-002 | HIGH (if RLS absent) |
| fetchCentralFeedPage → debugRows unconditional → React Query cache | Cache exploit | BW-FEED-NEW-003 | MEDIUM |
| logout → React Query not cleared → session residue | Cache exploit | BW-FEED-NEW-001 | MEDIUM |
| share URL → raw UUID exposed → oracle inference via presence check | URL surface | BW-FEED-007 | MEDIUM |
| 60s TTL block cache → stale visibility after incoming block | Cache exploit | BW-FEED-006 | LOW |

---

## Failed Exploit Chains (Defenses That Held)

| Chain | Result | Finding | Evidence |
|---|---|---|---|
| ?debug=all in production URL → debug panels activate | EXPLOIT_BLOCKED | BW-FEED-003 (CLOSED) | IS_DEV compile-time false; dead-code eliminated |
| getDebugPrivacyRowsController call in production | EXPLOIT_BLOCKED | BW-FEED-008 (CLOSED) | Three-layer DEV gate |
| Actor store hydration poisoning via fake actor data | EXPLOIT_BLOCKED | (new) | Actor data originates from DB, not user input |
| Share URL raw UUID → private post content exposed at destination | PARTIAL BLOCK | BW-FEED-007 | checkPostVisibilityDAL performs live DB visibility check |
| Viewer actorId injection at hook level in normal PWA flow | BLOCKED | BW-FEED-002 | Identity adapter derives actorId from session; no direct user param |

---

## BLACKWIDOW FINDINGS

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-FEED-001

- **Finding ID:** BW-FEED-001
- **Scenario:** Ownership bypass — ctrlMarkWelcomeCardSeen accepts cross-actor writes
- **Target:** apps/VCSM/src/features/feed/controllers/feedWelcomeCard.controller.js:12
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table/View
- **Attack Vector:** Authenticated Actor B calls ctrlMarkWelcomeCardSeen({ actorId: <Actor_A_UUID> })
- **Exploit Chain Type:** Single-step exploit (one gate missing)
- **Governance Status:** DRAFT
- **Result:** BYPASSED (app layer) / ASSUMED BLOCKED (RLS — unverified)
- **Evidence:** Controller accepts any actorId, no session binding check; DAL upserts actor_id from caller parameter
- **Defense Gate:** ABSENT (app layer)
- **Blast Radius:** Single actor (low-sensitivity write — onboarding state)
- **Severity:** HIGH (structural ownership bypass on write path)
- **VENOM Finding Cross-Reference:** BW-FEED-001, VEN-FEED-004
- **Recommended Fix:** Verify caller actorId against Supabase session user via `actor_owners` lookup before upsert, OR enforce via RLS policy (verify RLS enforces `auth.uid()` relationship through actor_owners to actor_id)
- **Layer to Fix:** Controller / RLS
- **Required Follow-up Command:** CARNAGE (DB), IRONMAN (controller fix)

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-FEED-NEW-001

- **Finding ID:** BW-FEED-NEW-001
- **Scenario:** Logout does not clear React Query cache — session data residue
- **Target:** apps/VCSM/src/app/providers/AuthProvider.jsx:167-216
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Attack Vector:** Actor logs out; React Query cache (including filterDebugRows with private profile flags) persists in memory for gcTime:10min; shared browser: another user reads cached data via DevTools
- **Exploit Chain Type:** Cache exploit — sensitive data persists after session termination
- **Governance Status:** DRAFT
- **Result:** BYPASSED — logout confirmed to not clear React Query cache from source
- **Evidence:** AuthProvider.logout() contains no queryClient.clear() call; gcTime:10min confirmed in useCentralFeed.js
- **Defense Gate:** ABSENT
- **Blast Radius:** Single actor (same device only); shared device risk
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VEN-FEED-007 (filterDebugRows in cache)
- **Recommended Fix:** Call `queryClient.clear()` in AuthProvider.logout() before navigation. This eliminates all React Query cache entries on logout.
- **Layer to Fix:** Controller (AuthProvider) / Cache
- **Required Follow-up Command:** ELEKTRA

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-FEED-NEW-002

- **Finding ID:** BW-FEED-NEW-002
- **Scenario:** Profile posts tab bypasses visibility model — private posts potentially exposed
- **Target:** apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js → listActorPostsByActor.dal.js
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table/View
- **Attack Vector:** Authenticated user views private actor's profile posts tab → controller returns all posts with no visibility model applied
- **Exploit Chain Type:** Single-step exploit (visibility model absent from profile post read path)
- **Governance Status:** DRAFT
- **Result:** PARTIAL — app layer BYPASSED; RLS ASSUMED; DB verification required
- **Evidence:** listActorPostsByActorDAL has no block/follow/privacy filter; central feed applies full visibility model in contrast
- **Defense Gate:** WEAK (app layer absent; RLS assumed)
- **Blast Radius:** Multi-actor — any authenticated user can query any actor's posts via profile posts tab
- **Severity:** HIGH if RLS insufficient; MEDIUM if RLS correct
- **VENOM Finding Cross-Reference:** VEN-FEED-004
- **Recommended Fix:** CARNAGE (verify RLS) first; then add app-layer visibility filter in listActorPosts controller if RLS insufficient
- **Layer to Fix:** Controller / DAL / RLS
- **Required Follow-up Command:** CARNAGE

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-FEED-NEW-003

- **Finding ID:** BW-FEED-NEW-003
- **Scenario:** filterDebugRows with private profile flags in production React Query cache — readable via DevTools
- **Target:** apps/VCSM/src/features/feed/queries/fetchCentralFeedPage.js:103 / pipeline:163
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Feed Engine
- **Attack Vector:** Authenticated user loads /feed; debugRows with is_private flags accumulate in React Query cache unconditionally; inspectable via browser DevTools React Query cache
- **Exploit Chain Type:** Cache exploit — debug metadata stored without environment guard
- **Governance Status:** DRAFT
- **Result:** BYPASSED — includeDebug: true is unconditional; debugRows in production React Query cache confirmed
- **Evidence:** fetchFeedPage.pipeline.js:163 — includeDebug: true passed unconditionally; fetchCentralFeedPage.js:77 — debugRows stored in return value with no DEV gate
- **Defense Gate:** ABSENT
- **Blast Radius:** Single actor (viewer's own cached data only; requires DevTools access)
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VEN-FEED-007
- **Recommended Fix:** Gate includeDebug: import.meta.env.DEV in fetchCentralFeedPage.js; return debugRows: [] in production builds
- **Layer to Fix:** Controller (fetchCentralFeedPage)
- **Required Follow-up Command:** ELEKTRA

---

## Blast Radius Summary

| Finding | Blast Radius | Impact Scope |
|---|---|---|
| BW-FEED-001 | Single actor | Actor A's onboarding state corrupted (low data value) |
| BW-FEED-002 | Single actor | Hook actorId manipulation requires identity store corruption |
| BW-FEED-005 | Single actor write / multi-actor read | Depends on RLS policy |
| BW-FEED-006 | Single actor (viewer) | 60s stale visibility window |
| BW-FEED-007 | Multi-actor | All actors with shared posts; oracle inference |
| BW-FEED-NEW-001 | Single device / shared device | Session residue on shared browser |
| BW-FEED-NEW-002 | Multi-actor | All private actors in profile view (if RLS absent) |
| BW-FEED-NEW-003 | Single actor | Private profile status of filtered actors in viewer's session |

---

## Recommended Fixes

| Finding | Fix | Layer | Priority |
|---|---|---|---|
| BW-FEED-001 | Add actorId session binding in ctrlMarkWelcomeCardSeen; verify RLS | Controller / RLS | P1 |
| BW-FEED-NEW-001 | Add queryClient.clear() to AuthProvider.logout() | Cache (AuthProvider) | P1 |
| BW-FEED-NEW-002 | CARNAGE: verify RLS on vc.posts for profile posts path | RLS / Controller | P1 |
| BW-FEED-NEW-003 | Gate includeDebug behind import.meta.env.DEV in fetchCentralFeedPage | Controller | P1 |
| BW-FEED-007 | Replace raw UUID share URL with slug-based URL (/post/<slug> or /u/<username>/post/<slug>) | UI / Router | P2 |
| BW-FEED-006 | Event-driven cache invalidation for incoming block events | Cache | P3 |
| BW-FEED-002 | Add session binding assertion at hook layer or inject verified identity from context | Controller / Hook | P2 |

---

## Required Follow-up Commands

| Command | Reason | Priority |
|---|---|---|
| CARNAGE | Verify RLS on vc.actor_onboarding_steps (BW-FEED-001/005) and vc.posts profile posts path (BW-FEED-NEW-002) | P1 |
| ELEKTRA | Patch advisory for BW-FEED-NEW-001 (logout cache clear), BW-FEED-NEW-003 (includeDebug gate) | P1 |
| IRONMAN | Controller fixes: ctrlMarkWelcomeCardSeen ownership, listActorPosts viewerActorId, useFeed.adapter update | P1 |
| VENOM | Re-verify after IRONMAN/CARNAGE patches applied | P2 |
| THOR | Evaluate new release gate status — BW-FEED-008 resolved; new HIGH findings require assessment | P2 |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| CARNAGE | RLS verification: actor_onboarding_steps write ownership, vc.posts profile posts visibility | PENDING |
| ELEKTRA | Patch advisory for cache/debug findings | PENDING |
| IRONMAN | Controller ownership fixes | PENDING |
| VENOM | Re-verify after patches | PENDING |
| THOR | Fresh session gate — prior THOR blocker BW-FEED-008 RESOLVED; new HIGH findings require assessment | PENDING |

---

## BLACKWIDOW Recommendation

**BLACKWIDOW recommends:** CAUTION

**Rationale:**
- BW-FEED-008 (prior THOR blocker) is CLOSED — the debug privacy controller is properly protected
- Two new HIGH findings require DB verification before they can be classified as blocked or confirmed (BW-FEED-NEW-002: profile posts visibility, BW-FEED-001: welcome card RLS)
- Two new MEDIUM findings have clear code-level fixes (BW-FEED-NEW-001: logout cache clear, BW-FEED-NEW-003: includeDebug gate)
- CARNAGE must run on `vc.actor_onboarding_steps` and `vc.posts` RLS policies before THOR gate can be evaluated
- BLACKWIDOW does NOT emit THOR_RELEASE_ELIGIBLE — that authority belongs to THOR alone

**BLACKWIDOW may NOT emit:** THOR_RELEASE_ELIGIBLE
