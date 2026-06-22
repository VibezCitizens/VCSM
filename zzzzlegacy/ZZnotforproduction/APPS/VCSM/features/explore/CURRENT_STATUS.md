---
name: vcsm.explore.current-status
description: VCSM explore current feature status — updated by ARCHITECT V2
metadata:
  type: status
---

# CURRENT STATUS — VCSM / features / explore

## ARCHITECT

**Last run:** 2026-06-05
**Scanner version:** 1.1.0
**Architecture state:** STABLE (no source changes since 2026-06-04)
**Independence status:** MOSTLY INDEPENDENT
**Final module status:** MOSTLY COMPLETE
**Spaghetti score:** WATCH
**New findings (2026-06-05):**
- FilterTabs.jsx: CONFIRMED DEAD CODE — not imported anywhere; SearchScreen.view.jsx implements its own inline tabs
- ExploreFeed.jsx: `SHOW_EXPLORE_DISCOVERY_BLOCKS = false` hardcoded — CitizensRow and VportsRow are permanently dead at runtime; both contain fake data stubs only
- PostCard.jsx: raw UUID in `/posts/${post.id}` navigation — HIGH severity, platform rule violation
- ActorSearchResultRow.jsx: UUID fallback in `/profile/` navigation when username is null — HIGH severity
- WanderCardSearch.jsx fully read: navigates to `/wanders/create` with location state; UI-only, no raw IDs exposed
**Release risk:** MEDIUM — raw UUID in navigation paths is a platform contract violation requiring fix before explore-touching releases
**Recommended handoffs:** VENOM (raw IDs + RLS audit), LOGAN (BEHAVIOR.md), SPIDER-MAN (tests + barrel path), IRONMAN (dead code, adapter)

---

## LOGAN

**Last run:** 2026-06-05
**Mode:** behavior-intake
**Ticket:** TICKET-EXPLORE-BUNDLE-SECURITY-PHASE-0001
**Drift classification:** DRIFT_LEVEL_2 — BEHAVIOR.md was a placeholder; §5 and §9 absent
**Status:** COMPLETE

**Deliverable:** BEHAVIOR.md upgraded from PLACEHOLDER to DRAFT
- 13 sections authored from full source evidence (ARCHITECT V2 + VENOM V2 findings)
- §5: 6 security rules declared (SEC-EXPLORE-001 through SEC-EXPLORE-006)
- §9: 6 Must Never Happen invariants declared (NEVER-EXPLORE-001 through NEVER-EXPLORE-006)
- All 3 THOR-blocking VEN findings anchored in §5 and §9
- 10 governance gaps recorded in §12

**VEN-EXPLORE-001 impact:** PARTIALLY RESOLVED — BEHAVIOR.md exists as DRAFT; full resolution requires engineering review → APPROVED promotion

**Output:** ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/Logan/2026-06-05_logan_explore-behavior-intake.md

---

## BLACKWIDOW

**Last run:** 2026-06-05 (triage run — TICKET-EXPLORE-BUNDLE-SECURITY-PHASE-0001)
**Status:** COMPLETE
**Mode:** Adversarial verification of all 7 VEN-2026-06-05 findings

**Summary:** 8 BW findings (includes 2 new for VEN-006 + VEN-007)
- BYPASSED: BW-001 (viewerActorId bypass — PRACTICAL), BW-005 (UUID nav — TRIVIAL/PRACTICAL), BW-007 NEW (FeaturedResultCard — PRACTICAL)
- UNRESOLVED: BW-003 (vc.posts RLS), BW-008 NEW (route access conflict)
- PARTIALLY_MITIGATED: BW-006 (BEHAVIOR.md — LOGAN produced DRAFT)
- PARTIAL: BW-002 (secondary path viewerActorId), BW-004 (hydration fire-and-forget)
- §9 Invariants BYPASSED: NEVER-EXPLORE-001, NEVER-EXPLORE-002, NEVER-EXPLORE-004
- §9 Invariants BLOCKED: NEVER-EXPLORE-003, NEVER-EXPLORE-005, NEVER-EXPLORE-006

