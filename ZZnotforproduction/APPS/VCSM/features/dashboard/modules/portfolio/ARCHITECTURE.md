# ARCHITECTURE — Dashboard Module: portfolio

**Last ARCHITECT Run:** 2026-06-05 (V2 — full source verification)
**Architecture State:** SOURCE_VERIFIED
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001
**Scanner Version:** 1.1.0

---

## MODULE ARCHITECTURE REPORT

Module: portfolio
Application Scope: VCSM
Module Type: dashboard card module
Primary Root: apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/
Independence Status: MOSTLY INDEPENDENT
Completeness Status: MOSTLY COMPLETE

---

## PURPOSE

[SOURCE_VERIFIED] Manages VPORT portfolio media from the owner dashboard. Provides upload, probe, and record association for portfolio items. The `addPortfolioMediaWithRecord.controller.js` coordinates media upload + database record creation. The `probeVportPortfolio.controller.js` checks portfolio state for readiness. Media record writes go to `portfolio_media` table. Includes dev-only diagnostic panel (PortfolioDevDiagnosticPanel.jsx).

---

## OWNERSHIP

[SOURCE_VERIFIED] Owner: VCSM:dashboard
Write authority: addPortfolioMediaWithRecord.controller.js
Ownership enforcement — THREE LAYERS [all SOURCE_VERIFIED]:
1. Screen-level: `if (!isOwner) return <div>Owner access only.</div>` via useVportOwnership [line 132]
2. Controller-level: probeVportPortfolio.controller calls `assertActorOwnsVportActorController` [line 10]
3. DAL-level: portfolioMediaRecord.write.dal `.eq('profile_id', callerProfileId)` — PORT-V-005 defense-in-depth [line 14]

---

## ENTRY POINTS

[SOURCE_VERIFIED]
- Route: `/actor/:actorId/dashboard/portfolio` → VportDashboardPortfolioScreen.jsx
- Exported via: `index.js`

---

## LAYER MAP

DAL:
- `dal/portfolioMediaRecord.write.dal.js` — UPDATE portfolio_media with callerProfileId scope (PORT-V-005) [SOURCE_VERIFIED]

Model: NONE in card [SOURCE_VERIFIED]

Controller:
- `controller/addPortfolioMediaWithRecord.controller.js` — composite: addMedia (engine) + createMediaAssetController + updatePortfolioMediaAssetIdDAL [SOURCE_VERIFIED]
- `controller/probeVportPortfolio.controller.js` — portfolio state probe with assertActorOwnsVportActorController [SOURCE_VERIFIED]

Hook:
- `hooks/usePortfolioItemSubmit.js` — calls createItem/updateItem (@portfolio engine), addPortfolioMediaWithRecord, ctrlSavePortfolioDetail (profiles internals — BOUNDARY RISK) [SOURCE_VERIFIED]
- `hooks/usePortfolioMediaUpload.js` [SOURCE_VERIFIED]
- `hooks/useVportPortfolioProbe.js` — dev-only; calls probeVportPortfolioController [SOURCE_VERIFIED]

Engine consumption (screen level):
- `deleteItem` from `@portfolio` [SOURCE_VERIFIED — VportDashboardPortfolioScreen.jsx line 12]
- `useVportPortfolio` from `@/features/profiles/adapters/kinds/vport/vportProfiles.adapter` [SOURCE_VERIFIED line 13]
- `usePublishBarbershopPortfolioPost` from same profiles adapter [SOURCE_VERIFIED line 13]

Engine consumption (hook level — usePortfolioItemSubmit):
- `createItem`, `updateItem` from `@portfolio` [SOURCE_VERIFIED]

Component:
- `components/PortfolioBugsBunnyPanel.jsx` — dev diagnostic [SOURCE_VERIFIED]
- `components/PortfolioDevDiagnosticPanel.jsx` — dev diagnostic [SOURCE_VERIFIED]
- `components/portfolio/PortfolioItemForm.jsx` [SOURCE_VERIFIED]
- `components/portfolio/PortfolioManagerCard.jsx` [SOURCE_VERIFIED]

