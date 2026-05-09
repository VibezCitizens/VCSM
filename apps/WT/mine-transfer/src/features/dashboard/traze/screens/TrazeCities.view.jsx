import { AlertTriangle, Building2, Globe2, MapPin } from "lucide-react";
import { Panel } from "@/features/dashboard/components/dashboardPrimitives";
import DashboardShell from "@/features/dashboard/shared/components/DashboardShell";
import { useTrazeLocationIndex } from "@/features/dashboard/traze/hooks/useTrazeIndexData";

function State({ tone = "muted", children }) {
  return (
    <DashboardShell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: tone === "error" ? "var(--dash-rose)" : "var(--dash-muted)" }}>
        {children}
      </div>
    </DashboardShell>
  );
}

export default function TrazeCities() {
  const { status, data, error } = useTrazeLocationIndex();

  if (status === "loading") return <State>Loading location coverage...</State>;
  if (status === "error") return <State tone="error">{error?.message ?? "Failed to load locations"}</State>;

  return (
    <DashboardShell>
      <header className="dashboard-topbar">
        <div className="dashboard-title">
          <span>Traze · Locations</span>
          <h1>Country, City, Locality Coverage</h1>
          <p>Country-first provider index coverage. Neighborhood/locality is reported when available.</p>
        </div>
      </header>

      <section className="metric-grid" aria-label="Location stats">
        <div className="metric-card metric-card--blue">
          <div className="metric-card__topline"><Globe2 size={18} /><span>Countries</span></div>
          <strong>{data.countries.length}</strong>
          <p>{data.providerCount} providers</p>
        </div>
        <div className="metric-card metric-card--green">
          <div className="metric-card__topline"><Building2 size={18} /><span>Cities</span></div>
          <strong>{data.cities.length}</strong>
          <p>city or municipality rows</p>
        </div>
        <div className="metric-card metric-card--amber">
          <div className="metric-card__topline"><MapPin size={18} /><span>Localities</span></div>
          <strong>{data.neighborhoods.length}</strong>
          <p>neighborhoods, colonias, or localities</p>
        </div>
        <div className="metric-card metric-card--rose">
          <div className="metric-card__topline"><AlertTriangle size={18} /><span>Missing locality</span></div>
          <strong>{data.missingNeighborhood}</strong>
          <p>provider rows without locality</p>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid--primary">
        <Panel eyebrow="Countries" title="Provider Counts" className="panel-wide">
          <div className="traze-provider-list">
            {data.countries.map((country) => (
              <article className="traze-provider-row" key={country.countryCode}>
                <div className="traze-provider-main">
                  <div className="traze-provider-titleline">
                    <h3>{country.countryCode}</h3>
                    <span className="traze-provider-source">{country.providerCount} providers</span>
                  </div>
                  <div className="traze-provider-tags">
                    <span>{country.cityCount} cities</span>
                    <span>{country.missingNeighborhood} missing locality</span>
                  </div>
                </div>
              </article>
            ))}
            {data.countries.length === 0 ? <p className="traze-provider-empty">No countries available.</p> : null}
          </div>
        </Panel>

        <Panel eyebrow="Cities" title="Top City Coverage">
          <div className="health-stack">
            {data.cities.slice(0, 12).map((city) => (
              <div key={`${city.countryCode}:${city.citySlug ?? city.cityName}`}>
                <MapPin size={20} />
                <span>{city.cityName}, {city.countryCode}</span>
                <strong>{city.providerCount}</strong>
              </div>
            ))}
            {data.cities.length === 0 ? <p style={{ color: "var(--dash-muted)" }}>No city rows available.</p> : null}
          </div>
        </Panel>
      </section>
    </DashboardShell>
  );
}
