import { Star, Clock, Briefcase, ExternalLink } from "lucide-react";
import { SectionCard } from "@/features/public/vportBusinessCard/view/components/BusinessCardSectionCard";

const DAY_ORDER = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const DAY_LABELS = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

function fmt12(t) {
  if (!t) return "";
  const [h, m] = String(t).split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, "0")} ${period}` : `${hour} ${period}`;
}

export function HoursSection({ hours }) {
  if (!hours || typeof hours !== "object") return null;
  const days = DAY_ORDER.filter((d) => hours[d]);
  if (!days.length) return null;

  return (
    <SectionCard icon={Clock} title="Hours">
      <div style={{ padding: "12px 18px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        {days.map((day) => {
          const entry = hours[day];
          const isClosed = entry?.closed === true || (!entry?.open && !entry?.close);
          return (
            <div key={day} style={HS.row}>
              <span style={HS.day}>{DAY_LABELS[day]}</span>
              <span style={{ ...HS.time, color: isClosed ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.78)" }}>
                {isClosed ? "Closed" : `${fmt12(entry?.open)} – ${fmt12(entry?.close)}`}
              </span>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

const HS = {
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  day: { fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.38)", width: 32, flexShrink: 0 },
  time: { fontSize: 13, fontWeight: 500 },
};

export function ReviewsSummarySection({ reviewCount, averageRating }) {
  if (!reviewCount || averageRating == null) return null;

  return (
    <SectionCard icon={Star} title="Reviews">
      <div style={RS.body}>
        <span style={RS.score}>{Number(averageRating).toFixed(1)}</span>
        <div style={RS.stars}>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} style={{ fontSize: 18, color: i < Math.round(averageRating) ? "#f59e0b" : "rgba(255,255,255,0.14)" }}>★</span>
          ))}
        </div>
        <span style={RS.count}>{reviewCount} review{reviewCount !== 1 ? "s" : ""}</span>
      </div>
    </SectionCard>
  );
}

const RS = {
  body: { padding: "18px", display: "flex", alignItems: "center", gap: 12 },
  score: { fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1 },
  stars: { display: "flex", gap: 2 },
  count: { fontSize: 12, color: "rgba(255,255,255,0.38)", fontWeight: 600 },
};

export function MenuSection({ slug }) {
  if (!slug) return null;
  const href = `https://vibezcitizens.com/vport/${slug}/menu`;
  return (
    <SectionCard icon={Briefcase} title="Menu">
      <div style={{ padding: "14px 18px 18px" }}>
        <a href={href} target="_blank" rel="noopener noreferrer" style={MS.btn}>
          <ExternalLink size={14} />
          View Full Menu
        </a>
      </div>
    </SectionCard>
  );
}

const MS = {
  btn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    width: "100%",
    borderRadius: 12,
    padding: "12px 16px",
    border: "1px solid rgba(124,92,255,0.32)",
    background: "rgba(124,92,255,0.10)",
    color: "#c4b5fd",
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
    boxSizing: "border-box",
  },
};

export function ServicesSection({ services }) {
  const list = Array.isArray(services) ? services.filter(Boolean) : [];
  if (!list.length) return null;

  return (
    <SectionCard icon={Briefcase} title="Services">
      <div style={{ padding: "12px 18px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map((svc, i) => (
          <div key={svc.id ?? i} style={SS.row}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={SS.name}>{svc.name}</div>
              {svc.description ? <div style={SS.desc}>{svc.description}</div> : null}
            </div>
            <div style={SS.meta}>
              {svc.price != null ? <span style={SS.price}>${Number(svc.price).toFixed(2)}</span> : null}
              {svc.duration_minutes ? <span style={SS.dur}>{svc.duration_minutes} min</span> : null}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

const SS = {
  row: { display: "flex", alignItems: "flex-start", gap: 12, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.05)" },
  name: { fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" },
  desc: { fontSize: 12, color: "rgba(255,255,255,0.40)", marginTop: 2, lineHeight: 1.45 },
  meta: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 },
  price: { fontSize: 13, fontWeight: 700, color: "#a78bfa" },
  dur: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
};
