# VCSM DAL — `ads`

_Generated:_ 2026-05-11  
_Updated:_ 2026-05-11 (ARCHITECT live audit — localStorage DAL clarification + architecture gaps)  
_Source:_ ARCHITECT static scan + manual verification · `apps/VCSM/src/features/ads/`  
_Confidence:_ STATICALLY\_TRACED + MANUALLY\_VERIFIED

---

## Summary

| Item | Detail |
|---|---|
| DAL files | 1 |
| Exported functions | 3 |
| Storage backend | `window.localStorage` (not Supabase) |
| Tables accessed | 0 — no database reads |
| RPCs called | 0 — no database reads |
| Release flag | `releaseFlags.vportAdsPipeline` → `VITE_ENABLE_VPORT_ADS_PIPELINE` (default: **disabled**) |
| Feature status | LIVE — gated off in production |
| Architecture status | INCOMPLETE — missing Controller layer, non-standard `usecases/` folder |

---

## Important: This Is a localStorage DAL, Not a Supabase DAL

`ad.storage.dal.js` reads and writes exclusively to `window.localStorage` under the key `ADS_STORAGE_KEY`.

It has zero Supabase table access and zero RPC calls by design. The original static scan reported operations as "unknown" because the tracer was looking for Supabase patterns — this was a scan artifact, not missing data.

**Consequence:** Ads have no cross-device or cross-session persistence. This is an MVP/prototype storage layer. A Supabase migration is needed for production viability.

---

## DAL Files

### `ad.storage.dal.js`

**Path:** `features/ads/dal/ad.storage.dal.js`  
**Storage:** `window.localStorage` via `ADS_STORAGE_KEY`  

**Exported functions:**

| Function | Operation | Storage |
|---|---|---|
| `listAdsByActor({ actorId })` | Read — filters by actorId, sorts by updatedAt desc | `localStorage.getItem` |
| `upsertAd(ad)` | Write — insert or update by id | `localStorage.setItem` |
| `removeAd({ id })` | Delete — filters out by id | `localStorage.setItem` |

---

## Release Flag

```
releaseFlags.vportAdsPipeline
→ VITE_ENABLE_VPORT_ADS_PIPELINE (env var)
→ default: disabled
```

The route, redirect, and `VportSettingsScreen` ads section are all gated on this flag. The `OnemoredaysAd` widget in `VportsTab.view.jsx` is the only consumer not behind the flag check.

---

## External Consumers

| Consumer | File | What It Uses |
|---|---|---|
| Route | `app/routes/protected/app.routes.jsx` | `VportAdsSettingsScreen` behind flag |
| Legacy redirect | `app/routes/protected/appRoutes.redirects.jsx` | `/vport/:actorId/ads` → `/ads/vport/:actorId` |
| Lazy loader | `app/routes/lazyApp.jsx` | Dynamic import of `VportAdsSettingsScreen` |
| Vport dashboard | `features/dashboard/vport/screens/VportSettingsScreen.jsx` | `useVportAds` hook behind flag |
| Settings tab | `features/settings/vports/ui/VportsTab.view.jsx` | `OnemoredaysAd` widget (no flag check) |

---

## Call Chain

```
VportAdsSettingsScreen.jsx
  → useVportAds.js (hook)
    → adPipeline.usecase.js (usecase — non-standard layer)
      → ad.api.js (api)
        → ad.storage.dal.js (localStorage)
```

---

## Architecture Pipeline

