# Wentrex Architecture Review

**Generated:** 2026-03-31
**Scope:** `apps/wentrex/`, `engines/auth`, `engines/identity`, `engines/chat`, `zcontract/`
**Total source files:** ~391

---

## A. Current Architecture Summary

Wentrex is a standalone multi-tenant LMS SaaS built with React 19, Vite, and Supabase. It serves four audiences (student, teacher, parent/observer, admin) across isolated school workspaces accessed via realm slug routing.

**Stack:** React 19 + Vite + Supabase (PostgreSQL + Auth + Realtime) + React Router 7.6 + React Query 5 + Zustand 5 + Zod 4

**Domain Hierarchy:**
```
Realms (tenants)
  -> Organizations
       -> Course Terms
            -> Courses
                 -> Modules
                      -> Lessons
                           -> Assignments
                                -> Submissions
                                     -> Grades
```

**Layer Order (per contract):**
```
DAL -> Model -> Controller -> Hook -> Component -> Screen
```

**Engine Dependencies:**
- `engines/identity` - Authentication, session management, actor resolution
- `engines/chat` - Messaging, inbox, conversations

**Entry Points:**
- `src/main.jsx` - Vite entry, engine initialization
- `src/App.jsx` - Root router (~31 routes)

---

## B. Active Runtime Ownership Map

| System | Status | Owner Layer | Notes |
|--------|--------|-------------|-------|
| **Identity / Auth** | Frozen / Stable | `engines/identity` + `features/identity/` | Two-phase resolution (INITIAL_SESSION -> SIGNED_IN), Wentrex-specific resolver, no VCSM leakage |
| **Chat / Messaging** | Active but evolving | `engines/chat` + `features/communication/` | Generic inbox/conversation integrated, not yet course-aware |
| **LMS Core (Courses, Modules, Lessons)** | Active but evolving | `learning/administration/` | Full DAL/Model/Controller/Hook/Screen stack |
| **Assignments & Submissions** | Active but evolving | `learning/administration/` + `learning/student/` + `learning/staff/` | Grading, rubrics, file uploads, late policies, attempt limits all present |
| **Route Protection** | Stable | `learning/components/RequireRole.jsx` + `App.jsx` | Three-level suspension: NO_SESSION -> login, ACCESS_DENIED -> unauthorized, isSuspended -> suspended |
| **Actor Resolution** | Stable | `features/identity/WentrexIdentityContext.jsx` | Self-healing for missing platform records, skip login record on public routes |
| **Multi-Tenancy / Realm** | Partially migrated | `controller/shared/resolveRealmSlug.controller.js` | Realm resolution works, but many screens bypass DAL and lack explicit realm filtering |
| **Announcements** | Legacy / Stub | `features/communication/adapters/chatEngine.adapter.js` | Only `createWentrexAnnouncementConversation()` adapter exists; no LMS announcement system |
| **Moderation** | Unclear ownership | `features/moderation/` | Adapters exist but no visible integration in UI |
| **Block Feature** | Unclear ownership | `features/block/` | Adapter present but not integrated |
| **Admin Dashboard** | Active but evolving | `learning/administration/` | Full CRUD for orgs, members, courses, access management |
| **Parent Portal** | Active but evolving | `learning/parent/` | Dashboard, student monitoring, settings |
| **Student Portal** | Partially migrated | `learning/student/` | Old screens (direct Supabase) + new controller pattern coexist |
| **Teacher Portal** | Partially migrated | `learning/staff/` | Same dual-pattern issue as student |
| **Shared Engine Integration** | Stable | `features/` adapters | Clean adapter boundaries for identity and chat |

---

## C. Orphaned / Dead / Duplicate File Candidates

### Confirmed Duplicates

