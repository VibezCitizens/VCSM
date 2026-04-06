import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useOrganizationCourses } from "@/learning/administration/hooks/admin/useOrganizationCourses";
import { useCourseTerms } from "@/learning/administration/hooks/admin/useCourseTerms";
import { CreateCourseModal } from "@/learning/administration/components/admin/CreateCourseModal";
import LearningLoadingState from "@/learning/administration/components/shared/LearningLoadingState";

function StatusBadge({ status }) {
  const colors = {
    active: { bg: "#dcfce7", color: "#166534" },
    published: { bg: "#dcfce7", color: "#166534" },
    draft: { bg: "#fef9c3", color: "#854d0e" },
    archived: { bg: "#f1f5f9", color: "#64748b" },
  };
  const c = colors[status] ?? colors.draft;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      background: c.bg,
      color: c.color,
    }}>
      {status ?? "—"}
    </span>
  );
}

export default function LearningCoursesListScreen({
  supabase,
  user,
  actorId,
  realmId,
  onBack,
  onOpenCourseRoster,
}) {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!supabase || !realmId) return;
    let cancelled = false;
    setLoadingOrgs(true);

    supabase
      .schema("learning")
      .from("organizations")
      .select("id, name, slug")
      .eq("realm_id", realmId)
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        if (cancelled) return;
        const orgs = data ?? [];
        setOrganizations(orgs);
        if (orgs.length > 0 && !selectedOrgId) setSelectedOrgId(orgs[0].id);
        setLoadingOrgs(false);
      });

    return () => { cancelled = true; };
  }, [supabase, realmId]);

  const coursesState = useOrganizationCourses({
    supabase,
    userId,
    actorId,
    realmId,
    organizationId: selectedOrgId,
    includeArchived: true,
    includeDrafts: true,
    enabled: Boolean(supabase && actorId && realmId && selectedOrgId),
  });

  const termsState = useCourseTerms({
    supabase,
    userId,
    actorId,
    realmId,
    organizationId: selectedOrgId,
    enabled: Boolean(supabase && actorId && realmId && selectedOrgId),
  });

  const allCourses = coursesState.data?.courses ?? [];
  const courses = statusFilter === "all"
    ? allCourses
    : allCourses.filter((c) => c.course?.status === statusFilter);

  const inputStyle = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--learning-border)",
    fontSize: 14,
    background: "var(--learning-surface)",
    color: "var(--learning-text)",
    boxSizing: "border-box",
  };

  if ((loadingOrgs || coursesState.isLoading) && !coursesState.data) {
    return <LearningLoadingState label="Loading courses..." variant="split" />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--learning-muted-text)", fontSize: 13, padding: 0, marginBottom: 4 }}
            >
              <ArrowLeft size={14} /> Back to Admin
            </button>
          )}
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--learning-text)" }}>Courses</h2>
        </div>
        <button
          type="button"
          className="learning-button learning-button-primary"
          onClick={() => setShowCreate(true)}
        >
          + Create Course
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {organizations.length > 1 && (
          <select value={selectedOrgId ?? ""} onChange={(e) => setSelectedOrgId(e.target.value)} style={inputStyle}>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        )}
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Course Table */}
      <div className="learning-card" style={{ padding: 0, overflow: "hidden" }}>
        {courses.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--learning-muted-text)", fontSize: 14 }}>
            {allCourses.length === 0 ? "No courses yet. Create one to get started." : "No courses match this filter."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--learning-border)", background: "var(--learning-muted)" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--learning-muted-text)" }}>Title</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--learning-muted-text)" }}>Code</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--learning-muted-text)" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--learning-muted-text)" }}>Members</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--learning-muted-text)" }}>Created</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--learning-muted-text)" }}></th>
                </tr>
              </thead>
              <tbody>
                {courses.map((item) => {
                  const c = item.course ?? {};
                  const s = item.summary ?? {};
                  return (
                    <tr
                      key={c.id}
                      style={{ borderBottom: "1px solid var(--learning-border)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--learning-muted)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 500, color: "var(--learning-text)" }}>{c.title ?? "—"}</td>
                      <td style={{ padding: "12px 16px", color: "var(--learning-muted-text)" }}>{c.code ?? "—"}</td>
                      <td style={{ padding: "12px 16px" }}><StatusBadge status={c.status} /></td>
                      <td style={{ padding: "12px 16px", color: "var(--learning-muted-text)" }}>{s.totalMembers ?? 0}</td>
                      <td style={{ padding: "12px 16px", color: "var(--learning-muted-text)" }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          type="button"
                          onClick={() => onOpenCourseRoster?.(item)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1px solid var(--learning-border)",
                            background: "var(--learning-surface)",
                            color: "var(--learning-primary, #0f4a72)",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          Roster
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      {courses.length > 0 && (
        <p style={{ margin: 0, fontSize: 13, color: "var(--learning-muted-text)" }}>
          Showing {courses.length} of {allCourses.length} course{allCourses.length !== 1 ? "s" : ""}
        </p>
      )}

      {showCreate && (
        <CreateCourseModal
          terms={termsState.data?.terms ?? []}
          isSaving={coursesState.isSaving}
          onCreateCourse={coursesState.createCourse}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
