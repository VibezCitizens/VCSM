---
title: Feed Module — SENTRY Compliance Report
status: COMPLETE
feature: feed
module: feed
command: SENTRY
run-date: 2026-06-05
source-path: apps/VCSM/src/features/feed/
---

# SENTRY — Feed Module Compliance Report
Run date: 2026-06-05

---

## Compliance Summary

| Rules Checked | Passed | Failed | Warning |
|---|---|---|---|
| 8 | 4 | 2 | 2 |

Overall status: NON-COMPLIANT — 2 FAILs, 2 WARNINGs. Feed module is not release-ready.

---

## Rule Results

### RULE 1 — Dependency Direction: apps/VCSM → engines/ → shared/ (never reverse, never cross-app)

**PASS**

Evidence:
- CentralFeedScreen.jsx: all imports use `@/` aliases scoped to the VCSM app. No imports from `apps/wentrex`, `apps/Traffic`, or reverse engine imports.
- useCentralFeed.js: imports `@hydration` (engine alias), `@/state/actors/actorStore`, `@/features/feed/queries/fetchCentralFeedPage`, `@/queries/queryKeys`, `@debuggers/feed` (stub in production). Dependency direction is clean: screen → hook → engine.
- useCentralFeedActions.js: all cross-feature imports use `.adapter` suffix — no direct internal imports into other features.
- fetchFeedPage.pipeline.js: imports only from `@/features/feed/dal/...`, `@/features/feed/model/...`, and `@hydration`. No cross-app boundary violations.
- feedFeature.group.js (diagnostics): imports feed internals directly but this file is `src/dev/diagnostics/` — dev-only, not in the production bundle path.
- No engines/ or shared/ modules are importing back into apps/.

---

### RULE 2 — Layer Isolation: DALs must not call hooks; hooks must not call DALs directly

**PASS**

Evidence:
- useCentralFeed.js: calls `fetchCentralFeedPage` (a query function in `queries/`), not a DAL directly. The query function wraps the pipeline. Pipeline → DAL is the correct direction.
- useCentralFeedActions.js: calls cross-feature adapter hooks only. No direct DAL calls.
- fetchFeedPage.pipeline.js: calls DALs directly — this is the pipeline layer, which is the correct boundary for DAL fan-out.
- feedRowVisibility.model.js: pure function, no hook or DAL calls.
- No DAL file found calling a React hook (confirmed via file reads).
- Layer sequence is maintained: Screen → Hook → QueryFn → Pipeline → DAL → DB.

---

### RULE 3 — No Raw IDs in Public URLs

**FAIL**

Evidence:
- useCentralFeedActions.js line 152: `navigate('/profile/' + postMenu.postActorId)` — raw actor UUID in public navigation URL.
- useCentralFeedActions.js line 234-236: `${window.location.origin}/post/${postId}` — raw post UUID in share URL.
- fetchFeedPage.pipeline.js (via buildMentionMaps.model.js line 6): mention route fallback `/profile/${actorId}` — raw actor UUID exposed in mention routes when actor has no username or slug.
- Platform rule: raw UUIDs must never appear in public-facing URLs.
- Findings: VEN-MOD-FEED-003 (navigate UUID), VEN-MOD-FEED-004 (share UUID), VEN-PIPE-004 (mention route UUID).
- These are documented OPEN findings in SECURITY.md.

---

### RULE 4 — No console.log in Production Code

**FAIL**

Evidence:
- fetchFeedPage.pipeline.js line 137: `console.log("[useFeed][mentions][DBG] debugPostId is on this page", ...)` — this is NOT gated by `import.meta.env.DEV`. This console.log is unconditional and reaches production builds. The surrounding code has a DEV check at line 136 (`if (debugPostId && pagePostIds.includes(debugPostId))`) but this is a runtime condition check, NOT a build-time DEV gate.
- DebugPrivacyPanel.jsx lines 24-29: `console.groupCollapsed(...)` and `console.log(row)` inside a `useEffect`. These ARE gated by `if (!isDev || !rows.length) return;` which uses `import.meta.env.DEV`. These are correctly gated.
- useCentralFeedActions.js lines 68, 139, 182, 197, 221: `console.warn` and `console.error` calls — NOT gated by DEV. These reach production. Documented as VEN-MOD-FEED-002.
- feedFeature.group.js: no bare console calls found in the diagnostic group file.

