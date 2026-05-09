import { useMemo } from "react";
import { LANE_COLORS } from "./scheduleConstants";
import { formatHHMM, isoToLocalHHMM } from "./scheduleTimeUtils";

const SDISP = {
  pending:   { label: "Pending",   text: "rgba(251,191,36,.9)",  bg: "rgba(251,191,36,.1)",  border: "rgba(251,191,36,.18)" },
  confirmed: { label: "Confirmed", text: "rgba(52,211,153,.9)",  bg: "rgba(52,211,153,.1)",  border: "rgba(52,211,153,.18)" },
  completed: { label: "Done",      text: "rgba(56,189,248,.9)",  bg: "rgba(56,189,248,.1)",  border: "rgba(56,189,248,.18)" },
  cancelled: { label: "Cancelled", text: "rgba(252,165,165,.6)", bg: "rgba(239,68,68,.06)",  border: "rgba(239,68,68,.12)"  },
  no_show:   { label: "No Show",   text: "rgba(251,191,36,.7)",  bg: "rgba(245,158,11,.07)", border: "rgba(245,158,11,.14)" },
};

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return formatHHMM(isoToLocalHHMM(iso));
}

function StatPill({ value, label, valueColor }) {
  return (
    <div style={{
      flex: 1, borderRadius: 12, border: "1px solid rgba(148,163,184,.1)",
      background: "rgba(15,23,42,.65)", padding: "10px 8px", textAlign: "center",
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: valueColor ?? "rgba(255,255,255,.9)", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: "rgba(148,163,184,.45)", marginTop: 4, fontWeight: 600, letterSpacing: ".04em" }}>
        {label}
      </div>
    </div>
  );
}

