# Current Status — dashboard/modules/leads

---

## review-contract

Last Run: 2026-06-04
Status: PARTIALLY COMPLIANT
Output: `outputs/2026/06/04/review-contract/2026-06-04_00-00_review-contract_leads-module-compliance.md`

Findings: 4 HIGH | 3 MEDIUM | 3 WARNINGS

- H-001 HIGH: `vportLeads.write.dal.js` — `normalizeContactedSource()` normalization logic lives in DAL. Violates §2.1. Must move to model/controller.
- H-002 HIGH: `VportDashboardLeadsFinalScreen.jsx` — imports `useVportOwnership` directly from parent vport internal hooks, bypassing `vport.adapter.js`. Violates §5.2/§5.5.
- H-003 HIGH: `index.js` — exports model functions (`normalizeVportLead`, `formatLeadDate`, `formatSourceLabel`, `previewMessage`) through public barrel. Violates §5.3.
- H-004 HIGH: `vportLeads.controller.js` — imports `readVportProfileByActorIdDAL` directly from parent vport DAL layer without adapter. Violates §5.2. (ARCHITECT accepted as ARC-LEADS-001 LOW — contract violation still stands.)
- M-001 MEDIUM: Relative `./` imports in 3 files. Violates §1.1.
- M-002 MEDIUM: `VportDashboardLeadsView.jsx` naming — neither `.view.jsx` nor `ViewScreen.jsx`. Violates §4.5.
- M-003 MEDIUM: `vportLeads.controller.js` — 5 operations in one file. Violates §4.2 SRP.
- W-001 WARNING: `VportDashboardLeadsView.jsx` at 249 lines — approaching 300-line limit.
- W-002 WARNING: Controller at exact 5-collaborator fan-out limit.
- W-003 WARNING: `vportDashboardLeadsScreen.model.js` — stale shim with zero active consumers. Safe to delete.

THOR Gate Impact: HIGH violations are architectural boundary issues. None are new runtime security risks. H-001/H-002/H-003/H-004 must be resolved before release.

---

## KRAVEN

Last Run: 2026-06-04
Status: WATCH
LOKI Evidence: PRESENT
Output: `outputs/2026/06/04/KRAVEN/2026-06-04_00-00_kraven_leads-performance-analysis.md`
PERFORMANCE.md: CREATED (2026-06-04)

Findings: 2 HIGH | 2 MEDIUM | 1 LOW | 1 INFO (platform)
Top Bottleneck: KRA-LEADS-002 — poll ownership assertion (2–4 DB reads/60s per VPORT owner session, globally in RootLayout). At 1,000 concurrent owners: 120k–240k DB reads/hour from count assertions alone.

- KRA-LEADS-002 HIGH P0: POLL_MS=60s fires assertActorOwnsVportActorController (2–4 DB reads) every 60s for every VPORT owner with VCSM open. Fix: POLL_MS→180,000 (1 line, zero security tradeoff, 67% DB reduction). For deeper cut: add 10-min ownership TTL on count-only path (VENOM sign-off required).
- KRA-LEADS-001 HIGH P1: Screen gate (useVportOwnership) + controller both run assertActorOwnsVportActorController on page load. 3 duplicate DB reads, ~120ms wasted per navigation. Requires VENOM review for any read-path optimization.
- KRA-LEADS-004 MEDIUM P2: useVportOwnership fires on every window focus event with no debounce. 3-line fix (30s minimum interval ref). VENOM confirmation recommended.
- KRA-LEADS-003 MEDIUM P3: mark/delete controllers re-resolve profileId fresh each time. Fix: cache profileId in useVportLeads after list load (same as profileIdRef pattern already used in useVportNewLeadsCount).
- KRA-LEADS-005 LOW P4: Count fetched separately on initial mount, derivable from list (parallel reads, no wall-clock impact).
- KRA-LEADS-006 INFO PLANNING: Platform-wide ownership gate RPC (1 round trip vs 3). Requires ARCHITECT + CARNAGE + VENOM. Planning horizon.

Security constraint: ALL write operations must always run assertActorOwnsVportActorController cold. No optimization may bypass ownership assertion for mark/delete.

Timing: Route load PASS | Controller chain WARN (at 300ms edge) | Poll tick WARN (exceeds 100ms count budget)
Cache: Only profileIdRef in useVportNewLeadsCount is effective. Everything else is cold-DB.

---

## THOR Gate

