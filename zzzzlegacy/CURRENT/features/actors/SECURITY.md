# Security — actors
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Status: CURRENT SOURCE OF TRUTH
# BLACKWIDOW: PARTIAL (governance drift attack — no runtime exploit path confirmed)

## VENOM STATUS

VENOM Last Run: 2026-06-02
VENOM Status: PARTIAL (no direct actors VENOM pass; findings from adjacent audits + new ARCHITECT drift)

### VENOM-2026-06-02-004 — ARCH-ACTORS-DRIFT Governance Blind Spot (HIGH / OPEN)
- 3 security-assumption-bearing files absent from live source:
  hydrateActors.controller.js, getActorSummariesByIds.dal.js, extractActorIdsForHydration.model.js
- Hydration path migrated to engines/hydration/src/useActorSummary.js but governance docs reference stale paths
- Risk: any security audit that references stale actor files produces blind-spot analysis; trust-boundary assumptions may be wrong
- Exploitability: LOW (indirect — no direct exploit; governance risk)
- Blast Radius: All features that consume actor hydration (booking, profiles, feed, notifications, dashboard)
- Required fix: Update ARCHITECTURE.md and SECURITY.md to reference engine path; run IRONMAN to clarify ownership
- Follow-up: IRONMAN, SENTRY
- THOR Blocker: NO

### SENTRY-2026-01 — checkVportOwnership.controller.js Boundary Violation (HIGH / CARRIED)
- checkVportOwnership.controller.js imports getActorByIdDAL directly, bypassing adapter boundary
- Source: SENTRY 2026 pass (carried from dashboard boundary audit)
- Follow-up: SENTRY

---

## Command Coverage

| Command | Status | Last Run |
|---|---|---|
| VENOM | PARTIAL | 2026-06-02 — adjacent findings + new ARCH-ACTORS-DRIFT finding added |
| ELEKTRA | NOT_RUN (direct) | NEVER |
| BLACKWIDOW | PARTIAL | 2026-06-02 — BW-ACTORS-001 governance drift finding added |
| SENTRY | NOT_RUN (direct) | NEVER — adjacent finding SENTRY-2026-01 captured from dashboard DAL audit |
| THOR | RUN (partial) | 2026-05-27 — VCSM actor trust gate reviewed as part of vport-book-tab release gate |

Note: No security audit has been run directly scoped to `apps/VCSM/src/features/actors/`. Findings below are sourced from adjacent audits (full-scan, dashboard, booking, profiles) that touch actor-owned surfaces.

---

## Findings

### RESOLVED

**VENOM-FULL-F04** | Severity: HIGH | Status: RESOLVED
Dashboard route guard (`BlockedVportGuard`) did not enforce URL `:actorId` ownership — any authenticated user could navigate to `/actor/{anyActorId}/dashboard/*`. Fixed by adding `OwnerOnlyDashboardGuard` that compares `identity.actorId` to URL param.
Source: `2026-05-10_00-00_venom_vcsm-full-deep-scan.md` + `2026-05-10_01-00_venom_vcsm-full-scan-remediation.md`

**VENOM-FULL-F05** | Severity: HIGH | Status: RESOLVED
Dashboard controllers (`vportTeamAccess`, `vportLeads`) accepted `actorId` without session binding — no `callerActorId`/`assertingActorId` enforcement at controller layer. Fixed by adding `assertCallerOwns` + `callerActorId` parameter to all privileged functions.
Source: `2026-05-10_00-00_venom_vcsm-full-deep-scan.md` + `2026-05-10_01-00_venom_vcsm-full-scan-remediation.md`

**VENOM-FULL-F06** | Severity: HIGH | Status: RESOLVED
`acceptJoinResourceDAL` wrote `member_actor_id` with any caller-supplied `barberVportActorId` — no ownership verification that the authenticated user owned that vport actor. Fixed in `joinBarbershopAccount.controller.js`: now reads auth user, reads barber vport by owner user id, asserts `existingVport.actor_id === vportActorId` before accept.
Source: `2026-05-10_00-00_venom_vcsm-full-deep-scan.md` + `2026-05-10_01-00_venom_vcsm-full-scan-remediation.md`

**VENOM-FULL-F07** | Severity: MEDIUM | Status: RESOLVED
`profileId` exposed in identity debug event payload (`HYDRATION_ACTOR_READ_SUCCESS`). Removed from debug event in `identity.controller.js`.
Source: `2026-05-10_00-00_venom_vcsm-full-deep-scan.md` + `2026-05-10_01-00_venom_vcsm-full-scan-remediation.md`

**VENOM-FULL-F08** | Severity: MEDIUM | Status: RESOLVED
`getDebugPrivacyRowsController` compared `actor.profile_id` to `actorId` — type mismatch, always false. Fixed to use `myActorIds.includes(postActor.actor_id)`.
Source: `2026-05-10_00-00_venom_vcsm-full-deep-scan.md` + `2026-05-10_01-00_venom_vcsm-full-scan-remediation.md`

**VENOM-FULL-F12** | Severity: MEDIUM | Status: RESOLVED
`joinInvite.dal.js` RESOURCE_COLS included `profile_id` on semi-public anon-client token read. Removed `profile_id` from column select.
Source: `2026-05-10_00-00_venom_vcsm-full-deep-scan.md` + `2026-05-10_01-00_venom_vcsm-full-scan-remediation.md`

**IRON-BOOK-WARN1** | Severity: CRITICAL | Status: RESOLVED (RC-01)
`engines/booking` exported `listBookingHistory` with no caller ownership gate — any consumer could call it with just `resourceId`.
Source: `2026-05-14_ironman_booking-feature-ownership.md`

