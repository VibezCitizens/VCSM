---
name: vcsm.ads.architecture
description: ARCHITECT V2 module architecture report for VCSM:ads
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** ads
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/ads
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The ads module provides a local-only ad pipeline for VPORT operators. It allows actors to create, draft, publish, pause, archive, and delete ads entirely within browser localStorage — no backend writes are performed. Monetization controls are explicitly scaffolded as "coming soon," meaning the module is built in anticipation of a future billing/payout system but is currently fully client-side.

## OWNERSHIP

Owned by the VCSM feature domain. Primary responsibility belongs to the VPORT dashboard sub-team (ads are scoped to individual actor VPORTs). No external engine dependency; all state lives in `window.localStorage` under the key `vc.ads.pipeline.v1`.

## ENTRY POINTS

- `VportAdsSettingsScreen` — accessible via `useParams().actorId` or falling back to `identity.actorId` from the identity context. Mounted as a full-screen overlay on desktop (via React portal to `document.body`).
- `OnemoredaysAd` widget — a standalone ad display widget exported via adapter, consumed by external feature surfaces (e.g., feed or profile cards).
- Feature barrel: `apps/VCSM/src/features/ads/ads.feature.js` — re-exports `VportAdsSettingsScreen`, `useVportAds`, and use-case functions.

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 7 | ad.storage.dal.js (localStorage read/write/upsert/remove), api/ad.api.js (thin API shim) |
| Model | 5 | ad.model.js (createAdDraft, normalizeAd), vportAdsSettingsShell.model.js (layout styles) |
| Controller | 0 | No dedicated controller layer — use cases serve as controller-equivalent |
| Service | N/A | No service layer |
| Adapter | 2 (fm) | useVportAds.adapter.js, OnemoredaysAd.adapter.js |
| Hook | 1 (cg) | useVportAds.js, useDesktopBreakpoint.js |
| Component | 5 (cg) | adsPipeline.ui.js (AdEditor, AdsList, AdsEmptyState), components.jsx, VportAdsBackButton.jsx |
| Screen | 3 (cg) | VportAdsSettingsScreen.jsx, adsScreens.js barrel |
| Barrel | 3 (cg) | ads.feature.js, adapters/hooks/useVportAds.adapter.js, screens/adsScreens.js |

Note: The scanner callgraph counts include re-exports and transitive references. The fm (feature-map) counts reflect direct source file attribution. The feature has no controller files — `adPipeline.usecase.js` acts as the orchestration layer, which is a non-standard placement for this codebase.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Source is clear; BEHAVIOR.md is PLACEHOLDER | BEHAVIOR.md must be written |
| Owner defined | PARTIAL | Implicitly VPORT domain; no ownership record | OWNERSHIP.md or IRONMAN record missing |
| Entry points mapped | PASS | VportAdsSettingsScreen via route params; OnemoredaysAd via adapter | No route-map entry detected by scanner |
| Controllers present/delegated | PARTIAL | Use-case layer (adPipeline.usecase.js) handles orchestration; no controller files present | Controller layer convention not followed |
| DAL/repository present/delegated | PASS | ad.storage.dal.js provides full CRUD; api/ad.api.js is a thin shim | DAL writes to localStorage only — no Supabase tables |
| Models/transformers present | PASS | ad.model.js (5 cg), vportAdsSettingsShell.model.js present | N/A |
| Hooks/view models present | PASS | useVportAds.js manages full lifecycle (load, create, save, publish, pause, archive, remove) | useDesktopBreakpoint is internal — not in shared/ |
| Screens/components present | PASS | VportAdsSettingsScreen.jsx, adsPipeline.ui.js components | N/A |
| Services/adapters present | PASS | Two adapters present and correctly structured | N/A |
| Database objects mapped | PASS | No Supabase tables — localStorage only (key: vc.ads.pipeline.v1) | No DB migration needed; risk: data is ephemeral per device |
| Authorization path mapped | FAIL | actorId sourced from useParams or identity context — no ownership gate | No actor_owners verification; any authenticated user could route to any actorId |
| Cache/runtime behavior mapped | PASS | All state in localStorage; useState for in-memory list; useMemo for stability | No cache invalidation — device-local, not shared across devices |
| Error/loading/empty states mapped | PASS | useVportAds exposes loading, saving, error; screen handles all three states | N/A |
| Documentation linked | FAIL | BEHAVIOR.md is PLACEHOLDER — no real behavior contract written | Full BEHAVIOR.md required |
| Tests/validation noted | PARTIAL | 0 tests; ad.validation.js exists (validateAdDraft) but test coverage absent | No unit or integration tests |
| Native parity noted | N/A | No iOS native surface defined | N/A |
| Engine dependencies mapped | PASS | No engine dependencies — fully self-contained | Risk: identity context sourced directly from @/state/identity/identityContext, not through an engine adapter |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| @/state/identity/identityContext | Internal state | VportAdsSettingsScreen imports directly | Borderline — should go through adapter | Direct import of identityContext from @/state/ is a mild layer boundary concern |
| @/features/settings/styles/settings-modern.css | Cross-feature CSS | VportAdsSettingsScreen imports directly | Violation — CSS should be in shared/ or ads own styles | Cross-feature CSS import; not isolated |
| lucide-react | External library | Component layer | Approved | Standard icon library |
| react-router-dom | External library | Screen layer | Approved | Routing |
| localStorage (window) | Browser runtime | DAL layer | Acceptable for dev/pre-launch | No Supabase backend for ads yet |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| vc.ads.pipeline.v1 (localStorage) | read/write | ads module | ads module only | Data is device-local and ephemeral; lost on browser clear |
| Ad draft object | in-memory (useState) | useVportAds hook | VportAdsSettingsScreen | No persistence across sessions if localStorage is cleared |
| actorId | read from URL params + identity context | identity state / router | useVportAds, VportAdsSettingsScreen | No actor_owners guard — ownership not verified against DB |

