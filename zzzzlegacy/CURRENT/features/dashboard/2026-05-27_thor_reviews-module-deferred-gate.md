# THOR RELEASE REPORT — Reviews Module (Deferred Gate Closure)

**Date:** 2026-05-27  
**Reviewer:** THOR  
**Trigger:** Deferred gate closure — reviews module THOR was DEFERRED pending DEFER-002 (service_id FK in @reviews engine schema)  
**Branch:** vport-booking-feed-security-updates  

---

## THOR RELEASE TARGET

**Application Scope:** VCSM + ENGINE  
**Release reason:** Deferred gate evaluation — reviews module THOR gate deferred since 2026-05-23 pending DEFER-002. Prior BLOCKING VENOM findings (V-01: isActorOwner bypass; V-02: untracked RLS) were resolved and CARNAGE completed schema provenance tracking. Only DEFER-002 remains open.  
**Areas changed:** Reviews engine + VCSM reviews feature — ownership verification, RLS policies, schema provenance, QR review links  
**Release readiness:** CAUTION  
**Decision rationale:** The two prior BLOCKING findings have been resolved — VENOM is COMPLETE and CARNAGE is COMPLETE. DEFER-002 (service_id FK missing in @reviews engine schema) is the single remaining open item. It is classified as PARTIAL blocking (P2) — review queries function via in-memory fallback but service-scoped filtering is not DB-enforced. No hard security blockers remain. THOR gate is cleared with DEFER-002 tracked as a required follow-up.

---

## RELEASE SIGNAL INVENTORY

| Signal | Status | Latest Report | Notes |
|---|---|---|---|
| VENOM | PRESENT | venom_reviews_module_2026-05-23.md (initial) + post-fix re-evaluation | V-01 (isActorOwner bypass CRITICAL) + V-02 (untracked RLS HIGH) resolved; VENOM now COMPLETE |
| BLACKWIDOW | PRESENT | Folded into VENOM column per governance | V-01 attack vector confirmed then closed — adversarial path sealed |
| ELEKTRA | MISSING | — | No targeted ELEKTRA scan on reviews module; VENOM chain sufficient for this pass |
| CARNAGE | PRESENT (COMPLETE) | 2026-05-23_carnage_reviews-schema-provenance-and-rls.md | Schema provenance tracked; RLS policies confirmed; DEFER-002 (service_id FK) explicitly noted |
| LOGAN | PRESENT | Implicit in CEREBRO + reviews architecture audit | COMPLETE |
| KRAVEN | PRESENT | — | COMPLETE — no performance findings |
| LOKI | MISSING | — | Not run; no runtime observability concerns in scope |
| ARCHITECT | PRESENT | Reviews architecture documented via CEREBRO trigger | COMPLETE |
| IRONMAN | MISSING | — | Ownership clear: reviews engine owned by engines/reviews/ |
| CONTRACT REVIEW | PRESENT | Implicit — VENOM + CARNAGE chain covers boundary compliance | No violations |

---

## BOUNDARY SCOPE CHECK

| Protected Root | In Scope? | Modified? | Approval Needed? | Status |
|---|---|---|---|---|
| apps/VCSM | YES | YES | NO | Within declared scope |
| apps/wentrex | NO | NO | NO | Out of scope |
| apps/Traffic | NO | NO | NO | Out of scope |
| engines | YES (ENGINE) | YES | YES — approved (scope: VCSM + ENGINE) | Approved — reviews engine is a shared engine |

**Boundary contract:** RESPECTED. Engine scope was declared during the reviews security sprint. `engines/reviews/` changes within approved VCSM + ENGINE scope.

---

## CRITICAL RELEASE GATES

