import React from "react";
import { useParentDashboard } from "@/learning/hooks/parents/useParentDashboard";
import { ObservedStudentCard } from "@/learning/components/parents/ObservedStudentCard";

function SummaryTile({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 10,
        padding: 16,
        background: "#fff",
        minWidth: 180,
      }}
    >
      <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Parent Dashboard</h2>
      <div>Loading dashboard...</div>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Parent Dashboard</h2>

      <div style={{ color: "#b42318", marginBottom: 12 }}>
        {error?.message ?? error?.code ?? "Failed to load parent dashboard"}
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

export function LearningParentDashboardScreen({
  supabase,
  actorId,
  realmId,
  onOpenStudent,
}) {
  const { data, error, isLoading, reload } = useParentDashboard({
    supabase,
    actorId,
    realmId,
    enabled: Boolean(supabase && actorId && realmId),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error && !data) {
    return <ErrorState error={error} onRetry={reload} />;
  }

  const summary = data?.summary ?? {};
  const observedStudents = data?.observedStudents ?? [];

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
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>Parent Dashboard</h2>
          <div style={{ color: "#666" }}>
            Monitor student progress and assignments
          </div>
        </div>

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
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <SummaryTile
          label="Observed Students"
          value={summary.observedStudentCount ?? 0}
        />
        <SummaryTile label="Courses" value={summary.courseCount ?? 0} />
        <SummaryTile label="Lessons" value={summary.totalLessons ?? 0} />
        <SummaryTile
          label="Completed Lessons"
          value={summary.completedLessons ?? 0}
        />
        <SummaryTile
          label="In Progress Lessons"
          value={summary.inProgressLessons ?? 0}
        />
        <SummaryTile
          label="Assignments"
          value={summary.totalAssignments ?? 0}
        />
        <SummaryTile
          label="Submitted Assignments"
          value={summary.submittedAssignments ?? 0}
        />
        <SummaryTile
          label="Overdue Assignments"
          value={summary.overdueAssignments ?? 0}
        />
        <SummaryTile label="Progress" value={`${summary.progressPercent ?? 0}%`} />
        <SummaryTile
          label="Average Grade"
          value={summary.averageGradePercent ?? "-"}
        />
      </div>

      <div>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>
          Observed Students ({observedStudents.length})
        </h3>

        {observedStudents.length === 0 && (
          <div style={{ color: "#666" }}>No observed students found.</div>
        )}

        {observedStudents.map((item) => (
          <div key={item.id} style={{ marginBottom: 16 }}>
            <ObservedStudentCard item={item} />

            <button
              type="button"
              onClick={() => onOpenStudent?.(item)}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #222",
                background: "#222",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              View Student Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LearningParentDashboardScreen;