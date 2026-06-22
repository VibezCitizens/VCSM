# VPORT Dashboard — Governance Matrix

**Last updated:** 2026-06-01 (ARCHITECT pass: barber + locksmith + barbershop ARCHITECT COMPLETE. ELEK-051 restaurant menu delete DAL fixed (dead actor_id filter). DEFER-007 barber resource_type=staff filter applied. ELEK-060/061/062 availability closed (RLS confirmed). V-SUB-004/005 verified resolved. V-SUB-008 escalated HIGH (dead get_follower_count RPC). TICKET-SEC-VERIFY-001 closed.)  
**Maintained by:** WOLVERINE + ARCHITECT  
**Source of truth for:** Audit coverage status across all VPORT dashboard modules

---

## Status Legend

| Status | Meaning |
|---|---|
| `NOT_STARTED` | Command has never run on this module |
| `PARTIAL` | Command ran but coverage is incomplete |
| `IN_PROGRESS` | Command is currently running |
| `VERIFIED` | Command ran, all findings resolved |
| `COMPLETE` | Final verified state — no further action needed |
| `BLOCKED` | Command found critical unresolved finding |
| `DEFERRED` | Explicitly deferred to a named sprint |

---

## Governance Matrix

> Sort columns: Module → Route → VPORT Type → Priority
> Add new rows at the bottom of the relevant priority group.

