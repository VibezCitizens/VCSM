import { LANE_COLORS, STATUS_CONFIG } from "./scheduleConstants";
import { clampPx, timeToPx, isoToLocalHHMM, formatHHMM } from "./scheduleTimeUtils";
import { HOUR_HEIGHT } from "./scheduleConstants";

export function WorkingZone({ rule, colorIdx }) {
  const color  = LANE_COLORS[colorIdx % LANE_COLORS.length];
  const topPx  = clampPx(timeToPx(rule.start_time));
  const botPx  = clampPx(timeToPx(rule.end_time));
  const height = Math.max(0, botPx - topPx);
  if (height <= 0) return null;
  return (
    <div
      className="sched-working-zone"
      style={{
        top: topPx, height,
        background: `linear-gradient(180deg, ${color.bg} 0%, rgba(139,92,246,0.03) 100%)`,
        borderLeft: `2px solid ${color.border}`,
      }}
    />
  );
}

export function CurrentTimeLine({ pxTop }) {
  if (pxTop === null) return null;
  return (
    <div className="sched-now-line" style={{ top: pxTop }}>
      <div className="sched-now-dot" />
      <div className="sched-now-rule" />
    </div>
  );
}

export function BookingBlock({ booking, colorIdx, onClick }) {
  const color      = LANE_COLORS[colorIdx % LANE_COLORS.length];
  const startHHMM  = isoToLocalHHMM(booking.starts_at);
  const topPx      = clampPx(timeToPx(startHHMM));
  const durationPx = Math.max(20, ((booking.duration_minutes || 30) / 60) * HOUR_HEIGHT);
  const statusCfg  = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.confirmed;
  const dotColor   = statusCfg.dot ?? color.dot;
  const isDimmed   = booking.status === "completed" || booking.status === "cancelled";

  return (
    <div
      className="sched-block"
      style={{
        top: topPx, height: durationPx,
        background: isDimmed ? "rgba(255,255,255,0.05)" : color.bg,
        border: `1px solid ${isDimmed ? "rgba(255,255,255,0.08)" : color.border}`,
        opacity: isDimmed ? 0.55 : 1,
      }}
      onClick={(e) => { e.stopPropagation(); onClick(booking); }}
      role="button"
      aria-label={`${booking.service_label_snapshot} — ${booking.customer_name || "Client"}`}
    >
      <div className="sched-block-status-dot" style={{ background: dotColor }} />
      <div className="sched-block-service" style={{ color: isDimmed ? "rgba(255,255,255,0.5)" : color.text }}>
        {booking.service_label_snapshot || "Appointment"}
      </div>
      {durationPx >= 36 && <div className="sched-block-customer">{booking.customer_name || "Client"}</div>}
      {durationPx >= 52 && <div className="sched-block-time">{formatHHMM(startHHMM)}</div>}
    </div>
  );
}