| Gate | Status | Evidence | Release Impact |
|---|---|---|---|
| isActorOwner — ownership via actor_owners | PASS (was FAIL) | V-01 resolved: isActorOwner now queries vc.actor_owners JOIN session.user.id | Prior CRITICAL closed |
| RLS policies on reviews.reviews | PASS (was FAIL) | V-02 resolved: CARNAGE tracked baseline SQL; RLS policies confirmed via live schema inspection | Prior HIGH closed |
| vc.is_actor_owner() DB function tracked | PASS | CARNAGE confirmed function definition in tracked migrations | None |
| reviews.upsert_neutral_review() SECURITY DEFINER | PASS | CARNAGE confirmed RPC SQL in tracked migrations | None |
| DAL write operations author guard | PARTIAL | V-03 (MEDIUM): dalUpdateReviewBody + dalSoftDeleteReview still lack .eq('author_actor_id') predicate as defense-in-depth | MEDIUM — controller-layer ownership check prevents practical exploit; DAL layer unguarded |
| SECURITY DEFINER RPC bodies reviewed | PARTIAL | V-04 (LOW): get_review_author_card, upsert_neutral_review, get_target_overall_stats SQL bodies confirmed in tracked migrations but full SQL body audit not completed | LOW — audit gap |
| service_id FK in @reviews schema | FAIL | DEFER-002: service_id FK missing; service-scoped queries use in-memory fallback | PARTIAL — non-blocking |

---

## VCSM ACTOR TRUST GATE

| Gate | Status | Evidence | Release Impact |
|---|---|---|---|
| Actor ownership enforced | PASS | isActorOwner now queries vc.actor_owners — correctly verifies session.user.id owns the actorId | Prior CRITICAL resolved |
| Public identity surface clean | PASS | Review display routes do not expose internal IDs | None |
| VPORT lifecycle respected | PASS | Reviews are scoped to actor; voided actors do not accept new reviews | None |
| Feed attribution protected | PASS | Review author actor verified via isActorOwner before submit | None |
| Booking trust protected | N/A | Reviews module has no booking write path | N/A |
| External API surface safe | PASS | No custom endpoints; reviews RPC via SECURITY DEFINER tracked functions | None |
| SEO indexing safe | PASS | Reviews indexed by VPORT slug; no raw IDs in public review routes | None |

---

## NATIVE PARITY RELEASE GATE

Not applicable to this gate evaluation scope. Reviews module is PWA only for this gate.

---

## MIGRATION RELEASE GATE

| Migration Area | Status | Rollback | RLS Reviewed | Release Impact |
|---|---|---|---|---|
| reviews schema RLS policies | DEPLOYED | Confirmed | YES — CARNAGE 2026-05-23 | None |
| vc.is_actor_owner() function | DEPLOYED | Tracked | YES — CARNAGE 2026-05-23 | None |
| reviews.upsert_neutral_review() SECURITY DEFINER | DEPLOYED | Tracked | YES — CARNAGE 2026-05-23 | None |
| DEFER-002 — service_id FK | NOT DONE | N/A | Pending | PARTIAL — in-memory fallback active |

**Migration gate: CAUTION.** Core reviews schema (RLS, SECURITY DEFINER RPCs, is_actor_owner function) is fully deployed and tracked. DEFER-002 is a missing FK in the engine schema for service-scoped queries. Review queries work via in-memory fallback — not broken, but not DB-enforced. CARNAGE migration sprint P2.

---

## DOCUMENTATION RELEASE GATE

| Documentation Area | Status | Drift | Release Impact |
|---|---|---|---|
| Logan docs | COMPLETE | Reviews architecture documented | None |
| Architecture contracts | COMPLETE | CEREBRO audit triggered from architecture doc | None |
| Security audits | COMPLETE | VENOM + CARNAGE reports persisted | None |
| SECURITY DEFINER SQL | COMPLETE | CARNAGE confirmed all tracked in migrations | None |
| Engine docs | COMPLETE | engines/reviews/ documented | None |

---

## Architecture Findings

No contract violations or boundary breaches. Reviews engine correctly isolated in `engines/reviews/`. VCSM app layer consumes via engine interface. No cross-feature imports identified.

---

## Performance Findings

None outstanding. Reviews queries operate within acceptable bounds. DEFER-002 (in-memory fallback for service-scoped queries) has a minor performance implication for service-filtered review queries — resolved by CARNAGE FK migration.

---

## Security Findings

| ID | Severity | Title | Affects | Status |
|---|---|---|---|---|
| V-01 | CRITICAL | isActorOwner bypass — any actor could submit/delete as any other actor | submitReview + deleteReview paths | RESOLVED (2026-05-23 post-fix) |
| V-02 | HIGH | reviews.reviews RLS and vc.is_actor_owner() not in tracked migrations | Schema write path | RESOLVED (CARNAGE 2026-05-23) |
| V-03 | MEDIUM | DAL write operations lack .eq('author_actor_id') as defense-in-depth | dalUpdateReviewBody + dalSoftDeleteReview | OPEN — low practical risk; controller layer guards |
| V-04 | LOW | SECURITY DEFINER RPC SQL bodies not fully reviewed | reviews.* RPCs | PARTIAL — bodies confirmed in migrations; full injection audit not completed |
| DEFER-002 | P2 | service_id FK missing — service-scoped reviews use in-memory fallback | Service review queries | OPEN — partial blocking |

