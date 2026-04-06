import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useOrganizationMembers } from "@/learning/administration/hooks/admin/useOrganizationMembers";
import { MembershipAssignmentPanel } from "@/learning/administration/components/admin/MembershipAssignmentPanel";

const ROLE_OPTIONS = [
  { value: "teacher", label: "Teacher" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
];

const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "All roles" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "teacher", label: "Teacher" },
];

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--learning-border)",
  fontSize: 14,
  background: "var(--learning-surface)",
  color: "var(--learning-text)",
  boxSizing: "border-box",
};

function StatusPill({ status }) {
  const isActive = status === "active";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: isActive ? "#dcfce7" : "#f1f5f9",
        color: isActive ? "#166534" : "var(--learning-muted-text)",
      }}
    >
      {status ?? "—"}
    </span>
  );
}

export default function LearningStaffScreen({ supabase, user, actorId, realmId, onBack }) {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAddPanel, setShowAddPanel] = useState(false);

  const userId = user?.id ?? null;

  // Load organizations for this realm
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
        if (orgs.length > 0) setSelectedOrgId(orgs[0].id);
        setLoadingOrgs(false);
      });

    return () => { cancelled = true; };
  }, [supabase, realmId]);

  const membersState = useOrganizationMembers({
    supabase,
    userId,
    actorId,
    realmId,
    organizationId: selectedOrgId,
    enabled: Boolean(supabase && actorId && realmId && selectedOrgId),
  });

  const handleCreateMember = useCallback(async ({ displayName, email, role, status }) => {
    const result = await membersState.createMember({ displayName, email, role, status });
    if (result?.ok) setShowAddPanel(false);
    return result;
  }, [membersState]);

  const selectedOrg = organizations.find((o) => o.id === selectedOrgId);
  const allMembers = membersState.data?.members ?? [];

  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      const name = (m.profile?.displayName ?? m.profile?.username ?? "").toLowerCase();
      const email = (m.profile?.email ?? "").toLowerCase();
      const role = m.organizationMembership?.role ?? "";
      const matchesSearch =
        !search ||
        name.includes(search.toLowerCase()) ||
        email.includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [allMembers, search, roleFilter]);

  const isLoading = loadingOrgs || membersState.isLoading;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--learning-muted-text)",
                fontSize: 13,
                padding: 0,
                marginBottom: 4,
              }}
            >
              <ArrowLeft size={14} />
              Back to Admin
            </button>
          )}
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--learning-text)" }}>
            Staff
          </h2>
          {selectedOrg && (
            <p style={{ margin: 0, fontSize: 14, color: "var(--learning-muted-text)" }}>
              {selectedOrg.name}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {organizations.length > 1 && (
            <select
              value={selectedOrgId ?? ""}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              style={inputStyle}
            >
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
          <button
            type="button"
            className="learning-button learning-button-primary"
            onClick={() => setShowAddPanel((v) => !v)}
          >
            {showAddPanel ? "Cancel" : "+ Add Staff"}
          </button>
        </div>
      </div>

      {/* Add Staff panel */}
      {showAddPanel && selectedOrgId && (
        <div className="learning-card" style={{ padding: 20 }}>
          <MembershipAssignmentPanel
            title="Add Staff Member"
            actionLabel="Assign"
            createActionLabel="Create & Enroll"
            createHelperText="Creates a new account and enrolls them into the organization."
            defaultRole="teacher"
            roleOptions={ROLE_OPTIONS}
            statusOptions={STATUS_OPTIONS}
            defaultStatus="active"
            isSaving={membersState.isSaving}
            onCreateMember={handleCreateMember}
          />
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 220 }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={inputStyle}
        >
          {ROLE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="learning-card" style={{ padding: 0, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--learning-muted-text)", fontSize: 14 }}>
            Loading staff…
          </div>
        ) : membersState.error ? (
          <div style={{ padding: 40, textAlign: "center", color: "#7f1d1d", fontSize: 14 }}>
            {membersState.error.message ?? "Failed to load staff."}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--learning-muted-text)", fontSize: 14 }}>
            {search || roleFilter !== "all"
              ? "No staff match your filters."
              : "No staff members yet. Use Add Staff to enroll someone."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--learning-border)", background: "var(--learning-muted)" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--learning-muted-text)", whiteSpace: "nowrap" }}>Name</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--learning-muted-text)", whiteSpace: "nowrap" }}>Email</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--learning-muted-text)", whiteSpace: "nowrap" }}>Role</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--learning-muted-text)", whiteSpace: "nowrap" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--learning-muted-text)", whiteSpace: "nowrap" }}>Added</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m) => (
                  <tr
                    key={m.actorId}
                    style={{ borderBottom: "1px solid var(--learning-border)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--learning-muted)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                  >
                    <td style={{ padding: "12px 16px", color: "var(--learning-text)", fontWeight: 500 }}>
                      {m.profile?.displayName ?? m.profile?.username ?? "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--learning-muted-text)" }}>
                      {m.profile?.email ?? "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className="learning-badge">{m.organizationMembership?.role ?? "—"}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusPill status={m.organizationMembership?.status} />
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--learning-muted-text)" }}>
                      {m.organizationMembership?.createdAt
                        ? new Date(m.organizationMembership.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      {!isLoading && filteredMembers.length > 0 && (
        <p style={{ margin: 0, fontSize: 13, color: "var(--learning-muted-text)" }}>
          Showing {filteredMembers.length} of {allMembers.length} member{allMembers.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
