---
title: THOR — Feed Module Release Gate
date: 2026-06-05
scope: VCSM
feature: feed
module: feed
decision: BLOCKED
blockers: 2
thor-version: 1
generated-by: THOR
---

# THOR — Feed Module Release Gate
**Date:** 2026-06-05
**Scope:** VCSM — `apps/VCSM/src/features/feed/`
**Decision:** BLOCKED
**Active Blockers:** 2

---

## Signal Inventory

| Command | Status | Report Path |
|---|---|---|
| ARCHITECT | COMPLETE — HEALTHY | `outputs/2026/06/05/ARCHITECT/2026-06-05_architect_feed-module.md` |
| VENOM | COMPLETE | `outputs/2026/06/05/VENOM/` |
| BLACKWIDOW | COMPLETE | `outputs/2026/06/05/BLACKWIDOW/` |
| ELEKTRA | COMPLETE (context-derived — 15 chains) | `outputs/2026/06/05/ELEKTRA/` |
| LOGAN | COMPLETE | `outputs/2026/06/05/LOGAN/` |
| SPIDER-MAN | COMPLETE | `outputs/2026/06/05/SPIDER-MAN/` |
| SENTRY | COMPLETE | `outputs/2026/06/05/SENTRY/2026-06-05_sentry_feed-compliance.md` |

---

## Gate Results

### GATE 1 — SECURITY

**Definition:** PASS if VENOM CRITICAL = 0 AND BLACKWIDOW EXPLOITABLE = 0

**Status: FAIL**

**Evidence:**

- VENOM CRITICAL = 0 (passes half-condition)
- VENOM HIGH = 6 (non-blocking by gate definition, but noted)
- BLACKWIDOW EXPLOITABLE = 8 (FAILS condition)

BLACKWIDOW classified 8 findings as EXPLOITABLE:
1. VEN-MOD-FEED-001 — Bare console.warn in production error path (useFeed.js:241)
2. VEN-MOD-FEED-002 — 5 bare console.* calls in production feed actions (useCentralFeedActions.js:68,139,182,197,221)
3. VEN-MOD-FEED-003 — Raw actor UUID in public profile navigation URL (useCentralFeedActions.js:152)
4. VEN-MOD-FEED-004 — Raw UUID postId in share URL (useCentralFeedActions.js:234-236)
5. VEN-PIPE-002 — null realmId bypasses realm filter in readFeedPostsPage (THOR BLOCKER)
6. VEN-PIPE-003 — vport.profiles owner-only RLS nulls vport bundle for non-owners (THOR BLOCKER)
7. VEN-PIPE-004 — Raw actorId UUID in mention route fallback (/profile/{actorId})
8. VEN-PIPE-008 — Blocked actor presentations leaked via mention hydration fan-out

**Gate 1 verdict:** FAIL — BLACKWIDOW EXPLOITABLE = 8 (required = 0)

---

### GATE 2 — ARCHITECTURE

**Definition:** PASS if ARCHITECT health = HEALTHY AND SENTRY failures = 0

**Status: FAIL**

**Evidence:**

- ARCHITECT health = HEALTHY (passes half-condition)
- SENTRY rules passed = 4/8, rules FAILED = 2 (FAILS condition)
- SENTRY governance complete = false

SENTRY failure details:
- Rule failed: null realmId bypasses realm filter — VEN-PIPE-002
- Rule failed: vport.profiles owner-only RLS nulls vport bundle — VEN-PIPE-003

SENTRY drift items not reflected as distinct SECURITY.md findings:
- console.log at fetchFeedPage.pipeline.js:137 (production-reaching, unlisted separately)
- DebugPrivacyPanel.jsx useEffect console calls — runtime isDev check inside effect body, not build-time import.meta.env.DEV wrapping
- Spanish i18n file es/feed.json identical to en/feed.json
- Multiple user-facing strings hardcoded in CentralFeedScreen.jsx and useCentralFeedActions.js (not routed through i18n)
- ELEKTRA has never been run on the feed module
- getDebugPrivacyRowsController lacks DEV gate — not reflected as a distinct SECURITY.md finding separate from VEN-FEED-003
- feedFeature.group.js diagnostics imports debug screen components directly

**Gate 2 verdict:** FAIL — SENTRY failures = 2 (required = 0)

---

### GATE 3 — BEHAVIOR

**Definition:** PASS if LOGAN behavior contract complete = true

**Status: PASS**

**Evidence:**

- LOGAN reports: behavior contract complete = true
- BEHAVIOR.md status = ACTIVE (upgraded from STUB on 2026-06-05 by LOGAN pass)
- 8 workflows documented and verified from source code
- 15 invariants documented and verified from source code
- BEHAVIOR.md notes: "All STUB TODOs resolved by this code read. Zero unverified claims."
- Previous STUB state noted in CURRENT_STATUS.md has been resolved

