---
name: vcsm.explore.tests
description: SPIDER-MAN test governance record for VCSM:explore — coverage status, release safety, required tests
metadata:
  type: tests
  owner: SPIDER-MAN
  last-run: 2026-06-05
  release-safety: BLOCKED
---

# Test Governance — explore

**SPIDER-MAN Last Run:** 2026-06-05
**Release Safety:** BLOCKED
**THOR Recommendation:** FAIL

---

## Coverage Summary

| Layer | Total Modules | Covered | Coverage % |
|---|---|---|---|
| DAL | 6 | 0 | 0% |
| Model | 9 | 0 | 0% |
| Controller | 3 | 0 | 0% |
| Hook | 9 | 0 | 0% |
| Component | 11 | 0 | 0% |
| Screen | 2 | 0 | 0% |
| **TOTAL** | **40** | **0** | **0%** |

| Contract Layer | Total | Protected | Coverage % |
|---|---|---|---|
| BEH behaviors | 7 | 0 | 0% |
| SEC rules | 6 | 0 | 0% |
| NEVER invariants | 6 | 0 | 0% |

---

## THOR Block Findings

| Finding | Severity | Block Reason |
|---|---|---|
| SM-EXPLORE-001 | P0 | All 6 NEVER-EXPLORE invariants UNCOVERED (S4 rule — P0 per invariant) |
| SM-EXPLORE-002 | P0 | Security patch (ELEK-001, ELEK-002, ELEK-005) has zero regression coverage |
| SM-EXPLORE-003 | P0 | HAWK-002 regression (post slug data flow broken) undetected — post search unusable |

---

## Required Tests (P0 — Must Write Before THOR)

### P0-A — NEVER Invariant Regression Suite

**Target:** NEVER-EXPLORE-001 through NEVER-EXPLORE-006
**Affected Modules:** normalizeActorRow, ActorSearchResultRow, FeaturedResultCard, PostCard, useSearchScreenController, searchDal
**Owner:** Wolverine

| Test | Invariant Protected |
|---|---|
| normalizeActorRow returns null when username is null | NEVER-001, NEVER-002 |
| ActorSearchResultRow must not construct URL with UUID pattern | NEVER-001 |
| FeaturedResultCard must not construct URL with UUID pattern | NEVER-001 |
| PostCard must never navigate to /posts/{uuid} | NEVER-002 |
| viewerActorId must come from useIdentity() — never from props or URL params | NEVER-003 |
| Authenticated search must not return actor blocked by viewer | NEVER-004 |
| Post with deleted_at IS NOT NULL must not appear in results | NEVER-005 |
| searchDal must not be called when debounced query is empty string | NEVER-006 |

### P0-B — Security Patch Regression Suite

**Target:** ELEK-001, ELEK-002, ELEK-003, ELEK-005 patches (2026-06-05)
**Affected Modules:** ctrlSearchResults, normalizeActorRow, ActorSearchResultRow, FeaturedResultCard, useSearchScreenController

| Test | Finding Protected |
|---|---|
| ctrlSearchResults passes non-null viewerActorId from session to searchDal when authenticated | ELEK-001 |
| ctrlSearchResults passes null viewerActorId to searchDal when unauthenticated | ELEK-001 |
| normalizeActorRow returns null for actor row with null username | ELEK-002 |
| ActorSearchResultRow onClick is undefined when actor has no username | ELEK-002 |
| FeaturedResultCard onClick navigates to /profile/{username} not /profile/{uuid} | ELEK-005 |
| Cache key for authenticated viewer includes actorId prefix | ELEK-003 |
| Two different authenticated actors do not share cache entries | ELEK-003 |

### P0-C — HAWK-002 Regression Suite (Post Slug Data Flow)

**Target:** HAWK-2026-06-05-002 — post slug never selected or mapped
**Affected Modules:** searchPosts (DAL), normalizeResult (Model), PostCard (Component)
**Root cause:** DAL `select()` excludes `slug`; `normalizeResult` post case excludes `slug`; PostCard guards `onClick` on `post.slug` → always undefined

| Test | What It Protects |
|---|---|
| searchPosts DAL result includes slug field | Slug column must be in SELECT list |
| normalizeResult('post', row) output includes slug field | Model must map slug |
| PostCard with post.slug defined renders a clickable element | End-to-end navigation functional |
| PostCard with post.slug undefined renders a non-interactive element | Guard behavior preserved |

---

## Required Tests (P1 — Required Before Coverage Unblock)

| Test | Covers |
|---|---|
| ctrlSearchTabs is not imported by any active render tree path | SM-EXPLORE-004 — orphaned bypass |
| searchUsecase is not imported by any active render tree path | SM-EXPLORE-004 — orphaned bypass |
| BEH-EXPLORE-002: Post search returns results with slug in each result | BEH-EXPLORE-002 |
| BEH-EXPLORE-001: Actor search sends viewerActorId to RPC | BEH-EXPLORE-001 |
| BEH-EXPLORE-006: Cache hit returns results without DAL call within 45s | BEH-EXPLORE-006 |
| BEH-EXPLORE-007: No DAL call when debounced query is whitespace | BEH-EXPLORE-007 |

---

## Scanner Map Coverage

All maps FRESH at last SPIDER-MAN run (2026-06-05).

| Map | Explore Signals | Status |
|---|---|---|
| test-map.json | 0 | UNCOVERED |
| test-traceability-map.json | 0 | UNCOVERED |
| security-path-map.json | 0 | UNCOVERED |
| rpc-execution-map.json | 0 | UNCOVERED |
| callgraph.json | 0 | UNCOVERED |

---

## Full Report

[ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/SPIDER-MAN/2026-06-05_spiderman_explore-coverage.md](outputs/2026/06/05/SPIDER-MAN/2026-06-05_spiderman_explore-coverage.md)
