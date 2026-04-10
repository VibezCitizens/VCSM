import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleDollarSign,
  Clock3,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";

import useVportServices from "@/features/profiles/kinds/vport/hooks/services/useVportServices";
import useBookingServiceProfiles from "@/features/booking/hooks/useBookingServiceProfiles";

import PortfolioCard from "@/features/profiles/kinds/vport/screens/portfolio/PortfolioCard";
import PortfolioEmptyState from "@/features/profiles/kinds/vport/screens/portfolio/PortfolioEmptyState";
import PortfolioGrid from "@/features/profiles/kinds/vport/screens/portfolio/PortfolioGrid";
import PortfolioSection from "@/features/profiles/kinds/vport/screens/portfolio/PortfolioSection";
import PortfolioTagChips from "@/features/profiles/kinds/vport/screens/portfolio/PortfolioTagChips";
import PortfolioTransformationCard from "@/features/profiles/kinds/vport/screens/portfolio/PortfolioTransformationCard";
import {
  buildRelatedServices,
  buildVportPortfolioModel,
  filterPortfolioItems,
  getPortfolioFilterKeyAll,
} from "@/features/profiles/kinds/vport/screens/portfolio/vportPortfolio.model";

import "@/features/profiles/styles/profiles-portfolio-modern.css";

function hasTab(tabs, key) {
  return (Array.isArray(tabs) ? tabs : []).some((tab) => tab?.key === key);
}

function SummaryStat({ icon: Icon, label, value }) {
  return (
    <article className="profiles-portfolio-stat-card">
      <div className="flex items-center gap-2 text-white/75">
        <Icon size={14} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
    </article>
  );
}

function SecondaryButton({ onClick, label }) {
  if (typeof onClick !== "function") return null;

  return (
    <button type="button" onClick={onClick} className="profiles-pill-btn px-4 py-2 text-sm font-semibold">
      <span className="inline-flex items-center gap-2">
        <span>{label}</span>
        <ArrowRight size={15} />
      </span>
    </button>
  );
}

function LoadingState() {
  return (
    <section className="profiles-portfolio-hero rounded-[1.7rem] p-5 sm:p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-3 w-28 rounded-full bg-white/10" />
        <div className="h-8 w-64 rounded-full bg-white/10" />
        <div className="h-4 w-full max-w-2xl rounded-full bg-white/10" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-24 rounded-2xl bg-white/8" />
          <div className="h-24 rounded-2xl bg-white/8" />
          <div className="h-24 rounded-2xl bg-white/8" />
        </div>
      </div>
    </section>
  );
}

function RelatedServiceCard({ service, canOpenServices, onOpenServices }) {
  if (!service) return null;

  return (
    <article className="profiles-portfolio-related-service">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-white">{service.label}</div>
          {service.category ? (
            <div className="mt-1 text-xs uppercase tracking-[0.12em] text-white/70/68">
              {service.category}
            </div>
          ) : null}
        </div>

        <div className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/80">
          {service.workCount} {service.workCount === 1 ? "example" : "examples"}
        </div>
      </div>

      {(service.durationLabel || service.priceLabel) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {service.durationLabel ? (
            <span className="profiles-portfolio-meta-pill">
              <Clock3 size={13} />
              <span>{service.durationLabel}</span>
            </span>
          ) : null}
          {service.priceLabel ? (
            <span className="profiles-portfolio-meta-pill">
              <CircleDollarSign size={13} />
              <span>{service.priceLabel}</span>
            </span>
          ) : null}
        </div>
      ) : null}

      {canOpenServices ? (
        <button
          type="button"
          onClick={() => onOpenServices?.()}
          className="profiles-portfolio-link-btn mt-5"
        >
          <span>Open services</span>
          <ArrowRight size={15} />
        </button>
      ) : null}
    </article>
  );
}

