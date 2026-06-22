# VCSM DAL — `public`

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/public/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 11 |
| Exported functions | 15 |
| Tables accessed | 5 |
| RPCs called | 3 |
| Risk findings | 0 |

## DAL Files

### `businessCardSections.read.dal.js`

**Path:** `features/public/vportBusinessCard/dal/businessCardSections.read.dal.js`  
**Operations:** `rpc`  

**Exported functions:**

| `readBusinessCardSectionsDAL` | `rpc` | —`get_business_card_sections` |

### `readPublicVportReviewDimensions.dal.js`

**Path:** `features/public/vportMenu/dal/readPublicVportReviewDimensions.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `invalidatePublicReviewDimensionsCache` | `read` | `public_vport_review_dimensions_v` |
| `readPublicVportReviewDimensionsDAL` | `read` | `public_vport_review_dimensions_v` |

### `readPublicVportReviewSummary.dal.js`

**Path:** `features/public/vportMenu/dal/readPublicVportReviewSummary.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `invalidatePublicReviewSummaryCache` | `read` | `public_vport_review_summary_v` |
| `readPublicVportReviewSummaryDAL` | `read` | `public_vport_review_summary_v` |

### `readPublicVportReviews.dal.js`

**Path:** `features/public/vportMenu/dal/readPublicVportReviews.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readPublicVportReviewsDAL` | `read` | `public_vport_reviews_v` |

### `readVportPublicDetails.rpc.dal.js`

**Path:** `features/public/vportMenu/dal/readVportPublicDetails.rpc.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readVportPublicDetailsRpcDAL` | `read` | `public_actor_seo_v`, `public_menu_read_model_v` |

### `readVportPublicMenu.rpc.dal.js`

**Path:** `features/public/vportMenu/dal/readVportPublicMenu.rpc.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readVportPublicMenuRpcDAL` | `read` | `public_menu_read_model_v` |

### `resolveMenuSlug.dal.js`

**Path:** `features/public/vportMenu/dal/resolveMenuSlug.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `invalidateMenuSlugCache` | `read` | `public_menu_read_model_v` |
| `resolveMenuSlugDAL` | `read` | `public_menu_read_model_v` |

### `resolveVportSlug.dal.js`

**Path:** `features/public/vportMenu/dal/resolveVportSlug.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `invalidateVportSlugCache` | `read` | `public_actor_seo_v` |
| `resolveVportSlugDAL` | `read` | `public_actor_seo_v` |

### `sendLeadConfirmationEmail.edge.dal.js`

**Path:** `features/public/vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal.js`  
**Operations:** `unknown`  

**Exported functions:**

| `sendLeadConfirmationEmailDAL` | `unknown` | — |

### `vportBusinessCard.read.dal.js`

**Path:** `features/public/vportBusinessCard/dal/vportBusinessCard.read.dal.js`  
**Operations:** `rpc`  

**Exported functions:**

| `readVportBusinessCardPublicBySlugDAL` | `rpc` | —`read_business_card_public` |

### `vportBusinessCardLead.write.dal.js`

**Path:** `features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js`  
**Operations:** `rpc`  

**Exported functions:**

| `createVportBusinessCardLeadDAL` | `rpc` | —`submit_business_card_lead` |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `public_actor_seo_v` | READ | `invalidateVportSlugCache`, `readVportPublicDetailsRpcDAL`, `resolveVportSlugDAL` |
| `public_menu_read_model_v` | READ | `invalidateMenuSlugCache`, `readVportPublicDetailsRpcDAL`, `readVportPublicMenuRpcDAL`, `resolveMenuSlugDAL` |
| `public_vport_review_dimensions_v` | READ | `invalidatePublicReviewDimensionsCache`, `readPublicVportReviewDimensionsDAL` |
| `public_vport_review_summary_v` | READ | `invalidatePublicReviewSummaryCache`, `readPublicVportReviewSummaryDAL` |
| `public_vport_reviews_v` | READ | `readPublicVportReviewsDAL` |

## RPCs Called

| RPC | Via Functions |
|---|---|
| `get_business_card_sections` | `readBusinessCardSectionsDAL` |
| `read_business_card_public` | `readVportBusinessCardPublicBySlugDAL` |
| `submit_business_card_lead` | `createVportBusinessCardLeadDAL` |

---

## Risk Findings

**DEAD CODE — 4 orphaned cache invalidators:** The following functions are exported but have zero callers anywhere in `apps/VCSM/src/`. The cache infrastructure exists (TTL caches are active), but the invalidation hooks were never connected to any write path:

- `invalidatePublicReviewDimensionsCache` — review dimensions cache, 60s TTL, no write-path caller
- `invalidatePublicReviewSummaryCache` — review summary cache, 60s TTL, no write-path caller
- `invalidateMenuSlugCache` — menu slug cache, 10-minute TTL, no write-path caller
- `invalidateVportSlugCache` — vport slug cache, 10-minute TTL, no write-path caller

**Cache coherency risk (MEDIUM):** Because the invalidators are never called, the caches only clear by TTL expiry. A vport that renames their slug, deletes their menu, or receives a new review will serve stale data for up to 10 minutes (slugs) or 60 seconds (reviews). A deleted menu or vport will 404 only after the TTL window passes.

**Architecture debt:** The pattern is built but broken — either the invalidators should be wired into mutation controllers (on review create, vport update, menu create/delete), or the exported functions should be removed and the feature accepted as TTL-only cached.

**`sendLeadConfirmationEmail.edge.dal.js` — `operations: unknown` is expected:** This DAL invokes the Supabase Edge Function `send-lead-confirmation` via `supabase.functions.invoke()`. It is fully live, called fire-and-forget inside `submitVportBusinessCardLeadController` immediately after the lead write. Email failures are silently swallowed with `.catch(() => {})` so they do not block lead submission. The `unknown` operation label is correct — there is no direct Supabase table access.

