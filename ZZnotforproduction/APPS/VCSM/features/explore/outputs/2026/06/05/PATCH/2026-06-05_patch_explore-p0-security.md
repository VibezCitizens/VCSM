# P0 Security Patch Report — VCSM:explore
## 2026-06-05 | TICKET-EXPLORE-P0-SECURITY-PATCH-0001

---

## Report Metadata

| Field | Value |
|---|---|
| Ticket | TICKET-EXPLORE-P0-SECURITY-PATCH-0001 |
| Feature | VCSM:explore |
| Patch Type | P0 — THOR blockers only |
| Source Scope | apps/VCSM/src/features/explore/ |
| Date | 2026-06-05 |
| Files Changed | 6 |
| Findings Addressed | 4 (ELEK-001, ELEK-002, ELEK-003 side-effect, ELEK-005) |
| Findings Deferred | 3 (ELEK-004, ELEK-006, ELEK-007) |
| THOR Status | PENDING VERIFICATION — re-run ELEKTRA + BLACKWIDOW |

---

## 1. Patch Summary

### PATCH-001 — VEN-EXPLORE-002 / ELEK-001: viewerActorId injection (3-layer SESSION_BIND)

**Problem:** `ctrlSearchResults` always called `searchDal(trimmed, filter, {})` — hard-coded empty opts.
The DAL already correctly accepted `viewerActorId` from opts and passed it to `identity.search_actor_directory`
as `p_viewer_actor_id`. The missing link was the Hook → Controller layer.

**Evidence:** VEN-EXPLORE-002 (HIGH), BW-EXPLORE-001 (BYPASSED / PRACTICAL), ELEK-001 (REACHABLE)

**Changes:**

`hooks/useSearchScreenController.js`
- Added `import { useIdentity } from '@/features/identity/adapters/identity.adapter'`
- Added `const identity = useIdentity()` + `const actorId = identity?.actorId ?? null` inside hook
- Updated `getSearchCacheKey(query, filter, actorId)` — actorId is now part of the cache key signature
- Cache key format: `${actorId ?? 'anon'}:${filter}:${query}` (resolves VEN-004 as side effect)
- Updated `ctrlSearchResults` call: `{ query: debounced, filter, viewerActorId: actorId }`
- Added `actorId` to search useEffect dependency array `[debounced, filter, actorId]`

`controller/searchResults.controller.js`
- Updated function signature: `{ query, filter, viewerActorId = null }`
- Updated searchDal call: `searchDal(trimmed, filter, { viewerActorId })` (was `{}`)

**DAL (unchanged):** `dal/search.dal.js` already destructures `viewerActorId = null` from opts
and passes it to the RPC as `p_viewer_actor_id`. No DAL changes required.

**Before/After:**
```
Before: p_viewer_actor_id: null (always — block/privacy bypassed for ALL searches)
After:  p_viewer_actor_id: <actorId> (from session) | null (unauthenticated)
```

---

### PATCH-002 — VEN-EXPLORE-003 / ELEK-002: UUID navigation — actor rows

**Problem:** `normalizeActorRow()` returned `username: row.username ?? ''` — empty string is falsy.
Both `ActorSearchResultRow` and `FeaturedResultCard` used `actor.username ?? actor.actor_id` as the
navigation segment. When username is null or empty, UUID was placed directly in the URL.

**Evidence:** VEN-EXPLORE-003 (HIGH), BW-EXPLORE-005 (BYPASSED / PRACTICAL), ELEK-002 (REACHABLE)

**Changes:**

`model/search.model.js`
- Added model-layer guard in `normalizeActorRow`: `if (!row.username) return null`
- Guard covers null, undefined, and empty string (all falsy)
- Actors without a navigable username are suppressed from results entirely
- Callers already use `.filter(Boolean)` on `normalizeActorRow` output

`ui/ActorSearchResultRow.jsx`
- Removed UUID fallback: `actor.username ?? actor.actor_id` → `actor.username && navigate(...)`
- Defense-in-depth: guard prevents navigation even if upstream passes empty string

`ui/FeaturedResultCard.jsx`
- Removed UUID fallback: `item.username ?? item.actor_id` → `item.username && navigate(...)`
- Same defense-in-depth pattern

---

### PATCH-002b — VEN-EXPLORE-003 / ELEK-002: UUID navigation — post cards

**Problem:** `PostCard` always navigated to `/posts/${post.id}` — raw UUID from `vc.posts.id`.
No slug field exists in the `searchPosts` RPC response or in `normalizeResult` post case.

