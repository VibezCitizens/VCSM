# P2 Batch 7 Manifest — 2026-04-30

Mechanical decomposition batch 7 of 4 (files 61–70 of 40-file backlog). All files reduced to ≤300 lines. Zero behavior changes. Build verified after every file.

---

## Files Decomposed

| # | Original File | Before | After | New Files Created |
|---|---------------|--------|-------|-------------------|
| 1 | `diagnostics/runAllDiagnostics.js` | 520 | 171 | `diagnosticsGroups.part1.js` (107), `diagnosticsGroups.part2.js` (100) |
| 2 | `diagnostics/groups/social.group.js` | 401 | 259 | `social.group.helpers.js` (42), `socialGroup.friendRankTest.js` (155) |
| 3 | `cardstemplates/teacherappreciation/teacher_appreciation.premium.jsx` | 392 | 50 | `teacherAppreciationPremiumForm.jsx` (298), `teacherAppreciationPremiumPreview.jsx` (80) |
| 4 | `diagnostics/groups/reports.group.js` | 383 | 281 | `reports.group.helpers.js` (147) |
| 5 | `diagnostics/groups/posts.group.js` | 405 | 268 | `posts.group.tests2.js` (138); updated `posts.group.helpers.js` (+15 lines) |
| 6 | `diagnostics/groups/block.group.js` | 393 | 282 | `blockGroup.helpers.js` (115) |
| 7 | `cardstemplates/mothersday/mothers_day.premium.jsx` | 382 | 45 | `mothersDayPremiumForm.jsx` (271), `mothersDayPremiumPreview.jsx` (65) |
| 8 | `diagnostics/groups/messaging.group.js` | 380 | 300 | `messaging.group.helpers.js` (77) |
| 9 | `diagnostics/groups/vports.group.js` | 340 | 290 | `vports.group.helpers.js` (61) |
| 10 | `diagnostics/groups/bookings.group.js` | 335 | 257 | `bookings.group.tests2.js` (77); updated `bookings.group.helpers.js` (+16 lines) |

---

## Extraction Patterns Used

- **Helpers file** (`*.helpers.js`): TESTS arrays, getXxxTests(), getXxxState(), getOrEnsureXxx(), shared utility functions
- **Test object extraction** (`*.tests2.js`): Large inline test objects extracted as named exported constants
- **Form/Preview extraction**: Template object `Form` and `Preview` methods extracted as named React components in dedicated files
- **GROUPS array splitting** (`diagnosticsGroups.part1.js` + `part2.js`): Massive import+array file split into two partial arrays
- **Re-export barrel**: `export { getXxxTests } from "@/...helpers"` keeps external consumers' import paths unchanged
- **Circular dependency avoidance**: Shared helpers placed in neutral third file when two files would otherwise import each other

---

## Contract Compliance

- All files ≤300 lines ✓
- All imports use `@/` alias ✓
- No TypeScript ✓
- No `select('*')` ✓
- Zero behavior changes ✓
- Build verified (`dist/sw.js`) after every file ✓
