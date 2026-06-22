import { useActorSummary } from "@hydration";
import { LANE_COLORS } from "./scheduleConstants";

export default function BarberLaneHeader({ lane, colorIdx }) {
  const color         = LANE_COLORS[colorIdx % LANE_COLORS.length];
  const memberActorId = lane.resource.member_actor_id;
  const summary       = useActorSummary(memberActorId);

  // Final safety guard. The schedule controller already drops resources whose
  // linked member actor is deleted/void/missing (loadDaySchedule.controller).
  // If a staff resource with a member link still reaches the UI but its actor
  // cannot be resolved, suppress the lane rather than render a ghost
  // "User / No schedule set" header.
  if (memberActorId && summary?.missing) return null;

  // Only trust the actor summary for member-linked lanes. For a member-less
  // resource (e.g. a solo vport's primary calendar) fall back to the resource's
  // own name instead of the generic "User" placeholder useActorSummary returns
  // for a null actor id.
  const name    = (memberActorId ? summary?.displayName : null) ?? lane.resource.name ?? "Barber";
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
