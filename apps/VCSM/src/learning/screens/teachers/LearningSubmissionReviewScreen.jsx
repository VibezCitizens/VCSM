import React, { useMemo, useState } from "react";
import { useCourseSubmissions } from "@/learning/hooks/teachers/useCourseSubmissions";
import { useGradeSubmission } from "@/learning/hooks/teachers/useGradeSubmission";
import { SubmissionQueueList } from "@/learning/components/teachers/SubmissionQueueList";
import { SubmissionReviewPanel } from "@/learning/components/teachers/SubmissionReviewPanel";
import { GradeEntryCard } from "@/learning/components/teachers/GradeEntryCard";

function extractSubmissionId(item) {
  return item?.submission?.id ?? item?.id ?? null;
}

function extractGrade(item) {
  return item?.grade ?? null;
}

function extractAssignment(item) {
  return item?.assignment ?? {};
}

function LoadingState() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Submission Review</h2>
      <div>Loading submissions...</div>
    </div>
  );
}

function ErrorState({ error, onRetry, onBack }) {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #222",
              background: "#fff",
              color: "#222",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        )}
      </div>

      <h2 style={{ marginTop: 0 }}>Submission Review</h2>

      <div style={{ color: "#b42318", marginBottom: 12 }}>
        {error?.message ?? error?.code ?? "Failed to load submissions"}
      </div>

      <button
        type="button"
        onClick={onRetry}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #222",
          background: "#222",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Retry
      </button>
    </div>
  );
}

export function LearningSubmissionReviewScreen({
  supabase,
  actorId,
  realmId,
  courseId,
  assignmentId = null,
  status = null,
  onBack,
}) {
  const submissionsState = useCourseSubmissions({
    supabase,
    actorId,
    realmId,
    courseId,
    assignmentId,
    status,
    enabled: Boolean(supabase && actorId && realmId && courseId),
  });

  const gradeState = useGradeSubmission({
    supabase,
    actorId,
    realmId,
    courseId,
  });

  const items = useMemo(
    () =>
      submissionsState.data?.submissions ??
      submissionsState.data?.items ??
      [],
    [submissionsState.data],
  );

  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);

  const selectedItem = useMemo(() => {
    if (!items.length) return null;

    if (!selectedSubmissionId) {
      return items[0] ?? null;
    }

    return (
      items.find((item) => extractSubmissionId(item) === selectedSubmissionId) ??
      items[0] ??
      null
    );
  }, [items, selectedSubmissionId]);

  if (submissionsState.isLoading) {
    return <LoadingState />;
  }

  if (submissionsState.error && !submissionsState.data) {
    return (
      <ErrorState
        error={submissionsState.error}
        onRetry={submissionsState.reload}
        onBack={onBack}
      />
    );
  }

  const selectedGrade = extractGrade(selectedItem);
  const selectedAssignment = extractAssignment(selectedItem);
  const maxScore =
    selectedAssignment?.pointsPossible ??
    selectedAssignment?.points_possible ??
    null;

  const handleGradeSubmit = async (payload) => {
    const result = await gradeState.gradeSubmission(payload);

    if (result?.ok) {
      await submissionsState.reload();
    }

    return result;
  };

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>Submission Review</h2>
          <div style={{ color: "#666" }}>
            Review and grade course submissions
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #222",
                background: "#fff",
                color: "#222",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          )}

          <button
            type="button"
            onClick={submissionsState.reload}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #222",
              background: "#222",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {(submissionsState.error || gradeState.error) && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            background: "#fef3f2",
            color: "#b42318",
            border: "1px solid #fecdca",
          }}
        >
          {gradeState.error?.message ??
            gradeState.error?.code ??
            submissionsState.error?.message ??
            submissionsState.error?.code}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 360px) minmax(320px, 1fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <SubmissionQueueList
          items={items}
          selectedSubmissionId={extractSubmissionId(selectedItem)}
          onSelect={(item) => setSelectedSubmissionId(extractSubmissionId(item))}
        />

        <div style={{ display: "grid", gap: 16 }}>
          <SubmissionReviewPanel item={selectedItem} />

          <GradeEntryCard
            submission={selectedItem}
            onSubmit={handleGradeSubmit}
            isSaving={gradeState.isSaving}
            maxScore={maxScore}
            initialScore={selectedGrade?.score ?? ""}
            initialFeedbackText={
              selectedGrade?.feedbackText ??
              selectedGrade?.feedback_text ??
              ""
            }
            initialFeedbackPrivate={
              selectedGrade?.feedbackPrivate ??
              selectedGrade?.feedback_private ??
              ""
            }
            initialStatus={selectedGrade?.status ?? "graded"}
          />
        </div>
      </div>
    </div>
  );
}

export default LearningSubmissionReviewScreen;