| File (Original) | Duplicate | Domain |
|-----------------|-----------|--------|
| `administration/dal/lessonProgress/upsertLessonProgress.dal.js` | `student/dal/lessonProgress/upsertLessonProgress.dal.js` | Lesson Progress |
| `administration/dal/lessonProgress/getLessonProgressByLessonAndActor.dal.js` | `student/dal/lessonProgress/getLessonProgressByLessonAndActor.dal.js` | Lesson Progress |
| `administration/dal/lessonProgress/listLessonProgressByCourseAndActor.dal.js` | `student/dal/lessonProgress/listLessonProgressByCourseAndActor.dal.js` | Lesson Progress |
| `administration/dal/grades/upsertGrade.dal.js` | `staff/dal/grades/upsertGrade.dal.js` | Grading |
| `administration/dal/submissionFiles/*` | `staff/dal/submissionFiles/*` | Submissions |
| `administration/dal/rubrics/*` | `staff/dal/rubrics/*` | Rubrics |
| `administration/model/submission.model.js` | `student/model/submission.model.js` | Submissions |
| `administration/model/lessonProgress.model.js` | `student/model/lessonProgress.model.js` | Lesson Progress |

**Total:** ~8+ core DAL/model functions duplicated across `student/`, `staff/`, and `administration/` subdirectories with identical implementations.

### Likely Orphaned Files

| File | Reason |
|------|--------|
| `src/app/platform.js` | Never imported anywhere |
| `features/moderation/adapters/` (4 files) | No moderation UI integration visible |
| `features/block/adapters/ui/BlockConfirmModal.adapter.jsx` | Block feature not integrated |
| `features/ui/` | Empty directory |

### Likely Dead Screens (Old Pattern)

These screens bypass the DAL layer and query Supabase directly. They likely have newer replacements in the nested `student/student/`, `staff/teacher/`, `parent/parent/` directories:

| Old Screen | Likely Replacement |
|-----------|-------------------|
| `student/screens/StudentDashboardScreen.jsx` | `student/student/screens/LearningStudentDashboardScreen.jsx` |
| `student/screens/StudentCourseScreen.jsx` | `student/student/screens/` controllers |
| `student/screens/StudentAssignmentScreen.jsx` | No replacement yet |
| `staff/screens/TeacherDashboardScreen.jsx` | `staff/teacher/screens/LearningTeacherDashboardScreen.jsx` |
| `staff/screens/TeacherCourseScreen.jsx` | `staff/teacher/screens/` controllers |
| `parent/screens/ParentDashboardScreen.jsx` | `parent/parent/screens/LearningParentDashboardScreen.jsx` |

---

## D. Partial Migrations and Split-Ownership Zones

### 1. Screen Architecture Migration (HIGH priority)

**Two coexisting patterns:**

**Old pattern** (19 screens in `learning/*/screens/`):
- Query Supabase directly from screen components
- Bypass DAL, Model, Controller layers entirely
- Use `.select('*')` (contract violation)
- No realm scoping on queries

**New pattern** (nested `student/student/`, `staff/teacher/`, `parent/parent/`):
- Follow DAL -> Model -> Controller -> Hook -> Screen architecture
- Use proper model transformations
- Explicit column selections

**Impact:** Both patterns are wired into routes. The old screens are still active and serving users.

### 2. Import Path Split (81 files affected)

Controllers and components in `student/`, `staff/`, `parent/` import from:
```
@/learning/dal/courses/listCoursesByActorId.dal
```

But actual files live at:
```
src/learning/administration/dal/courses/listCoursesByActorId.dal.js
```

This works because `@` resolves to `src/` and there may be implicit file resolution, but the path is **non-explicit and brittle**. The `administration/` segment is either silently resolved or there's a symlink/re-export.

**Affected:** 81 imports across student (33), staff (33), parent (21) controllers.

### 3. Parent Account Creation

Two implementations exist:
- `supabase/functions/create-parent/index.ts` (edge function)
- `src/learning/parent/create-parent-function/index.ts` (local copy)
- `src/learning/parent/createParent.js` (another variant)

---

## E. Supabase Usage Map

### Schema
All queries use `.schema("learning")` explicitly.

### Tables Accessed

