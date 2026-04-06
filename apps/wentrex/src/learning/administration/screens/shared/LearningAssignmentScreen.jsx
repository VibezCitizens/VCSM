import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAssignmentSubmission } from "@/learning/administration/hooks/shared/useAssignmentSubmission";

import RubricList from "@/learning/administration/components/common/assignments/RubricList";
import SubmissionFilesList from "@/learning/administration/components/common/assignments/SubmissionFilesList";
import AssignmentSubmissionPanel from "@/learning/administration/components/common/assignments/AssignmentSubmissionPanel";
import GradeSummaryCard from "@/learning/administration/components/common/grades/GradeSummaryCard";
import LearningLoadingState from "@/learning/administration/components/shared/LearningLoadingState";
import LearningErrorState from "@/learning/administration/components/shared/LearningErrorState";
import LearningEmptyState from "@/learning/administration/components/shared/LearningEmptyState";

export default function LearningAssignmentScreen({
  supabase,
  actorId,
  assignmentId: assignmentIdProp,
  courseId: courseIdProp,
}) {
  const navigate = useNavigate();
  const params = useParams();

  const assignmentId = assignmentIdProp ?? params.assignmentId ?? null;
  const courseId = courseIdProp ?? params.courseId ?? null;

  const {
    data,
    error,
    isLoading,
    isSaving,
    reload,
    saveDraft,
    submitAssignment,
  } = useAssignmentSubmission({
    supabase,
    actorId,
    assignmentId,
    courseId,
    enabled: Boolean(supabase && actorId && assignmentId),
  });

  const capabilities = useMemo(() => {
    return {
      canSubmitAssignments: true,
    };
  }, []);

  if (!supabase || !actorId || !assignmentId) {
    return (
      <LearningErrorState
        error={{
          message:
            "LearningAssignmentScreen requires supabase, actorId, and assignmentId.",
        }}
      />
    );
  }

  if (isLoading) {
    return <LearningLoadingState label="Loading assignment..." variant="detail" />;
  }

  if (error) {
    return <LearningErrorState error={error} onRetry={reload} />;
  }

  if (!data?.assignment) {
    return (
      <LearningEmptyState
        title="Assignment not found"
        message="There is no assignment data available."
      />
    );
  }

  const assignment = data.assignment;
  const submission = data.submission ?? null;
  const files = data.files ?? [];
  const grade = data.grade ?? null;
  const rubric = data.rubric ?? [];

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
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              marginBottom: 12,
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

          <h1
            style={{
              margin: "0 0 8px",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {assignment.title}
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: 14,
            }}
          >
            {assignment.pointsPossible} points
          </p>
        </div>
      </div>

      {assignment.instructions ? (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            background: "#ffffff",
            padding: 16,
          }}
        >
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Instructions
          </h2>

          <div
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
              fontSize: 14,
              color: "#111827",
            }}
          >
            {assignment.instructions}
          </div>
        </div>
      ) : null}

      <AssignmentSubmissionPanel
        assignment={assignment}
        submission={submission}
        capabilities={capabilities}
        onSaveDraft={saveDraft}
        onSubmit={submitAssignment}
      />

      {isSaving ? <LearningLoadingState label="Saving..." variant="inline" /> : null}

      <SubmissionFilesList files={files} />
      <RubricList rubric={rubric} />
      <GradeSummaryCard
        grade={grade}
        pointsPossible={assignment.pointsPossible}
      />
    </div>
  );
}
