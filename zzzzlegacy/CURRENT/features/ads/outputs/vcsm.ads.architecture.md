---
# Module Architecture Report — ARCHITECT §26.11
# Feature: ads
# App: VCSM
# Ticket: ARCHITECT-ADS-0001
# Generated: 2026-06-02
# Status: IMMUTABLE DATED REPORT — do not modify; update ARCHITECTURE.md instead

---

# ads — Module Architecture Report

## Feature Overview

The ads feature is a self-contained ad pipeline management system for VPORT owners. It allows a VPORT actor to create, edit, save-as-draft, publish, pause, archive, and delete ad campaigns through a full-screen settings-style UI. Persistence is currently backed entirely by `localStorage` (keyed `vc.ads.pipeline.v1`) — there is no Supabase table or RPC in use. A static sponsored placement widget (`OnemoredaysAd`) is also part of this feature and is injected externally via the adapter boundary. The monetization model is declared as `coming_soon` in constants.

**Source Path:** `apps/VCSM/src/features/ads/`
**Engine Path:** None — feature-only (no engine dependency)
**Security Tier:** LOW
**Feature Status:** ACTIVE

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers | NO | No dedicated controller/ subfolder — use-case functions in usecases/ serve this role |
| DALs | YES | apps/VCSM/src/features/ads/dal/ad.storage.dal.js |
| Models | YES | apps/VCSM/src/features/ads/model/ |
| Hooks | YES | apps/VCSM/src/features/ads/hooks/ |
| Screens | YES | apps/VCSM/src/features/ads/screens/ |
| Components | YES | apps/VCSM/src/features/ads/ui/ |
| Adapters | YES | apps/VCSM/src/features/ads/adapters/ |
| Engine controllers | NO | None |
| Engine DALs | NO | None |

---

## Active Controllers

No formal controller layer exists. The use-case module (`usecases/adPipeline.usecase.js`) fills the controller role with state-machine functions. There are no dedicated auth-gate controllers.

| Use-Case Function | Purpose | Auth Gate |
|---|---|---|
| `listAdsUseCase(actorId)` | Fetch all ads for an actor | None — actorId trusted from caller context |
| `createDraftUseCase(actorId)` | Create an in-memory ad draft | None — actorId set by caller |
| `saveDraftUseCase(ad)` | Validate and persist draft | None — ownership not re-verified at save |
| `publishAdUseCase(ad)` | Validate and mark ad ACTIVE | None — no server-side ownership check |
| `pauseAdUseCase(ad)` | Set status to PAUSED | None |
| `archiveAdUseCase(ad)` | Set status to ARCHIVED | None |
| `deleteAdUseCase(id)` | Remove ad by ID | None |

**Risk Note:** All use-case functions accept actorId or ad payloads from the caller without any server-side ownership assertion. Since persistence is localStorage-only, the blast radius is limited to the local browser session. When/if this is migrated to Supabase, all use-case entry points will need ownership gates before they are production-safe.

---

## Active DALs

| DAL | Tables / Storage | Notes |
|---|---|---|
| `ad.storage.dal.js` | `localStorage["vc.ads.pipeline.v1"]` | No Supabase tables. Uses `window.localStorage` directly. SSR-safe guard (`typeof window === "undefined"`). Read (listAdsByActor), upsert (upsertAd), delete (removeAd). |

**No Supabase `.from()` or `.rpc()` calls exist anywhere in this feature.**

There is also a thin API shim at `api/ad.api.js` that delegates to the DAL. It adds no logic — it is a pass-through layer.

---

## Active Hooks

| Hook | Calls | Purpose |
|---|---|---|
| `useVportAds(actorId)` | All 7 use-case functions in `adPipeline.usecase.js` | Primary view-model hook. Manages `ads`, `loading`, `saving`, `error` state. Exposes `reload`, `createDraft`, `saveDraft`, `publish`, `pause`, `archive`, `remove`. |
| `useDesktopBreakpoint` (local re-export) | `@/shared/hooks/useDesktopBreakpoint` | Thin re-export to shared canonical source. Detects desktop breakpoint for portal rendering. |

