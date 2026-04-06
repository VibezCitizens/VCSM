# Learning LMS V2 Architecture (Actor + Realm Version)

Assumptions
- `vc.actors.id` is the canonical identity for learning.
- `learning.*` remains the backbone of the LMS domain.
- `learning.realms` is the learning tenancy boundary.
- PostgreSQL is the source of truth. Controllers and jobs write transactionally into Postgres.
- This remains a modular monolith: feature modules in app code, one database, one integration boundary.
- `src/learning` is the implementation blueprint and must reflect the database domain closely.

## 1. Current schema review

What is already good
- `learning.realms -> learning.organizations -> learning.course_terms -> learning.courses` is the correct tenant and academic hierarchy.
- `learning.course_memberships` already gives a unified actor-based permission surface for students, observers, instructors, graders, admins, and TAs.
- `learning.modules`, `learning.lessons`, `learning.assignments`, `learning.submissions`, `learning.submission_files`, `learning.grades`, and `learning.assignment_rubrics` provide the correct instructional backbone.
- `learning.lesson_progress` already exists for learner completion tracking.
- `learning.audit_log` is the right generic append-only audit sink.
- `courses.realm_id` gives direct course tenancy scope.
- `created_by_actor_id`, `actor_id`, and `graded_by_actor_id` make the schema actor-native.

What should remain unchanged
- Keep `learning.realms`, `learning.organizations`, `learning.course_terms`, and `learning.courses` as the tenant/course backbone.
- Keep `learning.course_memberships` as the authoritative course membership source.
- Keep `learning.modules`, `learning.lessons`, `learning.assignments`, `learning.submissions`, `learning.submission_files`, `learning.grades`, `learning.assignment_rubrics`, and `learning.lesson_progress`.
- Keep `learning.audit_log` as the generic append-only audit stream.
- Keep `courses.syllabus` inside `learning.courses`.

What is missing
- Platform admin support and institution-level admin membership.
- Observer-to-student links.
- Publishing metadata beyond booleans.
- Content attachments for lessons and managed course file registry.
- Module prerequisites and progression rules.
- Gradebook concepts: assignment groups, late policy, overrides, grading workflow state, immutable grade change history, rubric assessments, submission comments.
- Communication primitives: announcements, discussions, course inbox, mentions, notifications, read tracking.
- Quiz-specific structure: banks, questions, attempts, answers, accommodations, item analytics.
- Integration scaffolding: external tools, SIS/LTI mapping, webhook subscriptions, event outbox, import/export jobs.
- Analytics tables and views for activity, progress, and at-risk indicators.
- Consistent RLS helper functions and integrity triggers.

What should be added next
- Additive schema expansion around org membership, observer links, content progression, gradebook, communications, quizzes, analytics, and integrations.
- Integrity triggers on the current MVP tables before more features pile on top.
- Helper views and helper functions so policies and services stop re-deriving membership ad hoc.
- PostgREST/Supabase config changes so `learning` and `vc` are exposed as API schemas.

What should wait until later
- SCORM/xAPI package ingestion.
- Live conferencing and attendance capture.
- Full plagiarism detection and proctoring.
- Outcomes/mastery standards and competency transcripting.
- Course blueprints and cross-term content cloning.
- Hard partitioning of high-volume analytics tables.
- Section-level rostering unless SIS requires it now.

## 2. Gap analysis

Core domain gaps
- The schema is course-centric but not yet institution-admin centric.
- Observer exists as a role but there is no observer-to-student link.
- Platform-wide admin access is not modeled yet.
- Membership exists at the course level but not yet at the organization level.

Instructional delivery gaps
- `modules` and `lessons` exist, but prerequisite and completion requirement models are still missing.
- File support is submission-focused today; instructional content still needs a managed file registry and lesson attachment model.
- Publishing is still mostly boolean-driven and should gain timestamps, actors, and future-safe settings.

Grading gaps
- `grades` is still a mutable current-state record and needs immutable change history.
- There is no weighted category model, late policy model, override model, or review-state model.
- `assignment_rubrics` defines criteria but does not store per-submission rubric scoring.