Date: 2026-06-04
FINAL DECISION: **BLOCKED**
Output: `outputs/2026/06/04/Thor/2026-06-04_00-00_thor_leads-release-gate.md`

Blocking Reasons:
1. VEN-LEADS-001 HIGH OPEN — Edge Function JWT absent; phishing vector via public anon key
2. VEN-LEADS-004 MEDIUM OPEN — RLS SELECT policy existence unconfirmed; DB must verify
3. SECURITY.md contract violation — ELEKTRA + BLACKWIDOW ran; SECURITY.md never updated (shows NOT RUN for both)
4. BEHAVIOR.md DRAFT — not APPROVED; Behavior Gate 1 blocked
5. AC-DASH-leads-001 untested — TESTREQ-DASH-leads-001 MISSING; non-owner screen denial has no passing test
6. DR. STRANGE THOR Eligibility = 🔴 BLOCKED — coverage 21% below 30% HIGH tier minimum

Caution Items (non-blocking):
- BEH-DASH-leads-306 PARTIAL — source contamination via direct RPC (_contacted value insertable)
- CARNAGE PENDING — traze_provider_lead_contacted constraint migration unexecuted
- Observability MINIMAL — Sentry instrumentation missing on load failure + PII delete paths
- IRON-LEADS-002 HIGH — PII hard DELETE no audit trail; no assigned owner
- SPIDER-MAN PARTIAL — screen/hook integration tests missing

Required Before THOR Re-evaluates:
  [ ] Patch send-lead-confirmation Edge Function JWT validation (VEN-LEADS-001)
  [ ] DB confirms business_card_leads_owner_select RLS SELECT policy (VEN-LEADS-004)
  [ ] LOGAN updates SECURITY.md with ELEKTRA + BLACKWIDOW findings (contract violation)
  [ ] BEHAVIOR.md advanced to APPROVED
  [ ] SPIDER-MAN writes TESTREQ-DASH-leads-001 (non-owner screen mount test)
  [ ] DR. STRANGE re-runs post-resolution

---

## HAWKEYE

Last Run: 2026-06-04
Status: DEGRADED
Output: `outputs/2026/06/04/HAWKEYE/2026-06-04_00-00_hawkeye_leads-endpoint-verification.md`

Verification Summary: 4 PASS | 3 PARTIAL | 1 FAIL
Contract Drift: MINOR (3 endpoints)
Auth Issues: 1 FAIL (Edge Function — VEN-LEADS-001 pre-existing THOR BLOCKER) | 1 documented UI-only guard (accepted)

Findings:
- HAWK-F-001 HIGH FAIL: send-lead-confirmation Edge Function — Bearer presence-only check, no JWT validation. Anon key is public → external callers can invoke directly. THOR BLOCKER. Route: VENOM (patch) + ELEKTRA (providerProfileUrl injection trace).
- HAWK-P-001 MEDIUM PARTIAL: submit_business_card_lead RPC — source field not enum-validated client-side against DB CHECK constraint. Non-conforming source values accepted at submit; fail at mark-contacted with constraint error. Route: CARNAGE (VEN-LEADS-003).
- HAWK-P-001 MEDIUM PARTIAL: p_ip hardcoded null in createVportBusinessCardLeadDAL — IP tracking permanently disabled regardless of RPC capability. Combined with no rate limiting (VEN-LEADS-002). Route: DB.
- HAWK-P-002 MEDIUM PARTIAL: business_card_leads DELETE — hard DELETE of PII with no audit trail. Corroborates LOKI-LEADS-008. Route: VENOM + CARNAGE.
- HAWK-P-003 LOW PARTIAL: /vport/:actorId/dashboard/leads redirect sits outside BlockedVportGuard wrapper. Destination guards catch blocked VPORTs. No data exposure.

New observations:
- source default inconsistency: DAL default = "vport_card"; controller default = "business_card". DAL default unreachable in practice. Route: LOGAN (cleanup).
- providerProfileUrl injection hypothesis: URL sanitized by toSafeUrl before reaching Edge Function. ELEKTRA should trace function email rendering.
- RPC return shape ({ actor_id, lead_id }) not validated — silent contract on function return fields.

THOR Gate Impact: BLOCKED (VEN-LEADS-001 + VEN-LEADS-004 still open from VENOM). HAWK-P-002 adds CAUTION item.

---

## IRONMAN

