# PROFILES-SPLIT-004 — Boundary Enforcement Activation Review

```
[PROFILES-SPLIT-004] Profiles Boundary Enforcement Activation Readiness
Status: Complete (READ ONLY — no code, no moves, no ESLint changes)
Priority: P1
Type: ARCHITECTURE
App: VCSM
Builds on: SPLIT-001 (adapters), SPLIT-002 (leaks identified), SPLIT-003 (leaks resolved + friends relocated)
Date: 2026-06-08
```

> **Verdict: GO.** The profiles domain is structurally clean — Citizen ⇄ VPORT = 0 both ways,
> and the only Shared↔kind edges are the **3 dispatcher files**. The boundary rule can be
> activated. **Key correction to the prior plan:** there is currently **NO profiles-zone
> boundary rule in `eslint.config.js`** — the "WARN mode" was conceptual, never implemented.
> Because the domain is already at **0 violations**, the activation ticket can add the rule and
> go **directly to ERROR** (a WARN staging period is optional, only useful to validate the
> rule's own path globs). One pre-existing, unrelated lint error exists and does **not** block
> activation.

---

## Deliverable A — Current Boundary State (fresh re-scan)

| Edge | Count | Files | Expected? |
|---|---|---|---|
| Citizen → VPORT | **0** | — | ✅ yes (clean) |
| VPORT → Citizen | **0** | — | ✅ yes (clean) |
| Shared → Citizen | **1** | `screens/views/ActorProfileViewScreen.jsx:22` → `kinds/citizen/tabs/CitizenTabRouter` | ✅ yes — **dispatcher** |
| Shared → VPORT | **2** | `screens/ActorProfileScreen.jsx:26,30` → `kinds/vport/hooks/{useVportType, useVportProfileBySlug}` | ✅ yes — **dispatcher** |
| Dispatch → VPORT | **1** | `kinds/profileKindRegistry.js:4` → `kinds/vport/screens/VportProfileKindScreen` | ✅ yes — **dispatcher (registry)** |
| Dispatch → Shared | **1** | `kinds/profileKindRegistry.js:3` → `screens/views/ActorProfileViewScreen` | ✅ yes — intra-dispatch |

Every remaining cross-zone edge belongs to one of the **3 dispatcher files**. No leak edges remain.
(`getProfileView` now imports `model/userProfile.model` — shared→shared; the SPLIT-003 fix holds.)

---

## Deliverable B — Dispatcher Whitelist Validation

| File | Why Whitelisted | Imports Across Domains? | Required? |
|---|---|---|---|
| `kinds/profileKindRegistry.js` | The kind→screen dispatch map | YES — `ActorProfileViewScreen` (shared) + `VportProfileKindScreen` (vport) | **YES** |
| `screens/ActorProfileScreen.jsx` | Route entry; resolves kind before dispatch | YES — `kinds/vport/hooks/*` (×2) + registry | **YES** |
| `screens/views/ActorProfileViewScreen.jsx` | The `user` screen; mounts citizen tabs | YES — `kinds/citizen/tabs/CitizenTabRouter` | **YES** |

**No additional whitelist files exist.** Confirmed: `profileKindRegistry` is imported by **only**
`ActorProfileScreen` (no other consumer), and no other file in any shared dir imports a kind.

**Can the whitelist remain exactly 3 files? → YES.** It is complete and minimal.

---

## Deliverable C — ESLint Rule Simulation

Assumed rule: `shared↛citizen`, `shared↛vport`, `citizen↛vport`, `vport↛citizen`; the 3
dispatcher files exempt.

| File | Violation | Severity |
|---|---|---|
| *(none)* | — | — |

**Outcome: 0 violations.** Every cross-zone import is in a whitelisted dispatcher. The rule
would pass green on first run.

---

## Deliverable D — Adapter Zone Validation

| Adapter | Classification | Correct Zone? |
|---|---|---|
| `kinds/vport/adapters/{config,vportProfiles,services,exchange,locksmith,hooks/*,screens/*}` (12) | VPORT passthrough (relocated in SPLIT-001) | ✅ VPORT |
| `kinds/vport/adapters/vportProfiles.adapter.js` (now also exports `useVportProfileOps`) | VPORT (SPLIT-003 addition) | ✅ VPORT |
| `adapters/kinds/vport/ownership.adapter.js` | OWNERSHIP_BRIDGE → `vportDashboard` | ✅ VPORT-zone bridge — **untouched** |
| `adapters/kinds/vport/hooks/gas/*` (3) + `screens/gas/*` (4) | GAS_BRIDGE → `vportDashboard` | ✅ VPORT-zone bridge — **untouched** |
| `adapters/profiles.adapter.js` | Shared (exports `useProfileOps`, `useActorCanonicalSlug`, `useResolveActorBySlug`) | ✅ ADAPTERS (shared) |
| `adapters/ui/*`, `adapters/photos/*`, `adapters/tags/*` | Shared cross-feature aggregators | ✅ ADAPTERS (shared) |

Confirmations:
- **No misplaced adapters remain** — the 12 passthroughs are inside the vport zone; only the 8 bridges remain at `adapters/kinds/vport/` by design.
- **No hidden VPORT exports in shared adapters** — `profiles.adapter.js` exports only shared hooks (the old `useProfilesOps` vport bundle is gone).
- **No citizen code exposed through shared adapters** — citizen has no external adapter surface.
- **Ownership bridge untouched · gas bridges untouched** — verified present and unchanged.

---

## Deliverable E — Import Boundary Map (actual locations)

Zones are **logical (path-glob), not physical folders** — there is no physical `shared/` or
`dispatch/` directory. This is the one remaining transitional aspect; the ESLint rule must be
expressed by path globs + the 3-file whitelist, not a folder-boundaries plugin alone.

```
profiles/
  ├─ controller/  dal/  hooks/  model/  components/        ─┐
  ├─ screens/ (Actor*View generic, header, tabs, profileheader, UsernameProfileRedirect)  ├─ SHARED  (logical)
  │                                                          ┘
  ├─ screens/ActorProfileScreen.jsx              ─┐
  ├─ screens/views/ActorProfileViewScreen.jsx     ├─ DISPATCH (whitelist, logical)
  ├─ kinds/profileKindRegistry.js                ─┘
  │
  ├─ kinds/citizen/**                             ── CITIZEN
  │     └─ tabs/friends/** (relocated SPLIT-003: view + components + hooks)
  │
  ├─ kinds/vport/**                               ─┐
  │     ├─ adapters/** (12 passthroughs, SPLIT-001) ├─ VPORT
  │     └─ hooks/useVportProfileOps.js (SPLIT-003)  ┘
  │
  ├─ adapters/profiles.adapter.js, ui/*, photos/*, tags/*   ── ADAPTERS (shared)
  └─ adapters/kinds/vport/** (8 bridges: ownership + gas)   ── VPORT-zone bridges (→ vportDashboard)
```

**Remaining transitional structure:** the logical-vs-physical zone gap. Optional future hygiene
(physical `shared/` + `dispatch/` folders) — **not required** for enforcement.

---

## Deliverable F — ERROR Mode Readiness

1. **Can WARN safely become ERROR?** There is **no boundary rule in `eslint.config.js` today**
   (confirmed — the `vcsm-architecture` plugin has `no-dal-auth-leak`, `adapter-boundary`,
   `single-source-actor`, `no-direct-layer-skip`, `no-select-star`, `no-ttl-cache`,
   `react-query-preferred`, but **no profiles-zone rule**). So the activation ticket **adds**
   the rule. Since the domain is at **0 violations**, it can be added **directly at ERROR**.
   A WARN dry-run is optional — useful only to validate the rule's own path globs, not to find
   code violations.
2. **Files that fail immediately:** **NONE** (with the 3-file whitelist).
3. **CI/build impact:** Adding the boundary rule → **0 new failures**. Caveat below (pre-existing).
4. **Existing lint findings unrelated to the boundary rule:** YES —
   - **`single-source-actor` ERROR** in `kinds/citizen/tabs/friends/components/TopFriendsRankEditor.jsx:23` (`const [localActorIds] = useState(null)` matches `/actorId/i`).
   - `react-refresh/only-export-components` warnings (`lazyApp.jsx`).
   - `react-hooks/exhaustive-deps` warnings (vport consumers).

**TopFriendsRankEditor.jsx evaluation:** The `single-source-actor` rule is **filename-agnostic**
(fires on any `useState/useRef/useMemo` binding matching `/actorId/i`; no path scoping in rule
or config). It therefore triggered **identically at the file's old path** — it is **pre-existing
tech debt, not introduced by SPLIT-003's relocation**. It is a **different rule** from the
boundary rule and **does NOT block boundary ERROR activation**. However: it is a live
**ERROR-level** finding. If repo-wide `eslint` is a blocking CI gate, this file is already a
pre-existing CI concern independent of profiles boundary work → resolve via a separate cleanup
ticket (rename `localActorIds` → a non-`actorId` binding, or refactor per the rule).

---

## Deliverable G — Risk Register (boundary-enforcement only)

| ID | Severity | Risk |
|---|---|---|
| RULE-IMPL-01 | **MEDIUM** | The boundary rule does not exist yet and must be authored. Risk is in the **rule's own path globs** (mis-scoping `adapters/kinds/vport` as adapter-zone instead of vport-zone, or failing to exempt the 3 dispatchers) — not in the codebase. Mitigation: a single WARN dry-run validates globs before flipping ERROR. |
| WHITELIST-01 | **LOW** | If a future PR adds a 4th cross-zone dispatcher without updating the whitelist, it either false-fails (if legit) or the whitelist quietly grows. Mitigation: keep whitelist to the 3 named files; require review for additions. |
| PREEXIST-LINT-01 | **LOW** | Pre-existing `single-source-actor` ERROR in `TopFriendsRankEditor` is unrelated but lives in the relocated subtree; could be mistaken for boundary fallout. Mitigation: track as separate cleanup ticket; document as pre-existing. |
| TRANSITIONAL-01 | **INFO** | Zones are logical path-globs, not physical folders. Enforcement works fine on globs; physical `shared/`+`dispatch/` folders are optional future hygiene. |
| BRIDGE-01 | **INFO** | 8 vport→vportDashboard bridges remain (ownership + gas). They are cross-feature (allowed) and out of scope for the intra-profiles boundary rule. Owned by the separate OWN-01 decision. |

No CRITICAL or HIGH boundary-enforcement risks.

---

## Deliverable H — Final Verdict

1. **Is profiles ready for boundary enforcement? → YES.** 0 leak edges; all cross-zone imports are the 3 dispatchers.
2. **Can WARN become ERROR now? → Effectively YES — but precisely: the rule must first be *authored* (none exists), then it can land *directly at ERROR* given 0 violations.** No WARN-staging is needed for code; an optional single WARN run only validates the rule's globs.
3. **Is the dispatcher whitelist complete? → YES — exactly 3 files** (`profileKindRegistry.js`, `ActorProfileScreen.jsx`, `ActorProfileViewScreen.jsx`).
4. **Exact next implementation ticket → PROFILES-SPLIT-005: Author & activate the profiles domain-boundary ESLint rule.** Scope: add a `vcsm-architecture` rule (or `no-restricted-imports` zone config) enforcing citizen↛vport / vport↛citizen / shared↛{citizen,vport}; map `adapters/kinds/vport` to vport-zone; exempt the 3 dispatchers; land at ERROR (optional one-commit WARN dry-run to validate globs).
5. **Anything remaining before profiles extraction can continue? →** Nothing blocks enforcement. Two *non-blocking* follow-ups: (a) the pre-existing `single-source-actor` error in `TopFriendsRankEditor` (separate cleanup ticket); (b) the OWN-01 ownership-bridge relocation decision, required only before *full physical VPORT extraction*, not before boundary enforcement.

```
GO — Boundary rule ready to author. Whitelist finalized (3 files). WARN→ERROR approved
     (author rule, then ERROR directly; 0 violations). No new architecture work required
     before enforcement.
```

### DB AUDIT NOTE
```
None. SPLIT-004 is a read-only readiness review; no app or DB surface touched.
```

---

*Analysis only. No files moved, renamed, created, or modified. No ESLint rule implemented. This document is the sole artifact.*
