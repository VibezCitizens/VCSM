# Feed Feature — Current Status

**As of:** 2026-05-14
**Sprint:** CEREBRO verification pass on `vcsm.dal.feed.md`

---

## Command Coverage

| Command | Status | Date |
|---|---|---|
| VENOM | COMPLETE — 3 OPEN findings (V1, V2, V3); V4/V6/V7 PASS | 2026-05-14 |
| SENTRY | COMPLETE — 2 VIOLATIONS (SA1, SA2), 2 DOC GAPS (SA6, SA7), 1 VIOLATION (SA3, SA4), 1 LOW (SA5) | 2026-05-14 |
| KRAVEN | COMPLETE — 3 MODERATE (KR1, KR2, KR3), 1 LOW (KR4), 1 PASS (KR5) | 2026-05-14 |
| LOKI | COMPLETE — 3 MODERATE (LK3, LK4, LK6), 3 LOW (LK1, LK2, LK5) | 2026-05-14 |
| THOR | NOT_STARTED | — |
| IRONMAN | NOT_STARTED | — |
| CARNAGE | NOT_STARTED | — |

---

## Open Security Findings (VENOM)

| ID | Severity | Description | Status |
|---|---|---|---|
| V1 | MODERATE | `readHiddenPostsForViewer` — client-supplied `viewerActorId`; safety depends on `moderation.actions` RLS | NEEDS CARNAGE |
| V2 | MODERATE | `readViewerReactionsBatch` — client-supplied `actorId`; safety depends on `vc.post_reactions` RLS | NEEDS CARNAGE |
| V3 | HIGH | `markWelcomeFeedCardSeenDAL` — write path with client-supplied `actorId`; no WITH CHECK RLS confirmed on `vc.actor_onboarding_steps` | NEEDS CARNAGE |

---

## Open Architecture Findings (SENTRY)

| ID | Severity | Description | Status |
|---|---|---|---|
| SA1 | MODERATE | `resolvePublicRealm.dal.js` — pure constant in DAL layer (no Supabase call); naming is misleading | OPEN — IRONMAN decision required |
| SA2 | HIGH | `feed.mentions.dal.js` imports `@hydration` engine — DAL→engine layer order violation; creates sequential double round-trip | OPEN — IRONMAN must assign, Wolverine refactor |
| SA3 | MODERATE | `FeedConfirmModal.jsx` in `screens/` folder — should be in `components/`; also FALCON-flagged for iOS stacking context | OPEN |
| SA4 | MODERATE | `CentralFeedScreen.jsx` performs View Screen duties — should be split into Final Screen + View Screen | OPEN |
| SA5 | LOW | `controller/` vs `controllers/` naming inconsistency — `feedWelcomeCard.controller.js` in singular folder | OPEN |
| SA6 | MODERATE | `pipeline/` subdirectory not documented in architecture pipeline table | DOC GAP — LOGAN update required |
| SA7 | MODERATE | `queries/` subdirectory (Service layer) not documented — shown as MISSING in contract | DOC GAP — LOGAN update required |

---

## Open Runtime Findings (LOKI)

| ID | Severity | Description | Status |
|---|---|---|---|
| LK1 | LOW | Ungated `console.log` in `pipeline/fetchFeedPage.pipeline.js:125` — dormant (debugPostId never passed) but no env guard | OPEN |
| LK2 | LOW | Ungated `console.warn` in `dal/feed.mentions.dal.js:20` — fires on error in production; reveals table name | OPEN |
| LK3 | MODERATE | `feed.mentions.dal.js` sequential double round-trip inside Promise.all slot — adds 60-160ms when @ present | OPEN (design consequence of SA2) |
| LK4 | MODERATE | Initial load may execute pipeline twice (MAX_EMPTY_PAGES_PER_FETCH=2) — up to 28+ queries cold-cache | ACCEPTABLE DESIGN — flagged for documentation |
| LK5 | LOW | `dalCount: 9` in recordStep vs doc's "10 in Promise.all" — doc inaccuracy | OPEN |
| LK6 | MODERATE | `readPostMediaMap` swallows errors silently (no throw, no log) — media failures masked | OPEN |

---

## Handoff State

- **CARNAGE required:** Verify RLS on `moderation.actions`, `vc.post_reactions`, `vc.actor_onboarding_steps`, `vc.actor_follows`
- **IRONMAN required:** Assign refactor ownership for SA2 (`feed.mentions.dal.js` engine import); decide SA1 relocation; own SA3/SA4 screen restructure
- **WOLVERINE:** Schedule SA2 fix and SA3/SA4 restructure once IRONMAN assigns
- **LOGAN:** Document `pipeline/` and `queries/` layers in architecture pipeline table (SA6, SA7)
- **FALCON:** `FeedConfirmModal.jsx` stacking context in `<PullToRefresh>` is a BLOCKING iOS issue (tracked separately)
