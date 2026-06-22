# SPIDER-MAN — Feed Module Coverage Matrix
**Date:** 2026-06-05
**Scanner:** SPIDER-MAN v1
**Scope:** VCSM Feed Module — apps/VCSM/src/features/feed/
**TESTS.md:** ZZnotforproduction/APPS/VCSM/features/feed/modules/feed/TESTS.md

---

## 1. Executive Summary

| Metric | Value |
|---|---|
| Total Source Functions | 17 |
| Covered Functions | 0 |
| Uncovered Functions | 17 |
| Total Behaviors (Workflows) | 8 |
| Covered Behaviors | 0 |
| Invariants Documented | 15 |
| Invariants Covered | 0 |
| Security Regression Tests Needed | 18 |
| Security Regression Tests Existing | 0 |
| Overall Coverage | **0%** |
| THOR Blockers Without Regression Tests | 2 (VEN-PIPE-002, VEN-PIPE-003) |
| EXPLOITABLE Findings Without Regression Tests | 8 |
| REACHABLE Findings Without Regression Tests | 10 |

**Verdict: RELEASE BLOCKED.** Zero test coverage across all dimensions. Two THOR-blocking
security findings (VEN-PIPE-002, VEN-PIPE-003) have no regression tests. The visibility
model — the feed's core security boundary — has no test coverage.

---

## 2. Source Files Analyzed

| File | Type | Functions | Covered |
|---|---|---|---|
| `pipeline/fetchFeedPage.pipeline.js` | Pipeline | 1 | 0 |
| `model/feedBlockVisibility.model.js` | Model | 2 | 0 |
| `model/feedFollowVisibility.model.js` | Model | 2 | 0 |
| `model/feedPrivateVisibility.model.js` | Model | 1 | 0 |
| `model/feedRowVisibility.model.js` | Model | 1 | 0 |
| `model/normalizeFeedRows.model.js` | Model | 1 | 0 |
| `model/buildMentionMaps.model.js` | Model | 2 (1 private) | 0 |
| `model/enrichMentionRows.model.js` | Model | 1 | 0 |
| `model/inferMediaType.model.js` | Model | 1 | 0 |
| `controllers/listActorPosts.controller.js` | Controller | 1 | 0 |
| `controllers/getFeedViewerContext.controller.js` | Controller | 1 | 0 |
| `controllers/feedWelcomeCard.controller.js` | Controller | 2 | 0 |
| **TOTAL** | | **17** | **0** |

---

## 3. Behavior Coverage Matrix

Source: BEHAVIOR.md (ACTIVE, LOGAN-verified 2026-06-05)

| Workflow | Entry | Covered | Priority | Notes |
|---|---|---|---|---|
| WF-1: Feed Initial Load | `useCentralFeed` mount | NOT_COVERED | P1 | Covers INV-1, INV-2 |
| WF-2: Infinite Scroll Pagination | IntersectionObserver | NOT_COVERED | P2 | Covers INV-7 |
| WF-3: Pull-to-Refresh | PullToRefresh release | NOT_COVERED | P2 | hiddenPostIds reset |
| WF-4: Post Action Menu | `openPostMenu` | NOT_COVERED | P1 | Ownership gates, block self-guard |
| WF-5: Welcome Card Lifecycle | `WelcomeFeedCard` | NOT_COVERED | P3 | Covers INV-10, INV-11 |
| WF-6: Actor Identity Hydration | Post-pipeline upsert | NOT_COVERED | P3 | INV-14, force hydration |
| WF-7: Mention Enrichment | `@` scan conditional | NOT_COVERED | P1 | VEN-PIPE-008 |
| WF-8: Confirm Modal / Toast | `requestConfirm` | NOT_COVERED | P3 | Animation re-trigger |

---

## 4. Invariant Coverage Matrix

Source: BEHAVIOR.md §Invariants (15 invariants)

