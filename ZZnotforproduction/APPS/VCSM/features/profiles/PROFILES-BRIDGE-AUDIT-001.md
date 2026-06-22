# PROFILES-BRIDGE-AUDIT-001 — VPORT Bridge Audit & Extraction Readiness

```
[PROFILES-BRIDGE-AUDIT-001] VPORT bridge audit before extraction
Status: Complete (READ ONLY — AUDIT ONLY, no code changes)
Priority: P2
Type: ARCHITECTURE
App: VCSM
Authority doc for: PROFILES-EXTRACT-VPORT-001
Date: 2026-06-08
```

> **Headline: no hard bridge blockers for VPORT extraction.** Two cleanup wins surface
> immediately — **6 of 7 gas bridges are DEAD (0 consumers)**, and the **`ownership.adapter`
> is a pointless round-trip** (consumed only by vportDashboard to reach its own symbol back
> through profiles). The remaining live bridges (gas-view, team, owner-stats, booking) are
> **facades** over vportDashboard-owned capabilities surfaced on the public profile. The real
> structural note is a **bidirectional profiles-vport ↔ vportDashboard coupling** (12 fwd / 23
> rev) — adapter-mediated, a *soft* design concern, not a hard blocker.

---

## Deliverable A — Bridge Inventory

| Bridge | Located In (source) | Actual Impl Owner | Consumers | Purpose |
|---|---|---|---|---|
| `adapters/kinds/vport/ownership.adapter.js` | profiles | **vportDashboard** (→ authorization, per OWN-001) | **6 — all in vportDashboard** (gasprices ctrls + test) | re-export `checkVportOwnershipController` |
| `adapters/kinds/vport/screens/gas/VportGasPricesView.adapter.js` | profiles | vportDashboard | 1 (`tabs/gas/VportGasTab.jsx`) | public gas view |
| `adapters/kinds/vport/hooks/gas/{useVportGasPrices,useSubmitFuelPriceSuggestion,useOwnerPendingSuggestions}.adapter.js` | profiles | vportDashboard | **0 — DEAD** | (orphaned in SPLIT-001) |
| `adapters/kinds/vport/screens/gas/components/{GasPricesPanel,GasStates,OwnerPendingSuggestionsList}.adapter.js` | profiles | vportDashboard | **0 — DEAD** | (orphaned) |
| `hooks/useVportOwnerQuickStats.js` | profiles | vportDashboard (`useOwnerQuickStats`) | 1 (`screens/barbershop/VportBarberShopOwnerBand.jsx`) | owner KPI band |
| `screens/barbershop/VportBarberShopTeamView.jsx` (`useVportTeam`) | profiles | vportDashboard | 1 (`tabs/team/VportTeamTab.jsx`) | team roster |
| `screens/booking/hooks/useVportPublicBooking.js` (`useVportBookingOps`, `mapAvailabilityRule`) | profiles | vportDashboard + booking engine | 1 (`screens/booking/view/VportPublicBookingFlow.jsx`) | availability + booking ops |
| `screens/barbershop/VportBarberShopBookingView.jsx` (`VportDashboardScheduleScreen`) | profiles | vportDashboard | 1 (barbershop booking) | owner schedule UI |
| booking `assertActorOwnsVportActorController` | booking | **authorization** (OWN-001 delegate) | **13** profiles vport controllers (+ tests) | server ownership gate |

Direction counts: **profiles-vport → vportDashboard = 12 sites** (6 of which are dead/round-trip);
**vportDashboard → profiles-vport = 23 sites** (vport profile-data adapters + the ownership round-trip ×6).

---

## Deliverable B — Ownership Classification

| Bridge | Class | Evidence |
|---|---|---|
| `ownership.adapter` (profiles) | **LEAK** | Re-exports a **vportDashboard** symbol and is consumed **only by vportDashboard** → `vportDashboard → profiles/ownership.adapter → vportDashboard.checkVportOwnership`. A pointless cross-feature round-trip; profiles vport controllers don't even use it (they use booking's assert). |
| 6 dead gas adapters | **COMPATIBILITY remnant (dead)** | 0 consumers; orphaned when the umbrella was deleted in SPLIT-001. |
| `VportGasPricesView.adapter` (gas) | **FACADE** | Live (1 consumer); surfaces dashboard-owned gas UI on the public profile via adapter. |
| owner-stats / team / booking-ops / schedule | **FACADE** | Public profile legitimately renders dashboard-owned capabilities; each via the dashboard adapter. |
| booking `assertActorOwnsVportActorController` ×13 | **COMPATIBILITY** | Thin delegate to authorization (OWN-001). Should repoint to `authorization.adapter`. |
| profiles-vport ↔ vportDashboard (whole) | **soft EXTRACTION concern** (not a hard EXTRACTION BLOCKER) | Bidirectional but fully adapter-mediated; reflects two views (owner dashboard + public profile) of one VPORT domain. |

No bridge is a **hard EXTRACTION BLOCKER**.

---

## Deliverable C — Runtime Trace (behavior vs forwarding)

| Bridge | Trace | Adds behavior? |
|---|---|---|
| `ownership.adapter` | consumer (vportDashboard) → profiles re-export → `vportDashboard.checkVportOwnership` → booking → **authorization** → `actor_owners` | **Pure forwarding** (`export … from`) |
| gas adapters | consumer → profiles re-export → `vportDashboard.adapter` | **Pure forwarding** |
| `useVportOwnerQuickStats` | OwnerBand → this hook (wraps) → `vportDashboard.useOwnerQuickStats` | **Adds behavior** (profiles hook composes) |
| `useVportPublicBooking` | PublicBookingFlow → this hook (wraps) → `vportDashboard.useVportBookingOps` + `mapAvailabilityRule` + booking engine | **Adds behavior** (orchestration) |
| `VportBarberShopTeamView` / `…BookingView` | tab → profiles screen (wraps) → `vportDashboard.{useVportTeam, ScheduleScreen}` | **Adds behavior** (composition) |
| booking `assert…` ×13 | profiles ctrl → booking wrapper → `authorization.assertActorOwnsActorController` | **Pure forwarding** (delegate) |

