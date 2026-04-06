import React from "react";
import { useObservedStudentProgress } from "@/learning/hooks/parents/useObservedStudentProgress";
import { StudentProgressCard } from "@/learning/components/parents/StudentProgressCard";
import { StudentAssignmentsCard } from "@/learning/components/parents/StudentAssignmentsCard";

function HeaderItem({ label, value }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <strong>{label}:</strong> {value}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Observed Student</h2>
      <div>Loading student details...</div>
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

      <h2 style={{ marginTop: 0 }}>Observed Student</h2>

      <div style={{ color: "#b42318", marginBottom: 12 }}>
        {error?.message ?? error?.code ?? "Failed to load observed student"}
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

export function LearningObservedStudentScreen({
  supabase,
  actorId,
  realmId,
  courseId,
  studentActorId,
  onBack,
}) {
  const { data, error, isLoading, reload } = useObservedStudentProgress({
    supabase,
    actorId,
    realmId,
    courseId,
    studentActorId,
    enabled: Boolean(supabase && actorId && realmId && courseId && studentActorId),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error && !data) {
    return <ErrorState error={error} onRetry={reload} onBack={onBack} />;
  }

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
            Observed Student Progress
          </h2>
          <div style={{ color: "#666" }}>
            {data?.course?.title ?? "Course"}
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
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Student Overview</h3>

        <HeaderItem
          label="Student Actor ID"
          value={data?.studentMembership?.actorId ?? studentActorId ?? "-"}
        />
        <HeaderItem
          label="Observer Role"
          value={data?.observerMembership?.role ?? "-"}
        />
        <HeaderItem
          label="Student Status"
          value={data?.studentMembership?.status ?? "-"}
        />
        <HeaderItem
          label="Linked At"
          value={data?.observedLink?.createdAt ?? "-"}
        />
      </div>

      <StudentProgressCard data={data} />

      <StudentAssignmentsCard
        assignments={data?.assignments ?? []}
        summary={data?.assignmentSummary ?? null}
      />
    </div>
  );
}

export default LearningObservedStudentScreen;