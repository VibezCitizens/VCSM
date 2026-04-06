import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useCourseContent } from "@/learning/administration/hooks/shared/useCourseContent";
import { useCourseAssignments } from "@/learning/administration/hooks/shared/useCourseAssignments";
import LearningCourseViewScreen from "@/learning/administration/screens/LearningCourseViewScreen.view";
import LearningLoadingState from "@/learning/administration/components/shared/LearningLoadingState";
import LearningErrorState from "@/learning/administration/components/shared/LearningErrorState";
import LearningEmptyState from "@/learning/administration/components/shared/LearningEmptyState";

export default function LearningCourseScreen({
  supabase,
  actorId,
  realmId: realmIdProp,
  courseId: courseIdProp,
}) {
  const navigate = useNavigate();
  const params = useParams();

  const realmId = realmIdProp ?? params.realmId ?? null;
  const courseId = courseIdProp ?? params.courseId ?? null;

  const {
    data,
    error,
    isLoading,
    reload,
  } = useCourseContent({
    supabase,
    actorId,
    realmId,
    courseId,
    enabled: Boolean(supabase && actorId && realmId && courseId),
  });

  const assignmentsState = useCourseAssignments({
    supabase,
    actorId,
    courseId,
    enabled: Boolean(supabase && actorId && courseId),
  });

  const capabilities = useMemo(() => {
    const membership = data?.membership;
    const role = membership?.role ?? null;

    return {
      canViewCourse: Boolean(membership),
      canManageCourse: ["admin", "instructor", "ta"].includes(role),
      canSubmitAssignments: ["student"].includes(role),
      canGradeAssignments: ["admin", "instructor", "ta", "grader"].includes(
        role
      ),
    };
  }, [data?.membership]);

  if (!supabase || !actorId || !realmId || !courseId) {
    return (
      <LearningErrorState
        error={{
          message:
            "LearningCourseScreen requires supabase, actorId, realmId, and courseId.",
        }}
      />
    );
  }

  if (isLoading || assignmentsState.isLoading) {
    return <LearningLoadingState label="Loading course..." variant="detail" />;
  }

  if (error || assignmentsState.error) {
    return (
      <LearningErrorState
        error={error ?? assignmentsState.error}
        onRetry={async () => {
          await Promise.all([reload(), assignmentsState.reload()]);
        }}
      />
    );
  }

  if (!data?.course) {
    return (
      <LearningEmptyState
        title="Course not found"
        message="There is no course data available."
      />
    );
  }

  return (
    <div
      style={{
        background: "#ffffff",
        color: "#000000",
        padding: 24,
      }}
    >
      <LearningCourseViewScreen
        course={data.course}
        capabilities={capabilities}
        modules={data.modules ?? []}
        lessons={data.lessons ?? []}
        progress={data.progress ?? []}
        assignments={assignmentsState.data?.assignments ?? []}
        onOpenLesson={(lesson) => {
          navigate(`/learning/courses/${courseId}/lessons/${lesson.id}`);
        }}
        onOpenAssignment={(assignment) => {
          navigate(`/learning/courses/${courseId}/assignments/${assignment.id}`);
        }}
        onOpenContent={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenAssignments={() => {
          navigate(`/learning/courses/${courseId}/assignments`);
        }}
      />
    </div>
  );
}