Communication gaps
- No persistent course announcement, discussion, message, mention, or notification model.
- No read tracking outside learner progress and whatever the app infers.

Assessment gaps
- Quizzes need their own domain instead of overloading assignments.
- Auto-grading and manual grading need separate storage for attempts and item responses.
- Accommodations need explicit data.

Platform gaps
- No integration registry, event outbox, or import/export job tracking.
- No first-class activity event table for analytics and at-risk reporting.
- RLS is not yet centralized around reusable actor/realm permission helpers.

Tradeoffs
- I am not replacing `learning.course_memberships`; it is already the unified membership table and should remain the authoritative membership surface.
- I am keeping `lessons` as the lesson/page backbone instead of introducing a separate page system.
- I am not adding sections in the first expansion unless SIS data requires them.
- I am keeping `vc.actors` as the shared identity backbone but not moving learning business state into `vc`.

## 3. Expanded domain model

Identity and tenancy
- `learning.platform_admins`: platform-wide emergency/admin access.
- `learning.organization_memberships`: institution-level membership for owner/admin/staff/analyst roles.
- `learning.observer_student_links`: links observer course memberships to specific students they can see.
- `learning.v_course_memberships`: unified view over `learning.course_memberships` with course/org/realm context.
- Optional helper views for active memberships only.

Content delivery
- Extend `courses` with `home_lesson_id`, `default_landing`, `locale`, `timezone`, and `settings`.
- Extend `modules`, `lessons`, and `assignments` with publishing metadata and settings.
- `learning.course_files`: managed instructional file/media registry.
- `learning.lesson_file_attachments`: explicit lesson-to-file join table.
- `learning.module_prerequisites`: module sequencing.
- `learning.module_completion_requirements`: required lesson/assignment completion logic.
- Keep `learning.lesson_progress` as learner completion tracking.

Grading
- `learning.assignment_groups`: weighted gradebook categories.
- `learning.course_late_policies`: per-course late deduction policy.
- `learning.submission_comments`: grading thread / comments.
- `learning.submission_review_states`: grading queue/review lock state.
- `learning.rubric_assessments` and `learning.rubric_assessment_scores`: per-submission rubric results.
- `learning.grade_overrides`: explicit active override records.
- `learning.grade_change_history`: immutable grade change ledger.
- `learning.v_gradebook_rows`: gradebook-ready view across students, assignments, latest submission, current grade, override, and late-adjusted score.

Communication
- `learning.announcements` and `learning.announcement_reads`
- `learning.discussion_topics`, `learning.discussion_posts`, and `learning.discussion_topic_reads`
- `learning.course_conversations`, `learning.course_conversation_participants`, and `learning.course_messages`
- `learning.mentions`
- `learning.notifications`, `learning.notification_preferences`, and `learning.notification_outbox`

Assessments
- `learning.quizzes`
- `learning.question_banks`
- `learning.question_bank_questions`
- `learning.quiz_questions`
- `learning.quiz_accommodations`
- `learning.quiz_attempts`
- `learning.quiz_attempt_answers`
- `learning.v_quiz_item_analytics`

Integrations
- `learning.integration_connections`
- `learning.integration_entity_links`
- `learning.external_tool_links`
- `learning.event_subscriptions`
- `learning.event_outbox`
- `learning.import_export_jobs`

Analytics and operations
- `learning.activity_events`
- `learning.student_risk_indicators`
- `learning.background_jobs`
- `learning.v_student_course_progress`
- `learning.v_at_risk_students`

Important indexes
- Membership lookups: `(course_id, actor_id, status)`, `(course_id, role, status)`, `(organization_id, actor_id, status)` on future org memberships
- Observer linking: `(course_id, observer_actor_id)`, `(course_id, student_actor_id)`
- Instructional ordering: `(course_id, sort_order)` on modules, `(module_id, sort_order)` on lessons, `(lesson_id, actor_id)` on lesson progress, `(quiz_id, position)` on quiz questions
- Gradebook access: `(assignment_id, actor_id)`, `(course_id, actor_id)`, `(course_id, review_state)`, `(course_id, created_at desc)`
- Messaging/communication: `(course_id, published_at desc)`, `(topic_id, parent_post_id, created_at)`, `(conversation_id, created_at)`, `(actor_id, is_read, created_at desc)`
- Outbox/work queues: `(status, next_attempt_at)` on notification/event/job tables
- Analytics: BRIN on `activity_events.occurred_at`, plus `(course_id, occurred_at desc)` and `(actor_id, occurred_at desc)`

