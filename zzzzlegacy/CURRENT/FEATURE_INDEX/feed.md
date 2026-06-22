# Feature Index: feed

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/feed`
Source Path: `apps/VCSM/src/features/feed/`

## DR. STRANGE Read Order

1. [README.md](../features/feed/README.md)
2. [CURRENT_STATUS.md](../features/feed/CURRENT_STATUS.md)
3. [SECURITY.md](../features/feed/SECURITY.md)
4. ARCHITECTURE.md — MISSING
5. OWNERSHIP.md — MISSING
6. TESTS.md — MISSING
7. [PERFORMANCE.md](../features/feed/PERFORMANCE.md)
8. BLOCKERS.md — MISSING
9. DEFERRED.md — MISSING
10. [HISTORY_INDEX.md](../features/feed/HISTORY_INDEX.md)

## Documentation Coverage

| File | Status |
|--------|--------|
| README | YES |
| CURRENT_STATUS | YES |
| SECURITY | YES |
| ARCHITECTURE | MISSING |
| OWNERSHIP | MISSING |
| TESTS | MISSING |
| PERFORMANCE | YES |
| BLOCKERS | MISSING |
| DEFERRED | MISSING |
| HISTORY_INDEX | YES |

Coverage Score: 5 / 10

## Active Risks

- **V3 (HIGH)** — `markWelcomeFeedCardSeenDAL` write path with client-supplied `actorId`; no WITH CHECK RLS confirmed on `vc.actor_onboarding_steps`. Needs CARNAGE.
- **SA2 (HIGH)** — `feed.mentions.dal.js` imports `@hydration` engine — DAL→engine layer order violation; sequential double round-trip.
- **V1 (MODERATE)** — `readHiddenPostsForViewer` — client-supplied `viewerActorId`; safety depends on `moderation.actions` RLS (needs CARNAGE).
- **V2 (MODERATE)** — `readViewerReactionsBatch` — client-supplied `actorId`; safety depends on `vc.post_reactions` RLS (needs CARNAGE).
- **SA3 (MODERATE)** — `FeedConfirmModal.jsx` in wrong folder; FALCON-flagged for iOS stacking context (BLOCKING iOS issue).
- **SA4 (MODERATE)** — `CentralFeedScreen.jsx` performs View Screen duties — should be split into Final + View Screen.
- **LK3 (MODERATE)** — `feed.mentions.dal.js` sequential double round-trip adds 60-160ms when @ present (consequence of SA2).
- **LK4 (MODERATE)** — Initial load may execute pipeline twice (MAX_EMPTY_PAGES_PER_FETCH=2) — up to 28+ queries cold-cache. Design consequence.
- **LK6 (MODERATE)** — `readPostMediaMap` swallows errors silently.
- **LK1/LK2 (LOW)** — Ungated console.log/warn in production code.

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- CARNAGE required for RLS verification on `moderation.actions`, `vc.post_reactions`, `vc.actor_onboarding_steps`, `vc.actor_follows` before V1/V2/V3 can close.
- IRONMAN required to assign refactor ownership for SA2 (`feed.mentions.dal.js`).
- FALCON blocking — `FeedConfirmModal.jsx` stacking context in `<PullToRefresh>` is a BLOCKING iOS issue.
- THOR — NOT STARTED; no release gate report.

## Deferred Items

DEFERRED.md — MISSING. Pending from CURRENT_STATUS:
- SA1 — `resolvePublicRealm.dal.js` relocation (IRONMAN decision required).
- SA5 — `controller/` vs `controllers/` naming fix.
- LOGAN updates for `pipeline/` and `queries/` layer documentation (SA6, SA7).

## Latest Ticket

Not found in CURRENT docs.

## Audit Coverage

| Command | Status |
|---------|--------|
| VENOM | COMPLETE — 2026-05-14 (3 OPEN, 4 PASS) |
| SENTRY | COMPLETE — 2026-05-14 (6 OPEN violations) |
| KRAVEN | COMPLETE — 2026-05-14 (3 MODERATE, 1 LOW, 1 PASS) |
| LOKI | COMPLETE — 2026-05-14 (3 MODERATE, 3 LOW) |
| THOR | NOT RUN |
| IRONMAN | NOT RUN |
| CARNAGE | NOT RUN |
| BLACKWIDOW | NOT RUN |
| ELEKTRA | NOT RUN |
| SPIDER-MAN | NOT RUN |

## Related Output Files

- `features/feed/SECURITY.md`
- `features/feed/PERFORMANCE.md`
- `features/feed/HISTORY_INDEX.md`
- `features/feed/vcsm.feed.architecture.md`
- `features/feed/feed-loading-map.md`
- `features/feed/2026-05-14_venom_feed-dal-trust-boundaries.md`

## Recommended Next Command

CARNAGE — RLS verification on `moderation.actions`, `vc.post_reactions`, `vc.actor_onboarding_steps`. Closes V1/V2/V3. Then IRONMAN to assign SA2 refactor ownership, then WOLVERINE to schedule the fix.

## Recommended Next Ticket

Open ticket to address: (1) CARNAGE RLS verification for feed trust boundaries, (2) IRONMAN ownership assignment for SA2 engine import violation, (3) FeedConfirmModal.jsx relocation (SA3) — BLOCKING for iOS.
