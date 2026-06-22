import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import OperationalBookingCard from "./OperationalBookingCard";

function todayRange() {
  const s = new Date(); s.setHours(0, 0, 0, 0);
  const e = new Date(); e.setHours(23, 59, 59, 999);
  return [s.getTime(), e.getTime()];
}

function formatTodayDate() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
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

function NowLine() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
      <div style={{ flex: 1, height: 1, background: "rgba(139,92,246,.4)" }} />
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".1em", color: "rgba(167,139,250,.8)", flexShrink: 0 }}>
        NOW
      </div>
      <div style={{ flex: 1, height: 1, background: "rgba(139,92,246,.4)" }} />
    </div>
  );
}

export default function TodayView({ bookings, actions, loading, error, resourceId, actorId, onNewBooking }) {
  const navigate  = useNavigate();
  const now       = Date.now();
  const [tS, tE]  = todayRange();

  const todayBookings = useMemo(() => {
    return bookings
      .filter(b => {
        if (!b.startsAt) return false;
        const t = new Date(b.startsAt).getTime();
        return t >= tS && t <= tE;
      })
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }, [bookings, tS, tE]);

  const stats = useMemo(() => {
    const active  = todayBookings.filter(b => b.status !== "cancelled");
    const upcoming = active.filter(b => new Date(b.startsAt).getTime() > now && !["completed","no_show","cancelled"].includes(b.status));
    const done     = active.filter(b => ["completed","no_show"].includes(b.status));
    const pending  = active.filter(b => b.status === "pending");
    return { total: active.length, upcoming: upcoming.length, done: done.length, pending: pending.length };
  }, [todayBookings, now]);

  const nextUpId = useMemo(() => {
    const candidate = todayBookings.find(b =>
      !["completed","no_show","cancelled"].includes(b.status) &&
      new Date(b.startsAt).getTime() >= now - 30 * 60 * 1000
    );
    return candidate?.id ?? null;
  }, [todayBookings, now]);

  const nowDividerAfterIdx = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < todayBookings.length; i++) {
      if (new Date(todayBookings[i].startsAt).getTime() <= now) idx = i;
      else break;
    }
    return idx;
  }, [todayBookings, now]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 0" }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(255,255,255,.15)", borderTopColor: "rgba(255,255,255,.6)", animation: "spin 0.7s linear infinite" }} />
        <div style={{ fontSize: 13, color: "rgba(148,163,184,.5)" }}>Loading bookings…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ borderRadius: 10, background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.18)", padding: "12px 14px", fontSize: 13, color: "#fca5a5" }}>
        {String(error?.message ?? error)}
      </div>
    );
  }

  if (!resourceId) {
    return (
      <div style={{ borderRadius: 16, border: "1px dashed rgba(139,92,246,.15)", padding: "36px 20px", textAlign: "center", display: "grid", gap: 12 }}>
        <div style={{ fontSize: 32 }}>🗓</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,.6)" }}>No booking resource yet</div>
        <div style={{ fontSize: 13, color: "rgba(148,163,184,.4)" }}>Set up working hours first to start accepting bookings.</div>
        <button
          type="button"
          onClick={() => navigate(`/actor/${actorId}/dashboard/calendar`)}
          style={{ alignSelf: "center", justifySelf: "center", height: 38, padding: "0 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(139,92,246,.3)", background: "rgba(139,92,246,.12)", color: "rgba(167,139,250,.9)" }}
        >
          Open Calendar Settings
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Date + stats */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: "rgba(148,163,184,.55)" }}>{formatTodayDate()}</div>
          {resourceId && onNewBooking && (
            <button
              type="button"
              onClick={onNewBooking}
              style={{
                height: 32, padding: "0 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: "none",
                background: "linear-gradient(135deg,rgba(139,92,246,.9),rgba(109,40,217,.9))",
                color: "#fff",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
              New Booking
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <StatPill value={stats.total}    label="TODAY"    valueColor="rgba(255,255,255,.9)" />
          <StatPill value={stats.upcoming} label="UPCOMING" valueColor="rgba(167,139,250,.9)" />
          <StatPill value={stats.done}     label="DONE"     valueColor="rgba(56,189,248,.85)" />
          <StatPill value={stats.pending}  label="PENDING"  valueColor="rgba(251,191,36,.85)" />
        </div>
      </div>

      {/* Error banner from actions */}
      {actions.error && (
        <div style={{ borderRadius: 8, background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.16)", padding: "9px 12px", fontSize: 12, color: "#fca5a5" }}>
          {actions.error}
        </div>
      )}

      {/* Timeline */}
      {todayBookings.length === 0 ? (
        <div style={{ borderRadius: 16, border: "1px dashed rgba(148,163,184,.1)", padding: "36px 20px", textAlign: "center", display: "grid", gap: 10 }}>
          <div style={{ fontSize: 32 }}>☀️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,.55)" }}>No bookings today</div>
          <div style={{ fontSize: 13, color: "rgba(148,163,184,.38)" }}>Your schedule is clear.</div>
          <button
            type="button"
            onClick={() => navigate(`/actor/${actorId}/dashboard/calendar`)}
            style={{ alignSelf: "center", justifySelf: "center", height: 36, padding: "0 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(148,163,184,.15)", background: "rgba(255,255,255,.04)", color: "rgba(148,163,184,.7)" }}
          >
            View Calendar Settings
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {todayBookings.map((b, i) => (
            <div key={b.id}>
              {i === nowDividerAfterIdx + 1 && i > 0 && <NowLine />}
              <OperationalBookingCard
                booking={b}
                isNext={b.id === nextUpId}
                onConfirm={actions.confirm}
                onCancel={actions.cancel}
                onComplete={actions.complete}
                onNoShow={actions.noShow}
                working={actions.working}
              />
            </div>
          ))}
          {/* NOW line at the very end if all bookings are in the past */}
          {nowDividerAfterIdx === todayBookings.length - 1 && todayBookings.length > 0 && (
            <NowLine />
          )}
        </div>
      )}
    </div>
  );
}
