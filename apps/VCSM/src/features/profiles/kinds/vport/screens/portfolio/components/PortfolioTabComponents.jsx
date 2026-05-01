import { ArrowRight, CircleDollarSign, Clock3 } from "lucide-react";

export function SummaryStat({ icon: Icon, label, value }) {
  return (
    <article className="profiles-portfolio-stat-card">
      <div className="flex items-center gap-2 text-white/75">
        <Icon size={14} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
    </article>
  );
}

export function SecondaryButton({ onClick, label }) {
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

export function LoadingState() {
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

export function RelatedServiceCard({ service, canOpenServices, onOpenServices }) {
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
        <button type="button" onClick={() => onOpenServices?.()} className="profiles-portfolio-link-btn mt-5">
          <span>Open services</span>
          <ArrowRight size={15} />
        </button>
      ) : null}
    </article>
  );
}
