import { useActorSummary } from "@hydration";
import { LANE_COLORS } from "./scheduleConstants";

export default function BarberLaneHeader({ lane, colorIdx }) {
  const color   = LANE_COLORS[colorIdx % LANE_COLORS.length];
  const summary = useActorSummary(lane.resource.member_actor_id);
  const name    = summary?.displayName ?? lane.resource.name ?? "Barber";
  const avatar  = (!summary?.missing && summary?.avatar && summary.avatar !== "/avatar.jpg") ? summary.avatar : null;
  const initial = String(name)[0].toUpperCase();

  const { bookingCount, isWorking, hasRules } = lane;
  let metaText = "No schedule set";
  if (hasRules && isWorking)  metaText = `${bookingCount} booking${bookingCount !== 1 ? "s" : ""} today`;
  if (hasRules && !isWorking) metaText = "Closed today";

  return (
    <div className="sched-lane-header">
      {avatar ? (
        <img src={avatar} alt={name} className="sched-lane-header-avatar" style={{ border: `1px solid ${color.border}` }} onError={(e) => { e.currentTarget.src = "/avatar.jpg"; }} />
      ) : (
        <div className="sched-lane-header-initial" style={{ background: color.bg, border: `1px solid ${color.border}`, color: color.text }}>
          {initial}
        </div>
      )}
      <div className="sched-lane-header-info">
        <div className="sched-lane-header-name">{name}</div>
        <div className="sched-lane-header-meta">{metaText}</div>
      </div>
      {hasRules && (
        <span className="sched-lane-header-badge" style={{ background: isWorking ? color.bg : "rgba(255,255,255,0.05)", border: `1px solid ${isWorking ? color.border : "rgba(255,255,255,0.08)"}`, color: isWorking ? color.text : "rgba(255,255,255,0.3)" }}>
          {isWorking ? "Open" : "Closed"}
        </span>
      )}
    </div>
  );
}