export default function PortfolioTab({
  profile,
  posts = [],
  loadingPosts = false,
  availableTabs = [],
  onSelectTab = null,
}) {
  const actorId = profile?.actorId ?? profile?.actor_id ?? null;
  const vportType = profile?.vportType ?? profile?.vport_type ?? null;

  const servicesState = useVportServices({
    targetActorId: actorId,
    vportType,
    asOwner: false,
  });

  const services = useMemo(
    () => (Array.isArray(servicesState.data?.services) ? servicesState.data.services : []),
    [servicesState.data?.services]
  );

  const serviceIds = useMemo(
    () => services.map((service) => service?.id).filter(Boolean),
    [services]
  );

  const serviceProfilesState = useBookingServiceProfiles({
    serviceIds,
    enabled: serviceIds.length > 0,
    includeNonBookable: true,
  });

  const serviceProfiles = useMemo(
    () => (Array.isArray(serviceProfilesState.data) ? serviceProfilesState.data : []),
    [serviceProfilesState.data]
  );

  const portfolioData = useMemo(
    () =>
      buildVportPortfolioModel({
        posts,
        services,
        serviceProfiles,
      }),
    [posts, services, serviceProfiles]
  );

  const [activeFilter, setActiveFilter] = useState(getPortfolioFilterKeyAll());

  useEffect(() => {
    if (activeFilter === getPortfolioFilterKeyAll()) return;
    const stillExists = portfolioData.filters.some((filter) => filter.key === activeFilter);
    if (!stillExists) {
      setActiveFilter(getPortfolioFilterKeyAll());
    }
  }, [activeFilter, portfolioData.filters]);

  const filteredItems = useMemo(
    () => filterPortfolioItems(portfolioData.items, activeFilter),
    [portfolioData.items, activeFilter]
  );

  const featuredTransformations = useMemo(
    () => filteredItems.filter((item) => item.type === "transformation").slice(0, 2),
    [filteredItems]
  );

  const recentWorkItems = useMemo(() => {
    const featuredIds = new Set(featuredTransformations.map((item) => item.id));
    let candidates = filteredItems.filter(
      (item) => item.type !== "transformation" && !featuredIds.has(item.id)
    );

    if (!candidates.length) {
      candidates = filteredItems.filter((item) => !featuredIds.has(item.id));
    }

    return candidates.length ? candidates : filteredItems;
  }, [filteredItems, featuredTransformations]);

  const relatedServices = useMemo(
    () => buildRelatedServices(filteredItems),
    [filteredItems]
  );

  const hasServicesTab = hasTab(availableTabs, "services");
  const hasReviewsTab = hasTab(availableTabs, "reviews");

  const openServices = () => onSelectTab?.("services");
  const openReviews = () => onSelectTab?.("reviews");

  if (loadingPosts) {
    return <LoadingState />;
  }

  if (!portfolioData.items.length) {
    return (
      <PortfolioEmptyState
        profile={profile}
        services={services}
        servicesLoading={servicesState.isLoading}
        canOpenServices={hasServicesTab}
        canOpenReviews={hasReviewsTab}
        onOpenServices={openServices}
        onOpenReviews={openReviews}
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="profiles-portfolio-hero rounded-[1.7rem] p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,1fr)] lg:items-end">
          <div>
            <div className="profiles-portfolio-kicker">Proof of work</div>
            <h2 className="mt-3 text-2xl font-semibold text-white sm:text-[2rem]">
              What this business actually does
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70/78 sm:text-[0.95rem]">
              Portfolio examples, visual transformations, and service-linked work make the offering concrete for clients before they book, call, or visit.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {hasServicesTab ? <SecondaryButton onClick={openServices} label="Browse services" /> : null}
              {hasReviewsTab ? <SecondaryButton onClick={openReviews} label="Read reviews" /> : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <SummaryStat
              icon={ImageIcon}
              label="Work samples"
              value={portfolioData.summary.workCount}
            />
            <SummaryStat
              icon={Sparkles}
              label="Transformations"
              value={portfolioData.summary.transformationCount}
            />
            <SummaryStat
              icon={BriefcaseBusiness}
              label="Categories"
              value={portfolioData.summary.categoryCount}
            />
          </div>
        </div>
      </section>

      {featuredTransformations.length ? (
        <PortfolioSection
          eyebrow="Featured Transformations"
          title="Before-and-after work"
          subtitle="Clear paired results make it easy to understand the starting point, the finish, and the level of change this business can deliver."
        >
          <PortfolioGrid
            items={featuredTransformations}
            variant="transformations"
            renderItem={(item) => (
              <PortfolioTransformationCard
                key={item.id}
                item={item}
                canOpenServices={hasServicesTab}
                onOpenServices={openServices}
              />
            )}
          />
        </PortfolioSection>
      ) : null}

      {recentWorkItems.length ? (
        <PortfolioSection
          eyebrow="Recent Work"
          title="Published examples"
          subtitle="Recent image sets show the kind of projects, finishes, and outcomes this profile is actively producing."
        >
          <PortfolioGrid
            items={recentWorkItems}
            renderItem={(item) => (
              <PortfolioCard
                key={item.id}
                item={item}
                canOpenServices={hasServicesTab}
                onOpenServices={openServices}
              />
            )}
          />
        </PortfolioSection>
      ) : null}

      <PortfolioSection
        eyebrow="Specialties"
        title="Tags, categories, and work types"
        subtitle="These filters help visitors zero in on the kinds of work they care about most, whether that is a transformation, a specific service, or a recurring style."
      >
        <PortfolioTagChips
          items={portfolioData.filters}
          activeKey={activeFilter}
          onSelect={setActiveFilter}
        />

        {!filteredItems.length ? (
          <div className="profiles-subcard mt-4 rounded-2xl border border-white/12 bg-white/[0.03] p-4 text-sm text-white/70/75">
            No work matches this filter yet. Try another tag to explore the full showcase.
          </div>
        ) : null}
      </PortfolioSection>

      {relatedServices.length ? (
        <PortfolioSection
          eyebrow="Service Links"
          title="Related services"
          subtitle="When a portfolio entry lines up with a service, the connection appears here so visitors can tie outcomes back to what is offered."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {relatedServices.map((service) => (
              <RelatedServiceCard
                key={service.key}
                service={service}
                canOpenServices={hasServicesTab}
                onOpenServices={openServices}
              />
            ))}
          </div>
        </PortfolioSection>
      ) : null}

      {servicesState.error ? (
        <div className="profiles-subcard rounded-2xl border border-white/12 bg-white/[0.03] p-4 text-sm text-white/70/72">
          Service links could not be loaded right now, but the portfolio showcase is still available.
        </div>
      ) : null}
    </div>
  );
}
