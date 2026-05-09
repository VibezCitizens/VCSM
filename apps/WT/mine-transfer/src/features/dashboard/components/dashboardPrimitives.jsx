import { Star } from "lucide-react";

export function MetricCard({ icon: Icon, label, value, meta, tone = "green" }) {
  return (
    <section className={`metric-card metric-card--${tone}`} aria-label={label}>
      <div className="metric-card__topline">
        <span className="metric-card__icon">
          <Icon size={18} strokeWidth={2.2} />
        </span>
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      <p>{meta}</p>
    </section>
  );
}

export function Panel({ eyebrow, title, action, children, className = "", id }) {
  return (
    <section className={`dashboard-panel ${className}`} id={id}>
      <div className="panel-heading">
        <div>
          {eyebrow ? <span>{eyebrow}</span> : null}
          <h2>{title}</h2>
        </div>
        {action ? <div className="panel-heading__action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Stars({ rating }) {
  const count = Math.round(rating ?? 0);
  return (
    <span className="stars" aria-label={`${count} star rating`}>
      {Array.from({ length: count }, (_, i) => (
        <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  );
}