Screen:
- `VportDashboardPortfolioScreen.jsx` [SOURCE_VERIFIED]
- `index.js` [SOURCE_VERIFIED]

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Media upload + record association + probe | — |
| Owner defined | PASS | VCSM:dashboard | — |
| Entry points mapped | PASS | /actor/:actorId/dashboard/portfolio | — |
| Controllers present/delegated | PASS | 2 controllers | — |
| DAL/repository present/delegated | PARTIAL | Write DAL present; read DAL delegated to portfolio engine | Delegation undocumented |
| Models/transformers present | FAIL | No model file | MISSING |
| Hooks/view models present | PASS | 3 hooks | — |
| Screens/components present | PASS | Screen + 4 components | — |
| Services/adapters present | FAIL | No adapter | — |
| Database objects mapped | PASS | portfolio_media — UPDATE confirmed | — |
| Authorization path mapped | PASS | 3-layer ownership: screen isOwner + controller assertActorOwnsVportActorController + DAL callerProfileId [SOURCE_VERIFIED] | — |
| Cache/runtime behavior mapped | FAIL | Not documented | — |
| Error/loading/empty states mapped | PARTIAL | Components exist; error surface unclear | — |
| Documentation linked | FAIL | No BEHAVIOR.md | MISSING |
| Tests/validation noted | PARTIAL | portfolio.index.rule9.test.js + portfolio.spiderman.test.js | — |
| Native parity noted | FAIL | No notes | — |
| Engine dependencies mapped | PASS | @portfolio engine: deleteItem, createItem, updateItem, addMedia confirmed [SOURCE_VERIFIED] | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| @portfolio engine | engine | portfolio card → portfolio engine | YES — via engine barrel | deleteItem, createItem, updateItem, addMedia [SOURCE_VERIFIED] |
| profiles adapter | feature-adapter | portfolio → profiles | YES — via adapter | useVportPortfolio, usePublishBarbershopPortfolioPost [SOURCE_VERIFIED] |
| profiles/kinds/vport/controller (locksmith) | feature-controller | usePortfolioItemSubmit → profiles internals | RISK — direct internal import (not via adapter) | ctrlSavePortfolioDetail, publishLocksmithPortfolioUpdateAsPostController [SOURCE_VERIFIED] |
| media upload service | service | portfolio → media | YES — via createMediaAssetController + media adapter | Confirmed in addPortfolioMediaWithRecord |
| booking adapter | feature-adapter | probeController → booking | YES — via adapter | assertActorOwnsVportActorController [SOURCE_VERIFIED] |
| portfolio_media table | database | write | YES — owned | UPDATE confirmed |
| OwnerOnlyDashboardGuard | route | route wrapper | YES | Route-level auth |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| portfolio_media | write | VCSM:dashboard/portfolio | addPortfolioMediaWithRecord | UPDATE confirmed |
| portfolio read | read | portfolio engine (implied) | probeVportPortfolio | Read path source unclear |
| media upload | write | media service | addPortfolioMediaWithRecord | Upload mechanism undocumented |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | /actor/:actorId/dashboard/portfolio | — |
| Loading state | PARTIAL | usePortfolioMediaUpload manages upload state | — |
| Empty state | PARTIAL | PortfolioManagerCard likely handles | Unverified |
| Error state | PARTIAL | Controllers throw; UI handling unclear | — |
| Auth/owner gates | PASS | 3-layer ownership verified: screen isOwner + controller assert + DAL callerProfileId [SOURCE_VERIFIED] | — |
| Cache behavior | UNKNOWN | Not documented | — |
| Runtime dependencies | PARTIAL | Upload mechanism undocumented | MEDIUM |
| Hot paths | PARTIAL | addPortfolioMediaWithRecord is hot on upload | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | — | MISSING |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BOUNDARY VIOLATION: ctrlSavePortfolioDetail import | HIGH | usePortfolioItemSubmit imports directly from profiles/kinds/vport/controller/locksmith — bypasses adapter | SENTRY |
| BOUNDARY VIOLATION: publishLocksmithPortfolioUpdateAsPostController | HIGH | Same hook imports controller from profiles internals — not via adapter | SENTRY |
| BEHAVIOR.md | HIGH | Upload + probe + locksmith detail flow undocumented | LOGAN |
| Model layer | MEDIUM | No model file in module | IRONMAN |
| Media upload mechanism documentation | MEDIUM | Upload target (Cloudflare/Supabase storage) undocumented | LOKI |

---

## MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING**
Location: apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/hooks/usePortfolioItemSubmit.js:5-6
Module: portfolio
Current dependency:
  `import { ctrlSavePortfolioDetail } from "@/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller"`
  `import { publishLocksmithPortfolioUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller"`
Expected boundary: Access through profiles adapter
Risk: HIGH — direct cross-feature internal controller import bypasses adapter contract
Suggested correction: Expose ctrlSavePortfolioDetail and publishLocksmithPortfolioUpdateAsPostController from the vportProfiles adapter

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Fix ctrlSavePortfolioDetail + publishLocksmithPortfolioUpdateAsPostController imports | Cross-feature internal controller import — add to profiles adapter | SENTRY |
| P1 | Add BEHAVIOR.md | Upload + probe + locksmith detail flow undocumented | LOGAN |
| P2 | Add model layer | No model file | IRONMAN |
| P2 | Document media upload mechanism | Upload path (Cloudflare/Supabase) undocumented | LOKI |
| P3 | Native parity notes | Not documented | Falcon |

## RECOMMENDED HANDOFFS: SENTRY, LOGAN, IRONMAN, LOKI
