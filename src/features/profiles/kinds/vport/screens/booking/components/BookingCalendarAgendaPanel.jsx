function AgendaStatusBadge({ status, statusLabels }) {
  const label = statusLabels[status] || "Pending";
  return (
    <span className={`profiles-booking-status-badge is-${status || "pending"}`}>
      {label}
    </span>
  );
}

export function BookingCalendarAgendaPanel({
  upcomingAppointments,
  weeklyAvailabilityDays = [],
  weekLabel = "",
  segmentLabels = {},
  statusLabels,
  isOwner,
}) {
  const normalizedDays = Array.isArray(weeklyAvailabilityDays) ? weeklyAvailabilityDays : [];
  const openSlotsThisWeek = normalizedDays.reduce(
    (sum, day) => sum + Number(day?.totalSlots || 0),
    0
  );
  const visibleAvailabilityDays = normalizedDays.filter((day) => Number(day?.totalSlots || 0) > 0);

  return (
    <section className="profiles-booking-panel-shell" aria-label="Upcoming appointments and availability">
      <div className="profiles-booking-panel-head">
        <div>
          <p className="profiles-booking-panel-kicker">Agenda</p>
          <h5 className="profiles-booking-panel-title">
            {isOwner ? "Upcoming client flow" : "Upcoming booking queue"}
          </h5>
        </div>

        <div className="profiles-booking-panel-count">{upcomingAppointments.length} upcoming</div>
      </div>

      {upcomingAppointments.length ? (
        <div className="profiles-booking-agenda-list">
          {upcomingAppointments.map((item) => (
            <article key={item.id} className="profiles-booking-agenda-item">
              <div className="profiles-booking-agenda-time">
                <div>{item.time}</div>
                <small>{item.dateLabel}</small>
              </div>

              <div className="profiles-booking-agenda-content">
                <p className="profiles-booking-appointment-client">{item.clientName}</p>
                <p className="profiles-booking-appointment-service">{item.service}</p>
              </div>

              <AgendaStatusBadge status={item.status} statusLabels={statusLabels} />
            </article>
          ))}
        </div>
      ) : null}

      <div className="profiles-booking-slot-section">
        <div className="profiles-booking-slot-group-head">
          <span>{weekLabel ? `Open slots this week (${weekLabel})` : "Open slots this week"}</span>
          <span>{openSlotsThisWeek}</span>
        </div>

        {visibleAvailabilityDays.length ? (
          <div className="profiles-booking-agenda-list">
            {visibleAvailabilityDays.map((day) => (
              <article key={day.id} className="profiles-booking-agenda-item profiles-booking-agenda-item--availability">
                <div className="profiles-booking-agenda-time">
                  <div>{day.dateLabel}</div>
                  <small>{day.totalSlots} open slots</small>
                </div>

                <div className="profiles-booking-agenda-content">
                  {Object.entries(day.slotsBySegment || {}).map(([segmentKey, slots]) =>
                    Array.isArray(slots) && slots.length ? (
                      <div key={`${day.id}-${segmentKey}`} className="profiles-booking-agenda-day-slots">
                        <p className="profiles-booking-agenda-day-segment-label">
                          {segmentLabels[segmentKey] || segmentKey}
                        </p>
                        <div className="profiles-booking-slot-wrap profiles-booking-slot-wrap--agenda">
                          {slots.map((slot) => (
                            <span key={`${day.id}-${segmentKey}-${slot}`} className="profiles-booking-slot-pill">
                              {slot}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="profiles-booking-empty-appointments">
            No week availability in this UI preview.
          </div>
        )}
      </div>
    </section>
  );
}