---

## Deliverable D — Extraction Impact (per bridge)

| Bridge | Can VPORT extract without it? | Action |
|---|---|---|
| `ownership.adapter` | Yes | **MUST RETIRE** (round-trip; repoint vportDashboard's 6 consumers to its own check / authorization, then delete) |
| 6 dead gas adapters | Yes | **MUST RETIRE** (delete; 0 consumers) |
| `VportGasPricesView.adapter` | Yes (becomes vport→vportDashboard adapter dep) | **MAY STAY** (or relocate with gas capability) |
| owner-stats / team / booking / schedule | Yes (adapter deps) | **MAY STAY** (facades) — pending capability-ownership decision |
| booking `assert…` ×13 | Yes | **MUST BE REPOINTED** → `authorization.adapter` (OWN-001 follow-through) |

---

## Deliverable E — Consolidation Opportunities

| Bridge | Action | Risk | Blast Radius |
|---|---|---|---|
| 6 dead gas adapters (`hooks/gas/*` ×3, `screens/gas/components/*` ×3) | **DELETE** | LOW | 0 consumers → delete 6 files |
| `ownership.adapter` round-trip | **RETIRE** — repoint 6 vportDashboard gasprices consumers to vportDashboard's own `checkVportOwnership` (or `authorization.adapter`), then delete profiles file | LOW–MED | 6 vportDashboard files + 1 delete |
| booking `assert…` ×13 | **REPOINT** → `authorization.adapter` | LOW | 13 profiles files (mechanical import swap) |
| `VportGasPricesView` + owner-stats + team + booking facades | **KEEP** (single-consumer facades; legitimate dashboard-capability surfacing) | — | — |

Duplicate/dead: 6 gas adapters (dead) + ownership.adapter (redundant round-trip). Single-consumer:
all live facades (1 each). Pure pass-through: ownership.adapter + gas adapters.

---

## Deliverable F — Extraction Readiness (ordered first actions)

If VPORT extraction started today, act in this order (all LOW-risk cleanup; none are gates):

1. **Delete the 6 dead gas adapters** — zero consumers, zero risk.
2. **Retire `ownership.adapter`** — repoint vportDashboard's 6 gasprices consumers to its own `checkVportOwnership` (or authorization), delete the profiles round-trip file.
3. **Repoint the 13 booking-`assert` sites → `authorization.adapter`** (OWN-001 follow-through; makes the canonical authority explicit and drops the booking-wrapper indirection).
4. **Capability-ownership decision** for the 4 live facades (gas-view, team, owner-stats, booking): confirm they stay **vportDashboard-owned**, consumed by the public vport profile via adapter. This formalizes the direction and resolves the bidirectional coupling into "public-profile → vportDashboard" (one-way for these capabilities).

After 1–4, profiles-vport's outward bridges reduce to clean, one-way, adapter-mediated capability
consumption — extraction-ready.

---

## Deliverable G — Final Recommendation (Keep / Retire / Repoint / Extract)

| Bridge | Recommendation |
|---|---|
| `adapters/kinds/vport/ownership.adapter.js` | **RETIRE** |
| `hooks/gas/*` ×3 + `screens/gas/components/*` ×3 (dead) | **RETIRE (delete)** |
| `screens/gas/VportGasPricesView.adapter.js` | **KEEP** (facade; or relocate with gas) |
| `useVportOwnerQuickStats` (owner-stats) | **KEEP** (facade) |
| `VportBarberShopTeamView` / `useVportTeam` (team) | **KEEP** (facade) |
| `useVportPublicBooking` / `VportBarberShopBookingView` (booking) | **KEEP** (facade) |
| booking `assertActorOwnsVportActorController` ×13 | **REPOINT → authorization** |

**Final bridge map for PROFILES-EXTRACT-VPORT-001:**
- **Authority/ownership:** canonical = authorization (OWN-001). Retire the profiles `ownership.adapter` round-trip; repoint booking-assert sites to authorization. **No authority relocation.**
- **Dashboard capabilities (gas/team/owner-stats/booking):** owned by vportDashboard; public vport profile consumes them as one-way adapter facades. Keep; optionally relocate if a future ticket moves a capability.
- **Dead weight:** delete 6 orphaned gas adapters.
- **Bidirectional coupling:** real but adapter-mediated; resolved (made one-way for capabilities) by step F.4. **Not a hard blocker** — extraction can proceed with the above cleanup, not before it.

---

## Constraints honored
No code moved/renamed/deleted; no ownership migration; no VPORT restructure. Audit + evidence only.

### DB AUDIT NOTE
```
- DB object: vc.actor_owners (behind the ownership bridges). Already canonical in authorization (OWN-001).
- Risk: none introduced. Retiring ownership.adapter + repointing booking-assert are app-layer call-site
  changes (no schema/RLS/RPC change). Gas/team/booking facades touch no new DB surface here.
- Suggested later SQL review: none required for this audit; revisit under EXTRACT-VPORT if a capability relocates.
```

---

*Authority document for PROFILES-EXTRACT-VPORT-001. Audit only — no implementation.*
