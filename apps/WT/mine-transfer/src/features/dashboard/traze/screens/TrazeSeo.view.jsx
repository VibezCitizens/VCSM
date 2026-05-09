import DashboardShell from "@/features/dashboard/shared/components/DashboardShell";
import NotConnected from "@/features/dashboard/shared/components/NotConnected";

export default function TrazeSeo() {
  return (
    <DashboardShell>
      <header className="dashboard-topbar">
        <div className="dashboard-title">
          <span>Traze · SEO</span>
          <h1>SEO Index</h1>
          <p>City, service, and provider page coverage for organic search.</p>
        </div>
      </header>
      <NotConnected
        product="SEO"
        table="traffic.seo_index"
        description="SEO coverage metrics — city pages, service pages, provider pages, and sitemap health. Will be wired once the indexing pipeline is connected."
        items={[
          "City × service page index (total vs. published)",
          "Provider page crawlability and schema coverage",
          "Sitemap freshness and URL count",
          "Search visibility signals by category",
        ]}
      />
    </DashboardShell>
  );
}
