import React from "react";
import { useCourseRoster } from "@/learning/administration/hooks/admin/useCourseRoster";
import { CourseRosterTable } from "@/learning/administration/components/admin/CourseRosterTable";
import { MembershipAssignmentPanel } from "@/learning/administration/components/admin/MembershipAssignmentPanel";
import { ParentStudentLinkPanel } from "@/learning/administration/components/admin/ParentStudentLinkPanel";
import { CreateParentPanel } from "@/learning/administration/components/admin/CreateParentPanel";
import LearningLoadingState from "@/learning/administration/components/shared/LearningLoadingState";

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

const COURSE_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
  { value: "removed", label: "Removed" },
];

function LoadingState() {
  return <LearningLoadingState label="Loading roster..." variant="split" />;
}

function ErrorState({ error, onRetry }) {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Course Roster</h2>
      <div style={{ color: "#b42318", marginBottom: 12 }}>
        {error?.message ?? error?.code ?? "Failed to load course roster"}
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

export function LearningCourseRosterScreen({
  supabase,
  user,
  actorId,
  realmId,
  courseId,
  onBack,
}) {
  const {
    data,
    error,
    isLoading,
    isSaving,
    reload,
    assignStudent,
    assignTeacher,
    assignObserver,
    linkParentToStudent,
    createParent,
  } = useCourseRoster({
    supabase,
    userId: user?.id ?? null,
    actorId,
    realmId,
    courseId,
    enabled: Boolean(supabase && actorId && realmId && courseId),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error && !data) {
    return <ErrorState error={error} onRetry={reload} />;
  }

  const summary = data?.summary ?? {};
  const roster = data?.roster ?? null;

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
            {data?.course?.title ?? "Course Roster"}
          </h2>
          <div style={{ color: "#666" }}>
            {data?.organization?.name ?? "Organization"}
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
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <Stat label="Members" value={summary.totalMembers ?? 0} />
        <Stat label="Students" value={summary.studentCount ?? 0} />
        <Stat label="Teachers" value={summary.teacherCount ?? 0} />
        <Stat label="Observers" value={summary.observerCount ?? 0} />
        <Stat label="Admins" value={summary.adminCount ?? 0} />
        <Stat label="Observer Links" value={summary.observerLinkCount ?? 0} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <MembershipAssignmentPanel
          title="Assign Student"
          actorIdLabel="Student ID"
          actionLabel="Add Student"
          isSaving={isSaving}
          statusOptions={COURSE_STATUS_OPTIONS}
          defaultStatus="active"
          onSubmit={async ({ actorId: studentActorId, status }) => {
            return assignStudent({ studentActorId, status });
          }}
        />

        <MembershipAssignmentPanel
          title="Assign Teacher"
          actorIdLabel="Teacher ID"
          actionLabel="Add Teacher"
          isSaving={isSaving}
          roleLabel="Teaching Role"
          defaultRole="teacher"
          roleOptions={[
            { value: "teacher", label: "Teacher" },
            { value: "instructor", label: "Instructor" },
            { value: "ta", label: "TA" },
            { value: "grader", label: "Grader" },
          ]}
          statusOptions={COURSE_STATUS_OPTIONS}
          defaultStatus="active"
          onSubmit={async ({ actorId: teacherActorId, role, status }) => {
            return assignTeacher({
              teacherActorId,
              role,
              status,
            });
          }}
        />

        <MembershipAssignmentPanel
          title="Assign Parent / Observer"
          actorIdLabel="Observer ID"
          actionLabel="Add Observer"
          isSaving={isSaving}
          roleLabel="Observer Role"
          defaultRole="parent"
          roleOptions={[
            { value: "parent", label: "Parent" },
            { value: "observer", label: "Observer" },
          ]}
          statusOptions={COURSE_STATUS_OPTIONS}
          defaultStatus="active"
          onSubmit={async ({ actorId: observerActorId, role, status }) => {
            return assignObserver({
              observerActorId,
              role,
              status,
            });
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <CreateParentPanel
          students={roster?.students ?? []}
          onCreateParent={async ({ displayName, email, studentActorId: sid, sendInvite }) => {
            return createParent({
              organizationId: data?.organization?.id,
              displayName,
              email,
              studentActorId: sid,
              sendInvite,
            });
          }}
          isSaving={isSaving}
        />

        <ParentStudentLinkPanel
          onLink={linkParentToStudent}
          isSaving={isSaving}
        />
      </div>

      <CourseRosterTable roster={roster} />
    </div>
  );
}

export default LearningCourseRosterScreen;
