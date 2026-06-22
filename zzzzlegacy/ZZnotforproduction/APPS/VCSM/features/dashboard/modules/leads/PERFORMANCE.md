# Performance Posture — leads

Last Updated: 2026-06-04
Maintained By: KRAVEN
LOKI Evidence: PRESENT (2026-06-04)
Overall Status: WATCH

---

## Summary

The leads module has strong security posture and meets timing budgets under normal conditions. The primary performance concerns are structural: a duplicate ownership read waterfall on page load (3 wasted DB reads, ~120ms), and a polling architecture that fires a full ownership assertion (2–4 DB reads) every 60 seconds for every VPORT owner in the platform — not just those on the leads page. At scale, the poll is the dominant DB load source.

---

## Open Findings

| Finding | Severity | Status | ROI | Summary |
|---|---|---|---|---|
| KRA-LEADS-002 | HIGH | OPEN | EXTREME | Poll POLL_MS=60s fires assertActorOwnsVportActorController (2–4 DB reads) every 60s for every VPORT owner with VCSM open. At 1,000 concurrent owners: ~210,000 DB reads/hour. **P0 fix: change POLL_MS to 180,000 — 1 line, zero security tradeoff, 67% reduction.** |
| KRA-LEADS-001 | HIGH | OPEN | HIGH | Screen gate (useVportOwnership) and controller (listVportLeadsController) both run assertActorOwnsVportActorController independently on page load. 3 duplicate DB reads (~120ms) wasted on every navigation. Requires VENOM review for any READ-path optimization. |
| KRA-LEADS-004 | MEDIUM | OPEN | MODERATE | useVportOwnership fires checkVportOwnershipController on every window focus/visibility event with no debounce. Rapid tab-switching → DB burst. Fix: add 30s minimum-interval ref (3 lines). VENOM confirmation recommended. |
| KRA-LEADS-003 | MEDIUM | OPEN | MODERATE | mark/delete controllers call resolveProfileId fresh each time (~40ms per action). useVportLeads should cache the profileId after initial list load (same pattern as profileIdRef in useVportNewLeadsCount). |
| KRA-LEADS-005 | LOW | OPEN | MODERATE | On page load, initial count is fetched separately despite being derivable from the list. 4–5 extra DB reads (parallel, not wall-clock). |
| KRA-LEADS-006 | INFO | PLANNING | EXTREME (platform) | Platform-wide: assertActorOwnsVportActorController issues 3 serial DB reads per call (9 call sites). A single `validate_actor_ownership()` DB function would reduce to 1 round trip. Requires ARCHITECT + CARNAGE + VENOM + BLACKWIDOW. |

---

## Query Amplification

| Path | DB Reads | Primary Records | Amplification | Status |
|---|---:|---:|---:|---|
| Page load (user→vport, N=1) | 8 | 1 | 8.0 | HIGH |
| Page load (N=20) | 8 | 20 | 0.4 | HEALTHY |
| 60s poll tick | 2–4 | 1 integer | 2–4 | SEVERE |
| Mark-contacted | 4–5 | 1 row | 4–5 | SEVERE |
| Delete | 4–5 | 1 row | 4–5 | SEVERE |
| Window focus re-check | 1–3 | bool | ∞ | SEVERE (for burst) |

---

## Cache Efficiency

| Cache | Status | Notes |
|---|---|---|
| profileIdRef (count poll) | EFFECTIVE | Already correct in useVportNewLeadsCount |
| profileId (mutations) | BYPASSED | KRA-LEADS-003 — re-fetched on every mark/delete |
| Ownership assertion result | BYPASSED | KRA-LEADS-001 — screen gate result not shared with controller |
| Focus re-check interval | BYPASSED | KRA-LEADS-004 — no debounce |
| Leads list | BYPASS (by design) | Full re-fetch on every mount |
| Actor identity | EFFECTIVE | useIdentity context |

---

## Timing Budget

| Area | Status | Notes |
|---|---|---|
| Route/screen load (~380–450ms) | PASS | Within 1500ms budget |
| Controller chain (~250–320ms) | WARN | At edge of 300ms budget |
| Poll tick (~110–160ms) | WARN | Exceeds 100ms count budget |
| Single DB read (~40–80ms) | PASS | Within 150ms budget |

---

## Scale Model (Poll DB Cost)

| Concurrent VPORT Owners | Current (60s poll) | After KRA-002 Option A (180s) | After KRA-002 Option C (180s + 10min TTL) |
|---:|---:|---:|---:|
| 100 | 12,000–24,000/hr | 4,000–8,000/hr | ~1,200/hr |
| 1,000 | 120,000–240,000/hr | 40,000–80,000/hr | ~12,000/hr |

---

## Priority Order

1. **KRA-LEADS-002 Option A** — change `POLL_MS` to `180_000` (1-line, zero risk, immediate)
2. **KRA-LEADS-004** — add 30s focus debounce (3 lines, VENOM confirmation)
3. **KRA-LEADS-003** — cache profileId in useVportLeads after list load (VENOM low-priority review)
4. **KRA-LEADS-001** — eliminate screen+controller duplicate ownership read (requires VENOM review for READ path)
5. **KRA-LEADS-005** — derive initial count from list (low priority, parallel reads)
6. **KRA-LEADS-006** — platform-wide ownership RPC (planning horizon, ARCHITECT + CARNAGE)

---

## Security Constraint (Non-Negotiable)

All WRITE operations (markVportLeadContactedController, deleteVportLeadController) must
ALWAYS run assertActorOwnsVportActorController cold — no cache, no shortcut, no TTL.
No optimization may skip ownership assertion for any write path.
