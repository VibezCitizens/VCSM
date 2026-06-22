# Feature Contract: post

**Status:** SPLIT_CANDIDATE  
**Risk:** MEDIUM  
**Files:** 116 (scanner 2026-06-05)  
**Inbound imports:** 19  
**Outbound imports:** 22  
**Violations:** 0  
**Split candidate:** YES (exceeds 100-file threshold; vport-type business logic embedded in generic post renderer)

---

## 1. Purpose

`post` owns the post card rendering and interaction system:
- `PostCard.view.jsx` — generic post renderer
- Comment card rendering and actions
- Post detail view
- Post sharing (ShareModal)
- Post deletion
- Post reactions (roses, comments)
- 8 vport-type-specific post modules embedded in the post card (`postModules/`)

The embedded `postModules/` system is the structural problem — a generic post renderer should not know about barbershops, locksmiths, and gas stations.

---

## 2. Non-Goals

`post` must not own:
- Feed rendering — that is `feed/`
- Actor profile rendering — that is `profiles/`
- Notification dispatch (post can trigger it but must go through notifications adapter)
- Vport-type-specific business logic — `postModules/` should be extracted (ARCH-POSTMOD-001)

---

## 3. Public API / Adapter Boundary

**Known adapters (confirmed by scanner):**
- `post/adapters/postCard.adapter` — consumed by `feed/screens/CentralFeedScreen.jsx`
- `post/adapters/postcard/hooks/useDeletePostAction.adapter` — consumed by `feed/hooks/useCentralFeedActions.js`
- `post/adapters/postcard/components/PostActionsMenu.adapter` — consumed by `feed/screens/CentralFeedScreen.jsx`
- `post/adapters/postcard/components/ShareModal.adapter` — consumed by `feed/screens/CentralFeedScreen.jsx` and `profiles/`
- `post/adapters/screens/PostDetail.view.adapter` — consumed by `notifications/screen/NotiViewPostScreen.jsx`
- `post/adapters/postcard/components/ShareModal.adapter` — consumed by `profiles/adapters/ui/actorProfileScreenDependencies.adapter.js`

The adapter surface is well-established and actively consumed. Any new component or hook that another feature needs from `post` must be exposed via `post/adapters/`, not imported directly.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `post/adapters/` | Rich adapter surface — postCard, postcard/hooks, postcard/components, screens |
| hooks | `post/hooks/` | Post interaction hooks |
| controllers | `post/controllers/` | `commentReactions.controller`, `postComments.controller`, `sendRose.controller`, `togglePostReaction.controller` — all confirmed firing notifications |
| dal | `post/dal/` | Post data access |
| model | `post/model/` | Post shape |
| screens | `post/screens/` | `PostDetail.view.jsx`, `PostFeed.screen.jsx` |
| postcard | `post/postcard/` | Nested subsystem — ui/, postModules/ |
| postModules | `post/postcard/postModules/` | 8 vport-type modules + shared/ components — ARCH-POSTMOD-001 target |

**postModules structure (confirmed by FEATURES_TICKET_PLAN.md):**
```
postModules/
  barbershopHours/
  barbershopPortfolio/
  exchangeRates/
  fuelPrices/
  locksmithHours/
  locksmithPortfolio/
  locksmithServiceArea/
  menuDrop/
  shared/       ← PostModuleCta, PostModuleFrame, PostModuleHeader
```

The `PostCard.view.jsx` statically imports all 8 modules (lines 6-13 confirmed). This is an open/closed violation — every new vport type requires modifying the generic post renderer.

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `notifications` | Post controllers fire notifications — BIDIR SAFE (Pair 10) | YES — 4 controllers import `notifications/adapters/notifications.adapter` |
| `media` | Post media attachment | YES (TODO: confirm adapter usage) |
| `profiles` | Post displays actor profiles — BIDIR SAFE (Pair 13) | YES — profiles→post is clean (14 adapter imports); post→profiles is CSS only (violation) |
| `upload` | Post media upload | TODO: confirm |
| `moderation` | Post reporting | TODO: confirm |
| `social` | Post sharing/social signals | TODO: confirm |
| `identity` | Active actor for post actions | Confirmed by outbound count |

