---
name: vcsm.portfolio.architecture
description: ARCHITECT V2 module architecture report for VCSM:portfolio
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** portfolio
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/portfolio
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** INCOMPLETE

---

## PURPOSE

The portfolio feature is VCSM's thin app-side setup and trace layer for the `engines/portfolio` engine. It initializes the portfolio engine with the Supabase client and an ownership resolver at app startup (`setupVcsmPortfolioEngine`), and exposes a debug trace adapter (`portfolioTrace.adapter.js`) that feeds dev-only trace events into an in-memory store. All portfolio domain logic — CRUD controllers, DAL, models, tags, media — lives entirely in `engines/portfolio`, not in this feature directory.

## OWNERSHIP

Portfolio feature team / VCSM platform. The engine is independently owned under `engines/portfolio`. The app-side feature owns only the DI wiring and the dev trace surface.

## ENTRY POINTS

- `apps/VCSM/src/features/portfolio/setup.js` — `setupVcsmPortfolioEngine()` called once at app startup (`main.jsx`) before any component renders
- `apps/VCSM/src/features/portfolio/adapters/portfolioTrace.adapter.js` — dev-only trace subscription surface used by `PortfolioDebugPanel`
- `engines/portfolio/src/adapters/index.js` — the engine's public API (controllers, models, config) consumed by `profiles` and `dashboard` features

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 0 | None in feature dir — all DAL in engines/portfolio/src/dal/ |
| Model | 0 | None in feature dir — all models in engines/portfolio/src/model/ |
| Controller | 0 | None in feature dir — 8 controllers in engines/portfolio/src/controller/ |
| Service | 1 | engines/portfolio/src/services/portfolioService.js |
| Adapter | 3 | portfolioTrace.adapter.js (feature); engines/portfolio/src/adapters/index.js (engine) |
| Hook | 0 | No hooks — engine consumed directly by profiles/dashboard hooks |
| Component | 0 | None in feature dir |
| Screen | 0 | None in feature dir |
| Barrel | 1 | engines/portfolio/index.js |

