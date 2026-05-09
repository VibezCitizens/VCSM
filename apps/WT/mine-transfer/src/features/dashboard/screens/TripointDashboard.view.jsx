import { useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  Database,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
} from "lucide-react";
import { useDashboardStats } from "@/features/dashboard/hooks/useDashboardStats";
import { Panel } from "@/features/dashboard/components/dashboardPrimitives";
import ProductHub from "@/features/dashboard/components/ProductHub";
import TrazeDetail from "@/features/dashboard/components/TrazeDetail";
import ProductPlaceholder from "@/features/dashboard/components/ProductPlaceholder";
import "./TripointDashboard.css";

const pct = (v, t) => (t > 0 ? Math.round((v / t) * 100) : 0);
const shortDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" }) : "—";

const PRODUCT_NAV = [
  { key: "traze",    label: "Traze",    icon: Activity },
  { key: "vcsm",    label: "VCSM",     icon: LayoutDashboard },
  { key: "wentrex", label: "Wentrex",  icon: Database },
  { key: "tripoint",label: "Tripoint", icon: Building2 },
];

export default function TripointDashboard() {
  const [activeProduct, setActiveProduct] = useState("traze");
  const { status, data, error } = useDashboardStats();

  if (status === "loading") {
    return (
      <main className="dashboard-shell">
        <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "var(--dash-muted)", fontSize: "0.95rem" }}>
          Loading dashboard data…
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="dashboard-shell">
        <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "var(--dash-rose)", fontSize: "0.95rem" }}>
          Failed to load: {error?.message ?? "Unknown error"}
        </div>
      </main>
    );
  }

  const { totals, fetchedAt } = data;
  const profileScore = pct(
    totals.withAvatar + totals.withPhone + totals.withHours,
    totals.providers * 3
  );

  return (
    <main className="dashboard-shell">
      {/* ── Sidebar ── */}
      <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
        <div className="brand-lockup">
          <span className="brand-lockup__mark">
            <LockKeyhole size={22} />
          </span>
          <div>
            <strong>VCSM</strong>
            <span>Product Hub</span>
          </div>
        </div>

        <nav className="sidebar-menu" aria-label="Product navigation">
          {PRODUCT_NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`sidebar-menu__item${activeProduct === key ? " sidebar-menu__item--active" : ""}`}
              onClick={() => setActiveProduct(key)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="snapshot-card">
          <Database size={18} />
          <div>
            <span>Live Supabase feed</span>
            <strong>Updated {shortDate(fetchedAt)}</strong>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-title">
            <span>Dashboard</span>
            <h1>Product Hub</h1>
            <p>Select a product to inspect its data, health, and roadmap.</p>
          </div>
          <div className="topbar-actions">
            <label className="dashboard-search">
              <Search size={17} />
              <input aria-label="Search dashboard" placeholder="Search signals" type="search" />
            </label>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>
          </div>
        </header>

        <ProductHub
          activeProduct={activeProduct}
          onSelect={setActiveProduct}
          trazeStats={data}
        />

        {activeProduct === "traze"
          ? <TrazeDetail data={data} />
          : <ProductPlaceholder product={activeProduct} />}
      </section>

      {/* ── Rail ── */}
      <aside className="dashboard-rail" aria-label="Product summary">
        {activeProduct === "traze" ? (
          <>
            <Panel eyebrow="Score" title="Profile Health">
              <div className="rail-score">
                <Gauge size={24} />
                <strong>{profileScore}%</strong>
                <span>completeness</span>
              </div>
              <div className="rail-list">
                <div><span>Total providers</span>    <strong>{totals.providers}</strong></div>
                <div><span>Active in directory</span><strong>{totals.active}</strong></div>
                <div><span>Cities covered</span>     <strong>{totals.cities}</strong></div>
                <div><span>Reviews indexed</span>    <strong>{totals.reviews}</strong></div>
              </div>
            </Panel>

            <Panel eyebrow="Focus" title="Next Build">
              <div className="next-build-list">
                <div><BarChart3 size={18} /><span>Live Supabase analytics feed</span></div>
                <div><Phone     size={18} /><span>Call attribution by CTA</span></div>
                <div><Mail      size={18} /><span>Business intake lead queue</span></div>
                <div><MapPin    size={18} /><span>City page SEO index</span></div>
                <div><Star      size={18} /><span>Review velocity tracker</span></div>
              </div>
            </Panel>
          </>
        ) : (
          <Panel eyebrow="Status" title="Not Connected">
            <p style={{ color: "var(--dash-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Select <strong>Traze</strong> to see live data. Other products will be wired as dashboards are built.
            </p>
          </Panel>
        )}
      </aside>
    </main>
  );
}
