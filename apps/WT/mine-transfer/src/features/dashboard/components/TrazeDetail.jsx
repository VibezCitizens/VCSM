import {
  BarChart3,
  Building2,
  Database,
  Gauge,
  LayoutDashboard,
  Mail,
  MapPin,
  Phone,
  Star,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { MetricCard, Panel } from "@/features/dashboard/components/dashboardPrimitives";
import {
  pct,
  CategoryBars,
  CompletenessFunnel,
  CityBars,
  QualityMatrix,
  ReviewPulse,
  QualityActions,
} from "@/features/dashboard/components/trazeDetailPanels";

const precise = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });

function QuickGlance({ totals }) {
  const photoShare = pct(totals.withAvatar, totals.providers);
  return (
    <section className="quick-glance" id="quick-glance" aria-label="Quick glance">
      <div className="quick-glance__heading">
        <span>Quick Glance</span>
        <h2>Providers · Coverage · Reviews</h2>
      </div>
      <div className="quick-glance__cards">
        <article className="quick-card quick-card--green">
          <div className="quick-card__topline">
            <span className="quick-card__icon"><LayoutDashboard size={20} strokeWidth={2.1} /></span>
            <span className="quick-card__status">Live</span>
          </div>
          <h3>Providers</h3>
          <strong>{totals.providers}</strong>
          <p>{totals.active} active in directory. {photoShare}% have a profile photo.</p>
          <div className="quick-card__kpis">
            <div><span>total</span><strong>{totals.providers}</strong></div>
            <div><span>active</span><strong>{totals.active}</strong></div>
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
            <div><span>cities</span><strong>{totals.cities}</strong></div>
            <div><span>categories</span><strong>{totals.categories}</strong></div>
            <div><span>with phone</span><strong>{totals.withPhone}</strong></div>
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
            <div><span>reviews</span><strong>{totals.reviews}</strong></div>
            <div><span>avg rating</span><strong>{precise.format(totals.avgRating)}</strong></div>
            <div><span>with hours</span><strong>{totals.withHours}</strong></div>
          </div>
        </article>
      </div>
    </section>
  );
}

export default function TrazeDetail({ data }) {
  const { totals, topCities, topCategories, recentReviews, quality } = data;

  return (
    <>
      <QuickGlance totals={totals} />

      <section className="metric-grid" id="analytics" aria-label="Traze metrics">
        <MetricCard icon={Users}  label="Total Providers" value={totals.providers} meta={`${totals.active} active in directory`}                           tone="green" />
        <MetricCard icon={MapPin} label="Cities Covered"  value={totals.cities}    meta={`across ${totals.categories} service categories`}                  tone="blue" />
        <MetricCard icon={Phone}  label="With Phone"      value={totals.withPhone} meta={`${pct(totals.withPhone, totals.providers)}% have a phone number`} tone="amber" />
        <MetricCard icon={Star}   label="Reviews"         value={totals.reviews}   meta={`${precise.format(totals.avgRating)} average rating`}              tone="rose" />
      </section>

      <section className="dashboard-grid dashboard-grid--primary">
        <Panel eyebrow="Directory" title="Providers by Category" action={<span>{totals.providers} total</span>} className="panel-wide">
          <CategoryBars categories={topCategories} />
        </Panel>
        <Panel eyebrow="Completeness" title="Profile Funnel">
          <CompletenessFunnel totals={totals} />
          <div className="conversion-note">
            <TrendingUp size={18} />
            <span>{totals.active} active of {totals.providers} total</span>
          </div>
        </Panel>
      </section>

      <section className="dashboard-grid dashboard-grid--secondary">
        <Panel eyebrow="Geography" title="Top Cities">
          <CityBars cities={topCities} />
        </Panel>
        <Panel eyebrow="Data Quality" title="Missing Fields" id="signals">
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

      <section className="dashboard-grid dashboard-grid--deep">
        <Panel eyebrow="Health" title="Connection Coverage" className="panel-wide">
          <div className="health-stack">
            <div><Database  size={20} /><span>Provider records</span>  <strong>{totals.providers}</strong></div>
            <div><MapPin    size={20} /><span>Cities mapped</span>      <strong>{totals.cities}</strong></div>
            <div><Building2 size={20} /><span>Categories active</span> <strong>{totals.categories}</strong></div>
            <div><Star      size={20} /><span>Reviews indexed</span>    <strong>{totals.reviews}</strong></div>
          </div>
        </Panel>
        <Panel eyebrow="Focus" title="Next Build">
          <div className="next-build-list">
            <div><BarChart3 size={18} /><span>Live analytics event tracking</span></div>
            <div><Phone     size={18} /><span>Call attribution by CTA location</span></div>
            <div><Mail      size={18} /><span>Business intake lead queue</span></div>
          </div>
        </Panel>
      </section>
    </>
  );
}
