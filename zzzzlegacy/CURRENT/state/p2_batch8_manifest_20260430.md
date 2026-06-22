# P2 Batch 8 Manifest — 2026-04-30

Final mechanical decomposition batch (files 71–80 of 40-file backlog). All files reduced to ≤300 lines. Zero behavior changes. Build verified after every file.

---

## Files Decomposed

| # | Original File | Before | After | New Files Created |
|---|---------------|--------|-------|-------------------|
| 1 | `diagnostics/groups/bookingFeature.group.js` | 334 | 271 | `bookingFeature.group.helpers.js` (70) |
| 2 | `diagnostics/groups/design.group.js` | 321 | 224 | `design.group.helpers.js` (109) |
| 3 | `diagnostics/groups/chatConversationFeature.group.js` | 318 | 202 | `chatConversationFeature.group.helpers.js` (128) |
| 4 | `diagnostics/groups/profilesFeature.group.js` | 311 | 188 | `profilesFeature.group.helpers.js` (133) |
| 5 | `diagnostics/groups/onboarding.group.js` | 311 | 242 | `onboarding.group.helpers.js` (78) |
| 6 | `diagnostics/ui/DiagnosticsPanel.jsx` | 308 | 291 | `diagnosticsPanel.helpers.js` (18) |
| 7 | `diagnostics/helpers/featureAudit.js` | 307 | 195 | `featureAudit.helpers.js` (115) |
| 8 | `diagnostics/groups/uploadFeature.group.js` | 305 | 299 | updated `uploadFeature.group.helpers.js` (+11 lines) |
| 9 | `features/profiles/.../useVportPublicBooking.js` | 304 | 291 | `useVportPublicBooking.helpers.js` (12) |
| 10 | `features/invite/screens/InviteView.jsx` | 304 | 142 | `InviteView.styles.js` (162) |

---

## Extraction Patterns Used

- **Helpers file** (`*.helpers.js`): TESTS arrays, getXxxTests(), getXxxState(), context helpers, utility functions
- **Context wrapper extraction**: `withXxxContext()` functions that bundle ensure+toSkip error handling patterns
- **Pure logic extraction**: `canAdvanceBookingStep()` from hook's `useCallback` body
- **Styles extraction** (`*.styles.js`): Inline style object `S` extracted from component file
- **Private helper extraction**: 7 private utility functions extracted from `featureAudit.js` to `featureAudit.helpers.js`
- **Re-export barrel**: `export { getXxxTests } from "@/...helpers"` keeps external consumers' imports unchanged

---

## Remaining Files Over 300 Lines (Out of Original Scope)

These files were NOT part of the original 40-file P2 decomposition list. They are legal content documents and a single LMS screen:

- `features/legal/screens/AboutView.jsx` (476) — static content page
- `features/legal/docs/TermsOfServiceContent.jsx` (471) — long-form legal text
- `features/legal/docs/PrivacyPolicyContent.jsx` (379) — long-form legal text
- `features/legal/screens/ContactView.jsx` (351) — static content page
- `learning/screens/administration/LearningOrganizationScreen.jsx` (302) — LMS screen

---

## Contract Compliance

- All files ≤300 lines ✓
- All imports use `@/` alias ✓
- No TypeScript ✓
- No `select('*')` ✓
- Zero behavior changes ✓
- Build verified (`dist/sw.js`) after every file ✓

---

## P2 Campaign Summary

All 8 batches complete. 80 files decomposed across:
- Batches 1–6: completed in prior sessions
- Batch 7: `runAllDiagnostics.js`, `social.group.js`, `teacher_appreciation.premium.jsx`, `reports.group.js`, `posts.group.js`, `block.group.js`, `mothers_day.premium.jsx`, `messaging.group.js`, `vports.group.js`, `bookings.group.js`
- Batch 8: `bookingFeature.group.js`, `design.group.js`, `chatConversationFeature.group.js`, `profilesFeature.group.js`, `onboarding.group.js`, `DiagnosticsPanel.jsx`, `featureAudit.js`, `uploadFeature.group.js`, `useVportPublicBooking.js`, `InviteView.jsx`
