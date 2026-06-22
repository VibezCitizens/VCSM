# Test Coverage — actors
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Coverage Status: PARTIAL — SPIDER-MAN has not run directly on this feature
# Status: CURRENT SOURCE OF TRUTH

---

## SPIDER-MAN Coverage

SPIDER-MAN has not run a coverage audit directly scoped to `apps/VCSM/src/features/actors/`. The findings below are sourced from the 2026-05-26 and 2026-05-27 SPIDER-MAN sessions which covered booking, QR, menu, and actor-adjacent surfaces.

---

## Actor-Adjacent Test Findings (from SPIDER-MAN audit evidence)

### CRITICAL — Missing Regression Tests

**SPM-S2-001** | Severity: CRITICAL | Status: OPEN (no test)
`engines/booking/listQrLinks.controller.js` — auth gate added (VENOM V-002) but no regression test locks it. All 3 list functions (org/location/profile) were previously unauthenticated reads. The `assertActorOwnsVportActor` call is present but not locked by any test.
Source: `2026-05-27_00-00_spiderman_vport-booking-security-remediation.md`

**SPM-S2-003** | Severity: CRITICAL | Status: OPEN (no test)
`VportActorMenuFlyerScreen.jsx` — `useVportOwnership` auth gate behavior not locked by any test. Non-owner and unauthenticated access paths not verified.
Source: `2026-05-27_00-00_spiderman_vport-booking-security-remediation.md`

### HIGH — Missing Contract Tests

**SPM-S2-006** | Severity: HIGH | Status: OPEN (no test)
`getVportProfileIdByActorId.dal.js` + `resolveVportProfileId.controller.js` — null-return contract for actorId→profileId resolution not tested.
Source: `2026-05-27_00-00_spiderman_vport-booking-security-remediation.md`

**SPM-S2-007** | Severity: HIGH | Status: OPEN (no test)
`useQrLinks.js` — identity surface contract (actorId-only, never profileId) not tested. `requestActorId` passed to engine must be the actor's id, not the resolved profileId.
Source: `2026-05-27_00-00_spiderman_vport-booking-security-remediation.md`

---

## Branch SPIDER-MAN Block Status

As of 2026-05-27, branch `vport-booking-feed-security-updates` is BLOCKED. 7 CRITICAL + 7 HIGH findings have zero regression tests across both SPIDER-MAN sessions. Minimum safe bar before merge:
- SPM-S2-002 (qrUrlBuilders)
- SPM-S2-001 (listQrLinks engine auth gate)
- SPM-S2-003 (flyer screen auth gate)
- SPM-003 (assertActorOwnsVportActor — prior session)
- SPM-004 (vportLeads controller — prior session)

Source: `2026-05-27_00-00_spiderman_vport-booking-security-remediation.md` + `2026-05-26_14-00_spiderman_vport-booking-feed-security-updates.md`

---

## Coverage Summary

| Area | Status | Notes |
|---|---|---|
| `hydrateActors.controller.js` | UNKNOWN | SPIDER-MAN not run on actors feature |
| `searchActors.controller.js` | UNKNOWN | SPIDER-MAN not run on actors feature |
| `getActorSummariesByIds.dal.js` | UNKNOWN | SPIDER-MAN not run on actors feature |
| `searchActors.dal.js` | UNKNOWN | SPIDER-MAN not run on actors feature |
| `actors.adapter.js` | UNKNOWN | SPIDER-MAN not run on actors feature |
| `assertActorOwnsVportActor` (feature copy) | NO TEST LOCKED | SPM-003 from prior session — open |
| Actor-adjacent QR auth gate | NO TEST LOCKED | SPM-S2-001 — open |
| Actor-adjacent flyer screen ownership | NO TEST LOCKED | SPM-S2-003 — open |

---

## Pending

SPIDER-MAN has not run on `apps/VCSM/src/features/actors/`.

Recommended action: after ARCHITECT contract is established and branch block is cleared, run SPIDER-MAN scoped to actors feature to establish baseline regression coverage. Priority targets:
1. `assertActorOwnsVportActor` dual-implementation coverage (IRON-BOOK-WARN3)
2. `hydrateActors.controller.js` — batch hydration contract
3. `actors.adapter.js` — public boundary contract
