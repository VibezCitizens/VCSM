---
report: falcon_feed-dal-parity
date: 2026-05-14
scope: apps/VCSM/src/features/feed/ — all production surfaces
triggered_by: CEREBRO verification pass on vcsm.dal.feed.md
authority: GOVERNANCE_WRITABLE
---

# FALCON — Feed Feature Native Parity + iOS Governance
_Date:_ 2026-05-14  
_Scope:_ `apps/VCSM/src/features/feed/` — all 21 live production DAL functions + `CentralFeedScreen`  
_Triggered by:_ CEREBRO verification pass on `vcsm.dal.feed.md`

---

## FA1 — BLOCKING: iOS Stacking Context Violation — `FeedConfirmModal`

**Severity: BLOCKING**

**File:** `apps/VCSM/src/features/feed/screens/FeedConfirmModal.jsx`  
**Rendered in:** `apps/VCSM/src/features/feed/screens/CentralFeedScreen.jsx`  
**Container:** `shared/components/PullToRefresh.jsx`

### The Violation

`FeedConfirmModal` uses `position: fixed`:
```jsx
<div className="fixed inset-0 z-[1000000] flex items-center justify-center px-4">
```

It is rendered **inside** `<PullToRefresh>`, which applies `transform: translateY(${pull}px)` to its `{children}` wrapper:
```jsx
// PullToRefresh.jsx:108-113
<div style={{
  transform: pull ? `translateY(${pull}px)` : undefined,
  transition: status === 'refreshing' ? 'transform 150ms ease' : 'transform 0ms',
}}>
  {children}  // ← FeedConfirmModal is rendered here
</div>
```

### CLAUDE.md Prohibition (explicit)

> **Never render `position: fixed` modals inside a parent that has:**
> - `transform` (including `translateZ(0)`)
>
> Always render modals as **fragment siblings**, not children of styled card containers.

### iOS Safari Behavior

When `pull > 0` (user initiating a pull-to-refresh gesture), `transform: translateY(${pull}px)` is applied to the children wrapper. In iOS Safari, `position: fixed` inside a `transform` ancestor becomes positioned relative to the **transformed element**, not the viewport. The modal renders at an offset equal to the current `pull` value and does not appear at the center of the screen.

### When Does This Trigger?

- Any time the user has the `FeedConfirmModal` open (delete confirmation, block confirmation) and simultaneously attempts a pull-to-refresh gesture
- The modal will shift visually with the pull, breaking the overlay appearance
- On release, the modal snaps back

### Required Fix

Move `FeedConfirmModal` outside of `<PullToRefresh>`. The correct structure:

```jsx
// CentralFeedScreen.jsx — correct fragment sibling pattern
return (
  <>
    {import.meta.env.DEV && <FeedDebugPanel />}
    <PullToRefresh ...>
      {/* feed content only — no modals */}
      ...
    </PullToRefresh>

    {/* Modals OUTSIDE PullToRefresh — fragment siblings */}
    <FeedConfirmModal ... />
    <ReportModal ... />
    <PostActionsMenu ... />
    <ShareModal ... />
    <Toast ... />
  </>
)
```

Also note: `FeedConfirmModal` itself uses `backdrop-blur-sm` on its overlay div:
```jsx
<div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
```

This `backdrop-filter` (for `backdrop-blur`) further creates a new stacking context inside the modal. This is acceptable IF the modal is a fragment sibling (outside transform parents). It remains a concern if nested inside any parent with `transform`.

**Also affected:** `PostActionsMenu`, `ReportModal`, `ShareModal`, `Toast` — all are also rendered inside `<PullToRefresh>`. These should all be moved to fragment siblings.

**FALCON Ruling: BLOCKING — fix required before any native transfer of this screen.**

---

## FA2 — Native Parity Assessment: 21 Production DAL Functions

### Functions Confirmed Production-Live