**Gate 3 verdict:** PASS

---

### GATE 4 — COVERAGE

**Definition:** PASS if test coverage >= 60% OR if 0 existing tests AND sprint plan exists

**Status: CONDITIONAL-FAIL**

**Evidence:**

- Current test coverage = 0.0%
- 0 existing test files in the feed module
- SPIDER-MAN identified 18 security regression tests needed
- 17 uncovered source functions
- 8 pure model files identified as ideal unit test candidates (zero infrastructure cost)
- TESTS.md was created by SPIDER-MAN on 2026-06-05 — a complete test plan exists including:
  - Security regression test file structure
  - Priority-ordered test list
  - 20 tests prioritized by risk
  - Recommended test file structure at `apps/VCSM/src/features/feed/__tests__/`

The second condition (0 existing tests AND sprint plan exists) is partially satisfied: TESTS.md provides a complete sprint plan. However, no formal sprint has been opened, no CAPTAIN note has been created, and no test ticket exists. The plan exists as a governance artifact but has not been committed to as a sprint.

**Gate 4 verdict:** CONDITIONAL-FAIL — 0% coverage with plan documented but no committed sprint

---

### GATE 5 — DOCUMENTATION

**Definition:** PASS if all governance artifacts present (ARCHITECTURE, SECURITY, BEHAVIOR, TESTS, OWNERSHIP, BLOCKERS, DEFERRED)

**Status: CONDITIONAL-PASS**

**Evidence — all 9 required files verified as non-placeholder:**

| File | Status | Quality |
|---|---|---|
| ARCHITECTURE.md | EXISTS — VERIFIED | Full source read complete, 45 files traced, layer diagram accurate |
| SECURITY.md | EXISTS — ACTIVE | Comprehensive finding inventory, RLS table, write surface safety |
| BEHAVIOR.md | EXISTS — ACTIVE | 8 workflows, 15 invariants, all derived from source code |
| TESTS.md | EXISTS — ACTIVE | 18 security regression tests, 20 priority tests, full file structure |
| OWNERSHIP.md | EXISTS — ACTIVE | Full layer and concern ownership maps, boundary violation registry |
| BLOCKERS.md | EXISTS — ACTIVE | 2 active THOR blockers with description, impact, required fix |
| DEFERRED.md | EXISTS — ACTIVE | 11 deferred items with severity, reason, and action required |
| CURRENT_STATUS.md | EXISTS — ACTIVE | Architect section present; THOR section pending this run |
| INDEX.md | EXISTS — VERIFIED | Complete file inventory, 52 files, write surfaces, engine dependencies |

**Conditional note:** SECURITY.md notes ELEKTRA "NEVER RUN" and 10 of 15 tables have unverified RLS status. The documentation is comprehensive but carries known gaps. These are reflected in DEFERRED.md (DEF-FEED-009, DEF-FEED-010) and do not disqualify the file's existence and non-placeholder quality.

**Gate 5 verdict:** CONDITIONAL-PASS — all artifacts present and non-placeholder; ELEKTRA gap and RLS audit gap are deferred

---

### GATE 6 — ENDPOINT/CHAIN

**Definition:** PASS if ELEKTRA validated all chains with no unvalidated EXPLOITABLE paths

**Status: FAIL**

**Evidence:**

- ELEKTRA built 15 source-to-sink chains
- ELEKTRA validated 20 findings
- ELEKTRA confirmed 18 reachable findings
- SECURITY.md records: "ELEKTRA | NEVER RUN | — | —"
- DEFERRED.md item DEF-FEED-009: "ELEKTRA Has Never Been Run on Feed Module — OPEN"
- SENTRY drift item: "ELEKTRA has never been run on the feed module despite 15 source-to-sink chains being built in context"

The ELEKTRA findings provided as THOR inputs were derived from context and chain construction, but were not the product of a formal ELEKTRA command run logged in the governance artifact system. SECURITY.md explicitly records ELEKTRA as NEVER RUN. The reachable paths VEN-PIPE-002 and VEN-PIPE-003 are EXPLOITABLE and have not been validated through a formal ELEKTRA patch proposal cycle. 10 patch proposals exist but none have been applied.

**Gate 6 verdict:** FAIL — ELEKTRA not formally run; EXPLOITABLE paths VEN-PIPE-002 and VEN-PIPE-003 unvalidated and unpatched

---

## Gate Summary Table

