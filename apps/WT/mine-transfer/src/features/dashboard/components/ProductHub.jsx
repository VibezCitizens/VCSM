import { Activity, Building2, Database, LayoutDashboard } from "lucide-react";

const PRODUCTS = [
  {
    key: "traze",
    name: "Traze",
    icon: Activity,
    tone: "blue",
    description: "Directory · SEO · Provider funnel",
  },
  {
    key: "vcsm",
    name: "VCSM",
    icon: LayoutDashboard,
    tone: "green",
    description: "Social commerce · Actors · Booking",
  },
  {
    key: "wentrex",
    name: "Wentrex",
    icon: Database,
    tone: "amber",
    description: "Multi-tenant LMS · Orgs · Courses",
  },
  {
    key: "tripoint",
    name: "Tripoint",
    icon: Building2,
    tone: "rose",
    description: "Lock & Key · Reviews · Phone CTA",
  },
];

function TrazeKpis({ totals }) {
  if (!totals) {
    return (
      <div className="quick-card__kpis">
        <div><span>providers</span><strong>—</strong></div>
        <div><span>cities</span><strong>—</strong></div>
        <div><span>reviews</span><strong>—</strong></div>
      </div>
    );
  }
  return (
    <div className="quick-card__kpis">
      <div><span>providers</span><strong>{totals.providers}</strong></div>
      <div><span>cities</span><strong>{totals.cities}</strong></div>
      <div><span>reviews</span><strong>{totals.reviews}</strong></div>
    </div>
  );
}

function PlaceholderKpis() {
  return (
    <div className="quick-card__kpis">
      <div style={{ gridColumn: "1 / -1" }}>
        <span>status</span>
        <strong style={{ fontSize: "0.72rem", whiteSpace: "normal" }}>Not connected yet</strong>
      </div>
    </div>
  );
}

export default function ProductHub({ activeProduct, onSelect, trazeStats }) {
  return (
    <section className="quick-glance" aria-label="Product hub">
      <div className="quick-glance__heading">
        <span>Product Hub</span>
        <h2>Select a product to inspect</h2>
      </div>

      <div
        className="quick-glance__cards"
        style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
      >
        {PRODUCTS.map(({ key, name, icon: Icon, tone, description }) => {
          const isActive = activeProduct === key;
          return (
            <article
              key={key}
              className={`quick-card quick-card--${tone}`}
              onClick={() => onSelect(key)}
              aria-current={isActive ? "true" : undefined}
              style={{
                cursor:     isActive ? "default" : "pointer",
                outline:    isActive ? "2px solid rgba(255,255,255,0.55)" : "none",
                outlineOffset: "3px",
                opacity:    isActive ? 1 : 0.68,
                transition: "opacity 0.15s, outline 0.15s",
              }}
            >
              <div className="quick-card__topline">
                <span className="quick-card__icon">
                  <Icon size={20} strokeWidth={2.1} />
                </span>
                <span className="quick-card__status">{isActive ? "Active" : "Select"}</span>
              </div>

              <h3>{name}</h3>

              <strong>
                {key === "traze" && trazeStats
                  ? trazeStats.totals.providers
                  : "—"}
              </strong>

              <p>
                {key === "traze" && trazeStats
                  ? `${trazeStats.totals.active} active across ${trazeStats.totals.cities} cities.`
                  : description}
              </p>

              {key === "traze"
                ? <TrazeKpis totals={trazeStats?.totals ?? null} />
                : <PlaceholderKpis />}
            </article>
          );
        })}
      </div>
    </section>
  );
}