**Final Screen MISSING — false positive:** The Architecture Pipeline scanner marked Final Screen as MISSING because it scanned for `*.screen.jsx` (dot-notation) and `/screens/` (plural). The actual files live in `/screen/` (singular) subdirectory with PascalCase naming (`VportPublicMenuBySlugScreen.jsx`). All 6 documented screens exist on disk. Two additional screens were also found not yet in the doc: `VportPublicMenuQrScreen.jsx` and `VportPublicMenuRedirectScreen.jsx`.

---

## Pending Reviews

**Cache invalidators — DELETE OR WIRE (requires IRONMAN ownership confirmation):**

1. `invalidatePublicReviewDimensionsCache` in `readPublicVportReviewDimensions.dal.js`
2. `invalidatePublicReviewSummaryCache` in `readPublicVportReviewSummary.dal.js`
3. `invalidateMenuSlugCache` in `resolveMenuSlug.dal.js`
4. `invalidateVportSlugCache` in `resolveVportSlug.dal.js`

Options: (a) delete all four and accept TTL-only cache behaviour, or (b) wire each into its corresponding write-path controller (review create, vport update, menu create/delete). Decision belongs to IRONMAN.

**Architecture Pipeline Final Screen entry** — needs correction. See audit section below.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `businessCardSections.read.dal.js`

**Direct callers:**

- `vportBusinessCard.controller.js` _Controller_

**Full call chain to screen:**

```
`businessCardSections.read.dal.js` → `vportBusinessCard.controller.js` → `useVportBusinessCardExperience.js` → `VportBusinessCardPublic.view.jsx` → `VportBusinessCardPublic.screen.jsx`
```

### `sendLeadConfirmationEmail.edge.dal.js`

**Direct callers:**

- `vportBusinessCard.controller.js` _Controller_

**Full call chain to screen:**

```
`sendLeadConfirmationEmail.edge.dal.js` → `vportBusinessCard.controller.js` → `useVportBusinessCardExperience.js` → `VportBusinessCardPublic.view.jsx` → `VportBusinessCardPublic.screen.jsx`
```

### `vportBusinessCard.read.dal.js`

**Direct callers:**

- `vportBusinessCard.controller.js` _Controller_

**Full call chain to screen:**

```
`vportBusinessCard.read.dal.js` → `vportBusinessCard.controller.js` → `useVportBusinessCardExperience.js` → `VportBusinessCardPublic.view.jsx` → `VportBusinessCardPublic.screen.jsx`
```

### `vportBusinessCardLead.write.dal.js`

**Direct callers:**

- `vportBusinessCard.controller.js` _Controller_

**Full call chain to screen:**

```
`vportBusinessCardLead.write.dal.js` → `vportBusinessCard.controller.js` → `useVportBusinessCardExperience.js` → `VportBusinessCardPublic.view.jsx` → `VportBusinessCardPublic.screen.jsx`
```

### `readPublicVportReviewDimensions.dal.js`

**Direct callers:**

- `getVportPublicReviews.controller.js` _Controller_

**Full call chain to screen:**

```
`readPublicVportReviewDimensions.dal.js` → `getVportPublicReviews.controller.js` → `useVportPublicReviews.js` → `VportPublicMenuView.jsx` → `VportPublicMenuBySlugScreen.jsx`
```
```
`readPublicVportReviewDimensions.dal.js` → `getVportPublicReviews.controller.js` → `useVportPublicReviews.js` → `VportPublicMenuView.jsx` → `VportPublicMenuScreen.jsx`
```
```
`readPublicVportReviewDimensions.dal.js` → `getVportPublicReviews.controller.js` → `useVportPublicReviews.js` → `VportPublicReviewsView.jsx` → `VportPublicReviewsBySlugScreen.jsx`
```

### `readPublicVportReviewSummary.dal.js`

**Direct callers:**

- `getVportPublicReviews.controller.js` _Controller_

**Full call chain to screen:**

```
`readPublicVportReviewSummary.dal.js` → `getVportPublicReviews.controller.js` → `useVportPublicReviews.js` → `VportPublicMenuView.jsx` → `VportPublicMenuBySlugScreen.jsx`
```
```
`readPublicVportReviewSummary.dal.js` → `getVportPublicReviews.controller.js` → `useVportPublicReviews.js` → `VportPublicMenuView.jsx` → `VportPublicMenuScreen.jsx`
```
```
`readPublicVportReviewSummary.dal.js` → `getVportPublicReviews.controller.js` → `useVportPublicReviews.js` → `VportPublicReviewsView.jsx` → `VportPublicReviewsBySlugScreen.jsx`
```

### `readPublicVportReviews.dal.js`

**Direct callers:**

- `getVportPublicReviews.controller.js` _Controller_

**Full call chain to screen:**

```
`readPublicVportReviews.dal.js` → `getVportPublicReviews.controller.js` → `useVportPublicReviews.js` → `VportPublicMenuView.jsx` → `VportPublicMenuBySlugScreen.jsx`
```
```
`readPublicVportReviews.dal.js` → `getVportPublicReviews.controller.js` → `useVportPublicReviews.js` → `VportPublicMenuView.jsx` → `VportPublicMenuScreen.jsx`
```
```
`readPublicVportReviews.dal.js` → `getVportPublicReviews.controller.js` → `useVportPublicReviews.js` → `VportPublicReviewsView.jsx` → `VportPublicReviewsBySlugScreen.jsx`
```

### `readVportPublicDetails.rpc.dal.js`

**Direct callers:**