Full build order per contract: `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | `dal/ad.storage.dal.js` |
| **Model** | ✓ PRESENT | `model/ad.model.js`, `model/vportAdsSettingsShell.model.js` |
| **Controller** | ✗ MISSING | Business logic delegated to `usecases/adPipeline.usecase.js` — contract violation |
| **API** | ⚠ NON-STANDARD | `api/ad.api.js` — thin pass-through wrapper between usecase and DAL; not a recognized VCSM architecture layer |
| **Adapter** | ✓ PRESENT | `adapters/hooks/useVportAds.adapter.js`, `adapters/widgets/OnemoredaysAd.adapter.js` |
| **Hook** | ✓ PRESENT | `hooks/useVportAds.js`, `hooks/useDesktopBreakpoint.js` |
| **Component** | ⚠ PARTIAL | `ui/components.jsx`, `ui/VportAdsBackButton.jsx`, `widgets/OnemoredaysAd.jsx`, `lib/ad.validation.js` — no formal `components/` layer; validation helper is called from usecase logic |
| **View Screen** | ✗ MISSING | Screen goes directly from hook to Final Screen |
| **Final Screen** | ✓ PRESENT | `screens/VportAdsSettingsScreen.jsx` |

### Non-Standard Layer

- `usecases/adPipeline.usecase.js` — `usecases/` is not a recognized VCSM architecture layer. This file is performing controller-level business logic orchestration without sitting in the `controller/` layer. The contract defines no `usecases/` layer.
- `api/ad.api.js` — `api/` is not a recognized VCSM architecture layer. This file is currently a thin pass-through wrapper from usecase logic to localStorage DAL.
- `ads.feature.js` — feature barrel exports `usecases/adPipeline.usecase` directly, which leaks the non-standard usecase surface as a public feature API.

---

## Risk Findings

### RISK-1 — No Supabase Persistence
**Severity:** HIGH  
**Detail:** All ad data is stored in `localStorage`. No cross-device sync, no server record. Feature is not production-ready for real ad management.  
**Recommended action:** Migrate DAL to Supabase before enabling the release flag.

### RISK-2 — Missing Controller Layer
**Severity:** MEDIUM  
**Detail:** Business logic lives in `usecases/adPipeline.usecase.js`, bypassing the required `controller/` layer. The `usecases/` folder is not a recognized VCSM architecture layer.  
**Recommended action:** Rename/move to `controllers/adPipeline.controller.js` and wire accordingly.

### RISK-3 — Widget Not Behind Release Flag
**Severity:** LOW  
**Detail:** `OnemoredaysAd` in `VportsTab.view.jsx` renders without a `releaseFlags.vportAdsPipeline` guard. All other ad surfaces are gated. Inconsistent.  
**Recommended action:** Wrap the `<OnemoredaysAd />` render in a flag check.

### RISK-4 — ActorId Ownership Gap Before Persistence Migration
**Severity:** HIGH (conditional — blocked before Supabase persistence / flag enable)  
**Detail:** `VportAdsSettingsScreen.jsx` resolves `actorId` from the route param before falling back to `identity.actorId`, but it does not verify that the route actor belongs to the current actor. While the DAL is localStorage-only and the route is flag-gated, this is not a production data exposure. If the DAL migrates to Supabase, owner verification and RLS must be in place before enabling writes.  
**Recommended action:** Add an owner check in the controller/screen route flow and enforce write-side RLS during the CARNAGE Supabase migration.

### RISK-5 — Final Screen Performs Identity/Business Fallback
**Severity:** LOW  
**Detail:** `VportAdsSettingsScreen.jsx` calls `useIdentity()` directly and computes `actorIdParam || identity?.actorId || null` in the Final Screen. This mixes route entry with identity/business fallback logic and bypasses a View Screen layer.  
**Recommended action:** Introduce a View Screen/controller boundary for actor resolution when the ads feature is promoted beyond prototype state.

---

## Pending Reviews

| Review | Command | Priority |
|---|---|---|
| Supabase migration design | CARNAGE | HIGH — required before flag enable |
| Controller layer gap | SENTRY | MEDIUM — architecture contract violation |
| Widget flag consistency | VENOM | LOW — minor trust boundary inconsistency |
| ActorId ownership before persistence migration | CARNAGE + SENTRY | HIGH — required before Supabase-backed writes or flag enable |
| Final Screen identity/business fallback | SENTRY | LOW — architecture contract cleanup |

---

## File Map

```
features/ads/
├── adapters/
│   ├── hooks/useVportAds.adapter.js
│   └── widgets/OnemoredaysAd.adapter.js
├── api/
│   └── ad.api.js
├── constants.js
├── dal/
│   └── ad.storage.dal.js          ← localStorage only, no Supabase
├── hooks/
│   ├── useDesktopBreakpoint.js
│   └── useVportAds.js
├── lib/
│   └── ad.validation.js
├── model/
│   ├── ad.model.js
│   └── vportAdsSettingsShell.model.js
├── screens/
│   ├── VportAdsSettingsScreen.jsx
│   └── adsScreens.js
├── ui/
│   ├── VportAdsBackButton.jsx
│   ├── adsPipeline.ui.js
│   └── components.jsx
├── usecases/
│   └── adPipeline.usecase.js      ← non-standard layer, acts as controller
├── widgets/
│   └── OnemoredaysAd.jsx
└── ads.feature.js
```

---

---

# Avengers Assembly Report — 2026-05-11

**Scope:** `apps/VCSM/src/features/ads/` — DAL documentation audit  
**Triggered by:** `/AvengersAssemble vcsm.dal.ads.md`  
**Boundary:** VCSM (read-only)  
**Commands run:** ARCHITECT · VENOM · SENTRY (review-contract) · LOGAN

---

## Governance Evidence Registry

| Command | Status | Drift | Blocking |
|---|---|---|---|
| ARCHITECT | PRESENT | MINOR | No |
| VENOM | PRESENT | MODERATE | Conditional |
| SENTRY / review-contract | PRESENT | MODERATE | No (flag disabled) |
| LOGAN | PRESENT | MINOR | No |
| IRONMAN | N/A — doc-scope run | — | — |
| LOKI | N/A — doc-scope run | — | — |
| KRAVEN | N/A — doc-scope run | — | — |
| CARNAGE | PENDING — HIGH priority per doc | — | Yes (before flag enable) |
| FALCON | N/A — no native surface | — | — |
| WINTER SOLDIER | N/A — no native surface | — | — |
| SHIELD | N/A — doc-scope run | — | — |

---

## ARCHITECT

**Status: MINOR DRIFT FOUND**

Verified against live filesystem and source code.

**ALIGNED:**
- File map matches actual directory (19 files confirmed)
- Call chain `VportAdsSettingsScreen → useVportAds → adPipeline.usecase → ad.api → ad.storage.dal` confirmed exact
- All 5 external consumers confirmed in source (`app.routes.jsx`, `appRoutes.redirects.jsx`, `lazyApp.jsx`, `VportSettingsScreen.jsx`, `VportsTab.view.jsx`)
- Release flag wiring (`VITE_ENABLE_VPORT_ADS_PIPELINE`) confirmed in `app.routes.jsx:155` and `appRoutes.redirects.jsx:53`
- Architecture pipeline layer table ALIGNED with live state

**DRIFT:**
- `api/ad.api.js` exists as a second non-standard intermediate layer between `usecases/` and `dal/`. It is a thin pass-through wrapper (3 exported functions, each a single-line forwarding call). The architecture pipeline table documents `usecases/` as non-standard but does not note `api/` as a parallel non-standard layer.
- `ads.feature.js` (barrel) exports from `usecases/adPipeline.usecase` directly: `export * from "@/features/ads/usecases/adPipeline.usecase"`. This leaks usecase implementation (7 exported functions) through the feature's public surface. Not documented as an architecture concern.

---

## VENOM

**Status: MODERATE DRIFT FOUND — Conditional blocking**

**ALIGNED:**
- RISK-3 confirmed: `OnemoredaysAd` renders at `VportsTab.view.jsx:230` with no `releaseFlags.vportAdsPipeline` guard
- `ad.validation.js` URL validation correctly enforces `http:` / `https:` only protocols
- `OnemoredaysAd.jsx` hardcodes `omdUrl = 'https://onemoredays.com'` — no dynamic URL injection, external URL is safe

**NEW SECURITY FINDING — VENOM-1:**
- **Severity: HIGH (conditional — safe while flag disabled, critical at flag enable)**
- `VportAdsSettingsScreen.jsx` resolves `actorId` as: `actorIdParam || identity?.actorId || null` where `actorIdParam` comes directly from `useParams()`.
- There is **no ownership verification** that `actorIdParam === identity.actorId`. Any authenticated user who navigates to `/ads/vport/{arbitrary_actorId}` can create, save, publish, pause, archive, or delete ads attributed to that actorId.
- Currently harmless because (a) `localStorage` is per-browser and (b) the route is behind `releaseFlags.vportAdsPipeline` which defaults to `false`.
- **Becomes critical upon Supabase migration (CARNAGE scope) if write-side RLS is not enforced.** Owner check must be added to the screen or controller layer before flag enable.
- `VportSettingsScreen.jsx` has the same pattern — it takes `actorId` from `useParams()` and passes it to `useVportAds(actorId)` with no ownership check.

**NEW CODE QUALITY NOTE — VENOM-2:**
- `toSafeExternalUrl` in `OnemoredaysAd.jsx` validates the URL before `window.open`, but `omdUrl` is a hardcoded constant `'https://onemoredays.com'`. The validation runs on every click but can never fail. Dead validation path — no security risk, but dead code.

---

## SENTRY / review-contract

**Status: MODERATE — VIOLATIONS CONFIRMED (pre-existing, flag-gated)**

**Contract violations confirmed in live code:**

| Violation | Location | Severity | Status |
|---|---|---|---|
| Missing Controller layer | `usecases/adPipeline.usecase.js` performs controller-role logic | MEDIUM | Pre-existing (RISK-2) |
| `usecases/` not a recognized VCSM layer | `features/ads/usecases/` | MEDIUM | Pre-existing (RISK-2) |
| Missing View Screen layer | `VportAdsSettingsScreen.jsx` goes Final Screen → Hook directly | MEDIUM | Pre-existing |
| `api/` not a recognized VCSM layer | `features/ads/api/ad.api.js` | LOW | New finding |
| Barrel leaks non-standard layer | `ads.feature.js` exports `usecases/adPipeline.usecase` | LOW | New finding |

**No `select('*')` violations** — feature uses localStorage, zero Supabase queries.  
**No TypeScript files** — confirmed JS only.  
**No cross-feature direct imports** — `VportSettingsScreen` and `VportsTab.view` both import through adapters correctly.

---

## LOGAN

**Status: MINOR DRIFT — Document largely accurate**

**ALIGNED:**
- RISK-1 (no Supabase persistence), RISK-2 (missing Controller), RISK-3 (widget flag gap) all confirmed in live code
- Call chain diagram is accurate including `api/` intermediate step
- Storage key `"vc.ads.pipeline.v1"` confirmed in `constants.js`
- `ADS_STORAGE_KEY` import path confirmed correct in `ad.storage.dal.js:1`
- DAL function signatures (`listAdsByActor`, `upsertAd`, `removeAd`) confirmed exact
- `normalizeStoredAd` and `safeParse` are internal helpers (not exported) — consistent with "3 exported functions" summary

**DRIFT:**

1. **Architecture pipeline table** does not classify `api/ad.api.js` as a non-standard layer alongside `usecases/`. The `api/` folder exists and is part of the call chain. It should be noted in the table or the "Non-Standard Layer" section.

2. **`ads.feature.js` barrel** is not mentioned anywhere in the document. It exports from 3 sources including `usecases/` — this is an undocumented architecture surface that leaks the non-standard usecase layer externally.

3. **`ad.validation.js`** in `lib/` is not listed in the architecture pipeline table or file map. It's called from `usecases/adPipeline.usecase.js` for draft/publish validation. Minor omission.

4. **`useIdentity()` call in Final Screen** — `VportAdsSettingsScreen.jsx` calls `useIdentity()` directly (line 17). This violates the Final Screen role contract ("Route entry + identity gate only — No hooks"). The screen performs an identity read and business-logic fallback (`actorIdParam || identity?.actorId`). This should be captured as an architecture concern.

---

## Cross-System Contradictions

| System A | System B | Contradiction | Severity | Resolution |
|---|---|---|---|---|
| LOGAN (doc says adapter is present) | SENTRY (screen imports hook directly) | `VportAdsSettingsScreen.jsx` imports `useVportAds` from `hooks/` directly, not from `adapters/hooks/`. Within-feature usage so not a boundary violation, but adapter layer is partially bypassed. | LOW | Acceptable within-feature direct hook import. Note: cross-feature callers (`VportSettingsScreen`) correctly use adapter. |
| VENOM (RISK-3: widget not gated) | ARCHITECT (flag confirmed gated on routes/screen) | All routed surfaces are flag-gated; only the `OnemoredaysAd` widget is ungated — but it's a static hardcoded ad, not a dynamic ad from the pipeline. Inconsistency is real but widget doesn't read from the pipeline DAL. | LOW | Confirm intended: widget is a static sponsored placement, not part of the ads pipeline. If so, flag gating is intentional. Document the distinction explicitly. |

---

## Runtime Alignment Review

| Area | Evidence | Risk | Status |
|---|---|---|---|
| localStorage read (`listAdsByActor`) | Sync `readAll()` → `JSON.parse` | Low: SSR-safe guard present (`typeof window === "undefined"`) | ALIGNED |
| localStorage write (`upsertAd`, `removeAd`) | Sync `writeAll()` | Low: same SSR guard | ALIGNED |
| `upsertAd` error path | Throws if `normalized.id` is falsy | Medium: `useVportAds` hook does not catch upsert errors at `pause`/`archive` operations | MINOR GAP |
| Validation in usecase | `validateAdDraft` called before save and publish, not before pause/archive | Low: intentional (status-only ops) | ALIGNED |

---

## Ownership / Boundary Alignment

| Area | Status | Notes |
|---|---|---|
| DAL ownership | CLEAR — `features/ads/dal/` owned by ads feature | No cross-feature DAL imports |
| Cross-feature adapter boundaries | ALIGNED — `VportSettingsScreen` and `VportsTab.view` use adapters | Correct boundary usage confirmed |
| Feature barrel surface | CONCERN — `ads.feature.js` exports usecases directly | Expands public surface beyond intended contract |
| `api/` layer responsibility | UNCLEAR — thin wrapper with no business logic, no clear reason to exist as a separate layer vs. calling DAL directly from usecase | Should be collapsed into controller once controller layer is added |

---

## Documentation Truth Review

| Doc/System | Truth Status | Drift | Blocking |
|---|---|---|---|
| File map | ALIGNED | None | No |
| Call chain | ALIGNED | `api/` present but not classified as non-standard in table | No |
| External consumers | ALIGNED | None | No |
| Architecture pipeline table | MINOR DRIFT | `api/` layer unclassified; `ads.feature.js` barrel undocumented | No |
| Risk findings | ALIGNED | All 3 risks confirmed in live code | No |
| New risks (VENOM-1, useIdentity in Final Screen) | NOT DOCUMENTED | Should be added as RISK-4 and RISK-5 | Conditional |

---

## Proposed Updates

No `.v2.md` created at this time — all drift is minor to moderate and confined to documentation gaps (not incorrect claims). Proposed additions to this document:

1. **RISK-4 (HIGH-conditional):** `VportAdsSettingsScreen` has no actorId ownership check. Safe while flag disabled + localStorage-only. Becomes critical at Supabase migration. Add to Pending Reviews against CARNAGE.
2. **RISK-5 (LOW):** `VportAdsSettingsScreen` calls `useIdentity()` directly in the Final Screen — violates Final Screen role contract. Should be moved to a view screen or resolved via route-level identity gate.
3. **Architecture pipeline table:** Add `api/` row as `⚠ NON-STANDARD` (thin pass-through, collapses with controller when controller is built).
4. **Non-Standard Layers section:** Add `api/ad.api.js` alongside the `usecases/` entry.
5. **`ads.feature.js` barrel:** Add a note that it currently leaks usecase exports — should be scoped to screens and hooks only once controller layer is introduced.

---

## Overall Status

**DRIFT FOUND — NON-BLOCKING (flag disabled)**

All three pre-existing risks are confirmed accurate. Two new findings surfaced:
- **VENOM-1** (actorId ownership gap) is the most important — must be resolved before `VITE_ENABLE_VPORT_ADS_PIPELINE` is enabled in any environment.
- Documentation gaps (`api/` layer, barrel exports, Final Screen identity call) are low-severity and can be addressed in the next Logan sync.

No findings block the current state (feature is disabled). CARNAGE (Supabase migration) is the hard gate before flag enable.

## Recommended Next Command

```
CARNAGE — design Supabase migration for ads DAL + add actorId ownership RLS
SENTRY  — Controller layer introduction to resolve RISK-2 and collapse api/ layer
```

---

## Codex Fix Pass — 2026-05-11

### Files Changed

| File | Change |
|---|---|
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.ads.md` | Added current-state documentation for the non-standard `api/` layer, `ads.feature.js` usecase export leak, actorId ownership risk, and Final Screen identity fallback risk. |

