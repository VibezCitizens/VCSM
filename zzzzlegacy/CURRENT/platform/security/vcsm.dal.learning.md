# VCSM DAL — `learning`
> # ⚠️ FEATURE ON STANDBY — DO NOT USE
>
> **This feature is parked. Do not link to it, route to it, build on it, or spend any time on it.**
> No work should be done on Learning until explicitly reactivated.
> All findings in this document are for archive reference only.
>

_Generated:_ 2026-05-11  
_Updated:_ 2026-05-11 (ARCHITECT live audit — wrong source path, all layers present, duplicate components, realm chains resolved)  
_Source:_ ARCHITECT static scan + manual verification · `apps/VCSM/src/learning/` _(not `features/learning/` — see RISK-1)_  
_Confidence:_ STATICALLY\_TRACED + MANUALLY\_VERIFIED  

---

## Summary

| Item | Detail |
|---|---|
| DAL files | 33 |
| Exported functions | 34 |
| Tables accessed | 13 |
| RPCs called | 0 |
| Release flag | None — always active |
| Feature status | LIVE — full multi-role LMS at `/learning` route tree |
| Architecture status | COMPLETE — all layers present (doc scan was wrong) |
| Dead code | None confirmed |
| Structural issues | 5 duplicate component folders, 1 stale re-export shim, module outside `features/` boundary |

## DAL Files

### `getAssignmentById.dal.js`

**Path:** `learning/dal/assignments/getAssignmentById.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getAssignmentByIdDal` | `read` | `assignments` |

### `getCourseById.dal.js`

**Path:** `learning/dal/courses/getCourseById.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getCourseByIdDal` | `read` | `courses` |

### `getCourseBySlug.dal.js`

**Path:** `learning/dal/courses/getCourseBySlug.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getCourseBySlugDal` | `read` | `courses` |

### `getCourseMembershipByActor.dal.js`

**Path:** `learning/dal/memberships/getCourseMembershipByActor.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getCourseMembershipByActorDal` | `read` | `course_memberships` |

### `getDefaultLearningRealm.dal.js`

**Path:** `learning/dal/realms/getDefaultLearningRealm.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getDefaultLearningRealmDal` | `read` | `realms` |

### `getGradeBySubmissionId.dal.js`

**Path:** `learning/dal/grades/getGradeBySubmissionId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getGradeBySubmissionIdDal` | `read` | `grades` |

### `getLearningRealmById.dal.js`

**Path:** `learning/dal/realms/getLearningRealmById.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getLearningRealmByIdDal` | `read` | `realms` |

### `getLearningRealmBySlug.dal.js`

**Path:** `learning/dal/realms/getLearningRealmBySlug.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getLearningRealmBySlugDal` | `read` | `realms` |

### `getLearningRealmByVcRealmId.dal.js`

**Path:** `learning/dal/realms/getLearningRealmByVcRealmId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getLearningRealmByVcRealmIdDal` | `read` | `realms` |

### `getLessonById.dal.js`

**Path:** `learning/dal/lessons/getLessonById.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getLessonByIdDal` | `read` | `lessons` |

### `getLessonProgressByLessonAndActor.dal.js`

**Path:** `learning/dal/lessonProgress/getLessonProgressByLessonAndActor.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getLessonProgressByLessonAndActorDal` | `read` | `lesson_progress` |

### `getOrganizationById.dal.js`

**Path:** `learning/dal/organizations/getOrganizationById.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getOrganizationByIdDal` | `read` | `organizations` |

### `getSubmissionAttempt.dal.js`

**Path:** `learning/dal/submissions/getSubmissionAttempt.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getSubmissionAttemptDal` | `read` | `submissions` |

### `getSubmissionById.dal.js`

**Path:** `learning/dal/submissions/getSubmissionById.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getSubmissionByIdDal` | `read` | `submissions` |

### `listAssignmentRubricsByAssignmentId.dal.js`

**Path:** `learning/dal/rubrics/listAssignmentRubricsByAssignmentId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listAssignmentRubricsByAssignmentIdDal` | `read` | `assignment_rubrics` |

### `listAssignmentsByCourseId.dal.js`

**Path:** `learning/dal/assignments/listAssignmentsByCourseId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listAssignmentsByCourseIdDal` | `read` | `assignments` |

### `listCourseMembershipsByActor.dal.js`

**Path:** `learning/dal/memberships/listCourseMembershipsByActor.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listCourseMembershipsByActorDal` | `read` | `course_memberships` |

### `listCourseMembershipsByCourseId.dal.js`

**Path:** `learning/dal/memberships/listCourseMembershipsByCourseId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listCourseMembershipsByCourseIdDal` | `read` | `course_memberships` |

### `listCoursesByActorId.dal.js`

**Path:** `learning/dal/courses/listCoursesByActorId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listCoursesByActorIdDal` | `read` | `course_memberships` |

### `listCoursesByOrganizationId.dal.js`

**Path:** `learning/dal/courses/listCoursesByOrganizationId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listCoursesByOrganizationIdDal` | `read` | `courses` |

### `listCoursesByRealmId.dal.js`

**Path:** `learning/dal/courses/listCoursesByRealmId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listCoursesByRealmIdDal` | `read` | `courses` |

### `listGradesByAssignmentId.dal.js`

**Path:** `learning/dal/grades/listGradesByAssignmentId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listGradesByAssignmentIdDal` | `read` | `grades` |

### `listLessonProgressByCourseAndActor.dal.js`

**Path:** `learning/dal/lessonProgress/listLessonProgressByCourseAndActor.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listLessonProgressByCourseAndActorDal` | `read` | `lesson_progress` |

### `listLessonsByCourseId.dal.js`

**Path:** `learning/dal/lessons/listLessonsByCourseId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listLessonsByCourseIdDal` | `read` | `lessons` |

### `listLessonsByModuleId.dal.js`

**Path:** `learning/dal/lessons/listLessonsByModuleId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listLessonsByModuleIdDal` | `read` | `lessons` |

### `listModulesByCourseId.dal.js`

**Path:** `learning/dal/modules/listModulesByCourseId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listModulesByCourseIdDal` | `read` | `modules` |

### `listOrganizationsByRealmId.dal.js`

**Path:** `learning/dal/organizations/listOrganizationsByRealmId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listOrganizationsByRealmIdDal` | `read` | `organizations` |

### `listSubmissionFilesBySubmissionId.dal.js`

**Path:** `learning/dal/submissionFiles/listSubmissionFilesBySubmissionId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listSubmissionFilesBySubmissionIdDal` | `read` | `submission_files` |

### `listSubmissionsByAssignmentId.dal.js`

**Path:** `learning/dal/submissions/listSubmissionsByAssignmentId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listSubmissionsByAssignmentIdDal` | `read` | `submissions` |

### `observerStudentLinks.dal.js`

**Path:** `learning/dal/observerStudentLinks/observerStudentLinks.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getObserverStudentLinkDAL` | `read` | `observer_student_links` |
| `listObservedStudentLinksDAL` | `read` | `observer_student_links` |

### `submitAssignmentAttempt.dal.js`

**Path:** `learning/dal/submissions/submitAssignmentAttempt.dal.js`  
**Operations:** `read` · `update`  

**Exported functions:**

| `submitAssignmentAttemptDal` | `read` · `update` | `submissions` |

### `upsertLessonProgress.dal.js`

**Path:** `learning/dal/lessonProgress/upsertLessonProgress.dal.js`  
**Operations:** `read` · `upsert`  

**Exported functions:**

| `upsertLessonProgressDal` | `read` · `upsert` | `lesson_progress` |