| # | Invariant | Covered | Security Relevance |
|---|---|---|---|
| INV-1 | Query does not fire if viewerActorId is null | NOT_COVERED | HIGH — auth bypass vector |
| INV-2 | Unauthenticated users never reach feed | NOT_COVERED | HIGH — auth bypass |
| INV-3 | Block exclusion is bidirectional | NOT_COVERED | HIGH — post leakage to blocked users |
| INV-4 | Private posts not shown to non-followers | NOT_COVERED | HIGH — privacy leak |
| INV-5 | vport posts require active non-deleted profile | NOT_COVERED | MEDIUM |
| INV-6 | Posts from actors absent from actorMap hidden | NOT_COVERED | MEDIUM |
| INV-7 | Concurrent fetch lock prevents double-pagination | NOT_COVERED | MEDIUM — cursor corruption |
| INV-8 | staleTime = 30s | NOT_COVERED | LOW |
| INV-9 | Image preload runs once per session | NOT_COVERED | LOW |
| INV-10 | Welcome card only for kind === 'user' | NOT_COVERED | MEDIUM — vport exposure |
| INV-11 | localStorage short-circuits DB read | NOT_COVERED | LOW |
| INV-12 | Mention enrichment skipped if no '@' | NOT_COVERED | MEDIUM — VEN-PIPE-008 fan-out |
| INV-13 | Media type defaults to 'image' | NOT_COVERED | LOW |
| INV-14 | Actor hydration fires synchronously | NOT_COVERED | LOW |
| INV-15 | Snapshot rollback on block failure | NOT_COVERED | MEDIUM — optimistic state corruption |

---

## 5. Security Regression Test Matrix

Source: BlackWidow 2026-06-05 + ELEKTRA 2026-06-05 + VENOM 2026-06-05

### THOR Blockers

| Finding | Classification | Test ID | Test Exists | Priority |
|---|---|---|---|---|
| VEN-PIPE-002: null realmId bypasses realm filter | EXPLOITABLE / THOR | SEC-REG-001 | NO | P0 |
| VEN-PIPE-003: vport.profiles owner-only RLS | EXPLOITABLE / THOR | SEC-REG-002 | NO | P0 |

### EXPLOITABLE

| Finding | Classification | Test ID | Test Exists | Priority |
|---|---|---|---|---|
| VEN-MOD-FEED-001: console.warn in production (useFeed) | EXPLOITABLE | SEC-REG-003 | NO | P1 |
| VEN-MOD-FEED-002: 5 console.* in useCentralFeedActions | EXPLOITABLE | SEC-REG-004 | NO | P1 |
| VEN-MOD-FEED-003: raw actorId UUID in navigate URL | EXPLOITABLE | SEC-REG-005 | NO | P1 |
| VEN-MOD-FEED-004: raw UUID postId in share URL | EXPLOITABLE | SEC-REG-006 | NO | P1 |
| VEN-PIPE-004: raw actorId in mention route fallback | EXPLOITABLE | SEC-REG-007 | NO | P1 |
| VEN-PIPE-008: blocked actor in mention hydration fan-out | EXPLOITABLE | SEC-REG-008 | NO | P1 |

### REACHABLE

| Finding | Classification | Test ID | Test Exists | Priority |
|---|---|---|---|---|
| VEN-MOD-FEED-005: legacy DAL no filters | REACHABLE | SEC-REG-009 | NO | P2 |
| VEN-PIPE-006: stale block/follow cache | REACHABLE | SEC-REG-010 | NO | P2 |
| VEN-MOD-FEED-008: unbounded comment count fetch | REACHABLE | SEC-REG-011 | NO | P2 |
| VEN-FEED-003: actorId passed as userId in debug controller | REACHABLE | SEC-REG-012 | NO | P2 |
| VEN-FEED-004: viewerActorId discarded in listActorPosts | REACHABLE | SEC-REG-013 | NO | P2 |
| VEN-PIPE-005: missing UUID validation in hidden/reactions DALs | REACHABLE | SEC-REG-014 | NO | P2 |
| VEN-FEED-001: BEHAVIOR.md missing Security Rules sections | REACHABLE | SEC-REG-015 | NO | P2 |
| VEN-MOD-FEED-006: is_adult no ownership assertion | REACHABLE | SEC-REG-016 | NO | P2 |
| VEN-MOD-FEED-010: vport_id in DAL return shape | REACHABLE | SEC-REG-017 | NO | P3 |
| VEN-MOD-FEED-007: localStorage dismiss tamper | REACHABLE | SEC-REG-018 | NO | P3 |

**Total security regression tests needed: 18**
**Total existing: 0**

---

## 6. Coverage Gap Analysis

### Highest-ROI Gaps (pure functions, no infrastructure cost)

These 8 model files are pure functions. Zero mocking required. Each takes plain JS objects
and returns plain JS objects. Together they cover the entire visibility security boundary.

1. `feedPrivateVisibility.model.js` — 3 inputs, 2 outputs, 1 function. Trivial.
2. `feedBlockVisibility.model.js` — covers INV-3 (bidirectional block). 2 functions.
3. `feedFollowVisibility.model.js` — covers INV-4 (follow gate). 2 functions.
4. `inferMediaType.model.js` — covers INV-13. 6 URL patterns + null case.
5. `enrichMentionRows.model.js` — pure join. 1 function.
6. `feedRowVisibility.model.js` — 8 visibility branches, all security-critical. 1 function.
7. `buildMentionMaps.model.js` — mention map builder + route resolution (VEN-PIPE-004).
8. `normalizeFeedRows.model.js` — integration of all model layers.

