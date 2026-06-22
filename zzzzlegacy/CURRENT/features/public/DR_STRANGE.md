---
# DR. STRANGE ENTRY — PUBLIC

**Category Key:** public
**Type:** FEATURE
**CURRENT Path:** features/public
**Source Path:** apps/VCSM/src/features/public/
**Last Updated:** 2026-06-02
**Ticket:** TICKET-DRSTRANGE-BACKFILL-P0-0001
**Timestamp:** 2026-06-02T12:18:46

**Area:** Public
---

## Feature

The public feature is the unauthenticated VPORT discovery and lead-capture surface, comprising two full-MVC sub-modules: vportMenu (exposes menu, pricing, availability, and reviews to any visitor via slug-based routes and QR scan paths) and vportBusinessCard (exposes VPORT profile, contact details, services, and branding, and accepts lead submissions).

## Status

ACTIVE — VENOM pass complete; P1 patches applied; HIGH open findings remain
Security Tier: HIGH

## Governance Score

| Category | Score | Notes |
|---|---|---|
| Files Present | 60% | 9 of 10 required governance files found (TESTS.md, PERFORMANCE.md, BLOCKERS.md, DEFERRED.md missing) |
| Security | 25% | SECURITY.md exists but 13 open findings remain including 4 HIGH; BLACKWIDOW and SENTRY never run |
| Architecture | 70% | ARCHITECTURE.md exists with full sub-module inventory; known violations documented (relative imports, line limit breach, duplicate route conflict) |
| Ownership | 20% | OWNERSHIP.md exists but NOT_AUDITED — IRONMAN has not run; all ownership entries inferred; split ownership conflict unresolved |
| Testing | 0% | TESTS.md missing; 0 test files in source; SPIDER-MAN never run |
| Performance | 0% | PERFORMANCE.md missing; KRAVEN never run; double-read issue documented in ARCHITECTURE.md only |
| **DR. STRANGE Readiness** | **29%** | Average of above six categories |

## Documentation Coverage

| File | Exists | Summary |
|---|---|---|
| README.md | ✓ | Unauthenticated VPORT discovery and lead-capture surface; two sub-modules (vportMenu, vportBusinessCard); ACTIVE, Security Tier HIGH |
| CURRENT_STATUS.md | ✓ | Last updated 2026-06-02 under TICKET-PUBLIC-VENOM-001-PATCH; first VENOM pass complete (19 findings); P1 patches applied; 11 open findings remain; THOR BLOCKED |
| SECURITY.md | ✓ | 13 open findings, 3 resolved; highest open: PUBLIC-003, ELEK-2026-05-27-001, VF-001, AUTH-002; ELEK-007/008 resolved 2026-06-02 |
| ARCHITECTURE.md | ✓ | Two full-MVC sub-modules (vportMenu 41 files, vportBusinessCard); 5 DB views untracked; known violations documented; duplicate route conflict |
| OWNERSHIP.md | ✓ | NOT_AUDITED — IRONMAN has not run; all entries inferred; split ownership conflict on /actor/:actorId/menu |
| TESTS.md | ✗ | MISSING — 0 test files found in source scan; SPIDER-MAN never run |
| PERFORMANCE.md | ✗ | MISSING — KRAVEN has not run; double-read issue known from architecture evidence only |
| BLOCKERS.md | ✗ | MISSING — blockers inferred from CURRENT_STATUS.md and FEATURE_INDEX |
| DEFERRED.md | ✗ | MISSING — deferred items inferred from CURRENT_STATUS.md |
| HISTORY_INDEX.md | ✓ | Spans 2026-05-09 through 2026-06-02; 9 audit events documented; 7 open audit gaps listed |

## Command Coverage

