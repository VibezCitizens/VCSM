import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileCheck,
  Gauge,
  Layers3,
  MapPin,
  PhoneCall,
  Plus,
  SearchX,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { useDashboardStats } from "@/features/dashboard/hooks/useDashboardStats";
import ActivityFeed from "@/features/dashboard/mine-transfer/components/ActivityFeed";
import DashboardSection from "@/features/dashboard/mine-transfer/components/DashboardSection";
import DashboardShell from "@/features/dashboard/mine-transfer/components/DashboardShell";
import HeaderBar from "@/features/dashboard/mine-transfer/components/HeaderBar";
import PlatformCard from "@/features/dashboard/mine-transfer/components/PlatformCard";
import QuickActionButton from "@/features/dashboard/mine-transfer/components/QuickActionButton";
import "@/features/dashboard/mine-transfer/mineTransferDashboard.css";

const formatNumber = new Intl.NumberFormat("en");
const formatRating = (value) => (Number.isFinite(value) && value > 0 ? value.toFixed(1) : "0.0");
const pct = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);

function LoadingState() {
  return (
    <DashboardShell>
      <div className="mt-state-view">
        <div className="mt-loading-mark" />
        <h1>Loading ecosystem command center</h1>
        <p>Reading existing dashboard data.</p>
      </div>
    </DashboardShell>
  );
}

function ErrorState({ error }) {
  return (
    <DashboardShell>
      <div className="mt-state-view">
        <SearchX size={28} strokeWidth={2.1} />
        <h1>Dashboard data did not load</h1>
        <p>{error?.message ?? "The existing dashboard read path returned an unknown error."}</p>
      </div>
    </DashboardShell>
  );
}

function buildTrazeMetrics(data) {
  const { totals, quality, topCities } = data;
  const readiness = pct(
    totals.withAvatar + totals.withPhone + totals.withHours + totals.withBooking,
    totals.providers * 4
  );

  return [
    { label: "Providers", value: formatNumber.format(totals.providers), detail: `${formatNumber.format(totals.active)} active`, tone: "blue", icon: Building2 },
    { label: "Active countries", value: "1", detail: "From connected country codes", tone: "cyan", icon: MapPin },
    { label: "Top cities", value: formatNumber.format(topCities.length), detail: `${formatNumber.format(totals.cities)} total cities`, tone: "green", icon: CircleDot },
    { label: "Indexing health", value: `${readiness}%`, detail: `${quality.missingService} missing service`, tone: "amber", icon: Gauge },
    { label: "Seeded businesses", value: formatNumber.format(totals.providers), detail: "Provider records", tone: "blue", icon: Users },
    { label: "Unclaimed", value: formatNumber.format(totals.unclaimed), detail: `${formatNumber.format(totals.claimed)} claimed`, tone: "rose", icon: ShieldCheck },
    { label: "Live categories", value: formatNumber.format(totals.liveCategories), detail: `${formatNumber.format(totals.categories)} total`, tone: "green", icon: Wrench },
    { label: "Reviews", value: formatNumber.format(totals.reviews), detail: `${formatRating(totals.avgRating)} average`, tone: "amber", icon: Star },
  ];
}

function buildActivity(data) {
  const reviewItems = data.recentReviews.slice(0, 3).map((review) => ({
    kind: "review",
    title: review.author_display_name_snapshot ?? "Review signal",
    description: review.body || "Review body not provided.",
    meta: `${review.overall_rating ?? 0}/5`,
  }));

  return [
    {
      kind: "health",
      title: "Traze provider index ready",
      description: `${formatNumber.format(data.totals.providers)} providers across ${formatNumber.format(data.totals.cities)} cities are available to the overview.`,
      meta: "Live",
    },
    ...reviewItems,
    {
      kind: "queue",
      title: "Quality queue available",
      description: `${formatNumber.format(data.quality.missingPhone)} providers need phone data and ${formatNumber.format(data.quality.missingHours)} need hours data.`,
      meta: "Focus",
    },
  ];
}

