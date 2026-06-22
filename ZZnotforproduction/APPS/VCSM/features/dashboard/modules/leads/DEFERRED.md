# Deferred Items — dashboard/modules/leads

Last Updated: 2026-06-04
Owner: THOR / IRONMAN

---

## DEFER-LEADS-001

Item: Sentry observability instrumentation (LOKI-005, LOKI-006, LOKI-007)
Severity: MEDIUM
Deferred Since: 2026-06-04
Accepted By: UNKNOWN
Reason: UX-contained failures — owners see error messages; engineering visibility gap does not affect data integrity or security in the current release window.
Target Resolution: Next sprint after THOR blockers are cleared
Follow-up: Open implementation tickets for captureMonitoringError on (a) leads load catch block, (b) mark-contacted/delete action catch blocks, (c) count poll catch block.
Related: LOKI-LEADS-005, LOKI-LEADS-006, LOKI-LEADS-007

---

## DEFER-LEADS-002

Item: PII hard DELETE audit trail (LOKI-LEADS-008 / HAWK-P-002 / IRON-LEADS-002)
Severity: HIGH
Deferred Since: 2026-06-04
Accepted By: UNKNOWN
Reason: Feature is THOR BLOCKED for other reasons. Audit trail design (soft-delete vs append-only log) requires CARNAGE + DB input before any migration is authored. No release occurs while other blockers remain, so this does not compound the current risk.
Target Resolution: Must be resolved before THOR re-evaluates — not a true deferral, more of a design-pending item.
Follow-up: CARNAGE must design: (a) soft-delete column on business_card_leads vs (b) separate audit table. VENOM must review the chosen approach. Owner must be assigned via Wolverine.
Related: IRON-LEADS-002, LOKI-LEADS-008, HAWK-P-002

---

## DEFER-LEADS-003

Item: Native parity (IRON-LEADS-004 / BEHAVIOR.md §15)
Severity: LOW
Deferred Since: 2026-06-04
Accepted By: UNKNOWN
Reason: No native release is in scope for this evaluation. PWA-only release is unaffected by native parity gaps.
Target Resolution: When native scope is planned — FALCON must run before any native leads release.
Follow-up: Assign native parity owner. BEHAVIOR.md §15 must be updated with verified native surface status before any native release.
Related: IRON-LEADS-004

---

## DEFER-LEADS-004

Item: Cross-root data contract for Traffic consuming VCSM RPC (IRON-LEADS-001)
Severity: MEDIUM
Deferred Since: 2026-06-04
Accepted By: UNKNOWN
Reason: Traffic:conversion reads the same submit_business_card_lead RPC. No Traffic modification is in scope for this release. The missing data contract is a governance gap, not a runtime failure.
Target Resolution: Before any governance change to submit_business_card_lead RPC or send-lead-confirmation Edge Function.
Follow-up: ARCHITECT + LOGAN must author a cross-root data contract specifying the RPC interface, versioning policy, and notification protocol for changes. Route to IRON-LEADS-001 ticket.
Related: IRON-LEADS-001

---

## DEFER-LEADS-005 (pre-existing)

Item: DEFER-009 — Public lead submission RPC + Edge Function external governance
Severity: MEDIUM
Deferred Since: Pre-2026-06-04
Accepted By: UNKNOWN
Reason: submit_business_card_lead RPC and send-lead-confirmation Edge Function governance sits outside the dashboard leads module source boundary. Tracked separately.
Target Resolution: Linked to VEN-LEADS-001 resolution (THOR-LEADS-BLOCK-001). Closes when Edge Function is patched and DB confirms RPC rate logic.
Related: VEN-LEADS-001, VEN-LEADS-002, LEADS-PUBLIC-RPC-001
