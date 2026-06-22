# Security Posture — hydration

Last Updated: 2026-06-04
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-HYDRATION-003, VEN-HYDRATION-007, BW-HYDR-003, BW-HYDR-004

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

2 HIGH, 2 MEDIUM, 2 LOW — 6 total findings

- VEN-HYDRATION-001 (MEDIUM) — Engine RPC vc.get_actor_summaries called with no app-layer auth gate; RLS policy ASSUMED
- VEN-HYDRATION-002 (MEDIUM) — Inline direct DB query in vcsmActorHydrator.js bypasses DAL layer abstraction
- VEN-HYDRATION-003 (HIGH) — PII fields (email, birthdate, age, sex, is_adult, last_seen) fetched and mapped into identity hydration object — THOR BLOCKER
- VEN-HYDRATION-004 (MEDIUM) — ownerActorId exposed in public useIdentity() surface via toPublicIdentity()
- VEN-HYDRATION-005 (LOW) — DEV debug logging emits full userId and allActorIds array via window custom events
- VEN-HYDRATION-006 (LOW) — Actor store has no lifecycle eviction path for deleted/blocked/deactivated actors (5-min stale window)
- VEN-HYDRATION-007 (HIGH) — BEHAVIOR.md is a non-functional PLACEHOLDER with no §5 Security Rules or §9 Must Never Happen invariants — THOR BLOCKER

Output: ZZnotforproduction/APPS/VCSM/features/hydration/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_hydration-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

0 CRITICAL, 3 HIGH (new), 2 MEDIUM, 2 LOW, 1 INFO — 8 total findings

Note: BW-HYDR-002 and BW-HYDR-006 cross-reference existing VENOM findings VEN-HYDRATION-003 and VEN-HYDRATION-007 (confirmed open). BW-HYDR-003 and BW-HYDR-004 are NEW findings with THOR gate recommendation.

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-HYDR-001 | HIGH | `upsertActors` publicly exported — client-side store poisoning vector | PARTIAL | DRAFT |
| BW-HYDR-002 | HIGH | PII fields (email, birthdate, age, sex, is_adult, last_seen) confirmed in mapProfileActor identity object | BYPASSED | DRAFT — cross-ref VEN-HYDRATION-003 |
| BW-HYDR-003 | HIGH | `hydrateAndReturnSummaries` returns mixed shape (fresh=camelCase, stale=snake_case) — silent field access failures | BYPASSED | DRAFT — NEW |
| BW-HYDR-004 | HIGH | `useActorSummary.route` falls back to raw UUID when username is null — violates no-raw-IDs rule | BYPASSED | DRAFT — NEW |
| BW-HYDR-005 | MEDIUM | Hydration controllers have no session gate — arbitrary actorId triggers owner resolution | PARTIAL | DRAFT |
| BW-HYDR-006 | MEDIUM | BEHAVIOR.md is PLACEHOLDER — zero §9 invariants anchored | BYPASSED | DRAFT — cross-ref VEN-HYDRATION-007 |
| BW-HYDR-007 | LOW | Store has no eviction path for deleted/blocked/deactivated actors — 5-min stale window | PARTIAL | DRAFT — cross-ref VEN-HYDRATION-006 |
| BW-HYDR-008 | LOW | ENGINE_RESOLVE_START and HYDRATION_START debug events emit userId/allActorIds without IS_DEV guard — prod-safe via stub | PARTIAL | DRAFT |
| BW-HYDR-009 | INFO | No auth gate on hydration controllers — arbitrary actorId hydration | BLOCKED | DRAFT |

Output: ZZnotforproduction/APPS/VCSM/features/hydration/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_hydration-adversarial-review.md