**Evidence:** VEN-EXPLORE-003 (HIGH), BW-EXPLORE-005 (BYPASSED / TRIVIAL), ELEK-002 (REACHABLE)

**Decision:** Per patch prompt — "Do not invent slug data if source does not provide it."
Navigation is suppressed rather than fabricated. Post slug adoption is a P1 track item.

**Changes:**

`ui/PostCard.jsx`
- Changed: `onClick={() => navigate(\`/posts/${post.id}\`)}` removed
- Changed to: `onClick={post.slug ? () => navigate(\`/posts/${post.slug}\`) : undefined}`
- When `post.slug` is falsy (current state — slug not provided by DAL): button renders but does not navigate
- Forward-compatible: when slug is added to the post RPC response, navigation activates automatically

---

### PATCH-003 — VEN-EXPLORE-004 / ELEK-003: cache cross-session leak (side effect of PATCH-001)

**Problem:** `getSearchCacheKey(query, filter)` produced the same key for any viewer — a logged-out
user on a shared device could hit the cache of a previously authenticated user's search.

**Evidence:** VEN-EXPLORE-004 (MEDIUM), BW-EXPLORE-001 (PARTIAL / PLAUSIBLE), ELEK-003 (REACHABLE)

**Changes (side effect — no standalone edit required):**

`hooks/useSearchScreenController.js`
- `getSearchCacheKey` now accepts `actorId` as 3rd parameter
- Cache key format: `${actorId ?? 'anon'}:${filter}:${query}` (was `${filter}:${query}`)
- Authenticated searches keyed by actorId; unauthenticated searches keyed as `anon`
- No cross-actor cache hits possible

---

### PATCH-004 — VEN-EXPLORE-006 / ELEK-005: FeaturedResultCard UUID fallback (included in PATCH-002)

**Problem:** `FeaturedResultCard` — the first/hero result position — used the same
`item.username ?? item.actor_id` UUID fallback pattern. This is the highest-frequency
navigation surface in the explore feature.

**Evidence:** VEN-EXPLORE-006 (HIGH/NEW), BW-EXPLORE-007 (BYPASSED / PRACTICAL), ELEK-005 (REACHABLE)

**Fix:** Included in PATCH-002 actor changes above. `FeaturedResultCard` fix is documented there.

---

## 2. Findings Addressed

| Finding | Severity | Status Before | Status After | Method |
|---|---|---|---|---|
| ELEK-2026-06-05-001 / VEN-002 | HIGH | Open (REACHABLE) | Patched | PATCH-001: 3-layer SESSION_BIND |
| ELEK-2026-06-05-002 / VEN-003 (actor) | HIGH | Open (REACHABLE) | Patched | PATCH-002: model null guard + component fix |
| ELEK-2026-06-05-002 / VEN-003 (post) | HIGH | Open (REACHABLE) | Patched | PATCH-002b: slug-gated onClick |
| ELEK-2026-06-05-003 / VEN-004 | MEDIUM | Open (REACHABLE) | Patched (side effect) | PATCH-001 cache key scoping |
| ELEK-2026-06-05-005 / VEN-006 | HIGH | Open (REACHABLE) | Patched | PATCH-002: component fix |

---

## 3. Findings Deferred

| Finding | Severity | Reason |
|---|---|---|
| ELEK-2026-06-05-004 / VEN-005 | LOW | Legacy userId/ownerUserId in model output — cleanup pass; IRONMAN to own; no exploit path |
| ELEK-2026-06-05-006 / VEN-007 | MEDIUM | Route auth conflict — HAWKEYE verification required first; do not patch blind |
| ELEK-2026-06-05-007 / DB | MEDIUM | vc.posts RLS private actor coverage — DB to verify; no DAL code change possible without schema confirmation |

---

## 4. Files Changed

| File | Change | Findings |
|---|---|---|
| `apps/VCSM/src/features/explore/hooks/useSearchScreenController.js` | useIdentity import; actorId derivation; cache key scoped; ctrlSearchResults opts updated; dep array updated | ELEK-001, ELEK-003 |
| `apps/VCSM/src/features/explore/controller/searchResults.controller.js` | viewerActorId in params; passed to searchDal opts | ELEK-001 |
| `apps/VCSM/src/features/explore/model/search.model.js` | normalizeActorRow: null guard on !row.username | ELEK-002, ELEK-005 |
| `apps/VCSM/src/features/explore/ui/PostCard.jsx` | Slug-gated onClick; UUID navigation suppressed | ELEK-002 (post) |
| `apps/VCSM/src/features/explore/ui/ActorSearchResultRow.jsx` | UUID fallback removed; username guard | ELEK-002 (actor) |
| `apps/VCSM/src/features/explore/ui/FeaturedResultCard.jsx` | UUID fallback removed; username guard | ELEK-005 |

