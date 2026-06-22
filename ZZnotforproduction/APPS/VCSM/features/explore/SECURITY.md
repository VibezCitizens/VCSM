# Security Posture — explore

Last Updated: 2026-06-07 (BLACKWIDOW reverify — BW-EXPLORE-001 CLOSED_SOURCE_VERIFIED)
Highest Open Severity: HIGH
THOR Release Blocker: YES — HAWK-2026-06-05-002 (post slug regression — functional THOR block; all post search results non-navigable)

---

## VENOM STATUS
VENOM Last Run: 2026-06-05
VENOM Status: COMPLETE

7 findings: 0 CRITICAL, 4 HIGH, 2 MEDIUM, 1 LOW

- VEN-EXPLORE-001 | HIGH (↑ from MEDIUM) | BEHAVIOR.md placeholder — §5 and §9 absent; all findings UNANCHORED; security regressions undetectable without contract
- VEN-EXPLORE-002 | HIGH | viewerActorId always null in primary search path — blocks and privacy settings bypassed for all Citizen searches
- VEN-EXPLORE-003 | HIGH (↑ from MEDIUM) | Raw UUID in /posts/${post.id} (PostCard) and /profile/${actor_id} fallback (ActorSearchResultRow) — platform no-raw-IDs rule violation
- VEN-EXPLORE-004 | MEDIUM | Module-level search cache is a singleton — cross-session leak risk on shared devices and after actor switch
- VEN-EXPLORE-005 | LOW | Legacy userId/ownerUserId fields in model output — VCSM identity contract violation
- VEN-EXPLORE-006 | HIGH (NEW) | FeaturedResultCard also has /profile/${actor_id} UUID fallback — highest-frequency navigation surface; same contract violation as VEN-003
- VEN-EXPLORE-007 | MEDIUM (NEW) | Route access conflict: scanner=public, barrel=public:false — auth boundary unresolved; needs HAWKEYE verification

THOR Blockers: VEN-EXPLORE-002 (block bypass), VEN-EXPLORE-003 (UUID nav), VEN-EXPLORE-006 (UUID featured card)

Output: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/Venom/2026-06-05_venom_explore-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-05 (VERIFY — TICKET-EXPLORE-P0-SECURITY-PATCH-0001)
ELEKTRA Status: PARTIAL — SOURCE_REVERIFY_RULE applied; source reads PASS; ARCHITECT check FAIL (V2 predates patch — V3 required for CLOSED_SOURCE_VERIFIED promotion)

0 HIGH open | 2 MEDIUM open | 1 LOW open | 1 INFO open
Prior THOR Blockers: ELEK-001, ELEK-002, ELEK-005 — PARTIAL_SOURCE_VERIFIED from live source reads
Current THOR Assessment: CAUTION — 0 HIGH; ARCHITECT V3 required to promote to CLOSED_SOURCE_VERIFIED; HAWKEYE + DB pending

| Finding ID | Severity | Title | VEN Ref | Reachability | Status |
|---|---|---|---|---|---|
| ELEK-2026-06-05-001 | HIGH | viewerActorId never injected — null viewer for all searches | VEN-002 | REACHABLE | PARTIAL_SOURCE_VERIFIED — source confirms SESSION_BIND; ARCHITECT V3 needed |
| ELEK-2026-06-05-002 | HIGH | UUID in PostCard + ActorSearchResultRow navigation | VEN-003 | REACHABLE | PARTIAL_SOURCE_VERIFIED — source confirms model+component guard; ARCHITECT V3 needed |
| ELEK-2026-06-05-003 | MEDIUM | Cache not actor-scoped — cross-session leak risk | VEN-004 | REACHABLE (timing) | PARTIAL_SOURCE_VERIFIED — source confirms actorId cache prefix; ARCHITECT V3 needed |
| ELEK-2026-06-05-004 | LOW | Legacy userId/ownerUserId in model output | VEN-005 | PARTIALLY_REACHABLE | STILL_OPEN_SOURCE_VERIFIED — deferred (IRONMAN) |
| ELEK-2026-06-05-005 | HIGH | FeaturedResultCard UUID navigation (highest-frequency) | VEN-006 | REACHABLE | PARTIAL_SOURCE_VERIFIED — source confirms model+component guard; ARCHITECT V3 needed |
| ELEK-2026-06-05-006 | MEDIUM | /explore route access conflict — auth enforcement unverified | VEN-007 | PARTIALLY_REACHABLE | STILL_OPEN_SOURCE_VERIFIED — HAWKEYE required |
| ELEK-2026-06-05-007 | MEDIUM | vc.posts RLS private actor post coverage unverified | ARCHITECT | PARTIALLY_REACHABLE | STILL_OPEN_SOURCE_VERIFIED — DB required |
| ELEK-2026-06-05-008 | INFO | Relative import in usecases/search.usecase.js | ARCHITECT | NOT_REACHABLE | STILL_OPEN_SOURCE_VERIFIED — deferred |
| VEN-EXPLORE-001 | HIGH | BEHAVIOR.md absence (FALSE POSITIVE for ELEKTRA) | VEN-001 | NOT_REACHABLE | Addressed (LOGAN DRAFT) |

