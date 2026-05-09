import DashboardShell from "@/features/dashboard/shared/components/DashboardShell";
import ProductPlaceholder from "@/features/dashboard/components/ProductPlaceholder";

export default function WentrexDashboard() {
  return (
    <DashboardShell>
      <header className="dashboard-topbar">
        <div className="dashboard-title">
          <span>Wentrex</span>
          <h1>Wentrex Dashboard</h1>
          <p>Multi-tenant LMS — organizations, courses, learner progress.</p>
        </div>
      </header>
      <ProductPlaceholder product="wentrex" />
    </DashboardShell>
  );
}