---

## 6. Prohibited Dependencies

`post` must not import from:
- `profiles/` CSS files — VIOLATION (post imports `profiles-modern.css` in 2 files — ARCH-BIDIR-CSS-001)
- `feed/` — feed is the container; post must not know about feed
- `dashboard/` — management surface
- `settings/` — configuration surface
- Any feature's `dal/` or `controller/` directly

---

## 7. DAL / Controller Rules

**DAL rules:**
- Post DAL may query `vc.posts`, `vc.post_comments`, `vc.post_reactions` tables
- Must use explicit column projections
- Must not determine actor authorization independently
- Must not query `vc.actor_owners`

**Controller rules:**
- `commentReactions.controller`, `postComments.controller`, `sendRose.controller`, `togglePostReaction.controller` confirmed to fire notifications through adapter
- Must verify actor context before mutations
- Must not import Supabase directly

**postModules — currently unregulated:**
- The 8 postModule components are static imports in `PostCard.view.jsx`
- After ARCH-POSTMOD-001 executes: modules must be accessed via a registry lookup, not static imports
- Each module must be purely presentational — no DAL or controller calls inside modules (they receive post payload as props)

---

## 8. Known Coupling

**CSS violations (not classified as scanner violations for `post` but tracked in BIDIR):**
- `post/postcard/ui/EditPost.jsx` → `profiles/styles/profiles-modern.css` — CSS-LEAK (Pair 13)
- `post/screens/PostDetail.view.jsx` → `profiles/styles/profiles-modern.css` — CSS-LEAK (Pair 13)

Fix: ARCH-BIDIR-CSS-001 — move `profiles-modern.css` to `shared/styles/`.

**Bidirectional pairs — all LEGITIMATE:**
- `post` ↔ `feed` — Pair 8 (UI-COMPOSITION)
- `post` ↔ `notifications` — Pair 10 (LEGITIMATE)
- `post` ↔ `profiles` — Pair 13 (CSS-LEAK on post side, clean 14 adapter imports on profiles side)

**Scanner reports 0 violations for post.** The 2 CSS imports are tracked as BIDIR pair violations, not as post-feature violations.

---

## 9. Risk Notes

**MEDIUM.** The `postModules/` system is the primary structural risk. `PostCard.view.jsx` is in the central feed rendering path — any change to it requires testing all 8 vport-type post formats individually.

CSS violations are low risk (no behavior change) but must be fixed before ARCH-POSTMOD-001 executes to keep the migration clean.

---

## 10. Migration Notes

**ARCH-POSTMOD-001 (Open, READY):**
- Plan extraction of `postModules/` from `post/postcard/`
- Design a `postModuleRegistry` pattern (map of `postType → Component`)
- One module at a time, starting with simplest (`fuelPrices`)
- The `shared/` components in `postModules/shared/` must be evaluated — generic enough for `shared/components/` or post-module-specific

**ARCH-BIDIR-CSS-001:** Move `profiles-modern.css` to `shared/styles/`; update 2 post import sites.

---

## 11. Unknowns

- TODO: Confirm injection mechanism in `PostCard.view.jsx` — switch statement? conditional rendering? prop?
- TODO: Confirm props each postModule receives (post payload shape)
- TODO: Confirm whether `postModules/shared/` components (`PostModuleCta`, `PostModuleFrame`, `PostModuleHeader`) are generic enough for `shared/components/`
- TODO: Identify remaining outbound imports (22 total — 4 notifications + 2 CSS + unknown remainder)
- TODO: Confirm whether post has its own `controller/` or `controllers/` naming (ARCH-NAMING-001)
