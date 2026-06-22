# Module: Learning

## PWA Source of Truth

**Routes:**
- `/learning`
- `/learning/courses/:courseId`
- `/learning/courses/:courseId/assignments`
- `/learning/courses/:courseId/lessons/:lessonId`
- `/learning/courses/:courseId/assignments/:assignmentId`
- `/learning/lessons/:lessonId`
- `/learning/assignments/:assignmentId`
- `/learning/student`
- `/learning/student/courses/:courseId`
- `/learning/teacher`
- `/learning/teacher/courses/:courseId`
- `/learning/teacher/courses/:courseId/submissions`
- `/learning/teacher/courses/:courseId/assignments/:assignmentId/submissions`
- `/learning/parent`
- `/learning/parent/courses/:courseId/students/:studentActorId`
- `/learning/admin`
- `/learning/admin/organizations/:organizationId`
- `/learning/admin/courses/:courseId/roster`

**Screens/components:**
- `apps/VCSM/src/learning/routes/learning.routes.jsx`
- `apps/VCSM/src/learning/routes/learningRouteComponents.jsx`
- `apps/VCSM/src/learning/layout/LearningLayout.jsx`
- `apps/VCSM/src/learning/screens/shared/*`
- `apps/VCSM/src/learning/screens/students/*`
- `apps/VCSM/src/learning/screens/teachers/*`
- `apps/VCSM/src/learning/screens/parents/*`
- `apps/VCSM/src/learning/screens/administration/*`
- `apps/VCSM/src/learning/adapters/learning.adapter.js`

**Services/DAL:**
- Audit required before implementation. Do not infer Wentrex LMS architecture.
- VCSM learning is the embedded `/learning` route inside `apps/VCSM`, not the standalone Wentrex SaaS.

**Supabase schema/tables/RPCs:**
- Audit required before native implementation.

**RLS expectations:**
- Learning must be actor-scoped and role-aware.
- Student, teacher, parent, and admin views must fail closed if role or membership lookups fail.
- Parent observed-student routes must verify the parent/student relationship before exposing course progress.
- Admin organization and roster routes must not rely only on route params.

**Current PWA status:** Source of truth has role-specific learning routes and screens for shared course/lesson/assignment views, student dashboard/course, teacher dashboard/course/submissions, parent dashboard/observed student, and admin organization/roster surfaces.

---

## Native Transfer Status

**Status:** `Missing`

---

## Transferred Native Files

- `VCSMNativeCore/Sources/VCSMNativeCore/NativeAppRoute.swift` has `learningHub`.
- `VCSMNativeApp/Navigation/AppRouteParser.swift` maps `/learning` to `learningHub`.
- `VCSMNativeApp/App/AppNavigationView.swift` routes `learningHub` to `LearningHubScreen`.
- `VCSMNativeApp/App/AppNavigationSupport.swift` contains `LearningHubScreen`.

---

## Native Behavior Currently Present

- Native has a single `LearningHubScreen`.
- The current native learning surface is a native-only mock/starter, not a transfer of the PWA learning route tree.
- No role-specific native route cases were found for student, teacher, parent, admin, course, lesson, assignment, roster, or submission-review routes.

---

## Native Gaps

- Route contract is missing for PWA learning detail routes.
- Parser support is missing for learning subroutes beyond `/learning`.
- DAL/service layer is missing or unaudited.
- Domain models are missing or unaudited.
- Controllers/stores are missing for role dashboards and detail views.
- Native screens are missing for all role-specific and detail learning surfaces.
- Runtime RLS/role verification is not proven.

---

## Risk Notes

- Do not reuse Wentrex patterns without explicit approval. VCSM embedded learning and Wentrex standalone LMS are separate products.
- Do not ship mock learning data as parity.
- Do not add route cases to `NativeAppRoute.swift` without a route audit and module log update.
- Learning implementation must follow DAL → Model → Controller → Hook/Store → Components → View Screen → Final Screen.

---

## Pending Transfer Checklist

- [ ] Audit PWA learning DAL/services/schema and identify canonical tables/RPCs.
- [ ] Define native route cases for every PWA learning route that belongs in the native product.
- [ ] Update `AppRouteParser.swift` for learning subroutes after route cases are approved.
- [ ] Build learning DAL with explicit column selects only.
- [ ] Build models for courses, lessons, assignments, submissions, organizations, rosters, and observed-student progress.
- [ ] Build controllers for role dashboards and detail views with fail-closed role checks.
- [ ] Build stores/hooks for lifecycle, loading, refresh, and navigation state.
- [ ] Build SwiftUI screens for shared, student, teacher, parent, and admin surfaces.
- [ ] Replace the mock `LearningHubScreen` with transferred native behavior or clearly gate it as placeholder.
- [ ] Runtime test role access, deep links, loading/empty/error states, and RLS denial behavior.

---

## PWA → Native Transfer Log

### 2026-05-12 — Module created from UI screen audit

- Date: 2026-05-12
- Change type: Audit / Transfer Document
- PWA files changed: none — read-only audit
- Routes affected: all `/learning` routes listed above
- Screens/components changed: none
- Services/DAL changed: none
- Behavior change: none
- Supabase schema/RPC change: none
- RLS expectations changed: no implementation change; RLS expectations documented for transfer
- Affected native modules: Learning
- Priority: P1
- Native status: Missing
- Testing notes: No native code changed. Existing native `LearningHubScreen` is a mock/starter and does not satisfy PWA route parity.
- Notes: Created dedicated module because the canonical tracker did not previously have a learning transfer file.

---

- Date:
- Change type: Feature / Fix / Schema / UI / RLS
- PWA files changed:
- Routes affected:
- Screens/components changed:
- Services/DAL changed:
- Behavior change:
- Supabase schema/RPC change:
- RLS expectations changed:
- Affected native modules:
- Priority: P0 / P1 / P2
- Native status: Not started / Partial / Risky / Complete
- Testing notes:
- Notes:

---

## Transfer History

- Last synced date: 2026-05-12
- Native files updated: none
- Delta status: Missing — module created; PWA route inventory documented; native implementation not started
- Notes: Native has only a mock/starter `LearningHubScreen`; full VCSM embedded learning transfer remains open.

---

## Archived Notes

No archived notes yet.