### `upsertSubmissionDraft.dal.js`

**Path:** `learning/dal/submissions/upsertSubmissionDraft.dal.js`  
**Operations:** `read` · `upsert`  

**Exported functions:**

| `upsertSubmissionDraftDal` | `read` · `upsert` | `submissions` |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `assignment_rubrics` | READ | `listAssignmentRubricsByAssignmentIdDal` |
| `assignments` | READ | `getAssignmentByIdDal`, `listAssignmentsByCourseIdDal` |
| `course_memberships` | READ | `getCourseMembershipByActorDal`, `listCourseMembershipsByActorDal`, `listCourseMembershipsByCourseIdDal`, `listCoursesByActorIdDal` |
| `courses` | READ | `getCourseByIdDal`, `getCourseBySlugDal`, `listCoursesByOrganizationIdDal`, `listCoursesByRealmIdDal` |
| `grades` | READ | `getGradeBySubmissionIdDal`, `listGradesByAssignmentIdDal` |
| `lesson_progress` | READ, UPSERT | `getLessonProgressByLessonAndActorDal`, `listLessonProgressByCourseAndActorDal`, `upsertLessonProgressDal` |
| `lessons` | READ | `getLessonByIdDal`, `listLessonsByCourseIdDal`, `listLessonsByModuleIdDal` |
| `modules` | READ | `listModulesByCourseIdDal` |
| `observer_student_links` | READ | `getObserverStudentLinkDAL`, `listObservedStudentLinksDAL` |
| `organizations` | READ | `getOrganizationByIdDal`, `listOrganizationsByRealmIdDal` |
| `realms` | READ | `getDefaultLearningRealmDal`, `getLearningRealmByIdDal`, `getLearningRealmBySlugDal`, `getLearningRealmByVcRealmIdDal` |
| `submission_files` | READ | `listSubmissionFilesBySubmissionIdDal` |
| `submissions` | READ, UPDATE, UPSERT | `getSubmissionAttemptDal`, `getSubmissionByIdDal`, `listSubmissionsByAssignmentIdDal`, `submitAssignmentAttemptDal`, `upsertSubmissionDraftDal` |

---

## ARCHITECT Live Audit Findings

---

### Doc Corrections from Original Static Scan

The original static scan had **critical errors** due to scanning the wrong directory:

| Field | Original (Wrong) | Corrected |
|---|---|---|
| Source path | `features/learning/dal/` | `src/learning/dal/` — module is NOT inside `features/` |
| Model layer | MISSING | PRESENT — 12 model files at `src/learning/model/` |
| Controller layer | MISSING | PRESENT — ~35 controllers at `src/learning/controller/` organized by role |
| Adapter layer | MISSING | PRESENT — `learning.adapter.js`, `realm.adapter.js`, `actor.adapter.js` |
| Hook layer | MISSING | PRESENT — ~20 hooks at `src/learning/hooks/` organized by role |
| Component layer | MISSING | PRESENT — many components at `src/learning/components/` organized by role |
| View Screen layer | MISSING | PRESENT — multiple view screens per role |
| Final Screen layer | MISSING | PRESENT — 14+ screens at `src/learning/screens/` |
| Realm DAL "partial chains" | No screen reached | Fully traced — resolved via `realm.adapter.js` → `learning.adapter.js` → role screens |

All layers that were listed as MISSING exist in full. The static scan failed because it was looking in `features/learning/` which does not exist — the module lives at `src/learning/`.

---

### True Module Location and Structure

**Root:** `apps/VCSM/src/learning/`

```
src/learning/
├── adapters/
│   ├── actor.adapter.js
│   ├── learning.adapter.js        ← main export surface (all hooks + screens + realm)
│   └── realm.adapter.js
├── components/                    ← organized by role
│   ├── administration/
│   ├── common/                    ← ⚠ duplicate subfolders (see RISK-3)
│   ├── parents/
│   ├── shared/
│   ├── students/
│   └── teachers/
├── controller/                    ← organized by role (~35 controllers)
│   ├── administration/
│   ├── parents/
│   ├── shared/
│   ├── students/
│   └── teachers/
├── dal/                           ← 33 DAL files (documented above)
├── hooks/                         ← organized by role (~20 hooks)
├── layout/LearningLayout.jsx
├── model/                         ← 12 model files
├── routes/
│   ├── learning.routes.jsx        ← 16 registered routes under /learning
│   └── learningRouteComponents.jsx
├── screens/                       ← organized by role + shared
│   ├── administration/
│   ├── parents/
│   ├── shared/
│   ├── students/
│   ├── teachers/
│   └── LearningCourseViewScreen.view.jsx  ← ⚠ stale re-export shim (see RISK-4)
├── styles/learning.css
└── utils/
    ├── realmDebug.js              ← controlled debug utility (see RISK-5)
    └── setLearningTheme.js
```

### Route Tree (all registered under `/learning`)

| Route | Screen |
|---|---|
| `/learning` (index) | `LearningHomeScreen` |
| `/learning/courses/:courseId` | `LearningCourseScreen` |
| `/learning/courses/:courseId/assignments` | `LearningCourseScreen` |
| `/learning/courses/:courseId/lessons/:lessonId` | `LearningLessonScreen` |
| `/learning/courses/:courseId/assignments/:assignmentId` | `LearningAssignmentScreen` |
| `/learning/lessons/:lessonId` | `LearningLessonScreen` |
| `/learning/assignments/:assignmentId` | `LearningAssignmentScreen` |
| `/learning/student` | `LearningStudentDashboardScreen` |
| `/learning/student/courses/:courseId` | `LearningStudentCourseScreen` |
| `/learning/teacher` | `LearningTeacherDashboardScreen` |
| `/learning/teacher/courses/:courseId` | `LearningTeacherCourseScreen` |
| `/learning/teacher/courses/:courseId/submissions` | `LearningSubmissionReviewScreen` |
| `/learning/teacher/courses/:courseId/assignments/:assignmentId/submissions` | `LearningSubmissionReviewScreen` |
| `/learning/parent` | `LearningParentDashboardScreen` |
| `/learning/parent/courses/:courseId/students/:studentActorId` | `LearningObservedStudentScreen` |
| `/learning/admin` | `LearningAdminDashboardScreen` |
| `/learning/admin/organizations/:organizationId` | `LearningOrganizationScreen` |
| `/learning/admin/courses/:courseId/roster` | `LearningCourseRosterScreen` |

All screens are lazy-loaded through `learning.adapter.js`.

### Realm DAL Chains — Now Fully Resolved

The three realm DALs previously marked "partial chain (no screen reached)" are fully wired:

```
getDefaultLearningRealm.dal.js  ┐
getLearningRealmBySlug.dal.js   ├── resolveLearningRealm.controller.js
getLearningRealmByVcRealmId.dal.js ┘     → realm.adapter.js
                                           → learning.adapter.js (re-exported)
                                           → consumed by all role screens via realm resolution
```

These DALs are used to resolve which learning realm a user belongs to before any role screen loads. The chain does reach screens — it does so indirectly through the realm resolution gate.

---

## Risk Findings

### RISK-1 — Module Lives Outside `features/` Boundary
**Severity:** MEDIUM  
**Classification:** ARCHITECTURE NOTE  
**Detail:** The learning module is at `src/learning/` not `src/features/learning/`. It operates as a self-contained sub-application within VCSM, with its own adapter boundary (`learning.adapter.js`) that all external routes consume. This is architecturally intentional given the scale (14+ screens, 35+ controllers, 33 DALs) but means the module sits outside the standard VCSM `features/` convention.

