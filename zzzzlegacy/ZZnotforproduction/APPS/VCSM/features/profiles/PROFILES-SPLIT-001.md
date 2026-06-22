# PROFILES-SPLIT-001 — VPORT Adapter Relocation Review

```
[PROFILES-SPLIT-001] VPORT Adapter Relocation — Implementation Plan
Status: Complete (READ ONLY — no code, no moves, no import updates)
Priority: P1
Type: ARCHITECTURE
App: VCSM
Target: apps/VCSM/src/features/profiles/adapters/kinds/vport/**  (21 files)
Builds on: PROFILES-SPLIT-000
Date: 2026-06-08
```

> **Verdict: PARTIAL GO.** **12 of 21** adapters are pure VPORT passthroughs, safe to
> relocate now. **8** are bridges into `vportDashboard` (1 ownership + 7 gas) that must
> stay until the ownership/gas ownership question is decided. **1** umbrella
> (`vportProfile.adapter.js`) has **zero external consumers** — effectively dead, handle
> last (update-or-delete). Total blast radius for the safe set = **19 external import
> rewrites** across `vportDashboard` (15), `vport` (4 incl. internal hooks), `flyerBuilder`
> (1). **Important:** this relocation is *topological hygiene, not violation reduction* —
> see Deliverable F.

---

## Deliverable A — Adapter Inventory (all 21)

| File (`adapters/kinds/vport/…`) | Purpose | Import Target | Consumers | Classification |
|---|---|---|---|---|
| `config/vportTypes.config.adapter.js` | `export *` vport type groups/resolver | `kinds/vport/config/vportTypes.config` | 4 | **PURE_VPORT_PASSTHROUGH** |
| `vportProfiles.adapter.js` | 6 vport hooks (locksmith/portfolio/barbershop publish) | `kinds/vport/hooks/*` | 3 | **PURE_VPORT_PASSTHROUGH** |
| `hooks/useVportPublicDetails.adapter.js` | `useVportDashboardDetails` | `kinds/vport/hooks/useVportDashboardDetails` | 3 | **PURE_VPORT_PASSTHROUGH** |
| `services.adapter.js` | services controller + hook | `kinds/vport/controller+hooks/services` | 1 | **PURE_VPORT_PASSTHROUGH** |
| `exchange.adapter.js` | publish-rate hook + rate mapper | `kinds/vport/hooks/exchange + model/rates` | 1 | **PURE_VPORT_PASSTHROUGH** |
| `locksmith.adapter.js` | 2 locksmith controllers | `kinds/vport/controller/locksmith/*` | 1 | **PURE_VPORT_PASSTHROUGH** |
| `hooks/services/useUpsertVportServices.adapter.js` | upsert services hook | `kinds/vport/hooks/services/*` | 1 | **PURE_VPORT_PASSTHROUGH** |
| `hooks/rates/useUpsertVportRate.adapter.js` | upsert rate hook | `kinds/vport/hooks/rates/*` | 1 | **PURE_VPORT_PASSTHROUGH** |
| `screens/services/view/VportServicesView.adapter.js` | services view | `kinds/vport/screens/services/view/*` | 1 | **PURE_VPORT_PASSTHROUGH** |
| `screens/review/VportReviewsView.adapter.js` | reviews view | `kinds/vport/screens/review/*` | 1 | **PURE_VPORT_PASSTHROUGH** |
| `screens/rates/view/VportRatesView.adapter.js` | rates view | `kinds/vport/screens/rates/view/*` | 1 | **PURE_VPORT_PASSTHROUGH** |
| `screens/rates/components/VportRateEditorCard.adapter.js` | rate editor card | `kinds/vport/screens/rates/components/*` | 1 | **PURE_VPORT_PASSTHROUGH** |
| `ownership.adapter.js` | `checkVportOwnershipController` | **`@/features/vportDashboard/adapters/vportDashboard.adapter`** | 6 | **OWNERSHIP_BRIDGE** |
| `hooks/gas/useVportGasPrices.adapter.js` | gas prices hook | **vportDashboard.adapter** | 0 ext (umbrella only) | **GAS_BRIDGE** |
| `hooks/gas/useOwnerPendingSuggestions.adapter.js` | pending suggestions hook | **vportDashboard.adapter** | 0 ext (umbrella only) | **GAS_BRIDGE** |
| `hooks/gas/useSubmitFuelPriceSuggestion.adapter.js` | submit fuel suggestion hook | **vportDashboard.adapter** | 0 ext (umbrella only) | **GAS_BRIDGE** |
| `screens/gas/VportGasPricesView.adapter.js` | gas prices view | **vportDashboard.adapter** | 1 (internal `VportGasTab`) | **GAS_BRIDGE** |
| `screens/gas/components/GasPricesPanel.adapter.js` | gas panel | **vportDashboard.adapter** | 0 | **GAS_BRIDGE** |
| `screens/gas/components/GasStates.adapter.js` | gas states | **vportDashboard.adapter** | 0 | **GAS_BRIDGE** |
| `screens/gas/components/OwnerPendingSuggestionsList.adapter.js` | suggestions list | **vportDashboard.adapter** | 0 | **GAS_BRIDGE** |
| `vportProfile.adapter.js` (singular) | umbrella re-export of all above | mixed (passthroughs + bridges) | **0 external** | **UNKNOWN / DEAD UMBRELLA** |

