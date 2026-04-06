import React from "react";
import { useTeacherCourseHome } from "@/learning/hooks/teachers/useTeacherCourseHome";
import { TeacherCourseCard } from "@/learning/components/teachers/TeacherCourseCard";

function Stat({ label, value }) {
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
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <strong>{label}:</strong> {value}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Teacher Course</h2>
      <div>Loading teacher course...</div>
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

      <h2 style={{ marginTop: 0 }}>Teacher Course</h2>

      <div style={{ color: "#b42318", marginBottom: 12 }}>
        {error?.message ?? error?.code ?? "Failed to load teacher course"}
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

export function LearningTeacherCourseScreen({
  supabase,
  actorId,
  realmId,
  courseId,
  onBack,
  onOpenSubmissions,
}) {
  const { data, error, isLoading, reload } = useTeacherCourseHome({
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

  const course =
    data?.course ??
    data?.courseHome?.course ??
    null;

  const membership =
    data?.membership ??
    data?.teacherMembership ??
    data?.courseHome?.membership ??
    null;

  const summary =
    data?.summary ??
    data?.totals ??
    null;

  const assignmentItems =
    data?.assignments ??
    data?.courseHome?.assignments ??
    [];

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
            {course?.title ?? "Teacher Course"}
          </h2>
          <div style={{ color: "#666" }}>
            Course management and review overview
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

      <div style={{ marginBottom: 24 }}>
        <TeacherCourseCard
          item={{
            course,
            membership,
            summary,
          }}
          onOpen={() => onOpenSubmissions?.({ course, membership, summary })}
          actionLabel="Review Submissions"
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <Stat label="Lessons" value={summary?.lessonCount ?? summary?.lessons ?? 0} />
        <Stat
          label="Assignments"
          value={summary?.assignmentCount ?? summary?.assignments ?? assignmentItems.length}
        />
        <Stat
          label="Students"
          value={summary?.studentCount ?? summary?.students ?? 0}
        />
        <Stat
          label="Submissions"
          value={summary?.submissionCount ?? summary?.submissions ?? 0}
        />
      </div>

      <div
        style={{
          border: "1px solid #d0d7de",
          borderRadius: 10,
          padding: 16,
          background: "#fff",
          marginBottom: 16,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Course Details</h3>
        <InfoRow label="Course ID" value={course?.id ?? courseId ?? "-"} />
        <InfoRow label="Role" value={membership?.role ?? "teacher"} />
        <InfoRow label="Status" value={membership?.status ?? "-"} />
        <InfoRow
          label="Published At"
          value={course?.publishedAt ?? course?.createdAt ?? "-"}
        />
      </div>

      <div
        style={{
          border: "1px solid #d0d7de",
          borderRadius: 10,
          padding: 16,
          background: "#fff",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>
          Assignments ({assignmentItems.length})
        </h3>

        {assignmentItems.length === 0 && (
          <div style={{ color: "#666" }}>No assignments found.</div>
        )}

        {assignmentItems.length > 0 && (
          <table width="100%" border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Title</th>
                <th>Due At</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {assignmentItems.map((assignment) => (
                <tr key={assignment?.id ?? assignment?.title}>
                  <td>{assignment?.title ?? "Untitled Assignment"}</td>
                  <td>{assignment?.dueAt ?? assignment?.due_at ?? "-"}</td>
                  <td>
                    {assignment?.pointsPossible ??
                      assignment?.points_possible ??
                      "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default LearningTeacherCourseScreen;