- `publicFeature.group.js` _Other_
- `getVportPublicDetails.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportPublicDetails.rpc.dal.js` → `publicFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```
```
`readVportPublicDetails.rpc.dal.js` → `getVportPublicDetails.controller.js` → `useVportPublicDetails.js` → `VportPublicMenuView.jsx` → `VportPublicMenuBySlugScreen.jsx`
```
```
`readVportPublicDetails.rpc.dal.js` → `getVportPublicDetails.controller.js` → `useVportPublicDetails.js` → `VportPublicMenuView.jsx` → `VportPublicMenuScreen.jsx`
```
```
`readVportPublicDetails.rpc.dal.js` → `getVportPublicDetails.controller.js` → `useVportPublicDetails.js` → `VportPublicReviewsView.jsx` → `VportPublicReviewsBySlugScreen.jsx`
```

### `readVportPublicMenu.rpc.dal.js`

**Direct callers:**

- `publicFeature.group.js` _Other_
- `getVportPublicMenu.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportPublicMenu.rpc.dal.js` → `publicFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```
```
`readVportPublicMenu.rpc.dal.js` → `getVportPublicMenu.controller.js` → `useVportPublicMenu.js` → `VportPublicMenuView.jsx` → `VportPublicMenuBySlugScreen.jsx`
```
```
`readVportPublicMenu.rpc.dal.js` → `getVportPublicMenu.controller.js` → `useVportPublicMenu.js` → `VportPublicMenuView.jsx` → `VportPublicMenuScreen.jsx`
```

### `resolveMenuSlug.dal.js`

**Direct callers:**

- `resolveMenuSlug.controller.js` _Controller_

**Full call chain to screen:**

```
`resolveMenuSlug.dal.js` → `resolveMenuSlug.controller.js` → `useResolveMenuSlug.js` → `VportPublicMenuBySlugScreen.jsx`
```
```
`resolveMenuSlug.dal.js` → `resolveMenuSlug.controller.js` → `useResolveMenuSlug.js` → `VportPublicMenuQrBySlugScreen.jsx`
```

### `resolveVportSlug.dal.js`

**Direct callers:**

- `resolveVportSlug.controller.js` _Controller_

**Full call chain to screen:**

```
`resolveVportSlug.dal.js` → `resolveVportSlug.controller.js` → `useResolveVportSlug.js` → `VportPublicReviewsBySlugScreen.jsx`
```
```
`resolveVportSlug.dal.js` → `resolveVportSlug.controller.js` → `useResolveVportSlug.js` → `VportPublicReviewsQrBySlugScreen.jsx`
```

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `businessCardSettings.model.js`, `vportBusinessCard.model.js`, `vportPublicDetails.model.js`, `vportPublicMenu.model.js`, `vportPublicMenuPanel.model.js`, `vportPublicReviews.model.js` |
| **Controller** | ✓ PRESENT | `vportBusinessCard.controller.js`, `getVportPublicDetails.controller.js`, `getVportPublicMenu.controller.js`, `getVportPublicReviews.controller.js`, `resolveMenuSlug.controller.js`, `resolveVportSlug.controller.js` |
| **Adapter** | ✓ PRESENT | `vportMenu.adapter.js` |
| **Service** | ✗ MISSING | — |
| **Hook** | ✓ PRESENT | `useVportBusinessCardExperience.js`, `useVportBusinessCardLeadForm.js`, `useVportBusinessCardSections.js`, `useDesktopBreakpoint.js`, `useResolveMenuSlug.js`, `useResolveVportSlug.js` +3 more |
| **Component** | ✓ PRESENT | `BusinessCardSectionCard.jsx`, `VportPublicMenuPanel.jsx`, `VportPublicReviewCard.jsx`, `VportPublicReviewDimensions.jsx`, `VportPublicReviewEmptyState.jsx`, `VportPublicReviewSummary.jsx` +1 more |
| **View Screen** | ✓ PRESENT | `VportPublicMenuQrView.jsx`, `VportPublicMenuView.jsx`, `VportPublicReviewsQrView.jsx`, `VportPublicReviewsView.jsx` |
| **Final Screen** | ✓ PRESENT | `VportBusinessCardPublic.screen.jsx`, `VportPublicMenuBySlugScreen.jsx`, `VportPublicMenuQrBySlugScreen.jsx`, `VportPublicMenuScreen.jsx`, `VportPublicReviewsBySlugScreen.jsx`, `VportPublicReviewsQrBySlugScreen.jsx` +2 more |

### Model

_Pure transforms — no side effects, no DB access_

- `features/public/vportBusinessCard/model/businessCardSettings.model.js`
- `features/public/vportBusinessCard/model/vportBusinessCard.model.js`
- `features/public/vportMenu/model/vportPublicDetails.model.js`
- `features/public/vportMenu/model/vportPublicMenu.model.js`
- `features/public/vportMenu/model/vportPublicMenuPanel.model.js`
- `features/public/vportMenu/model/vportPublicReviews.model.js`

### Controller

_Business rules, ownership, permissions — no React_

- `features/public/vportBusinessCard/controller/vportBusinessCard.controller.js`
- `features/public/vportMenu/controller/getVportPublicDetails.controller.js`
- `features/public/vportMenu/controller/getVportPublicMenu.controller.js`
- `features/public/vportMenu/controller/getVportPublicReviews.controller.js`
- `features/public/vportMenu/controller/resolveMenuSlug.controller.js`
- `features/public/vportMenu/controller/resolveVportSlug.controller.js`

### Adapter

_Cross-feature boundary — only approved cross-feature access point_

