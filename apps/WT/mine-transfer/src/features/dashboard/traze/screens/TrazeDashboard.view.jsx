import {
  BarChart3, Bell, FileCheck, Gauge, Inbox, Mail, MapPin,
  Phone, Search, Star, TrendingUp, Users, Wrench,
} from "lucide-react";
import { useDashboardStats } from "@/features/dashboard/hooks/useDashboardStats";
import { MetricCard, Panel } from "@/features/dashboard/components/dashboardPrimitives";
import {
  pct,
  CategoryBars,
  CityBars,
  CompletenessFunnel,
  QualityMatrix,
  QualityActions,
  ReviewPulse,
} from "@/features/dashboard/components/trazeDetailPanels";
import DashboardShell from "@/features/dashboard/shared/components/DashboardShell";

const precise = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });

function TrazeRail({ totals }) {
  const profileScore = pct(
    totals.withAvatar + totals.withPhone + totals.withHours,
    totals.providers * 3
  );
  return (
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
          <div><BarChart3 size={18} /><span>Live analytics event tracking</span></div>
          <div><Phone     size={18} /><span>Call attribution by CTA</span></div>
          <div><Mail      size={18} /><span>Business intake lead queue</span></div>
          <div><MapPin    size={18} /><span>City page SEO index</span></div>
          <div><Star      size={18} /><span>Review velocity tracker</span></div>
        </div>
      </Panel>
    </>
  );
}

