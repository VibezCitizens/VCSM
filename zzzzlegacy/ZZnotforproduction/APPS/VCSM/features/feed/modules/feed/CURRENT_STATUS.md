---
title: Feed Module — Current Status
status: ACTIVE
feature: feed
module: feed
created: 2026-06-05
updated: 2026-06-05
thor-decision: BLOCKED
thor-date: 2026-06-05
patch-run: 2026-06-05
patch-ticket: TICKET-FEED-MODULE-PATCH-0001
---

# feed / modules / feed — CURRENT STATUS

## ARCHITECT Section
**Run:** 2026-06-05
**Agent:** ARCHITECT
**Report:** `outputs/2026/06/05/ARCHITECT/2026-06-05_architect_feed-module.md`

---

### File Counts by Layer

| Layer | Count |
|---|---|
| Screens | 3 |
| Hooks | 8 |
| Controllers | 4 |
| Models | 8 |
| Pipeline | 1 |
| Query functions | 1 |
| DALs | 15 |
| Components | 4 (3 JSX + 1 style) |
| Adapters | 2 |
| Debugger stubs | 2 |
| Diagnostics | 2 |
| i18n | 2 |
| **Total** | **52** |

---

### Coverage Status

| Governance File | Status | Last Updated |
|---|---|---|
| INDEX.md | STUB | 2026-06-05 |
| BEHAVIOR.md | STUB | 2026-06-05 |
| ARCHITECTURE.md | VERIFIED | 2026-06-05 |
| SECURITY.md | STUB | 2026-06-05 |
| CURRENT_STATUS.md | ACTIVE | 2026-06-05 |

---

### ARCHITECT Findings Summary

| ID | Severity | Finding | Status |
|---|---|---|---|
| ARCH-FEED-001 | MEDIUM | useFeed.js (legacy) coexists with useCentralFeed.js (canonical) — migration undocumented | OPEN |
| ARCH-FEED-002 | MEDIUM | getDebugPrivacyRows.controller has no import.meta.env.DEV gate (BW-FEED-008 confirmed) | OPEN |
| ARCH-FEED-003 | LOW | feed.posts.dal.js is legacy/diagnostics only — maintenance artifact | OPEN |
| ARCH-FEED-004 | LOW | No module index.js entry point — diagnostics folder_shape_contract test would fail on hasIndex | OPEN |
| ARCH-FEED-005 | LOW | useCentralFeedActions.js: bare console.error/warn in catch blocks reaches production | OPEN |
| ARCH-FEED-006 | LOW | buildMentionMaps.model.js + normalizeFeedRows.model.js: Windows path dev artifacts in comments | INFO |
| ARCH-FEED-007 | INFO | i18n: Spanish translation is identical to English — no localization | INFO |
| ARCH-FEED-008 | INFO | useFeed.adapter.js exports entire useFeed.js without filtering | INFO |
| ARCH-FEED-009 | INFO | useCentralFeedActions catch blocks use console.error (not debugFeedEvent) — inconsistent debug pattern | INFO |

---

### Identified Gaps

1. **No unit tests.** Zero Jest/Vitest test files exist for any feed module file. The pure model layer (8 files, all pure functions) is ideal for unit testing. Only diagnostics group coverage exists.

2. **BEHAVIOR.md is a stub.** No behavior contract has been written. 10 placeholder entries exist but none are verified.

3. **SECURITY.md is a stub.** Findings exist but ELEKTRA has never been run on this module.

4. **listActorPosts.controller SSOT boundary not formally documented.** Cross-feature contract with profiles feature is informal (LOCKED comment in source).

5. **i18n not localized.** Spanish feed.json is byte-for-byte identical to English.

6. **No module index.js.** No canonical export surface for the feed feature module.

---

### Architecture Health Rating

**HEALTHY** (with noted medium gaps)

The feed module is well-structured. The pipeline pattern, adapter boundaries, pure model layer, and React Query integration are all correctly implemented. The medium-severity gaps (legacy hook coexistence, debug controller without DEV gate) are known issues tracked in SECURITY.md and do not represent structural breakdown.

The dual-hook situation (`useFeed` + `useCentralFeed`) is the primary architecture debt item. It should be resolved by documenting `useFeed` as an intentionally retained adapter-exported hook, or by consolidating and removing it.

---

### Security Summary

| Finding | Severity | Source | Status |
|---|---|---|---|
| BW-FEED-008 — getDebugPrivacyRowsController no DEV gate | HIGH (THOR BLOCKER) | BlackWidow | OPEN |
| BW-FEED-001 — feedWelcomeCard.controller no ownership check | HIGH | BlackWidow | OPEN |
| VEN-FEED-004 / BW-FEED-002 — listActorPosts no session binding | MEDIUM | VENOM/BW | OPEN (LOCKED controller) |
| BW-FEED-003 — debug enabled flag is caller-controlled | MEDIUM | BlackWidow | OPEN |
| BW-FEED-007 — share URL uses raw UUID postId | MEDIUM | BlackWidow | OPEN |

---

### Next Actions