function BookingCard({ booking, laneColor, resourceName, showResource, isNext, onClick }) {
  const isTerminal = ["cancelled", "no_show", "completed"].includes(booking.status);
  const sd = SDISP[booking.status] ?? SDISP.confirmed;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(booking)}
      onKeyDown={(e) => e.key === "Enter" && onClick(booking)}
      style={{
        borderRadius: 14,
        border: `1px solid ${isNext ? "rgba(139,92,246,.35)" : isTerminal ? "rgba(255,255,255,.05)" : "rgba(148,163,184,.12)"}`,
        background: isNext ? "rgba(139,92,246,.08)" : isTerminal ? "rgba(255,255,255,.015)" : "rgba(15,23,42,.7)",
        overflow: "hidden", opacity: isTerminal ? 0.6 : 1, cursor: "pointer",
        transition: "border-color .15s",
      }}
    >
      {isNext && (
        <div style={{
          padding: "5px 14px", fontSize: 10, fontWeight: 800, letterSpacing: ".08em",
          color: "rgba(167,139,250,.9)", background: "rgba(139,92,246,.15)",
          borderBottom: "1px solid rgba(139,92,246,.2)",
        }}>
          ▶ NEXT UP
        </div>
      )}
      <div style={{ padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ flexShrink: 0, width: 56, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: isTerminal ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.9)", lineHeight: 1 }}>
            {formatTime(booking.starts_at)}
          </div>
          {booking.duration_minutes > 0 && (
            <div style={{ fontSize: 10, color: "rgba(148,163,184,.4)", marginTop: 3 }}>
              {booking.duration_minutes}m
            </div>
          )}
        </div>
        <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,.07)", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 3 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.9)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {booking.customer_name || "Client"}
            </div>
            <span style={{
              flexShrink: 0, fontSize: 10, fontWeight: 700, letterSpacing: ".05em",
              color: sd.text, background: sd.bg, border: `1px solid ${sd.border}`,
              borderRadius: 6, padding: "2px 7px",
            }}>
              {sd.label}
            </span>
          </div>
          {booking.service_label_snapshot && (
            <div style={{ fontSize: 12, color: "rgba(148,163,184,.55)" }}>
              {booking.service_label_snapshot}
            </div>
          )}
          {showResource && resourceName && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: laneColor.dot, flexShrink: 0 }} />
              <div style={{ fontSize: 11, color: "rgba(148,163,184,.4)" }}>{resourceName}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ScheduleOperationalView({
  lanes, isToday, openCreateModal, onBookingClick, onViewTimeline,
}) {
  const { allBookings, stats, nextUpId, openHours, isOpen } = useMemo(() => {
    const now = Date.now();
    const flat = [];
    for (let i = 0; i < lanes.length; i++) {
      const lane = lanes[i];
      for (const b of lane.bookings) {
        flat.push({ ...b, _laneIdx: i, _resourceName: lane.resource?.name ?? `Staff ${i + 1}` });
      }
    }
    flat.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));

    const active   = flat.filter(b => b.status !== "cancelled");
    const upcoming = active.filter(b => !["completed", "no_show", "cancelled"].includes(b.status) && new Date(b.starts_at).getTime() > now);
    const done     = active.filter(b => ["completed", "no_show"].includes(b.status));
    const pending  = active.filter(b => b.status === "pending");

    const candidate = flat.find(b =>
      !["completed", "no_show", "cancelled"].includes(b.status) &&
      new Date(b.starts_at).getTime() >= now - 30 * 60 * 1000
    );

    let openHours = null;
    let isOpenFlag = false;
    for (const lane of lanes) {
      if (lane.hasRules && lane.isWorking && lane.dayRules?.length > 0) {
        isOpenFlag = true;
        const first = lane.dayRules[0];
        const last  = lane.dayRules[lane.dayRules.length - 1];
        openHours = `${formatHHMM(first.start_time)} – ${formatHHMM(last.end_time)}`;
        break;
      }
    }

    return {
      allBookings: flat,
      stats: { total: active.length, upcoming: upcoming.length, done: done.length, pending: pending.length },
      nextUpId: candidate?.id ?? null,
      openHours,
      isOpen: isOpenFlag,
    };
  }, [lanes]);

  const showResource = lanes.length > 1;

  if (lanes.length === 0) {
    return (
      <div style={{ flex: 1, overflow: "auto", padding: "20px 16px" }}>
        <div style={{ borderRadius: 16, border: "1px dashed rgba(139,92,246,.15)", padding: "40px 20px", textAlign: "center", display: "grid", gap: 12 }}>
          <div style={{ fontSize: 32 }}>🗓</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,.6)" }}>No team members yet</div>
          <div style={{ fontSize: 13, color: "rgba(148,163,184,.4)" }}>Add team members to start scheduling.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "14px 16px 40px", display: "grid", gap: 14, alignContent: "start" }}>

      {/* Open/Closed status + hours */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 20,
          background: isOpen ? "rgba(52,211,153,.08)" : "rgba(239,68,68,.08)",
          border: `1px solid ${isOpen ? "rgba(52,211,153,.2)" : "rgba(239,68,68,.18)"}`,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: isOpen ? "#34d399" : "#f87171" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: isOpen ? "rgba(52,211,153,.9)" : "rgba(248,113,113,.9)" }}>
            {isOpen ? "Open" : "Closed"}
          </span>
        </div>
        {openHours && (
          <span style={{ fontSize: 12, color: "rgba(148,163,184,.45)" }}>{openHours}</span>
        )}
        <div style={{ flex: 1 }} />
        {openCreateModal && lanes.length > 0 && (
          <button
            type="button"
            onClick={() => openCreateModal(lanes[0].resource.id, "10:00")}
            style={{
              height: 32, padding: "0 13px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: "none",
              background: "linear-gradient(135deg,rgba(139,92,246,.9),rgba(109,40,217,.9))",
              color: "#fff", display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>+</span>
            New
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 8 }}>
        <StatPill value={stats.total}    label="TODAY"    valueColor="rgba(255,255,255,.9)" />
        <StatPill value={stats.upcoming} label="UPCOMING" valueColor="rgba(167,139,250,.9)" />
        <StatPill value={stats.done}     label="DONE"     valueColor="rgba(56,189,248,.85)" />
        <StatPill value={stats.pending}  label="PENDING"  valueColor="rgba(251,191,36,.85)" />
      </div>

      {/* Booking list or empty state */}
      {allBookings.length === 0 ? (
        <div style={{ borderRadius: 16, border: "1px dashed rgba(148,163,184,.1)", padding: "40px 20px", textAlign: "center", display: "grid", gap: 10 }}>
          <div style={{ fontSize: 32 }}>☀️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,.55)" }}>
            No bookings {isToday ? "today" : "this day"}
          </div>
          <div style={{ fontSize: 13, color: "rgba(148,163,184,.38)" }}>Your schedule is clear.</div>
          {openCreateModal && (
            <button
              type="button"
              onClick={() => openCreateModal(lanes[0].resource.id, "10:00")}
              style={{
                alignSelf: "center", justifySelf: "center",
                height: 38, padding: "0 18px", borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                border: "none",
                background: "linear-gradient(135deg,rgba(139,92,246,.9),rgba(109,40,217,.9))",
                color: "#fff",
              }}
            >
              + New Booking
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {allBookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              laneColor={LANE_COLORS[b._laneIdx % LANE_COLORS.length]}
              resourceName={b._resourceName}
              showResource={showResource}
              isNext={b.id === nextUpId}
              onClick={onBookingClick}
            />
          ))}
        </div>
      )}

      {/* Timeline toggle */}
      <button
        type="button"
        onClick={onViewTimeline}
        style={{
          width: "100%", height: 40, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
          border: "1px solid rgba(148,163,184,.1)", background: "rgba(255,255,255,.02)",
          color: "rgba(148,163,184,.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}
      >
        ▼ View Full Timeline
      </button>
    </div>
  );
}
