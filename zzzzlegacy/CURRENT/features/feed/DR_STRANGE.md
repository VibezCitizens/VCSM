# DR. STRANGE ENTRY — FEED

**Category Key:** feed
**Type:** FEATURE
**CURRENT Path:** features/feed
**Source Path:** apps/VCSM/src/features/feed/
**Last Updated:** 2026-06-02
**Ticket:** TICKET-DRSTRANGE-BACKFILL-P2-0001
**Timestamp:** 2026-06-02T12:18:46

**Area:** Feed
---

## Feature

The feed feature is the central content discovery system — it renders paginated, privacy-filtered, block-aware posts for authenticated citizens via a pipeline/query/DAL stack that batches up to 9 parallel DB reads per page load.

## Status

ACTIVE
Security Tier: MEDIUM

## Governance Score

| Category | Score | Notes |
|---|---|---|
| Files Present | 10/10 files found | README.md, CURRENT_STATUS.md, SECURITY.md, PERFORMANCE.md, HISTORY_INDEX.md, vcsm.feed.architecture.md, feed-loading-map.md, ironman_feed-dal-ownership-2026-05-14.md, sentry_feed-dal-architecture-2026-05-14.md, 2026-05-10_architect_feed-engine-vport-menu-gas-posts.md |
| Security | PARTIAL | SECURITY.md present; 3 open findings (V1 MODERATE, V2 MODERATE, V3 HIGH) |
| Architecture | PARTIAL | vcsm.feed.architecture.md + sentry evidence present; ARCHITECTURE.md canonical file missing |
| Ownership | 0% | OWNERSHIP.md not present; ironman evidence file present but not canonical |
| Testing | 0% | SPIDER-MAN not run |
| Performance | PARTIAL | PERFORMANCE.md present; KRAVEN ACCEPTABLE WITH MONITORING REQUIRED verdict |
| **DR. STRANGE Readiness** | **~35%** | Security + Performance documented; Architecture/Ownership/Testing gaps remain |

## Documentation Coverage

| File | Status |
|---|---|
| README.md | ✓ |
| CURRENT_STATUS.md | ✓ |
| SECURITY.md | ✓ |
| ARCHITECTURE.md | ✗ MISSING (evidence files present; canonical file not created) |
| OWNERSHIP.md | ✗ MISSING (ironman evidence file present; canonical OWNERSHIP.md not created) |
| TESTS.md | ✗ MISSING |
| PERFORMANCE.md | ✓ |
| BLOCKERS.md | ✗ MISSING |
| DEFERRED.md | ✗ MISSING |
| HISTORY_INDEX.md | ✓ |

## Command Coverage

| Command | Status |
|---|---|
| VENOM | COMPLETE — 3 OPEN findings (V1 MODERATE, V2 MODERATE, V3 HIGH); 4 PASS — 2026-05-14 |
| ELEKTRA | NOT RUN |
| BLACKWIDOW | NOT RUN |
| ARCHITECT | PARTIAL — evidence files present (2026-05-10_architect_feed-engine-vport-menu-gas-posts.md); canonical ARCHITECTURE.md not written |
| SENTRY | COMPLETE — 6 OPEN VIOLATIONS (SA1–SA5 + SA6/SA7 doc gaps) — 2026-05-14 |
| IRONMAN | PARTIAL — evidence file ironman_feed-dal-ownership-2026-05-14.md present; canonical OWNERSHIP.md not written |
| SPIDER-MAN | NOT RUN |
| KRAVEN | COMPLETE — ACCEPTABLE WITH MONITORING REQUIRED; 3 MODERATE, 1 LOW, 1 PASS — 2026-05-14 |
| LOKI | COMPLETE — 3 MODERATE, 3 LOW — 2026-05-14 |
| THOR | NOT RUN |
| CARNAGE | NOT RUN |
| DB | NOT RUN |
| HAWKEYE | NOT RUN |
| WATCHER | NOT RUN |
| FALCON | NOT RUN |
| WINTER SOLDIER | NOT RUN |
| LOGAN | NOT RUN |
| WOLVERINE | NOT RUN |

## THOR Eligibility