| Table | Operations | Files |
|-------|-----------|-------|
| `actors` | SELECT, INSERT | 12 locations |
| `actor_identities` | SELECT, UPDATE, UPSERT | 6 locations |
| `actor_profiles` | UPSERT | 3 locations |
| `actor_owners` | SELECT | 5 locations |
| `actor_access` | UPSERT | 1 location |
| `organizations` | SELECT | 5 locations |
| `organization_memberships` | SELECT | 5 locations |
| `platform_admins` | SELECT | 5 locations |
| `courses` | SELECT | 3 locations |
| `course_memberships` | SELECT, INSERT, UPSERT | 4 locations |
| `assignments` | SELECT | 1 location |
| `assignment_resources` | SELECT | 1 location |
| `submissions` | SELECT, INSERT | 2 locations |
| `grades` | SELECT | 1 location |
| `parent_student_links` | SELECT, INSERT, UPSERT | 5 locations |
| `observer_student_links` | INSERT | 1 location |
| `audit_log` | INSERT | 3 locations |

### RPC Calls

| Function | Location |
|----------|----------|
| `is_platform_owner` | `supabase/functions/create-tenant/index.ts` |
| `create_tenant_bootstrap` | `supabase/functions/create-tenant/index.ts` |
| `generate_student_login_id` | `supabase/functions/create-student/index.ts` |
| `ensure_org_member_account` | `supabase/functions/create-org-member/index.ts` |
| `ensure_parent_account` | `supabase/functions/create-parent/index.ts`, `src/learning/parent/create-parent-function/index.ts` |
| `ensure_parent_identity` | `supabase/functions/create-parent/index.ts` |

### Client Pattern
Two Supabase clients used throughout:
- `userClient` - created with user's auth header (for RLS-scoped queries)
- `adminClient` - created with service role key (for provisioning operations)

---

## F. Dead DAL / Controller / Model Layers

### Likely Dead DAL Functions
- `administration/dal/diagnostics/runDiagnostics.dal.js` - Only used by admin diagnostics panel; may be debug-only
- All duplicated DAL files in `student/dal/` and `staff/dal/` if the migration to `administration/dal/` is complete

### Likely Dead Controllers
- Old-pattern screens don't use controllers at all, so the controllers in `student/student/controller/`, `staff/teacher/controller/`, `parent/parent/controller/` may not yet be wired into active routes if old screens are still mounted

### Likely Dead Models
- Duplicated models in `student/model/` and `staff/model/` if `administration/model/` is the canonical source

---

## G. Broken Imports / Invalid Paths

### Confirmed: 81 Non-Standard Import Paths

Files in `student/`, `staff/`, `parent/` subdirectories import from `@/learning/dal/...` which resolves to `src/learning/dal/...` but the actual files are at `src/learning/administration/dal/...`.

**Pattern:**
```js
// Import says:
import { listCoursesByActorIdDal } from "@/learning/dal/courses/listCoursesByActorId.dal"

// File actually lives at:
// src/learning/administration/dal/courses/listCoursesByActorId.dal.js
```

**Breakdown:**
- Student controllers: 33 broken imports
- Staff controllers: 33 broken imports
- Parent controllers: 21 broken imports

**Risk:** If the bundler resolution changes or the directory is renamed, 81 files break simultaneously.

### No VCSM Cross-Imports
Confirmed: zero imports from `apps/VCSM` anywhere in Wentrex.

---

## H. Future Work Backlog by Priority

### P0 - Critical (Architecture Violations)

1. **Fix `.select('*')` violations in StudentAssignmentScreen.jsx**
   - File: `src/learning/student/screens/StudentAssignmentScreen.jsx` (lines 59, 63, 65, 77)
   - Replace with explicit column projections
   - Move queries to DAL layer

2. **Add explicit realm scoping to old-pattern screens**
   - 19 screens query Supabase directly without realm filters
   - Tenant isolation relies solely on RLS; should have application-level scoping as defense-in-depth

### P1 - High (Migration Completion)

3. **Complete screen architecture migration**
   - Migrate remaining old-pattern screens to DAL -> Controller -> Hook -> Screen
   - Candidate screens: StudentAssignmentScreen, TeacherCourseScreen, ParentDashboardScreen, etc.
   - Remove old screens once new ones are verified

4. **Fix 81 broken import paths**
   - Standardize imports to use actual file locations
   - Or create explicit re-exports at `src/learning/dal/` if that's the intended public API

5. **Deduplicate DAL/Model files**
   - 8+ DAL functions exist identically in multiple directories
   - Consolidate to single source of truth in `administration/dal/` (or a shared `learning/dal/`)
   - Update all imports

