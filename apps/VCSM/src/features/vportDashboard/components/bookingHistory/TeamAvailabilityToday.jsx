import useTeamAvailabilityToday from "@/features/vportDashboard/dashboard/cards/bookings/hooks/useTeamAvailabilityToday";
import { formatTotalHours } from "@/features/vportDashboard/dashboard/cards/bookings/model/teamAvailabilityToday.model";

// Read-only "Team available today" section for the Bookings page. Shows each active
// barber/staff resource and their working-hour ranges for the selected day, broken into
// clickable appointment slots. Selecting a slot opens the existing New Booking modal
// prefilled for that resource/date/time. Members with no active rule show "Closed today".
// Never blocks the page on failure.
export default function TeamAvailabilityToday({ actorId, dateKey, onSelectSlot, refreshKey = 0 }) {
  const { members, loading, error, dateKey: resolvedDateKey } = useTeamAvailabilityToday({
    actorId,
    dateKey,
    enabled: Boolean(actorId),
    refreshKey,
  });

  // Nothing to surface and nothing went wrong — keep the page clean.
  if (!loading && !error && members.length === 0) return null;

  function handleSlot(member, slot) {
    onSelectSlot?.({
      resourceId: member.resourceId,
      resourceName: member.name,
      dateKey: resolvedDateKey,
      startTime: slot.start,
      endTime: slot.end,
      durationMinutes: slot.durationMinutes,
    });
  }

  return (
    <section style={{ marginBottom: 16, display: "grid", gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", color: "rgba(148,163,184,.4)" }}>
        TEAM AVAILABLE TODAY
      </div>

      {error ? (
        <div style={{ borderRadius: 8, background: "rgba(251,191,36,.07)", border: "1px solid rgba(251,191,36,.18)", padding: "8px 12px", fontSize: 12, color: "rgba(251,191,36,.85)" }}>
          Couldn’t load team availability.
        </div>
      ) : loading ? (
        <div style={{ fontSize: 12, color: "rgba(148,163,184,.5)" }}>Loading availability…</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {members.map((m) => (
            <div
              key={m.resourceId}
              style={{
                borderRadius: 12, border: "1px solid rgba(148,163,184,.1)",
                background: "rgba(15,23,42,.65)", padding: "10px 12px",
                display: "grid", gap: 8,
              }}
            >
              {/* Member header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, flexShrink: 0, background: m.isOpen ? "rgba(74,222,128,.9)" : "rgba(148,163,184,.4)" }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.88)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.name}
                  </span>
                </div>
                {m.isOpen && formatTotalHours(m.totalMinutes) && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(148,163,184,.55)", flexShrink: 0 }}>
                    {formatTotalHours(m.totalMinutes)}
                  </div>
                )}
              </div>

              {m.isOpen ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {m.ranges.map((r, ri) => (
                    <div key={ri} style={{ display: "grid", gap: 5 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".04em", color: "rgba(148,163,184,.4)" }}>
                        {r.label}
                      </div>
                      {r.slots.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {r.slots.map((s) => (
                            <button
                              key={s.start}
                              type="button"
                              onClick={() => handleSlot(m, s)}
                              style={{
                                fontSize: 11, fontWeight: 600, cursor: "pointer",
                                color: "rgba(196,181,253,.95)",
                                background: "rgba(139,92,246,.14)",
                                border: "1px solid rgba(139,92,246,.22)",
                                borderRadius: 6, padding: "3px 9px",
                                transition: "background .12s",
                              }}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: "rgba(148,163,184,.4)", fontStyle: "italic" }}>
                          Fully booked
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "rgba(148,163,184,.45)" }}>
                  Closed today
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
