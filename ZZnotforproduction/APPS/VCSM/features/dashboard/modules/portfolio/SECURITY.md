# Security Posture — dashboard/modules/portfolio

Last Updated: 2026-06-05
Highest Open Severity: MEDIUM
THOR Release Blocker: NO — VEN-PORT-002/BW-PORT-001 CLOSED by ELEKTRA (engine ownership SOURCE_VERIFIED). ELEK-2026-06-05-001 (MEDIUM boundary violation) — patch recommended, not a hard THOR blocker.

---

## VENOM STATUS
VENOM Last Run: 2026-06-05
VENOM Status: COMPLETE

**Scope:** dashboard/modules/portfolio
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001
**Report:** ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/Venom/2026-06-05_venom_dashboard-modules-locksmith-portfolio-qrcode-shared-team.md

### Trust Boundary Analysis

Portfolio module has a multi-layer write path: screen (isOwner gate) → hook → engine (@portfolio createItem/updateItem) → controller (assertActorOwnsVportActorController confirmed at probeVportPortfolio + ctrlSavePortfolioDetail) → DAL (callerProfileId scope on portfolio_media).

Ownership is confirmed at 3 layers for the addPortfolioMediaWithRecord path. Portfolio engine ownership for createItem/updateItem is ARCHITECT-asserted but not SOURCE_VERIFIED within module scope.

Routes: `/actor/:actorId/dashboard/portfolio` — PROTECTED.

### Open Findings

| ID | Severity | Description | Status |
|---|---|---|---|
| VEN-PORT-001 | MEDIUM | Cross-feature controller import — portfolio hook imports profiles/locksmith internals directly (BV-001/002) | OPEN |
| VEN-PORT-002 | MEDIUM | Portfolio engine ownership unverified — @portfolio createItem/updateItem receive caller-provided actorId; engine source not read | OPEN |
| VEN-BEHAV-002 | MEDIUM | BEHAVIOR.md missing — no spec for multi-layer write path or rollback behavior | OPEN |

### Confirmed Mitigations

| Finding | Status |
|---|---|
| PORT-V-005 (portfolio_media UPDATE callerProfileId scope) | CONFIRMED — portfolioMediaRecord.write.dal.js:14 |
| ctrlSavePortfolioDetail ownership | CONFIRMED — locksmithOwner.controller.js:118 assertActorOwnsVportActorController |

### THOR Assessment

CAUTION — VEN-PORT-002 must be resolved by ELEKTRA before THOR. The portfolio engine (createItem/updateItem) must be SOURCE_VERIFIED as ownership-enforced. If engine does not enforce ownership, this escalates to HIGH/CRITICAL and becomes a full THOR blocker.

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-05
ELEKTRA Status: COMPLETE

**Report:** ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/ELEKTRA/2026-06-05_elektra_dashboard-modules-locksmith-portfolio-qrcode-shared-team.md

### Chain Verification Results

| Chain | Verdict | Evidence |
|---|---|---|
| createItem actorId ownership (CHAIN-portfolio-002) | CONFIRMED_MITIGATED | createItem.controller.js:34 isActorOwner; setup.js:39-57 RLS-backed (actor_owners_read_own user_id=auth.uid()) |
| updateItem actorId ownership (CHAIN-portfolio-003) | CONFIRMED_MITIGATED | updateItem.controller.js:36 profile_id match + :40 isActorOwner; dal:71 callerProfileId scope |
| deleteItem actorId ownership (CHAIN-portfolio-001) | CONFIRMED_MITIGATED | deleteItem.controller.js:31 profile_id match + :36 isActorOwner; dal:98 callerProfileId scope |
| ctrlSavePortfolioDetail direct import (CHAIN-portfolio-004) | VALID_FINDING | usePortfolioItemSubmit.js:5 — bypasses profiles adapter |

### VEN-PORT-002 / BW-PORT-001 Closure

Both findings are **CLOSED as FALSE POSITIVES**. Engine ownership is enforced at two levels:
- `isActorOwner(actorId)` in createItem/updateItem/deleteItem calls DI function in setup.js:39-57
- DI function queries `vc.actor_owners` with RLS policy `actor_owners_read_own` (user_id = auth.uid()) — session-bound at DB layer
- updateItem/deleteItem additionally verify `existing.profile_id !== callerProfileId` before calling isActorOwner
- DAL UPDATE/DELETE scoped with `.eq('profile_id', callerProfileId)` as third layer

ELEKTRA Portfolio THOR: NO BLOCKER.

### Open ELEK Findings

| ID | Severity | Description | Status |
|---|---|---|---|
| ELEK-2026-06-05-001 | MEDIUM | Boundary violation: usePortfolioItemSubmit.js:5-6 imports profiles controller internals directly — route through profiles.adapter | OPEN — patch advisory issued |
| ELEK-2026-06-05-002 | INFO | actorId URL param format unverified (UUID vs slug) — route resolver not source-read | OPEN — SCANNER_LEAD |

### THOR Assessment

No blockers from ELEKTRA. ELEK-2026-06-05-001 (MEDIUM boundary violation) is a patch recommendation for the next sprint, not a release gate. VEN-PORT-002/BW-PORT-001 CLOSED. Portfolio is cleared for THOR evaluation in a fresh session.

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-05
BLACKWIDOW Status: COMPLETE

**Report:** ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/BlackWidow/2026-06-05_blackwidow_dashboard-modules-locksmith-portfolio-qrcode-shared-team.md

### Adversarial Results

| Attack | Result | Evidence |
|---|---|---|
| ctrlSavePortfolioDetail for unauthorized VPORT (boundary violation path) | BLOCKED | locksmithOwner.controller.js:118 — assertActorOwnsVportActorController |
| createItem/updateItem for unauthorized VPORT (@portfolio engine) | PARTIAL | Hook-level ownership absent; engine source unread |

### Open BW Findings

| ID | Severity | Description | Status |
|---|---|---|---|
| BW-PORT-001 | MEDIUM | @portfolio engine createItem/updateItem ownership unverified — screen gate bypassable | DRAFT |

### THOR Assessment

CAUTION — BW-PORT-001 (PARTIAL) must be resolved by ELEKTRA before THOR. No BYPASSED exploits confirmed. ctrlSavePortfolioDetail boundary violation path is BLOCKED by controller ownership.