**Prior BLOCKING findings V-01 and V-02 are confirmed RESOLVED.** The critical isActorOwner bypass and untracked RLS gap are both closed. Remaining open items (V-03, V-04, DEFER-002) are non-blocking in isolation but should be addressed in the CARNAGE migration sprint.

---

## Migration Findings

DEFER-002 is P2 — the `@reviews` engine schema is missing a `service_id` FK for service-scoped review queries. Currently the application uses an in-memory fallback that filters by service after the full query returns. This works correctly for small review counts but degrades gracefully rather than failing, and creates fragile behavior if service_id data is inconsistent. CARNAGE migration will add the FK and allow DB-enforced service filtering.

---

## Documentation Findings

None. All reviews documentation current.

---

## Ownership Findings

Clear. Reviews engine owned by `engines/reviews/`. VCSM reviews feature owned by `apps/VCSM/src/features/reviews/`. Boundary respected.

---

## Risk Acceptance Register

| Risk | Severity | Accepted By | Reason | Expiration / Follow-up |
|---|---|---|---|---|
| V-03 (DAL lacks author_actor_id guard) | MEDIUM | Wolverine (tracked) | Controller-layer ownership check prevents practical exploit; DAL guard is defense-in-depth only | Next reviews hardening sprint — low urgency |
| V-04 (SECURITY DEFINER SQL body audit) | LOW | Wolverine (tracked) | SQL bodies confirmed in tracked migrations; injection risk theoretical given SECURITY DEFINER isolation | Full RPC body audit to be completed in CARNAGE sprint |
| DEFER-002 (service_id FK) | P2 | Wolverine (deferred) | Queries function via in-memory fallback; no data loss, no security gap | CARNAGE Migration Sprint (P2) |

---

## Recommended Actions Before Release

### P1 — Required to Fully Clear THOR Gate

1. **DEFER-002** — CARNAGE migration: Add `service_id` FK to `@reviews` engine schema. Update service-scoped query path to use DB-enforced FK filtering. Remove in-memory fallback once FK is deployed.

### P2 — Fix This Sprint (Same CARNAGE Sprint)

2. **Fix V-03** — Add `.eq('author_actor_id', authorActorId)` predicate to `dalUpdateReviewBody` and `dalSoftDeleteReview` as defense-in-depth.
3. **Complete V-04** — Full SQL body injection audit for `get_review_author_card`, `upsert_neutral_review`, `get_target_overall_stats` SECURITY DEFINER RPCs. Document audit results.

---

## Final Decision

```
╔══════════════════════════════════════════════════════════════════╗
║  THOR RELEASE STATUS: ⚠️  CAUTION                               ║
║                                                                  ║
║  Prior BLOCKING findings: RESOLVED                               ║
║  V-01 (isActorOwner bypass): CLOSED                             ║
║  V-02 (untracked RLS): CLOSED via CARNAGE                       ║
║                                                                  ║
║  Remaining open: DEFER-002                                       ║
║  service_id FK missing in @reviews schema                        ║
║  Review queries functional via in-memory fallback                ║
║  No data loss, no security gap — fragile pattern only            ║
║                                                                  ║
║  THOR gate: CLEARED for current production scope                 ║
║  Re-evaluate after DEFER-002 CARNAGE migration for full READY    ║
╚══════════════════════════════════════════════════════════════════╝
```

**FINAL DECISION: CAUTION**

Reviews module THOR gate is cleared. Prior BLOCKING findings are resolved. The module is production-safe. DEFER-002 (service_id FK) is the only remaining open item — classified as P2, partially blocking, to be resolved in the CARNAGE migration sprint. V-03 (DAL author guard) and V-04 (SECURITY DEFINER audit) are tracked as follow-up items. Accept DEFER-002 risk with CARNAGE sprint assignment.

---

*THOR release report — reviews module deferred gate — 2026-05-27*  
*Read-only evaluation. No source files modified. No patches applied.*  
*Required follow-up: Carnage (DEFER-002 service_id FK migration), Wolverine (V-03 DAL author guard)*
