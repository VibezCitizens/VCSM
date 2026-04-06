import {
  getActorIdFromUser,
  getLearningActorAdapter,
  resolveLearningActor,
} from "@/learning/adapters/actor.adapter";
import {
  getLearningRealmAdapter,
  resolveLearningRealm,
} from "@/learning/adapters/realm.adapter";

export { resolveLearningActor, getLearningActorAdapter, getActorIdFromUser };
export { resolveLearningRealm, getLearningRealmAdapter };

export { useLearningHome } from "@/learning/hooks/shared/useLearningHome";
export { useCourseHome } from "@/learning/hooks/shared/useCourseHome";
export { useCourseContent } from "@/learning/hooks/shared/useCourseContent";
export { useLessonView } from "@/learning/hooks/shared/useLessonView";
export { useLessonProgress } from "@/learning/hooks/shared/useLessonProgress";
export { useCourseAssignments } from "@/learning/hooks/shared/useCourseAssignments";
export { useAssignmentSubmission } from "@/learning/hooks/shared/useAssignmentSubmission";

export { useStudentCourses } from "@/learning/hooks/students/useStudentCourses";
export { useStudentDashboard } from "@/learning/hooks/students/useStudentDashboard";
export { useStudentProgressSummary } from "@/learning/hooks/students/useStudentProgressSummary";

export { useTeacherCourses } from "@/learning/hooks/teachers/useTeacherCourses";
export { useTeacherDashboard } from "@/learning/hooks/teachers/useTeacherDashboard";
export { useTeacherCourseHome } from "@/learning/hooks/teachers/useTeacherCourseHome";
export { useTeacherAssignments } from "@/learning/hooks/teachers/useTeacherAssignments";
export { useCourseSubmissions } from "@/learning/hooks/teachers/useCourseSubmissions";
export { useGradeSubmission } from "@/learning/hooks/teachers/useGradeSubmission";

export { useObservedStudents } from "@/learning/hooks/parents/useObservedStudents";
export { useObservedStudentProgress } from "@/learning/hooks/parents/useObservedStudentProgress";
export { useParentDashboard } from "@/learning/hooks/parents/useParentDashboard";

export { useAdminDashboard } from "@/learning/hooks/administration/useAdminDashboard";
export { useCourseRoster } from "@/learning/hooks/administration/useCourseRoster";
export { useOrganizationCourses } from "@/learning/hooks/administration/useOrganizationCourses";
export { useOrganizationMembers } from "@/learning/hooks/administration/useOrganizationMembers";

export { default as LearningLayout } from "@/learning/layout/LearningLayout";

export { default as LearningHomeScreen } from "@/learning/screens/shared/LearningHomeScreen";
export { default as LearningCourseScreen } from "@/learning/screens/shared/LearningCourseScreen";
export { default as LearningAssignmentScreen } from "@/learning/screens/shared/LearningAssignmentScreen";
export { default as LearningLessonScreen } from "@/learning/screens/shared/LearningLessonScreen";
export { default as LearningCourseViewScreen } from "@/learning/screens/shared/LearningCourseViewScreen.view";

export { default as LearningStudentDashboardScreen } from "@/learning/screens/students/LearningStudentDashboardScreen";
export { default as LearningStudentCourseScreen } from "@/learning/screens/students/LearningStudentCourseScreen";

export { default as LearningTeacherDashboardScreen } from "@/learning/screens/teachers/LearningTeacherDashboardScreen";
export { default as LearningTeacherCourseScreen } from "@/learning/screens/teachers/LearningTeacherCourseScreen";
export { default as LearningSubmissionReviewScreen } from "@/learning/screens/teachers/LearningSubmissionReviewScreen";

export { default as LearningParentDashboardScreen } from "@/learning/screens/parents/LearningParentDashboardScreen";
export { default as LearningObservedStudentScreen } from "@/learning/screens/parents/LearningObservedStudentScreen";

export { default as LearningAdminDashboardScreen } from "@/learning/screens/administration/LearningAdminDashboardScreen";
export { default as LearningCourseRosterScreen } from "@/learning/screens/administration/LearningCourseRosterScreen";
export { default as LearningOrganizationScreen } from "@/learning/screens/administration/LearningOrganizationScreen";

export { default as ContinueLearningCard } from "@/learning/components/students/ContinueLearningCard";
export { default as StudentCourseCard } from "@/learning/components/students/StudentCourseCard";
export { default as StudentProgressCard } from "@/learning/components/students/StudentProgressCard";

export { default as TeacherCourseCard } from "@/learning/components/teachers/TeacherCourseCard";
export { default as GradeEntryCard } from "@/learning/components/teachers/GradeEntryCard";
export { default as SubmissionQueueList } from "@/learning/components/teachers/SubmissionQueueList";
export { default as SubmissionReviewPanel } from "@/learning/components/teachers/SubmissionReviewPanel";

export { default as ObservedStudentCard } from "@/learning/components/parents/ObservedStudentCard";
export { default as StudentAssignmentsCard } from "@/learning/components/parents/StudentAssignmentsCard";
export { default as ParentStudentProgressCard } from "@/learning/components/parents/StudentProgressCard";

export { default as OrganizationOverviewCard } from "@/learning/components/administration/OrganizationOverviewCard";
export { default as OrganizationMembersTable } from "@/learning/components/administration/OrganizationMembersTable";
export { default as CourseRosterTable } from "@/learning/components/administration/CourseRosterTable";
export { default as ParentStudentLinkPanel } from "@/learning/components/administration/ParentStudentLinkPanel";

const learningAdapter = {
  resolveLearningActor,
  resolveLearningRealm,
};

export default learningAdapter;
