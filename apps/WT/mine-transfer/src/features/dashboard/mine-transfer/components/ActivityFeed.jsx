import { Activity, CheckCircle2, Clock3, Star } from "lucide-react";

const iconMap = {
  review: Star,
  health: CheckCircle2,
  queue: Clock3,
  default: Activity,
};

export default function ActivityFeed({ items = [] }) {
  return (
    <div className="mt-activity-feed">
      {items.map((item) => {
        const Icon = iconMap[item.kind] ?? iconMap.default;
        return (
          <article className="mt-activity-item" key={`${item.title}-${item.meta}`}>
            <span className="mt-activity-item__icon"><Icon size={16} strokeWidth={2.15} /></span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
            <span className="mt-activity-item__meta">{item.meta}</span>
          </article>
        );
      })}
    </div>
  );
}