Counts above reflect cg_layerCounts from scanner (adapter: 3, module: 1) plus engine source inspection.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | setup.js comment explains role | BEHAVIOR.md is PLACEHOLDER — no contract written |
| Owner defined | PARTIAL | CLAUDE.md at engine level defines scope | No OWNERSHIP record in docs |
| Entry points mapped | PASS | setup.js + adapter confirmed | No route — portfolio has no standalone screen entry |
| Controllers present/delegated | PASS | 8 controllers in engines/portfolio (listPortfolio, createItem, updateItem, deleteItem, addMedia, removeMedia, manageTags, getPortfolioItem) | None in feature dir — correct by design |
| DAL/repository present/delegated | PASS | portfolioItems.read.dal.js, portfolioItems.write.dal.js, portfolioMedia.*.dal.js, portfolioTags.*.dal.js, barberDetails.read.dal.js, locksmithDetails.read.dal.js confirmed in engine | No app-side DAL — correct by design |
| Models/transformers present | PASS | PortfolioItemModel, PortfolioMediaModel, BarberDetailsModel, LocksmithDetailsModel in engine | None in feature dir — correct by design |
| Hooks/view models present | FAIL | 0 hooks in scanner data | No usePortfolio hook in feature dir; consuming features (profiles, dashboard) own hooks directly |
| Screens/components present | FAIL | 0 screens, 0 components | No portfolio screen or component in feature dir |
| Services/adapters present | PASS | portfolioService.js (engine), portfolioTrace.adapter.js (feature) | |
| Database objects mapped | PASS | vport.portfolio_items, vport.portfolio_media, vport.portfolio_tags, vport.barber_portfolio_details, vport.locksmith_portfolio_details, vport.portfolio_item_metrics, vport.portfolio_item_services | Write surface scanner shows 0 from feature dir — all writes are in engine (correct) |
| Authorization path mapped | PASS | setup.js: isActorOwner injects vc.actor_owners RLS-scoped query (PORT-V-001) | Engine controllers call isActorOwner before mutations |
| Cache/runtime behavior mapped | PARTIAL | Dev trace store with 50-event ring buffer in setup.js | No runtime cache layer; no invalidation strategy documented |
| Error/loading/empty states mapped | FAIL | listPortfolio returns { items: [], hasMore: false } for empty — other states undocumented | No error boundary or loading state in feature layer |
| Documentation linked | FAIL | BEHAVIOR.md is PLACEHOLDER status | BEHAVIOR.md not populated; no ARCHITECTURE.md previously |
| Tests/validation noted | PARTIAL | 0 tests in feature dir; engines/portfolio has 2 test files (updateItem.controller.test.js, portfolioTags.write.dal.test.js) | No app-side integration tests |
| Native parity noted | N/A | | |
| Engine dependencies mapped | PASS | engines: booking, portfolio declared in scanner | engines/portfolio consumed via @portfolio alias; booking engine also declared |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/portfolio | engine | feature → engine | YES — standard engine consumption | Consumed via @portfolio alias; setup.js calls configurePortfolioEngine |
| engines/booking | engine | feature → engine (declared) | YES | Declared in scanner engine list; not directly visible in feature src files — likely consumed by downstream features that also import portfolio |
| @/services/supabase/supabaseClient | service | feature → service | YES | Injected into engine at startup |
| vc.actor_owners | DB table | feature → DB (RLS-scoped read) | YES | Ownership check in isActorOwner; RLS policy actor_owners_read_own enforced at DB |
| vport.portfolio_items | DB table | engine → DB | YES — via engine DAL | insert, update, soft-delete |
| vport.portfolio_media | DB table | engine → DB | YES — via engine DAL | insert, delete |
| vport.portfolio_tags | DB table | engine → DB | YES — via engine DAL | insert, delete |
| vport.barber_portfolio_details | DB table | engine → DB (read) | YES | barberDetails.read.dal.js |
| vport.locksmith_portfolio_details | DB table | engine → DB (read) | YES | locksmithDetails.read.dal.js |
| features/profiles | cross-feature consumer | profiles → portfolio engine | N/A | profiles imports from @portfolio directly; portfolioTrace.adapter consumed by debugger |
| features/dashboard | cross-feature consumer | dashboard → portfolio engine | N/A | dashboard declared as portfolio engine consumer |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| vport.portfolio_items | INSERT, UPDATE, soft-DELETE | engines/portfolio | engines/portfolio controllers | Ownership gated via isActorOwner + callerProfileId filter on UPDATE/DELETE |
| vport.portfolio_media | INSERT, DELETE | engines/portfolio | addMedia, removeMedia controllers | |
| vport.portfolio_tags | INSERT, DELETE | engines/portfolio | manageTags controller | |
| vport.barber_portfolio_details | READ | engines/portfolio | barberDetails.read.dal.js | |
| vport.locksmith_portfolio_details | READ | engines/portfolio | locksmithDetails.read.dal.js | |
| vc.actor_owners | READ (RLS-scoped) | features/portfolio setup.js | isActorOwner resolver injected into engine | RLS auto-scopes to auth.uid(); no explicit user_id filter needed |
| portfolioTraceStore | In-memory | features/portfolio setup.js | portfolioTrace.adapter.js, PortfolioDebugPanel | DEV-only; guarded by import.meta.env.DEV |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | NOT APPLICABLE | No standalone portfolio route; portfolio is embedded in profiles and dashboard | Portfolio items render inside profile/dashboard screens |
| Loading state | PARTIAL | Engine controllers return empty arrays on no-data; no app-side loading state | Consuming features (profiles, dashboard) own loading states |
| Empty state | PASS | listPortfolio returns { items: [], hasMore: false } explicitly | |
| Error state | PARTIAL | Engine DAL throws on Supabase error; consuming features must catch | No centralized error boundary in this feature |
| Auth/owner gates | PASS | isActorOwner resolver wired in setup.js; PORT-V-001 comment confirms vc.actor_owners query | Engine enforces ownership before create/update/delete |
| Cache behavior | FAIL | No cache layer; no SWR/react-query integration in engine or feature | Consuming hooks own invalidation |
| Runtime dependencies | PASS | setupVcsmPortfolioEngine() must be called before first render; guard (_configured flag) prevents double-init | Risk: if setup.js is not called, engine throws on first DAL call |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/portfolio/BEHAVIOR.md | PRESENT BUT PLACEHOLDER |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | engines/portfolio/CLAUDE.md | PARTIAL (scope rules only) |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is PLACEHOLDER | HIGH | No contract documenting happy paths, edge cases, visibility rules, or vport-kind discriminators — consuming features have no authoritative reference | LOGAN |
| No CURRENT_STATUS.md | MEDIUM | No status record prior to this run | ARCHITECT (this run creates it) |
| No app-side hook wrapping engine | MEDIUM | Consuming features (profiles, dashboard) reach directly into @portfolio engine — no VCSM-specific usePortfolio hook exists; creates divergent consumption patterns | IRONMAN |
| No tests in feature directory | MEDIUM | 2 engine tests exist but app-side wiring (isActorOwner, setup, trace adapter) has no test coverage | SPIDER-MAN |
| ARCHITECTURE.md missing (pre this run) | LOW | No architectural reference existed before this ARCHITECT pass | ARCHITECT (resolved this run) |
| portfolioTrace.adapter.js has no dev guard at import level | LOW | Adapter exports are always present in bundle; relies on DEV check inside setup.js — trace store is created in all environments | VENOM |
| Booking engine declared but not traced in feature source | LOW | Scanner declares booking as a dependency; not visible in feature src — may be transitive via profiles/dashboard consuming both engines | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

