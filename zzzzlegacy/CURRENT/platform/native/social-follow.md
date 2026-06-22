# Module: Social follow / subscribe flows

## PWA Source of Truth

**Routes:** Integrated into profile, public VPORT, notifications, settings follow requests

**Screens/components:**
- `apps/VCSM/src/features/social/*`
- `apps/VCSM/src/features/profiles/*`
- `apps/VCSM/src/features/settings/privacy/*`

**Services/DAL:**
- `apps/VCSM/src/features/social/friend/request/dal/*`
- `apps/VCSM/src/features/social/friend/subscribe/*`
- `apps/VCSM/src/features/social/privacy/dal/actorPrivacy.dal.js`

**Supabase schema/tables/RPCs:**
- `vc.actor_follows`
- `vc.follow_requests`
- `vc.actor_privacy_settings`
- notification follow events

**RLS expectations:** Follow/request/subscriber writes must be actor-authenticated, privacy-aware, and active-actor scoped.

**Current PWA status:** Source of truth for follow/unfollow, request accept/reject, subscriber counts, and private actor behavior.

---

## Native Transfer Status

**Status:** `Partial`

---

## Transferred Native Files

- `VCSMNativeApp/Features/Profile/Controller/TriggerProfileFollow.controller.swift`
- `VCSMNativeApp/Features/Profile/DAL/ProfileFollowRequests.dal.swift`
- `VCSMNativeApp/Features/Profile/Screens/FollowRequestsScreen.swift`
- `VCSMNativeApp/Features/Profile/Screens/FollowersFollowingScreen.swift`
- `VCSMNativeApp/Features/Profile/DAL/ProfileContentReads.dal.swift`
- `VCSMNativeApp/Features/Profile/Components/ProfileHeaderCard.swift`
- `VCSMNativeApp/Features/Notifications/NotificationsView.swift`

---

## Native Behavior Currently Present

- Native follow trigger, follow request screen/DAL, profile social sections, and follow request notification actions exist.
- Followers and Following list screens implemented with `FollowersFollowingScreen.swift`.
- Profile header now shows tappable follower/following counts linking to respective list screens.
- Deep-link routes wired: `/profile/:actorId/followers` and `/profile/:actorId/following`.
- Data flow: fetch follow rows → extract actor IDs → batch enrich via `profileReadActorCardsDAL` → display with `ProfileActorRow`.

---

## Native Gaps

- Follow/unfollow/request state machine not verified against PWA at runtime.
- Follow privacy side effects with feed visibility and notifications need integration tests.

---

## Risk Notes

- Follow state feeds into private profile visibility and feed filtering — partial behavior can leak or hide content incorrectly.
- Follow/unfollow state transitions must be consistent across profile, notifications, and feed surfaces.

---

## Pending Transfer Checklist

- [ ] Compare PWA follow status states to native model enum/state.
- [ ] Test public profile follow, private profile request, accept/reject, unfollow, and notification actions.
- [x] Implement followers/following list screens with navigation from profile header.
- [ ] Runtime test followers/following list screens with real data.
- [ ] Verify subscriber counts/lists for VPORT profile tabs.

---

## PWA → Native Transfer Log

### 2026-05-03 — Followers/following list screens and profile header navigation

- Date: 2026-05-03
- Change type: Feature / UI
- PWA files changed: none
- Routes affected: `/profile/:actorId/followers`, `/profile/:actorId/following`
- Screens/components changed: `FollowersFollowingScreen.swift` (new), `ProfileHeaderCard.swift` (tappable counts), `AppNavigationView.swift` (destinations), `AppRouteParser.swift` (deep-link routes)
- Services/DAL changed: none — reuses existing `profileReadFollowerIDsDAL`, `profileReadFollowingIDsDAL`, `profileReadActorCardsDAL`
- Behavior change: Profile header now shows separate tappable FOLLOWERS and FOLLOWING counts that navigate to list screens. Previously only showed a single non-interactive SUBSCRIBERS count.
- Supabase schema/RPC change: none
- RLS expectations changed: no
- Affected native modules: Social follow, Profile
- Priority: P1
- Native status: Partial — screens implemented, runtime testing pending
- Testing notes: Xcode diagnostics zero issues. Runtime test pending.
- Notes: Uses existing `ProfileActorRow` for list items. Two-stage data loading (follow rows → batch actor card enrichment). Pull-to-refresh and empty states included.

---

## Transfer History

- Last synced date: 2026-05-03
- Native files updated: `FollowersFollowingScreen.swift` (new), `ProfileHeaderCard.swift`, `AppNavigationView.swift`, `AppRouteParser.swift`, `NativeAppRoute.swift`
- Delta status: Partial — followers/following list screens added; follow state machine and privacy integration still need runtime testing
- Notes: Profile header follower/following counts now tappable. Deep-link routes wired.

---

## Archived Notes

No archived notes yet.