Totals: **12 PURE_VPORT_PASSTHROUGH · 1 OWNERSHIP_BRIDGE · 7 GAS_BRIDGE · 1 dead umbrella = 21.**

---

## Deliverable B — Consumer Analysis (by feature)

| Adapter | profiles (internal) | vportDashboard | vport | flyerBuilder | Total ext sites |
|---|---|---|---|---|---|
| `config/vportTypes.config.adapter` | — | 1 (dashboardViewByVportType.model) | 3 (CreateVportForm, getVportServiceCatalog.ctrl, submitCreateVport.ctrl) | — | **4** |
| `vportProfiles.adapter` | — | 3 (calendar, portfolio, locksmith dashboards) | — | — | **3** |
| `hooks/useVportPublicDetails.adapter` | — | 2 (VportDashboardScreen, VportSettingsScreen) | — | 1 (VportActorMenuFlyerView) | **3** |
| `services.adapter` | — | 1 (useQuickBookingModal) | — | — | **1** |
| `exchange.adapter` | — | 1 (useExchangeRateEditor) | — | — | **1** |
| `locksmith.adapter` | — | 1 (usePortfolioItemSubmit) | — | — | **1** |
| `hooks/services/useUpsertVportServices.adapter` | — | — | 1 (useCreateVport) | — | **1** |
| `hooks/rates/useUpsertVportRate.adapter` | — | 1 (useExchangeRateEditor) | — | — | **1** |
| `screens/services/view/VportServicesView.adapter` | — | 1 (VportDashboardServicesScreen) | — | — | **1** |
| `screens/review/VportReviewsView.adapter` | — | 1 (VportDashboardReviewScreen) | — | — | **1** |
| `screens/rates/view/VportRatesView.adapter` | — | 1 (VportDashboardExchangeScreen) | — | — | **1** |
| `screens/rates/components/VportRateEditorCard.adapter` | — | 1 (VportDashboardExchangeScreen) | — | — | **1** |
| **SAFE SUBTOTAL** | **0** | **15** | **4** | **1** | **19** |
| `ownership.adapter` | — | 6 (4 gasprices ctrls + 1 publish ctrl + 1 test) | — | — | 6 (BRIDGE) |
| `screens/gas/VportGasPricesView.adapter` | 1 (VportGasTab) | — | — | — | 1 (BRIDGE) |
| other gas adapters (6) | — | — | — | — | 0 |
| `vportProfile.adapter` (umbrella) | — | — | — | — | 0 (dead) |

**Actual blast radius (safe set): 19 external import statements**, concentrated in
`vportDashboard` (15). No internal-profiles consumer depends on any safe-set adapter — meaning
the safe set can move without touching `kinds/vport` or `kinds/citizen` at all.

---

## Deliverable C — Safe Relocation Set