---

## Engine Dependencies

None — this feature has zero engine imports. All logic is self-contained within the feature folder.

---

## Cross-Feature Dependencies

| Feature | What Is Imported | Direction |
|---|---|---|
| `@/state/identity/identityContext` | `useIdentity()` | Consumed by `VportAdsSettingsScreen` — reads `identity.actorId` |
| `@/features/settings/styles/settings-modern.css` | CSS stylesheet | Consumed by `VportAdsSettingsScreen` — cross-feature CSS import |
| `@/shared/hooks/useDesktopBreakpoint` | `useDesktopBreakpoint` hook | Consumed via local re-export in `hooks/useDesktopBreakpoint.js` |

**Consumers of ads (from outside the feature):**

| Consumer | Import Path Used | Notes |
|---|---|---|
| `features/settings/vports/ui/VportsTab.view.jsx` | `@/features/ads/adapters/widgets/OnemoredaysAd.adapter` | Correct — uses adapter boundary |
| `features/dashboard/vport/dashboard/cards/settings/VportSettingsScreen.jsx` | `@/features/ads/adapters/hooks/useVportAds.adapter` | Correct — uses adapter boundary |

Both external consumers use the adapter boundary correctly — no raw internal imports observed.

---

## Authorization Pattern

There is no authorization gate in this feature. The screen reads `actorId` from route params (`useParams`) or falls back to `identity.actorId` from `useIdentity()`. This actorId is passed directly into use-case functions and into the DAL without any ownership assertion or server-side check.

This is safe for the current localStorage-only implementation, but constitutes a structural gap that must be closed before any Supabase migration. The pattern is:

```
VportAdsSettingsScreen → reads actorId from params/identity → passes to useVportAds → use-case functions → localStorage DAL
```

No RLS, no ownership table check, no session token validation anywhere in the chain.

---

## Module Independence Classification

**MOSTLY INDEPENDENT**

Reason: The feature has zero engine dependencies and all internal logic is self-contained. The only external dependencies are the shared identity context (`useIdentity`) and the shared breakpoint hook — both standard platform dependencies. External consumers correctly use the adapter boundary.

---

## Architecture State

**EVOLVING**

Reason: The feature is architecturally well-structured (adapters, models, hooks, DAL, use-cases) but the persistence layer is explicitly temporary (`localStorage`). Constants declare monetization as `coming_soon`. The feature is designed to be migrated to a real database backend. When that migration occurs, the use-case layer will require ownership gates, Supabase DALs, and RPC-backed writes.

---

## Known Structural Risks

1. **No authorization gate anywhere in the pipeline.** actorId is trusted from caller context. Safe now (localStorage), dangerous if migrated to Supabase without adding gates first. Ticket TICKET-BOOKING-RPC-001 documents the platform pattern for RPC-backed state machines — the same pattern should be applied here on migration.

2. **localStorage-only persistence.** All ad data is browser-local. No server-side record, no cross-device access, no RLS, no multi-session support. This is an architectural deferral, not a bug. Constants confirm this is intentional (`monetization.pricingModel = "coming_soon"`).

3. **Cross-feature CSS import.** `VportAdsSettingsScreen.jsx` imports `@/features/settings/styles/settings-modern.css` directly. This is a style dependency on a sibling feature — it should eventually be moved to shared styles or the ads feature should own its own CSS file.

4. **`useDesktopBreakpoint` local re-export.** `hooks/useDesktopBreakpoint.js` is a thin re-export of `@/shared/hooks/useDesktopBreakpoint`. This adds indirection without value and should be cleaned up to import from shared directly.

5. **No controller folder.** The use-case layer in `usecases/adPipeline.usecase.js` effectively serves as the controller but is not named or organized as one. When the feature gains a database backend, a proper `controller/` layer with explicit auth gates will be required.

