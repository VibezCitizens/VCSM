---
# join — CURRENT_STATUS.md
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Status: CURRENT SOURCE OF TRUTH

## Feature Status

| Field | Value |
|---|---|
| Status | ACTIVE — with open security debt |
| Security Tier | CRITICAL |
| Auth Surface | PUBLIC |
| Priority | P1 |
| Last Audit | 2026-05-28 (ELEKTRA — barber join controllers) |
| Open Security Findings | 9 OPEN (see SECURITY.md) |
| Open Tickets (formal) | NONE assigned |
| Recommended Next Command | VENOM + ELEKTRA (full module pass) |
| Last Updated | 2026-06-02 |

---

## Active Ticket State

| Ticket | Title | Status | Priority |
|---|---|---|---|
| ELEK-2026-05-28-024 | createBarberVportAndAcceptQr — no ownership assertion before acceptJoinResourceDAL | OPEN | HIGH |
| ELEK-2026-05-28-025 | createBarberVportAndAccept invite path — no ownership assertion after VPORT creation | OPEN | HIGH |
| ELEK-2026-05-28-026 | autoResumeInviteOnboarding — no ownership assertion, callerActorId unresolved | OPEN | MEDIUM |
| ELEK-2026-05-28-027 | fetchJoinResourceByIdDAL — no resource_type filter; metadata leakage | OPEN | MEDIUM |
| ELEK-2026-05-28-028 | QR expiry enforced only in hook/UI; controller layer has no expiry gate | OPEN | LOW |
| VENOM-FINDING-8 | acceptJoinResourceDAL — no DAL-layer ownership gate; DB RLS audit pending | OPEN | LOW |
| VENOM-TEAM-005 | findEligibleBarberActorIdsDAL uses banned owner_user_id join | OPEN | MEDIUM |
| NEW-LEGAL-JOIN-001 | recordSignupConsent swallowed via .catch(() => {}) — fully silent failures | OPEN | LOW |
| S-BLK-005 | Duplicate import in useJoinBarbershop.js (loginForInvite aliased as loginController) | OPEN | LOW |

No formal TICKET-XXXX IDs assigned to the above. All are tracked by ELEK/VENOM/SENTRY finding IDs only.

---

## Known Blockers

1. **ELEK-2026-05-28-024** (HIGH) — `createBarberVportAndAcceptQr` has no `assertActorOwnsVportActorController` before `acceptJoinResourceDAL`. QR join path is unguarded at controller layer post-VPORT creation.
2. **ELEK-2026-05-28-025** (HIGH) — `createBarberVportAndAccept` (invite path) — same ownership assertion gap as 024. `useExistingBarberVportAndAccept` is correctly gated; create path is not.
3. **ELEK-2026-05-28-026** (MEDIUM) — `autoResumeInviteOnboarding` calls `acceptJoinResourceDAL` without resolving `callerActorId` or asserting ownership.
4. **ELEK-2026-05-28-027** (MEDIUM) — `fetchJoinResourceByIdDAL` does not filter by `resource_type`. Any resource UUID can be used as a join token, leaking metadata.
5. **VENOM-TEAM-005** (MEDIUM) — `findEligibleBarberActorIdsDAL` resolves eligible barbers via `profiles.owner_user_id` (banned identity surface).
6. **THOR GATE BLOCKED** — No completed security audit at module governance level. Feature is live with open HIGH findings. THOR cannot clear until VENOM is at minimum VERIFIED and all HIGH findings resolved.
7. **Migration blocker** — `legal_documents_document_type_check` constraint on `platform.legal_documents` excludes `'age_verification'`. Age verification seed INSERT in migration 02 would fail without constraint update. Status: OPEN pre-production blocker.

---

## Release Gate State

| Gate | Status | Command |
|---|---|---|
| VENOM full module pass | NOT_STARTED | Required before THOR |
| ELEKTRA full module pass | PARTIAL — findings from 2026-05-27/28 exist; not resolved | Required before THOR |
| BLACKWIDOW | NOT_STARTED | Required before THOR |
| SENTRY compliance | PARTIAL — route registration confirmed; barber join iOS NOT_AUDITED | Recommended |
| THOR release gate | BLOCKED | Unblocks after VENOM VERIFIED + all HIGH findings resolved |
| SPIDER-MAN regression | NOT_STARTED | Required |
| IRONMAN ownership | NOT_STARTED | Recommended |

---

## Last Command Runs (Evidence-Based)

| Command | Scope | Date | Result |
|---|---|---|---|
| VENOM | whole-project deep | 2026-05-09 | VENOM-FINDING-2 (CRITICAL — synthetic age), VENOM-FINDING-6 (HIGH — unregistered route) found |
| VENOM | vcsm-full-deep-scan | 2026-05-10 | F-06 (HIGH), F-12 (MEDIUM) found |
| VENOM | vcsm-full-scan-remediation | 2026-05-10 | F-06, F-12 RESOLVED |
| VENOM | legal-fixes-verification | 2026-05-10 | VENOM-FINDING-2 RESOLVED; NEW-LEGAL-JOIN-001 identified |
| VENOM | terms-of-service-logic | 2026-05-10 | VENOM-FINDING-6 RESOLVED (route wired, ToS links corrected) |
| VENOM | pre-push full sweep | 2026-05-10 | VENOM-FINDING-8 identified (OPEN) |
| VENOM | vport-dashboard-team-card | 2026-05-27 | VENOM-TEAM-005 identified (OPEN) |
| ELEKTRA | barbershop-vport | 2026-05-27 | ELEK-2026-05-27-001 identified |
| ELEKTRA | barber | 2026-05-28 | ELEK-2026-05-28-024 through 028 identified |
| SENTRY | join-barbershop-route-registration | 2026-05-18 | Route compliance confirmed |
| SENTRY | barber-locksmith-barbershop-architect-gate | 2026-06-01 | S-BLK-005 identified; iOS parity NOT_AUDITED |
| LOKI | barbershop-join-route-trace | 2026-05-18 | Runtime trace confirmed; migration 20260510040000 staged |

---

## DR. STRANGE Summary

The join feature is ACTIVE on branch `vport-booking-feed-security-updates` with 4 files modified (controllers, DAL, hook). It has 9 open security findings, 3 of which are HIGH severity — two in the controller create paths (QR and invite) where `assertActorOwnsVportActorController` is missing before `acceptJoinResourceDAL`, and one IDOR finding on the QR resource slot overwrite path. The THOR release gate is BLOCKED. The feature has never had a complete VENOM or ELEKTRA module-level pass; all findings to date are from multi-feature sweeps. Immediate recommended action is a scoped VENOM + ELEKTRA run on the join module before any further merges or releases. A migration pre-production blocker (age verification constraint) must also be resolved by CARNAGE before deployment.
---