| Command | Status | Evidence Source |
|---|---|---|
| ARCHITECT | NOT RUN | none found |
| VENOM | COMPLETE | CURRENT/features/public/SECURITY.md, CURRENT/features/public/CURRENT_STATUS.md |
| ELEKTRA | PARTIAL | CURRENT/features/public/SECURITY.md (ELEK-2026-05-27-001, ELEK-2026-05-27-004, ELEK-007, ELEK-008) |
| BLACKWIDOW | NOT RUN | none found |
| SENTRY | NOT RUN | none found |
| IRONMAN | NOT RUN | none found |
| SPIDER-MAN | NOT RUN | none found |
| KRAVEN | NOT RUN | none found |
| THOR | BLOCKED | CURRENT/features/public/CURRENT_STATUS.md |
| CARNAGE | PARTIAL | CURRENT/features/public/SECURITY.md (VL-001—005 migration plan authored, not executed) |
| DB | NOT RUN | none found |
| HAWKEYE | NOT RUN | none found |
| WATCHER | NOT RUN | none found |
| FALCON | N/A | none found |
| WINTER SOLDIER | NOT RUN | none found |
| LOGAN | NOT RUN | none found |
| WOLVERINE | COMPLETE | CURRENT/outputs/2026/06/02/wolverine/003_public_wolverine_public-venom-p1-patch.md |

## THOR Eligibility

**THOR_BLOCKED**

THOR is blocked for both vportMenu and vportBusinessCard sub-modules pending execution of the CARNAGE migration plan (VL-001—005) to resolve PUBLIC-003 (GRANT EXECUTE TO PUBLIC on submit_business_card_lead RPC), and pending DB-level RLS verification of DELETE policies for vport.menu_categories and vport.menu_items (PUBLIC-007).

## Security Status

SECURITY.md documents 13 open findings and 3 resolved. Highest open: PUBLIC-003 (GRANT EXECUTE TO PUBLIC on submit_business_card_lead RPC — CARNAGE migration pending), ELEK-2026-05-27-001 (wildcard CORS all 5 edge functions), VF-001 (raw UUID in /profile/:actorId public URL), AUTH-002 (ActorModel leaks profileId on public output). ELEK-007/008 (menu delete ownership gates) confirmed RESOLVED per source inspection 2026-06-02. BLACKWIDOW and SENTRY have never run on this feature.

## Architecture Status

ARCHITECTURE.md documents two full-MVC sub-modules: vportMenu (41 files, 7 layers) and vportBusinessCard (controllers, DAL, hooks, models, screen). Five DB views consumed are all untracked by CARNAGE migration history. Known violations include 4 files using relative imports instead of @/ aliases, useAuth() imported inside a component, style objects in model layer, and VportPublicMenuView.jsx at 301 lines (1 over limit). Critical duplicate: VportActorMenuPublicView in profiles feature owns /actor/:actorId/menu with divergent hook and raw UUID in back navigation. Double-read performance issue on vport.public_menu_read_model_v on every page mount.

## Ownership Status

OWNERSHIP.md status is NOT_AUDITED — IRONMAN has not run on features/public/. All ownership entries are inferred from canonical module docs and adjacent audits. Write surfaces in vportBusinessCard/controller/ and vportMenu/controller/ have no controller-layer ownership assertions confirmed. Split ownership conflict exists between features/public/ and profiles feature for the /actor/:actorId/menu route. Five DB views have untracked schema provenance per CARNAGE.

## Testing Status

MISSING — TESTS.md does not exist. FEATURE_INDEX confirms 0 test files found in source scan. SPIDER-MAN has never run on features/public/. CURRENT_STATUS flags SPIDER-MAN coverage as a known blocker: no regression tests for fromPublicRow() UUID exclusion or DAL ownership predicates on any public sub-module.

## Performance Status

MISSING — PERFORMANCE.md does not exist. KRAVEN has not run. Architecture doc (inferred from LOKI evidence) documents a double-read issue on vport.public_menu_read_model_v: both readVportPublicDetailsRpcDAL and readVportPublicMenuRpcDAL hit the same view on every public menu page mount with no TTL cache. resolveMenuSlugDAL adds a third hit. Double hook call on useVportPublicReviews results in 3 extra DB reads when Reviews tab is active.

## Open Blockers

