import { ArrowRight, CircleDollarSign, Clock3, FolderOpen, Sparkles, Tag } from "lucide-react";

import {
  formatPortfolioTagLabel,
  getPortfolioContentTypes,
} from "@/features/profiles/kinds/vport/screens/portfolio/vportPortfolio.model";

const CONTENT_TYPES = getPortfolioContentTypes();

function MetaPill({ icon: Icon, label }) {
  if (!label) return null;

  return (
    <span className="profiles-portfolio-meta-pill">
      <Icon size={13} />
      <span>{label}</span>
    </span>
  );
}

function TagList({ tags = [] }) {
  if (!Array.isArray(tags) || !tags.length) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span key={tag} className="profiles-portfolio-tag">
          {formatPortfolioTagLabel(tag)}
        </span>
      ))}
    </div>
  );
}

function WorkTypeLabel({ item }) {
  if (!item) return null;

  if (item.type === CONTENT_TYPES.GALLERY) {
    return (
      <span className="profiles-portfolio-media-badge">
        <FolderOpen size={13} />
        <span>{item.galleryImages?.length || 0} images</span>
      </span>
    );
  }

  if (item.type === CONTENT_TYPES.TRANSFORMATION) {
    return (
      <span className="profiles-portfolio-media-badge">
        <Sparkles size={13} />
        <span>Transformation</span>
      </span>
    );
  }

  return (
    <span className="profiles-portfolio-media-badge">
      <Tag size={13} />
      <span>Work sample</span>
    </span>
  );
}

export default function PortfolioCard({
  item,
  onOpenServices = null,
  canOpenServices = false,
}) {
  if (!item?.coverImage?.url) return null;

  return (
    <article className="profiles-portfolio-card">
      <div className="profiles-portfolio-media-wrap">
        <img
          src={item.coverImage.url}
          alt={item.title ? `${item.title} portfolio example` : "Portfolio example"}
          loading="lazy"
          className="profiles-portfolio-media-img"
        />

        <div className="profiles-portfolio-media-top">
          <WorkTypeLabel item={item} />
          {item.createdAtLabel ? (
            <span className="profiles-portfolio-date-pill">{item.createdAtLabel}</span>
          ) : null}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="profiles-portfolio-card-title text-base font-semibold text-white sm:text-lg">
              {item.title || "Recent work"}
            </h4>
            {item.description ? (
              <p className="profiles-portfolio-body-copy mt-2">
                {item.description}
              </p>
            ) : (
              <p className="profiles-portfolio-body-copy mt-2">
                Published work that helps visitors understand the outcome, finish, and quality of this business.
              </p>
            )}
          </div>
        </div>

        {(item.serviceLabel || item.durationLabel || item.priceLabel) ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <MetaPill icon={Tag} label={item.serviceLabel} />
            <MetaPill icon={Clock3} label={item.durationLabel} />
            <MetaPill icon={CircleDollarSign} label={item.priceLabel} />
          </div>
        ) : null}

        <TagList tags={item.tags} />

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
