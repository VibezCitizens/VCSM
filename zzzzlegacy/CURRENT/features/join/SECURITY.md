---
# join — SECURITY.md
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Status: CURRENT SOURCE OF TRUTH

Security posture for the join feature. Based on VENOM and ELEKTRA findings from
multi-feature sweeps (2026-05-09 through 2026-05-28). A full module-level
VENOM + ELEKTRA + BLACKWIDOW pass has NOT been run on this feature as a unit.

---

## Security Posture Summary

**Overall:** PARTIAL — CRITICAL and HIGH resolved findings confirmed; 9 open findings remain
**Highest Open Severity:** HIGH (ELEK-2026-05-28-024, ELEK-2026-05-28-025, ELEK-2026-05-27-001)
**THOR Blocker State:** BLOCKED — feature is live with open HIGH findings and no completed module-level audit
**VENOM Status:** PARTIAL — multi-sweep findings documented; full module pass NOT_STARTED
**ELEKTRA Status:** PARTIAL — findings from 2026-05-27/28; resolution not confirmed for all
**BLACKWIDOW Status:** NOT_STARTED

---

## Command Coverage

| Command | Status | Last Run | Scope |
|---|---|---|---|
| VENOM | PARTIAL | 2026-05-10 (last join-specific) | Multi-feature sweeps; module-level run NOT_STARTED |
| ELEKTRA | PARTIAL | 2026-05-28 | barber/barbershop join controllers; module-level run NOT_STARTED |
| BLACKWIDOW | NOT_STARTED | NEVER | Not run |
| SENTRY | PARTIAL | 2026-06-01 | Route compliance confirmed; iOS parity NOT_AUDITED |
| THOR | BLOCKED | NEVER | Cannot clear until HIGH findings resolved and VENOM VERIFIED |

---

## Write Surface Risk Assessment

| Surface | Write Type | Ownership Gate | Risk |
|---|---|---|---|
| join/controllers/ | AUTH_MUTATION | PARTIAL | CRITICAL |
| acceptJoinResourceDAL | AUTH_MUTATION | APPLICATION (controller gate) only | HIGH |
| acceptJoinResourceDAL (DAL layer) | AUTH_MUTATION | NONE at DAL layer | HIGH |

Gate status: PARTIAL. `useExistingBarberVportAndAccept` correctly asserts `assertActorOwnsVportActorController`. Create paths (QR and invite) do not.

---

## Trust Boundary Architecture

```
Client
  ↓ /join/barbershop/:token  — PUBLIC ROUTE (outside ProtectedRoute)
  ↓
  ┌─────────────────────────────────────────────────────────────┐
  │  UI GATE — useJoinBarbershop hook                           │
  │  QR expiry check (join_expires_at) — hook/UI layer ONLY     │
  │  ⚠️ ELEK-2026-05-28-028: no controller-layer expiry gate    │
  └─────────────────────────────────────────────────────────────┘
  ↓
  ┌─────────────────────────────────────────────────────────────┐
  │  CONTROLLER LAYER — joinBarbershopQr.controller.js          │
  │  joinBarbershopAccount.controller.js                        │
  │  ✓ useExistingBarberVportAndAccept:                         │
  │    assertActorOwnsVportActorController PRESENT              │
  │  ⚠️ createBarberVportAndAcceptQr: assertion MISSING         │
  │  ⚠️ createBarberVportAndAccept (invite): assertion MISSING  │
  │  ⚠️ autoResumeInviteOnboarding: callerActorId unresolved   │
  └─────────────────────────────────────────────────────────────┘
  ↓
  ┌─────────────────────────────────────────────────────────────┐
  │  DAL LAYER — joinInvite.dal.js                              │
  │  fetchJoinResourceByIdDAL:                                  │
  │    ⚠️ No resource_type filter (ELEK-2026-05-28-027)         │
  │  acceptJoinResourceDAL:                                     │
  │    ⚠️ No DAL-layer ownership gate (VENOM-FINDING-8)         │
  │    Sole guard: meta.status = 'pending_onboarding' atomic    │
  └─────────────────────────────────────────────────────────────┘
  ↓
  ┌─────────────────────────────────────────────────────────────┐
  │  DB LAYER — vport.resources                                 │
  │  RLS: sole backstop for acceptJoinResourceDAL               │
  │  ⚠️ VENOM-FINDING-8: DB RLS audit pending — not confirmed  │
  └─────────────────────────────────────────────────────────────┘
```

