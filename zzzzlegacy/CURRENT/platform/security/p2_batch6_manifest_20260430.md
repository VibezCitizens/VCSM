# P2 Batch 6 — Large File Decomposition Manifest
**Timestamp:** 20260430  
**Backup path:** `zNOTFORPRODUCTION/zcontract/doc/backups/P2_batch6_20260430/`  
**Build status:** ✓ All files built clean after each extraction  
**Violation checks:** No relative `../` imports, no `select('*')`, no TypeScript

---

## File 1: `reports.dal.js`
**Original:** 336 lines → **Result:** 294 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `reports.dal.columns.js` | NEW constants | 17 | `REPORT_COLUMNS`, `REPORT_EVENT_COLUMNS`, `MOD_ACTION_COLUMNS`, `POST_HIDE_COLUMNS`, `MESSAGE_HIDE_COLUMNS`, `INBOX_ENTRY_FOLDER_COLUMNS` — all exported |
| `reports.read.dal.js` | NEW DAL | 27 | `getReportRowById`, `getReportRowByDedupeKey`; imports `supabase` + `REPORT_COLUMNS` from columns file |
| `reports.dal.js` | REWRITTEN | 294 | Imports from columns file; re-exports reads via `export { getReportRowById, getReportRowByDedupeKey } from './reports.read.dal'`; keeps `isRlsDenied`, `skipReportEventsInsertForSession`, and all write/hide functions |

---

## File 2: `getStudentDashboard.controller.js`
**Original:** 335 lines → **Result:** 256 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `getStudentDashboard.helpers.js` | NEW helpers | 89 | `STUDENT_ROLES`, `isStudentMembership`, `toNumber`, `getAssignmentStatus`, `buildPerCourseData`; `buildPerCourseData` absorbs 5 DAL imports (listLessons, listProgress, listAssignments, getSubmission, getGrade) |
| `getStudentDashboard.controller.js` | REWRITTEN | 256 | Imports 4 exports from helpers; removed 5 DAL imports + 3 helper functions + inline Promise.all block |

---

## File 3: `learning.routes.jsx`
**Original:** 330 lines → **Result:** 239 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `learningRouteComponents.jsx` | NEW component | 100 | `getCourseId`, `getOrganizationId` (exported helpers), `RuntimeError`, `ScreenRoute`, `LearningHomeRoute`; owns all route-level React + hook imports |
| `learning.routes.jsx` | REWRITTEN | 239 | Imports 4 items from `learningRouteComponents`; removed `useNavigate`, `useParams`, LearningError/Loading/Home imports; keeps `LearningLayout` + `learningProtectedRoutes` |

---

## File 4: `VportAboutDetails.view.jsx`
**Original:** 328 lines → **Result:** 195 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `vportAboutDetails.model.js` | NEW model | 42 | `US_PHONE_DIGITS`, `US_STATE_LETTERS`, `US_ZIP_DIGITS` + `toPhoneDigits`, `formatPhoneDisplay`, `sanitizeCityInput`, `sanitizeStateInput`, `sanitizeZipInput`, `sanitizeCountryInput` — all exported |
| `vportAboutDetailsFields.jsx` | NEW component | 100 | `Field`, `PhoneField`, `ChipsField`; imports `toPhoneDigits` + `formatPhoneDisplay` from model file |
| `VportAboutDetails.view.jsx` | REWRITTEN | 195 | Imports 6 model exports + 3 field components; retains `VportAboutDetailsView` default export |

---