---

## 5. Behavior Changes

| Path | Before | After | Preserved? |
|---|---|---|---|
| Block/privacy enforcement | p_viewer_actor_id: null (bypassed) | p_viewer_actor_id: <actorId from session> | YES — existing behavior when authenticated |
| Cache isolation | Shared across all viewers | Scoped per actorId (or 'anon') | YES — cache still works; keys now viewer-safe |
| Actor navigation (no username) | Navigates to /profile/<UUID> | Suppressed (component does not navigate) | N/A — was a violation |
| Actor navigation (valid username) | Navigates to /profile/<username> | Navigates to /profile/<username> | YES — unchanged |
| Post navigation | Navigates to /posts/<UUID> (always) | Suppressed until slug available | N/A — was a violation |
| Search on actor switch | Did not re-run (no actorId dep) | Re-runs with new actorId on identity switch | IMPROVED |

---

## 6. Grep Verification

Confirmed no remaining UUID navigation in patched components:

```
PostCard.jsx:14:      onClick={post.slug ? () => navigate(`/posts/${post.slug}`) : undefined}
ActorSearchResultRow.jsx:22:      onClick={() => actor.username && navigate(`/profile/${actor.username}`)}
FeaturedResultCard.jsx:13:        onClick={() => item.username && navigate(`/profile/${item.username}`)}
useSearchScreenController.js:15:  return `${actorId ?? 'anon'}:${filter}:${...}`
searchResults.controller.js:9:  const responses = await Promise.all(searchDal(trimmed, filter, { viewerActorId }))
search.model.js:99:  if (!row.username) return null
```

---

## 7. §9 Invariant Status After Patch

| Invariant | Status Before | Status After |
|---|---|---|
| NEVER-EXPLORE-001 (no actor_id UUID in URL) | BYPASSED | REMEDIATED — model guard + component fix |
| NEVER-EXPLORE-002 (no post.id UUID in URL) | BYPASSED | REMEDIATED — slug-gated navigation |
| NEVER-EXPLORE-003 (viewerActorId never from client) | BLOCKED | BLOCKED (unchanged — correct) |
| NEVER-EXPLORE-004 (blocked actor never in results) | BYPASSED | REMEDIATED — viewerActorId now injected from session |
| NEVER-EXPLORE-005 (deleted posts never shown) | BLOCKED | BLOCKED (unchanged — correct) |
| NEVER-EXPLORE-006 (no fetch on empty query) | BLOCKED | BLOCKED (unchanged — correct) |

---

## 8. Required Next Commands

| Command | Purpose | Priority |
|---|---|---|
| ELEKTRA re-run | Confirm source-to-sink closure for ELEK-001/002/003/005 | P0 (before THOR re-evaluation) |
| BLACKWIDOW re-run | Confirm BW-001/005/007 bypass chains are closed | P0 (before THOR re-evaluation) |
| SPIDER-MAN | Regression tests: blocked actor visibility, UUID nav guard, cache isolation, post card suppression | P0 (required by ticket) |
| HAWKEYE | /explore route auth enforcement verification; resolve ELEK-006/VEN-007 | P1 |
| DB | vc.posts RLS private actor coverage; resolve ELEK-007 | P1 |
| THOR | Re-evaluate gate after ELEKTRA + BW + SPIDER-MAN confirm closure | — |

---

## 9. Audit Trail

| Command | Date | Status | Output |
|---|---|---|---|
| ARCHITECT V2 | 2026-06-05 | COMPLETE | outputs/2026/06/05/ARCHITECT/ |
| VENOM V2 | 2026-06-05 | COMPLETE | outputs/2026/06/05/Venom/ |
| LOGAN | 2026-06-05 | COMPLETE | outputs/2026/06/05/Logan/ |
| BLACKWIDOW V3 | 2026-06-05 | COMPLETE | outputs/2026/06/05/BlackWidow/ |
| ELEKTRA V2 | 2026-06-05 | COMPLETE | outputs/2026/06/05/ELEKTRA/ |
| Triage Report | 2026-06-05 | COMPLETE | EXPLORE_SECURITY_TRIAGE_REPORT.md |
| **PATCH** | **2026-06-05** | **COMPLETE** | **outputs/2026/06/05/PATCH/** |

All paths relative to: `ZZnotforproduction/APPS/VCSM/features/explore/`
