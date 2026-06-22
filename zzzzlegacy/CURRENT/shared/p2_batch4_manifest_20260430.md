# P2 Batch 4 — Large File Decomposition Manifest
**Timestamp:** 20260430  
**Backup path:** `zNOTFORPRODUCTION/zcontract/doc/backups/P2_batch4_20260430/`  
**Build status:** ✓ All files built clean after each extraction  
**Violation checks:** No relative `../` imports, no `select('*')`, no TypeScript

---

## File 1: `PosterFlyer.jsx`
**Original:** 409 lines → **Result:** 264 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `posterFlyer.styles.js` | NEW styles | ~155 | Static exports: posterPage, posterSheet, posterInner, leftCol, hero, heroOverlay, smallTop, qrBox, qrLabel, ctaTitle, ctaText, miniCard, footerBar, chip, printBtn; dynamic: `getPosterFlyerAccentStyles(safeAccent)`, standalone `miniImg(url)` |
| `PosterFlyer.jsx` | REWRITTEN | 264 | Imports from styles file; removed unused React import |

---

## File 2: `businessCardSections.jsx`
**Original:** 391 lines → **Result:** 13 lines (barrel)

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `components/BusinessCardSectionCard.jsx` | NEW component | ~38 | `SectionCard` component + `SC` styles object shared by all sections |
| `businessCardPrimarySection.jsx` | NEW component | ~145 | HoursSection, ReviewsSummarySection, MenuSection, ServicesSection; includes fmt12, DAY_ORDER, DAY_LABELS, local style objects |
| `businessCardExtraSection.jsx` | NEW component | ~195 | PortfolioSection, FuelPricesSection, AmenitiesSection, RatesSection; includes fmtRate, fmtUpdated |
| `businessCardSections.jsx` | BARREL | 13 | Re-exports all 8 named exports; all consumers unchanged |

---

## File 3: `FlyerEditorPanel.jsx`
**Original:** 370 lines → **Result:** 251 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `flyerEditorPanel.styles.js` | NEW styles | ~35 | Static exports: input, label, card, hoursRow, DAYS array |
| `FlyerHoursTable.jsx` | NEW component | ~70 | Hours table rows — receives days, hoursValue, input, hoursRow, setHoursDay props |
| `FlyerEditorPanel.jsx` | REWRITTEN | 251 | Fixed 2 relative imports: `"./ImageDropzone"` and `"../hooks/useFlyerEditor"` → `@/` paths |

---

## File 4: `WandersMailbox.view.jsx`
**Original:** 361 lines → **Result:** 190 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `wandersMailboxView.styles.js` | NEW styles | ~130 | All styles constants: toolbar, split, detailWrap, subPanel, sectionTitle, loadingText, replyError, modal styles (8 keys) |
| `WandersMailbox.view.jsx` | REWRITTEN | 190 | Fixed ALL 8 relative `../../components/` imports → `@/features/wanders/components/` |

---

## File 5: `PortfolioItemForm.jsx`
**Original:** 351 lines → **Result:** 261 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `hooks/usePortfolioItemSubmit.js` | NEW hook | ~115 | Submit handler + saving/error state; receives all form state as params; fixed relative import for `@portfolio` and controller paths |
| `PortfolioItemForm.jsx` | REWRITTEN | 261 | Fixed relative import: `"./hooks/usePortfolioMediaUpload"` → `@/...` path; calls usePortfolioItemSubmit |

---

## File 6: `CardBuilder.jsx`
**Original:** 343 lines → **Result:** 182 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `cardBuilderTiles.jsx` | NEW component | ~115 | TONES constant + CardTypeTile component |
| `cardBuilder.styles.js` | ~35 | NEW styles | labelBase, inputBase, textareaBase, selectBase, primaryBtn, helperText class strings |
| `CardBuilder.jsx` | REWRITTEN | 182 | Fixed relative import: `"./registry"` → `@/features/wanders/components/cardstemplates/registry` |

---

## File 7: `VportDashboardLocksmithScreen.jsx`
**Original:** 339 lines → **Result:** 186 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `components/locksmithScreenComponents.jsx` | NEW component | ~155 | AreaForm (includes US_STATES, fieldCls, selectCls), AreaCard, ServiceDetailRow, GapServiceRow |
| `VportDashboardLocksmithScreen.jsx` | REWRITTEN | 186 | Imports 4 sub-components; added useMemo for shell styles |

---

## File 8: `useDesignStudio.js`
**Original:** 338 lines → **Result:** 272 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `hooks/useDesignStudioExports.js` | NEW hook | ~90 | Manages exportsList, jobsByExportId, exporting state; queueExport, refreshExports, polling useEffect; receives saveCurrentPage as param |
| `useDesignStudio.js` | REWRITTEN | 272 | Calls useDesignStudioExports; merges exportError into error return; preserves identical public API |

---

## File 9: `VportPublicMenuView.jsx`
**Original:** 334 lines → **Result:** 287 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `vportPublicMenuView.styles.js` | NEW styles | ~35 | `actionButtonStyle(enabled)`, `tabStyle(active)`, `TABS` constant |
| `VportPublicMenuView.jsx` | REWRITTEN | 287 | Imports from styles file; removed unused React import |

---

## File 10: `VportDashboardLeadsScreen.jsx`
**Original:** 313 lines → **Result:** 282 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `vportDashboardLeadsScreen.model.js` | NEW model | ~35 | `toText`, `formatLeadDate`, `formatSourceLabel`, `previewMessage` pure helpers |
| `VportDashboardLeadsScreen.jsx` | REWRITTEN | 282 | Imports from model; removed unused React import |

---

## Summary

| Metric | Value |
|--------|-------|
| Files decomposed | 10 |
| New files created | 19 |
| All resulting files ≤ 300 lines | ✓ |
| Build passes | ✓ |
| Relative imports fixed | Files 3 (2), 4 (8), 5 (1), 6 (1) — 12 total |
| `select('*')` violations | 0 |
| Logic/behavior changes | None (mechanical decomposition only) |
