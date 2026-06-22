# VCSM Reviews — State Store Map

Scope: VCSM + ENGINE (reviews)
Scan Date: 2026-05-24
ARCHITECT Version: 26.14

---

## Summary

The reviews module uses **no Zustand stores, no localStorage, no sessionStorage,
and no in-memory singleton caches** on the authenticated dashboard path.

All state is local React state (useState/useReducer) owned by hooks and one view screen.

The public path uses one TTL cache (app-level, module-scoped Map).

---

## Global State Consumed

### Identity Context (React Context — not Zustand)

```
Store Name: IdentityContext
Provider: IdentityProvider (apps/VCSM/src/state/identity/identityContext.jsx)
Access Hook: useIdentity()
Import Path A: @/state/identity/identityContext  (used by VportDashboardReviewScreen, useVportReviews)
Import Path B: @/features/identity/adapters/identity.adapter (used by VportReviewsView)
Both paths resolve to the same hook — identity.adapter re-exports useIdentity from identityContext.
State shape consumed: { identity: { actorId, kind, displayName, username, avatarUrl, ... } }
Fields used by reviews:
  - identity.actorId → authorActorId for submit/delete guards
  - identity.kind → canReview gate (must be 'user')
  - identity.displayName/username/avatarUrl → optimistic review author card
Persistence Layer: React Context (in-memory, session-scoped)
Cross-feature consumers: Dashboard screen, view screen, hooks — all read-only
Risk: LOW — read-only access, no mutation of identity state from reviews module
```

---

## Local State (Reviews Module — Hook-Owned)

### useVportReviews (orchestrator hook)

```
State | Type | Owner | Purpose
tab | string ('overall'/'services'/dimKey) | useVportReviews | Active tab selection
services | array | useVportReviews | Service list for service tab
loadingServices | boolean | useVportReviews | Service load state
serviceId | string|null | useVportReviews | Selected service filter
dimensions | array | useVportReviews | Loaded dimension config
officialStats | object|null | useVportReviews | Aggregate stats from RPC
error | Error|null | useVportReviews | Last error
mountedRef | ref | useVportReviews | Unmount guard (prevents state updates after unmount)
inFlightCoreRef | ref | useVportReviews | In-flight guard for concurrent load prevention
inFlightServicesRef | ref | useVportReviews | In-flight guard for services load
Persistence: NONE — reinitializes on every mount
Cache: NONE — fresh DB reads on every reviews tab mount
```

### useVportReviewList (list sub-hook)

```
State | Type | Owner | Purpose
activeList | array | useVportReviewList | Current review page
loadingActiveList | boolean | useVportReviewList | Initial load state
hasMore | boolean | useVportReviewList | Pagination indicator
nextCursor | string|null | useVportReviewList | ISO timestamp cursor
loadingMore | boolean | useVportReviewList | Load-more in progress
inFlightListRef | ref | useVportReviewList | Concurrent load guard
Persistence: NONE — resets on unmount
Cache: NONE
Note: Tab changes trigger full list reload (reset + fresh fetch)
```

### useVportReviewMine (mine sub-hook)

```
State | Type | Owner | Purpose
myLoading | boolean | useVportReviewMine | Loading my review
myReview | object|null | useVportReviewMine | Current user's review
myExists | boolean | useVportReviewMine | Whether review exists
isEditing | boolean | useVportReviewMine | Edit mode flag
isDeleting | boolean | useVportReviewMine | Delete in progress
rating | number (1-5) | useVportReviewMine | Legacy single-dim rating (submit() path)
body | string | useVportReviewMine | Review body text (legacy submit() path)
saving | boolean | useVportReviewMine | Submit in progress
msg | string|null | useVportReviewMine | Success message
inFlightMyRef | ref | useVportReviewMine | Concurrent load guard
Persistence: NONE
Cache: NONE
Note: body and rating are for the legacy submit() path only.
      submitReview() path manages body + ratingsMap in VportReviewsView (BOUNDARY VIOLATION)
```

---

## Local State in View Screen (BOUNDARY VIOLATION)

