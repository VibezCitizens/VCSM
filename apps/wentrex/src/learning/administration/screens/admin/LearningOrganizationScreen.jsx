import React, { useMemo, useState } from "react";
import { useOrganizationCourses } from "@/learning/administration/hooks/admin/useOrganizationCourses";
import { useOrganizationMembers } from "@/learning/administration/hooks/admin/useOrganizationMembers";
import { useCourseTerms } from "@/learning/administration/hooks/admin/useCourseTerms";
import { MembershipAssignmentPanel } from "@/learning/administration/components/admin/MembershipAssignmentPanel";
import { OrganizationOverviewCard } from "@/learning/administration/components/admin/OrganizationOverviewCard";
import { OrganizationMembersTable } from "@/learning/administration/components/admin/OrganizationMembersTable";
import { CourseTermsPanel } from "@/learning/administration/components/admin/CourseTermsPanel";
import { CreateCourseModal } from "@/learning/administration/components/admin/CreateCourseModal";
import {
  TabButton,
  CourseCard,
  OrganizationLoadingState,
  ErrorBanner,
} from "@/learning/administration/components/admin/OrganizationParts";

const ORGANIZATION_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
  { value: "removed", label: "Removed" },
];

export function LearningOrganizationScreen({
  supabase,
  user,
  actorId,
  realmId,
  organizationId,
  onBack,
  onOpenCourseRoster,
}) {
  const userId = user?.id ?? null;
  const [activeTab, setActiveTab] = useState("courses");
  const [showCreateCourse, setShowCreateCourse] = useState(false);

  const coursesState = useOrganizationCourses({
    supabase,
    userId,
    actorId,
    realmId,
    organizationId,
    includeArchived: true,
    includeDrafts: true,
    enabled: Boolean(supabase && actorId && realmId && organizationId),
  });

  const membersState = useOrganizationMembers({
    supabase,
    userId,
    actorId,
    realmId,
    organizationId,
    enabled: Boolean(supabase && actorId && realmId && organizationId),
  });

  const termsState = useCourseTerms({
    supabase,
    userId,
    actorId,
    realmId,
    organizationId,
    enabled: Boolean(supabase && actorId && realmId && organizationId),
  });

  const isLoading = coursesState.isLoading || membersState.isLoading;
  const error = coursesState.error ?? membersState.error ?? termsState.error ?? null;

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
    return <OrganizationLoadingState />;
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

      <ErrorBanner error={error} />

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
        <TabButton
          active={activeTab === "terms"}
          onClick={() => setActiveTab("terms")}
        >
          Terms
        </TabButton>
      </div>

      {activeTab === "courses" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>
              Courses ({courses.length})
            </h3>
            <button
              type="button"
              className="learning-button learning-button-primary"
              onClick={() => setShowCreateCourse(true)}
            >
              + Create Course
            </button>
          </div>

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

          {showCreateCourse && (
            <CreateCourseModal
              terms={termsState.data?.terms ?? []}
              isSaving={coursesState.isSaving}
              onCreateCourse={coursesState.createCourse}
              onClose={() => setShowCreateCourse(false)}
            />
          )}
        </div>
      )}

      {activeTab === "terms" && (
        <CourseTermsPanel
          terms={termsState.data?.terms ?? []}
          isSaving={termsState.isSaving}
          onCreateTerm={termsState.createTerm}
          onUpdateTerm={termsState.updateTerm}
        />
      )}

      {activeTab === "members" && (
        <div>
          <MembershipAssignmentPanel
            title="Create or Assign Organization Access"
            actionLabel="Save Organization Membership"
            createActionLabel="Create and Save Organization Member"
            helperText="Grant or update organization-level staff, teacher, or admin access here."
            createHelperText="Create a new account or enroll an existing account by email from this organization."
            isSaving={membersState.isSaving}
            roleLabel="Organization Role"
            defaultRole="staff"
            roleOptions={[
              { value: "staff", label: "Staff" },
              { value: "teacher", label: "Teacher" },
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
            onCreateMember={async ({ displayName, email, username, role, status }) =>
              membersState.createMember({
                displayName,
                email,
                username,
                role,
                status,
              })
            }
          />

          <OrganizationMembersTable members={members} />
        </div>
      )}
    </div>
  );
}

export default LearningOrganizationScreen;
