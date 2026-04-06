import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useLessonView } from "@/learning/hooks/shared/useLessonView";
import { useLessonProgress } from "@/learning/hooks/shared/useLessonProgress";

import LessonContent from "@/learning/components/common/lessons/LessonContent";
import ProgressPill from "@/learning/components/common/lessons/ProgressPill";
import LearningLoadingState from "@/learning/components/shared/LearningLoadingState";
import LearningErrorState from "@/learning/components/shared/LearningErrorState";
import LearningEmptyState from "@/learning/components/shared/LearningEmptyState";

export default function LearningLessonScreen({
  supabase,
  actorId,
  realmId: realmIdProp,
  lessonId: lessonIdProp,
}) {
  const navigate = useNavigate();
  const params = useParams();

  const realmId = realmIdProp ?? params.realmId ?? null;
  const lessonId = lessonIdProp ?? params.lessonId ?? null;

  const {
    data,
    error,
    isLoading,
    reload,
  } = useLessonView({
    supabase,
    actorId,
    realmId,
    lessonId,
    enabled: Boolean(supabase && actorId && realmId && lessonId),
  });

  const {
    markComplete,
    isSaving,
    error: progressError,
  } = useLessonProgress({
    supabase,
    actorId,
    lessonId,
  });

  const capabilities = useMemo(() => {
    const membership = data?.membership;
    const role = membership?.role ?? null;

    return {
      canMarkComplete: ["student"].includes(role),
      canManageCourse: ["admin", "instructor", "ta"].includes(role),
    };
  }, [data?.membership]);

  if (!supabase || !actorId || !realmId || !lessonId) {
    return (
      <LearningErrorState
        error={{
          message:
            "LearningLessonScreen requires supabase, actorId, realmId, and lessonId.",
        }}
      />
    );
  }

  if (isLoading) {
    return <LearningLoadingState label="Loading lesson..." />;
  }

  if (error) {
    return <LearningErrorState error={error} onRetry={reload} />;
  }

  if (!data?.lesson) {
    return (
      <LearningEmptyState
        title="Lesson not found"
        message="There is no lesson data available."
      />
    );
  }

  return (
    <div
      style={{
        background: "#ffffff",
        color: "#000000",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            background: "#ffffff",
            color: "#000000",
            padding: "10px 14px",
            cursor: "pointer",
          }}
        >
          Back
        </button>

        <ProgressPill state={data.progress?.state} />
      </div>

      <LessonContent lesson={data.lesson} />

      {progressError ? (
        <LearningErrorState error={progressError} />
      ) : null}

      {capabilities.canMarkComplete ? (
        <div>
          <button
            type="button"
            onClick={async () => {
              await markComplete();
              await reload();
            }}
            disabled={isSaving}
            style={{
              border: "1px solid var(--org-color, #000000)",
              borderRadius: 10,
              background: "var(--org-color, #000000)",
              color: "#ffffff",
              padding: "10px 14px",
              cursor: isSaving ? "not-allowed" : "pointer",
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? "Saving..." : "Mark complete"}
          </button>
        </div>
      ) : null}
    </div>
  );
}