Production-reaching console calls:
1. `fetchFeedPage.pipeline.js:137` — `console.log` (no DEV gate)
2. `useCentralFeedActions.js:68` — `console.warn` (no DEV gate)
3. `useCentralFeedActions.js:139` — `console.error` (no DEV gate)
4. `useCentralFeedActions.js:182` — `console.error` (no DEV gate)
5. `useCentralFeedActions.js:197` — `console.warn` (no DEV gate)
6. `useCentralFeedActions.js:221` — `console.error` (no DEV gate)

---

### RULE 5 — Visibility Models Must Be Applied

**PASS**

Evidence:
- feedRowVisibility.model.js: confirmed. Composed of three sub-models: feedBlockVisibility (bidirectional block check), feedFollowVisibility (is_active-gated follow set), feedPrivateVisibility (private/owner/follower gate).
- fetchFeedPage.pipeline.js: calls `normalizeFeedRows` which calls `resolveFeedRowVisibilityModel` per row. All 9 parallel DALs complete before normalization runs.
- Visibility reasons are enforced: `blocked_actor | missing_actor | missing_vport_profile | inactive_vport | missing_profile | private_not_following | visible_vport | visible_user` — 8 branches verified in source.
- Block set is bidirectional (both blocker and blocked perspectives included).
- `hiddenByMeSet` (moderation.actions) is also passed to normalizeFeedRows — server-side hidden posts are honored.
- CentralFeedScreen additionally applies `is_hidden_for_viewer` flag per post at the render layer.

Outstanding gap: VEN-PIPE-002 — null realmId bypasses realm filter in readFeedPostsPage. This is a feed FETCH boundary gap, not a visibility model gap. The visibility model itself is correctly applied once posts are fetched. However, incorrect cross-realm posts entering the pipeline is a data integrity failure upstream of the model.

---

### RULE 6 — Write Surfaces Must Validate Actor Ownership

**WARNING**

Evidence:
- Only one write surface exists in the feed module: `markWelcomeFeedCardSeenDAL` in feedWelcomeCard.dal (UPSERT to vc.actor_onboarding_steps).
- App-layer ownership assertion: NONE — actorId is caller-supplied with only a null check.
- RLS verification: VERIFIED SAFE — migration 20260518010000 confirms actor_owners ownership enforcement on upsert to vc.actor_onboarding_steps.
- Assessment: RLS is sufficient for this surface. The table uses actor_owners enforcement at the DB level. The lack of an app-layer check is a defense-in-depth gap but the DB boundary is hardened.
- Classification: ACCEPTED (documented in SECURITY.md as "RLS verified sufficient").

---

### RULE 7 — Debug Panels Must Be Dev-Only

**WARNING**

Evidence:
- DebugFeedFilterPanel.jsx: first line inside component is `const isDev = import.meta.env.DEV`. Return guard: `if (!isDev || sortedRows.length === 0) return null`. Correctly gated at the component level.
- DebugPrivacyPanel.jsx: `const isDev = import.meta.env.DEV`. Guards on both the useEffect (console output) and the component return: `if (!isDev || !rows.length) return null`. Correctly gated at the component level.
- CentralFeedScreen.jsx line 106-107: `debugPrivacy = IS_DEV && (debugMode === 'privacy' || debugMode === 'all')` and `debugFilter = IS_DEV && (debugMode === 'filter' || debugMode === 'all')`. Both panels are rendered only when the IS_DEV flag AND the debug query param are both present.
- FeedDebugPanel (from @debuggers/feed): the production stub at `debuggers-stub/feed/index.js` exports `function FeedDebugPanel() { return null }` — correct no-op stub. CentralFeedScreen mounts it only at `{import.meta.env.DEV && <FeedDebugPanel />}`.
- @debuggers/feed import in CentralFeedScreen.jsx line 16: unconditional import. In production, this resolves to the stub (`debuggers-stub/feed/index.js`) — all exports are no-ops. This is correct per the stub architecture.

