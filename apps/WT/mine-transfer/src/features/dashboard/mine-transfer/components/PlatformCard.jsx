import { Link } from "react-router-dom";
import KPIStat from "@/features/dashboard/mine-transfer/components/KPIStat";

export default function PlatformCard({
  to,
  name,
  eyebrow,
  description,
  status,
  statusTone = "blue",
  icon: Icon,
  metrics = [],
  primary = false,
  tone = "blue",
}) {
  return (
    <Link to={to} className={`mt-platform-card mt-platform-card--${tone}${primary ? " mt-platform-card--primary" : ""}`}>
      <div className="mt-platform-card__top">
        <span className="mt-platform-card__icon">
          {Icon ? <Icon size={24} strokeWidth={2.15} aria-hidden="true" /> : null}
        </span>
        <span className={`mt-status mt-status--${statusTone}`}>{status}</span>
      </div>

      <div className="mt-platform-card__body">
        <span className="mt-eyebrow">{eyebrow}</span>
        <h3>{name}</h3>
        <p>{description}</p>
      </div>

      <div className="mt-platform-card__metrics">
        {metrics.map((metric) => <KPIStat key={metric.label} {...metric} />)}
      </div>
    </Link>
  );
}
