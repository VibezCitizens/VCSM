import { Activity, Building2, Database, LayoutDashboard } from "lucide-react";
import { Panel } from "@/features/dashboard/components/dashboardPrimitives";

const PRODUCT_CONFIG = {
  vcsm: {
    name: "VCSM",
    icon: LayoutDashboard,
    description: "Social commerce platform — actors, content, booking, and storefronts.",
    modules: [
      "Actor profiles (citizens & VPORTs)",
      "Content feed (Vibes & Sparks)",
      "Booking engine",
      "In-app chat",
      "Storefront management",
    ],
    roadmap: [
      "Actor KPI dashboard",
      "Booking conversion metrics",
      "Content reach analytics",
      "District activity heatmap",
    ],
  },
  wentrex: {
    name: "Wentrex",
    icon: Database,
    description: "Multi-tenant LMS SaaS — organizations, courses, and learner progress.",
    modules: [
      "Organization management",
      "Course builder",
      "Enrollment tracking",
      "Completion & certification",
      "Instructor analytics",
    ],
    roadmap: [
      "Enrollment funnel dashboard",
      "Course completion rates",
      "Organization revenue overview",
      "Learner engagement heatmap",
    ],
  },
  tripoint: {
    name: "Tripoint",
    icon: Building2,
    description: "Lock & key business site — reviews, phone CTA, and service areas.",
    modules: [
      "Business profile (via VCSM VPORT)",
      "Review management",
      "Phone call tracking",
      "Service area coverage",
    ],
    roadmap: [
      "Call attribution by CTA location",
      "Review velocity tracker",
      "Service area coverage map",
      "Lead intake queue",
    ],
  },
};

const dot = (color) => ({
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: color,
  flexShrink: 0,
});

const listItem = { fontSize: "0.875rem", display: "flex", gap: "0.5rem", alignItems: "center" };

export default function ProductPlaceholder({ product }) {
  const config = PRODUCT_CONFIG[product];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <section className="quick-glance" aria-label={`${config.name} placeholder`}>
      <div className="quick-glance__heading">
        <span>{config.name}</span>
        <h2>Not connected yet</h2>
      </div>

      <div className="dashboard-grid dashboard-grid--primary" style={{ marginTop: 0 }}>
        <Panel
          eyebrow="Product"
          title={config.name}
          className="panel-wide"
          action={
            <span style={{ color: "var(--dash-muted)", fontSize: "0.78rem" }}>
              No data source connected
            </span>
          }
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <span className="quick-card__icon">
              <Icon size={22} />
            </span>
            <p style={{ margin: 0, color: "var(--dash-muted)", fontSize: "0.9rem" }}>
              {config.description}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--dash-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                Available modules
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {config.modules.map((m) => (
                  <li key={m} style={{ ...listItem, color: "var(--dash-text)" }}>
                    <span style={dot("var(--dash-muted)")} />
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--dash-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                Coming next
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {config.roadmap.map((r) => (
                  <li key={r} style={{ ...listItem, color: "var(--dash-muted)" }}>
                    <span style={{ ...dot("var(--dash-green)"), opacity: 0.5 }} />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>
      </div>
    </section>
  );
}