---

## Findings

### RESOLVED

**VENOM-FINDING-2** | CRITICAL | RESOLVED
- Finding: `joinBarbershopAccount.controller.js` called `syntheticAdultBirthdate()` — writes fake `is_adult = true` to DB for every barbershop join user, bypassing age verification.
- Resolution: Synthetic age call fully removed. Verified by VENOM legal-fixes-verification audit.
- Evidence: `CURRENT/features/dashboard/evidence/2026-05-09_00-00_venom_whole-project-deep.md`, `CURRENT/features/dashboard/evidence/2026-05-10_venom_legal-fixes-verification.md`

**VENOM-FINDING-6** | HIGH | RESOLVED
- Finding: `/join/barbershop/:token` route unregistered — feature fully implemented but inaccessible (React Router wildcard redirected to `/login`). Additionally `JoinSignupForm.jsx` had dead ToS/Privacy links (`/terms`, `/privacy`).
- Resolution: Route wired (`join.routes.jsx` + `lazyPublic.jsx` + `index.jsx`), links corrected to `/legal/terms-of-service` and `/legal/privacy-policy`.
- Evidence: `CURRENT/features/dashboard/evidence/2026-05-09_00-00_venom_whole-project-deep.md`, `CURRENT/features/dashboard/evidence/2026-05-10_venom_terms-of-service-logic.md`

**F-06** | HIGH | RESOLVED
- Finding: `useExistingBarberVportAndAccept` accepted arbitrary `vportActorId` without verifying caller owned that VPORT.
- Resolution: Auth user read + ownership assertion added before `acceptJoinResourceDAL`.
- Evidence: `CURRENT/features/dashboard/evidence/2026-05-10_00-00_venom_vcsm-full-deep-scan.md`, `CURRENT/features/dashboard/evidence/2026-05-10_01-00_venom_vcsm-full-scan-remediation.md`

**F-12** | MEDIUM | RESOLVED
- Finding: `fetchJoinResourceByIdDAL` returned `profile_id` (banned identity surface) in `RESOURCE_COLS` over the anon public path.
- Resolution: `profile_id` removed from `RESOURCE_COLS` in `joinInvite.dal.js`.
- Evidence: `CURRENT/features/dashboard/evidence/2026-05-10_00-00_venom_vcsm-full-deep-scan.md`, `CURRENT/features/dashboard/evidence/2026-05-10_01-00_venom_vcsm-full-scan-remediation.md`

---

### OPEN

**ELEK-2026-05-27-001** | HIGH | OPEN
- Finding: IDOR — VPORT force-enrollment via QR join. `acceptJoinResourceDAL` in `joinBarbershopQr.controller.js` accepted token/resourceId writes without pre-checking `meta.status`, enabling authenticated actor to overwrite an already-linked `member_actor_id`. Note: `acceptQrJoin` later patched to call `assertActorOwnsVportActorController` + state recheck — but original ELEK finding is listed as Open at scan time; patch resolution not confirmed at governance level.
- Evidence: `CURRENT/features/dashboard/evidence/2026-05-27_14-30_elektra_barbershop-vport.md`

**ELEK-2026-05-28-024** | HIGH | OPEN
- Finding: `createBarberVportAndAcceptQr` calls `acceptJoinResourceDAL` without `assertActorOwnsVportActorController` post-VPORT creation. Ownership of newly created VPORT not verified against `actor_owners` before accept fires.
- Evidence: `CURRENT/features/dashboard/evidence/2026-05-28_elektra_barber.md`

**ELEK-2026-05-28-025** | HIGH | OPEN
- Finding: `createBarberVportAndAccept` (invite path) calls `acceptJoinResourceDAL` without ownership assertion after VPORT creation. `useExistingBarberVportAndAccept` correctly asserts; create path does not.
- Evidence: `CURRENT/features/dashboard/evidence/2026-05-28_elektra_barber.md`