- `portfolioTrace.adapter.js` imports directly from `@/features/portfolio/setup` — this is an intra-feature import and is within boundary rules.
- `engines/portfolio` correctly never imports from `apps/VCSM/` (confirmed via CLAUDE.md scope rules and source reading).
- No direct cross-feature DAL imports detected in the feature directory.
- `profiles` and `dashboard` consume `@portfolio` engine directly (not through this feature's adapter) — this is acceptable as the engine is a shared dependency, but it means portfolioTrace.adapter.js is only useful to the debug panel, not to consuming features.

No boundary violations detected in static scan.

---

## SPAGHETTI SCORE

**Module:** portfolio
**Score:** CLEAN
**Reasons:** Feature directory contains exactly 2 files with clearly separated responsibilities (setup/DI wiring and trace adapter). All domain logic is correctly delegated to the engine. DI pattern is used properly. Ownership check uses RLS-scoped query with documented reasoning (PORT-V-001).
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no behavior documented

**Check A (Source without behavior):** FAIL — source exists and is functional; BEHAVIOR.md is an empty placeholder
**Check B (Behavior without source):** N/A — BEHAVIOR.md has no §3 happy paths to verify
**Check C (§13 engine consistency):** PARTIAL — scanner declares engines: booking, portfolio; portfolio engine import confirmed in setup.js; booking engine not directly imported in feature src (may be transitive)
**Check D (§6 data change consistency):** N/A — BEHAVIOR.md has no §6 data changes documented; scanner write surfaces are 0 for this feature (all writes are in engine, correct)

---

## FINAL MODULE STATUS

INCOMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write BEHAVIOR.md — document happy paths, visibility rules (public/private), vport-kind discriminators (barber/locksmith), ownership model, and portfolio item lifecycle | Consuming features have no authoritative contract | LOGAN |
| P2 | Create usePortfolio hook in feature or profiles layer that wraps engine controllers | Direct engine consumption by profiles and dashboard is a fragile coupling — a VCSM-specific hook would centralize invalidation and loading state | IRONMAN |
| P3 | Add app-side tests for setup.js isActorOwner resolver and portfolioTrace.adapter.js | Only engine-level tests exist; wiring is untested | SPIDER-MAN |
| P4 | VENOM review of portfolioTrace.adapter.js — confirm trace store cannot leak in production builds | DEV guard is in setup.js but adapter exports are always bundled | VENOM |

## RECOMMENDED HANDOFFS

- **LOGAN** — Write the BEHAVIOR.md contract (P1 blocker)
- **IRONMAN** — Evaluate whether a usePortfolio hook should be added to eliminate direct engine consumption by profiles/dashboard
- **SPIDER-MAN** — Add integration test coverage for setup.js wiring and isActorOwner resolver
- **VENOM** — Audit portfolioTrace.adapter.js for production bundle exposure

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