WARNING raised because: DebugPrivacyPanel still has `console.groupCollapsed` and `console.log` calls that are controlled by `isDev` runtime check. While `import.meta.env.DEV` is false in production (string replacement at build time), the tree-shaking behavior for this specific pattern should be verified. The panel returns null in production, but the useEffect with console calls is technically still mounted even if the render returns null. The `if (!isDev || !rows.length) return` guard inside useEffect prevents execution in practice, but a minor architectural concern remains: the effect runs the guard check in production even though it immediately returns.

Additionally: `getDebugPrivacyRowsController` lacks an `import.meta.env.DEV` gate (SEC finding BW-FEED-008 from ARCHITECTURE.md outstanding issues). This controller is callable in production if its route is directly invoked. This is a real exposure.

---

### RULE 8 — i18n Completeness

**WARNING** (degraded from expected PASS — deficiency in content, not structure)

Evidence:
- en/feed.json: 12 keys present: feed, noPostsYet, loadMore, post, comment, reply, like, share, report, hide, newPosts, refresh.
- es/feed.json: identical content to en/feed.json — ALL VALUES ARE IN ENGLISH. There is no Spanish localization. Every value in the Spanish file matches the English file exactly.
- Outstanding from ARCHITECTURE.md: "i18n Spanish translations are identical to English — no actual localization."
- Assessment: The i18n structure is complete (same keys in both files). However, the Spanish file contains no translated content — it is a copy of the English file. This is not a structural FAIL but is a localization quality failure.
- Hard FAIL items: None — the keys are structurally present in both files.
- Strings observed hardcoded in the UI not in i18n:
  - CentralFeedScreen line 149: `"No Vibes found."` — hardcoded, not from i18n
  - CentralFeedScreen line 189: `"Loading more..."` — hardcoded, not from i18n
  - CentralFeedScreen line 192: `"End of feed"` — hardcoded, not from i18n
  - useCentralFeedActions line 88-92: confirm modal labels ("Delete Vibe", "Delete this Vibe?", "Delete") — hardcoded
  - useCentralFeedActions line 113-114: report modal labels ("Report Vibe", "Tell us what is wrong with this Vibe.") — hardcoded
  - useCentralFeedActions line 158-161: block labels ("Block actor", "Block this actor?", "Block") — hardcoded
  - ShareModal title: "Spread" — hardcoded

All user-facing strings should be routed through i18n. A significant number are hardcoded in components and hooks, bypassing the i18n system entirely.

---

## Governance Completeness Check

| Artifact | Exists | Non-Placeholder | Status |
|---|---|---|---|
| ARCHITECTURE.md | YES | YES (status: VERIFIED, 2026-06-05) | COMPLETE |
| SECURITY.md | YES | YES (status: ACTIVE, 19 findings documented) | COMPLETE |
| BEHAVIOR.md | YES | YES (status: ACTIVE, 8 workflows, 15 invariants, 2026-06-05 LOGAN pass) | COMPLETE |
| TESTS.md | YES | YES (status: ACTIVE, coverage matrix, 18 security regression tests) | COMPLETE |
| OWNERSHIP.md | NO | N/A | MISSING — created by this SENTRY run |
| BLOCKERS.md | NO | N/A | MISSING — created by this SENTRY run |
| DEFERRED.md | NO | N/A | MISSING — created by this SENTRY run |

Governance completeness: PARTIAL — 4/7 artifacts present pre-SENTRY. OWNERSHIP, BLOCKERS, DEFERRED created this run.

---

## Drift Items

Items that represent changes or discrepancies since the last governance pass (2026-06-05 ARCHITECT/LOGAN/VENOM/BLACKWIDOW):