| Gate | Name | Status | Critical |
|---|---|---|---|
| Gate 1 | Security | FAIL | YES — 8 EXPLOITABLE findings |
| Gate 2 | Architecture | FAIL | YES — SENTRY 2 failures |
| Gate 3 | Behavior | PASS | — |
| Gate 4 | Coverage | CONDITIONAL-FAIL | YES — 0% coverage, no committed sprint |
| Gate 5 | Documentation | CONDITIONAL-PASS | NO — all artifacts present |
| Gate 6 | Endpoint/Chain | FAIL | YES — ELEKTRA formal run missing, EXPLOITABLE paths unpatched |

---

## RELEASE DECISION

### BLOCKED

The feed module is **BLOCKED** from release.

3 gates have failed. The two THOR blockers (VEN-PIPE-002, VEN-PIPE-003) represent real data isolation failures with cross-realm post exposure and functional regression for vport actor visibility. These must be resolved and regression-tested before any feed-related release proceeds.

---

## Active THOR Blockers

### THOR-BLOCKER-1 — VEN-PIPE-002: Null realmId Bypasses Realm Filter

**Severity:** HIGH
**Classification:** EXPLOITABLE
**Surface:** `apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js:30-33`

When `realmId` is null, the `.eq("realm_id", realmId)` filter is skipped. Posts from all realms are returned to the viewer. Viewers in the standard public realm can receive posts from restricted or private realms (Void Realm).

**Required fix:** Enforce non-null realmId in `readFeedPostsPage`. If `realmId` is null, the DAL must throw or return empty — never execute an unfiltered query.

**Required regression test:** SEC-REG-001 — call `fetchFeedPagePipeline` with `realmId = null`. Assert DAL throws or returns empty. Assert no cross-realm posts returned.

---

### THOR-BLOCKER-2 — VEN-PIPE-003: vport.profiles Owner-Only RLS Nulls Vport Bundle

**Severity:** HIGH
**Classification:** EXPLOITABLE
**Surface:** `apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js:84-89`

`readActorsBundle` performs a direct SELECT on `vport.profiles` which has owner-only RLS. Non-owners receive an empty result. When `vportMap[rowActorId]` is null, visibility is `false` (reason: `missing_vport_profile`). All vport posts are invisible to non-owners — a functional regression for the entire vport post surface.

**Required fix:** Replace the direct `vport.profiles` SELECT in `readActorsBundle` with a SECURITY DEFINER RPC returning only public-facing vport profile fields (name, slug, avatar_url, is_active, is_deleted).

**Required regression test:** SEC-REG-002 — call pipeline as non-owner viewer for a vport actor. Assert vport posts are visible after RPC fix.

---

## Required Patches Before Release

In addition to the two THOR blockers, the following HIGH-severity EXPLOITABLE findings must be addressed before release. They do not individually block THOR but contribute to Gate 1 failure:

1. **VEN-MOD-FEED-001** — Add `import.meta.env.DEV` guard to `useFeed.js:241` catch block `console.warn`
2. **VEN-MOD-FEED-002** — Add `import.meta.env.DEV` guards to 5 console.* calls in `useCentralFeedActions.js:68,139,182,197,221`
3. **VEN-MOD-FEED-003** — Replace raw actorId in `handleOpenActorProfile` navigate with slug-based route
4. **VEN-PIPE-008** — Filter blocked actors from mention hydration fan-out in `fetchFeedPage.pipeline.js:127-133`
5. **console.log at fetchFeedPage.pipeline.js:137** — Remove unguarded pipeline console.log (SENTRY-flagged, not DEV-gated)
6. **ELEKTRA formal run** — Run ELEKTRA on the feed module; patch proposals must be reviewed before release

---

## Conditional Items (Non-Blocking, Required for CONDITIONAL Upgrade)

These items do not currently block release but must be resolved before a CONDITIONAL status can be upgraded to READY:

1. **Test coverage sprint must be opened** — TESTS.md plan exists but no committed sprint or ticket. Minimum: SEC-REG-001 and SEC-REG-002 must pass before blocker resolution is accepted.
2. **ELEKTRA formal run** — SECURITY.md records ELEKTRA as NEVER RUN. A formal ELEKTRA run must be completed and logged in governance artifacts.
3. **SENTRY governance drift** — 7 drift items identified. At minimum, the console.log at pipeline:137 must be added to SECURITY.md and resolved.
4. **RLS audit (DEF-FEED-010)** — 10 of 15 tables have unverified RLS status. DB audit required before any new write surfaces are added.

---

## Deferred Items (Acknowledged — Not Blocking)

All items below are formally acknowledged in DEFERRED.md. They do not block release after the THOR blockers are resolved:

| ID | Finding | Severity | Reason |
|---|---|---|---|
| DEF-FEED-001 | useFeed.js lifecycle undocumented | INFO | Requires CAPTAIN decision |
| DEF-FEED-002 | Legacy feed.posts.dal.js no visibility guards | MEDIUM | Diagnostics-only, no production callers |
| DEF-FEED-003 | Full follow graph cache without size bound | MEDIUM | Scale risk, no current production impact |
| DEF-FEED-004 | Block/follow cache TTL vs stale moderation state | MEDIUM | 60s bounded, cache invalidation adapter exists |
| DEF-FEED-005 | Unbounded comment count fetch | LOW | No production reports of timeout |
| DEF-FEED-006 | vport_id in DAL return shape | INFO | Internal only, does not surface publicly |
| DEF-FEED-007 | readProfileAdultFlagDAL no ownership assertion | MEDIUM | Low practical risk, DB audit pending |
| DEF-FEED-008 | localStorage welcome card tamper | LOW | Cosmetic bypass, no security function |
| DEF-FEED-009 | ELEKTRA never run | QUALITY | Scheduled for next governance pass |
| DEF-FEED-010 | 10 of 15 tables have unverified RLS | QUALITY | DB audit required |
| DEF-FEED-011 | Dead debugPostId parameter in pipeline | LOW | Cleanup after console.log fix |
| VEN-MOD-FEED-004 | Raw UUID postId in share URL | MEDIUM | Platform invariant violation — tracked |
| VEN-PIPE-004 | Raw actorId UUID in mention route fallback | MEDIUM | Tracked; fix requires mention route refactor |
| VEN-PIPE-005 | Missing UUID validation on viewerActorId | MEDIUM | Inconsistency, not a vector currently |
| VEN-PIPE-006 | Stale moderation state 60s window | MEDIUM | Bounded UX limitation |
| VEN-PIPE-007 | Full follow graph cached without size bound | MEDIUM | Scale concern, Kraven pass needed |
| VEN-FEED-003 | getDebugPrivacyRows actorId-as-userId bug | MEDIUM | Debug controller, requires DEV gate fix first |
| VEN-FEED-004 | viewerActorId discarded in listActorPosts | MEDIUM | Accepted — RLS-only enforcement documented |
| i18n Spanish feed.json identical to English | MEDIUM | Localization backlog — no Spanish copy provided yet |
| Hardcoded user-facing strings | MEDIUM | i18n backlog |

---

## Next Session Recommendations

1. **P0 — Apply THOR-BLOCKER-1 fix:** Enforce non-null realmId in `readFeedPostsPage`. Add null guard — throw or return empty if `realmId` is null.

2. **P0 — Apply THOR-BLOCKER-2 fix:** Create SECURITY DEFINER RPC for public vport profile data. Update `readActorsBundle` to call the RPC instead of direct SELECT.

3. **P0 — Write SEC-REG-001 and SEC-REG-002:** Both regression tests must pass before THOR re-run can proceed.

4. **P1 — Remove production console.* leaks:** 5 calls in useCentralFeedActions.js, 1 in useFeed.js, 1 in fetchFeedPage.pipeline.js. All require DEV gates or removal.

5. **P1 — Fix raw UUID in handleOpenActorProfile:** Replace `/profile/${actorId}` navigate with slug-based route.

6. **P1 — Run ELEKTRA formally:** Formal ELEKTRA command run on the feed module. Log results in governance artifacts. Review 10 existing patch proposals.

7. **P1 — Open test sprint ticket:** Commit to the TESTS.md plan. At minimum deliver: SEC-REG-001, SEC-REG-002, and the 6 pure model unit tests (feedRowVisibility all 8 branches, feedBlockVisibility bidirectional, feedPrivateVisibility).

8. **P2 — SENTRY governance sync:** Add pipeline:137 console.log to SECURITY.md. Add i18n gap and hardcoded strings to tracking. Document getDebugPrivacyRowsController DEV gate gap separately from VEN-FEED-003.

9. **P2 — DB audit pass:** Run DB command to verify RLS on the 10 unverified tables. Update SECURITY.md with verified status.

10. **P3 — CAPTAIN note:** Record useFeed.js lifecycle decision (keep as adapter surface or remove with consumer migration ticket).

---

## Re-Run Criteria

THOR re-run is warranted when ALL of the following are true:

- [ ] VEN-PIPE-002 fix applied and SEC-REG-001 passing
- [ ] VEN-PIPE-003 fix applied and SEC-REG-002 passing
- [ ] SENTRY re-run confirms 0 Rule failures (8/8 passing)
- [ ] BLACKWIDOW EXPLOITABLE count = 0 (post-patch re-classification required for THOR-blocking items)
- [ ] ELEKTRA formal run complete and logged in SECURITY.md

---

*THOR report produced 2026-06-05. Feature: feed / module: feed. Decision: BLOCKED.*