### Findings Addressed

| Finding | Status | Notes |
|---|---|---|
| Documentation drift — `api/ad.api.js` not classified as non-standard | DONE | Architecture pipeline now includes an `API` row marked non-standard. |
| Documentation drift — `ads.feature.js` barrel leaks usecase exports | DONE | Non-Standard Layer section now documents the barrel exposure. |
| Documentation drift — `ad.validation.js` missing from architecture context | DONE | Component/helper row now names `lib/ad.validation.js` as validation logic used by usecase code. |
| VENOM-1 / RISK-4 — actorId ownership gap | BLOCKED | Safe while the feature remains localStorage-only and flag-disabled; must be handled with CARNAGE/SENTRY before Supabase-backed writes or flag enable. |
| RISK-1 — no Supabase persistence | BLOCKED | Requires product/schema/RLS design; explicitly outside safe DAL-doc fix scope. |
| RISK-2 — missing Controller layer and non-standard `usecases/` | BLOCKED | Requires architecture refactor of ads orchestration. Not forced because it affects public feature exports and hook wiring. |
| RISK-3 — `OnemoredaysAd` not behind release flag | BLOCKED | Live code confirms the widget is a static sponsored placement and not a DAL-backed pipeline consumer. Hiding it may be product behavior change, so ownership review is required. |
| RISK-5 — Final Screen identity/business fallback | BLOCKED | Requires screen/view/controller restructuring; documented for SENTRY follow-up. |