The VCSM `CLAUDE.md` acknowledges this: "VCSM has an embedded `/learning` route." The adapter boundary is correctly enforced — all routes import exclusively through `learning.adapter.js`.

**Recommended action:** Document this as an approved exception. No code change needed. IRONMAN should own this boundary classification.

---

### RISK-2 — `getStudentDashboard.helpers.js` Classified as "Other" — Likely Controller Work
**Severity:** LOW  
**Classification:** LAYER VIOLATION  
**Detail:** Several DALs list `getStudentDashboard.helpers.js` as a direct caller, categorized as "Other" (not Controller). A helpers file directly calling DALs is doing controller-level work without the controller designation.

**File:** `src/learning/controller/students/getStudentDashboard.helpers.js`

**Recommended action:** Verify whether this file is imported by a controller (acceptable) or calls DALs standalone (violation). If standalone, fold it into `getStudentDashboard.controller.js`.

---

### RISK-3 — Duplicate Component Subfolders (5 Pairs)
**Severity:** MEDIUM  
**Classification:** STRUCTURAL — likely accidental duplication  
**Detail:** Five component directories each contain a nested subfolder with the same name and the same files:

| Parent | Duplicate subfolder |
|---|---|
| `components/common/assignments/` | `components/common/assignments/assignments/` |
| `components/common/course/` | `components/common/course/course/` |
| `components/common/grades/` | `components/common/grades/grades/` |
| `components/common/lessons/` | `components/common/lessons/lessons/` |
| `components/common/modules/` | `components/common/modules/modules/` |

Each pair contains the same component filenames (e.g. `AssignmentList.jsx` exists in both `assignments/` and `assignments/assignments/`). This is almost certainly a copy-paste or move accident — not intentional versioning.

**Impact:** If screens import from the nested path, they get the wrong file. If they import from the parent, the nested copy is dead.

**Recommended action:** Verify which path is actually imported by controllers/hooks (`grep -r "assignments/assignments\|course/course\|grades/grades\|lessons/lessons\|modules/modules"`), then delete the unused copies. Route to SENTRY.

---

### RISK-4 — Stale Re-export Shim at `screens/LearningCourseViewScreen.view.jsx`
**Severity:** LOW  
**Classification:** LIKELY DEAD — stale migration artifact  
**Detail:** Two files named `LearningCourseViewScreen.view.jsx` exist:

- `src/learning/screens/LearningCourseViewScreen.view.jsx` — 1-line re-export: `export { default } from "@/learning/screens/shared/LearningCourseViewScreen.view"`
- `src/learning/screens/shared/LearningCourseViewScreen.view.jsx` — 150-line full component

The `learning.adapter.js` imports directly from the `shared/` path. The root-level shim appears to be a leftover from a file move and is likely unreferenced.

**Recommended action:** Confirm no other file imports the root-level shim, then delete it. The `shared/` version is canonical.

---

### RISK-5 — `realmDebug.js` Contains `debugger` Statement
**Severity:** LOW  
**Classification:** WATCH — controlled debug utility  
**Detail:** `src/learning/utils/realmDebug.js` exports `logRealmDebug()` which includes a `debugger` statement gated by `shouldBreakOnRealmDebug()` (controlled via `VITE_LEARNING_DEBUG_REALMS_BREAK=1` env var or `localStorage` flag). The `console.debug` calls are gated similarly.

This is a permanent, intentionally controlled debug utility — not an accidental probe. The `debugger` statement will not pause execution in production unless the env var or localStorage flag is set. It is safe as-is but should be noted.

**Recommended action:** Keep as-is if realm debugging is still needed. If the realm resolution system is stable, consider removing the `debugger` statement and simplifying to just the `console.debug` path.

---

## Pending Reviews

| Review | Command | Priority |
|---|---|---|
| Classify `src/learning/` outside `features/` as approved boundary exception | IRONMAN | MEDIUM |
| Verify `getStudentDashboard.helpers.js` — controller work without controller designation | SENTRY | LOW |
| Audit duplicate component subfolders — delete unused copies | SENTRY | MEDIUM |
| Confirm root-level `LearningCourseViewScreen.view.jsx` shim is unused, delete | SENTRY | LOW |
| Decide fate of `realmDebug.js` `debugger` statement | IRONMAN | LOW |

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `getAssignmentById.dal.js`

**Direct callers:**

- `getAssignmentSubmission.controller.js` _Controller_
- `gradeSubmission.controller.js` _Controller_
- `listAssignmentsByCourseId.dal.js` _DAL_

**Full call chain to screen:**

```
`getAssignmentById.dal.js` → `getAssignmentSubmission.controller.js` → `useAssignmentSubmission.js` → `LearningAssignmentScreen.jsx`
```
```
`getAssignmentById.dal.js` → `gradeSubmission.controller.js` → `useGradeSubmission.js` → `LearningSubmissionReviewScreen.jsx`
```
```
`getAssignmentById.dal.js` → `listAssignmentsByCourseId.dal.js` → `getObservedStudentAssignments.controller.js` → `useObservedStudentProgress.js` → `LearningObservedStudentScreen.jsx`
```
```
`getAssignmentById.dal.js` → `listAssignmentsByCourseId.dal.js` → `getParentDashboard.controller.js` → `useParentDashboard.js` → `LearningParentDashboardScreen.jsx`
```

### `listAssignmentsByCourseId.dal.js`

**Direct callers:**

- `getObservedStudentAssignments.controller.js` _Controller_
- `getParentDashboard.controller.js` _Controller_
- `getCourseHome.controller.js` _Controller_
- `listCourseAssignments.controller.js` _Controller_
- `getStudentDashboard.helpers.js` _Other_
- `getStudentProgressSummary.controller.js` _Controller_
- `listStudentCourses.controller.js` _Controller_
- `getTeacherCourseHome.controller.js` _Controller_
- _+3 more_

**Full call chain to screen:**

```
`listAssignmentsByCourseId.dal.js` → `getObservedStudentAssignments.controller.js` → `useObservedStudentProgress.js` → `LearningObservedStudentScreen.jsx`
```
```
`listAssignmentsByCourseId.dal.js` → `getParentDashboard.controller.js` → `useParentDashboard.js` → `LearningParentDashboardScreen.jsx`
```
```
`listAssignmentsByCourseId.dal.js` → `listCourseAssignments.controller.js` → `useCourseAssignments.js` → `LearningCourseScreen.jsx`
```
```
`listAssignmentsByCourseId.dal.js` → `getStudentProgressSummary.controller.js` → `useStudentDashboard.js` → `LearningStudentDashboardScreen.jsx`
```

### `getCourseById.dal.js`

**Direct callers:**

- `assignObserverToCourse.controller.js` _Controller_
- `assignStudentToCourse.controller.js` _Controller_
- `assignTeacherToCourse.controller.js` _Controller_
- `getCourseRoster.controller.js` _Controller_
- `linkParentToStudent.controller.js` _Controller_
- `getObservedStudentAssignments.controller.js` _Controller_
- `getObservedStudentProgress.controller.js` _Controller_
- `getCourseContent.controller.js` _Controller_
- _+10 more_

**Full call chain to screen:**

```
`getCourseById.dal.js` → `getCourseRoster.controller.js` → `useCourseRoster.js` → `LearningCourseRosterScreen.jsx`
```
```
`getCourseById.dal.js` → `getObservedStudentAssignments.controller.js` → `useObservedStudentProgress.js` → `LearningObservedStudentScreen.jsx`
```
```
`getCourseById.dal.js` → `getCourseContent.controller.js` → `useCourseContent.js` → `LearningCourseScreen.jsx`
```
```
`getCourseById.dal.js` → `getStudentProgressSummary.controller.js` → `useStudentDashboard.js` → `LearningStudentDashboardScreen.jsx`
```