- `features/public/vportMenu/adapters/vportMenu.adapter.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/public/vportBusinessCard/hooks/useVportBusinessCardExperience.js`
- `features/public/vportBusinessCard/hooks/useVportBusinessCardLeadForm.js`
- `features/public/vportBusinessCard/hooks/useVportBusinessCardSections.js`
- `features/public/vportMenu/hooks/useDesktopBreakpoint.js`
- `features/public/vportMenu/hooks/useResolveMenuSlug.js`
- `features/public/vportMenu/hooks/useResolveVportSlug.js`
- `features/public/vportMenu/hooks/useVportPublicDetails.js`
- `features/public/vportMenu/hooks/useVportPublicMenu.js`
- `features/public/vportMenu/hooks/useVportPublicReviews.js`

### Component

_Presentational only — no hooks, no data fetching_

- `features/public/vportBusinessCard/view/components/BusinessCardSectionCard.jsx`
- `features/public/vportMenu/components/VportPublicMenuPanel.jsx`
- `features/public/vportMenu/components/VportPublicReviewCard.jsx`
- `features/public/vportMenu/components/VportPublicReviewDimensions.jsx`
- `features/public/vportMenu/components/VportPublicReviewEmptyState.jsx`
- `features/public/vportMenu/components/VportPublicReviewSummary.jsx`
- `features/public/vportMenu/components/VportPublicReviewsPanel.jsx`

### View Screen

_Hooks + component composition — no business logic_

- `features/public/vportMenu/view/VportPublicMenuQrView.jsx`
- `features/public/vportMenu/view/VportPublicMenuView.jsx`
- `features/public/vportMenu/view/VportPublicReviewsQrView.jsx`
- `features/public/vportMenu/view/VportPublicReviewsView.jsx`

### Missing Layers

- 🟡 **Service** — not detected in static scan

> ~~Final Screen — not detected in static scan~~ — **corrected 2026-05-11**: Final screens exist in `/screen/` (singular) subdirectory with PascalCase naming. ARCHITECT's scanner missed them due to path/naming pattern mismatch. See Dead Code Audit below.

### Final Screen

_Route entry + identity gate only — no computation_

- `features/public/vportBusinessCard/screen/VportBusinessCardPublic.screen.jsx`
- `features/public/vportMenu/screen/VportPublicMenuBySlugScreen.jsx`
- `features/public/vportMenu/screen/VportPublicMenuQrBySlugScreen.jsx`
- `features/public/vportMenu/screen/VportPublicMenuQrScreen.jsx`
- `features/public/vportMenu/screen/VportPublicMenuRedirectScreen.jsx`
- `features/public/vportMenu/screen/VportPublicMenuScreen.jsx`
- `features/public/vportMenu/screen/VportPublicReviewsBySlugScreen.jsx`
- `features/public/vportMenu/screen/VportPublicReviewsQrBySlugScreen.jsx`

---

## Dead Code Audit

_Audit Date:_ 2026-05-11
_Auditor:_ ARCHITECT static scan + live import grep
_Scope:_ 11 DAL files · 15 exported functions
_Method:_ Every exported function grepped with `-n` line-number flag across `apps/VCSM/src/`. Cache invalidators traced to all callers. Edge DAL read and controller call site confirmed. Final Screen files verified on disk.

### Function Status Table

| Function | DAL File | Imported By | Status |
|---|---|---|---|
| `readBusinessCardSectionsDAL` | `businessCardSections.read.dal.js` | `vportBusinessCard.controller.js` | LIVE |
| `invalidatePublicReviewDimensionsCache` | `readPublicVportReviewDimensions.dal.js` | none | **DEAD — orphaned invalidator** |
| `readPublicVportReviewDimensionsDAL` | `readPublicVportReviewDimensions.dal.js` | `getVportPublicReviews.controller.js` | LIVE |
| `invalidatePublicReviewSummaryCache` | `readPublicVportReviewSummary.dal.js` | none | **DEAD — orphaned invalidator** |
| `readPublicVportReviewSummaryDAL` | `readPublicVportReviewSummary.dal.js` | `getVportPublicReviews.controller.js` | LIVE |
| `readPublicVportReviewsDAL` | `readPublicVportReviews.dal.js` | `getVportPublicReviews.controller.js` | LIVE |
| `readVportPublicDetailsRpcDAL` | `readVportPublicDetails.rpc.dal.js` | `getVportPublicDetails.controller.js`, `publicFeature.group.js` | LIVE + DIAGNOSTICS-SECONDARY |
| `readVportPublicMenuRpcDAL` | `readVportPublicMenu.rpc.dal.js` | `getVportPublicMenu.controller.js`, `publicFeature.group.js` | LIVE + DIAGNOSTICS-SECONDARY |
| `invalidateMenuSlugCache` | `resolveMenuSlug.dal.js` | none | **DEAD — orphaned invalidator** |
| `resolveMenuSlugDAL` | `resolveMenuSlug.dal.js` | `resolveMenuSlug.controller.js` | LIVE |
| `invalidateVportSlugCache` | `resolveVportSlug.dal.js` | none | **DEAD — orphaned invalidator** |
| `resolveVportSlugDAL` | `resolveVportSlug.dal.js` | `resolveVportSlug.controller.js` | LIVE |
| `sendLeadConfirmationEmailDAL` | `sendLeadConfirmationEmail.edge.dal.js` | `vportBusinessCard.controller.js` | LIVE — fire-and-forget Edge Function |
| `readVportBusinessCardPublicBySlugDAL` | `vportBusinessCard.read.dal.js` | `vportBusinessCard.controller.js` | LIVE |
| `createVportBusinessCardLeadDAL` | `vportBusinessCardLead.write.dal.js` | `vportBusinessCard.controller.js` | LIVE |

### Cache Invalidator Analysis

All 4 invalidators follow the same pattern: a TTL cache is created, the `invalidate*` function is exported, but nothing in the codebase ever calls it. The cache clears only by TTL expiry.