- ELEK-2026-05-27-001 (HIGH) — Wildcard CORS on all 5 edge functions including public lead submit path. No patch applied.
- VL-001 through VL-005 (HIGH) — submit_business_card_lead RPC has GRANT EXECUTE TO PUBLIC, actor_id = NULL hardcoded, permissive INSERT policies, full-row UPDATE grant, missing source CHECK constraint. Migration plan authored, NOT EXECUTED.
- PUBLIC-003 (HIGH) — CARNAGE migration required before THOR gate can clear.
- PUBLIC-005 (HIGH, PARTIALLY MITIGATED) — /actor/:actorId/menu fallback still exposes raw actorId; separate ticket required to retire legacy route.
- PUBLIC-007 (MEDIUM) — DB-level RLS on vport.menu_categories and vport.menu_items DELETE policies not verified. CARNAGE required.
- ELEK-2026-05-27-004 (MEDIUM) — send-lead-confirmation accepts anon key as sufficient auth for SES delivery to arbitrary addresses.
- VENOM-CONTENT-005 (MEDIUM, DB-BLOCKED) — is_indexable filter inconsistency between DAL and public RLS policies.
- VENOM-DELETE-004 (MEDIUM) — Cache invalidation dead code never called on delete; stale content served up to 10 minutes post-deletion.
- SPIDER-MAN test coverage MISSING — no regression tests for fromPublicRow() UUID exclusion or DAL ownership predicates.
- Write-review CTA dead — VportPublicReviewsPanel CTA redirects to /login with no review submission screen wired post-auth.
- Duplicate VportActorMenuPublicView — /actor/:actorId/menu exposes raw UUID in back navigation, divergent hook data shape, console.log violations.

## Deferred Items

- Bookings {public} role cleanup — 4 UPDATE + 1 SELECT policies on vport.bookings use {public} role instead of {authenticated}. Separate CARNAGE migration required.
- VENOM-CONTENT-005 (DB-BLOCKED) — is_indexable inconsistency between DAL and public RLS policies. Awaiting DB-level resolution.
- Write-review CTA wiring — no review submission screen post-auth.
- Cache strategy for readVportPublicDetailsRpcDAL + readVportPublicMenuRpcDAL — deferred pending KRAVEN.
- Double hook refactor for useVportPublicReviews — OPEN, no ticket.
- Duplicate VportActorMenuPublicView consolidation — OPEN, no ticket.
- Import alias @/ migration (4 files in vportMenu/controller/ and hooks/) — OPEN, no ticket.

## Latest Ticket

TICKET-PUBLIC-VENOM-001-PATCH (2026-06-02)

## Recommended Next Ticket

TICKET-PUBLIC-SECURITY-001 — P0 sprint: (1) execute business_card_leads CARNAGE migration VL-001—005, (2) verify DELETE RLS on vport.menu_categories and vport.menu_items (PUBLIC-007), (3) run ELEKTRA scoped to edge functions and RPC write paths. These three actions are prerequisites before THOR gate can be attempted for either sub-module.

## Recommended Next Command

ELEKTRA — scoped to edge functions (send-lead-confirmation, submit_business_card_lead RPC post-migration, get_business_card_sections RPC). CARNAGE migration execution (VL-001—005) must run first or in parallel.

## DR. STRANGE Read Order

1. DR_STRANGE.md (this file)

*Files marked MISSING above do not yet exist — DR. STRANGE will flag them as governance gaps.*

---
*DR_STRANGE.md generated: 2026-06-02 | Ticket: TICKET-DRSTRANGE-BACKFILL-P0-0001 | Timestamp: 2026-06-02T05:00:00*
---

<!-- DRSTRANGE_COMMAND_MATRIX_START -->
## Command Coverage Matrix

Feature: public
Applicable Commands: 17
Coverage Score: 5.0 / 17
Coverage %: 29%
Last Refresh: 2026-06-02 (TICKET-DRSTRANGE-MATRIX-REFRESH-0001)

