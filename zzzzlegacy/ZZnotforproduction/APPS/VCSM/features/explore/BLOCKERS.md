---
name: vcsm.explore.blockers
description: Active THOR release blockers for VCSM:explore — updated by SPIDER-MAN, HAWKEYE, LOKI, WANDA
metadata:
  type: blockers
  last-updated: 2026-06-05
  release-safety: BLOCKED
---

# Release Blockers — explore

**Status: BLOCKED**
**Last Updated:** 2026-06-05

---

## THOR Block Registry

### HAWK-2026-06-05-002 | HIGH | HAWKEYE | CONTRACT_DRIFT_MAJOR

**Title:** Post navigation broken — post.slug never set in DAL/model; onClick always undefined

**Source:** HAWKEYE 2026-06-05
**Root Cause:** DAL `search.dal.js` SELECT list excludes `slug` from `vc.posts`; `normalizeResult` post case excludes `slug` field; PostCard guards onClick on `post.slug` (always undefined) → all post results non-navigable.
**Impact:** 100% of post search results are non-interactive. Post search feature is functionally broken.
**Path:** `dal/search.dal.js` → `model/search.model.js` (normalizeResult) → `ui/PostCard.jsx`
**Status:** OPEN — patch required (add slug to DAL select + model map)
**SPIDER-MAN:** SM-EXPLORE-003 (P0) — no regression test

**Required to close:**
1. Add `slug` to DAL SELECT: `select('id, actor_id, text, title, tags, slug, created_at')`
2. Add `slug` to `normalizeResult` post case output
3. Add regression test: searchPosts result includes slug; PostCard onClick defined when slug present

---

### SM-EXPLORE-001 | P0 | SPIDER-MAN | ZERO_INVARIANT_COVERAGE

**Title:** All 6 NEVER-EXPLORE invariants unprotected — zero test coverage on entire feature

**Source:** SPIDER-MAN 2026-06-05
**Evidence:** 0 test files in `apps/VCSM/src/features/explore/`; 0 explore signals in all 6 scanner maps (all FRESH)
**Impact:** Any change to explore can silently regress security fixes or invariant guards. ELEK-001/002/005 patches are unprotected. NEVER-001 through NEVER-006 have no trip-wire tests.
**Status:** OPEN

**Required to close:**
- Write P0 regression test suite for NEVER-EXPLORE-001 through NEVER-EXPLORE-006 (see TESTS.md §P0-A)
- Write P0 regression test suite for ELEK-001, ELEK-002, ELEK-005, ELEK-003 patches (see TESTS.md §P0-B)
- Write P0 regression test for HAWK-002 slug data flow (see TESTS.md §P0-C)

---

### SM-EXPLORE-002 | P0 | SPIDER-MAN | UNPROTECTED_SECURITY_PATCH

**Title:** Security patch (ELEK-001, ELEK-002, ELEK-005) applied with zero regression coverage

**Source:** SPIDER-MAN 2026-06-05
**Patch Date:** 2026-06-05 (TICKET-EXPLORE-P0-SECURITY-PATCH-0001)
**Evidence:** Source confirms all three fixes are in place (ELEKTRA PARTIAL_SOURCE_VERIFIED); 0 regression tests exist
**Impact:** Any future edit to useSearchScreenController, ctrlSearchResults, normalizeActorRow, ActorSearchResultRow, or FeaturedResultCard can silently undo the security fixes.
**Status:** OPEN

**Required to close:** See TESTS.md §P0-B

---

## Deferred / WATCH Items (Not THOR Blocking)

| Item | Severity | Owner | Condition to Close |
|---|---|---|---|
| SM-EXPLORE-004: Orphaned controller paths (ctrlSearchTabs, searchUsecase, useSearchTabsActor) | P1 | ARCHITECT | Delete dead code or add guard test |
| ELEK-004 / VEN-005: Legacy userId/ownerUserId in model output | LOW | IRONMAN | Cleanup pass |
| ELEK-007 / HAWK-003: vc.posts RLS coverage unverified | MEDIUM | DB | DB audit required |
| HAWK-004: /explore barrel public:false vs. effective public access | MEDIUM | Wolverine | Align barrel declaration to public:true |

---

## How to Close THOR Blockers

Minimum required to reach THOR eligibility:

1. **Fix HAWK-002 root cause:** Add `slug` to DAL select + `normalizeResult` post case
2. **Write P0-A:** NEVER invariant regression suite (8 tests)
3. **Write P0-B:** Security patch regression suite (7 tests)
4. **Write P0-C:** HAWK-002 slug data flow regression suite (4 tests)
5. **Re-run SPIDER-MAN** — must reach CLEAN or WATCH to unblock
6. **Re-run ELEKTRA** (ARCHITECT V3 required) — promote PARTIAL_SOURCE_VERIFIED findings to CLOSED_SOURCE_VERIFIED
7. **Re-run WANDA** — post-patch adversarial discovery
8. **THOR** — fresh session, all gates must pass