### `getCourseBySlug.dal.js`

**Direct callers:**

- `getCourseContent.controller.js` _Controller_

**Full call chain to screen:**

```
`getCourseBySlug.dal.js` → `getCourseContent.controller.js` → `useCourseContent.js` → `LearningCourseScreen.jsx`
```

### `listCoursesByActorId.dal.js`

**Direct callers:**

- `getParentDashboard.controller.js` _Controller_
- `listObservedStudents.controller.js` _Controller_
- `getLearningHome.controller.js` _Controller_
- `getStudentDashboard.controller.js` _Controller_
- `getStudentProgressSummary.controller.js` _Controller_
- `listStudentCourses.controller.js` _Controller_
- `getTeacherDashboard.controller.js` _Controller_
- `listTeacherCourses.controller.js` _Controller_

**Full call chain to screen:**

```
`listCoursesByActorId.dal.js` → `getParentDashboard.controller.js` → `useParentDashboard.js` → `LearningParentDashboardScreen.jsx`
```
```
`listCoursesByActorId.dal.js` → `getLearningHome.controller.js` → `useStudentDashboard.js` → `LearningStudentDashboardScreen.jsx`
```
```
`listCoursesByActorId.dal.js` → `getStudentProgressSummary.controller.js` → `useStudentProgressSummary.js` → `LearningStudentCourseScreen.jsx`
```
```
`listCoursesByActorId.dal.js` → `getTeacherDashboard.controller.js` → `useTeacherDashboard.js` → `LearningTeacherDashboardScreen.jsx`
```

### `listCoursesByOrganizationId.dal.js`

**Direct callers:**

- `getAdminDashboard.controller.js` _Controller_
- `listOrganizationCourses.controller.js` _Controller_
- `listOrganizationMembers.controller.js` _Controller_

**Full call chain to screen:**

```
`listCoursesByOrganizationId.dal.js` → `getAdminDashboard.controller.js` → `useAdminDashboard.js` → `LearningAdminDashboardScreen.jsx`
```
```
`listCoursesByOrganizationId.dal.js` → `listOrganizationCourses.controller.js` → `useOrganizationCourses.js` → `LearningOrganizationScreen.jsx`
```

### `listCoursesByRealmId.dal.js`

**Direct callers:**

- `getLearningHome.controller.js` _Controller_

**Full call chain to screen:**

```
`listCoursesByRealmId.dal.js` → `getLearningHome.controller.js` → `useStudentDashboard.js` → `LearningStudentDashboardScreen.jsx`
```

### `getGradeBySubmissionId.dal.js`

**Direct callers:**

- `getObservedStudentAssignments.controller.js` _Controller_
- `getParentDashboard.controller.js` _Controller_
- `getAssignmentSubmission.controller.js` _Controller_
- `getStudentDashboard.helpers.js` _Other_
- `getStudentProgressSummary.controller.js` _Controller_
- `gradeSubmission.controller.js` _Controller_
- `listGradesByAssignmentId.dal.js` _DAL_

**Full call chain to screen:**

```
`getGradeBySubmissionId.dal.js` → `getObservedStudentAssignments.controller.js` → `useObservedStudentProgress.js` → `LearningObservedStudentScreen.jsx`
```
```
`getGradeBySubmissionId.dal.js` → `getParentDashboard.controller.js` → `useParentDashboard.js` → `LearningParentDashboardScreen.jsx`
```
```
`getGradeBySubmissionId.dal.js` → `getAssignmentSubmission.controller.js` → `useAssignmentSubmission.js` → `LearningAssignmentScreen.jsx`
```
```
`getGradeBySubmissionId.dal.js` → `getStudentProgressSummary.controller.js` → `useStudentDashboard.js` → `LearningStudentDashboardScreen.jsx`
```

### `listGradesByAssignmentId.dal.js`

**Direct callers:**

- `getTeacherDashboard.controller.js` _Controller_
- `listCourseSubmissions.controller.js` _Controller_
- `listTeacherAssignments.controller.js` _Controller_

**Full call chain to screen:**

```
`listGradesByAssignmentId.dal.js` → `getTeacherDashboard.controller.js` → `useTeacherDashboard.js` → `LearningTeacherDashboardScreen.jsx`
```
```
`listGradesByAssignmentId.dal.js` → `listCourseSubmissions.controller.js` → `useCourseSubmissions.js` → `LearningSubmissionReviewScreen.jsx`
```

### `getLessonProgressByLessonAndActor.dal.js`

**Direct callers:**

- `getLessonView.controller.js` _Controller_
- `listLessonProgressByCourseAndActor.dal.js` _DAL_
- `upsertLessonProgress.dal.js` _DAL_

**Full call chain to screen:**

```
`getLessonProgressByLessonAndActor.dal.js` → `getLessonView.controller.js` → `useLessonView.js` → `LearningLessonScreen.jsx`
```
```
`getLessonProgressByLessonAndActor.dal.js` → `listLessonProgressByCourseAndActor.dal.js` → `getObservedStudentProgress.controller.js` → `useObservedStudentProgress.js` → `LearningObservedStudentScreen.jsx`
```
```
`getLessonProgressByLessonAndActor.dal.js` → `listLessonProgressByCourseAndActor.dal.js` → `getParentDashboard.controller.js` → `useParentDashboard.js` → `LearningParentDashboardScreen.jsx`
```
```
`getLessonProgressByLessonAndActor.dal.js` → `listLessonProgressByCourseAndActor.dal.js` → `getCourseContent.controller.js` → `useCourseContent.js` → `LearningCourseScreen.jsx`
```

### `listLessonProgressByCourseAndActor.dal.js`

**Direct callers:**

- `getObservedStudentProgress.controller.js` _Controller_
- `getParentDashboard.controller.js` _Controller_
- `listObservedStudents.controller.js` _Controller_
- `getCourseContent.controller.js` _Controller_
- `getCourseHome.controller.js` _Controller_
- `getStudentDashboard.helpers.js` _Other_
- `getStudentProgressSummary.controller.js` _Controller_
- `listStudentCourses.controller.js` _Controller_

**Full call chain to screen:**

```
`listLessonProgressByCourseAndActor.dal.js` → `getObservedStudentProgress.controller.js` → `useObservedStudentProgress.js` → `LearningObservedStudentScreen.jsx`
```
```
`listLessonProgressByCourseAndActor.dal.js` → `getParentDashboard.controller.js` → `useParentDashboard.js` → `LearningParentDashboardScreen.jsx`
```
```
`listLessonProgressByCourseAndActor.dal.js` → `getCourseContent.controller.js` → `useCourseContent.js` → `LearningCourseScreen.jsx`
```
```
`listLessonProgressByCourseAndActor.dal.js` → `getStudentProgressSummary.controller.js` → `useStudentDashboard.js` → `LearningStudentDashboardScreen.jsx`
```

### `upsertLessonProgress.dal.js`

**Direct callers:**

- `markLessonComplete.controller.js` _Controller_

**Full call chain to screen:**

```
`upsertLessonProgress.dal.js` → `markLessonComplete.controller.js` → `useLessonProgress.js` → `LearningLessonScreen.jsx`
```

### `getLessonById.dal.js`

**Direct callers:**

- `getLessonView.controller.js` _Controller_
- `listLessonsByCourseId.dal.js` _DAL_
- `listLessonsByModuleId.dal.js` _DAL_

