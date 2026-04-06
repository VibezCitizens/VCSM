import {
  getActorIdFromUser,
  getLearningActorAdapter,
  resolveLearningActor,
} from "@/learning/administration/adapters/actor.adapter";
import {
  getLearningRealmAdapter,
  resolveLearningRealm,
} from "@/learning/administration/adapters/realm.adapter";

export { resolveLearningActor, getLearningActorAdapter, getActorIdFromUser };
export { resolveLearningRealm, getLearningRealmAdapter };

export { useLearningHome } from "@/learning/administration/hooks/shared/useLearningHome";
export { useCourseHome } from "@/learning/administration/hooks/shared/useCourseHome";
export { useCourseContent } from "@/learning/administration/hooks/shared/useCourseContent";
export { useLessonView } from "@/learning/administration/hooks/shared/useLessonView";
export { useLessonProgress } from "@/learning/administration/hooks/shared/useLessonProgress";
export { useCourseAssignments } from "@/learning/administration/hooks/shared/useCourseAssignments";
export { useAssignmentSubmission } from "@/learning/administration/hooks/shared/useAssignmentSubmission";

export { useStudentCourses } from "@/learning/student/hooks/useStudentCourses";
export { useStudentDashboard } from "@/learning/student/hooks/useStudentDashboard";
export { useStudentProgressSummary } from "@/learning/student/hooks/useStudentProgressSummary";

export { useTeacherCourses } from "@/learning/staff/teacher/hooks/useTeacherCourses";
export { useTeacherDashboard } from "@/learning/staff/teacher/hooks/useTeacherDashboard";
export { useTeacherCourseHome } from "@/learning/staff/teacher/hooks/useTeacherCourseHome";
export { useTeacherAssignments } from "@/learning/staff/teacher/hooks/useTeacherAssignments";
export { useCourseSubmissions } from "@/learning/staff/teacher/hooks/useCourseSubmissions";
export { useGradeSubmission } from "@/learning/staff/teacher/hooks/useGradeSubmission";

export { useObservedStudents } from "@/learning/parent/hooks/useObservedStudents";
export { useObservedStudentProgress } from "@/learning/parent/hooks/useObservedStudentProgress";
export { useParentDashboard } from "@/learning/parent/hooks/useParentDashboard";

export { useAdminDashboard } from "@/learning/administration/hooks/admin/useAdminDashboard";
export { useCourseRoster } from "@/learning/administration/hooks/admin/useCourseRoster";
export { useOrganizationCourses } from "@/learning/administration/hooks/admin/useOrganizationCourses";
export { useOrganizationMembers } from "@/learning/administration/hooks/admin/useOrganizationMembers";

export { default as LearningLayout } from "@/learning/administration/layout/LearningLayout";

export { default as LearningHomeScreen } from "@/learning/administration/screens/shared/LearningHomeScreen";
export { default as LearningCourseScreen } from "@/learning/administration/screens/shared/LearningCourseScreen";
export { default as LearningAssignmentScreen } from "@/learning/administration/screens/shared/LearningAssignmentScreen";
export { default as LearningLessonScreen } from "@/learning/administration/screens/shared/LearningLessonScreen";
export { default as LearningCourseViewScreen } from "@/learning/administration/screens/shared/LearningCourseViewScreen.view";

export { default as LearningStudentDashboardScreen } from "@/learning/student/screens/LearningStudentDashboardScreen";
export { default as LearningStudentCourseScreen } from "@/learning/student/screens/LearningStudentCourseScreen";

export { default as LearningTeacherDashboardScreen } from "@/learning/staff/teacher/screens/LearningTeacherDashboardScreen";
export { default as LearningTeacherCourseScreen } from "@/learning/staff/teacher/screens/LearningTeacherCourseScreen";
export { default as LearningSubmissionReviewScreen } from "@/learning/staff/teacher/screens/LearningSubmissionReviewScreen";

export { default as LearningParentDashboardScreen } from "@/learning/parent/screens/LearningParentDashboardScreen";
export { default as LearningObservedStudentScreen } from "@/learning/parent/screens/LearningObservedStudentScreen";

export { default as LearningAdminDashboardScreen } from "@/learning/administration/screens/admin/LearningAdminDashboardScreen";
export { default as LearningCourseRosterScreen } from "@/learning/administration/screens/admin/LearningCourseRosterScreen";
export { default as LearningOrganizationScreen } from "@/learning/administration/screens/admin/LearningOrganizationScreen";

export { default as ContinueLearningCard } from "@/learning/student/components/ContinueLearningCard";
export { default as StudentCourseCard } from "@/learning/student/components/StudentCourseCard";
export { default as StudentProgressCard } from "@/learning/student/components/StudentProgressCard";

export { default as TeacherCourseCard } from "@/learning/staff/teacher/components/TeacherCourseCard";
export { default as GradeEntryCard } from "@/learning/staff/teacher/components/GradeEntryCard";
export { default as SubmissionQueueList } from "@/learning/staff/teacher/components/SubmissionQueueList";
export { default as SubmissionReviewPanel } from "@/learning/staff/teacher/components/SubmissionReviewPanel";

export { default as ObservedStudentCard } from "@/learning/parent/components/ObservedStudentCard";
export { default as StudentAssignmentsCard } from "@/learning/parent/components/StudentAssignmentsCard";
export { default as ParentStudentProgressCard } from "@/learning/parent/components/StudentProgressCard";

export { default as OrganizationOverviewCard } from "@/learning/administration/components/admin/OrganizationOverviewCard";
export { default as OrganizationMembersTable } from "@/learning/administration/components/admin/OrganizationMembersTable";
export { default as CourseRosterTable } from "@/learning/administration/components/admin/CourseRosterTable";
export { default as ParentStudentLinkPanel } from "@/learning/administration/components/admin/ParentStudentLinkPanel";

const learningAdapter = {
  resolveLearningActor,
  resolveLearningRealm,
};

export default learningAdapter;