| Invalidator | Cache TTL | Write Path That Should Call It | Risk |
|---|---|---|---|
| `invalidatePublicReviewDimensionsCache` | 60 seconds | Review create/update controller | LOW — 60s window acceptable |
| `invalidatePublicReviewSummaryCache` | 60 seconds | Review create/update controller | LOW — 60s window acceptable |
| `invalidateMenuSlugCache` | 10 minutes | Menu create/update/delete controller | MEDIUM — 10m stale slug window |
| `invalidateVportSlugCache` | 10 minutes | Vport profile update controller | MEDIUM — 10m stale slug window |

### Edge DAL Analysis

`sendLeadConfirmationEmail.edge.dal.js` invokes Supabase Edge Function `send-lead-confirmation`. Called from `vportBusinessCard.controller.js` as a fire-and-forget with `.catch(() => {})`. Email failures never surface to the user or block lead submission. This is correct behaviour for a confirmation email.

### Final Screen Gap Analysis

The ARCHITECT static scan reported Final Screen as MISSING. This was a false positive caused by:
- Scanner looked for `/screens/` (plural) — actual path is `/screen/` (singular)
- Scanner looked for `*.screen.jsx` (dot-notation) — actual naming is `*Screen.jsx` (PascalCase suffix)

**8 final screens exist on disk.** 2 were undocumented: `VportPublicMenuQrScreen.jsx` and `VportPublicMenuRedirectScreen.jsx`.

### DAL File Inventory

| Status | Count |
|---|---|
| DAL files on disk | 11 |
| DAL files in doc | 11 |
| Undocumented DAL files on disk | 0 |
| Dead functions | 4 |
| Live functions | 11 |

### Verdict

| Classification | Count | Items |
|---|---|---|
| LIVE | 11 | All non-invalidator functions |
| LIVE + DIAGNOSTICS-SECONDARY | 2 | `readVportPublicDetailsRpcDAL`, `readVportPublicMenuRpcDAL` |
| **DEAD** | **4** | All 4 cache invalidators |
| TRUE DEAD CODE | 4 | Orphaned cache invalidators — never called on any write path |

---

## Native Parity Notes

Native Relevance: YES
Falcon Review: REQUIRED
Related Native Module: `public` — VPORT public menu, business card, lead submission, and review display are user-facing surfaces accessible without authentication. Native must preserve slug resolution, review display, and lead submission flows.
Native Transfer Status: PENDING FALCON
Known Native Gaps: The 4 dead cache invalidators create a TTL-only cache behaviour. Native should be aware that public VPORT data may be up to 10 minutes stale for slugs and 60 seconds stale for review data. The Edge Function lead confirmation email (`send-lead-confirmation`) must be verified as callable from a native context.
Winter Soldier Handoff: Not yet initiated.

---

## Command Evidence Registry

| Command | Report Path | Relevance | Status |
|---|---|---|---|
| ARCHITECT | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.public.md` (this doc) | Initial DAL map + dead code audit source | PRESENT |
| IRONMAN | — | **REQUIRED** — ownership decision: delete 4 invalidators or wire to write paths | MISSING |
| VENOM | — | Trust boundary — public unauthenticated reads, lead submission, Edge Function invocation | MISSING |
| SENTRY | — | Architecture boundary — ARCHITECT scanner naming-pattern gap | MISSING |
| FALCON | — | Native parity for public menu, business card, lead submission, review display | MISSING |
| LOKI | — | Runtime trace for slug cache behaviour and TTL expiry patterns | MISSING |
| KRAVEN | — | Performance — slug cache TTL sizing for production traffic | MISSING |
| CARNAGE | — | DB migration history for public views (`public_actor_seo_v`, `public_menu_read_model_v`, review views) | MISSING |

---

## Change Log

### 2026-05-11

**Task:** Dead code audit of public DAL layer — verify all 11 DAL files and 15 exported functions; identify orphaned cache invalidators; resolve Final Screen MISSING flag; verify Edge DAL
**Application Scope:** VCSM
**Prompt:** User requested ARCHITECT dead code detection on `vcsm.dal.public.md` (read-only), confirmed findings, then requested Logan update
**Code Status Before:** Risk Findings and Pending Reviews were empty placeholders. Final Screen marked MISSING in Architecture Pipeline. 4 cache invalidators appeared live in the doc but had no callers. `sendLeadConfirmationEmail.edge.dal.js` listed as `operations: unknown` with no explanation.
**Code Status After:** No code changes — audit only. Documentation updated.
**Files Changed:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.public.md` (this file)
**Command Evidence:** ARCHITECT static scan + live import grep with `-n` line numbers across `apps/VCSM/src/` + Edge DAL file read + disk scan for Final Screen files
**Architecture Contracts Checked:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md
**Security / Runtime / DB Notes:** `sendLeadConfirmationEmailDAL` invokes Edge Function `send-lead-confirmation` — VENOM review recommended for lead submission trust boundary. 4 orphaned cache invalidators create a cache coherency risk for public-facing slug resolution (10-minute stale window). Final Screen MISSING was a false positive — scanner naming pattern gap, not missing code.
**Validation:** 11 functions confirmed live. 4 confirmed dead (orphaned invalidators). 8 final screens confirmed on disk (6 documented + 2 previously undocumented). Architecture Pipeline Final Screen entry corrected.
**Documentation Truth Status:** VERIFIED
**Native Documentation Verification:** PENDING FALCON

---

## Layer Consumer Map

_Performed:_ 2026-05-11 · Method: ARCHITECT + Explore agent full import trace across `apps/VCSM/src/`  
_Question answered:_ Which models, controllers, hooks, and screens touch each DAL function?

---

### Full System Flow

