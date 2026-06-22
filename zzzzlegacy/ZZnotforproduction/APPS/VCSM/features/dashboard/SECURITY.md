# Security Posture — dashboard

Last Updated: 2026-06-05 (Modules 7–16 governance chain complete — ARCHITECT→VENOM→BLACKWIDOW→ELEKTRA)
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-CARD-001 (uploadFlyerImageCtrl no ownership check), VEN-SHELL-002 (partially mitigated — scope: uploadFlyerImageCtrl only)

---

## VENOM STATUS
VENOM Last Run: 2026-06-05 (Modules 7–16 deep-dive — chain verification + ARCHITECT correction)
VENOM Status: COMPLETE

Feature-level run (2026-06-04): 7 findings — 0 CRITICAL, 1 HIGH, 3 MEDIUM, 2 LOW, 1 MEDIUM (governance)
Module-level shell run (2026-06-05): 5 findings — 0 CRITICAL, 1 HIGH, 3 MEDIUM, 1 LOW
Card sub-module re-run (2026-06-05 Phase 1b): 2 new findings — 0 CRITICAL, 1 HIGH, 0 MEDIUM, 0 LOW, 1 INFO; 3 reclassifications applied
Modules 7–16 deep-dive (2026-06-05): 2 new findings — 0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW; 5 chains VERIFIED_SAFE; 1 ARCHITECT correction

### Feature-Level Findings (2026-06-04)

| Finding ID | Severity | Description |
|---|---|---|
| VEN-DASHBOARD-001 | MEDIUM | saveFlyerPublicDetails: controller-only ownership gate, no DAL or RLS backstop on vport.profile_public_details UPSERT |
| VEN-DASHBOARD-002 | MEDIUM | upsertVportPublicDetailsDAL: dual ownership model inconsistency (owner_user_id in DAL vs actor_owners in controller) |
| VEN-DASHBOARD-003 | MEDIUM | insertVportBookingDAL: customer_actor_id and created_by_actor_id accepted from caller row input; attribution injection risk |
| VEN-DASHBOARD-004 | HIGH | insertVportResourceDAL: unrestricted resources INSERT with no ownership gate, no resolved caller chain |
| VEN-DASHBOARD-005 | LOW | updateFuelPriceUnitForActorDAL: actorId accepted as DAL parameter with no session binding |
| VEN-DASHBOARD-006 | LOW | ownerUpdate path-selection in submitFuelPriceSuggestionController controlled by client-side isOwner prop |
| VEN-DASHBOARD-007 | MEDIUM | BEHAVIOR.md is a PLACEHOLDER — no §5 Security Rules or §9 Must Never Happen declared |

Full report: ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_dashboard-security-review.md

### Module-Level Shell Findings (2026-06-05)

| Finding ID | Severity | THOR Blocker | Description |
|---|---|---|---|
| VEN-SHELL-001 | ~~MEDIUM~~ LOW | NO | booking.adapter.js exports getActorByIdDAL — cross-domain trust boundary violation. Reclassified LOW: 1 confirmed consumer only (ELEKTRA 2026-06-05). |
| VEN-SHELL-002 | HIGH | YES | Shell isOwner gate is UI-only — PARTIALLY MITIGATED. 10 of 11 cards cleared. 1 confirmed gap: uploadFlyerImageCtrl (→ VEN-CARD-001). |
| VEN-SHELL-003 | MEDIUM | NO | Route ownership deferred to screen layer — async auth gap (public data only in loading window) |
| VEN-SHELL-004 | LOW | NO | Self-access bypass skips actor_owners — intentional, session-derived, shell has no writes |
| VEN-SHELL-005 | ~~MEDIUM~~ LOW | ~~YES~~ NO | Card catalog visibility is client-side model only. Reclassified LOW: all card write surfaces independently verified (ARCHITECT 2026-06-05). No unguarded write path reachable via catalog bypass. |

Full report: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/outputs/2026/06/05/Venom/2026-06-05_venom_dashboard-shell.md