## File 5: `adminAccess.controller.js`
**Original:** 326 lines → **Result:** 285 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `adminAccess.helpers.js` | NEW helpers | 60 | `ADMIN_ROLES`, `TEACHING_ROLES`, `OBSERVER_ROLES`, `ORGANIZATION_MEMBER_ROLES`, `VISIBLE_MEMBERSHIP_STATUSES`, `MUTABLE_MEMBERSHIP_STATUSES` + `hasVisibleMembership`, `hasActiveAdminRole`, `normalizeTeacherRole`, `normalizeObserverRole`, `normalizeOrganizationRole`, `normalizeMembershipStatus` — all exported |
| `adminAccess.controller.js` | REWRITTEN | 285 | Imports `VISIBLE_MEMBERSHIP_STATUSES` + `hasActiveAdminRole` for local use; re-exports all 12 from helpers via barrel; keeps private column constants + all async DB functions |

---

## File 6: `identity.controller.js`
**Original:** 310 lines → **Result:** 295 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `identity.controller.inflight.js` | NEW helpers | 18 | `_identityInflight`, `_identityResolveCounts` (exported Maps), `logIdentityResolveCount`; defines own `IS_DEV` |
| `identity.controller.js` | REWRITTEN | 295 | Imports 3 items from inflight file; removed 2 Map declarations + `logIdentityResolveCount` function |

---

## File 7: `onboarding.controller.js`
**Original:** 310 lines → **Result:** 222 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `onboarding.controller.helpers.js` | NEW helpers | 94 | Exports: `STEP_DEFAULTS`, `SHOW_INVITE_ONBOARDING_CARD`, `formatRemainingLabel`, `getStepOrFallback`, `loadStep`; Private: `resolveStepCtaPath`, `logOnboardingStepFailure` |
| `onboarding.controller.js` | REWRITTEN | 222 | Imports 5 items from helpers; removed `STEP_DEFAULTS`, `SHOW_INVITE_ONBOARDING_CARD`, and 5 helper functions |

---

## File 8: `ConversationView.jsx`
**Original:** 310 lines → **Result:** 286 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `useConversationScroll.js` | NEW hook | 33 | `useConversationScroll({ messagesRef, messagesLength })`; manages `showJumpButton` state, `scrollToBottom` callback, scroll tracking effect, auto-scroll effect; returns `{ showJumpButton, setShowJumpButton, scrollToBottom }` |
| `ConversationView.jsx` | REWRITTEN | 286 | Removed `useCallback` import; imports + calls `useConversationScroll`; replaced 27-line scroll block with single destructure call |

---

## File 9: `useIdentityResolutionEffect.hook.js`
**Original:** 306 lines → **Result:** 270 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `identityResolutionSelfHeal.helper.js` | NEW helper | 42 | `runFinalizeSelfHeal({ nextIdentity })`; owns `finalizeSelfHealedIdentity` import + all SELF_HEAL_PREFS_WRITE / STATE_FINALIZE debug events |
| `useIdentityResolutionEffect.hook.js` | REWRITTEN | 270 | Removed `finalizeSelfHealedIdentity` import; imports `runFinalizeSelfHeal`; replaced 37-line finalize block with `await runFinalizeSelfHeal({ nextIdentity })` |

---

## File 10: `useCourseRoster.js`
**Original:** 313 lines → **Result:** 92 lines

| File | Type | Lines | Notes |
|------|------|-------|-------|
| `useCourseRosterMutations.js` | NEW hook | 161 | `useCourseRosterMutations({ supabase, actorId, realmId, courseId, reload, setIsSaving, setError })`; contains `assignStudent`, `assignTeacher`, `assignObserver`, `linkParentToStudent` callbacks; owns the 4 controller imports |
| `useCourseRoster.js` | REWRITTEN | 92 | Imports `useCourseRosterMutations`; retains `reload` callback, `data/error/isLoading/isSaving` state, `useEffect`, and full return shape |

---

## Summary

| Metric | Value |
|--------|-------|
| Files decomposed | 10 |
| New files created | 12 |
| All resulting files ≤ 300 lines | ✓ |
| Build passes | ✓ |
| Relative imports fixed | 0 (none needed — all existing imports were already `@/`) |
| `select('*')` violations | 0 |
| Logic/behavior changes | None (mechanical decomposition only) |