```
VPORTBUSINESSCARD SUB-FEATURE

Route /vport/{slug}/card
  → VportBusinessCardPublic.screen.jsx        (Final Screen)
      → VportBusinessCardPublic.view.jsx      (View Screen)
          → useVportBusinessCardExperience    (Hook)
              → vportBusinessCard.controller.js
                  → [DAL] readVportBusinessCardPublicBySlugDAL
                  → [DAL] readBusinessCardSectionsDAL
                  → [DAL] sendLeadConfirmationEmailDAL      (fire-and-forget after lead submit)
          → useVportBusinessCardLeadForm      (Hook)
              → vportBusinessCard.controller.js
                  → [DAL] createVportBusinessCardLeadDAL
          → useVportBusinessCardSections      (Hook)
              → vportBusinessCard.controller.js
                  → [DAL] readBusinessCardSectionsDAL

VPORTMENU SUB-FEATURE

Route /profile/{slug}/menu  (and /qr/menu/{slug})
  → VportPublicMenuBySlugScreen.jsx           (Final Screen — slug path)
  → VportPublicMenuQrBySlugScreen.jsx         (Final Screen — QR slug path)
  → VportPublicMenuScreen.jsx                 (Final Screen — actorId path, redirects to slug)
  → VportPublicMenuQrScreen.jsx               (Final Screen — actorId QR path, redirects)
      → useResolveMenuSlug                    (Hook — slug → actorId)
          → resolveMenuSlug.controller.js
              → [DAL] resolveMenuSlugDAL
      → useVportPublicDetails                 (Hook)
          → getVportPublicDetails.controller.js
              → [DAL] readVportPublicDetailsRpcDAL
      → useVportPublicMenu                    (Hook)
          → getVportPublicMenu.controller.js
              → [DAL] readVportPublicMenuRpcDAL
      → VportPublicMenuView.jsx / VportPublicMenuQrView.jsx (View Screen)

Route /profile/{slug}/reviews  (and /qr/reviews/{slug})
  → VportPublicReviewsBySlugScreen.jsx        (Final Screen — slug path)
  → VportPublicReviewsQrBySlugScreen.jsx      (Final Screen — QR slug path)
      → useResolveVportSlug                   (Hook — slug → actorId)
          → resolveVportSlug.controller.js
              → [DAL] resolveVportSlugDAL
      → useVportPublicDetails                 (Hook)
          → getVportPublicDetails.controller.js
              → [DAL] readVportPublicDetailsRpcDAL
      → useVportPublicReviews                 (Hook)
          → getVportPublicReviews.controller.js
              → [DAL] readPublicVportReviewsDAL
              → [DAL] readPublicVportReviewSummaryDAL
              → [DAL] readPublicVportReviewDimensionsDAL
      → VportPublicReviewsView.jsx / VportPublicReviewsQrView.jsx (View Screen)
```

---

### Per-Function Consumer Table

| DAL Function | Controller | Hook | View Screen | Final Screen |
|---|---|---|---|---|
| `readBusinessCardSectionsDAL` | `vportBusinessCard.controller.js` | `useVportBusinessCardSections` | `VportBusinessCardPublic.view.jsx` | `VportBusinessCardPublic.screen.jsx` |
| `readVportBusinessCardPublicBySlugDAL` | `vportBusinessCard.controller.js` | `useVportBusinessCardExperience` | `VportBusinessCardPublic.view.jsx` | `VportBusinessCardPublic.screen.jsx` |
| `createVportBusinessCardLeadDAL` | `vportBusinessCard.controller.js` | `useVportBusinessCardLeadForm` | `VportBusinessCardPublic.view.jsx` | `VportBusinessCardPublic.screen.jsx` |
| `sendLeadConfirmationEmailDAL` | `vportBusinessCard.controller.js` (fire-and-forget) | `useVportBusinessCardLeadForm` | `VportBusinessCardPublic.view.jsx` | `VportBusinessCardPublic.screen.jsx` |
| `readPublicVportReviewDimensionsDAL` | `getVportPublicReviews.controller.js` | `useVportPublicReviews` | `VportPublicReviewsView.jsx` | `VportPublicReviewsBySlugScreen.jsx`, `VportPublicReviewsQrBySlugScreen.jsx` |
| `readPublicVportReviewSummaryDAL` | `getVportPublicReviews.controller.js` | `useVportPublicReviews` | `VportPublicReviewsView.jsx`, `VportPublicMenuView.jsx` | All menu + review slug screens |
| `readPublicVportReviewsDAL` | `getVportPublicReviews.controller.js` | `useVportPublicReviews` | `VportPublicReviewsView.jsx` | `VportPublicReviewsBySlugScreen.jsx`, `VportPublicReviewsQrBySlugScreen.jsx` |
| `readVportPublicDetailsRpcDAL` | `getVportPublicDetails.controller.js` | `useVportPublicDetails` | `VportPublicMenuView.jsx`, `VportPublicReviewsView.jsx` | All menu + review slug screens |
| `readVportPublicMenuRpcDAL` | `getVportPublicMenu.controller.js` | `useVportPublicMenu` | `VportPublicMenuView.jsx`, `VportPublicMenuQrView.jsx` | All menu slug screens |
| `resolveMenuSlugDAL` | `resolveMenuSlug.controller.js` | `useResolveMenuSlug` | — | `VportPublicMenuBySlugScreen.jsx`, `VportPublicMenuQrBySlugScreen.jsx` |
| `resolveVportSlugDAL` | `resolveVportSlug.controller.js` | `useResolveVportSlug` | — | `VportPublicReviewsBySlugScreen.jsx`, `VportPublicReviewsQrBySlugScreen.jsx` |
| `invalidatePublicReviewDimensionsCache` | **DEAD — 0 callers** | — | — | — |
| `invalidatePublicReviewSummaryCache` | **DEAD — 0 callers** | — | — | — |
| `invalidateMenuSlugCache` | **DEAD — 0 callers** | — | — | — |
| `invalidateVportSlugCache` | **DEAD — 0 callers** | — | — | — |