### VportReviewsView.jsx — view-owned state that SHOULD be in a hook

```
State | Type | Currently In | Should Be In
body | string | VportReviewsView | useVportReviewCompose (new hook — to be extracted)
ratingsMap | object | VportReviewsView | useVportReviewCompose
activeDimKey | string|null | VportReviewsView | useVportReviewCompose
submitting | boolean | VportReviewsView | useVportReviewCompose
submitErr | Error|null | VportReviewsView | useVportReviewCompose
showDeleteConfirm | boolean | VportReviewsView | acceptable local UI state (can stay)
```

**SENTRY action:** Extract body, ratingsMap, activeDimKey, submitting, submitErr
and handleSubmit into `useVportReviewCompose.js`. View screen passes all as props.

---

## Cache Inventory

| Cache | Location | Scope | TTL | Keys | Invalidation |
|---|---|---|---|---|---|
| Public review summary | readPublicVportReviewSummaryDAL | Module-level Map | 60s | actorId | invalidatePublicReviewSummaryCache(actorId) |
| Auth review list | NONE | — | — | — | — |
| Auth review stats | NONE | — | — | — | — |
| Auth dimensions | NONE | — | — | — | — |
| Engine config (_config) | engines/reviews/config.js | Module singleton | App lifetime | N/A | configureReviewsEngine() call |

---

## Duplicate State Risk

### activeList owned in two places on submit

```
On submit, both useVportReviewList.activeList and useVportReviewMine.myReview
are updated independently via setActiveList passed down as prop.
Optimistic insert → real replace on success → rollback on error.
Risk: LOW — coordinated via shared setActiveList callback reference.
     If setActiveList reference becomes stale (closure issue), list may not update.
     React's useState setter is stable — no stale closure risk with useState setters.
```

### body state exists in two places

```
1. useVportReviewMine.body — for the legacy submit() path
2. VportReviewsView.body (local useState) — for the canonical submitReview() path
Both hold review body text independently.
Risk: LOW — they are separate paths, not synced. The legacy body state is unused by
     the canonical view. Confusion risk for future contributors.
IRONMAN action: Remove legacy body/rating state from useVportReviewMine after
                confirming submit() is fully deprecated.
```

---

## Reactivity / Re-render Map

```
Identity change (actor switch)
  → useIdentity() re-renders
  → VportDashboardReviewScreen re-evaluates viewerActorId + isOwner
  → VportReviewsView re-evaluates reviewAuthorActorId + canReview
  → useVportReviews: targetActorId unchanged, authorActorId changes
  → useVportReviewMine: loadMyReview re-triggers (authorActorId dep)
  → Full my-review reload on actor switch — CORRECT

Tab change
  → r.setTab(key) → useVportReviews re-renders
  → useVportReviewList receives new tab → loadActiveList() fires
  → Full 25-review list refetch on every tab change — INEFFICIENT
  → Client-side tab filter would be more efficient if list is already loaded
  → But current code fetches fresh on tab change regardless

Service selection change
  → r.setServiceId(id) → useVportReviews re-renders
  → useVportReviewList: serviceId dep → loadActiveList() fires
  → Refetch on service change — acceptable

Review submitted
  → submitReview() → setActiveList optimistic insert
  → On success: setActiveList replace + setMyReview(saved) + setMyExists(true)
  → loadCore() in background (stats reload)
  → No list page refetch — uses optimistic update — GOOD
```

---

## Missing Cache Opportunities

| Data | Current | Recommended | Benefit |
|---|---|---|---|
| ctrlGetOfficialStats | Fresh RPC on every mount | TTL cache (5min) keyed by actorId | Eliminates stats RPC on tab re-enter |
| ctrlListReviews (page 1) | Fresh DB on every mount | TTL cache (2min) keyed by actorId | Eliminates N+1 + list fetch on re-enter |
| ctrlGetReviewFormConfig | Fresh DB on every mount | TTL cache (10min) keyed by actorId | Dimensions rarely change |
| Tab state | Resets on unmount | Could persist in URL param (?tab=quality) | Better direct-link UX, owner bookmarking |