### Card Sub-Module Findings (2026-06-05 Phase 1b)

| Finding ID | Severity | THOR Blocker | Description |
|---|---|---|---|
| VEN-CARD-001 | HIGH | YES | uploadFlyerImageCtrl (flyerEditor.controller.js) — no ownership check before uploadMediaController call; any authenticated user can upload to a target VPORT's design_asset scope |
| VEN-CARD-002 | INFO | NO | portfolio engine's addMedia enforces ownership internally (isActorOwner + profile_id match); addPortfolioMediaWithRecord engine delegation is safe |

Re-run report: ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/WOLVERINE/venom-rerun-phase1b.md

### Modules 7–16 Deep-Dive Findings (2026-06-05)

| Finding ID | Severity | THOR Blocker | Description |
|---|---|---|---|
| VEN-MOD7-16-001 | LOW | NO | createOwnerBookingController: serviceLabelSnapshot is caller-controlled; public booking path resolves from catalog server-side — inconsistency |
| VEN-MOD7-16-002 | LOW | NO | createVportPublicBookingController: customerName/customerNote unbounded free-text; no length limit or sanitization before DB insert |

**ARCHITECT Correction:** AF-002 (calendar/reviews/services classified as "stubs") is INCORRECT. All 3 screens are fully implemented with `useVportOwnership` gates and adapter delegation. Callgraph showed `barrel:1` due to boundary artifact, not missing implementation.

**Chain Verifications:** All 5 ARCHITECT chains VERIFIED_SAFE — ownership enforcement confirmed at controller level for all write paths.

Full report: ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/Venom/2026-06-05_01-00_venom_dashboard-modules7-16.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-05 (Modules 7–16 deep-dive — Areas 1 + 2)
ELEKTRA Status: COMPLETE

### Module-Level Shell Run (2026-06-05)
0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW, 1 INFO

| Finding ID | Severity | Status | Description |
|---|---|---|---|
| ELEK-2026-06-05-001 | LOW | Open | QR/reviews-QR slug fallback — raw actorId in navigation URL when slug absent |
| ELEK-2026-06-05-002 | LOW | Open | booking.adapter DAL export — migrate getActorByIdDAL to @/shared/dal/actor/ |
| ELEK-2026-06-05-INFO-001 | INFO | PATCHED | Prior ELEK-004 confirmed patched (assertActorOwnsVportActorController kind-before-bypass) |

VENOM reclassifications supported: VEN-SHELL-001 MEDIUM→LOW (1 adapter consumer confirmed), VEN-SHELL-005 MEDIUM→LOW (own-actor only)
Out-of-scope referral: booking feature ELEKTRA run required (createBooking.controller.js status allowlist + raw actorId in notification deep link)

Output: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/outputs/2026/06/05/ELEKTRA/2026-06-05_elektra_dashboard-shell.md

### Modules 7–16 Deep-Dive (2026-06-05)
1 HIGH (existing confirmed) | 1 MEDIUM | 2 LOW | 5 FALSE POSITIVES REJECTED

| Finding ID | Severity | Status | Description |
|---|---|---|---|
| ELEK-MOD7-16-001 | HIGH | Open | uploadFlyerImageCtrl: ownerActorId from caller, no requireOwnerActorAccess — VEN-CARD-001 precise trace |
| ELEK-MOD7-16-002 | MEDIUM | Open | updateBookingStatusController: owner-path status not validated against allowlist — any string writable |
| ELEK-MOD7-16-003 | LOW | Open | createVportPublicBookingController: customerName/customerNote unbounded free-text — no length or content validation |
| ELEK-MOD7-16-004 | LOW | Open | createOwnerBookingController: serviceLabelSnapshot caller-controlled — no catalog validation unlike public path |

5 false positives rejected (customer_actor_id callers verified safe, updateVportBookingDAL ownership confirmed, settings UPSERT ownership confirmed, exchange currency allowlist confirmed, insertVportResourceDAL dead code confirmed).

