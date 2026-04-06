import React, { useMemo, useState } from "react";
import { useOrganizationCourses } from "@/learning/hooks/administration/useOrganizationCourses";
import { useOrganizationMembers } from "@/learning/hooks/administration/useOrganizationMembers";
import { MembershipAssignmentPanel } from "@/learning/components/administration/MembershipAssignmentPanel";
import { OrganizationOverviewCard } from "@/learning/components/administration/OrganizationOverviewCard";
import { OrganizationMembersTable } from "@/learning/components/administration/OrganizationMembersTable";

const ORGANIZATION_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
  { value: "removed", label: "Removed" },
];

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        border: "1px solid #222",
        background: active ? "#222" : "#fff",
        color: active ? "#fff" : "#222",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function CourseCard({ item, onOpenCourseRoster }) {
  return (
    <div
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 10,
        padding: 16,
        background: "#fff",
        marginBottom: 12,
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>
        {item?.course?.title ?? "Untitled Course"}
      </h3>

      <div style={{ marginBottom: 6 }}>
        <strong>Status:</strong> {item?.course?.status ?? "-"}
      </div>
      <div style={{ marginBottom: 6 }}>
        <strong>Members:</strong> {item?.summary?.totalMembers ?? 0}
      </div>
      <div style={{ marginBottom: 6 }}>
        <strong>Students:</strong> {item?.summary?.studentCount ?? 0}
      </div>
      <div style={{ marginBottom: 6 }}>
        <strong>Teachers:</strong> {item?.summary?.teacherCount ?? 0}
      </div>
      <div style={{ marginBottom: 12 }}>
        <strong>Parents:</strong> {item?.summary?.observerCount ?? 0}
      </div>

      <button
        type="button"
        onClick={() => onOpenCourseRoster?.(item)}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #222",
          background: "#222",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Open Course Roster
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Organization</h2>
      <div>Loading organization...</div>
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;

  return (
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
      {message}
    </div>
  );
}

export function LearningOrganizationScreen({
  supabase,
  actorId,
  realmId,
  organizationId,
  onBack,
  onOpenCourseRoster,
}) {
  const [activeTab, setActiveTab] = useState("courses");

  const coursesState = useOrganizationCourses({
    supabase,
    actorId,
    realmId,
    organizationId,
    includeArchived: true,
    includeDrafts: true,
    enabled: Boolean(supabase && actorId && realmId && organizationId),
  });

  const membersState = useOrganizationMembers({
    supabase,
    actorId,
    realmId,
    organizationId,
    enabled: Boolean(supabase && actorId && realmId && organizationId),
  });

  const isLoading = coursesState.isLoading || membersState.isLoading;
  const error = coursesState.error ?? membersState.error ?? null;

  const organization = useMemo(
    () => coursesState.data?.organization ?? membersState.data?.organization ?? null,
    [coursesState.data, membersState.data],
  );

  const courseSummary = coursesState.data?.summary ?? {};
  const courses = coursesState.data?.courses ?? [];
  const members = membersState.data?.members ?? [];
  const memberSummary = membersState.data?.summary ?? {};

  const overviewSummary = {
    totalCourses: courseSummary.totalCourses ?? 0,
    activeCourses: courseSummary.activeCourses ?? 0,
    draftCourses: courseSummary.draftCourses ?? 0,
    archivedCourses: courseSummary.archivedCourses ?? 0,
    totalMembers: memberSummary.totalMembers ?? 0,
    studentCount: memberSummary.studentCount ?? 0,
    teacherCount: memberSummary.teacherCount ?? 0,
    observerCount: memberSummary.observerCount ?? 0,
    adminCount:
      (memberSummary.adminCount ?? 0) + (memberSummary.orgAdminCount ?? 0),
  };

  if (isLoading && !organization) {
    return <LoadingState />;
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
            {organization?.name ?? "Organization"}
          </h2>
          <div style={{ color: "#666" }}>
            Organization ID: {organization?.id ?? organizationId}
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
            onClick={() => {
              coursesState.reload();
              membersState.reload();
            }}
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

      <ErrorBanner message={error?.message ?? error?.code ?? ""} />

      <OrganizationOverviewCard
        organization={organization}
        summary={overviewSummary}
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <TabButton
          active={activeTab === "courses"}
          onClick={() => setActiveTab("courses")}
        >
          Courses
        </TabButton>
        <TabButton
          active={activeTab === "members"}
          onClick={() => setActiveTab("members")}
        >
          Members
        </TabButton>
      </div>

      {activeTab === "courses" && (
        <div>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>
            Courses ({courses.length})
          </h3>

          {courses.length === 0 && (
            <div style={{ color: "#666" }}>No courses found.</div>
          )}

          {courses.map((item) => (
            <CourseCard
              key={item.course?.id}
              item={item}
              onOpenCourseRoster={onOpenCourseRoster}
            />
          ))}
        </div>
      )}

      {activeTab === "members" && (
        <div>
          <MembershipAssignmentPanel
            title="Assign Organization Admin / Staff"
            actorIdLabel="Member Actor ID"
            actionLabel="Save Organization Membership"
            helperText="Grant or update organization-level administrative access here."
            isSaving={membersState.isSaving}
            roleLabel="Organization Role"
            defaultRole="staff"
            roleOptions={[
              { value: "staff", label: "Staff" },
              { value: "admin", label: "Admin" },
            ]}
            statusOptions={ORGANIZATION_STATUS_OPTIONS}
            defaultStatus="active"
            onSubmit={async ({ actorId: memberActorId, role, status }) => {
              return membersState.assignMember({
                memberActorId,
                role,
                status,
              });
            }}
          />

          <OrganizationMembersTable members={members} />
        </div>
      )}
    </div>
  );
}

export default LearningOrganizationScreen;