export default function TrazeDashboard() {
  const { status, data, error } = useDashboardStats();

  if (status === "loading") {
    return (
      <DashboardShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "var(--dash-muted)", fontSize: "0.95rem" }}>
          Loading Traze data…
        </div>
      </DashboardShell>
    );
  }

  if (status === "error") {
    return (
      <DashboardShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "var(--dash-rose)", fontSize: "0.95rem" }}>
          Failed to load: {error?.message ?? "Unknown error"}
        </div>
      </DashboardShell>
    );
  }

  const { totals, topCities, topCategories, recentReviews, quality, fetchedAt } = data;
  const photoShare = pct(totals.withAvatar, totals.providers);

  return (
    <DashboardShell rail={<TrazeRail totals={totals} />} fetchedAt={fetchedAt}>
      {/* Topbar */}
      <header className="dashboard-topbar">
        <div className="dashboard-title">
          <span>Traze</span>
          <h1>Directory Analytics</h1>
          <p>Provider health, coverage, and data quality signals.</p>
        </div>
        <div className="topbar-actions">
          <label className="dashboard-search">
            <Search size={17} />
            <input aria-label="Search Traze" placeholder="Search providers" type="search" />
          </label>
          <button className="icon-button" aria-label="Notifications">
            <Bell size={18} />
          </button>
        </div>
      </header>

      {/* A — Quick Glance */}
      <section className="quick-glance" aria-label="Quick glance">
        <div className="quick-glance__heading">
          <span>Quick Glance</span>
          <h2>Providers · Coverage · Reviews</h2>
        </div>
        <div className="quick-glance__cards">
          <article className="quick-card quick-card--green">
            <div className="quick-card__topline">
              <span className="quick-card__icon"><Users size={20} strokeWidth={2.1} /></span>
              <span className="quick-card__status">Live</span>
            </div>
            <h3>Providers</h3>
            <strong>{totals.providers}</strong>
            <p>{totals.active} active. {photoShare}% have a profile photo.</p>
            <div className="quick-card__kpis">
              <div><span>total</span>     <strong>{totals.providers}</strong></div>
              <div><span>active</span>    <strong>{totals.active}</strong></div>
              <div><span>with photo</span><strong>{totals.withAvatar}</strong></div>
            </div>
          </article>

          <article className="quick-card quick-card--blue">
            <div className="quick-card__topline">
              <span className="quick-card__icon"><MapPin size={20} strokeWidth={2.1} /></span>
              <span className="quick-card__status">Coverage</span>
            </div>
            <h3>Cities &amp; Services</h3>
            <strong>{totals.cities}</strong>
            <p>{totals.cities} cities across {totals.categories} service categories.</p>
            <div className="quick-card__kpis">
              <div><span>cities</span>     <strong>{totals.cities}</strong></div>
              <div><span>categories</span> <strong>{totals.categories}</strong></div>
              <div><span>with phone</span> <strong>{totals.withPhone}</strong></div>
            </div>
          </article>

          <article className="quick-card quick-card--amber">
            <div className="quick-card__topline">
              <span className="quick-card__icon"><Star size={20} strokeWidth={2.1} /></span>
              <span className="quick-card__status">Trust</span>
            </div>
            <h3>Reviews</h3>
            <strong>{totals.reviews}</strong>
            <p>{precise.format(totals.avgRating)} avg rating across {totals.reviews} approved reviews.</p>
            <div className="quick-card__kpis">
              <div><span>reviews</span>   <strong>{totals.reviews}</strong></div>
              <div><span>avg rating</span><strong>{precise.format(totals.avgRating)}</strong></div>
              <div><span>with hours</span><strong>{totals.withHours}</strong></div>
            </div>
          </article>
        </div>
      </section>

      {/* B — Provider Health */}
      <section className="metric-grid" id="analytics" aria-label="Provider health">
        <MetricCard icon={Users}  label="Total Providers" value={totals.providers} meta={`${totals.active} active in directory`}                            tone="green" />
        <MetricCard icon={MapPin} label="Cities Covered"  value={totals.cities}    meta={`across ${totals.categories} service categories`}                   tone="blue" />
        <MetricCard icon={Phone}  label="With Phone"      value={totals.withPhone} meta={`${pct(totals.withPhone, totals.providers)}% have a phone number`}  tone="amber" />
        <MetricCard icon={Star}   label="Reviews"         value={totals.reviews}   meta={`${precise.format(totals.avgRating)} average rating`}               tone="rose" />
      </section>

      <section className="dashboard-grid dashboard-grid--primary">
        <Panel
          eyebrow="Directory"
          title="Providers by Category"
          action={
            <span style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span>{totals.providers} total</span>
              <a href="/dashboard/traze/categories" style={{ fontSize: "0.78rem", color: "var(--dash-blue)", textDecoration: "none", fontWeight: 600 }}>
                All categories →
              </a>
            </span>
          }
          className="panel-wide"
        >
          <CategoryBars categories={topCategories.filter((c) => c.count > 0).slice(0, 10)} />
        </Panel>
        <Panel eyebrow="Completeness" title="Profile Funnel">
          <CompletenessFunnel totals={totals} />
          <div className="conversion-note">
            <TrendingUp size={18} />
            <span>{totals.active} active of {totals.providers} total</span>
          </div>
        </Panel>
      </section>

      {/* C — Operations */}
      <section className="dashboard-grid dashboard-grid--primary" id="operations" aria-label="Operations">
        <Panel eyebrow="Intake" title="Business Intake Leads" className="panel-wide">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <Inbox size={28} style={{ color: "var(--dash-muted)", flexShrink: 0, marginTop: "0.15rem" }} />
            <p style={{ color: "var(--dash-muted)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: "var(--dash-text)" }}>Seed intake</strong> is available for read-only review, missing-data checks, and write-path staging.
            </p>
          </div>
        </Panel>
        <Panel eyebrow="Claims" title="Business Claim Requests">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <FileCheck size={28} style={{ color: "var(--dash-muted)", flexShrink: 0, marginTop: "0.15rem" }} />
            <p style={{ color: "var(--dash-muted)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: "var(--dash-text)" }}>traffic.business_claim_requests</strong> not wired yet. Claim queue will appear here once connected.
            </p>
          </div>
        </Panel>
      </section>

      {/* D — Data Quality */}
      <section className="dashboard-grid dashboard-grid--secondary" id="quality">
        <Panel eyebrow="Geography" title="Top Cities">
          <CityBars cities={topCities} />
        </Panel>
        <Panel eyebrow="Data Quality" title="Missing Fields">
          <QualityMatrix quality={quality} />
        </Panel>
        <Panel eyebrow="Coverage" title="Profile Fields">
          <div className="health-stack">
            <div><Gauge  size={20} /><span>With photo</span>  <strong>{totals.withAvatar}</strong></div>
            <div><Phone  size={20} /><span>With phone</span>  <strong>{totals.withPhone}</strong></div>
            <div><Wrench size={20} /><span>With hours</span>  <strong>{totals.withHours}</strong></div>
            <div><Mail   size={20} /><span>With booking</span><strong>{totals.withBooking}</strong></div>
          </div>
        </Panel>
      </section>

      <section className="dashboard-grid dashboard-grid--deep">
        <Panel eyebrow="Trust" title="Recent Reviews" action={<span>{totals.reviews} approved</span>} className="panel-wide">
          <ReviewPulse reviews={recentReviews} />
        </Panel>
        <Panel eyebrow="Queue" title="Quality Actions">
          <QualityActions quality={quality} />
        </Panel>
      </section>
    </DashboardShell>
  );
}
