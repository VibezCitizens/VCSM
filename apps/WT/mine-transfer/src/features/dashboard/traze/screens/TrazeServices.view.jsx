import { Boxes, Globe2, Layers3 } from "lucide-react";
import { Panel } from "@/features/dashboard/components/dashboardPrimitives";
import DashboardShell from "@/features/dashboard/shared/components/DashboardShell";
import { useTrazeCategoryIndex } from "@/features/dashboard/traze/hooks/useTrazeIndexData";

function State({ tone = "muted", children }) {
  return (
    <DashboardShell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: tone === "error" ? "var(--dash-rose)" : "var(--dash-muted)" }}>
        {children}
      </div>
    </DashboardShell>
  );
}

export default function TrazeServices() {
  const { status, data: categories, error } = useTrazeCategoryIndex();

  if (status === "loading") return <State>Loading live categories...</State>;
  if (status === "error") return <State tone="error">{error?.message ?? "Failed to load categories"}</State>;

  const countryCount = new Set(categories.map((category) => category.countryCode).filter(Boolean)).size;
  const providerCount = categories.reduce((sum, category) => sum + category.providerCount, 0);
  const cityCount = categories.reduce((sum, category) => sum + category.cityCount, 0);

  return (
    <DashboardShell>
      <header className="dashboard-topbar">
        <div className="dashboard-title">
          <span>Traze · Categories</span>
          <h1>Live Categories</h1>
          <p>Derived only from active, indexable provider index rows. No static category filler.</p>
        </div>
      </header>

      <section className="metric-grid" aria-label="Category stats">
        <div className="metric-card metric-card--blue">
          <div className="metric-card__topline"><Boxes size={18} /><span>Live services</span></div>
          <strong>{categories.length}</strong>
          <p>provider_count above zero</p>
        </div>
        <div className="metric-card metric-card--green">
          <div className="metric-card__topline"><Globe2 size={18} /><span>Countries</span></div>
          <strong>{countryCount}</strong>
          <p>with live categories</p>
        </div>
        <div className="metric-card metric-card--amber">
          <div className="metric-card__topline"><Layers3 size={18} /><span>Provider links</span></div>
          <strong>{providerCount}</strong>
          <p>{cityCount} service-city signals</p>
        </div>
      </section>

      <Panel eyebrow="Provider index" title={`${categories.length} live category rows`} className="panel-wide">
        {categories.length === 0 ? (
          <div className="traze-provider-empty">
            <Boxes size={22} />
            <p>No live categories are available from the VPORT provider index.</p>
          </div>
        ) : (
          <div className="traze-provider-list">
            {categories.map((category) => (
              <article className="traze-provider-row" key={`${category.countryCode}:${category.serviceKey}`}>
                <div className="traze-provider-main">
                  <div className="traze-provider-titleline">
                    <h3>{category.serviceName}</h3>
                    <span className="traze-provider-source">{category.countryCode ?? "Unknown country"}</span>
                  </div>
                  <div className="traze-provider-tags">
                    <span>{category.categoryName}</span>
                    <span>{category.providerCount} providers</span>
                    <span>{category.cityCount} cities</span>
                    <span>{category.vportCount} vport</span>
                    <span>{category.seedCount} seed</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </DashboardShell>
  );
}