---

### Controllers

| Controller | DAL Functions Used | Hook Consumer | Notes |
|---|---|---|---|
| `vportBusinessCard.controller.js` | `readVportBusinessCardPublicBySlugDAL`, `readBusinessCardSectionsDAL`, `createVportBusinessCardLeadDAL`, `sendLeadConfirmationEmailDAL` | `useVportBusinessCardExperience`, `useVportBusinessCardLeadForm`, `useVportBusinessCardSections` | Single controller owns all business card logic |
| `getVportPublicDetails.controller.js` | `readVportPublicDetailsRpcDAL` | `useVportPublicDetails` | Used in both menu and reviews views — shared details fetch |
| `getVportPublicMenu.controller.js` | `readVportPublicMenuRpcDAL` | `useVportPublicMenu` | Menu-only controller |
| `getVportPublicReviews.controller.js` | `readPublicVportReviewsDAL`, `readPublicVportReviewSummaryDAL`, `readPublicVportReviewDimensionsDAL` | `useVportPublicReviews` | Also exposes `getVportPublicReviewsPageController` for pagination |
| `resolveMenuSlug.controller.js` | `resolveMenuSlugDAL` | `useResolveMenuSlug` | Slug resolution only — no data fetch |
| `resolveVportSlug.controller.js` | `resolveVportSlugDAL` | `useResolveVportSlug` | Slug resolution only — no data fetch |

---

### Hooks

| Hook | Controller Consumed | DAL Reached (indirect) | Notes |
|---|---|---|---|
| `useVportBusinessCardExperience` | `vportBusinessCard.controller.js` | `readVportBusinessCardPublicBySlugDAL` | Full business card load experience |
| `useVportBusinessCardLeadForm` | `vportBusinessCard.controller.js` | `createVportBusinessCardLeadDAL`, `sendLeadConfirmationEmailDAL` | Lead submission + email fire-and-forget |
| `useVportBusinessCardSections` | `vportBusinessCard.controller.js` | `readBusinessCardSectionsDAL` | Sections config load |
| `useVportPublicDetails` | `getVportPublicDetails.controller.js` | `readVportPublicDetailsRpcDAL` | Shared across menu + reviews screens |
| `useVportPublicMenu` | `getVportPublicMenu.controller.js` | `readVportPublicMenuRpcDAL` | Menu categories + items |
| `useVportPublicReviews` | `getVportPublicReviews.controller.js` | `readPublicVportReviewsDAL`, `readPublicVportReviewSummaryDAL`, `readPublicVportReviewDimensionsDAL` | Pagination via `getVportPublicReviewsPageController` |
| `useResolveMenuSlug` | `resolveMenuSlug.controller.js` | `resolveMenuSlugDAL` | Entry gate for menu slug screens |
| `useResolveVportSlug` | `resolveVportSlug.controller.js` | `resolveVportSlugDAL` | Entry gate for reviews slug screens |
| `useDesktopBreakpoint` | _(none)_ | _(none)_ | Utility — responsive layout breakpoint only |

---

### Models

| Model | File | Exports Used | Used By |
|---|---|---|---|
| `vportBusinessCard.model.js` | `features/public/vportBusinessCard/model/` | `mapVportBusinessCardPublicRow`, `validateVportBusinessCardLeadInput` | `vportBusinessCard.controller.js` |
| `businessCardSettings.model.js` | `features/public/vportBusinessCard/model/` | `getBusinessCardSettings`, `getSectionToggles` | `VportBusinessCardPublic.view.jsx` (view layer, not controller) |
| `vportPublicDetails.model.js` | `features/public/vportMenu/model/` | `mapVportPublicDetailsRpcResult` | `getVportPublicDetails.controller.js` — normalizes dual-source fallback (menu view → SEO view) |
| `vportPublicMenu.model.js` | `features/public/vportMenu/model/` | `mapVportPublicMenuRpcResult` | `getVportPublicMenu.controller.js` — handles joined category + item rows |
| `vportPublicMenuPanel.model.js` | `features/public/vportMenu/model/` | _(not directly in DAL chain)_ | Used at component level (`VportPublicMenuPanel.jsx`) |
| `vportPublicReviews.model.js` | `features/public/vportMenu/model/` | `normalizePublicReviewSummary`, `normalizePublicReviewCards`, `normalizePublicReviewDimensions` | `getVportPublicReviews.controller.js` — all three normalizers |

---

### Screens

| Screen | Role | Hooks Used | DAL Reached |
|---|---|---|---|
| `VportBusinessCardPublic.screen.jsx` | Final Screen — business card public view | `useVportBusinessCardExperience`, `useVportBusinessCardLeadForm`, `useVportBusinessCardSections` | `readVportBusinessCardPublicBySlugDAL`, `readBusinessCardSectionsDAL`, `createVportBusinessCardLeadDAL`, `sendLeadConfirmationEmailDAL` |
| `VportPublicMenuBySlugScreen.jsx` | Final Screen — menu, slug-based route | `useResolveMenuSlug`, `useVportPublicDetails`, `useVportPublicMenu`, `useVportPublicReviews` | `resolveMenuSlugDAL`, `readVportPublicDetailsRpcDAL`, `readVportPublicMenuRpcDAL`, review DALs |
| `VportPublicMenuQrBySlugScreen.jsx` | Final Screen — menu QR, slug-based | Same as above (QR layout variant) | Same as above |
| `VportPublicMenuScreen.jsx` | Final Screen — menu, actorId-based (redirects to slug URL) | `useVportPublicDetails`, `useVportPublicMenu`, `useVportPublicReviews` | `readVportPublicDetailsRpcDAL`, `readVportPublicMenuRpcDAL`, review DALs |
| `VportPublicMenuQrScreen.jsx` | Final Screen — menu QR, actorId-based (redirects) | Same as above (QR layout variant) | Same as above |
| `VportPublicMenuRedirectScreen.jsx` | Final Screen — canonical slug redirect utility | _(minimal — redirect only)_ | _(none directly)_ |
| `VportPublicReviewsBySlugScreen.jsx` | Final Screen — reviews, slug-based | `useResolveVportSlug`, `useVportPublicDetails`, `useVportPublicReviews` | `resolveVportSlugDAL`, `readVportPublicDetailsRpcDAL`, all review DALs |
| `VportPublicReviewsQrBySlugScreen.jsx` | Final Screen — reviews QR, slug-based | Same as above (QR layout variant) | Same as above |