### Verification

- Commands/searches run:
  - `find apps/VCSM/src/features/ads -maxdepth 3 -type f | sort`
  - `grep -rn "OnemoredaysAd\\|vportAdsPipeline\\|VITE_ENABLE_VPORT_ADS_PIPELINE\\|useVportAds\\|VportAdsSettingsScreen" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `grep -rn "from .*features/ads/usecases\\|features/ads/api\\|ads.feature" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - Inspected `apps/VCSM/src/features/ads/screens/VportAdsSettingsScreen.jsx`
  - Inspected `apps/VCSM/src/features/ads/usecases/adPipeline.usecase.js`
  - Inspected `apps/VCSM/src/features/ads/api/ad.api.js`
- Production callers checked:
  - `apps/VCSM/src/app/routes/protected/app.routes.jsx`
  - `apps/VCSM/src/app/routes/protected/appRoutes.redirects.jsx`
  - `apps/VCSM/src/app/routes/lazyApp.jsx`
  - `apps/VCSM/src/features/dashboard/vport/screens/VportSettingsScreen.jsx`
  - `apps/VCSM/src/features/settings/vports/ui/VportsTab.view.jsx`
- Remaining risks:
  - Supabase persistence migration and RLS remain CARNAGE scope.
  - Controller/View Screen restructuring remains SENTRY scope.
  - Widget flag consistency requires product/security ownership because the widget is static and not pipeline-backed.
  - ActorId ownership must be resolved before any Supabase-backed write path or flag enable.

### Status

PARTIAL
