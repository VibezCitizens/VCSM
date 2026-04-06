import React, { useMemo } from "react";
import { useAdminDashboard } from "@/learning/administration/hooks/admin/useAdminDashboard";
import { OrganizationOverviewCard } from "@/learning/administration/components/admin/OrganizationOverviewCard";
import {
  SummaryTile,
  DashboardLoadingState,
  DashboardErrorState,
} from "@/learning/administration/components/admin/AdminDashboardParts";
import { AdminNavButtons } from "@/learning/administration/components/admin/AdminNavButtons";

export function LearningAdminDashboardScreen({
  supabase,
  user,
  actorId,
  identityRealmId,
  realmId,
  onOpenOrganization,
  onOpenCourseRoster,
  onOpenStudentDashboard,
  onOpenParentDashboard,
  onOpenTeacherDashboard,
  onOpenAccessManagement,
  onOpenPlatformAdmins,
}) {
  const { data, error, isLoading, reload } = useAdminDashboard({
    supabase,
    userId: user?.id ?? null,
    actorId,
    realmId,
    enabled: Boolean(supabase && actorId && realmId),
  });

  const summary = data?.summary ?? {};
  const organizations = useMemo(() => data?.organizations ?? [], [data]);
  const debug = useMemo(
    () => ({
      userId: user?.id ?? null,
      email: user?.email ?? null,
      actorId: actorId ?? null,
      identityRealmId: identityRealmId ?? null,
      learningRealmId: realmId ?? null,
      errorCode: error?.code ?? null,
      errorMessage: error?.message ?? null,
      errorDetails: error?.details ?? null,
    }),
    [actorId, error, identityRealmId, realmId, user],
  );

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (error) {
    return <DashboardErrorState error={error} onRetry={reload} debug={debug} />;
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
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>Admin Dashboard</h2>
          <div style={{ color: "#666" }}>
            {data?.realm?.name ?? "Learning Administration"}
          </div>
        </div>

        <button
          type="button"
          onClick={reload}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #222",
            background: "#fff",
            color: "#222",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      <AdminNavButtons
        onOpenStudentDashboard={onOpenStudentDashboard}
        onOpenParentDashboard={onOpenParentDashboard}
        onOpenTeacherDashboard={onOpenTeacherDashboard}
        onOpenAccessManagement={onOpenAccessManagement}
        onOpenPlatformAdmins={onOpenPlatformAdmins}
      />

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <SummaryTile label="Organizations" value={summary.organizationCount ?? 0} />
        <SummaryTile label="Courses" value={summary.totalCourses ?? 0} />
        <SummaryTile label="Active Courses" value={summary.activeCourses ?? 0} />
        <SummaryTile label="Students" value={summary.studentCount ?? 0} />
        <SummaryTile label="Teachers" value={summary.teacherCount ?? 0} />
        <SummaryTile label="Parents" value={summary.observerCount ?? 0} />
        <SummaryTile label="Admins" value={summary.adminCount ?? 0} />
        <SummaryTile label="Members" value={summary.totalMembers ?? 0} />
      </div>

      <div>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>
          Organizations ({organizations.length})
        </h3>

        {organizations.length === 0 && (
          <div style={{ color: "#666" }}>No organizations found.</div>
        )}

        {organizations.map((item) => (
          <div key={item.organization?.id} style={{ marginBottom: 16 }}>
            <OrganizationOverviewCard
              organization={item.organization}
              summary={item.summary}
            />

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => onOpenOrganization?.(item)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #222",
                  background: "#222",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Open Organization
              </button>

              {(item.courses ?? []).length > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenCourseRoster?.(item.courses[0])}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #222",
                    background: "#fff",
                    color: "#222",
                    cursor: "pointer",
                  }}
                >
                  Open First Course Roster
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LearningAdminDashboardScreen;