Criteria (ALL must hold): imports only `kinds/vport/*` · no ownership logic · no gas logic ·
no `vportDashboard` bridge · not an architectural-boundary dependency.

**SAFE_TO_MOVE (12) — verified by import-target grep, not assumed:**

```
config/vportTypes.config.adapter.js                       ✓ export * from kinds/vport/config
vportProfiles.adapter.js                                  ✓ kinds/vport/hooks/*
hooks/useVportPublicDetails.adapter.js                    ✓ kinds/vport/hooks/useVportDashboardDetails
services.adapter.js                                       ✓ kinds/vport/controller+hooks/services
exchange.adapter.js                                       ✓ kinds/vport/hooks/exchange + model/rates
locksmith.adapter.js                                      ✓ kinds/vport/controller/locksmith
hooks/services/useUpsertVportServices.adapter.js          ✓ kinds/vport/hooks/services
hooks/rates/useUpsertVportRate.adapter.js                 ✓ kinds/vport/hooks/rates
screens/services/view/VportServicesView.adapter.js        ✓ kinds/vport/screens/services
screens/review/VportReviewsView.adapter.js                ✓ kinds/vport/screens/review
screens/rates/view/VportRatesView.adapter.js              ✓ kinds/vport/screens/rates
screens/rates/components/VportRateEditorCard.adapter.js   ✓ kinds/vport/screens/rates
```

> Note on `locksmith.adapter` and `useVportPublicDetails.adapter`: both confirmed to import
> **only** from `kinds/vport/*` (not vportDashboard) — the dashboard bridge for locksmith/gas
> lives in *different* adapters. Verified, included in SAFE set.

---

## Deliverable D — Bridge Audit

| Adapter | External dep | Direction | Why it exists | Removable? | Movable? | Future owner |
|---|---|---|---|---|---|---|
| `ownership.adapter.js` | `vportDashboard.adapter` → `checkVportOwnershipController` | **profiles ← vportDashboard** | Exposes VPORT ownership verification (its own header comment: *"Do not import …directly from dashboard — use this adapter"*) | No — 6 consumers depend on it | No — would just relocate the same external dep | **vportDashboard** (or a shared `identity/ownership` engine) — NOT profiles |
| `screens/gas/VportGasPricesView.adapter.js` | `vportDashboard.adapter` | profiles ← vportDashboard | Lets `VportGasTab` render the dashboard's gas view inside the public profile | Not yet | No (re-locating keeps the cross-feature dep) | vportDashboard |
| `hooks/gas/*` (3) + `screens/gas/components/*` (3) | `vportDashboard.adapter` | profiles ← vportDashboard | Re-export surface for gas; currently reached only via the dead umbrella | **Likely deletable** (0 external consumers) | n/a | vportDashboard |

**Explicit answer — does profiles OWN this logic, or merely expose another feature's?**
**Profiles merely EXPOSES it.** Every bridge adapter is `export { … } from
"@/features/vportDashboard/adapters/vportDashboard.adapter"`. The owning feature is
**vportDashboard**. These adapters are inversion points where the *public profile* surface
borrows *dashboard*-owned capabilities (ownership checks, gas UI). That inversion is the
HIGH-risk architectural smell (gas/ownership logic owned by a dashboard feature but surfaced
through profiles) — it is **out of scope for SPLIT-001** and must be resolved by a separate
ownership-relocation decision before VPORT can fully extract.

---

## Deliverable E — Path Rewrite Estimate (SAFE_TO_MOVE only)

Recommended target: `profiles/adapters/kinds/vport/X` → `profiles/kinds/vport/adapters/X`
(co-locate adapters with the domain they wrap, inside the vport zone).