Recommended constraints
- Keep existing PK/FK structure intact and add additive FKs.
- Add consistency triggers so module/lesson/assignment/submission/grade rows cannot drift across courses.
- Use partial unique indexes for active overrides.
- Use explicit `check` constraints for enums, percentages, positive counts, and mutually-exclusive scope columns.
- Keep unique `(course_id, actor_id, role)` on `course_memberships`.
- Keep unique `(assignment_id, actor_id, attempt_no)` on `submissions`.
- Keep unique `(lesson_id, actor_id)` on `lesson_progress`.
- Keep unique `(realm_id, slug)` on `courses`.
- Keep unique ordering constraints on modules and lessons.

Suggested triggers and functions
- `learning.tg_set_updated_at()`: shared `updated_at` trigger.
- `learning.current_actor_id()`: central actor resolver for RLS.
- Permission helpers:
  - `learning.is_platform_admin(...)`
  - `learning.has_org_role(...)`
  - `learning.has_course_role(...)`
  - `learning.can_access_course(...)`
  - `learning.can_manage_course(...)`
  - `learning.can_grade_course(...)`
  - `learning.can_view_course_participant(...)`
- Integrity triggers:
  - validate module-to-course consistency
  - validate lesson-to-module/course consistency
  - validate assignment-to-course/module consistency
  - validate submission-to-assignment/course consistency
  - validate grade-to-submission consistency
  - validate org/course/realm scope on new tables
- Domain triggers:
  - grade history capture
  - grade override history capture
  - mention-to-notification fanout
  - announcement publish notification fanout
  - notification-to-outbox fanout
- Helper functions:
  - `learning.apply_late_policy(...)`
  - `learning.grade_quiz_attempt(...)`
  - `learning.normalized_text_array(...)`

Views
- `learning.v_course_memberships`
- `learning.v_gradebook_rows`
- `learning.v_student_course_progress`
- `learning.v_quiz_item_analytics`
- `learning.v_at_risk_students`

## 4. SQL migrations

Primary migration
- `learning_lms_v2_actor.sql`

Required Supabase config change
- expose both `vc` and `learning` schemas

What the migration does
- Exposes `vc` and `learning` in Supabase API config.
- Strengthens existing `learning.*` tables with additional columns, indexes, and validation triggers.
- Adds all LMS V2 additive tables listed above.
- Backfills organization owners into `organization_memberships`.
- Creates a default assignment group per course and attaches legacy assignments to it.
- Adds grade history, notification, and outbox automation.
- Enables RLS and installs helper-policy patterns for platform admins, org admins, course staff, students, observers, and service-role jobs.

## 5. RLS policy plan

Platform admins
- Can see and manage everything in `learning.*`.
- Backed by `learning.platform_admins`, not hardcoded checks.

Org admins
- Can manage organizations, terms, courses, rosters, content, gradebook policy, integrations, analytics, and reporting within their organization.
- Do not need to be explicitly enrolled in every course.

Instructors and TAs
- Can manage course content, announcements, discussions, grading workflows, quiz definitions, and student progress for their courses.
- `grader` can grade and review submissions but is not a full course-content manager by default.

Students
- Can read only courses they belong to and only published content unless they are staff.
- Can create/update their own submissions, lesson progress, quiz attempts, quiz answers, read markers, message participation, and activity events.
- Can read their own grades, comments, notifications, and progress.

Observers
- Can read only linked students' grades, submissions, and progress through `observer_student_links`.
- Cannot submit, grade, or manage content.