§9 Invariants: ALL 6 ENFORCED per live source reads (pending ARCHITECT V3 formal confirmation)
Required next: ARCHITECT V3 re-run → ELEKTRA VERIFY re-run → findings promote to CLOSED_SOURCE_VERIFIED

Original scan: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/ELEKTRA/2026-06-05_elektra_explore-security-scan.md
Verify report: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/ELEKTRA/verify/2026-06-05_elektra-verify_explore-p0-patch.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-07 (reverify — viewerActorId patch confirm; branch vport-booking-feed-security-updates)
BLACKWIDOW Status: COMPLETE

8 findings: 0 CRITICAL, 2 HIGH, 3 MEDIUM, 2 LOW (1 HIGH CLOSED)

| Finding ID | Severity | Description | BW Result | Triage | Status |
|---|---|---|---|---|---|
| BW-EXPLORE-001 | HIGH | ctrlSearchResults never injects viewerActorId — p_viewer_actor_id: null for ALL authenticated Citizen searches; block and privacy enforcement bypassed | CLOSED_SOURCE_VERIFIED 2026-06-07 | PATCHED | HARDENED — useIdentity() injection confirmed in useSearchScreenController.js:74,112 |
| BW-EXPLORE-002 | LOW | viewerActorId in useSearchTabsActor/ctrlSearchTabs prop-sourced, not session-injected — personalization-only consequence on secondary path | PARTIAL | PLAUSIBLE | DRAFT |
| BW-EXPLORE-003 | MEDIUM | searchPosts/searchPostsByTag no viewer-scoped privacy filter — private actor post exposure risk if vc.posts RLS does not cover it | UNRESOLVED | PLAUSIBLE | DRAFT |
| BW-EXPLORE-004 | LOW | hydrateActorsByIds fire-and-forget with silenced errors — unvalidated hydration store write | PARTIAL | THEORETICAL | DRAFT |
| BW-EXPLORE-005 | HIGH | Raw UUID navigation: /posts/{post.id} ALWAYS (TRIVIAL); /profile/{actor_id} fallback when username null (PRACTICAL) — §9 INVARIANTS VIOLATED | BYPASSED | TRIVIAL/PRACTICAL | DRAFT |
| BW-EXPLORE-006 | MEDIUM | BEHAVIOR.md was PLACEHOLDER — PARTIALLY MITIGATED: LOGAN produced DRAFT BEHAVIOR.md 2026-06-05; §5 + §9 now declared; pending engineering APPROVED promotion | PARTIALLY_MITIGATED | THEORETICAL | DRAFT |
| BW-EXPLORE-007 | HIGH | FeaturedResultCard /profile/${uuid} fallback — highest-frequency navigation surface; §9 INVARIANT VIOLATED; UUID exposure at hero/first result position | BYPASSED | PRACTICAL | DRAFT |
| BW-EXPLORE-008 | MEDIUM | /explore route access conflict — scanner=public vs barrel=public:false; router auth enforcement unverified; unauthenticated search access plausible | UNRESOLVED | PLAUSIBLE | DRAFT |

THOR Blockers: BW-EXPLORE-005 (UUID nav — ARCHITECT V3 needed for promotion), BW-EXPLORE-007 (UUID featured card — ARCHITECT V3 needed for promotion)
BW-EXPLORE-001 REMOVED from THOR blockers — CLOSED_SOURCE_VERIFIED 2026-06-07
§9 Invariants BYPASSED: NEVER-EXPLORE-001, NEVER-EXPLORE-002, NEVER-EXPLORE-004

Output: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/BlackWidow/2026-06-05_blackwidow_explore-adversarial-triage.md
Prior Run: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_explore-adversarial-review.md

---