1. `console.log` at fetchFeedPage.pipeline.js:137 is flagged as an OPEN finding (VEN-PIPE-009 / dead debugPostId parameter) but is not clearly listed as a production-reaching console call in SECURITY.md HIGH finding VEN-MOD-FEED-001/002. The pipeline-level console.log is a distinct exposure from the useFeed.js and useCentralFeedActions.js ones.
2. DebugPrivacyPanel.jsx useEffect console calls are gated by `isDev` but the effect itself runs in production (guard exits early). This pattern is technically safe but diverges from the preferred approach of wrapping in `if (import.meta.env.DEV)` at the effect body top level rather than relying on a runtime variable derived from it.
3. Spanish i18n file is identical to English — not previously flagged as a FAIL item in any governance artifact, only as an architecture TODO. This should be escalated to an open finding.
4. Multiple hardcoded user-facing strings in CentralFeedScreen.jsx, useCentralFeedActions.js — these are not present in either i18n file and represent ungoverned user copy.
5. ELEKTRA has never been run on this module — confirmed in SECURITY.md. 15 ELEKTRA source-to-sink chains have been built (per context) but the full ELEKTRA run output is not present.
6. getDebugPrivacyRowsController lacks DEV gate — noted in ARCHITECTURE.md outstanding issues but not reflected as a distinct SECURITY.md finding separate from VEN-FEED-003.
7. feedFeature.group.js imports DebugFeedFilterPanel and DebugPrivacyPanel directly into a diagnostics group — acceptable for dev-only diagnostics, but creates a coupling to debug components from the diagnostics runner.

---

## THOR Blockers

| Finding | Severity | Surface | Description |
|---|---|---|---|
| VEN-PIPE-002 | HIGH | feed.read.posts.dal.js:30-33 | null realmId bypasses realm filter — cross-realm post exposure |
| VEN-PIPE-003 | HIGH | feed.read.actorsBundle.dal.js:84-89 | vport.profiles owner-only RLS nulls vport bundle — vport posts invisible to non-owners |

Both blockers are carried forward from prior BLACKWIDOW pass. No new THOR blockers introduced in this SENTRY run.

---

## Findings Not Carried as THOR Blockers (But Require Action)

| Finding | Severity | Rule Violated | Action Required |
|---|---|---|---|
| Raw UUID in navigate URL (VEN-MOD-FEED-003) | HIGH | Rule 3 | Replace `/profile/${actorId}` with slug-based route |
| Raw UUID in share URL (VEN-MOD-FEED-004) | MEDIUM | Rule 3 | Replace `/post/${postId}` with slug or short-id |
| Raw UUID in mention route fallback (VEN-PIPE-004) | MEDIUM | Rule 3 | Drop mention entries with no slug/username instead of falling back to UUID |
| console.log in pipeline:137 (no DEV gate) | HIGH | Rule 4 | Wrap in `if (import.meta.env.DEV)` or remove debugPostId branch |
| 5x console.* in useCentralFeedActions (VEN-MOD-FEED-002) | HIGH | Rule 4 | Wrap in `if (import.meta.env.DEV)` guards |
| Spanish i18n identical to English | MEDIUM | Rule 8 | Provide actual Spanish translations |
| Hardcoded UI strings not in i18n | MEDIUM | Rule 8 | Move all user-facing strings to i18n keys |
| getDebugPrivacyRowsController no DEV gate | MEDIUM | Rule 7 | Add import.meta.env.DEV guard to controller |
| 0% test coverage | HIGH | (implicit) | Priority 1: pure model tests + SEC regression tests |

---

## Production Safety Assessment

| Category | Assessment |
|---|---|
| Auth gate | SAFE — unauthenticated users redirected before any hook fires |
| Visibility enforcement | SAFE (client-side model) with upstream gap (VEN-PIPE-002 realm isolation) |
| Write surface | SAFE — single write surface with verified RLS |
| Debug panel exposure | SAFE — all panels correctly gated behind DEV + query param |
| Console leaks | UNSAFE — 6 production-reaching console calls identified |
| URL safety | UNSAFE — raw UUIDs in navigate and share URLs |
| i18n | INCOMPLETE — Spanish translations missing |
| Test coverage | 0% — no regression safety net |

---

*SENTRY run complete. Report written 2026-06-05.*