Policy shape
- Use helper functions in policies instead of repeating large subqueries.
- Use course-scoped manager policies for authoring tables.
- Use self-or-staff policies for learner-state tables.
- Keep integration, outbox, and background job tables restricted to org admins/platform admins/service role.

## 6. API and service design

Recommended backend module split
- `src/learning/dal`: thin table/RPC accessors only.
- `src/learning/model`: row-to-domain mappers only.
- `src/learning/controller`: business rules, orchestration, permission enforcement, idempotency.
- `src/learning/hooks`: UI timing only after backend flows exist.
- `src/learning/adapters`: public surface for other features.

Recommended `src/learning` blueprint

```text
src/learning/
  adapters/
    actor.adapter.js
    realm.adapter.js
    learning.adapter.js

  dal/
    realms/
      getLearningRealmById.dal.js
      getLearningRealmBySlug.dal.js
    organizations/
      getOrganizationById.dal.js
      listOrganizationsByRealmId.dal.js
    courses/
      getCourseById.dal.js
      getCourseBySlug.dal.js
      listCoursesByRealmId.dal.js
      listCoursesByOrganizationId.dal.js
    modules/
      listModulesByCourseId.dal.js
    lessons/
      getLessonById.dal.js
      listLessonsByCourseId.dal.js
      listLessonsByModuleId.dal.js
    lessonProgress/
      getLessonProgressByLessonAndActor.dal.js
      listLessonProgressByCourseAndActor.dal.js
      upsertLessonProgress.dal.js
    assignments/
      getAssignmentById.dal.js
      listAssignmentsByCourseId.dal.js
    rubrics/
      listAssignmentRubricsByAssignmentId.dal.js
    memberships/
      getCourseMembershipByActor.dal.js
      listCourseMembershipsByCourseId.dal.js
    submissions/
      getSubmissionById.dal.js
      getSubmissionAttempt.dal.js
      listSubmissionsByAssignmentId.dal.js
      upsertSubmissionDraft.dal.js
      submitAssignmentAttempt.dal.js
    submissionFiles/
      listSubmissionFilesBySubmissionId.dal.js
    grades/
      getGradeBySubmissionId.dal.js
      listGradesByAssignmentId.dal.js

  model/
    realm.model.js
    organization.model.js
    course.model.js
    module.model.js
    lesson.model.js
    lessonProgress.model.js
    assignment.model.js
    assignmentRubric.model.js
    membership.model.js
    submission.model.js
    submissionFile.model.js
    grade.model.js

  controller/
    getCourseHome.controller.js
    getCourseContent.controller.js
    getLessonView.controller.js
    markLessonComplete.controller.js
    listCourseAssignments.controller.js
    getAssignmentSubmission.controller.js
    saveSubmissionDraft.controller.js
    submitAssignment.controller.js

  hooks/
    useCourseHome.js
    useCourseContent.js
    useLessonView.js
    useLessonProgress.js
    useCourseAssignments.js
    useAssignmentSubmission.js

  components/
    course/
      CourseHeader.jsx
      CourseHero.jsx
      CourseSidebar.jsx
    modules/
      ModuleList.jsx
      ModuleCard.jsx
    lessons/
      LessonRow.jsx
      LessonContent.jsx
      ProgressPill.jsx
    assignments/
      AssignmentList.jsx
      AssignmentRow.jsx
      AssignmentSubmissionPanel.jsx
      SubmissionFilesList.jsx
      RubricList.jsx
    grades/
      GradeSummaryCard.jsx
    shared/
      LearningEmptyState.jsx
      LearningErrorState.jsx
      LearningLoadingState.jsx

  screens/
    LearningCourseViewScreen.view.jsx
    LearningCourseScreen.jsx
    LearningLessonScreen.jsx
    LearningAssignmentScreen.jsx

    ## 9. File-by-file responsibilities

This section defines what each file in `src/learning` is supposed to do.

Rules for every layer
- DAL reads/writes database rows only.
- Models map raw database rows into domain-safe objects only.
- Controllers own orchestration, permission checks, and use-case logic.
- Hooks own async UI state only.
- Components are presentational only.
- Screens are route/container entry points only.
- Adapters are the only public surface for other features.
- No file should bypass its layer.
- No UI component should talk directly to Supabase.
- No DAL file should contain business rules.
- No model file should query data.
- No hook should contain permission logic.
- No screen should compute domain rules that belong in controllers.

### 9.1 Layer contracts

#### DAL contract
Purpose
- Read and write raw rows from `learning.*` and the minimum required shared identity rows from `vc.*`.

Must do
- Use explicit select projections.
- Return raw rows exactly as they come from the database.
- Stay focused on one table or one narrow join purpose.
- Throw database errors upward without reshaping business meaning.

Must not do
- Permission checks.
- Role checks.
- Cross-screen payload shaping.
- snake_case to camelCase mapping.
- UI formatting.

#### Model contract
Purpose
- Convert raw database rows into normalized domain objects.

Must do
- Map snake_case to camelCase.
- Fill safe defaults for null-ish fields where needed.
- Normalize arrays and nested values.

Must not do
- Query the database.
- Call Supabase.
- Check permissions.
- Decide what the current actor can do.

#### Controller contract
Purpose
- Implement one business use case.

Must do
- Validate actor context and realm scope.
- Call DAL files.
- Call model mappers.
- Enforce access and business rules.
- Return a normalized payload for hooks/screens.

Must not do
- Return JSX.
- Own loading state.
- Use raw route objects directly.
- Put reusable mapping logic inline if a model file exists.

#### Hook contract
Purpose
- Bridge controller calls into React state.

Must do
- Call one primary controller flow.
- Manage loading, error, refetch, optimistic updates if needed.
- Expose stable return shape to screens/components.

Must not do
- Query database directly.
- Re-implement controller logic.
- Build large domain payloads.

#### Component contract
Purpose
- Render UI from props.

Must do
- Accept explicit props.
- Render predictable visual state.
- Emit UI events upward.

Must not do
- Query database directly.
- Know about Supabase.
- Check actor permissions internally beyond tiny visual toggles from props.
- Reach across feature modules.

#### Screen contract
Purpose
- Be the route-level entry point.

Must do
- Read route params.
- Resolve actor/realm context through adapters/hooks.
- Call feature hooks.
- Compose view components.

Must not do
- Query DAL directly.
- Rebuild business payloads.
- Hide important domain rules in screen code.

#### Adapter contract
Purpose
- Expose the public learning API to the rest of the app.

Must do
- Re-export approved hooks/controllers/helpers.
- Resolve shared actor/realm context when needed.
- Keep the external contract stable.

Must not do
- Become a second controller layer.
- Contain feature business logic that belongs in controllers.

---

### 9.2 Folder responsibilities

#### `src/learning/adapters`
Public boundary for the learning module.

Files here are responsible for:
- resolving current actor context
- resolving active learning realm context
- exporting the approved public API of the learning module

#### `src/learning/dal`
Database access only.

Folders map closely to schema domains:
- `realms`
- `organizations`
- `courses`
- `modules`
- `lessons`
- `lessonProgress`
- `assignments`
- `rubrics`
- `memberships`
- `submissions`
- `submissionFiles`
- `grades`

#### `src/learning/model`
Domain mappers only.

Each model file maps one table/domain concept into app-safe objects.

#### `src/learning/controller`
Use-case orchestration only.

Each file represents one business flow used by screens/hooks.

#### `src/learning/hooks`
React-facing use-case wrappers.

#### `src/learning/components`
Presentational UI grouped by subdomain.

#### `src/learning/screens`
Route/container entry points and top-level views.

---

### 9.3 Adapters

#### `adapters/actor.adapter.js`
Purpose
- Resolve the authenticated actor for learning.

Input
- `supabase`

Returns
```js
{
  actorId
}

