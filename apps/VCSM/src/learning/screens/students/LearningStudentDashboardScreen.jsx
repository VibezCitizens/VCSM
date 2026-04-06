import React, { useMemo } from "react";
import { useStudentDashboard } from "@/learning/hooks/students/useStudentDashboard";
import { ContinueLearningCard } from "@/learning/components/students/ContinueLearningCard";
import { StudentCourseCard } from "@/learning/components/students/StudentCourseCard";
import { StudentProgressCard } from "@/learning/components/students/StudentProgressCard";

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

function pickContinueCourse(courses = []) {
  if (!Array.isArray(courses) || courses.length === 0) {
    return null;
  }

  const inProgressCourse =
    courses.find((item) => {
      const progressPercent = item?.summary?.progressPercent ?? 0;
      return progressPercent > 0 && progressPercent < 100;
    }) ?? null;

  if (inProgressCourse) {
    return inProgressCourse;
  }

  const notStartedCourse =
    courses.find((item) => (item?.summary?.progressPercent ?? 0) === 0) ?? null;

  if (notStartedCourse) {
    return notStartedCourse;
  }

  return courses[0] ?? null;
}

function LoadingState() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Student Dashboard</h2>
      <div>Loading dashboard...</div>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Student Dashboard</h2>

      <div style={{ color: "#b42318", marginBottom: 12 }}>
        {error?.message ?? error?.code ?? "Failed to load student dashboard"}
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

export function LearningStudentDashboardScreen({
  supabase,
  actorId,
  realmId,
  onOpenCourse,
}) {
  const { data, error, isLoading, reload } = useStudentDashboard({
    supabase,
    actorId,
    realmId,
    enabled: Boolean(supabase && actorId && realmId),
  });

  const courses = useMemo(() => data?.courses ?? [], [data]);
  const summary = data?.summary ?? {};
  const continueCourse = useMemo(() => pickContinueCourse(courses), [courses]);

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
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>Student Dashboard</h2>
          <div style={{ color: "#666" }}>
            {data?.realm?.name ?? "Learning"}
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
          label="Graded Assignments"
          value={summary.gradedAssignments ?? 0}
        />
        <SummaryTile label="Progress" value={`${summary.progressPercent ?? 0}%`} />
        <SummaryTile
          label="Average Grade"
          value={summary.averageGradePercent ?? "-"}
        />
      </div>

      {continueCourse && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Continue Learning</h3>
          <ContinueLearningCard
            course={continueCourse}
            onContinue={(item) => onOpenCourse?.(item)}
          />
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <StudentProgressCard data={data?.progress ?? null} />
      </div>

      <div>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>
          My Courses ({courses.length})
        </h3>

        {courses.length === 0 && (
          <div style={{ color: "#666" }}>No student courses found.</div>
        )}

        {courses.map((item) => (
          <StudentCourseCard
            key={item?.course?.id ?? item?.id}
            item={item}
            onOpen={(selectedItem) => onOpenCourse?.(selectedItem)}
          />
        ))}
      </div>
    </div>
  );
}

export default LearningStudentDashboardScreen;