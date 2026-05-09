import { Link } from "react-router-dom";
import { Activity, Building2, Database, LayoutDashboard } from "lucide-react";
import DashboardShell from "@/features/dashboard/shared/components/DashboardShell";

const PRODUCTS = [
  {
    to:          "/dashboard/traze",
    key:         "traze",
    name:        "Traze",
    icon:        Activity,
    tone:        "blue",
    status:      "Live",
    description: "Provider directory, SEO funnel, and data quality signals. Real business profiles indexed and ranked for local search.",
    note:        "Supabase connected",
  },
  {
    to:          "/dashboard/vcsm",
    key:         "vcsm",
    name:        "VCSM",
    icon:        LayoutDashboard,
    tone:        "green",
    status:      "Building",
    description: "Social commerce platform — actor identities, vibes feed, booking, storefronts, and citizen districts.",
    note:        "Not connected yet",
  },
  {
    to:          "/dashboard/wentrex",
    key:         "wentrex",
    name:        "Wentrex",
    icon:        Database,
    tone:        "amber",
    status:      "Building",
    description: "Multi-tenant LMS SaaS — organizations, courses, cohorts, and learner progress dashboards.",
    note:        "Not connected yet",
  },
  {
    to:          "/dashboard/tripoint",
    key:         "tripoint",
    name:        "Tripoint",
    icon:        Building2,
    tone:        "rose",
    status:      "Building",
    description: "Tripoint Lock & Keys — review showcase, phone CTA, service area coverage, and lead capture.",
    note:        "Not connected yet",
  },
];

function ProductCard({ to, name, icon: Icon, tone, status, description, note }) {
  const isLive = status === "Live";
  return (
    <Link to={to} className={`product-card product-card--${tone}`}>
      <div className="product-card__head">
        <span className="product-card__icon">
          <Icon size={22} strokeWidth={2} />
        </span>
        <span className={`product-card__badge product-card__badge--${isLive ? "live" : "building"}`}>
          {status}
        </span>
      </div>

      <div className="product-card__body">
        <strong className="product-card__name">{name}</strong>
        <p className="product-card__desc">{description}</p>
      </div>

      <div className="product-card__foot">
        <span className={`product-card__foot-note${isLive ? " product-card__foot-note--live" : ""}`}>
          {isLive ? (
            <>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--dash-green)", display: "inline-block", marginRight: "0.35rem" }} />
              {note}
            </>
          ) : note}
        </span>
        <span className="product-card__foot-cta">Open →</span>
      </div>
    </Link>
  );
}

export default function DashboardHub() {
  return (
    <DashboardShell>
      <header className="dashboard-topbar">
        <div className="dashboard-title">
          <span>Dashboard</span>
          <h1>Product Hub</h1>
          <p>Select a product to open its dashboard.</p>
        </div>
      </header>

      <div className="hub-summary">
        <div className="hub-summary__item">
          <span className="hub-summary__dot hub-summary__dot--green" />
          <strong>1</strong> live data source
        </div>
        <div className="hub-summary__item">
          <span className="hub-summary__dot hub-summary__dot--muted" />
          <strong>3</strong> in development
        </div>
        <div className="hub-summary__item">
          <strong>4</strong> total products
        </div>
      </div>

      <div className="hub-grid">
        {PRODUCTS.map((p) => <ProductCard key={p.key} {...p} />)}
      </div>
    </DashboardShell>
  );
}