blueprint should now be split by audience/application area, not only by technical layer.

Right now it is organized mostly by data domain and generic screens. For a real LMS with:

main organization / administration
teachers
parents or observers
students

you should make the blueprint reflect those entry surfaces while still preserving the same layer rules. The current doc already has org roles, observer links, and actor-based memberships, so this change fits your architecture.

What should change

Keep these shared foundations:

adapters
dal
model
controller
hooks
components/shared

But split the product-facing app layer into role surfaces:

administration
teachers
parents
students

That gives you a blueprint that matches how the product is actually used.

Recommended updated blueprint

Replace the current src/learning blueprint section with this:

src/learning/
  LMS_V2_ARCHITECTURE.md

  adapters/
    actor.adapter.js
    realm.adapter.js
    learning.adapter.js

  dal/
    realms/
      getLearningRealmById.dal.js
      getLearningRealmBySlug.dal.js
    organizations/
      getOrganizationById.dal.js
      listOrganizationsByRealmId.dal.js
    courses/
      getCourseById.dal.js
      getCourseBySlug.dal.js
      listCoursesByActorId.dal.js
      listCoursesByRealmId.dal.js
      listCoursesByOrganizationId.dal.js
    modules/
      listModulesByCourseId.dal.js
    lessons/
      getLessonById.dal.js
      listLessonsByCourseId.dal.js
      listLessonsByModuleId.dal.js
    lessonProgress/
      getLessonProgressByLessonAndActor.dal.js
      listLessonProgressByCourseAndActor.dal.js
      upsertLessonProgress.dal.js
    assignments/
      getAssignmentById.dal.js
      listAssignmentsByCourseId.dal.js
    rubrics/
      listAssignmentRubricsByAssignmentId.dal.js
    memberships/
      getCourseMembershipByActor.dal.js
      listCourseMembershipsByCourseId.dal.js
    submissions/
      getSubmissionById.dal.js
      getSubmissionAttempt.dal.js
      listSubmissionsByAssignmentId.dal.js
      upsertSubmissionDraft.dal.js
      submitAssignmentAttempt.dal.js
    submissionFiles/
      listSubmissionFilesBySubmissionId.dal.js
    grades/
      getGradeBySubmissionId.dal.js
      listGradesByAssignmentId.dal.js

  model/
    realm.model.js
    organization.model.js
    course.model.js
    module.model.js
    lesson.model.js
    lessonProgress.model.js
    assignment.model.js
    assignmentRubric.model.js
    membership.model.js
    submission.model.js
    submissionFile.model.js
    grade.model.js

  controller/
    shared/
      getLearningHome.controller.js
      getCourseHome.controller.js
      getCourseContent.controller.js
      getLessonView.controller.js
      listCourseAssignments.controller.js
      getAssignmentSubmission.controller.js
      markLessonComplete.controller.js
      saveSubmissionDraft.controller.js
      submitAssignment.controller.js

    administration/
      getAdminDashboard.controller.js
      listOrganizationCourses.controller.js
      listOrganizationMembers.controller.js
      getCourseRoster.controller.js
      assignTeacherToCourse.controller.js
      assignStudentToCourse.controller.js
      linkParentToStudent.controller.js

    teachers/
      getTeacherDashboard.controller.js
      getTeacherCourseHome.controller.js
      listTeacherCourses.controller.js
      listTeacherAssignments.controller.js
      listCourseSubmissions.controller.js
      gradeSubmission.controller.js

    parents/
      getParentDashboard.controller.js
      listObservedStudents.controller.js
      getObservedStudentProgress.controller.js
      getObservedStudentAssignments.controller.js

    students/
      getStudentDashboard.controller.js
      listStudentCourses.controller.js
      getStudentCourseHome.controller.js
      getStudentProgressSummary.controller.js

  hooks/
    shared/
      useLearningHome.js
      useCourseHome.js
      useCourseContent.js
      useLessonView.js
      useLessonProgress.js
      useCourseAssignments.js
      useAssignmentSubmission.js

    administration/
      useAdminDashboard.js
      useOrganizationCourses.js
      useOrganizationMembers.js
      useCourseRoster.js

    teachers/
      useTeacherDashboard.js
      useTeacherCourses.js
      useTeacherCourseHome.js
      useTeacherAssignments.js
      useCourseSubmissions.js
      useGradeSubmission.js

    parents/
      useParentDashboard.js
      useObservedStudents.js
      useObservedStudentProgress.js

    students/
      useStudentDashboard.js
      useStudentCourses.js
      useStudentProgressSummary.js

  components/
    shared/
      LearningEmptyState.jsx
      LearningErrorState.jsx
      LearningLoadingState.jsx

    common/
      course/
        CourseHeader.jsx
        CourseHero.jsx
        CourseSidebar.jsx
      modules/
        ModuleList.jsx
        ModuleCard.jsx
      lessons/
        LessonRow.jsx
        LessonContent.jsx
        ProgressPill.jsx
      assignments/
        AssignmentList.jsx
        AssignmentRow.jsx
        AssignmentSubmissionPanel.jsx
        SubmissionFilesList.jsx
        RubricList.jsx
      grades/
        GradeSummaryCard.jsx

    administration/
      OrganizationOverviewCard.jsx
      CourseRosterTable.jsx
      OrganizationMembersTable.jsx
      ParentStudentLinkPanel.jsx

    teachers/
      TeacherCourseCard.jsx
      SubmissionQueueList.jsx
      SubmissionReviewPanel.jsx
      GradeEntryCard.jsx

    parents/
      ObservedStudentCard.jsx
      StudentProgressCard.jsx
      StudentAssignmentsCard.jsx

    students/
      StudentCourseCard.jsx
      StudentProgressCard.jsx
      ContinueLearningCard.jsx

  screens/
    shared/
      LearningHomeScreen.jsx
      LearningCourseViewScreen.view.jsx
      LearningCourseScreen.jsx
      LearningLessonScreen.jsx
      LearningAssignmentScreen.jsx

    administration/
      LearningAdminDashboardScreen.jsx
      LearningOrganizationScreen.jsx
      LearningCourseRosterScreen.jsx

    teachers/
      LearningTeacherDashboardScreen.jsx
      LearningTeacherCourseScreen.jsx
      LearningSubmissionReviewScreen.jsx

    parents/
      LearningParentDashboardScreen.jsx
      LearningObservedStudentScreen.jsx

    students/
      LearningStudentDashboardScreen.jsx
      LearningStudentCourseScreen.jsx

  layout/
    LearningLayout.jsx

  routes/
    learning.routes.jsx

  styles/
    learning.css