function buildPlatformCards(data) {
  const trazeMetrics = buildTrazeMetrics(data);

  return [
    {
      to: "/dashboard/traze",
      name: "Traze",
      eyebrow: "Primary platform",
      description: "Country-first provider directory, SEO inventory, category coverage, and claim-readiness signals.",
      status: "Live data",
      statusTone: "green",
      icon: Activity,
      tone: "traze",
      primary: true,
      metrics: trazeMetrics,
    },
    {
      to: "/dashboard/vcsm",
      name: "VCSM",
      eyebrow: "Citizen network",
      description: "Actor identity, VPORT surfaces, booking pathways, storefronts, and profile growth monitoring.",
      status: "Placeholder",
      statusTone: "amber",
      icon: Layers3,
      tone: "vcsm",
      metrics: [
        { label: "VPORT count", value: "Pending", detail: "Needs VCSM data read", tone: "blue", icon: Users },
        { label: "Business cards", value: "Pending", detail: "UI placeholder", tone: "cyan", icon: FileCheck },
        { label: "Booking activity", value: "Pending", detail: "Not wired", tone: "amber", icon: Clock3 },
        { label: "Profile growth", value: "Pending", detail: "Not wired", tone: "green", icon: TrendingUp },
      ],
    },
    {
      to: "/dashboard/tripoint",
      name: "Locksmith Tripoint",
      eyebrow: "Service operations",
      description: "Locksmith service areas, emergency demand, technician readiness, and lead response surface.",
      status: "Placeholder",
      statusTone: "amber",
      icon: Building2,
      tone: "tripoint",
      metrics: [
        { label: "Service areas", value: "Pending", detail: "Needs Tripoint source", tone: "blue", icon: MapPin },
        { label: "Emergency requests", value: "Pending", detail: "Not wired", tone: "rose", icon: PhoneCall },
        { label: "Technicians", value: "Pending", detail: "UI placeholder", tone: "green", icon: ShieldCheck },
        { label: "Reviews", value: "Pending", detail: "Not wired", tone: "amber", icon: Star },
      ],
    },
  ];
}

export default function MineTransferDashboard() {
  const { status, data, error } = useDashboardStats();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState error={error} />;

  const platformCards = buildPlatformCards(data);
  const activityItems = buildActivity(data);

  return (
    <DashboardShell fetchedAt={data.fetchedAt}>
      <HeaderBar />

      <section className="mt-hero-panel">
        <div className="mt-hero-panel__copy">
          <span className="mt-eyebrow">Ecosystem command center</span>
          <h1>Vibez Citizens operations overview</h1>
          <p>
            Premium multi-platform dashboard for VCSM, Traze, and Locksmith Tripoint. Traze is the active data-backed platform in this overview.
          </p>
        </div>
        <div className="mt-hero-panel__actions">
          <QuickActionButton to="/dashboard/traze" icon={Activity}>Open Traze</QuickActionButton>
          <QuickActionButton to="/dashboard/traze/providers" icon={Plus} variant="secondary">Providers</QuickActionButton>
        </div>
      </section>

      <DashboardSection
        eyebrow="Overview"
        title="Platform command cards"
        description="Each platform card routes to its dedicated dashboard section. Traze is emphasized because it has connected data in this project."
        action={<span className="mt-status mt-status--cyan"><Sparkles size={13} /> Read-only UI</span>}
      >
        <div className="mt-platform-grid">
          {platformCards.map((card) => <PlatformCard key={card.name} {...card} />)}
        </div>
      </DashboardSection>

      <div className="mt-lower-grid">
        <DashboardSection
          eyebrow="Actions"
          title="Quick actions"
          description="Navigation-only actions. No processing or data mutation is connected here."
          className="mt-section--compact"
        >
          <div className="mt-action-list">
            <QuickActionButton to="/dashboard/traze" icon={Activity}>Open Traze overview</QuickActionButton>
            <QuickActionButton to="/dashboard/traze/categories" icon={Wrench} variant="secondary">Review categories</QuickActionButton>
            <QuickActionButton to="/dashboard/traze/locations" icon={MapPin} variant="secondary">Inspect locations</QuickActionButton>
            <QuickActionButton to="/dashboard/traze/seeds" icon={Sprout} variant="secondary">Seed intake</QuickActionButton>
            <QuickActionButton to="/dashboard/traze/claims" icon={ShieldCheck} variant="secondary">Claim queue</QuickActionButton>
          </div>
        </DashboardSection>

        <DashboardSection
          eyebrow="Activity"
          title="Recent ecosystem signals"
          description="Built from existing Traze dashboard stats and review summaries."
          className="mt-section--compact mt-section--activity"
        >
          <ActivityFeed items={activityItems} />
        </DashboardSection>
      </div>
    </DashboardShell>
  );
}