No Supabase write surfaces detected by scanner (confirmed: writeSurfaces array is empty).

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PARTIAL | Screen exports via adsScreens.js barrel; no route-map entry found by scanner | Route registration may not be wired into app router |
| Loading state | PASS | loading flag in useVportAds; screen shows "Loading ads..." during fetch | N/A |
| Empty state | PASS | AdsEmptyState component rendered when ads.length === 0 | N/A |
| Error state | PASS | error state surfaced in screen with rose-300 error panel | N/A |
| Auth/owner gates | FAIL | actorId read from URL param with no ownership verification against actor_owners | Any actor could be passed as actorId param |
| Cache behavior | PARTIAL | localStorage is persistent but device-local — no cross-device sync | Ads created on mobile will not appear on desktop |
| Runtime dependencies | PASS | No external API calls; fully self-contained; localStorage is always available in browser | SSR check (typeof window === "undefined") is present in DAL |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/ads/BEHAVIOR.md | PRESENT (PLACEHOLDER — not written) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | N/A | N/A (no DB tables) |
| Native transfer audit | N/A | N/A |
| Engine audit | N/A | No engines used |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md not written (PLACEHOLDER) | HIGH | No behavior contract means no regression baseline; acceptance criteria unclear | LOGAN |
| Authorization gate missing | HIGH | actorId from URL param is never verified against actor_owners; any authenticated actor could manage another actor's ads | VENOM / ELEKTRA |
| No tests (0) | MEDIUM | validateAdDraft exists but is untested; usecase state transitions (draft → active → paused → archived) have no coverage | SPIDER-MAN |
| Controller layer absent | LOW | adPipeline.usecase.js serves as controller equivalent but is classified as "usecase" — deviates from app-wide DAL → Model → Controller → Hook build order | ARCHITECT |
| Cross-feature CSS import | LOW | @/features/settings/styles/settings-modern.css imported directly into ads screen — violates feature isolation | ARCHITECT |
| localStorage-only persistence | MEDIUM | Ads are ephemeral per device; no backend sync means ads cannot be managed from another device or session | IRONMAN (to scope backend migration) |
| useDesktopBreakpoint not in shared/ | LOW | Breakpoint hook is feature-local inside ads/ — likely duplicated elsewhere in the codebase | ARCHITECT |
| No route-map registration detected | MEDIUM | Scanner found no routes for ads; if screen is not registered in the app router, it is unreachable | IRONMAN / HAWKEYE |

---

## MODULE BOUNDARY WARNINGS

1. **Cross-feature CSS import:** `VportAdsSettingsScreen.jsx` imports `@/features/settings/styles/settings-modern.css` directly. This is a hard feature boundary violation — CSS styles belonging to `settings` must not be consumed by `ads` directly.

2. **Direct identityContext import:** `VportAdsSettingsScreen.jsx` imports `useIdentity` from `@/state/identity/identityContext` rather than going through an identity engine adapter. This is a mild boundary concern — the state module is shared, but the import bypasses the adapter contract.

3. **No actor_owners authorization:** The screen accepts `actorId` from URL params without verifying ownership through `actor_owners`. This is the canonical VCSM ownership model — its absence is a security gap.

---

## SPAGHETTI SCORE

**Module:** ads
**Score:** WATCH
**Reasons:** Module is structurally sound (clear layers, adapters present, DAL isolated) but has a cross-feature CSS import, a missing controller layer, no auth gate on actorId, and no backend persistence. The use-case layer is well-factored. The localStorage approach is intentional scaffolding but creates data isolation risk.
**Release risk:** MEDIUM — missing auth gate and no backend persistence are blockers for a production ad marketplace.

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES (file exists)
**Status:** PLACEHOLDER — no behavior contract content written

**Check A (Source without behavior):** FAIL — source files exist and are functional, but BEHAVIOR.md contains no actual behavior specification.
**Check B (Behavior without source):** N/A — BEHAVIOR.md is a placeholder with no documented happy paths to compare against.
**Check C (§13 engine consistency):** PASS — BEHAVIOR.md declares no engines; scanner confirms no engine dependencies. Consistent.
**Check D (§6 data change consistency):** PASS — BEHAVIOR.md declares no data changes; scanner confirms zero write surfaces (localStorage is not a DB write surface). Consistent.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write BEHAVIOR.md from source | PLACEHOLDER contract must be replaced with real happy paths, error flows, and data contract | LOGAN |
| P1 | Add actorId ownership authorization gate | Any actor can pass any actorId via URL — no actor_owners check in place | VENOM / ELEKTRA |
| P2 | Add test coverage for adPipeline.usecase.js and ad.validation.js | Zero tests for a module with a state machine (draft → active → paused → archived) | SPIDER-MAN |
| P3 | Plan backend migration for ad persistence | localStorage is device-local; a real ad marketplace requires server-side storage | IRONMAN / CARNAGE |

## RECOMMENDED HANDOFFS

- **IRONMAN** — scope backend persistence for ads (Supabase table design) and confirm route registration in the app router
- **VENOM** — audit actorId parameter trust boundary; no actor_owners check present
- **ELEKTRA** — patch the actorId authorization gap (source→sink: useParams → useVportAds → localStorage write)
- **SPIDER-MAN** — add unit tests for adPipeline.usecase.js state transitions and ad.validation.js
- **LOGAN** — write the BEHAVIOR.md from source; current file is a PLACEHOLDER
- **HAWKEYE** — verify VportAdsSettingsScreen is registered in the app router and reachable via expected route

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
