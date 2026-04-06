import React from "react";
import { useStudentProgressSummary } from "@/learning/student/hooks/useStudentProgressSummary";
import { StudentProgressCard } from "@/learning/student/components/StudentProgressCard";
import LearningLoadingState from "@/learning/components/shared/LearningLoadingState";

function InfoRow({ label, value }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <strong>{label}:</strong> {value}
    </div>
  );
}

function LoadingState() {
  return <LearningLoadingState label="Loading course progress..." variant="detail" />;
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

      <h2 style={{ marginTop: 0 }}>Student Course</h2>

      <div style={{ color: "#b42318", marginBottom: 12 }}>
        {error?.message ?? error?.code ?? "Failed to load student course"}
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

export function LearningStudentCourseScreen({
  supabase,
  actorId,
  realmId,
  courseId,
  onBack,
}) {
  const { data, error, isLoading, reload } = useStudentProgressSummary({
    supabase,
    actorId,
    realmId,
    courseId,
    enabled: Boolean(supabase && actorId && realmId && courseId),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error && !data) {
    return <ErrorState error={error} onRetry={reload} onBack={onBack} />;
  }

  const course = data?.course ?? null;
  const membership = data?.membership ?? null;
  const totals = data?.totals ?? {};

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
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>
            {course?.title ?? "Student Course"}
          </h2>
          <div style={{ color: "#666" }}>
            Course progress and assignment summary
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
            onClick={reload}
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

      {error && (
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
          {error?.message ?? error?.code}
        </div>
      )}

      <div
        style={{
          border: "1px solid #d0d7de",
          borderRadius: 10,
          padding: 16,
          background: "#fff",
          marginBottom: 16,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Course Overview</h3>

        <InfoRow label="Course ID" value={course?.id ?? courseId ?? "-"} />
        <InfoRow label="Status" value={membership?.status ?? "-"} />
        <InfoRow label="Role" value={membership?.role ?? "student"} />
        <InfoRow label="Progress" value={`${totals.progressPercent ?? 0}%`} />
        <InfoRow
          label="Average Grade"
          value={totals.averageGradePercent ?? "-"}
        />
      </div>

      <StudentProgressCard data={data} />
    </div>
  );
}

export default LearningStudentCourseScreen;