| # | Function | Table(s) | Native Relevance |
|---|---|---|---|
| 1 | `fetchPostMentionRows` + `readPostMentionRows` | `vc.post_mentions` + hydration | YES — mentions display in posts |
| 2 | `readFeedPostsPage` | `vc.posts` | YES — primary feed list |
| 3 | `invalidateActorBundleEntry` | cache only | YES — actor update invalidation |
| 4 | `invalidateActorsBundleCache` | cache only | YES — global actor cache invalidation |
| 5 | `readActorsBundle` | `vc.actors`, `public.profiles`, `vc.actor_privacy_settings`, `vport.profiles` | YES — post card avatar/name |
| 6 | `invalidateFeedBlockCache` | cache only | YES — block action invalidation |
| 7 | `readFeedBlockRowsDAL` | `moderation.blocks` | YES — feed filtering |
| 8 | `readCommentCountsBatch` | `vc.post_comments` | YES — comment count badge |
| 9 | `invalidateFeedFollowCache` | cache only | YES — follow action invalidation |
| 10 | `readFeedFollowRowsDAL` | `vc.actor_follows` | YES — private post visibility |
| 11 | `readHiddenPostsForViewer` | `moderation.actions` | YES — hidden post suppression |
| 12 | `invalidatePostMediaCache` | cache only | YES — media update invalidation |
| 13 | `readPostMediaMap` | `vc.post_media` | YES — post image/video |
| 14 | `readFeedPostsPage` | `vc.posts` | YES — pagination cursor |
| 15 | `readReactionCountsBatch` | `vc.post_reactions`, `vc.post_rose_gifts` | YES — reaction counts on cards |
| 16 | `readViewerReactionsBatch` | `vc.post_reactions` | YES — viewer's own reaction state |
| 17 | `markWelcomeFeedCardSeenDAL` | `vc.actor_onboarding_steps` | YES — onboarding state |
| 18 | `readWelcomeFeedCardStateDAL` | `vc.actor_onboarding_steps` | YES — welcome card visibility |
| 19 | `listActorPostsByActorDAL` | `vc.posts` | DIAGNOSTICS-ONLY — no native concern |
| 20 | `readProfileAdultFlagDAL` | `vc.actors`, `vc.profiles` | DIAGNOSTICS-ONLY — no native concern |
| 21 | `readViewerActorIdentityDAL` | `vc.actors`, `vc.profiles` | DIAGNOSTICS-ONLY — no native concern |

**21 live production functions confirmed native-relevant. 18 require native parity.**

---

## FA3 — Native Parity Gaps (Status: Not Yet Assessed)

No native transfer has begun for the feed feature. WinterSoldier handoff not initiated.

### High-Priority Native Surfaces

| Surface | Reason for High Priority |
|---|---|
| Feed list + pagination | Core user surface — visible on every app open |
| Post card reaction state | Interactive — tap to react; server state round-trip |
| Comment count badges | Realtime data — needs Supabase Realtime consideration |
| Media loading | Image/video loading strategy differs on native vs web |
| Hidden post suppression | Privacy-critical — must not show filtered posts |
| Block/follow cache invalidation | Must fire on native block/follow actions |

### WinterSoldier Prerequisite

The following decisions must be made before WinterSoldier begins Android transfer:
1. Confirm `PullToRefresh` native equivalent (SwipeRefreshLayout / native PTR)
2. Confirm modal stacking context on Android (transform rules differ)
3. Confirm Supabase JS client is used or native SDK equivalent

---

## FA4 — `resolvePublicRealmIdDAL` Native Status (PASS)

`resolvePublicRealmIdDAL` is a pure constant return. Native equivalent: import the same constant from the shared realm config. No DB access, no RLS, no streaming. Native transfer is trivial.

---

## FA5 — `feedWelcomeCard.dal.js` Native Status (DEFERRED)

The welcome feed card (onboarding step) is a native-relevant surface. UPSERT on `actor_onboarding_steps` requires the native client to use the authenticated Supabase session. No special handling needed beyond standard auth.

---

## FALCON Verdict

| Check | Status |
|---|---|
| iOS stacking context — `FeedConfirmModal` | BLOCKING |
| iOS stacking context — `ReportModal`, `PostActionsMenu`, `ShareModal`, `Toast` | BLOCKING (same issue) |
| 18 native-relevant production functions identified | ASSESSED |
| WinterSoldier handoff | NOT INITIATED |
| Native feed parity documentation | PENDING WINTERSOLDIER |

**BLOCKING issue must be resolved before any native transfer of `CentralFeedScreen`.**

**FALCON Verdict: BLOCKED — fix iOS stacking context violations first.**