Status resolution on prior referral: ELEK-MOD7-16-002 addresses the "booking status allowlist" gap flagged as out-of-scope in shell run.

Output: ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/ELEKTRA/2026-06-05_01-00_elektra_dashboard-modules7-16.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-05 (Modules 7–16 deep-dive — chain adversarial verification)
BLACKWIDOW Status: COMPLETE

### Feature-Level Run (2026-06-04)
0 CRITICAL, 0 HIGH, 3 MEDIUM, 2 LOW, 1 INFO

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-DASH-001 | INFO | VEN-006 ownerUpdate client flag — server-side ownership re-check confirmed in submitOwnerFuelPriceUpdate | BLOCKED | DRAFT |
| BW-DASH-002 | LOW | BEHAVIOR.md is PLACEHOLDER — §9 invariants UNANCHORED; all derived invariants hold from source annotations | UNRESOLVED | DRAFT |
| BW-DASH-003 | MEDIUM | insertVportResourceDAL: UNUSED_EXPORT (0 consumers), latent unguarded INSERT — not exploitable while dead | UNRESOLVED | DRAFT |
| BW-DASH-004 | MEDIUM | Dual ownership model: actor_owners at controller vs owner_user_id at DAL (settings path) — cross-references VEN-002 | PARTIAL | DRAFT |
| BW-DASH-005 | MEDIUM | saveFlyerPublicDetails (flyer.write.dal.js): controller-only ownership gate, no DAL ownership filter — cross-references VEN-001 | PARTIAL | DRAFT |
| BW-DASH-006 | LOW | fastCountNewVportLeadsController: caller-supplied profileId not re-validated against actorId — read-only count leak | PARTIAL | DRAFT |

Output: ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_dashboard-adversarial-review.md

### Module-Level Shell Run (2026-06-05)
0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW | 8 BLOCKED, 2 PARTIAL, 0 BYPASSED

| Finding ID | Severity | Result | Description |
|---|---|---|---|
| BW-DSH-SHELL-001 | LOW | PARTIAL | booking.adapter DAL export — 1 documented call site confirmed; future consumers unguarded |
| BW-DSH-SHELL-002 | LOW | PARTIAL | Release flag bypass — VPORT type not validated at mutation layer; own-actor only |

Key adversarial results: All 5 sampled card sub-modules (calendar, locksmith, exchange, bookings, gas) confirmed independent ownership enforcement. No bypassed attack chains. VEN-SHELL-001 and VEN-SHELL-005 recommended for reclassification to LOW after SENTRY confirms scope.

Output: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/outputs/2026/06/05/BlackWidow/2026-06-05_blackwidow_dashboard-shell.md

### Modules 7–16 Deep-Dive (2026-06-05)
0 CRITICAL, 0 HIGH (1 confirmed existing), 0 MEDIUM, 1 LOW | 9 BLOCKED, 1 BYPASSED (existing), 2 PARTIAL, 1 NOT_REACHABLE

| Finding ID | Severity | Result | Description |
|---|---|---|---|
| BW-MOD7-16-001 | LOW | NOT_REACHABLE | insertVportResourceDAL (dashboard): 0 consumers confirmed; calendar uses engine DAL (ensureOwnerBookingResource with ownership check). Recommend: delete dead code. |
| BW-MOD7-16-002 | HIGH | BYPASSED | §13.2 violated — uploadFlyerImageCtrl no ownership check (VEN-CARD-001 re-confirmed as THOR BLOCKER) |

12 attack scenarios attempted. 9 BLOCKED, 1 BYPASSED (existing VEN-CARD-001), 2 PARTIAL (serviceLabelSnapshot, customerName injection), 1 NOT_REACHABLE. All 7 §13 invariants attacked; §13.2 confirmed violated (VEN-CARD-001). New ARCHITECT correction: calendar, reviews, services are not stubs — all have ownership gates + engine delegation.

Output: ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/BlackWidow/2026-06-05_01-00_blackwidow_dashboard-modules7-16.md
