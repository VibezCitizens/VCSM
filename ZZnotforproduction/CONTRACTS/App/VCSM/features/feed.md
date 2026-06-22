# Feature Contract: feed

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 46 (scanner 2026-06-05)  
**Inbound imports:** 10  
**Outbound imports:** 13  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`feed` owns the central feed experience:
- Data fetching and pagination
- Feed post pipeline (sorting, filtering, composing feed items)
- Cache management for follow-status changes and block changes
- The central feed screen rendering (consuming post cards)
- Feed actions (follow, block) accessible from within the feed

`feed` is the **core content discovery surface** of the app. It composes content from `post/` and social state from `social/`, but owns neither.

---

## 2. Non-Goals

`feed` must not own:
- Post card rendering — that is `post/`
- Follow/unfollow logic — that is `social/`
- Block/unblock logic — that is `block/`
- Notification inbox — that is `notifications/`
- Explore/search — that is `explore/`

---

## 3. Public API / Adapter Boundary

**Known adapters:**
- `feed/adapters/feedCache.adapter` — confirmed by scanner (consumed by social follow controllers and block hooks for cache invalidation)
- `feed/adapters/hooks/useFeed.adapter` — confirmed by scanner (consumed by `post/screens/PostFeed.screen.jsx`)

The `feedCache.adapter` is a critical shared surface — any feature that performs an action affecting feed ordering (follow, block, mute) should invalidate the feed cache through this adapter.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `feed/adapters/` | `feedCache.adapter`, `hooks/useFeed.adapter` confirmed |
| hooks | `feed/hooks/` | `useCentralFeedActions.js` confirmed; pagination hooks |
| dal | `feed/dal/` | Feed data access |
| model | `feed/model/` | Feed item shape |
| screens | `feed/screens/` | `CentralFeedScreen.jsx` confirmed |
| pipeline | `feed/pipeline/` | Thoughtful data flow separation layer (architecture review) |
| queries | `feed/queries/` | Query layer alongside pipeline |

**Note on `queries/`:** Architecture review notes feed has a `pipeline/` and `queries/` layer — thoughtful data flow separation. The `queries/` layer is used in feed only (not settings which uses it as a non-standard DAL variant). ARCH-NAMING-001 should confirm whether `queries/` is a valid alias for DAL in this context.

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `post` | Feed renders post cards — BIDIR SAFE (Pair 8) | YES — `CentralFeedScreen.jsx` imports `post/adapters/postCard.adapter`, `postcard/components/PostActionsMenu.adapter`, `postcard/components/ShareModal.adapter` |
| `social` | Feed surfaces follow buttons — BIDIR SAFE (Pair 9) | YES — `useCentralFeedActions.js` imports `social/adapters/friend/subscribe/hooks/useFollowActorToggle.adapter`, `useFollowStatus.adapter` |
| `block` | Block invalidates feed cache — BIDIR SAFE (Pair 3) | YES — `useCentralFeedActions.js` imports `block/adapters/hooks/useBlockActorAction.adapter` |
| `identity` | Resolve active actor for feed | Confirmed by outbound count |
| `notifications` | Feed may surface notification indicators | TODO: confirm |

---

## 6. Prohibited Dependencies

`feed` must not import from:
- `profiles/` internals — feed may surface actor avatars/names but must get data through profiles adapters
- `dashboard/` — management surface
- `settings/` — configuration surface
- `chat/` — messaging surface
- Any feature's `dal/` or `controller/` directly

---

## 7. DAL / Controller Rules

**DAL rules:**
- Feed DAL may query the posts/feed tables
- Must use explicit column projections
- Must receive `actorId` as filter parameter from controller
- Must not determine follow status or block status independently — those are provided by social/block controllers via hooks

**Controller rules (if any):**
- Feed does not clearly have controller files per the architecture review — feed orchestration may happen at the hook level
- TODO: Confirm whether `feed/` has a `controller/` folder

**`feedCache.adapter` rules:**
- This adapter exists to allow other features (social, block) to invalidate the feed cache without importing feed hooks directly
- It must only expose cache invalidation functions — not feed data
- Callers (social controllers, block hooks) call this adapter after their own operations succeed

---

## 8. Known Coupling

**Bidirectional pairs — all LEGITIMATE:**
- `feed` ↔ `post` — Pair 8 (UI-COMPOSITION)
- `feed` ↔ `social` — Pair 9 (QUERY-INVALIDATION + UI-COMPOSITION)
- `feed` ↔ `block` — Pair 3 (QUERY-INVALIDATION)

All three pairs are at adapter boundaries. Feed surfaces content (post cards, follow buttons, block actions) while the respective features fire cache invalidation when their state changes.

**No violations.** Scanner confirms 0 violations.

---

## 9. Risk Notes

**LOW.** Clean feature with clear responsibilities. The bidirectional pairs are all legitimate and well-managed through adapter boundaries.

The `pipeline/` and `queries/` layers add some complexity to the data flow. If future developers add new feed data sources, they should follow the existing pipeline pattern rather than adding direct DAL calls.

---

## 10. Migration Notes

No pending migration for feed. Structure is stable and healthy.

ARCH-NAMING-001: Confirm canonical names for `pipeline/` and `queries/` layers within feed context.

---

## 11. Unknowns

- TODO: Confirm whether feed has a `controller/` folder or orchestrates at hook level
- TODO: Identify remaining 8 outbound imports beyond confirmed post/social/block
- TODO: Identify all 10 inbound consumers
- TODO: Confirm whether `feed/queries/` is equivalent to `dal/` or a separate layer