---

### Adapter Finding — `vportMenu.adapter.js` is Empty

> **FINDING:** `features/public/vportMenu/adapters/vportMenu.adapter.js` is an **empty file (0 bytes)** with no exports.  
> It is listed in the Architecture Pipeline as PRESENT but has no current implementation.  
> No callers exist anywhere in the codebase — there is nothing to call.  
> This is either a placeholder for planned cross-feature access or an abandoned scaffold.  
> IRONMAN should decide: implement or delete.

---

### Change Log Entry

### 2026-05-11 — Layer Consumer Map

Task: ARCHITECT full layer consumer trace — which models, controllers, hooks, and screens touch each public DAL function  
Application Scope: VCSM  
Code Reviewed: All 11 DAL files + all 6 controllers + all 9 hooks + all 6 models + all 8 screens + `vportMenu.adapter.js`  
Files Changed: `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.public.md` (this file)

Key findings:
- `vportBusinessCard.controller.js` owns all 4 business card DAL functions — single controller hub for the business card sub-feature
- `getVportPublicDetails.controller.js` is shared across both menu screens and reviews screens via `useVportPublicDetails`
- `vportMenu.adapter.js` is an empty file with 0 exports — adapter layer claimed PRESENT in Architecture Pipeline but has no implementation
- `businessCardSettings.model.js` operates at the view layer only — not imported by controllers or DAL
- `vportPublicMenuPanel.model.js` operates at the component layer only — not in the DAL chain
- 4 cache invalidators confirmed DEAD with 0 callers anywhere in codebase  
Documentation Truth Status: VERIFIED

## Codex Fix Pass — 2026-05-11

### Files Changed
| File | Change |
|---|---|
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.public.md` | Appended this fix-pass record only; no prior audit content was removed. |

### Findings Addressed
| Finding | Status | Notes |
|---|---|---|
| Orphaned cache invalidators | DEFERRED | Verified the four invalidators are exported but have no callers. Wiring them requires choosing write-path ownership; deleting them is disallowed by the no-delete instruction and requires IRONMAN. |
| Cache coherency risk from TTL-only behavior | DEFERRED | Current behavior remains TTL-only: 10 minutes for menu/vport slug caches and 60 seconds for review caches. No product-owned cache policy change was made. |
| `sendLeadConfirmationEmail.edge.dal.js` operation label | VERIFIED | Current controller still calls `sendLeadConfirmationEmailDAL` after lead submission. No table access exists in the DAL; Edge Function classification remains expected. |
| Final Screen MISSING scanner false positive | VERIFIED | Current disk scan confirms final screens exist under `features/public/vportMenu/screen/` and `features/public/vportBusinessCard/screen/`. No code change needed. |
| Empty `vportMenu.adapter.js` | DEFERRED | Verified file is 0 bytes and has no callers. It was not implemented or deleted because no cross-feature consumer currently needs it and deletion is disallowed. |

### Verification
- Commands/searches run:
  - `wc -l zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.public.md`
  - `sed -n '1,260p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.public.md`
  - `sed -n '261,520p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.public.md`
  - `sed -n '521,780p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.public.md`
  - `rg -n "invalidatePublicReviewDimensionsCache|invalidatePublicReviewSummaryCache|invalidateMenuSlugCache|invalidateVportSlugCache|vportMenu\\.adapter|sendLeadConfirmationEmailDAL|readVportPublicDetailsRpcDAL|readVportPublicMenuRpcDAL|resolveMenuSlugDAL|resolveVportSlugDAL|createVportBusinessCardLeadDAL" apps/VCSM/src --glob '*.js' --glob '*.jsx'`
  - `find apps/VCSM/src/features/public -type f \\( -name '*.js' -o -name '*.jsx' \\) | sort`
  - `wc -c apps/VCSM/src/features/public/vportMenu/adapters/vportMenu.adapter.js`
  - `sed -n '1,160p' apps/VCSM/src/features/public/vportBusinessCard/controller/vportBusinessCard.controller.js`
- Production callers checked:
  - `invalidatePublicReviewDimensionsCache`: no callers found.
  - `invalidatePublicReviewSummaryCache`: no callers found.
  - `invalidateMenuSlugCache`: no callers found.
  - `invalidateVportSlugCache`: no callers found.
  - `sendLeadConfirmationEmailDAL`: called by `vportBusinessCard.controller.js`.
  - `readVportPublicDetailsRpcDAL` / `readVportPublicMenuRpcDAL`: live via controllers and diagnostics.
  - `resolveMenuSlugDAL` / `resolveVportSlugDAL`: live via slug controllers.
  - `vportMenu.adapter.js`: no callers found; file size verified as 0 bytes.
- Remaining risks:
  - Cache invalidator disposition requires IRONMAN: wire to write paths or accept TTL-only and delete exports.
  - Empty adapter disposition requires IRONMAN if a public cross-feature boundary is desired.
  - VENOM/FALCON/SENTRY public-surface reviews remain pending as documented.
  - No source changes were made for this doc; build was not rerun after this append-only documentation pass. The previous profiles build passed.

### Status
PARTIAL
