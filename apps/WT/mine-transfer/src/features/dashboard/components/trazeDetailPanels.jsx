import { CircleDot, TrendingUp } from "lucide-react";
import { Stars } from "@/features/dashboard/components/dashboardPrimitives";

export const pct = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);

export function CategoryBars({ categories }) {
  const max = Math.max(...categories.map((c) => c.count), 1);
  return (
    <div className="source-bars">
      {categories.map((cat) => (
        <div className="source-row" key={cat.key}>
          <div className="source-row__copy">
            <span>
              {cat.label}
              {cat.isLive === false ? " · not live yet" : ""}
            </span>
            <strong>{cat.count}</strong>
          </div>
          <div className="source-row__meter" aria-hidden="true">
            <span
              className="source-row__fill source-row__fill--green"
              style={{ width: `${pct(cat.count, max)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CompletenessFunnel({ totals }) {
  const steps = [
    { label: "Total providers",     value: totals.providers },
    { label: "Have profile photo",  value: totals.withAvatar },
    { label: "Have phone number",   value: totals.withPhone },
    { label: "Have business hours", value: totals.withHours },
    { label: "Have booking link",   value: totals.withBooking },
  ];
  const max = totals.providers || 1;
  return (
    <div className="funnel">
      {steps.map((step) => (
        <div className="funnel__step" key={step.label}>
          <div className="funnel__label">
            <span>{step.label}</span>
            <strong>{step.value}</strong>
          </div>
          <div className="funnel__rail" aria-hidden="true">
            <span style={{ width: `${Math.max(5, pct(step.value, max))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CityBars({ cities }) {
  const max = Math.max(...cities.map((c) => c.count), 1);
  return (
    <div className="source-bars">
      {cities.map((city) => (
        <div className="source-row" key={city.slug}>
          <div className="source-row__copy">
            <span>{city.name}</span>
            <strong>{city.count}</strong>
          </div>
          <div className="source-row__meter" aria-hidden="true">
            <span
              className="source-row__fill source-row__fill--blue"
              style={{ width: `${pct(city.count, max)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function QualityMatrix({ quality }) {
  const rows = [
    { label: "Missing profile photo",  desc: "No avatar URL set",             count: quality.missingAvatar },
    { label: "Missing phone number",   desc: "No phone set",                  count: quality.missingPhone },
    { label: "Missing business hours", desc: "Hours field is null",            count: quality.missingHours },
    { label: "Missing booking link",   desc: "No booking_url set",             count: quality.missingBooking },
    { label: "Missing city",           desc: "No city_slug set",               count: quality.missingCity },
    { label: "Missing service",        desc: "No category_key set",            count: quality.missingService },
  ];
  return (
    <div className="device-matrix">
      {rows.map((row) => (
        <div className="device-row" key={row.label}>
          <CircleDot size={16} />
          <div>
            <strong>{row.label}</strong>
            <span>{row.desc}</span>
          </div>
          <em>{row.count}</em>
        </div>
      ))}
    </div>
  );
}

export function ReviewPulse({ reviews }) {
  const shortDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" }) : "—";

  if (!reviews.length) {
    return <p style={{ color: "var(--dash-muted)", fontSize: "0.9rem" }}>No reviews yet.</p>;
  }
  return (
    <div className="review-pulse">
      {reviews.map((r) => (
        <article className="review-pulse__item" key={r.review_id}>
          <div className="review-pulse__meta">
            <strong>{r.author_display_name_snapshot ?? "Anonymous"}</strong>
            <span>{shortDate(r.review_activity_at)}</span>
            <Stars rating={r.overall_rating} />
          </div>
          <p>{r.body ?? "—"}</p>
        </article>
      ))}
    </div>
  );
}

export function QualityActions({ quality }) {
  const items = [
    quality.missingAvatar  > 0 && { label: "Add profile photos",    metric: `${quality.missingAvatar} providers`,  detail: "Providers without a photo rank lower and reduce click-through on directory pages." },
    quality.missingPhone   > 0 && { label: "Complete phone numbers", metric: `${quality.missingPhone} providers`,   detail: "Phone is the primary conversion CTA for locksmith and service categories." },
    quality.missingHours   > 0 && { label: "Fill in business hours", metric: `${quality.missingHours} providers`,   detail: "Missing hours reduces trust signals for service-based businesses." },
    quality.missingBooking > 0 && { label: "Add booking links",      metric: `${quality.missingBooking} providers`, detail: "Booking links enable direct conversion from directory pages." },
    quality.missingCity    > 0 && { label: "Add city to profile",    metric: `${quality.missingCity} providers`,    detail: "City is required for geographic directory indexing." },
    quality.missingService > 0 && { label: "Set service category",   metric: `${quality.missingService} providers`, detail: "Category is required for service directory pages." },
  ].filter(Boolean);

  if (!items.length) {
    return (
      <p style={{ color: "var(--dash-green)", fontSize: "0.9rem", fontWeight: 700 }}>
        All quality checks pass.
      </p>
    );
  }
  return (
    <div className="action-queue">
      {items.map((item) => (
        <article className="action-queue__item" key={item.label}>
          <TrendingUp size={18} />
          <div>
            <div>
              <strong>{item.label}</strong>
              <span>{item.metric}</span>
            </div>
            <p>{item.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