**Full call chain to screen:**

```
`getLessonById.dal.js` → `getLessonView.controller.js` → `useLessonView.js` → `LearningLessonScreen.jsx`
```
```
`getLessonById.dal.js` → `listLessonsByCourseId.dal.js` → `getObservedStudentProgress.controller.js` → `useObservedStudentProgress.js` → `LearningObservedStudentScreen.jsx`
```
```
`getLessonById.dal.js` → `listLessonsByCourseId.dal.js` → `getParentDashboard.controller.js` → `useParentDashboard.js` → `LearningParentDashboardScreen.jsx`
```
```
`getLessonById.dal.js` → `listLessonsByCourseId.dal.js` → `getStudentCourseHome.controller.js` → `useStudentProgressSummary.js` → `LearningStudentCourseScreen.jsx`
```

### `listLessonsByCourseId.dal.js`

**Direct callers:**

- `getObservedStudentProgress.controller.js` _Controller_
- `getParentDashboard.controller.js` _Controller_
- `listObservedStudents.controller.js` _Controller_
- `getStudentCourseHome.controller.js` _Controller_
- `getStudentDashboard.helpers.js` _Other_
- `getStudentProgressSummary.controller.js` _Controller_
- `listStudentCourses.controller.js` _Controller_
- `getTeacherCourseHome.controller.js` _Controller_

**Full call chain to screen:**

```
`listLessonsByCourseId.dal.js` → `getObservedStudentProgress.controller.js` → `useObservedStudentProgress.js` → `LearningObservedStudentScreen.jsx`
```
```
`listLessonsByCourseId.dal.js` → `getParentDashboard.controller.js` → `useParentDashboard.js` → `LearningParentDashboardScreen.jsx`
```
```
`listLessonsByCourseId.dal.js` → `getStudentCourseHome.controller.js` → `useStudentProgressSummary.js` → `LearningStudentCourseScreen.jsx`
```
```
`listLessonsByCourseId.dal.js` → `getStudentProgressSummary.controller.js` → `useStudentDashboard.js` → `LearningStudentDashboardScreen.jsx`
```

### `listLessonsByModuleId.dal.js`

**Direct callers:**

- `getCourseContent.controller.js` _Controller_

**Full call chain to screen:**

```
`listLessonsByModuleId.dal.js` → `getCourseContent.controller.js` → `useCourseContent.js` → `LearningCourseScreen.jsx`
```

### `getCourseMembershipByActor.dal.js`

**Direct callers:**

- `assignObserverToCourse.controller.js` _Controller_
- `assignStudentToCourse.controller.js` _Controller_
- `assignTeacherToCourse.controller.js` _Controller_
- `getCourseRoster.controller.js` _Controller_
- `linkParentToStudent.controller.js` _Controller_
- `getObservedStudentAssignments.controller.js` _Controller_
- `getObservedStudentProgress.controller.js` _Controller_
- `getParentDashboard.controller.js` _Controller_
- _+17 more_

**Full call chain to screen:**

```
`getCourseMembershipByActor.dal.js` → `getCourseRoster.controller.js` → `useCourseRoster.js` → `LearningCourseRosterScreen.jsx`
```
```
`getCourseMembershipByActor.dal.js` → `getObservedStudentAssignments.controller.js` → `useObservedStudentProgress.js` → `LearningObservedStudentScreen.jsx`
```
```
`getCourseMembershipByActor.dal.js` → `getParentDashboard.controller.js` → `useParentDashboard.js` → `LearningParentDashboardScreen.jsx`
```
```
`getCourseMembershipByActor.dal.js` → `getCourseContent.controller.js` → `useCourseContent.js` → `LearningCourseScreen.jsx`
```

### `listCourseMembershipsByActor.dal.js`

**Direct callers:**

- `assignObserverToCourse.controller.js` _Controller_
- `assignStudentToCourse.controller.js` _Controller_
- `assignTeacherToCourse.controller.js` _Controller_
- `linkParentToStudent.controller.js` _Controller_

**Full call chain to screen:**

```
`listCourseMembershipsByActor.dal.js` → `assignObserverToCourse.controller.js` → `useCourseRosterMutations.js` → `useCourseRoster.js` → `LearningCourseRosterScreen.jsx`
```

### `listCourseMembershipsByCourseId.dal.js`

**Direct callers:**

- `getAdminDashboard.controller.js` _Controller_
- `getCourseRoster.controller.js` _Controller_
- `listOrganizationCourses.controller.js` _Controller_
- `listOrganizationMembers.controller.js` _Controller_
- `getTeacherCourseHome.controller.js` _Controller_

**Full call chain to screen:**

```
`listCourseMembershipsByCourseId.dal.js` → `getAdminDashboard.controller.js` → `useAdminDashboard.js` → `LearningAdminDashboardScreen.jsx`
```
```
`listCourseMembershipsByCourseId.dal.js` → `getCourseRoster.controller.js` → `useCourseRoster.js` → `LearningCourseRosterScreen.jsx`
```
```
`listCourseMembershipsByCourseId.dal.js` → `listOrganizationCourses.controller.js` → `useOrganizationCourses.js` → `LearningOrganizationScreen.jsx`
```
```
`listCourseMembershipsByCourseId.dal.js` → `getTeacherCourseHome.controller.js` → `useTeacherCourseHome.js` → `LearningTeacherCourseScreen.jsx`
```

### `listModulesByCourseId.dal.js`

**Direct callers:**

- `getObservedStudentProgress.controller.js` _Controller_
- `getCourseContent.controller.js` _Controller_
- `getCourseHome.controller.js` _Controller_
- `getTeacherCourseHome.controller.js` _Controller_

**Full call chain to screen:**

```
`listModulesByCourseId.dal.js` → `getObservedStudentProgress.controller.js` → `useObservedStudentProgress.js` → `LearningObservedStudentScreen.jsx`
```
```
`listModulesByCourseId.dal.js` → `getCourseContent.controller.js` → `useCourseContent.js` → `LearningCourseScreen.jsx`
```
```
`listModulesByCourseId.dal.js` → `getTeacherCourseHome.controller.js` → `useTeacherCourseHome.js` → `LearningTeacherCourseScreen.jsx`
```
```
`listModulesByCourseId.dal.js` → `getCourseHome.controller.js` → `getStudentCourseHome.controller.js` → `useStudentProgressSummary.js` → `LearningStudentCourseScreen.jsx`
```

### `observerStudentLinks.dal.js`

**Direct callers:**

- `getObservedStudentProgress.controller.js` _Controller_
- `getParentDashboard.controller.js` _Controller_
- `listObservedStudents.controller.js` _Controller_

**Full call chain to screen:**

```
`observerStudentLinks.dal.js` → `getObservedStudentProgress.controller.js` → `useObservedStudentProgress.js` → `LearningObservedStudentScreen.jsx`
```
```
`observerStudentLinks.dal.js` → `getParentDashboard.controller.js` → `useParentDashboard.js` → `LearningParentDashboardScreen.jsx`
```

### `getOrganizationById.dal.js`

**Direct callers:**

- `assignObserverToCourse.controller.js` _Controller_
- `assignOrganizationMember.controller.js` _Controller_
- `assignStudentToCourse.controller.js` _Controller_
- `assignTeacherToCourse.controller.js` _Controller_
- `getCourseRoster.controller.js` _Controller_
- `linkParentToStudent.controller.js` _Controller_
- `listOrganizationCourses.controller.js` _Controller_
- `listOrganizationMembers.controller.js` _Controller_
- _+1 more_

**Full call chain to screen:**