### P2 - Medium (Cleanup)

6. **Remove orphaned features**
   - `features/moderation/` - wire in or remove
   - `features/block/` - wire in or remove
   - `features/ui/` - empty, remove
   - `src/app/platform.js` - unused, remove

7. **Consolidate parent account creation**
   - Three implementations: edge function, local copy, createParent.js
   - Should be one canonical path

8. **Remove old duplicate screens**
   - Once migration is complete, delete screens in `student/screens/`, `staff/screens/`, `parent/screens/` that have replacements in nested directories

### P3 - Low (Roadmap Features)

9. **Quizzes** - No implementation present
10. **Gradebook** - No aggregation/reporting layer
11. **Announcements** - Only chat adapter stub exists; no LMS announcement system
12. **SIS/LTI Integrations** - No integration layer
13. **Analytics** - No reporting DAL or controllers

---

## I. Structural Risks and Hidden Coupling

### 1. RLS-Only Tenant Isolation (HIGH RISK)
- Old-pattern screens rely entirely on Supabase Row-Level Security for tenant isolation
- No application-level realm scoping on ~19 screens
- If RLS policy has a gap, data leaks across tenants
- **Recommendation:** Defense-in-depth: always filter by realm at the application level AND rely on RLS

### 2. Import Path Fragility (MEDIUM RISK)
- 81 files import from a path that doesn't directly match the filesystem
- Single directory rename breaks the entire student/teacher/parent portal
- No build-time validation catches this

### 3. Dual Screen Architecture (MEDIUM RISK)
- Two competing screen patterns serve the same routes
- Unclear which pattern is canonical
- Risk of behavior divergence between old and new implementations

### 4. Duplicate DAL Drift (MEDIUM RISK)
- Identical DAL functions in 3+ directories
- If one copy is updated but others aren't, behavior diverges silently
- No mechanism to enforce consistency

### 5. Engine Version Coupling (LOW RISK)
- Identity and chat engines are shared with VCSM
- Engine changes must be validated against both apps
- Currently clean: Wentrex uses adapters to bridge engines

---

## J. Recommended Cleanup Order

```
Phase 1: Safety (P0)
  1. Fix .select('*') violations
  2. Add realm scoping to old screens (even before migration)

Phase 2: Migration (P1)
  3. Deduplicate DAL/Model files -> single canonical location
  4. Fix import paths to reference canonical locations
  5. Complete screen migration (old -> new pattern)

Phase 3: Cleanup (P2)
  6. Remove old duplicate screens
  7. Remove orphaned features (moderation, block, platform.js)
  8. Consolidate parent creation path

Phase 4: Features (P3)
  9. Build out roadmap features (quizzes, gradebook, announcements, etc.)
```

---

## K. What Should Be Frozen vs What Should Still Evolve

### Freeze (Do Not Modify)

| System | Reason |
|--------|--------|
| Identity engine integration (`features/identity/`) | Stable, self-healing, clean adapter boundary |
| Chat engine integration (`features/communication/`) | Working adapter pattern, policy layer in place |
| Auth feature (`features/auth/`) | Login/reset flows stable and complete |
| Route protection (`RequireRole.jsx` + suspension logic) | Three-level guard working correctly |
| Supabase edge functions (`supabase/functions/`) | Provisioning functions are stable |
| Architecture layer contract (DAL -> Model -> Controller -> Hook -> Screen) | The contract is correct; enforce it, don't change it |

### Evolve (Active Development)

| System | Direction |
|--------|-----------|
| Student portal screens | Migrate from old pattern to controller-based architecture |
| Teacher portal screens | Same migration as student |
| Parent portal screens | Same migration as parent |
| Admin dashboard | Continue building out; follows correct pattern already |
| DAL layer | Consolidate duplicates, add realm scoping |
| Announcements | Build proper LMS announcement system (not just chat adapter) |
| Grading | Evolve toward gradebook aggregation |
| Quizzes | New feature build |

---

*End of review. This document reflects the codebase as of 2026-03-31. All findings are based on static analysis of source files. No code was modified during this review.*
