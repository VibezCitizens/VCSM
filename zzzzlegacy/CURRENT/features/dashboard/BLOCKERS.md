# dashboard — BLOCKERS.md
# Last Updated: 2026-06-04
# Ticket: TICKET-DASHBOARD-CONTINUATION-0001
# Status: CURRENT SOURCE OF TRUTH

Active blockers preventing dashboard governance or implementation from completing.

---

## Active Blockers

No active P0 implementation blockers remain after the 2026-06-04 booking RLS policy hardening live verification.

Dashboard remains THOR-blocked by governance and release-readiness coverage: SPIDER-MAN regression coverage, BEHAVIOR approval/sign-off, IRONMAN ownership audit, and KRAVEN performance review.

---

## Resolved Blockers

### BLOCK-DASH-001 — Booking RLS policy hardening
- **Ticket:** TICKET-BOOKING-RPC-001
- **Status:** RESOLVED — RLS LIVE VERIFIED
- **Priority:** P0
- **Resolution:** Live DB output confirms broad authenticated table-level `UPDATE` on `vport.bookings` is gone; authenticated direct UPDATE is column-limited to `status`, `cancelled_at`, `completed_at`, `customer_note`, `internal_note`, and `updated_at`; old broad update policies are absent; narrowed insert/update policies are present. No SECURITY DEFINER functions or RPCs are used.
- **Remaining caution:** Direct reschedule field mutation (`resource_id`, `starts_at`, `ends_at`, `duration_minutes`) is intentionally not DB-granted by the RLS-only design and needs source/product follow-up if owner reschedule remains required.

### BLOCK-DASH-004 — design_* table RLS UNVERIFIED (CARNAGE P0)
- **Ticket:** TICKET-CARNAGE-DESIGN-RLS-001 / live SQL verification 2026-06-04
- **Status:** RESOLVED — LIVE RLS VERIFIED
- **Priority:** P0
- **Resolution:** Live SQL confirmed RLS enabled on `vc.design_documents`, `vc.design_pages`, `vc.design_page_versions`, `vc.design_assets`, `vc.design_exports`, and `vc.design_render_jobs`. Policies are owner-scoped through `vc.actor_owners` or parent `design_documents.owner_actor_id`; render jobs are service-role scoped. Row count, orphan, owner-id, and SQL function probes returned clean results.

### BLOCK-DASH-005 — ELEK-001/002/003 security patches unapplied (THOR BLOCKED)
- **Ticket:** TICKET-ELEK-PATCH-001 / TICKET-DASH-designStudio-ELEK002-PATCH-001
- **Status:** RESOLVED — SOURCE + TEST PASS
- **Priority:** P0
- **Resolution:** ELEK-001 flyerBuilder, ELEK-002 designStudio, and ELEK-003 vportOwnerStats are patched in current source with focused regression tests passing.

### BLOCK-DASH-006 — BEHAVIOR.md universally absent (THOR BEHAVIOR GATE BLOCKED)
- **Ticket:** TICKET-BEHAVIOR-INTAKE-001
- **Status:** RESOLVED — MODULE CONTRACTS PRESENT
- **Priority:** P1
- **Resolution:** Dashboard module BEHAVIOR.md contracts are present in DRAFT/REVIEWED state. THOR still requires approval/sign-off and SPIDER-MAN anchoring before release.

---

## Governance Blockers

| Governance File | Blocked By | Unblocks When |
|---|---|---|
| SECURITY.md | VENOM not yet run post-contract | VENOM + ELEKTRA run after SETTINGS-ARCH-001 |
| TESTS.md (full) | SPIDER-MAN not yet run | After SETTINGS-ARCH-001 implementation |
| PERFORMANCE.md (full) | KRAVEN not yet run | When performance audit is scheduled |
| OWNERSHIP.md (full) | IRONMAN not yet run | When ownership audit is scheduled |
