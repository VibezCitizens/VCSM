import { useNavigate } from "react-router-dom";
import { useSuperAdminContext } from "@/superadmin/SuperAdminLayout";
import { useTenants } from "@/superadmin/hooks/useTenants";
import CreateTenantForm from "@/superadmin/components/CreateTenantForm";
import TenantRow from "@/superadmin/components/TenantRow";

export default function SuperAdminDashboardScreen() {
  const navigate = useNavigate();
  const { supabase, user, actorId, isLoading: authLoading } = useSuperAdminContext();

  const { data, error, isLoading, isSaving, reload, createTenant } = useTenants({
    supabase,
    userId: user?.id ?? null,
    actorId,
    enabled: Boolean(supabase && actorId && !authLoading),
  });

  const tenants = data?.tenants ?? [];

  if (authLoading || isLoading) {
    return (
      <div className="sa-loading">
        <div className="sa-spinner" />
        <span>Loading tenants...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="sa-stats">
        <div className="sa-stat-card">
          <div className="sa-stat-label">Total Tenants</div>
          <div className="sa-stat-value accent">{data?.totalCount ?? 0}</div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-label">Active</div>
          <div className="sa-stat-value success">{data?.activeCount ?? 0}</div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-label">Inactive</div>
          <div className="sa-stat-value warning">
            {(data?.totalCount ?? 0) - (data?.activeCount ?? 0)}
          </div>
        </div>
      </div>

      {/* Create Tenant Form */}
      <CreateTenantForm
        isSaving={isSaving}
        error={isSaving ? null : error}
        onCreate={createTenant}
      />

      {/* Tenant List */}
      <div className="sa-section-header">
        <h2 className="sa-section-title">Tenants</h2>
        <button type="button" className="sa-btn-ghost" onClick={reload}>
          Refresh
        </button>
      </div>

      {error && !isSaving && tenants.length === 0 && (
        <div className="sa-error-box">
          {error.message ?? error.code ?? "Failed to load tenants"}
        </div>
      )}

      {tenants.length === 0 ? (
        <div className="sa-card">
          <div className="sa-empty">No tenants yet. Create the first one above.</div>
        </div>
      ) : (
        <div className="sa-card">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Status</th>
                <th>Organizations</th>
                <th>Courses</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <TenantRow
                  key={tenant.id}
                  tenant={tenant}
                  onOpen={(t) => navigate(`/admin/tenant/${t.slug}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
