import ActorLink from "@/shared/components/ActorLink";
import { useActorSummary } from "@/state/actors/useActorSummary";

function AppointmentStatusBadge({ status, statusLabels }) {
  const label = statusLabels[status] || "Pending";
  return (
    <span className={`profiles-booking-status-badge is-${status || "pending"}`}>
      {label}
    </span>
  );
}

function AppointmentClientIdentity({ item, isOwner }) {
  const actorSummary = useActorSummary({
    actorId: item?.customerActorId,
    displayName: item?.clientName,
  });
  const canLink = Boolean(isOwner && item?.customerActorId && actorSummary?.actorId);

  if (!isOwner) {
    return <p className="profiles-booking-appointment-client">{item.clientName}</p>;
  }

  if (!canLink) {
    return (
      <div className="profiles-booking-appointment-client-fallback">
        <img
          src={actorSummary?.avatar || "/avatar.jpg"}
          alt={item?.clientName || "Citizen"}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/avatar.jpg";
          }}
          className="profiles-booking-appointment-client-fallback-avatar"
        />
        <p className="profiles-booking-appointment-client">
          {item?.clientName || actorSummary?.displayName || "Citizen"}
        </p>
      </div>
    );
  }

  return (
    <ActorLink
      actor={actorSummary}
      showAvatar
      avatarSize="w-8 h-8"
      avatarShape="rounded-lg"
      textSize="text-[0.76rem]"
      showUsername
      className="profiles-booking-appointment-client-link"
    />
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
  primaryActionLabel = "",
  ownerCustomerName = "",
  onOwnerCustomerNameChange,
  onSelectSlot,
  onCreateAppointmentFromSelectedSlot,
  onToggleAvailabilityForSelectedSlot,
  onResetDay,
  onConfirmAppointment,
  confirmingAppointmentId = null,
  onCancelAppointment,
  cancellingAppointmentId = null,
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

      {isOwner ? (
        <div className="profiles-booking-owner-hint">
          Owner mode: select a slot, optionally add client name, then save appointment.
        </div>
      ) : null}

      <div className="profiles-booking-actions">
        {isOwner && typeof onOwnerCustomerNameChange === "function" ? (
          <input
            type="text"
            className="profiles-booking-owner-input"
            value={ownerCustomerName}
            onChange={(e) => onOwnerCustomerNameChange(e.target.value)}
            placeholder="Client name (optional)"
          />
        ) : null}

        {canRequestSelectedSlot && (
          <button
            type="button"
            className="profiles-booking-action-btn is-primary"
            onClick={onCreateAppointmentFromSelectedSlot}
            disabled={!selectedSlot}
          >
            {primaryActionLabel || (isOwner ? "Create hold from selected slot" : "Request selected slot")}
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
          Clear selected day
        </button>
      </div>

      <div className="profiles-booking-appointments">
        {selectedAppointments.length ? (
          selectedAppointments.map((item) => (
            <article key={item.id} className="profiles-booking-appointment-card">
              <div className="profiles-booking-appointment-time">{item.time}</div>
              <div className="profiles-booking-appointment-content">
                <AppointmentClientIdentity item={item} isOwner={isOwner} />
                <p className="profiles-booking-appointment-service">{item.service}</p>
              </div>
              <div className="profiles-booking-appointment-tail">
                <AppointmentStatusBadge status={item.status} statusLabels={statusLabels} />
                {isOwner &&
                (typeof onConfirmAppointment === "function" ||
                  typeof onCancelAppointment === "function") ? (
                  <div className="profiles-booking-appointment-actions-inline">
                    {typeof onConfirmAppointment === "function" &&
                    String(item.status || "").toLowerCase() === "pending" ? (
                      <button
                        type="button"
                        className="profiles-booking-inline-action-btn is-confirm"
                        onClick={() => onConfirmAppointment(item.id)}
                        disabled={confirmingAppointmentId === item.id}
                      >
                        {confirmingAppointmentId === item.id ? "Accepting..." : "Accept"}
                      </button>
                    ) : null}
                    {typeof onCancelAppointment === "function" &&
                    !["cancelled", "completed"].includes(String(item.status || "").toLowerCase()) ? (
                      <button
                        type="button"
                        className="profiles-booking-inline-action-btn"
                        onClick={() => onCancelAppointment(item.id)}
                        disabled={cancellingAppointmentId === item.id}
                      >
                        {cancellingAppointmentId === item.id ? "Cancelling..." : "Cancel"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
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