6. **`ad.api.js` is a pure pass-through.** It adds no logic over the DAL and only exists as an indirection layer. Once the DAL migrates to Supabase, this may become useful for edge function routing — but currently it is dead weight.

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | DR_STRANGE.md + constants (monetization.pricingModel) | — |
| Owner defined | FAIL | No OWNERSHIP.md | Run IRONMAN |
| Entry points mapped | PASS | adsScreens.js + adapters/ | — |
| Controllers present | PARTIAL | usecases/adPipeline.usecase.js fills role | No formal controller/ layer; no auth gates |
| DAL/repository present | PASS | ad.storage.dal.js | localStorage only — no Supabase |
| Models/transformers | PASS | ad.model.js + ad.validation.js + vportAdsSettingsShell.model.js | — |
| Hooks/view models | PASS | useVportAds.js | — |
| Screens/components | PASS | VportAdsSettingsScreen.jsx + ui/components.jsx | — |
| Authorization path mapped | FAIL | No ownership gate anywhere in chain | Must be resolved before DB migration |
| Engine dependencies mapped | N/A | No engine dependencies | — |
| Tests/validation noted | FAIL | No test files found; SPIDER-MAN never run | — |

---

## Recommended Handoffs

| Command | Reason |
|---|---|
| VENOM | Security posture is UNKNOWN. No auth gate anywhere. THOR is blocked until VENOM clears. |
| IRONMAN | Ownership and feature responsibility are undocumented. |
| SPIDER-MAN | Zero test coverage. No regression safety net before any DB migration. |
| CARNAGE | Required when localStorage-to-Supabase migration is planned — needs schema design and migration scripts. |

---

## Final Module Status

**MOSTLY COMPLETE**

The ads feature is architecturally coherent for its current scope (localStorage pipeline with a coming-soon monetization deferral). All layers are present and correctly wired. The feature is not production-complete in the sense that it has no server-side persistence, no authorization, and no test coverage — but these are intentional deferrals documented in the constants. The architecture will need a complete auth and DAL overhaul before any real-money ad delivery is enabled.

---

## ARCHITECT Run Record
- Date: 2026-06-02
- Ticket: ARCHITECT-ADS-0001
- Architecture State: EVOLVING

---

## File Inventory (Full Source Scan)

| File | Layer | Role |
|---|---|---|
| ads.feature.js | Entry | Barrel export — screens, hooks, use-cases |
| constants.js | Config | AD_STATUSES, AD_FORMATS, DEFAULT_AD_BUDGET, AD_MONETIZATION, ADS_STORAGE_KEY |
| api/ad.api.js | API shim | Pass-through to DAL (fetchAds, saveAd, deleteAd) |
| dal/ad.storage.dal.js | DAL | localStorage read/upsert/delete |
| model/ad.model.js | Model | createAdDraft(), normalizeAd() |
| model/vportAdsSettingsShell.model.js | Model | createVportAdsSettingsShellStyles() — responsive style factory |
| lib/ad.validation.js | Validation | validateAdDraft(), isValidHttpUrl() |
| usecases/adPipeline.usecase.js | Use-cases | 7 state-machine functions (list, create, save, publish, pause, archive, delete) |
| hooks/useVportAds.js | Hook | Primary view-model; wraps all use-cases |
| hooks/useDesktopBreakpoint.js | Hook | Re-export of shared breakpoint hook |
| screens/VportAdsSettingsScreen.jsx | Screen | Full-screen ad pipeline manager; portal on desktop |
| screens/adsScreens.js | Barrel | Exports VportAdsSettingsScreen |
| ui/components.jsx | Components | AdStatusPill, AdsEmptyState, AdsList, AdEditor |
| ui/adsPipeline.ui.js | Barrel | Re-exports from ui/components.jsx |
| ui/VportAdsBackButton.jsx | Component | Back button with desktop/mobile variant |
| widgets/OnemoredaysAd.jsx | Widget | Static sponsored placement — OneMoreDays |
| adapters/hooks/useVportAds.adapter.js | Adapter | Re-exports useVportAds for cross-feature consumers |
| adapters/widgets/OnemoredaysAd.adapter.js | Adapter | Re-exports OnemoredaysAd widget for cross-feature consumers |
