import { BriefcaseBusiness, MessageSquareMore, Tag } from "lucide-react";

function ActionButton({ onClick, label, icon: Icon }) {
  if (typeof onClick !== "function") return null;

  return (
    <button type="button" onClick={onClick} className="profiles-pill-btn px-4 py-2 text-sm font-semibold">
      <span className="inline-flex items-center gap-2">
        <Icon size={15} />
        <span>{label}</span>
      </span>
    </button>
  );
}

export default function PortfolioEmptyState({
  profile = null,
  services = [],
  servicesLoading = false,
  canOpenServices = false,
  canOpenReviews = false,
  onOpenServices = null,
  onOpenReviews = null,
}) {
  const servicePreview = (Array.isArray(services) ? services : []).slice(0, 6);
  const remainingCount = Math.max(0, (Array.isArray(services) ? services.length : 0) - servicePreview.length);
  const businessName = profile?.displayName ?? profile?.username ?? "This business";

  return (
    <section className="profiles-portfolio-empty-state">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.9fr)] lg:items-start">
        <div>
          <div className="profiles-portfolio-kicker">Portfolio</div>
          <h3 className="mt-3 text-xl font-semibold text-white">
            No work examples published yet
          </h3>
          <p className="profiles-portfolio-empty-copy mt-2">
            {businessName} has not published any portfolio work yet. Until then, the clearest signal for what they do is their live services and reviews.
          </p>

          {(canOpenServices || canOpenReviews) ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {canOpenServices ? (
                <ActionButton onClick={onOpenServices} label="View services" icon={Tag} />
              ) : null}
              {canOpenReviews ? (
                <ActionButton onClick={onOpenReviews} label="Read reviews" icon={MessageSquareMore} />
              ) : null}
            </div>
          ) : null}
        </div>

        <aside className="profiles-portfolio-empty-aside">
          <div className="flex items-center gap-2 text-white">
            <BriefcaseBusiness size={15} />
            <span className="text-sm font-semibold">Published services</span>
          </div>

          {servicesLoading ? (
            <div className="mt-4 text-sm text-white/70/70">Loading services...</div>
          ) : servicePreview.length ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {servicePreview.map((service) => (
                  <span
                    key={service?.id ?? service?.key ?? service?.label}
                    className="profiles-portfolio-service-chip"
                  >
                    {service?.label ?? service?.key ?? "Service"}
                  </span>
                ))}
              </div>

              <p className="profiles-portfolio-empty-meta mt-4">
                {remainingCount > 0
                  ? `Plus ${remainingCount} more published service${remainingCount === 1 ? "" : "s"}.`
                  : "Services are live even though portfolio examples are not yet published."}
              </p>
            </>
          ) : (
            <p className="profiles-portfolio-empty-meta mt-4">
              No services are published yet on this profile.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