| Module | Route | VPORT Type | Active | Release Flag | Public/Owner | Mobile | Desktop | VENOM | ELEKTRA | BLACKWIDOW | ARCHITECT | KRAVEN | SENTRY | SPIDER-MAN | LOGAN | THOR | Priority | Risk | Last Commit | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **dashboard** | `/vport/dashboard` | ALL | YES | RELEASED | OWNER | YES | YES | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | P0 | LOW | 2026-05-11 | Core dashboard shell |
| **dashboard-cards** | `/vport/dashboard` | ALL | YES | RELEASED | OWNER | YES | YES | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | P0 | LOW | 2026-05-23 | All card variants |
| **leads** | `/vport/dashboard/leads` | ALL | YES | RELEASED | OWNER | YES | YES | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | P0 | LOW | 2026-05-24 | Lead pipeline + arch refactor |
| **exchange** | `/vport/dashboard/exchange` | EXCHANGE | YES | RELEASED | OWNER | YES | YES | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | P0 | LOW | 2026-05-28 | Exchange rate dashboard. ELEKTRA 2nd pass 2026-05-28: ELEK-2026-05-28-045 LOW (no upper-bound rate cap in assertValidRate). All ownership gates CLEAN. |
| **gas** | `/vport/dashboard/gas` | GAS | YES | RELEASED | BOTH | YES | YES | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | P0 | LOW | 2026-05-28 | THOR cleared. ELEKTRA COMPLETE: ELEK-001–009 code + DB all resolved (FK + uq_fuel_price_submissions_pending confirmed live). S2 structural deferred (DEFER-004). |
| **menu** | `/vport/dashboard/menu` + QR | RESTAURANT | YES | RELEASED | BOTH | YES | YES | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | P0 | LOW | 2026-05-27 | Restaurant menu QR module |
| **services** | `/vport/dashboard/services` | ALL | YES | RELEASED | OWNER | YES | YES | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | P0 | LOW | 2026-05-23 | Service catalog card |
| **booking** | `/booking` (engine) | ALL | YES | RELEASED | BOTH | YES | YES | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | P0 | LOW | 2026-05-27 | THOR cleared (CAUTION). DEFER-001 confirmed resolved via live DB. DB policies mitigate ELEK-002/003 on public path. ELEK-001 resolved (dalGetActorById + is_void check in cancelBooking). |
| **reviews** | `/vport/reviews` + QR | ALL | YES | RELEASED | BOTH | YES | YES | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | P0 | MEDIUM | 2026-05-27 | THOR cleared (CAUTION). DEFER-002 (service_id FK) — CARNAGE sprint P2. V-03 DAL author guard follow-up. |
| **subscribers** | `/vport/subscribers` | ALL | YES | RELEASED | BOTH | YES | YES | BLOCKED | NOT_STARTED | BLOCKED | COMPLETE | NOT_STARTED | COMPLETE | VERIFIED | COMPLETE | WATCH | P0 | MEDIUM | 2026-05-29 | V-SUB-001/002/003/004/005 fixed. V-SUB-006 RESOLVED 2026-05-29 (VALID_REQUEST_STATUSES enum guard in dalUpdateRequestStatus). V-SUB-007 RESOLVED 2026-05-29 (console.error DEV-only; actor IDs removed from log). V-SUB-008 DEFERRED (dual subscriber count DAL consolidation — DB RPC confirmation required). BW-SUB-004 RESOLVED 2026-05-29 via Settings ELEK-002 fix (ctrlSetActorPrivacy now requires callerActorId). BW-SUB-003 OPEN (VPORT kind follow bypass — rule definition required). THOR: BLOCKED on BW-SUB-003 + VENOM V-SUB-008. |
| **availability** | `/vport/availability` | ALL | YES | RELEASED | OWNER | YES | YES | VERIFIED | COMPLETE | VERIFIED | COMPLETE | NOT_STARTED | VERIFIED | NOT_STARTED | COMPLETE | NOT_STARTED | P1 | LOW | 2026-06-01 | ELEK-060/061/062/063 all CLOSED 2026-06-01 (DB confirmed comprehensive RLS on both tables: INSERT/UPDATE/DELETE all gated via actor_can_manage_profile + actor_owners). ELEK-063 fixed (named import). KRAVEN pending. |
| **barber** | `/vport/barber` | BARBER | YES | RELEASED | BOTH | YES | YES | VERIFIED | COMPLETE | VERIFIED | COMPLETE | COMPLETE | VERIFIED | NOT_STARTED | PARTIAL | WATCH | P1 | LOW | 2026-06-01 | KRAVEN COMPLETE 2026-06-01 (K-BLK-003 LOW — join flow is clean, one-shot, no N+1). SPIDER-MAN pending. |
| **barbershop** | `/vport/barbershop` | BARBERSHOP | YES | RELEASED | BOTH | YES | YES | VERIFIED | COMPLETE | VERIFIED | COMPLETE | COMPLETE | VERIFIED | NOT_STARTED | PARTIAL | WATCH | P1 | MEDIUM | 2026-06-01 | KRAVEN COMPLETE 2026-06-01 (K-BLK-002 NOT_A_RISK — team view N+1 disproved: hydrateActorsByIds batches all summaries; useActorSummary per card is Zustand selector — zero network calls). SPIDER-MAN pending. |
| **locksmith** | `/vport/locksmith` | LOCKSMITH | YES | RELEASED | BOTH | YES | YES | VERIFIED | COMPLETE | VERIFIED | COMPLETE | COMPLETE | VERIFIED | NOT_STARTED | PARTIAL | WATCH | P1 | LOW | 2026-06-01 | KRAVEN COMPLETE 2026-06-01 (K-BLK-001 MEDIUM — 3 parallel uncached DB reads per profile mount; TTL cache recommended — Cache Optimization Sprint. NOT release-blocking). SPIDER-MAN pending. |
| **restaurant** | `/vport/restaurant` | RESTAURANT | YES | RELEASED | BOTH | YES | YES | VERIFIED | COMPLETE | VERIFIED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | PARTIAL | NOT_STARTED | P1 | LOW | 2026-06-01 | ELEK-050/051/052/053 all RESOLVED 2026-06-01: DB confirmed no actor_id column on menu_categories/menu_items; dead `.eq("actor_id",actorId)` filter removed from both delete DALs (was causing column-not-found error on every delete). Controller ownership gate confirmed. RLS DELETE policies confirmed (actor_can_manage_profile). ARCHITECT + KRAVEN + SENTRY + SPIDER-MAN pending. |
| **portfolio** | `/vport/portfolio` | ALL | YES | RELEASED | BOTH | YES | YES | COMPLETE | COMPLETE | VERIFIED | COMPLETE | COMPLETE | COMPLETE | COMPLETE | COMPLETE | CLEAR | P1 | LOW | 2026-06-04 | TICKET-DASH-PORTFOLIO-COMPLETE-001: RULE9-DASH-PORTFOLIO-001, PORTFOLIO-ARCH-001/002, PORTFOLIO-ADAPTER-001, and DEFER-010/011 resolved. Submit/upload hooks moved to card-level hooks, trace diagnostics use portfolioTrace.adapter, media backfill is profile-scoped, BEHAVIOR APPROVED, 8 focused SPIDER-MAN tests pass. |
| **exchange-profile** | `/vport/exchange` | EXCHANGE | YES | RELEASED | BOTH | YES | YES | PARTIAL | COMPLETE | VERIFIED | PARTIAL | PARTIAL | VERIFIED | PARTIAL | PARTIAL | NOT_STARTED | P1 | LOW | 2026-05-29 | ELEK-045 RESOLVED 2026-05-29 (MAX_EXCHANGE_RATE = 1_000_000 cap added to assertValidRate). All ownership gates clean. BW: public profile conditional pass. No CRITICAL/HIGH. |
| **tripoint** | `External domain API` | LOCKSMITH | YES | RELEASED | PUBLIC | N/A | YES | VERIFIED | DEFERRED | BLOCKED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | PARTIAL | NOT_STARTED | P1 | HIGH | 2026-05-28 | 0C/7H/4M/3L — spec-only (no Edge Function built). BW 2026-05-27: 5 BYPASSED. ELEKTRA 2026-05-28: DEFERRED — no source code to scan; pre-implementation risk register recorded. DEADPOOL + Wolverine + DB + Carnage required. ELEKTRA re-runs once implementation committed. |
| **team** | `/vport/dashboard/team` | ALL (BARBERSHOP) | YES | RELEASED | OWNER | YES | YES | VERIFIED | VERIFIED | VERIFIED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | P1 | MEDIUM | 2026-05-29 | VENOM-TEAM-005 RESOLVED 2026-05-29 (findEligibleBarberActorIdsDAL: owner_user_id removed; canonical actor_owners path). Cross-feature DAL import RESOLVED 2026-05-29 (vportOwnerStats.controller.js inlines vport.resources query; no longer imports from team DAL). VENOM-TEAM-004 DEFERRED (hard DELETE — CARNAGE). VENOM-TEAM-007 DEFERRED (DEADPOOL). VENOM-TEAM-008 (SPIDER-MAN). |
| **settings** | `/vport/dashboard/settings` | ALL | YES | RELEASED | OWNER | YES | YES | VERIFIED | COMPLETE | VERIFIED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | P1 | MEDIUM | 2026-05-29 | ELEK-001 RESOLVED 2026-05-29 (ctrlSetVportBusinessCardPublishState: callerActorId + vportActorId threaded from hook items; assertActorOwnsVportActorController added). ELEK-002 RESOLVED 2026-05-29 (ctrlSetActorPrivacy: callerActorId + self/VPORT ownership check; chain updated through useUpdateVportVisibility + useActorPrivacy). ELEK-003/004/005 verified already resolved in code (findings.md was stale). CARNAGE (VENOM-SETTINGS-002 — profile_public_details RLS) still pending. |
| **content-pages** | `/vport/content` | ALL | YES | RELEASED | BOTH | YES | YES | BLOCKED | PARTIAL | BLOCKED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | PARTIAL | NOT_STARTED | P2 | MEDIUM | 2026-05-29 | ELEK-001 verified already resolved (ALLOWED_UPDATE_FIELDS allowlist present in code). ELEK-003 verified already resolved (both toggle + update DALs have .eq("actor_id")). ELEK-002 RESOLVED 2026-05-29 (actor_id/profile_id stripped from owner SELECT in update, toggle, list, read DALs; profile_id removed from read; actor_id kept in read for controller ownership check only). VENOM CONTENT-001/004/007/008 + CARNAGE migration still required. BLACKWIDOW re-run needed after CARNAGE. |
| **tab-classification** | `/vport/[kind]` | ALL | YES | RELEASED | OWNER | YES | YES | PARTIAL | PARTIAL | VERIFIED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | PARTIAL | NOT_STARTED | P2 | MEDIUM | 2026-06-01 | ELEK-010/011 RESOLVED 2026-05-28. BW-TAB-001/002 MITIGATED. ELEK-012 LOW OPEN (LOGAN deprecation). VENOM TABS-001 (DEADPOOL — cache invalidation + useProfileView lifecycle) + TABS-002 (LOGAN — deprecate profile?.category) still open HIGH findings — VENOM corrected to PARTIAL 2026-06-01. |
| **delete-lifecycle** | `N/A (system flow)` | ALL | YES | RELEASED | OWNER | N/A | N/A | BLOCKED | COMPLETE | BLOCKED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | PARTIAL | NOT_STARTED | P2 | HIGH | 2026-05-29 | ELEK-007/008/009 RESOLVED 2026-05-28. ELEK-010 RESOLVED 2026-05-29 (deleteVportContentPageDAL: actorId param added + .eq("actor_id") in WHERE; eliminates TOCTOU window). ELEK-011 DEFERRED (menu DAL session bind — DB RLS confirmation required). VENOM DELETE-001/002/003 + CARNAGE P1 + BW-DELETE-001/003 still required. |
| **external-site** | `Edge Function API` | ALL | YES | RELEASED | PUBLIC | N/A | N/A | VERIFIED | PARTIAL | BLOCKED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | PARTIAL | NOT_STARTED | P2 | HIGH | 2026-05-29 | ELEK-004 RESOLVED 2026-05-29 (all 5 functions restricted: delete-citizen-account hardcoded vibezcitizens.com; send-citizen-invite + send-push-notification + send-lead-confirmation + reverse-geocode via ALLOWED_ORIGINS env). ELEK-005 DEFERRED (listUsers O(n) — vc.check_email_registered RPC required from CARNAGE). ELEK-006 RESOLVED 2026-05-29 (raw insertError.message removed from response). ELEK-007 RESOLVED 2026-05-29 (NOMINATIM_USER_AGENT from env; x-forwarded-for private IP guard added). ELEK-008 DEFERRED (anon key email auth — infrastructure API key required). ELEK-009 RESOLVED 2026-05-29 (push stub: method guard + Bearer token auth added). THOR BLOCKED on ELEK-004+005+008. |
| **schedule** | `/vport/dashboard/schedule` | ALL | YES | RELEASED | OWNER | YES | YES | VERIFIED | COMPLETE | VERIFIED | VERIFIED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | P2 | MEDIUM | 2026-05-29 | VENOM-SCHED-003 RESOLVED 2026-05-29 (controller export removed from schedule/index.js). ELEK-065 MEDIUM (modal actor-switch) + ELEK-066 MEDIUM (no screen gate) + ELEK-067 LOW (status transitions → TICKET-BOOKING-RPC-001): SENTRY + architecture sprint required. |
| **calendar** | `/vport/dashboard/calendar` | ALL | YES | RELEASED | OWNER | YES | YES | VERIFIED | COMPLETE | VERIFIED | NOT_STARTED | NOT_STARTED | VERIFIED | NOT_STARTED | NOT_STARTED | NOT_STARTED | P2 | LOW | 2026-05-29 | ELEK-068 RESOLVED 2026-05-29 (identity?.vportType replaced with targetActorEntry?.vportType resolved from availableActors by params actorId; stable across actor switches). ELEK-069 MEDIUM (no screen split) — SENTRY architecture sprint required. |

