import DashboardShell from "@/features/dashboard/shared/components/DashboardShell";
import ProductPlaceholder from "@/features/dashboard/components/ProductPlaceholder";

export default function VcsmDashboard() {
  return (
    <DashboardShell>
      <header className="dashboard-topbar">
        <div className="dashboard-title">
          <span>VCSM</span>
          <h1>VCSM Dashboard</h1>
          <p>Social commerce platform — actors, vibes, booking, storefronts.</p>
        </div>
      </header>
      <ProductPlaceholder product="vcsm" />
    </DashboardShell>
  );
}