**THOR_BLOCKED** — SECURITY.md present but 3 open findings remain unresolved (V1 MODERATE, V2 MODERATE, V3 HIGH). V3 is HIGH severity; CARNAGE required to verify RLS on `vc.actor_onboarding_steps` before THOR can be considered.

## Security Status

VENOM COMPLETE (2026-05-14) — REVIEW_PENDING verdict. No injection vulnerabilities found; trust boundary depends on unverified RLS policies.

Open findings:
- V1 MODERATE: `readHiddenPostsForViewer` — client-supplied `viewerActorId`; safety depends on `moderation.actions` RLS — NEEDS CARNAGE
- V2 MODERATE: `readViewerReactionsBatch` — client-supplied `actorId`; safety depends on `vc.post_reactions` RLS — NEEDS CARNAGE
- V3 HIGH: `markWelcomeFeedCardSeenDAL` — write path with client-supplied `actorId`; no WITH CHECK RLS confirmed on `vc.actor_onboarding_steps` — NEEDS CARNAGE

## Architecture Status

PARTIAL — SENTRY ran 2026-05-14 with 6 open violations:
- SA2 HIGH: `feed.mentions.dal.js` imports `@hydration` engine — DAL→engine layer order violation
- SA1 MODERATE: `resolvePublicRealm.dal.js` — pure constant in DAL layer; naming misleading
- SA3 MODERATE: `FeedConfirmModal.jsx` in wrong folder — FALCON-flagged
- SA4 MODERATE: `CentralFeedScreen.jsx` should be split into Final Screen + View Screen
- SA5 LOW: `controller/` vs `controllers/` naming inconsistency

Canonical ARCHITECTURE.md not yet written. Run ARCHITECT to produce it.

## Ownership Status

PARTIAL — ironman evidence file present (ironman_feed-dal-ownership-2026-05-14.md) but canonical OWNERSHIP.md not created. Run IRONMAN to finalize.

## Testing Status

UNKNOWN — TESTS.md not found. SPIDER-MAN has never run.

## Performance Status

KRAVEN COMPLETE (2026-05-14) — ACCEPTABLE WITH MONITORING REQUIRED.

Query budget per pipeline execution:
- Warm cache, no @: 4-5 queries, ~50-80ms (LOW)
- Cold cache, no @: 13 queries, ~150-300ms (MODERATE)
- Cold cache, with @: 15 queries, ~250-450ms (MODERATE)
- Cold cache, empty first page (2x pipeline): 23-25 queries, ~400-800ms (HIGH)
- High-follow vport, cold cache: 13+ large payload, ~300-600ms (MODERATE)

## Open Blockers

None recorded in BLOCKERS.md (file missing). Active blockers inferred from CURRENT_STATUS.md:
- V1, V2, V3 security findings require CARNAGE RLS verification before THOR eligibility
- SA2 HIGH architecture violation (DAL→engine import) requires IRONMAN assignment and Wolverine refactor

## Deferred Items

None recorded. DEFERRED.md missing — run WATCHER or LOGAN to surface deferred items.

## Latest Ticket

TICKET-FEED-CARDS-002 — LOW: barber/barbershop share barbershop_portfolio_update; add payload.vportKind discriminator for future visual differentiation (from memory index)

## Recommended Next Ticket

Open TICKET-FEED-CARNAGE-001: Run CARNAGE to verify RLS on `vc.actor_onboarding_steps` (V3 HIGH) and `vc.post_reactions` / `moderation.actions` (V1, V2 MODERATE) — required to clear THOR block.

## Recommended Next Command

CARNAGE (to resolve V3 HIGH and unblock THOR)

## DR. STRANGE Read Order

1. DR_STRANGE.md (this file)
2. CURRENT_STATUS.md [✓]
3. SECURITY.md [✓]
4. ARCHITECTURE.md [✗ MISSING — use vcsm.feed.architecture.md + sentry evidence as interim]
5. OWNERSHIP.md [✗ MISSING — use ironman_feed-dal-ownership-2026-05-14.md as interim]
6. BLOCKERS.md [✗ MISSING]
7. DEFERRED.md [✗ MISSING]
8. HISTORY_INDEX.md [✓]