```
`getOrganizationById.dal.js` → `assignOrganizationMember.controller.js` → `useOrganizationMembers.js` → `LearningOrganizationScreen.jsx`
```
```
`getOrganizationById.dal.js` → `getCourseRoster.controller.js` → `useCourseRoster.js` → `LearningCourseRosterScreen.jsx`
```
```
`getOrganizationById.dal.js` → `listOrganizationsByRealmId.dal.js` → `getAdminDashboard.controller.js` → `useAdminDashboard.js` → `LearningAdminDashboardScreen.jsx`
```
```
`getOrganizationById.dal.js` → `listOrganizationsByRealmId.dal.js` → `getLearningHome.controller.js` → `useStudentDashboard.js` → `LearningStudentDashboardScreen.jsx`
```

### `listOrganizationsByRealmId.dal.js`

**Direct callers:**

- `getAdminDashboard.controller.js` _Controller_
- `getLearningHome.controller.js` _Controller_

**Full call chain to screen:**

```
`listOrganizationsByRealmId.dal.js` → `getAdminDashboard.controller.js` → `useAdminDashboard.js` → `LearningAdminDashboardScreen.jsx`
```
```
`listOrganizationsByRealmId.dal.js` → `getLearningHome.controller.js` → `useStudentDashboard.js` → `LearningStudentDashboardScreen.jsx`
```

### `getDefaultLearningRealm.dal.js`

**Direct callers:**

- `resolveLearningRealm.controller.js` _Controller_

**Partial chain (no screen reached):**

```
`getDefaultLearningRealm.dal.js` → `resolveLearningRealm.controller.js`
```
```
`getDefaultLearningRealm.dal.js` → `resolveLearningRealm.controller.js` → `realm.adapter.js`
```
```
`getDefaultLearningRealm.dal.js` → `resolveLearningRealm.controller.js` → `realm.adapter.js` → `learning.adapter.js`
```

### `getLearningRealmById.dal.js`

**Direct callers:**

- `getAdminDashboard.controller.js` _Controller_
- `resolveLearningRealm.controller.js` _Controller_
- `getLearningHome.controller.js` _Controller_
- `getDefaultLearningRealm.dal.js` _DAL_
- `getLearningRealmBySlug.dal.js` _DAL_
- `getLearningRealmByVcRealmId.dal.js` _DAL_

**Full call chain to screen:**

```
`getLearningRealmById.dal.js` → `getAdminDashboard.controller.js` → `useAdminDashboard.js` → `LearningAdminDashboardScreen.jsx`
```
```
`getLearningRealmById.dal.js` → `getLearningHome.controller.js` → `useStudentDashboard.js` → `LearningStudentDashboardScreen.jsx`
```

### `getLearningRealmBySlug.dal.js`

**Direct callers:**

- `resolveLearningRealm.controller.js` _Controller_

**Partial chain (no screen reached):**

```
`getLearningRealmBySlug.dal.js` → `resolveLearningRealm.controller.js`
```
```
`getLearningRealmBySlug.dal.js` → `resolveLearningRealm.controller.js` → `realm.adapter.js`
```
```
`getLearningRealmBySlug.dal.js` → `resolveLearningRealm.controller.js` → `realm.adapter.js` → `learning.adapter.js`
```

### `getLearningRealmByVcRealmId.dal.js`

**Direct callers:**

- `resolveLearningRealm.controller.js` _Controller_

**Partial chain (no screen reached):**

```
`getLearningRealmByVcRealmId.dal.js` → `resolveLearningRealm.controller.js`
```
```
`getLearningRealmByVcRealmId.dal.js` → `resolveLearningRealm.controller.js` → `realm.adapter.js`
```
```
`getLearningRealmByVcRealmId.dal.js` → `resolveLearningRealm.controller.js` → `realm.adapter.js` → `learning.adapter.js`
```

### `listAssignmentRubricsByAssignmentId.dal.js`

**Direct callers:**

- `listTeacherAssignments.controller.js` _Controller_

**Full call chain to screen:**

```
`listAssignmentRubricsByAssignmentId.dal.js` → `listTeacherAssignments.controller.js` → `useTeacherDashboard.js` → `LearningTeacherDashboardScreen.jsx`
```

### `listSubmissionFilesBySubmissionId.dal.js`

**Direct callers:**

- `getAssignmentSubmission.controller.js` _Controller_
- `listCourseSubmissions.controller.js` _Controller_

**Full call chain to screen:**

```
`listSubmissionFilesBySubmissionId.dal.js` → `getAssignmentSubmission.controller.js` → `useAssignmentSubmission.js` → `LearningAssignmentScreen.jsx`
```
```
`listSubmissionFilesBySubmissionId.dal.js` → `listCourseSubmissions.controller.js` → `useCourseSubmissions.js` → `LearningSubmissionReviewScreen.jsx`
```

### `getSubmissionAttempt.dal.js`

**Direct callers:**

- `getObservedStudentAssignments.controller.js` _Controller_
- `getParentDashboard.controller.js` _Controller_
- `getAssignmentSubmission.controller.js` _Controller_
- `saveSubmissionDraft.controller.js` _Controller_
- `submitAssignment.controller.js` _Controller_
- `getStudentDashboard.helpers.js` _Other_
- `getStudentProgressSummary.controller.js` _Controller_

**Full call chain to screen:**

```
`getSubmissionAttempt.dal.js` → `getObservedStudentAssignments.controller.js` → `useObservedStudentProgress.js` → `LearningObservedStudentScreen.jsx`
```
```
`getSubmissionAttempt.dal.js` → `getParentDashboard.controller.js` → `useParentDashboard.js` → `LearningParentDashboardScreen.jsx`
```
```
`getSubmissionAttempt.dal.js` → `getAssignmentSubmission.controller.js` → `useAssignmentSubmission.js` → `LearningAssignmentScreen.jsx`
```
```
`getSubmissionAttempt.dal.js` → `getStudentProgressSummary.controller.js` → `useStudentDashboard.js` → `LearningStudentDashboardScreen.jsx`
```

### `getSubmissionById.dal.js`

**Direct callers:**

- `gradeSubmission.controller.js` _Controller_
- `getSubmissionAttempt.dal.js` _DAL_
- `listSubmissionsByAssignmentId.dal.js` _DAL_
- `submitAssignmentAttempt.dal.js` _DAL_
- `upsertSubmissionDraft.dal.js` _DAL_

**Full call chain to screen:**

```
`getSubmissionById.dal.js` → `gradeSubmission.controller.js` → `useGradeSubmission.js` → `LearningSubmissionReviewScreen.jsx`
```
```
`getSubmissionById.dal.js` → `getSubmissionAttempt.dal.js` → `getObservedStudentAssignments.controller.js` → `useObservedStudentProgress.js` → `LearningObservedStudentScreen.jsx`
```
```
`getSubmissionById.dal.js` → `getSubmissionAttempt.dal.js` → `getParentDashboard.controller.js` → `useParentDashboard.js` → `LearningParentDashboardScreen.jsx`
```
```
`getSubmissionById.dal.js` → `getSubmissionAttempt.dal.js` → `getAssignmentSubmission.controller.js` → `useAssignmentSubmission.js` → `LearningAssignmentScreen.jsx`
```

### `listSubmissionsByAssignmentId.dal.js`

**Direct callers:**

- `getTeacherDashboard.controller.js` _Controller_
- `listCourseSubmissions.controller.js` _Controller_
- `listTeacherAssignments.controller.js` _Controller_

**Full call chain to screen:**