**IRON-BOOK-WARN2** | Severity: CRITICAL | Status: RESOLVED (RC-01)
`manageVportAvailabilityRuleController` had no `assertActorOwnsVportActorController` call — any authenticated user with a known `resourceId` could modify any VPORT's availability rules. Fixed by adding `assertActorOwnsVportActorController` before DAL write.
Source: `2026-05-14_ironman_booking-feature-ownership.md`

---

### OPEN

**IRON-BOOK-WARN3** | Severity: HIGH | Status: OPEN (deferred)
Two implementations of `assertActorOwnsVportActor` exist: one in `features/booking/controller/` and one in `engines/booking/src/controller/`. Feature version is used by all app callers; engine version is canonical but not wired. Risk of drift between ownership assertion logic.
Recommended: remove feature copy; import from `@booking`.
Source: `2026-05-14_ironman_booking-feature-ownership.md`

**SENTRY-2026-01** | Severity: BLOCKING (architecture) | Status: STATUS UNCLEAR
`checkVportOwnership.controller.js` directly imports `getActorByIdDAL` from `@/features/booking/dal/getActorById.dal` — bypasses adapter boundary. Fix plan: route through `booking.adapter.js`.
Source: `2026-05-18_sentry_dashboard-dal-layer-boundary-violations.md`

**VENOM-PROFILES-VF001** | Severity: HIGH | Status: OPEN
Route `/profile/:actorId` exposes raw actor UUID in public-facing URL. Violates internal ID exposure policy.
Source: `2026-05-22_venom_profiles-trust-boundaries.md`

**SENTRY-BARBER-2026-06-01** | Severity: HIGH | Status: OPEN
Locksmith `update service area`, `delete service area`, and `delete service detail` controllers have no session ownership assertion — `actorId` accepted as-is without `assertActorOwnsVportActorController`.
Source: `2026-06-01_sentry_barber-locksmith-barbershop-architect-gate.md`

**IRON-IDENTITY-WARN2** | Severity: MEDIUM | Status: OPEN
Dead export `resolveVcsmActorForProvisioning` in `vcsmIdentity.resolver.js` queries sensitive `vc.actors` fields (`kind`, `profile_id`, `vport_id`, `is_void`) with caller-supplied Supabase client and no RLS guarantee. Zero callers. Decision: REMOVE.
Source: `2026-05-18_ironman_identity-feature-ownership.md`

---

### NEEDS_REVIEW

**SPM-S2-001** | Severity: CRITICAL | Status: OPEN (no test)
`engines/booking/listQrLinks.controller.js` — auth gate added (VENOM V-002) but no regression test locks it. All 3 list functions (org/location/profile) were previously unauthenticated reads.
Source: `2026-05-27_00-00_spiderman_vport-booking-security-remediation.md`

**SPM-S2-003** | Severity: CRITICAL | Status: OPEN (no test)
`VportActorMenuFlyerScreen.jsx` ownership gate (`useVportOwnership`) has no behavioral regression test — non-owner/unauthenticated access path not locked.
Source: `2026-05-27_00-00_spiderman_vport-booking-security-remediation.md`

---

## THOR Release Gate State

THOR ran a partial actor trust gate review on 2026-05-27 as part of the vport-book-tab release.
Result: CONDITIONAL PASS
- VCSM ACTOR TRUST GATE: PASS — `assertActorOwnsVportActorController` enforced on all owner paths; `customer_actor_id` forced from server-side identity
- SPIDER-MAN: PARTIAL — 50 booking tests passing; branch still BLOCKED per SPIDER-MAN's own status
- LOKI: MISSING — no runtime traces
Source: `2026-05-27_06-40_thor_vport-book-tab-release-gate.md`

---

## Write Surface Risk Assessment

| Surface | Write Type | Ownership Gate | Risk |
|---|---|---|---|
| actors/controllers/ | PROFILE_MUTATION | YES | CRITICAL |
| `assertActorOwnsVportActorController` (via `vc.actor_owners`) | Authorization check | CANONICAL | STRONG |

Auth gate status: `assertActorOwnsVportActorController` confirmed enforced on all owner write paths per THOR gate 2026-05-27.

---

## Pending

No VENOM, ELEKTRA, or BLACKWIDOW audit has been run directly scoped to `apps/VCSM/src/features/actors/`. Recommended actions:
1. Run ARCHITECT to produce a formal architecture contract for this feature
2. Run VENOM scoped to actors feature — `PROFILE_MUTATION` CRITICAL surface has never received a dedicated trust boundary audit
3. Run ELEKTRA to scan source-to-sink chains through actor controllers
4. Resolve IRON-BOOK-WARN3 (dual assertActorOwnsVportActor) before next THOR gate

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-02
BLACKWIDOW Status: PARTIAL (governance drift attack — no runtime exploit path confirmed)

### BW-ACTORS-001 — Hydration Governance Drift (HIGH / DRAFT)
- Attack: security auditor models phantom file paths (hydrateActors.controller.js, getActorSummariesByIds.dal.js, extractActorIdsForHydration.model.js); misses real engines/hydration trust boundary
- Phantom files confirmed ABSENT from live source — drift verified
- Shim path found at state/actors/ — 6 consumers use indirection that conceals real engine path from static analysis
- Exploit chain: Documentation drift risk — not a synchronous runtime exploit
- Defense gate: ABSENT (no documentation accuracy enforcement)
- Result: ARCHITECTURAL_RISK — audit surface is wrong; future security reviews may miss real engine behavior
- Governance status: DRAFT
- THOR blocker: NO (governance risk, not runtime exploit)
- Required fix: Close ARCH-ACTORS-DRIFT-001/002/003; update docs to reference engines/hydration; resolve shims
- Follow-up: IRONMAN