| Command | Status | Last Run | Evidence | Next Action |
|---|---|---|---|---|
| ARCHITECT | COMPLETE | 2026-06-02 | CURRENT/features/public/ARCHITECTURE.md | — |
| VENOM | COMPLETE | 2026-06-02 | CURRENT/features/public/SECURITY.md, CURRENT/features/public/CURRENT_STATUS.md | 1 HIGH open (ELEK-2026-06-02-001); execute CARNAGE VL-001–005 migration |
| ELEKTRA | COMPLETE | 2026-06-02 | CURRENT/features/public/evidence/2026-06-02_elektra_public-edge-functions-rpc.md | 1 HIGH open (ELEK-2026-06-02-001 SES abuse); 2 MEDIUM open; VL migration required |
| BLACKWIDOW | NOT RUN | NEVER | — | Schedule BLACKWIDOW adversarial pass — public lead-capture surface, HIGH priority |
| SENTRY | NOT RUN | NEVER | — | Run SENTRY on public write surfaces after CARNAGE migration executes |
| IRONMAN | PARTIAL | NEVER | CURRENT/features/public/OWNERSHIP.md (NOT_AUDITED — all entries inferred) | Run IRONMAN to confirm ownership; split ownership conflict on /actor/:actorId/menu unresolved |
| SPIDER-MAN | NOT RUN | NEVER | No TESTS.md — 0 test files in source | Run SPIDER-MAN; no regression coverage for fromPublicRow() UUID exclusion or DAL ownership predicates |
| KRAVEN | NOT RUN | NEVER | No PERFORMANCE.md — double-read issue documented in ARCHITECTURE.md only | Run KRAVEN; double-read on vport.public_menu_read_model_v and double hook call on reviews known |
| THOR | NOT RUN | NEVER | BLOCKED — ELEK-2026-06-02-001 HIGH open; CARNAGE VL-001–005 not executed | Execute CARNAGE migration; resolve ELEK-2026-06-02-001 before THOR gate |
| CARNAGE | PARTIAL | 2026-05-24 | VL-001–005 migration plan authored; NOT EXECUTED — CURRENT/features/public/HISTORY_INDEX.md | Execute migration: submit_business_card_lead RPC, PUBLIC-003 GRANT EXECUTE TO PUBLIC |
| DB | NOT RUN | NEVER | — | Run DB review; verify RLS on vport.menu_categories DELETE policies (PUBLIC-007) |
| HAWKEYE | NOT RUN | NEVER | — | Run HAWKEYE on public RPC contracts and edge function API surface |
| WATCHER | NOT RUN | NEVER | — | Run WATCHER to capture provenance of P1 patch changes |
| FALCON | NOT RUN | NEVER | — | Run FALCON parity check for public menu and business card on iOS |
| WINTER SOLDIER | N/A | — | No Android app | — |
| LOGAN | PARTIAL | NEVER | README.md present; no LOGAN command run on feature | Run LOGAN to sync documentation |
| WOLVERINE | COMPLETE | 2026-06-02 | CURRENT/features/public/evidence/003_public_wolverine_public-venom-p1-patch.md | P1 patches applied; PUBLIC-001/002/005 resolved |
| DR. STRANGE | PARTIAL | 2026-06-02 | This matrix refresh run | Matrix updated; full re-run pending |

## Command Coverage Summary

| Metric | Value |
|---|---|
| Applicable Commands | 17 |
| Complete | 4 |
| Partial | 4 |
| Not Run | 8 |
| Blocked | 1 |
| Coverage % | 29% |

## THOR Eligibility

- THOR Status: THOR_BLOCKED
- Blocking Reasons: ELEK-2026-06-02-001 HIGH open (SES anon key abuse — release blocker); CARNAGE VL-001–005 migration not executed (PUBLIC-003); ELEK-2026-06-02-002 and -003 MEDIUM open; DB-level RLS on vport.menu_categories DELETE unverified (PUBLIC-007)
- Caution Items: BLACKWIDOW never run on public unauthenticated surface; SPIDER-MAN zero coverage; SENTRY not run; VF-001 raw UUID in /actor/:actorId/menu back nav; duplicate VportActorMenuPublicView not consolidated
- Required Before THOR: Execute CARNAGE migration VL-001–005; resolve ELEK-2026-06-02-001 (SES gate or move to PostgreSQL trigger); verify PUBLIC-007 DB RLS; run BLACKWIDOW
- Coverage %: 29%
- Last DR. STRANGE Refresh: 2026-06-02T00:00:00
- Category Key: public
<!-- DRSTRANGE_COMMAND_MATRIX_END -->
