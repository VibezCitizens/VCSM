import React from "react";
import { useNavigate } from "react-router-dom";
import { useSuperAdminContext } from "@/learning/superadmin/SuperAdminLayout";
import { useTenants } from "@/learning/superadmin/hooks/useTenants";
import LearningLoadingState from "@/learning/components/shared/LearningLoadingState";
import { TenantRow } from "@/learning/superadmin/components/TenantRow";
import { CreateTenantForm } from "@/learning/superadmin/components/CreateTenantForm";

export function SuperAdminDashboardScreen() {
  const navigate = useNavigate();
  const { supabase, user, actorId, isLoading: authLoading } = useSuperAdminContext();

  const { data, error, isLoading, isSaving, reload, createTenant } = useTenants({
    supabase,
    userId: user?.id ?? null,
    actorId,
    enabled: Boolean(supabase && actorId && !authLoading),
  });

  const tenants = data?.tenants ?? [];

  function handleOpen(tenant) {
    navigate(`/learning/${tenant.slug}`);
  }

  if (authLoading || isLoading) {
    return <LearningLoadingState label="Loading tenants..." variant="home" />;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: 22 }}>All Tenants</h2>
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            {data?.totalCount ?? 0} tenant{data?.totalCount !== 1 ? "s" : ""} &middot;{" "}
            {data?.activeCount ?? 0} active
          </div>
        </div>

        <button
          type="button"
          onClick={reload}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
            color: "#374151",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Refresh
        </button>
      </div>

      <CreateTenantForm
        isSaving={isSaving}
        error={isSaving ? null : error}
        onCreate={createTenant}
      />

      {error && !isSaving && tenants.length === 0 && (
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: "#fef3f2",
            color: "#b42318",
            border: "1px solid #fecdca",
            marginBottom: 24,
          }}
        >
          {error.message ?? error.code ?? "Failed to load tenants"}
        </div>
      )}

      {tenants.length === 0 ? (
        <div
          className="learning-card"
          style={{ padding: 32, textAlign: "center", color: "#6b7280" }}
        >
          No tenants yet. Create the first one above.
        </div>
      ) : (
        <div className="learning-card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr
                style={{
                  background: "#f9fafb",
                  textAlign: "left",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Tenant</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Organizations</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Active / Total Courses</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Created</th>
                <th style={{ padding: "10px 14px" }}></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <TenantRow
                  key={tenant.id}
                  tenant={tenant}
                  onOpen={handleOpen}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SuperAdminDashboardScreen;