---

## Audit Coverage Summary

| Status | Count | Notes |
|---|---|---|
| COMPLETE (all 9 commands, triad done) | 9 modules | Unchanged |
| WATCH (ELEKTRA complete, remaining commands pending) | 3 modules | locksmith, barber, barbershop — THOR gates cleared 2026-05-29 |
| VERIFIED (VENOM done, full triad pending) | 6 modules | Unchanged |
| PARTIAL (triad partial) | 4 modules | content-pages, restaurant, portfolio, external-site |
| BLOCKED (unresolved BLACKWIDOW or VENOM findings) | 4 modules (subscribers, delete-lifecycle, tripoint, external-site) | locksmith + barber removed from BLOCKED 2026-05-29 |
| NOT_STARTED (zero VENOM coverage) | 0 modules | |
| **Total modules tracked** | **26** | |

---

## Modules with BLOCKED Findings

| Module | Blocked By | Finding IDs | CI Status | Date Blocked |
|---|---|---|---|---|
| **subscribers** | BLACKWIDOW (BW-SUB-003 CONFIRMED HIGH BYPASS) | BW-SUB-003: VPORT actor-kind follow bypass (no controller kind guard) — rule definition required. BW-SUB-004 RESOLVED 2026-05-29 (ctrlSetActorPrivacy now gates callerActorId). V-SUB-001–007 resolved. V-SUB-008 deferred. | THOR BLOCKED — BW-SUB-003 unresolved | 2026-05-29 |
| **content-pages** | VENOM (3H open) + BLACKWIDOW (3 HIGH confirmed BYPASSED) | BW-CONTENT-001 (open DAL patch — BYPASSED), BW-CONTENT-002 (actor_id in public read — BYPASSED), BW-CONTENT-004 (stale RLS OR-merge — BYPASSED). CARNAGE migration required for CONTENT-004. ELEKTRA patches pending. | N/A — 3 HIGH confirmed exploitable via adversarial simulation | 2026-05-27 |
| **delete-lifecycle** | VENOM (3H open) + BLACKWIDOW (2 HIGH confirmed BYPASSED/PARTIAL) | BW-DELETE-001 (deprecated DAL still exported — BYPASSED/HIGH), BW-DELETE-003 (cascade gap — PARTIAL/HIGH), BW-DELETE-002 (UI-only name-match — BYPASSED/MEDIUM). Carnage P1 sprint required. | N/A — deprecated DAL confirmed callable; cascade gap confirmed | 2026-05-27 |
| **external-site** | BLACKWIDOW — BW-EXTSITE-001 (CORS wildcard, HIGH BYPASSED), BW-EXTSITE-003 (SES email abuse, HIGH BYPASSED), BW-EXTSITE-004 (listUsers enumeration, HIGH PARTIAL) | BW-EXTSITE-001/002/003/004/006. THOR recommended BLOCKED. ELEKTRA + Carnage + DB pending. | THOR recommended BLOCKED — 3 HIGH BYPASSED | 2026-05-27 |
| **tripoint** | BLACKWIDOW — BW-TRIPOINT-001 (anon key, HIGH BYPASSED), BW-TRIPOINT-002 (actorId in URL, HIGH BYPASSED), BW-TRIPOINT-004 (reviews PII, MEDIUM BYPASSED), BW-TRIPOINT-005 (GPS+IP, MEDIUM BYPASSED) | BW-TRIPOINT-001/002/003/004/005. DEADPOOL + Wolverine + DB + Carnage required before integration expansion. | THOR recommended BLOCKED — 2 HIGH BYPASSED + 2 MEDIUM BYPASSED | 2026-05-27 |
| **locksmith** | — | All ELEKTRA findings resolved 2026-05-29. THOR gate cleared. | WATCH — ARCHITECT + KRAVEN + SENTRY + SPIDER-MAN pending | 2026-05-29 |
| **barber** | — | ELEK-024/025/026/028 resolved 2026-05-29. ELEK-027 deferred (DB). THOR gate cleared. | WATCH — ELEK-027 deferred; remaining commands pending | 2026-05-29 |

---

## Adding a New Module

When a new VPORT dashboard module or card is created:

1. Add a row to this table with all command columns set to `NOT_STARTED`
2. Create a folder under `modules/[module-name]/`
3. Copy the template files (README, audit-status, findings, performance, security, ownership, release-status)
4. Add the module to `vport-dashboard-card-registry.md`
5. If the module touches auth, ownership, or external data — add to `pending-full-audits.md` immediately