**THOR blockers:** BW-001, BW-005, BW-007

**Output:** ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/BlackWidow/2026-06-05_blackwidow_explore-adversarial-triage.md

---

## ELEKTRA

**Last run:** 2026-06-05 (first run — TICKET-EXPLORE-BUNDLE-SECURITY-PHASE-0001)
**Status:** COMPLETE
**Mode:** Source-to-sink chain analysis — all 7 VEN findings

**Summary:** 7 findings + 1 INFO | 2 false positives | 7 patch advisories
- HIGH (REACHABLE): ELEK-001 (viewerActorId null), ELEK-002 (UUID PostCard + ActorRow), ELEK-005 (UUID FeaturedResultCard)
- MEDIUM: ELEK-003 (cache cross-session, REACHABLE timing), ELEK-006 (route access, PARTIALLY_REACHABLE — HAWKEYE needed), ELEK-007 (vc.posts RLS, PARTIALLY_REACHABLE — DB needed)
- LOW: ELEK-004 (legacy userId, PARTIALLY_REACHABLE)
- INFO: ELEK-008 (relative import)
- False Positives: VEN-EXPLORE-001 (BEHAVIOR.md — no code chain, LOGAN addressed), hydrateActorsByIds (display-only, adequate catch)

**VEN Reachability Summary:**
- REACHABLE: VEN-002, VEN-003, VEN-004, VEN-006
- PARTIALLY_REACHABLE: VEN-005, VEN-007
- NOT_REACHABLE: VEN-001 (governance — LOGAN addressed)

**Patch advisories:** PATCH-001 (3-layer SESSION_BIND), PATCH-002 (model guard + slug), PATCH-003 (cache scoping), PATCH-004 (legacy field removal), PATCH-008 (relative import)

**THOR blockers:** ELEK-001, ELEK-002, ELEK-005

**Output:** ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/ELEKTRA/2026-06-05_elektra_explore-security-scan.md

---

## Triage Report

**EXPLORE_SECURITY_TRIAGE_REPORT.md — COMPLETE**
- All 7 VEN findings triaged across LOGAN, BLACKWIDOW, ELEKTRA
- Decision matrix: 3 Remediate First, 1 Engineering Review, 4 Can Defer
- THOR gate: BLOCKED (3 blockers — viewerActorId, UUID nav actor, UUID nav post)
- Report: ZZnotforproduction/APPS/VCSM/features/explore/EXPLORE_SECURITY_TRIAGE_REPORT.md

---

## PATCH

**Last run:** 2026-06-05
**Ticket:** TICKET-EXPLORE-P0-SECURITY-PATCH-0001
**Status:** COMPLETE

**Findings patched:** ELEK-001, ELEK-002 (post + actor), ELEK-003 (side effect), ELEK-005
**Files changed:** 6 source files

| File | Change |
|---|---|
| hooks/useSearchScreenController.js | useIdentity() injected; actorId→cache key + ctrlSearchResults; dep array updated |
| controller/searchResults.controller.js | viewerActorId threaded from params to searchDal opts |
| model/search.model.js | normalizeActorRow: null guard on !row.username |
| ui/PostCard.jsx | UUID navigation suppressed; slug-gated onClick |
| ui/ActorSearchResultRow.jsx | UUID fallback removed; username guard |
| ui/FeaturedResultCard.jsx | UUID fallback removed; username guard |

**THOR status:** PENDING VERIFICATION — patches applied, ELEKTRA re-run required
**Deferred:** ELEK-004 (userId legacy), ELEK-006 (HAWKEYE needed), ELEK-007 (DB needed)

**Patch Report:** ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/PATCH/2026-06-05_patch_explore-p0-security.md
