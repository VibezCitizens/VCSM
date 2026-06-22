# dashboard — PERFORMANCE.md
# Last Updated: 2026-06-02
# Ticket: TICKET-0008
# Performance Status: UNKNOWN — KRAVEN not yet run
# Status: CURRENT SOURCE OF TRUTH

Performance posture for the dashboard feature.
KRAVEN has not run. No performance findings are recorded.

---

## Performance Status

**Overall:** UNKNOWN / PENDING
**Reason:** KRAVEN has not audited dashboard. No bottleneck analysis, query cost analysis, or render profiling has been conducted.

---

## Known Performance Context (from architecture evidence)

The following is structural context only — not a findings report:

| Area | Notes |
|---|---|
| Schedule card | Coordinator pattern adds one delegation layer — negligible overhead |
| Booking domain reads | Routed through bookings public index — query cost unknown |
| Dashboard card system | 12 independent cards — render performance not measured |
| DAL layer | No N+1 analysis has been run on any dashboard card |

---

## Pending

KRAVEN has not run on dashboard.

When KRAVEN runs, this file must be updated with:
- Query cost findings per card
- N+1 detection results
- Render profiling results
- Identified bottlenecks
- Recommended fixes

Recommended: run KRAVEN after SETTINGS-ARCH-001 and VENOM complete, as part of the next full governance pass on dashboard.
