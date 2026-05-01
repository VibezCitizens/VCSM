import { useTranslation } from "@i18n";
import {
  AppointmentClientIdentity,
  AppointmentStatusBadge,
  OwnerCustomerPicker,
} from "@/features/profiles/kinds/vport/screens/booking/components/bookingCalendarDayPanel.components";

export function BookingCalendarDayPanel({
  isOwner,
  viewerActorId = null,
  viewerCanBook = true,
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
  ownerFollowerMatches = [],
  ownerFollowersLoading = false,
  ownerFollowersError = "",
  selectedOwnerFollower = null,
  onOwnerCustomerNameChange,
  onSelectOwnerFollower,
  onClearOwnerFollower,
  onSelectSlot,
  onCreateAppointmentFromSelectedSlot,
  onToggleAvailabilityForSelectedSlot,
  onResetDay,
  onConfirmAppointment,
  confirmingAppointmentId = null,
  onCancelAppointment,
  cancellingAppointmentId = null,
}) {
  const { t } = useTranslation();

  return (
    <section className="profiles-booking-panel-shell" aria-label="Day details">
      <div className="profiles-booking-panel-head">
        <div>
          <p className="profiles-booking-panel-kicker">{t('booking.selectedDay')}</p>
          <h5 className="profiles-booking-panel-title">{selectedDateLabel}</h5>
        </div>
        <div className="profiles-booking-panel-count">
          {selectedAppointments.length} {t('booking.appointments')}
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
                    className={`profiles-booking-slot-btn ${selectedSlot === slot ? "is-active" : ""}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <div className="profiles-booking-empty-slots">{t('booking.noOpenSlots')}</div>
            )}
          </div>
        ))}
      </div>

      {isOwner ? (
        <div className="profiles-booking-owner-hint">{t('booking.ownerModeHint')}</div>
      ) : null}

      <div className="profiles-booking-actions">
        {!isOwner && !viewerCanBook ? (
          <div className="profiles-booking-citizen-notice">
            <p>{t('booking.citizenSwitchHint')}</p>
          </div>
        ) : null}

        {isOwner && typeof onOwnerCustomerNameChange === "function" ? (
          <OwnerCustomerPicker
            t={t}
            ownerCustomerName={ownerCustomerName}
            ownerFollowerMatches={ownerFollowerMatches}
            ownerFollowersLoading={ownerFollowersLoading}
            ownerFollowersError={ownerFollowersError}
            selectedOwnerFollower={selectedOwnerFollower}
            onOwnerCustomerNameChange={onOwnerCustomerNameChange}
            onSelectOwnerFollower={onSelectOwnerFollower}
            onClearOwnerFollower={onClearOwnerFollower}
          />
        ) : null}

        {canRequestSelectedSlot && (
          <button type="button" className="profiles-booking-action-btn is-primary" onClick={onCreateAppointmentFromSelectedSlot} disabled={!selectedSlot}>
            {primaryActionLabel || (isOwner ? t('booking.createHold') : t('booking.requestSlot'))}
          </button>
        )}

        {isOwner && showOwnerSlotActions && (
          <button type="button" className="profiles-booking-action-btn is-secondary" onClick={onToggleAvailabilityForSelectedSlot} disabled={!selectedSlot}>
            {isSelectedSlotAvailable ? t('booking.markSlotUnavailable') : t('booking.restoreSlot')}
          </button>
        )}

        <button type="button" className="profiles-booking-action-btn is-ghost" onClick={onResetDay}>
          {t('booking.clearSelectedDay')}
        </button>
      </div>

      <div className="profiles-booking-appointments">
        {selectedAppointments.length ? (
          selectedAppointments.map((item) => (
            <article key={item.id} className="profiles-booking-appointment-card">
              <div className="profiles-booking-appointment-time">{item.time}</div>
              <div className="profiles-booking-appointment-content">
                <AppointmentClientIdentity item={item} isOwner={isOwner} />
                <p className={`profiles-booking-appointment-service${isOwner ? " is-with-avatar" : ""}`}>
                  {item.service}
                </p>
              </div>
              <div className="profiles-booking-appointment-tail">
                <AppointmentStatusBadge status={item.status} statusLabels={statusLabels} />
                {isOwner &&
                ["pending", "confirmed"].includes(String(item.status || "").toLowerCase()) &&
                (typeof onConfirmAppointment === "function" || typeof onCancelAppointment === "function") ? (
                  <div className="profiles-booking-appointment-actions-inline">
                    {String(item.status || "").toLowerCase() === "pending" && typeof onConfirmAppointment === "function" ? (
                      <button type="button" className="profiles-booking-inline-action-btn is-confirm" onClick={() => onConfirmAppointment(item.id)} disabled={confirmingAppointmentId === item.id}>
                        {confirmingAppointmentId === item.id ? "..." : t('booking.accept')}
                      </button>
                    ) : null}
                    {typeof onCancelAppointment === "function" ? (
                      <button type="button" className="profiles-booking-inline-action-btn" onClick={() => onCancelAppointment(item.id)} disabled={cancellingAppointmentId === item.id}>
                        {cancellingAppointmentId === item.id ? "..." : t('actions.cancel')}
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {!isOwner && viewerActorId && String(item.customerActorId) === String(viewerActorId) &&
                ["pending", "confirmed"].includes(String(item.status || "").toLowerCase()) &&
                typeof onCancelAppointment === "function" ? (
                  <div className="profiles-booking-appointment-actions-inline">
                    <button type="button" className="profiles-booking-inline-action-btn" onClick={() => onCancelAppointment(item.id)} disabled={cancellingAppointmentId === item.id}>
                      {cancellingAppointmentId === item.id ? "..." : t('actions.cancel')}
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <div className="profiles-booking-empty-appointments">{t('booking.noAppointmentsForDate')}</div>
        )}
      </div>
    </section>
  );
}