| Current path | Recommended path | Consumers | Import rewrites |
|---|---|---|---|
| `adapters/kinds/vport/config/vportTypes.config.adapter` | `kinds/vport/adapters/config/vportTypes.config.adapter` | 4 | 4 |
| `adapters/kinds/vport/vportProfiles.adapter` | `kinds/vport/adapters/vportProfiles.adapter` | 3 | 3 |
| `adapters/kinds/vport/hooks/useVportPublicDetails.adapter` | `kinds/vport/adapters/hooks/useVportPublicDetails.adapter` | 3 | 3 |
| `adapters/kinds/vport/services.adapter` | `kinds/vport/adapters/services.adapter` | 1 | 1 |
| `adapters/kinds/vport/exchange.adapter` | `kinds/vport/adapters/exchange.adapter` | 1 | 1 |
| `adapters/kinds/vport/locksmith.adapter` | `kinds/vport/adapters/locksmith.adapter` | 1 | 1 |
| `adapters/kinds/vport/hooks/services/useUpsertVportServices.adapter` | `kinds/vport/adapters/hooks/services/…` | 1 | 1 |
| `adapters/kinds/vport/hooks/rates/useUpsertVportRate.adapter` | `kinds/vport/adapters/hooks/rates/…` | 1 | 1 |
| `adapters/kinds/vport/screens/services/view/VportServicesView.adapter` | `kinds/vport/adapters/screens/services/…` | 1 | 1 |
| `adapters/kinds/vport/screens/review/VportReviewsView.adapter` | `kinds/vport/adapters/screens/review/…` | 1 | 1 |
| `adapters/kinds/vport/screens/rates/view/VportRatesView.adapter` | `kinds/vport/adapters/screens/rates/view/…` | 1 | 1 |
| `adapters/kinds/vport/screens/rates/components/VportRateEditorCard.adapter` | `kinds/vport/adapters/screens/rates/components/…` | 1 | 1 |
| **TOTAL** | | | **19 external** |

**Plus** the dead umbrella `vportProfile.adapter.js` re-exports ~8 of these by their old paths
→ either update those 8 lines or delete the file (0 external consumers makes **delete** the
clean choice). Net rewrites: **19 (delete umbrella)** or **~27 (keep umbrella)**.

---

## Deliverable F — Boundary Rule Impact (the key nuance)

Under the SPLIT-000 zone mapping, `adapters/kinds/vport/**` is **already classified
vport-zone**. A vport-zone file importing `kinds/vport/*` is **allowed**. Therefore:

| Question | Answer |
|---|---|
| WARN violations removed by relocating SAFE set | **0** |
| WARN violations remaining | All current ones — unchanged |
| Real blockers remaining after SPLIT-001 | `getProfileView.controller.js`, `useProfilesOps.js` (both untouched here) |

**SPLIT-001 does NOT reduce violations and does NOT unblock ERROR mode.** Its value is:
1. Removes the special-case `adapters/kinds/vport = vport` path mapping from the ESLint config → the rule gets simpler and the vport zone becomes a single contiguous subtree.
2. Restores topological symmetry (adapters live beside the domain they wrap).
3. Shrinks the eventual VPORT-extraction diff (adapters already inside `kinds/vport/`).

Cross-reference of the five tracked items after SPLIT-001:

| Item | State after SPLIT-001 |
|---|---|
| `getProfileView.controller.js` (shared→citizen) | **Untouched — still a blocker** (SPLIT-002) |
| `useProfilesOps.js` (shared→vport) | **Untouched — still a blocker** (SPLIT-002) |
| friends subtree | Untouched (citizen extraction) |
| ownership bridge | **Stays** — out of scope (OWN-01) |
| gas bridge | **Stays** (or delete dead gas adapters) |

> Implication: keep the ESLint rule in **WARN** through SPLIT-001. ERROR mode is gated by
> SPLIT-002, not this ticket.

---

## Deliverable G — Migration Order Validation

Proposed order:
1. Relocate SAFE_TO_MOVE → 2. Update imports → 3. Keep bridges → 4. Verify no breakage →
5. Address shared leaks → 6. Enforce ERROR.

**ACCEPT — with two refinements:**

