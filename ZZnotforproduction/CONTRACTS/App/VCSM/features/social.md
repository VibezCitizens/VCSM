# Feature Contract: social

**Status:** CLEAN (adapter-side); OPEN (needs 1 adapter addition)  
**Risk:** LOW  
**Files:** 44 (scanner 2026-06-05)  
**Inbound imports:** 20  
**Outbound imports:** 17  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`social` owns the social graph and privacy system:
- Follow/subscribe relationships between actors
- Friend request management (send, accept, reject)
- Unsubscribe
- Privacy signals (who can see follower counts, follower lists)
- Social settings (public/private actor visibility)

`social` is a Layer 1 infrastructure feature — it is consumed by many features (20 inbound) and imports from few (feed cache invalidation, notifications dispatch).

---

## 2. Non-Goals

`social` must not own:
- Feed rendering — that is `feed/`
- Profile rendering — that is `profiles/`
- Notification rendering — that is `notifications/`
- Block/unblock — that is `block/` (block and social are separate social graph operations)
- Chat — that is `chat/`

---

## 3. Public API / Adapter Boundary

**Known adapters (confirmed by scanner):**
- `social/adapters/social.adapter` — consumed by `notifications/inbox/hooks/useNotificationInbox.js`
- `social/adapters/friend/subscribe/hooks/useFollowActorToggle.adapter` — consumed by `feed/hooks/useCentralFeedActions.js`
- `social/adapters/friend/subscribe/hooks/useFollowStatus.adapter` — consumed by `feed/` and `profiles/`
- `social/adapters/friend/request/hooks/useFollowRequestActions.adapter` — consumed by `notifications/types/follow/FollowRequestItem.view.jsx`
- `social/adapters/privacy/actorPrivacy.adapter` — consumed by `profiles/dal/readActorProfile.dal.js`

**Missing adapter — ARCH-BIDIR-SOCIAL-001:**
- `social/adapters/privacy/actorSignalVisibility.adapter.js` — does not yet exist
  - `actorSignalVisibility.dal` must be exposed here so `profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js` can use it through the boundary
- `social/adapters/privacy/actorSocialSettings.adapter.js` — does not yet exist (or not yet exposing these functions)
  - `actorSocialSettings.dal` and `actorSocialPublicPolicy.dal` must be exposed here for `settings/controller/vportSocialSettings.controller.js`

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `social/adapters/` | Rich adapter surface across friend/subscribe, friend/request, privacy subdirectories |
| hooks | `social/hooks/` | Follow, subscribe, friend request hooks |
| controllers | `social/controllers/` | `follow.controller`, `unsubscribe.controller`, `followRequests.controller` confirmed |
| dal | `social/dal/` | Social graph data access |
| privacy | `social/privacy/` | Privacy signal DAL — `actorSignalVisibility.dal`, `actorSocialSettings.dal`, `actorSocialPublicPolicy.dal` |
| model | `social/model/` | Social relationship shapes |
| components | `social/components/` | `PrivateProfileNotice.jsx` confirmed (imports `profiles/adapters/ui/PrivateProfileGate.adapter`) |

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `feed` | Follow/unfollow controllers invalidate feed cache — BIDIR SAFE (Pair 9) | YES — `follow.controller`, `unsubscribe.controller`, `followRequests.controller` → `feed/adapters/feedCache.adapter` |
| `notifications` | Follow events dispatch notifications — BIDIR SAFE (Pair 12) | YES — `follow.controller` and `followRequests.controller` → `notifications/adapters/notifications.adapter` |
| `profiles` | PrivateProfileNotice renders private profile gate — BIDIR SAFE (Pair 14) | YES — `social/components/PrivateProfileNotice.jsx` → `profiles/adapters/ui/PrivateProfileGate.adapter` |
| `identity` | Active actor | Confirmed by outbound count |
| `auth` | Auth context | Confirmed by outbound count |

---

## 6. Prohibited Dependencies

`social` must not import from:
- `profiles/` internals (non-adapter) — profiles imports social, not deep reverse
- `booking/` — unrelated domain
- `dashboard/`, `settings/` — management surfaces
- `chat/` — messaging surface
- `feed/` DAL or controllers directly — only `feed/adapters/feedCache.adapter`

---

## 7. DAL / Controller Rules

**DAL rules for `social/privacy/dal/`:**
- `actorSignalVisibility.dal` wraps Supabase RPC `can_view_actor_signal` — pure read operation
- `actorSocialSettings.dal` — social privacy settings read
- `actorSocialPublicPolicy.dal` — public policy settings read
- These must NOT be called from outside `social/` without going through `social/adapters/`
- The violation in `profiles/` (calling `actorSignalVisibility.dal` directly) must be fixed via ARCH-BIDIR-SOCIAL-001

**Controller rules:**
- `follow.controller.js` — dispatches notifications AND cache invalidation after follow. Correct pattern: Controller decides, calls adapters in other features.
- `followRequests.controller.js` — same pattern
- All social controllers must use the notifications adapter for dispatch, not the notifications DAL

---

## 8. Known Coupling

**0 scanner violations for social itself.**

**Social is a target of violations from other features:**
- `profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js` → `social/privacy/dal/actorSignalVisibility.dal` (VIOLATION in profiles)
- `settings/controller/vportSocialSettings.controller.js` → `social/privacy/dal/actorSocialSettings.dal` and `actorSocialPublicPolicy.dal` (VIOLATIONS in settings)

Social must add adapter exports to resolve these without changing the calling code in profiles and settings (other than updating import paths).

**Bidirectional pairs — all LEGITIMATE:**
- `social` ↔ `feed` — Pair 9 (QUERY-INVALIDATION + UI-COMPOSITION)
- `social` ↔ `notifications` — Pair 12 (LEGITIMATE)
- `social` ↔ `profiles` — Pair 14 (DAL-VIOLATION — profiles→social DAL; needs social adapter addition)

---

## 9. Risk Notes

**LOW.** Zero violations. Well-structured adapter surface. The required adapter additions (ARCH-BIDIR-SOCIAL-001) are low-risk — they are new files, not changes to existing files.

The social privacy DAL is directly accessed by 2 other features (profiles, settings). Once the adapters are added, any future change to `actorSignalVisibility.dal` only requires updating the adapter — not hunting for cross-feature import sites.

---

## 10. Migration Notes

**ARCH-BIDIR-SOCIAL-001:**
1. Create `social/adapters/privacy/actorSignalVisibility.adapter.js` — expose `dalCanViewActorSignal`
2. Create or extend `social/adapters/privacy/actorSocialSettings.adapter.js` — expose `actorSocialSettings.dal` and `actorSocialPublicPolicy.dal` functions
3. Update `profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js` — import from new adapter
4. Update `settings/controller/vportSocialSettings.controller.js` — import from new adapter(s)
5. Update test files

---

## 11. Unknowns

- TODO: Confirm complete list of exports in `social/adapters/social.adapter`
- TODO: Identify remaining 11 outbound imports (17 total — 6 confirmed + 11 unknown)
- TODO: Identify remaining 14 inbound consumers (20 total — 6 confirmed + 14 unknown)
- TODO: Confirm whether `social/` uses `controllers/` or `controller/` naming