Last Run: 2026-06-04
Ownership Clarity: PARTIAL
Output: `outputs/2026/06/04/IRONMAN/2026-06-04_00-00_ironman_leads-ownership.md`
OWNERSHIP.md: CREATED (2026-06-04)

Summary: 4 ownership findings. Overall clarity PARTIAL.
- IRON-LEADS-001 MEDIUM: No cross-root data contract for Traffic:conversion consuming the VCSM-owned submit_business_card_lead RPC and send-lead-confirmation EF. Governance change to either resource could silently break Traffic.
- IRON-LEADS-002 HIGH: Hard DELETE of PII (business_card_leads rows) has no audit trail, no soft-delete, no retention policy, and no assigned owner. LOKI-LEADS-008 corroborated. Route to CARNAGE + VENOM.
- IRON-LEADS-003 MEDIUM: ELEK-2026-06-04-001 (HIGH THOR blocker) spans 4 files across VCSM:public + supabase functions. No single owner assigned to drive it to completion. Route to Wolverine for ticket assignment.
- IRON-LEADS-004 LOW: Native parity ownership is MISSING. All 4 native surfaces (inbox, badge, mark/delete, public form) are OPEN QUESTION in BEHAVIOR.md §15. Route to FALCON when native scope is planned.

Confirmed Clear: VCSM:dashboard leads card | VCSM:public vportBusinessCard | Traffic:conversion (within its root)
Confirmed Partial: vport.business_card_leads data governance | RPC + EF cross-root consumer contracts

Open Ownership Questions:
- OQ-IRON-leads-001: Soft-delete vs hard DELETE + audit log (→ CARNAGE)
- OQ-IRON-leads-002: Cross-root data contract authorship (→ ARCHITECT + LOGAN)
- OQ-IRON-leads-003: ELEK-001 fix owner assignment (→ Wolverine)
- OQ-IRON-leads-004: Native parity owner assignment (→ FALCON when scoped)

---

## LOKI

Last Run: 2026-06-04
Status: WATCH
Output: `outputs/2026/06/04/Loki/2026-06-04_00-00_loki_leads-runtime-trace.md`

Findings: 8 runtime findings. Final status: WATCH.
- LOKI-LEADS-001 MEDIUM: 3 duplicate DB reads per page load — screen ownership check (useVportOwnership) and controller ownership check (assertActorOwnsVportActorController) run the same vc.actors + vc.actor_owners queries independently. ~120ms wasted per load. Route: KRAVEN.
- LOKI-LEADS-002 LOW: Profile re-resolved from vport.profiles on every mutation controller call. The fast-count path already uses profileIdRef; mutation controllers do not. Route: KRAVEN.
- LOKI-LEADS-003 MEDIUM: assertActorOwnsVportActorController runs on every 60s poll tick (vc.actors read each time). 2–4 DB reads per minute per open session. Route: KRAVEN.
- LOKI-LEADS-004 MEDIUM: useVportOwnership fires checkVportOwnershipController on every window focus/visibilitychange event with no debounce. Route: KRAVEN.
- LOKI-LEADS-005 HIGH: leads list load failure is completely silent in production — local error state only, no Sentry capture. Route: SENTRY.
- LOKI-LEADS-006 MEDIUM: both count poll catch blocks are empty — DB errors invisible in production. Route: SENTRY.
- LOKI-LEADS-007 MEDIUM: mark-contacted + delete re-throw becomes unhandled rejection via fire-and-forget onClick — may reach Sentry without useful context. Route: SENTRY.
- LOKI-LEADS-008 HIGH: Hard DELETE of PII with no audit trail. No record of what was deleted, when, or by whom. Route: VENOM + CARNAGE + DB.

Read Amplification: 8 DB reads per initial page load (user→vport case). 2–4 reads per 60s poll tick.
Observability Maturity: MINIMAL — zero logging, zero monitoring calls, zero correlation IDs anywhere in the module.

---

## ARCHITECT

Last Run: 2026-06-04
Architecture State: STABLE
Independence: MOSTLY INDEPENDENT

Summary: Full layer stack present (DAL, model, controller, hook, screen). Rule 9 compliant. Ownership gate consistent across all 5 operations. Two open findings: ARC-LEADS-001 (cross-module DAL import — accepted pattern, LOW) and ARC-LEADS-002 (60s polling with ownership DB call — MEDIUM, route to KRAVEN).

Next: Wolverine (BEHAVIOR.md intake) → VENOM (security review — PII module)