```
`listSubmissionsByAssignmentId.dal.js` → `getTeacherDashboard.controller.js` → `useTeacherDashboard.js` → `LearningTeacherDashboardScreen.jsx`
```
```
`listSubmissionsByAssignmentId.dal.js` → `listCourseSubmissions.controller.js` → `useCourseSubmissions.js` → `LearningSubmissionReviewScreen.jsx`
```

### `submitAssignmentAttempt.dal.js`

**Direct callers:**

- `submitAssignment.controller.js` _Controller_

**Full call chain to screen:**

```
`submitAssignmentAttempt.dal.js` → `submitAssignment.controller.js` → `useAssignmentSubmission.js` → `LearningAssignmentScreen.jsx`
```

### `upsertSubmissionDraft.dal.js`

**Direct callers:**

- `saveSubmissionDraft.controller.js` _Controller_

**Full call chain to screen:**

```
`upsertSubmissionDraft.dal.js` → `saveSubmissionDraft.controller.js` → `useAssignmentSubmission.js` → `LearningAssignmentScreen.jsx`
```

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✗ MISSING | — |
| **Controller** | ✗ MISSING | — |
| **Adapter** | ✗ MISSING | — |
| **Service** | ✗ MISSING | — |
| **Hook** | ✗ MISSING | — |
| **Component** | ✗ MISSING | — |
| **View Screen** | ✗ MISSING | — |
| **Final Screen** | ✗ MISSING | — |

### Missing Layers

- 🔴 **Model** — not detected in static scan
- 🔴 **Controller** — not detected in static scan
- 🟡 **Adapter** — not detected in static scan
- 🟡 **Service** — not detected in static scan
- 🟡 **Hook** — not detected in static scan
- 🟡 **Component** — not detected in static scan
- 🟡 **View Screen** — not detected in static scan
- 🟡 **Final Screen** — not detected in static scan

> Missing layers may exist but use naming patterns not detected by static scan, or may be delegated to engines.

---

## Avengers Assembly Report — 2026-05-11

**Scope:** `vcsm.dal.learning.md` — documentation alignment pass  
**Triggered by:** User-invoked `/AvengersAssemble` against this document  
**Application scope:** VCSM  
**Commands run:** ARCHITECT · IRONMAN · VENOM · SENTRY · LOKI · KRAVEN · CARNAGE · FALCON · WINTER SOLDIER · LOGAN · review-contract · SHIELD  
**Mode:** READ-ONLY — no source code modified

---

### Governance Evidence Registry

| Command | Status | Evidence Source | Drift | Blocking |
|---|---|---|---|---|
| ARCHITECT | PRESENT | Live filesystem scan | YES | YES |
| IRONMAN | PRESENT | Doc + directory scan | NO | NO |
| VENOM | PRESENT | DAL source inspection | YES | CAUTION |
| SENTRY | PRESENT | Component tree + import audit | YES | NO |
| LOKI | MISSING | No runtime trace available | N/A | NO |
| KRAVEN | MISSING | No performance trace available | N/A | NO |
| CARNAGE | N/A | No schema migration scope | N/A | NO |
| FALCON | N/A | No native module scope | N/A | NO |
| WINTER SOLDIER | N/A | No Android scope | N/A | NO |
| LOGAN | PRESENT | Document internal consistency check | YES | YES |
| review-contract | PRESENT | DAL source + import audit | MINOR | NO |
| SHIELD | N/A | No external IP/license scope | N/A | NO |

---

### ARCHITECT

**Status: DRIFT FOUND**

**Findings:**

1. **CRITICAL — Architecture Pipeline table is stale (internal contradiction)**
   The Architecture Pipeline table at the bottom of this document (section "Architecture Pipeline") still marks all non-DAL layers as `✗ MISSING`. This contradicts the ARCHITECT Live Audit Findings section directly above it, which confirmed all layers are PRESENT. The table was never updated when the audit correction was appended. This is a hard internal inconsistency inside the same document.
   - Model: table shows ✗ MISSING — actual: 12 model files PRESENT
   - Controller: table shows ✗ MISSING — actual: 36 controller files PRESENT
   - Adapter: table shows ✗ MISSING — actual: 3 adapter files PRESENT
   - Hook: table shows ✗ MISSING — actual: 25 hook files PRESENT
   - Component: table shows ✗ MISSING — actual: many component files PRESENT
   - View Screen: table shows ✗ MISSING — actual: PRESENT
   - Final Screen: table shows ✗ MISSING — actual: 16 screen files PRESENT

2. **Hook count underreported:** Document states "~20 hooks" — actual filesystem count is 25 files.

3. **Controller count underreported:** Document states "~35 controllers" — actual count is 36.

4. **Route count inconsistency:** The module structure tree notes "16 registered routes under /learning" but the Route Tree table documents 18 distinct routes.

---

### IRONMAN

**Status: ALIGNED**

The `src/learning/` boundary exception is documented in RISK-1 and correctly notes that IRONMAN should own the boundary classification. No undocumented ownership conflicts found. All cross-boundary access flows through `learning.adapter.js` as documented.

---

### VENOM

**Status: DRIFT FOUND — CAUTION**

**Finding: `getDefaultLearningRealm.dal.js` uses a singleton Supabase import**

```js
import { supabase } from "@/services/supabase/supabaseClient";
```

Every other DAL file in this module receives `supabase` as an injected parameter: `{ supabase, ... }`. `getDefaultLearningRealmDal()` takes zero parameters and imports the client directly as a singleton. This deviates from the module-wide injection pattern and means:

- This DAL cannot be called with a different session context (e.g., service-role client, test client)
- RLS enforcement depends on the singleton's auth state, not the caller's
- Cannot be isolated in unit tests

The function signature `export async function getDefaultLearningRealmDal()` is inconsistent with every other DAL in this module. The realm resolution controller (`resolveLearningRealm.controller.js`) calling this function cannot inject a scoped client.

**Other VENOM findings:** No `select('*')` violations. All DAL files use named column constants (`SUBMISSION_COLUMNS`, `COURSE_COLUMNS`, `REALM_COLUMNS`). No cross-schema leaks visible. No cross-app boundary imports detected.

---

### SENTRY

**Status: DRIFT FOUND — LOW**

**Finding: RISK-3 description mischaracterizes the duplicate component pattern**

The RISK-3 entry states: "Each pair contains the same component filenames (e.g. AssignmentList.jsx exists in both `assignments/` and `assignments/assignments/`). This is almost certainly a copy-paste or move accident — not intentional versioning."

The actual pattern discovered by filesystem audit:

- Parent-level files (e.g., `components/common/assignments/AssignmentList.jsx`) are **1-line re-export shims** pointing to the nested path:
  ```js
  export { default } from "@/learning/components/common/assignments/assignments/AssignmentList";
  ```
- Canonical implementations live in the nested directories (e.g., `assignments/assignments/AssignmentList.jsx`)
- This is the same re-export shim pattern as RISK-4 (the `LearningCourseViewScreen.view.jsx` shim)

The RISK-3 statement "if screens import from the parent, the nested copy is dead" is **incorrect** — the nested copy is canonical. The parent files are convenience shims. The risk severity downgrade recommendation: from MEDIUM/accidental to LOW/intentional-but-confusing pattern. The real issue is double-indirection creating import path ambiguity, not dead duplication.

**Note:** `AssignmentRow.jsx` exists at the parent level but has NO nested duplicate — it is a standalone component, not a shim. RISK-3 does not cover this variant.

---

### LOKI

**Status: MISSING — no runtime trace available this pass**