### Highest-Risk Gaps (security boundary, THOR blockers)

1. Pipeline null realmId guard — VEN-PIPE-002 is the highest-severity unfixed finding.
2. Pipeline blocked-actor mention filter — VEN-PIPE-008 directly undermines block exclusion.
3. Bidirectional block model — INV-3 has zero test coverage; the code has correct logic but
   could regress silently.
4. Private actor gate — INV-4 is a privacy violation if the canViewPrivateFeedActorModel
   logic regresses.

---

## 7. Recommended Test Execution Order

Phase 1 (immediate — no infrastructure needed):
```
inferMediaType.model.test.js
feedPrivateVisibility.model.test.js
feedBlockVisibility.model.test.js
feedFollowVisibility.model.test.js
enrichMentionRows.model.test.js
feedRowVisibility.model.test.js (all 8 branches)
buildMentionMaps.model.test.js (route resolution + blocked mention)
normalizeFeedRows.model.test.js
```

Phase 2 (requires Supabase mock):
```
listActorPosts.controller.test.js
getFeedViewerContext.controller.test.js
feedWelcomeCard.controller.test.js
```

Phase 3 (requires DAL injection into pipeline):
```
fetchFeedPage.pipeline.test.js (SEC-REG-001, SEC-REG-002, SEC-REG-008)
```

Phase 4 (requires React + React Query test harness):
```
useFeed.test.js (SEC-REG-003)
useCentralFeedActions.test.js (SEC-REG-004, SEC-REG-005, SEC-REG-006)
useFeedWelcomeCard.test.js (SEC-REG-018, INV-10, INV-11)
```

---

## 8. THOR Gate Status

| Gate | Status | Reason |
|---|---|---|
| Test Coverage Gate | BLOCKED | 0% coverage |
| Security Regression Gate | BLOCKED | 0/18 security regression tests |
| THOR Blocker Regression Gate | BLOCKED | VEN-PIPE-002 and VEN-PIPE-003 have no tests |
| Visibility Model Gate | BLOCKED | 0 tests for any visibility model function |

**SPIDER-MAN assessment: NO release of feed module should proceed until at minimum:**
1. VEN-PIPE-002 and VEN-PIPE-003 are patched (ELEKTRA patch proposals exist)
2. SEC-REG-001 and SEC-REG-002 regression tests are passing
3. All 6 visibility model files have coverage (pure functions, no excuse to skip)
4. SEC-REG-008 (blocked actor mention fan-out) is passing

---

## 9. Existing Test Infrastructure

| Asset | Status |
|---|---|
| Test framework (Jest/Vitest) | NOT CONFIRMED — check package.json |
| Supabase mock | NOT CONFIRMED |
| React Query test utilities | NOT CONFIRMED |
| DAL injection pattern | AVAILABLE — `_`-prefixed imports in pipeline.js |
| CI integration | NOT CONFIRMED |

The pipeline file uses `_`-prefixed DAL imports exclusively, wrapping them conditionally
with `wrapDAL` in DEV mode. This pattern supports clean DAL injection in tests by replacing
the `_`-prefixed dependencies via module mocking without touching the pipeline logic.

---

## 10. References

| Document | Path |
|---|---|
| BEHAVIOR.md | ZZnotforproduction/APPS/VCSM/features/feed/modules/feed/BEHAVIOR.md |
| SECURITY.md | ZZnotforproduction/APPS/VCSM/features/feed/modules/feed/SECURITY.md |
| TESTS.md (output) | ZZnotforproduction/APPS/VCSM/features/feed/modules/feed/TESTS.md |
| VENOM Report | ZZnotforproduction/APPS/VCSM/features/feed/modules/feed/outputs/2026/06/05/VENOM/2026-06-05_venom_feed-security-review.md |
| BlackWidow Report | ZZnotforproduction/APPS/VCSM/features/feed/modules/feed/outputs/2026/06/05/BLACKWIDOW/2026-06-05_blackwidow_feed-adversarial-review.md |
| ELEKTRA Report | ZZnotforproduction/APPS/VCSM/features/feed/modules/feed/outputs/2026/06/05/ELEKTRA/2026-06-05_elektra_feed-execution-chains.md |
| Pipeline SPIDER-MAN | ZZnotforproduction/APPS/VCSM/features/feed/modules/pipeline/outputs/2026/06/05/SPIDER-MAN/2026-06-05_spiderman_feed-pipeline-test-coverage.md |