Why this is the right split
administration

This is for:

institution admins
organization owners
org staff

Responsibilities:

course setup
teacher assignment
student enrollment
parent linking
org-level visibility
teachers

This is for:

instructors
graders
TAs

Responsibilities:

manage course content
review submissions
grade work
monitor student progress
parents

This is for:

observers linked to students
only for students under 18, or when observer access is explicitly enabled

Responsibilities:

see linked student progress
see assignments and grades
cannot submit or edit
students

This is for:

learners
course participation
progress
submissions

Responsibilities:

take courses
complete lessons
submit assignments
view grades
Important architecture rule

Do not move DAL and models into role folders.

Keep these shared:

dal
model

Because the database schema is shared and role-neutral.

Role splitting should happen mainly in:

controller
hooks
components
screens

That keeps the architecture clean.

Recommended doc update text

Add this section to your blueprint:

### Audience-oriented module split

The learning module is divided into four product-facing surfaces:

- `administration`: institution and organization management flows
- `teachers`: instructor, TA, and grader workflows
- `parents`: observer workflows linked to students
- `students`: learner workflows

Shared infrastructure remains centralized in:
- `adapters`
- `dal`
- `model`
- `controller/shared`
- `hooks/shared`
- `components/shared`
- `components/common`

Rule:
- database-facing code stays domain-based
- UI-facing code is organized by audience surface
Parent rule you should document

Because you mentioned:

parents for students unless they are +18

Add this to the blueprint:

Observer/parent access rule
- Parent/observer dashboards are only available when the observer is explicitly linked to the student through `learning.observer_student_links`.
- Observer access should only be enabled for minors by policy, unless an adult student explicitly grants observer access.
- Parent/observer actors can read linked student progress, assignments, grades, and attendance-related learning signals if enabled.
- Parent/observer actors cannot submit work, edit content, grade, or manage course settings.

That matches the observer gap already called out in the current architecture doc.