| # | Step | Refinement |
|---|---|---|
| 1 | Relocate the 12 SAFE adapters | Do single-consumer ones first (build confidence), multi-consumer last |
| 2 | Update the 19 external imports | Mechanical; one adapter at a time, run build between each |
| 2b | **NEW: handle dead umbrella** `vportProfile.adapter.js` | Delete it (0 external consumers) — or its stale paths dangle. Must happen in this ticket, not later. |
| 3 | Keep ownership + gas bridges in place | unchanged |
| 4 | Verify no consumer breakage | Build + run vportDashboard/vport/flyerBuilder test suites |
| 5 | Address shared leaks (SPLIT-002) | unchanged |
| 6 | Enforce ERROR | unchanged — gated by step 5, not this ticket |

Reason for refinements: the umbrella is a silent breakage trap (it imports the moved adapters
by old path); and SPLIT-001 alone never reaches ERROR mode, so the order must keep WARN.

---

## Deliverable H — Risk Register

| ID | Severity | Category | Risk |
|---|---|---|---|
| OWN-01 | **CRITICAL** | Ownership Risk | `ownership.adapter` exposes vportDashboard-owned `checkVportOwnershipController` (6 consumers incl. 5 gas-price write controllers). Must NOT move; needs ownership-relocation decision. Bridges VPORT write-authority across features. |
| PATH-01 | **HIGH** | Path Rewrite Risk | 19 external imports, 15 in vportDashboard. A missed rewrite = build break. Mitigate: move one adapter at a time, build between each. |
| UMBRELLA-01 | **HIGH** | Adapter Risk | `vportProfile.adapter.js` re-exports moved adapters by old path; 0 external consumers makes it invisible-until-broken. Delete in-ticket. |
| GAS-01 | **MEDIUM** | Gas Risk | 7 gas adapters bridge to vportDashboard; `VportGasPricesView.adapter` has 1 internal consumer (`VportGasTab`), the other 6 are reachable only via the dead umbrella. Keep `VportGasPricesView`; the other 6 are likely deletable (confirm before removal). |
| TEST-01 | **MEDIUM** | Test Risk | `vportDashboard/.../submitFuelPriceSuggestion.controller.test.js` mocks `ownership.adapter` by path (line 98) + imports it (line 115). If ownership ever moves, this mock path breaks. Not in SAFE set, so unaffected by SPLIT-001 — flagged for SPLIT-OWN. |
| ADAPTER-02 | **LOW** | Adapter Risk | Relocation is pure re-export path change; no logic touched. Low intrinsic risk per file. |
| RULE-00 | **INFO** | — | SPLIT-001 removes 0 WARN violations; it is hygiene, not enforcement progress. ERROR mode remains gated by SPLIT-002. |

---

## Deliverable I — Final Verdict

```
Immediately movable adapters : 12 (all PURE_VPORT_PASSTHROUGH)
Must NOT move                : 8 bridges (1 ownership + 7 gas) + 1 dead umbrella (delete, don't move)
Exact blast radius           : 19 external import rewrites (vportDashboard 15, vport 4, flyerBuilder 1)
                               + delete 1 umbrella file
First file to relocate       : services.adapter.js  (1 consumer, pure export, trivial — proves the pattern)
                               [config/vportTypes.config.adapter is the highest-consumer safe move — do LAST of the 12]
Last file to relocate        : config/vportTypes.config.adapter.js (4 consumers) → then delete vportProfile.adapter.js umbrella
Highest single risk          : OWN-01 — ownership bridge (out of scope; do not touch here)

Verdict                      : PARTIAL GO
                               Move the 12 safe passthroughs + delete the dead umbrella.
                               Hold all 8 bridges. Keep ESLint in WARN. ERROR remains gated by SPLIT-002.
```

### DB AUDIT NOTE (deferred — out of scope per constraints)

```
DB AUDIT NOTE:
- DB object: actor_owners RPC (behind checkVportOwnershipController, OWN-01)
- Risk: ownership bridge is the one adapter that cannot relocate by file-move; its RPC call
  site ownership is the real architectural decision behind VPORT extraction.
- Why deferred: READ ONLY; SPLIT-001 scope is passthrough relocation only.
- Suggested later SQL review: when ownership relocates (SPLIT-OWN), confirm RPC posture
  unaffected — app-layer call-site move only, no schema change implied.
```

---

*Analysis only. No files moved, renamed, created, or modified. No imports updated. This
document is the sole artifact.*