**ELEK-2026-05-28-026** | MEDIUM | OPEN
- Finding: `autoResumeInviteOnboarding` calls `acceptJoinResourceDAL` without ownership assertion after VPORT creation. `callerActorId` not resolved before accept.
- Evidence: `CURRENT/features/dashboard/evidence/2026-05-28_elektra_barber.md`

**ELEK-2026-05-28-027** | MEDIUM | OPEN
- Finding: `fetchJoinResourceByIdDAL` does not filter by `resource_type`. Any resource UUID (including bookings) can be passed as a join token. Write is blocked by `meta.status` check but metadata is leaked to callers regardless of resource type.
- Evidence: `CURRENT/features/dashboard/evidence/2026-05-28_elektra_barber.md`

**VENOM-FINDING-8** | LOW | OPEN (DB audit pending)
- Finding: `acceptJoinResourceDAL` write path has no DAL-layer ownership gate. Write succeeds for any `resourceId` passed; sole defense is RLS on `vport.resources`. DB audit of RLS required to confirm mitigation sufficiency.
- Evidence: `CURRENT/features/dashboard/evidence/2026-05-10_pre-push_venom_full-security-sweep.md`

**VENOM-TEAM-005** | MEDIUM | OPEN
- Finding: `findEligibleBarberActorIdsDAL` resolves eligible barbers via `profiles.owner_user_id` (banned identity surface). Must be replaced with `actor_owners` query.
- Evidence: `CURRENT/features/dashboard/evidence/2026-05-27_venom_vport-dashboard-team-card.md`

**NEW-LEGAL-JOIN-001** | LOW | OPEN
- Finding: `signUpForBarbershopInvite()` — `recordSignupConsent` swallowed via blanket `.catch(() => {})` with no DEV-layer observability. Consent recording failures are fully silent; ProtectedRoute is sole recovery gate.
- Evidence: `CURRENT/features/dashboard/evidence/2026-05-10_venom_legal-fixes-verification.md`

**S-BLK-005** | LOW | OPEN
- Finding: Duplicate import in `useJoinBarbershop.js` — `loginForInvite` imported twice, once aliased as `loginController`. Minor code quality drift, not a security risk.
- Evidence: `CURRENT/features/dashboard/evidence/2026-06-01_sentry_barber-locksmith-barbershop-architect-gate.md`

---

## ELEK-2026-05-28-028 | LOW | OPEN

- Finding: QR expiry (`join_expires_at`) enforced only in hook/UI layer. Controller layer has no expiry enforcement. DAL atomic guard (`meta->>status = 'pending_onboarding'`) is sole DB-level gate, but only if shop owner updates status on expiry.
- Evidence: `CURRENT/features/dashboard/evidence/2026-05-28_elektra_barber.md`

---

## Pending Full Audit

A complete module-level VENOM + ELEKTRA + BLACKWIDOW pass has NOT been run on the join feature.
All findings above are from multi-feature sweeps. A scoped audit of the join module is required
before THOR gate can be cleared.

Recommended: run `/VENOM` + `/ELEKTRA` scoped to `apps/VCSM/src/features/join/` before next release.

---

## History Index

| Date | Command | Security Event |
|---|---|---|
| 2026-05-09 | VENOM | VENOM-FINDING-2 (CRITICAL — synthetic age), VENOM-FINDING-6 (HIGH — unregistered route) found |
| 2026-05-10 | VENOM | F-06 (HIGH — missing ownership assert), F-12 (MEDIUM — profile_id in anon path) found |
| 2026-05-10 | VENOM | F-06 and F-12 RESOLVED — remediation confirmed |
| 2026-05-10 | VENOM | VENOM-FINDING-2 RESOLVED — synthetic age removed; NEW-LEGAL-JOIN-001 identified |
| 2026-05-10 | VENOM | VENOM-FINDING-6 RESOLVED — route wired, ToS links corrected |
| 2026-05-10 | VENOM | VENOM-FINDING-8 identified (DAL-layer no ownership gate) — OPEN |
| 2026-05-27 | ELEKTRA | ELEK-2026-05-27-001 identified (IDOR — QR force-enrollment) |
| 2026-05-28 | ELEKTRA | ELEK-2026-05-28-024 through 028 identified — all OPEN |
| 2026-06-01 | SENTRY | S-BLK-005 identified (duplicate import); iOS parity NOT_AUDITED |
