import { ArrowRight, ArrowRightLeft, CircleDollarSign, Clock3, Sparkles, Tag } from "lucide-react";

import { formatPortfolioTagLabel } from "@/features/profiles/kinds/vport/screens/portfolio/vportPortfolio.model";

function CompareFrame({ image, label, alt }) {
  if (!image?.url) return null;

  return (
    <div className="profiles-portfolio-compare-frame">
      <img
        src={image.url}
        alt={alt}
        loading="lazy"
        className="profiles-portfolio-compare-image"
      />
      <span className="profiles-portfolio-compare-label">{label}</span>
    </div>
  );
}

function MetaPill({ icon: Icon, label }) {
  if (!label) return null;

  return (
    <span className="profiles-portfolio-meta-pill">
      <Icon size={13} />
      <span>{label}</span>
    </span>
  );
}

export default function PortfolioTransformationCard({
  item,
  onOpenServices = null,
  canOpenServices = false,
}) {
  if (!item?.beforeImage?.url || !item?.afterImage?.url) return null;

  return (
    <article className="profiles-portfolio-card profiles-portfolio-transformation-card">
      <div className="p-4 pb-0 sm:p-5 sm:pb-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="profiles-portfolio-media-badge">
            <ArrowRightLeft size={13} />
            <span>Transformation</span>
          </span>

          {item.createdAtLabel ? (
            <span className="profiles-portfolio-date-pill">{item.createdAtLabel}</span>
          ) : null}
        </div>

        <div className="mt-4">
          <h4 className="text-lg font-semibold text-white">
            {item.title || "Transformation"}
          </h4>
          <p className="profiles-portfolio-body-copy mt-2">
            {item.description ||
              "A clear before-and-after result that shows the starting point and the finished work."}
          </p>
        </div>
      </div>

      <div className="profiles-portfolio-compare-grid mt-5 px-4 sm:px-5">
        <CompareFrame
          image={item.beforeImage}
          label="Before"
          alt={item.title ? `${item.title} before` : "Before result"}
        />
        <CompareFrame
          image={item.afterImage}
          label="After"
          alt={item.title ? `${item.title} after` : "After result"}
        />
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <MetaPill icon={Tag} label={item.serviceLabel} />
          <MetaPill icon={Clock3} label={item.durationLabel} />
          <MetaPill icon={CircleDollarSign} label={item.priceLabel} />
        </div>

        {Array.isArray(item.tags) && item.tags.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span key={tag} className="profiles-portfolio-tag">
                {formatPortfolioTagLabel(tag)}
              </span>
            ))}
          </div>
        ) : null}

        {canOpenServices && item.serviceLabel ? (
          <button
            type="button"
            onClick={() => onOpenServices?.()}
            className="profiles-portfolio-link-btn mt-5"
          >
            <span>Open services</span>
            <ArrowRight size={15} />
          </button>
        ) : null}
      </div>
    </article>
  );
}
