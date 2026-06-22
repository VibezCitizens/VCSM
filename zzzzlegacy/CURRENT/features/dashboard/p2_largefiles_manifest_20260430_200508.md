# P2 Large-File Refactor — Manifest
**Timestamp:** 2026-04-30 20:05:08
**Branch:** main
**Backup:** `zNOTFORPRODUCTION/zcontract/doc/backups/20260430_200508/p2/`

---

## Files Modified

| File | Original Lines | Split Target |
|------|---------------|-------------|
| `wanders/screens/view/WandersCardPublic.view.jsx` | 578 | Extract CTA model + styles |
| `dashboard/flyerBuilder/designStudio/components/DesignStudioCanvasStage.jsx` | 560 | Extract rulers, node, interaction hook |
| `dashboard/flyerBuilder/designStudio/components/canvasStage/canvasMath.js` | 46 | Add buildRulerTicks + clamp |
| `profiles/kinds/vport/screens/review/VportReviewsView.jsx` | 479 | Extract stars, compose form, delete modal |
| `dashboard/vport/screens/VportDashboardTeamScreen.jsx` | 477 | Extract BarberPickerModal + TeamMemberCards |
| `profiles/kinds/vport/screens/gas/components/GasPricesPanel.jsx` | 473 | Extract BulkModal + model helpers |

## Files Created

| File | Purpose | Est. Lines |
|------|---------|-----------|
| `wanders/screens/view/wandersCardCta.model.js` | Pure CTA helpers extracted from view | ~105 |
| `wanders/screens/view/WandersCardPublic.styles.js` | Inline styles object | ~185 |
| `dashboard/flyerBuilder/.../canvasStage/CanvasRulers.jsx` | H + V ruler components | ~100 |
| `dashboard/flyerBuilder/.../canvasStage/CanvasNode.jsx` | Per-node drag/resize render | ~110 |
| `dashboard/flyerBuilder/.../canvasStage/useCanvasInteraction.js` | pointermove/pointerup interaction hook | ~65 |
| `profiles/kinds/vport/screens/review/components/VportReviewStars.jsx` | OverallStars + InputStars | ~55 |
| `profiles/kinds/vport/screens/review/components/VportReviewComposeForm.jsx` | Full compose form | ~160 |
| `profiles/kinds/vport/screens/review/components/VportReviewDeleteModal.jsx` | Delete confirm modal | ~35 |
| `dashboard/vport/screens/components/team/BarberPickerModal.jsx` | Barber picker modal | ~170 |
| `dashboard/vport/screens/components/team/TeamMemberCards.jsx` | Member card components | ~135 |
| `profiles/kinds/vport/screens/gas/components/gasPrices.model.js` | Pure date/format helpers | ~30 |
| `profiles/kinds/vport/screens/gas/components/BulkUpdateFuelPricesModal.jsx` | Bulk price update modal | ~175 |

## Actual Results

| File | Before | After |
|------|--------|-------|
| `WandersCardPublic.view.jsx` | 578 | 247 |
| `wandersCardCta.model.js` | NEW | 100 |
| `WandersCardPublic.styles.js` | NEW | 187 |
| `DesignStudioCanvasStage.jsx` | 560 | 272 |
| `canvasMath.js` | 46 (modified) | 59 |
| `useCanvasInteraction.js` | NEW | 64 |
| `CanvasRulers.jsx` | NEW | 128 |
| `CanvasNode.jsx` | NEW | 130 |
| `VportReviewsView.jsx` | 479 | 244 |
| `VportReviewStars.jsx` | NEW | 52 |
| `VportReviewDeleteModal.jsx` | NEW | 31 |
| `VportReviewComposeForm.jsx` | NEW | 192 |
| `VportDashboardTeamScreen.jsx` | 477 | 153 |
| `BarberPickerModal.jsx` | NEW | 161 |
| `TeamMemberCards.jsx` | NEW | 100 |
| `GasPricesPanel.jsx` | 473 | 195 |
| `BulkUpdateFuelPricesModal.jsx` | NEW | 162 |
| `gasPrices.model.js` | NEW | 33 |

## Build Result
`✓ built in 5.09s` — no errors

## Contract Violations Found
- `select('*')`: none
- Supabase imports outside DAL: none
- Relative imports (`from '../`): none
- Files over 300 lines: none

## Split Rules Applied
- Extracted pure helpers (no React) → model files
- Extracted inline style objects → .styles.js files
- Extracted self-contained sub-components → adjacent components/ folder
- Extracted interaction hooks → hooks/ or local hook file
- No behavior changes, no route changes, no data-flow changes
- All imports use @/ alias paths only