No runtime execution evidence collected. Realm resolution chain behavior at runtime (the `resolveLearningRealm.controller.js → realm.adapter.js → learning.adapter.js` path) is documented structurally but not traced live.

---

### KRAVEN

**Status: MISSING — no performance trace available this pass**

High-fan-out DAL noted: `getCourseMembershipByActor.dal.js` has "+17 more" direct callers. No performance instrumentation exists to confirm query cost.

---

### CARNAGE

**Status: N/A**

No schema migration scope for this document pass. Learning module uses `.schema("learning")` Supabase schema separation — correct. No pending migrations identified in this scan.

---

### FALCON / WINTER SOLDIER

**Status: N/A**

Learning module is a web-only route tree at `/learning`. No native module scope applies.

---

### LOGAN

**Status: DRIFT FOUND**

**Finding 1 (CRITICAL):** The Architecture Pipeline table at the bottom of this document is the verbatim original static scan output and was never updated. It directly contradicts the documented ARCHITECT Live Audit corrections in the same file. This is the highest-priority documentation fix — the document states two opposite things simultaneously.

**Finding 2:** RISK-3 description characterizes the component folder pattern as "accidental duplication" when it is actually a systematic re-export shim pattern (same as RISK-4). The guidance "Verify which path is actually imported by controllers/hooks, then delete the unused copies" is partially wrong — the parent files are shims, not candidates for deletion unless the shim indirection is intentionally being removed.

---

### review-contract

**Status: ALIGNED (one note)**

- No TypeScript files found in `src/learning/` ✓
- No `select('*')` violations found ✓
- No relative `../../` import violations in DAL files ✓
- Column selection via named constants (`SUBMISSION_COLUMNS`, `COURSE_COLUMNS`, `REALM_COLUMNS`) — fully compliant ✓
- No cross-feature direct imports from learning into other `features/` internals ✓
- No cross-app boundary imports ✓
- **Note:** `getDefaultLearningRealm.dal.js` uses a singleton supabase import rather than injection — this is not a hard contract violation but is inconsistent with the module-wide DAL pattern. Flagged by VENOM.

---

### SHIELD

**Status: N/A**

All files in scope are internal project code. No external library, license, or provenance concerns identified.

---

### Cross-System Contradictions

| System A | System B | Contradiction | Severity | Recommended Resolution |
|---|---|---|---|---|
| ARCHITECT (audit section) | LOGAN (pipeline table) | ARCHITECT section says all layers PRESENT; Architecture Pipeline table says all MISSING | HIGH | Update Architecture Pipeline table to reflect audit findings |
| VENOM (DAL injection pattern) | ARCHITECT (doc claims all DAL files consistent) | Singleton import in `getDefaultLearningRealm.dal.js` deviates from module-wide injection pattern — not documented as exception | MODERATE | Add to RISK section or refactor to injection pattern |
| SENTRY (re-export shim pattern) | RISK-3 description (claims accidental duplication) | RISK-3 calls parent components "accidental duplicates" but they are intentional re-export shims | LOW | Update RISK-3 description to reflect actual pattern |

---

### Runtime Alignment Review

| Area | Runtime Evidence | Performance Risk | Migration Risk | Status |
|---|---|---|---|---|
| Realm resolution chain | Not traced | Low — single realm lookup | None | LOKI evidence missing |
| Submission write path | Not traced | Low — single row ops | None | LOKI evidence missing |
| Lesson progress upsert | Not traced | Low | None | LOKI evidence missing |
| High-fan-out membership DAL | Not traced | Unknown — 17+ callers | None | KRAVEN evidence missing |

---

### Ownership / Boundary Alignment

| Area | Ownership Status | Boundary Status | Contract Status | Risk |
|---|---|---|---|---|
| `src/learning/` module | IRONMAN — documented exception | Adapter boundary enforced via `learning.adapter.js` | Compliant | LOW |
| Realm resolution singleton | Undocumented | Bypasses injection pattern | Minor deviation | MODERATE |
| Component shim pattern | Not assigned | Functional but adds indirection | Not covered by contract | LOW |

---

### Documentation Truth Review

| Doc/System | Truth Status | Drift | Blocking |
|---|---|---|---|
| DAL files inventory (33 files) | ALIGNED | None — exact match confirmed | NO |
| Tables accessed inventory | ALIGNED | None | NO |
| Architecture Pipeline table | STALE | All non-DAL layers wrongly show MISSING | YES |
| Hook count ("~20") | MINOR DRIFT | Actual: 25 | NO |
| Controller count ("~35") | MINOR DRIFT | Actual: 36 | NO |
| Route count ("16 registered") | MINOR DRIFT | Route table documents 18 routes | NO |
| RISK-3 description | MINOR DRIFT | Characterizes re-export shims as accidental duplication | NO |
| Singleton supabase in realm DAL | MISSING | Not documented in any risk entry | CAUTION |

---

### Module Alignment Matrix

| Module | Architecture | Ownership | Security | Runtime | Docs | Release Status |
|---|---|---|---|---|---|---|
| Learning DAL (33 files) | ALIGNED | ALIGNED | CAUTION | MISSING | MINOR DRIFT | CAUTION |
| Realm resolution chain | ALIGNED | ALIGNED | CAUTION | MISSING | MINOR DRIFT | CAUTION |
| Submission write path | ALIGNED | ALIGNED | ALIGNED | MISSING | ALIGNED | READY |
| Component shim pattern | ALIGNED | ALIGNED | N/A | N/A | MINOR DRIFT | READY |

---

### Proposed Fixes (no .v2.md required — append-mode report)

The following documentation corrections are needed inside this document:

1. **Architecture Pipeline table** — update all layer statuses from `✗ MISSING` to `✓ PRESENT` to match the ARCHITECT Live Audit Findings section. The "Missing Layers" sub-list below the table should be removed or replaced with the confirmed present layers.

2. **RISK-3 description** — revise to clarify that parent-level component files are re-export shims pointing to the nested canonical implementations. Update the recommended action accordingly: confirm whether the shim indirection is intentional, then either document it as an approved shim pattern or collapse the double-indirection.

3. **New RISK-6 entry** — document the singleton supabase import in `getDefaultLearningRealm.dal.js` as a deviation from the module-wide injection pattern.

4. **Layer counts** — update "~20 hooks" → "25", "~35 controllers" → "36", "16 registered routes" → "18".

---

### Release Intelligence Summary

| Area | Status | Blocking Risk | Recommended Command |
|---|---|---|---|
| Architecture | DRIFT FOUND | YES — internal table contradiction | LOGAN: update pipeline table |
| Ownership | ALIGNED | NO | — |
| Security | CAUTION | NO (but should be addressed) | VENOM: audit singleton import |
| Runtime | MISSING EVIDENCE | NO | LOKI |
| Performance | MISSING EVIDENCE | NO | KRAVEN |
| Documentation | DRIFT FOUND | YES — table contradicts audit | LOGAN |
| iOS / Android | N/A | NO | — |
| IP Safety | N/A | NO | — |

---

### Overall Status

**DRIFT FOUND**

Drift is isolated to documentation only. No source code violations detected. No release-blocking code issues found.

Two items require documentation correction before this doc is considered authoritative:
1. Architecture Pipeline table must be updated to reflect confirmed PRESENT layers
2. RISK-3 description must be corrected from "accidental duplication" to "re-export shim pattern"
3. RISK-6 should be added for the singleton supabase deviation in `getDefaultLearningRealm.dal.js`

Source code is clean. No contract violations. No security breaks.

### Recommended Next Command

`/Logan` — update Architecture Pipeline table, correct RISK-3 description, add RISK-6 for singleton supabase pattern