---
*DR_STRANGE.md generated: 2026-06-02 | Ticket: TICKET-DRSTRANGE-BACKFILL-P2-0001 | Timestamp: 2026-06-02T06:00:00*

<!-- DRSTRANGE_COMMAND_MATRIX_START -->
## Command Coverage Matrix

Feature: feed
Applicable Commands: 17
Coverage Score: 5.0 / 17
Coverage %: 29%
Last Refresh: 2026-06-02 (TICKET-DRSTRANGE-MATRIX-REFRESH-0001)

| Command | Status | Last Run | Evidence | Next Action |
|---|---|---|---|---|
| ARCHITECT | COMPLETE | 2026-06-02 | CURRENT/features/feed/ARCHITECTURE.md | — |
| VENOM | COMPLETE | 2026-05-14 | CURRENT/features/feed/SECURITY.md; 2026-05-14_venom_feed-dal-trust-boundaries.md | V1/V2/V3 open — run CARNAGE to resolve |
| ELEKTRA | NOT RUN | NEVER | No evidence found | Run ELEKTRA; feed has client-supplied actorId write path (V3 HIGH) |
| BLACKWIDOW | NOT RUN | NEVER | No evidence found | Run BLACKWIDOW after ELEKTRA |
| SENTRY | COMPLETE | 2026-05-14 | sentry_feed-dal-architecture-2026-05-14.md | SA2 HIGH open — IRONMAN must assign |
| IRONMAN | PARTIAL | 2026-05-14 | ironman_feed-dal-ownership-2026-05-14.md (canonical OWNERSHIP.md missing) | Run IRONMAN to produce OWNERSHIP.md |
| SPIDER-MAN | NOT RUN | NEVER | No evidence found | Run SPIDER-MAN |
| KRAVEN | COMPLETE | 2026-05-14 | CURRENT/features/feed/PERFORMANCE.md; ACCEPTABLE WITH MONITORING REQUIRED | — |
| THOR | NOT RUN | NEVER | No evidence found | THOR_BLOCKED — clear security findings first |
| CARNAGE | NOT RUN | NEVER | No evidence found | Run CARNAGE — required to resolve V1/V2/V3; open TICKET-FEED-CARNAGE-001 |
| DB | NOT RUN | NEVER | No evidence found | Run DB after CARNAGE |
| HAWKEYE | NOT RUN | NEVER | No evidence found | Run HAWKEYE |
| WATCHER | NOT RUN | NEVER | No evidence found | Run WATCHER |
| FALCON | NOT RUN | NEVER | No evidence found | Run FALCON |
| WINTER SOLDIER | N/A | — | No Android app | — |
| LOGAN | NOT RUN | NEVER | No evidence found | Run LOGAN |
| WOLVERINE | NOT RUN | NEVER | No evidence found | Run WOLVERINE |
| DR. STRANGE | PARTIAL | 2026-06-02 | This matrix refresh run | Matrix updated; full re-run pending |

## Command Coverage Summary

| Metric | Value |
|---|---|
| Applicable Commands | 17 |
| Complete | 4 |
| Partial | 2 |
| Not Run | 11 |
| Blocked | 0 |
| Coverage % | 29% |

## THOR Eligibility

- THOR Status: THOR_BLOCKED
- Blocking Reasons: V3 HIGH open (markWelcomeFeedCardSeenDAL write path — CARNAGE required); WOLVERINE NOT RUN; CARNAGE NOT RUN
- Caution Items: V1 MODERATE + V2 MODERATE open (client-supplied actorId reads); SA2 HIGH architecture violation (DAL imports engine); SPIDER-MAN NOT RUN
- Required Before THOR: CARNAGE (verify RLS on vc.actor_onboarding_steps, vc.post_reactions, moderation.actions); WOLVERINE; ELEKTRA; BLACKWIDOW
- Coverage %: 29%
- Last DR. STRANGE Refresh: 2026-06-02T00:00:00
- Category Key: feed
<!-- DRSTRANGE_COMMAND_MATRIX_END -->