- [ ] Run ELEKTRA on feed module (never run)
- [ ] Write BEHAVIOR.md with verified behavior IDs
- [ ] Add import.meta.env.DEV gate to getDebugPrivacyRows.controller
- [ ] Verify RLS on vc.actor_onboarding_steps for upsert coverage
- [ ] Document or remove useFeed.js legacy hook
- [ ] Fix share URL to use post slug instead of raw UUID
- [ ] Write unit tests for model layer (feedBlockVisibility, feedFollowVisibility, feedPrivateVisibility, feedRowVisibility, normalizeFeedRows, buildMentionMaps)

---

## PATCH RUN — 2026-06-05 (TICKET-FEED-MODULE-PATCH-0001)

**Patch run date:** 2026-06-05
**Ticket:** TICKET-FEED-MODULE-PATCH-0001
**Report:** `outputs/2026/06/05/PATCH/2026-06-05_patch_feed-module.md`

### Findings Resolved

| Finding | Severity | Resolution | File |
|---|---|---|---|
| VEN-PIPE-002 | HIGH | CONFIRMED SAFE — guard already present at `:8-10` | `feed.read.posts.dal.js` |
| VEN-PIPE-003 | HIGH | DEFERRED → DB/CARNAGE — TODO added at `:162` | `useFeed.js` |
| VEN-MOD-FEED-001 | HIGH | PATCHED — DEV guard added | `useFeed.js:241` |
| VEN-MOD-FEED-002 | HIGH | PATCHED — all 5 console.* guarded | `useCentralFeedActions.js` |
| VEN-MOD-FEED-003 | HIGH | PATCHED — UUID nav replaced with slug/username lookup | `useCentralFeedActions.js` |
| VEN-PIPE-004 | MEDIUM | PATCHED — raw ID fallbacks removed from `makeActorRoute` | `buildMentionMaps.model.js` |
| VEN-PIPE-005 | MEDIUM | CONFIRMED SAFE — isUuid already present | `hiddenPosts.dal`, `viewerReactions.dal` |
| VEN-PIPE-006 | MEDIUM | CONFIRMED SAFE — cache invalidation already wired | `useCentralFeedActions.js` |
| VEN-PIPE-008 | MEDIUM | CONFIRMED SAFE — blocked filter before hydration | `fetchFeedPage.pipeline.js` |
| VEN-MOD-FEED-005 | MEDIUM | PATCHED — DEV-only guard at function entry | `feed.posts.dal.js` |

### Remaining THOR Blockers After Patch

| Finding | Status | Required Action |
|---|---|---|
| VEN-PIPE-003 | DEFERRED | DB/CARNAGE: vport.profiles RLS policy must allow authenticated read of name/slug for public vports |

### Required Next Commands

- ARCHITECT-REVERIFY
- VENOM-REVERIFY
- BLACKWIDOW-REVERIFY
- ELEKTRA-REVERIFY
- SPIDER-MAN (security regression tests)
- DB/CARNAGE (VEN-PIPE-003)
- THOR (final gate re-run)

---

## THOR Gate — 2026-06-05

**Run date:** 2026-06-05
**FINAL DECISION: BLOCKED**

### Gate Results

| Gate | Name | Status |
|---|---|---|
| Gate 1 | Security | FAIL — BLACKWIDOW EXPLOITABLE = 8 (required = 0) |
| Gate 2 | Architecture | FAIL — SENTRY failures = 2 (required = 0) |
| Gate 3 | Behavior | PASS — LOGAN behavior contract complete, 8 workflows, 15 invariants |
| Gate 4 | Coverage | CONDITIONAL-FAIL — 0% coverage, TESTS.md plan exists but no committed sprint |
| Gate 5 | Documentation | CONDITIONAL-PASS — all 9 governance artifacts present and non-placeholder |
| Gate 6 | Endpoint/Chain | FAIL — ELEKTRA not formally run; EXPLOITABLE paths unpatched |

### Blocking Reasons

1. **VEN-PIPE-002** (THOR-BLOCKER-1): null realmId bypasses realm filter in `feed.read.posts.dal.js:30-33` — cross-realm post exposure. Must enforce non-null realmId; DAL must throw or return empty if null.

2. **VEN-PIPE-003** (THOR-BLOCKER-2): vport.profiles owner-only RLS nulls vport bundle for non-owners in `feed.read.actorsBundle.dal.js:84-89` — all vport posts invisible to non-owners. Must replace direct SELECT with SECURITY DEFINER RPC.

### Caution Items (Non-Blocking)

- 8 EXPLOITABLE findings total (6 non-THOR-blocking): VEN-MOD-FEED-001, VEN-MOD-FEED-002, VEN-MOD-FEED-003, VEN-MOD-FEED-004, VEN-PIPE-004, VEN-PIPE-008
- 0% test coverage with no committed sprint
- ELEKTRA never formally run — must be scheduled
- 10 of 15 DB tables have unverified RLS status
- 7 SENTRY drift items requiring SECURITY.md updates

### Required Before Re-Run

- [ ] Apply VEN-PIPE-002 fix + write SEC-REG-001 regression test (passing)
- [ ] Apply VEN-PIPE-003 fix + write SEC-REG-002 regression test (passing)
- [ ] SENTRY re-run confirms 0 Rule failures (8/8 passing)
- [ ] BLACKWIDOW EXPLOITABLE re-classified to 0 after patches applied
- [ ] ELEKTRA formal run complete and logged in SECURITY.md

**Report:** `outputs/2026/06/05/THOR/2026-06-05_thor_feed-release-gate.md`