## PATCH STATUS
Patch Applied: 2026-06-05
Ticket: TICKET-EXPLORE-P0-SECURITY-PATCH-0001

| Finding | File(s) Changed | Fix |
|---|---|---|
| ELEK-001 / VEN-002 | hooks/useSearchScreenController.js, controller/searchResults.controller.js | useIdentity() injected; actorId threaded Hook→Controller→DAL; cache key scoped to actorId |
| ELEK-002 / VEN-003 (post) | ui/PostCard.jsx | UUID navigation suppressed; slug-gated onClick |
| ELEK-002 / VEN-003 (actor) | model/search.model.js, ui/ActorSearchResultRow.jsx | normalizeActorRow returns null when !row.username; UUID fallback removed from component |
| ELEK-003 / VEN-004 | hooks/useSearchScreenController.js | Side effect of ELEK-001 fix — actorId prefix in cache key isolates per-viewer |
| ELEK-005 / VEN-006 | ui/FeaturedResultCard.jsx | UUID fallback removed; username guard applied |

Deferred (not patched this run):
- ELEK-004 / VEN-005: legacy userId/ownerUserId (cleanup pass, IRONMAN to own)
- ELEK-006 / VEN-007: route auth conflict (HAWKEYE required first)
- ELEK-007: vc.posts RLS verification (DB to verify)

Required next: ELEKTRA re-run → BLACKWIDOW re-run → SPIDER-MAN regression tests → THOR re-evaluation

Patch Report: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/PATCH/2026-06-05_patch_explore-p0-security.md

---

## HAWKEYE STATUS

HAWKEYE Last Run: 2026-06-05
Status: DEGRADED
Scope: VCSM:explore

Open HAWKEYE Findings:
  HIGH: 1 (THOR Block)
  MEDIUM: 2 (no THOR Block)
  LOW: 0
  INFO: 0
  THOR Block Count: 1

Findings:
  HAWK-2026-06-05-002 | CONTRACT_DRIFT_MAJOR | HIGH | Post navigation broken — post.slug never set in DAL/model; onClick always undefined — THOR Block: YES
  HAWK-2026-06-05-003 | AUTH_WEAK | MEDIUM | vc.posts RLS coverage unverified for anon reads — THOR Block: NO
  HAWK-2026-06-05-004 | AUTH_ABSENT_METADATA | MEDIUM | /explore barrel public:false conflicts with effective public access — THOR Block: NO

ELEK-006 / VEN-007 status: ADDRESSED — HAWKEYE confirms auth conflict is metadata-only; no exploitable route guard absent. Recommend barrel update to public:true.
ELEK-007 status: STILL OPEN — vc.posts RLS remains UNVERIFIED (HAWK-003 corroborates).

Coverage Note: Edge functions = NONE. Webhooks = NONE. All ARCHITECT-confirmed endpoints verified.

Output: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/HAWKEYE/2026-06-05_hawkeye_explore-endpoint-verification.md

---

## WANDA STATUS

WANDA Last Run: 2026-06-05
Status: COMPLETE
Mode: WANDA_BLIND_MODE — independent source discovery
Scope: VCSM:explore
Chain Gate: PASS (all 7 upstream reports present, all post-patch, all age 0 days)

New WANDA Findings: 5 (2 HIGH, 2 MEDIUM, 1 INFO)

| Finding | Severity | Title | THOR Block? |
|---|---|---|---|
| WANDA-C-001 | HIGH | Post slug assumption invalid — nav permanently broken (corroborates HAWK-002 independently) | YES (corroborating) |
| WANDA-D-001 | HIGH | Post content in search cards exposed independent of navigation state — broken nav ≠ content protection | YES — vc.posts RLS audit required |
| WANDA-D-002 | MEDIUM | Dead code reactivation bypasses entire security patch (ctrlSearchTabs/searchUsecase/useSearchTabsActor) | NO (latent risk, not active) |
| WANDA-E-001 | MEDIUM | Cross-feature useSearchActor callers receive viewerActorId behavior change — not verified | NO (recommended pre-THOR audit) |
| WANDA-E-002 | INFO | WanderCardSearch realmId/baseUrl data flow pipeline — currently null | NO |

WANDA THOR Recommendation: FAIL
Required before THOR: vc.posts RLS audit (WANDA-D-001); dead code deletion (WANDA-D-002); cross-feature caller audit (WANDA-E-001)

Output: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/WANDA/2026-06-05_wanda_explore-independent-redteam.md
