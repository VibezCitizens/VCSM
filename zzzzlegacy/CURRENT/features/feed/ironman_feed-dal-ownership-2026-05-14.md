---
report: ironman_feed-dal-ownership
date: 2026-05-14
scope: apps/VCSM/src/features/feed/dal/ — ownership decisions
triggered_by: CEREBRO verification pass on vcsm.dal.feed.md
authority: GOVERNANCE_WRITABLE
---

# IRONMAN — Feed DAL Ownership & Responsibility Map
_Date:_ 2026-05-14  
_Scope:_ `apps/VCSM/src/features/feed/` — DAL ownership questions + deletion candidates  
_Triggered by:_ CEREBRO verification pass on `vcsm.dal.feed.md`

---

## IM1 — `resolvePublicRealm.dal.js` Feature Ownership (UNRESOLVED)

**File:** `apps/VCSM/src/features/feed/dal/resolvePublicRealm.dal.js`

**Current state:** This file lives inside the feed DAL folder. Its only consumer is 8 vport publish controllers in `features/profiles/kinds/vport/controller/[domain]/`. The feed feature has zero consumers.

**What it does:**
```js
import { PUBLIC_REALM_ID } from "@/shared/utils/resolveRealm";
export function resolvePublicRealmIdDAL() { return PUBLIC_REALM_ID; }
```

**Why it exists in feed/dal/:** Unknown. Likely placed here during the initial feed realm system build before vport publish controllers existed.

**Ownership decision required:**

| Option | Result |
|---|---|
| Move to `features/profiles/kinds/vport/dal/` | Correct feature ownership; requires updating 8 controller imports |
| Move to `@/shared/utils/resolveRealm.js` and re-export | Eliminates DAL wrapper entirely; controllers import constant directly |
| Keep in `feed/dal/` with a comment | Documents the cross-feature dependency; no code change needed |

**IRONMAN Ruling:** The function is not a DAL (no DB access). Its residence in feed/dal is architecturally incorrect. SENTRY has flagged this as SA1. Recommended resolution: move to `@/shared/utils/resolveRealm.js` as a named export alongside `PUBLIC_REALM_ID`. The `DAL` wrapper adds nothing.

**Owner:** Feed feature lead + vport publish controller lead (joint decision — both features are affected)

---

## IM2 — `feed.mentions.dal.js` Refactor Ownership (REQUIRED)

**File:** `apps/VCSM/src/features/feed/dal/feed.mentions.dal.js`

**Issue:** This DAL imports `@hydration` engine — a backwards layer dependency. SENTRY flagged as SA2 (HIGH).

**Required refactor:**
1. `fetchRawPostMentionEdgesDAL` — new DAL that only queries `vc.post_mentions` and returns raw edges
2. Move enrichment (hydration call) to a controller or model layer
3. Update pipeline to call the raw DAL + pass edges to the enrichment layer

**Owner:** Feed feature lead — this requires coordinated changes to `feed.mentions.dal.js`, `fetchFeedPage.pipeline.js`, and potentially `buildMentionMaps.model.js`.

---

## IM3 — Empty `index.js` Deletion Candidates (5 files)

All 5 files confirmed empty (0 bytes or 0 exports) via prior audits. No callers import from these paths in `apps/VCSM/src/`.

| File | Path | Safe to Delete |
|---|---|---|
| `dal/index.js` | `features/feed/dal/index.js` | YES |
| `adapters/index.js` | `features/feed/adapters/index.js` | YES |
| `hooks/index.js` | `features/feed/hooks/index.js` | YES |
| `model/index.js` | `features/feed/model/index.js` | YES |
| `screens/index.js` | `features/feed/screens/index.js` | YES |

**Additional undocumented empty scaffolding:**

| File | Path |
|---|---|
| `api/index.js` | `features/feed/api/index.js` |
| `lib/index.js` | `features/feed/lib/index.js` |
| `ui/index.js` | `features/feed/ui/index.js` |
| `usecases/index.js` | `features/feed/usecases/index.js` |
| `feed/index.js` | `features/feed/index.js` (root) |

**IRONMAN Ruling:** All 10 empty index files are confirmed safe to delete. No production code imports from any of these paths. Recommend deleting all 10 in a single Wolverine cleanup task.

**Owner:** Feed feature lead — no cross-feature impact.

---

## IM4 — `feedWelcomeCard.controller.js` Folder Consolidation

**Current:** `features/feed/controller/feedWelcomeCard.controller.js` (singular `controller`)  
**Expected:** `features/feed/controllers/feedWelcomeCard.controller.js` (plural `controllers`)

The singular `controller/` folder exists as a one-file artifact. All other feed controllers are in `controllers/` (plural).

**IRONMAN Ruling:** Move the file. One-line import update in `useFeedWelcomeCard.js`.

**Owner:** Feed feature lead.

---

## IM5 — `FeedConfirmModal.jsx` Folder and Fix Ownership

**Current:** `features/feed/screens/FeedConfirmModal.jsx`  
**Required:** Move to `features/feed/components/FeedConfirmModal.jsx` (SENTRY SA3)  
**Also required:** Move modal render outside `<PullToRefresh>` in `CentralFeedScreen.jsx` (FALCON FA1 — BLOCKING)

**This is a source code change requiring Wolverine execution.**

**Owner:** Feed feature lead. Changes affect:
1. `features/feed/screens/FeedConfirmModal.jsx` → move to `components/`
2. `features/feed/screens/CentralFeedScreen.jsx` → update import path + move modal outside PullToRefresh
3. Same for `PostActionsMenu`, `ReportModal`, `ShareModal`, `Toast` — all should be moved outside PullToRefresh

---

## IM6 — `CentralFeedScreen.jsx` View/Final Split Ownership

**Issue:** `CentralFeedScreen` performs View Screen duties. Needs split into:
- `CentralFeedView.jsx` (new View Screen — all composition)
- `CentralFeedScreen.jsx` (Final Screen — identity gate only)

**Owner:** Feed feature lead. This is a refactor requiring Wolverine planning.

---

## Ownership Summary

| Item | Owner | Action | Priority |
|---|---|---|---|
| `resolvePublicRealm.dal.js` location | Feed + vport leads | Decide migration path | MEDIUM |
| `feed.mentions.dal.js` engine import | Feed feature lead | Refactor DAL → split | HIGH |
| 10 empty `index.js` files | Feed feature lead | Delete all 10 | LOW |
| `feedWelcomeCard.controller.js` folder | Feed feature lead | Move to `controllers/` | LOW |
| `FeedConfirmModal.jsx` location + placement | Feed feature lead | Move + fix stacking context | BLOCKING |
| `CentralFeedScreen` View/Final split | Feed feature lead | Refactor | MEDIUM |

**IRONMAN Verdict: OWNERSHIP MAPPED**  
All items have a clear owner. Two items require Wolverine source changes (BLOCKING: stacking context, HIGH: mentions DAL refactor). Four items are MEDIUM/LOW cleanup tasks.
