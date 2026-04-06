import React, { useMemo } from "react";
import { useTeacherDashboard } from "@/learning/teacher/hooks/useTeacherDashboard";
import { TeacherCourseCard } from "@/learning/teacher/components/TeacherCourseCard";
import LearningLoadingState from "@/learning/components/shared/LearningLoadingState";

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
  return <LearningLoadingState label="Loading dashboard..." variant="dashboard" />;
}

function ErrorState({ error, onRetry }) {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Teacher Dashboard</h2>

      <div style={{ color: "#b42318", marginBottom: 12 }}>
        {error?.message ?? error?.code ?? "Failed to load teacher dashboard"}
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

function RecentAssignmentsTable({ items = [] }) {
  return (
    <div
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 10,
        padding: 16,
        background: "#fff",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>
        Assignments ({items.length})
      </h3>

      {items.length === 0 && (
        <div style={{ color: "#666" }}>No assignments found.</div>
      )}

      {items.length > 0 && (
        <table width="100%" border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Title</th>
              <th>Course</th>
              <th>Due At</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const assignment = item?.assignment ?? item;
              const course = item?.course ?? {};

              return (
                <tr key={assignment?.id ?? `${assignment?.title}-${course?.id ?? "course"}`}>
                  <td>{assignment?.title ?? "Untitled Assignment"}</td>
                  <td>{course?.title ?? item?.courseTitle ?? "-"}</td>
                  <td>{assignment?.dueAt ?? assignment?.due_at ?? "-"}</td>
                  <td>
                    {assignment?.pointsPossible ??
                      assignment?.points_possible ??
                      "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function LearningTeacherDashboardScreen({
  supabase,
  actorId,
  realmId,
  onOpenCourse,
  onOpenSubmissions,
}) {
  const { data, error, isLoading, reload, teacherCourses, teacherAssignments } =
    useTeacherDashboard({
      supabase,
      actorId,
      realmId,
      enabled: Boolean(supabase && actorId && realmId),
    });

  const summary = data?.summary ?? {};
  const courses = useMemo(() => teacherCourses ?? [], [teacherCourses]);
  const assignments = useMemo(() => teacherAssignments ?? [], [teacherAssignments]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error && !data) {
    return <ErrorState error={error} onRetry={reload} />;
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
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>Teacher Dashboard</h2>
          <div style={{ color: "#666" }}>
            Course delivery, assignments, and review
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
          label="Courses"
          value={summary.courseCount ?? courses.length ?? 0}
        />
        <SummaryTile
          label="Assignments"
          value={summary.assignmentCount ?? assignments.length ?? 0}
        />
        <SummaryTile
          label="Students"
          value={summary.studentCount ?? 0}
        />
        <SummaryTile
          label="Submissions"
          value={summary.submissionCount ?? 0}
        />
        <SummaryTile
          label="Pending Reviews"
          value={summary.pendingReviewCount ?? summary.pendingReviews ?? 0}
        />
        <SummaryTile
          label="Graded"
          value={summary.gradedCount ?? 0}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>
          My Courses ({courses.length})
        </h3>

        {courses.length === 0 && (
          <div style={{ color: "#666" }}>No teacher courses found.</div>
        )}

        {courses.map((item) => (
          <div key={item?.course?.id ?? item?.id}>
            <TeacherCourseCard
              item={item}
              onOpen={(selectedItem) => onOpenCourse?.(selectedItem)}
              actionLabel="Open Course"
            />

            <div style={{ marginTop: -4, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => onOpenSubmissions?.(item)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #222",
                  background: "#fff",
                  color: "#222",
                  cursor: "pointer",
                }}
              >
                Open Submission Review
              </button>
            </div>
          </div>
        ))}
      </div>

      <RecentAssignmentsTable items={assignments} />
    </div>
  );
}

export default LearningTeacherDashboardScreen;
