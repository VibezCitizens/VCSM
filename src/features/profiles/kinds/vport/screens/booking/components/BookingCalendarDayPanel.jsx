function AppointmentStatusBadge({ status, statusLabels }) {
  const label = statusLabels[status] || "Pending";
  return (
    <span className={`profiles-booking-status-badge is-${status || "pending"}`}>
      {label}
    </span>
  );
}

export function BookingCalendarDayPanel({
  isOwner,
  canRequestSelectedSlot = !isOwner,
  showOwnerSlotActions = isOwner,
  selectedDateLabel,
  selectedSlot,
  selectedSlotsBySegment,
  selectedAppointments,
  segmentLabels,
  statusLabels,
  isSelectedSlotAvailable,
  onSelectSlot,
  onCreateAppointmentFromSelectedSlot,
  onToggleAvailabilityForSelectedSlot,
  onResetDay,
}) {
  return (
    <section className="profiles-booking-panel-shell" aria-label="Day details">
      <div className="profiles-booking-panel-head">
        <div>
          <p className="profiles-booking-panel-kicker">Selected Day</p>
          <h5 className="profiles-booking-panel-title">{selectedDateLabel}</h5>
        </div>

        <div className="profiles-booking-panel-count">
          {selectedAppointments.length} appointments
        </div>
      </div>

      <div className="profiles-booking-slot-section">
        {Object.entries(selectedSlotsBySegment).map(([segmentKey, slots]) => (
          <div key={segmentKey} className="profiles-booking-slot-group">
            <div className="profiles-booking-slot-group-head">
              <span>{segmentLabels[segmentKey] || segmentKey}</span>
              <span>{slots.length}</span>
            </div>

            {slots.length ? (
              <div className="profiles-booking-slot-wrap">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onSelectSlot(slot)}
                    className={`profiles-booking-slot-btn ${
                      selectedSlot === slot ? "is-active" : ""
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <div className="profiles-booking-empty-slots">No open slots</div>
            )}
          </div>
        ))}
      </div>

      <div className="profiles-booking-actions">
        {canRequestSelectedSlot && (
          <button
            type="button"
            className="profiles-booking-action-btn is-primary"
            onClick={onCreateAppointmentFromSelectedSlot}
            disabled={!selectedSlot}
          >
            {isOwner ? "Create hold from selected slot" : "Request selected slot"}
          </button>
        )}

        {isOwner && showOwnerSlotActions && (
          <button
            type="button"
            className="profiles-booking-action-btn is-secondary"
            onClick={onToggleAvailabilityForSelectedSlot}
            disabled={!selectedSlot}
          >
            {isSelectedSlotAvailable ? "Mark selected slot unavailable" : "Restore selected slot"}
          </button>
        )}

        <button
          type="button"
          className="profiles-booking-action-btn is-ghost"
          onClick={onResetDay}
        >
          Reset day preview
        </button>
      </div>

      <div className="profiles-booking-appointments">
        {selectedAppointments.length ? (
          selectedAppointments.map((item) => (
            <article key={item.id} className="profiles-booking-appointment-card">
              <div className="profiles-booking-appointment-time">{item.time}</div>
              <div className="profiles-booking-appointment-content">
                <p className="profiles-booking-appointment-client">{item.clientName}</p>
                <p className="profiles-booking-appointment-service">{item.service}</p>
              </div>
              <AppointmentStatusBadge status={item.status} statusLabels={statusLabels} />
            </article>
          ))
        ) : (
          <div className="profiles-booking-empty-appointments">
            No appointments yet for this date.
          </div>
        )}
      </div>
    </section>
  );
}
