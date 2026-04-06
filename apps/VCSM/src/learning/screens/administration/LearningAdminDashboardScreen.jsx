import React, { useMemo } from "react";
import { useAdminDashboard } from "@/learning/hooks/administration/useAdminDashboard";
import { OrganizationOverviewCard } from "@/learning/components/administration/OrganizationOverviewCard";

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
      <h2 style={{ marginTop: 0 }}>Admin Dashboard</h2>
      <div>Loading dashboard...</div>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Admin Dashboard</h2>
      <div style={{ color: "#b42318", marginBottom: 12 }}>
        {error?.message ?? error?.code ?? "Failed to load admin dashboard"}
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

export function LearningAdminDashboardScreen({
  supabase,
  actorId,
  realmId,
  onOpenOrganization,
  onOpenCourseRoster,
  onOpenStudentDashboard,
  onOpenParentDashboard,
  onOpenTeacherDashboard,
}) {
  const { data, error, isLoading, reload } = useAdminDashboard({
    supabase,
    actorId,
    realmId,
    enabled: Boolean(supabase && actorId && realmId),
  });

  const summary = data?.summary ?? {};
  const organizations = useMemo(() => data?.organizations ?? [], [data]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
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

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          onClick={onOpenStudentDashboard}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #222",
            background: "#fff",
            color: "#222",
            cursor: "pointer",
          }}
        >
          Students
        </button>

        <button
          type="button"
          onClick={onOpenParentDashboard}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #222",
            background: "#fff",
            color: "#222",
            cursor: "pointer",
          }}
        >
          Parents
        </button>

        <button
          type="button"
          onClick={onOpenTeacherDashboard}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #222",
            background: "#fff",
            color: "#222",
            cursor: "pointer",
          }}
        >
          Teachers
        </button>
      </div>

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
