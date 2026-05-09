import DashboardShell from "@/features/dashboard/shared/components/DashboardShell";
import ProductPlaceholder from "@/features/dashboard/components/ProductPlaceholder";

export default function TripointProduct() {
  return (
    <DashboardShell>
      <header className="dashboard-topbar">
        <div className="dashboard-title">
          <span>Tripoint</span>
          <h1>Tripoint Dashboard</h1>
          <p>Lock &amp; key business site — reviews, phone CTA, service areas.</p>
        </div>
      </header>
      <ProductPlaceholder product="tripoint" />
    </DashboardShell>
  );
}
