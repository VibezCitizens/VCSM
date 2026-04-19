import { useEffect } from "react";
import ActorLink from "@/shared/components/ActorLink";
import { useActorSummary } from "@/state/actors/useActorSummary";
import { hydrateActorsFromRows } from "@/state/actors/hydrateActors";
import { useTranslation } from "@i18n";

function AppointmentStatusBadge({ status, statusLabels }) {
  const label = statusLabels[status] || "Pending";
  return (
    <span className={`profiles-booking-status-badge is-${status || "pending"}`}>
      {label}
    </span>
  );
}

function AppointmentClientIdentity({ item, isOwner }) {
  const customerActorId = item?.customerActorId ?? null;

  useEffect(() => {
    if (!customerActorId) return;
    hydrateActorsFromRows([{ actor_id: customerActorId }]).catch(() => {});
  }, [customerActorId]);

  const actorSummary = useActorSummary({
    actorId: customerActorId,
    displayName: item?.clientName,
  });
  const canLink = Boolean(customerActorId && actorSummary?.actorId);

  if (canLink) {
    return (
      <ActorLink
        actor={actorSummary}
        showAvatar
        avatarSize="w-10 h-10"
        textSize="text-[0.76rem]"
        showUsername={isOwner}
        className="profiles-booking-appointment-client-link"
      />
    );
  }

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
        {actorSummary?.displayName || item?.clientName || "Citizen"}
      </p>
    </div>
  );
}

function OwnerCustomerPicker({ t,
  ownerCustomerName = "",
  ownerFollowerMatches = [],
  ownerFollowersLoading = false,
  ownerFollowersError = "",
  selectedOwnerFollower = null,
  onOwnerCustomerNameChange,
  onSelectOwnerFollower,
  onClearOwnerFollower,
}) {
  const canSearchFollowers = typeof onSelectOwnerFollower === "function";
  const searchQuery = String(ownerCustomerName || "").trim();
  const hasQuery = Boolean(searchQuery);
  const hasMatches = Array.isArray(ownerFollowerMatches) && ownerFollowerMatches.length > 0;
  const showMatches = canSearchFollowers && !selectedOwnerFollower && hasQuery && hasMatches;

  return (
    <div className="profiles-booking-owner-client-picker">
      <input
        type="text"
        className="profiles-booking-owner-input"
        value={ownerCustomerName}
        onChange={(e) => onOwnerCustomerNameChange(e.target.value)}
        placeholder={t('booking.searchFollowerPlaceholder')}
      />

      {selectedOwnerFollower ? (
        <div className="profiles-booking-owner-selected-follower">
          <span className="profiles-booking-owner-selected-follower-label">
            Linked follower: {selectedOwnerFollower.displayName}
            {selectedOwnerFollower.username ? ` (@${selectedOwnerFollower.username})` : ""}
          </span>

          {typeof onClearOwnerFollower === "function" ? (
            <button
              type="button"
              className="profiles-booking-owner-selected-follower-clear"
              onClick={onClearOwnerFollower}
            >
              {t('actions.clear')}
            </button>
          ) : null}
        </div>
      ) : null}

      {showMatches ? (
        <div className="profiles-booking-owner-follower-results" role="listbox" aria-label="Follower matches">
          {ownerFollowerMatches.map((follower) => (
            <button
              key={follower.actorId}
              type="button"
              className="profiles-booking-owner-follower-option"
              onClick={() => onSelectOwnerFollower(follower)}
            >
              <img
                src={follower.avatar || "/avatar.jpg"}
                alt={follower.displayName || "Follower"}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/avatar.jpg";
                }}
                className="profiles-booking-owner-follower-option-avatar"
              />
              <span className="profiles-booking-owner-follower-option-text">
                <strong>{follower.displayName}</strong>
                {follower.username ? <span>@{follower.username}</span> : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {ownerFollowersLoading && hasQuery ? (
        <p className="profiles-booking-owner-picker-meta">{t('booking.searchingFollowers')}</p>
      ) : null}

      {!ownerFollowersLoading && hasQuery && !hasMatches ? (
        <p className="profiles-booking-owner-picker-meta">
          {t('booking.noFollowerMatch')}
        </p>
      ) : null}

      {ownerFollowersError ? (
        <p className="profiles-booking-owner-picker-meta is-error">
          {t('booking.followersError')}
        </p>
      ) : null}
    </div>
  );
}

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
                    className={`profiles-booking-slot-btn ${
                      selectedSlot === slot ? "is-active" : ""
                    }`}
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
        <div className="profiles-booking-owner-hint">
          {t('booking.ownerModeHint')}
        </div>
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
          <button
            type="button"
            className="profiles-booking-action-btn is-primary"
            onClick={onCreateAppointmentFromSelectedSlot}
            disabled={!selectedSlot}
          >
            {primaryActionLabel || (isOwner ? t('booking.createHold') : t('booking.requestSlot'))}
          </button>
        )}

        {isOwner && showOwnerSlotActions && (
          <button
            type="button"
            className="profiles-booking-action-btn is-secondary"
            onClick={onToggleAvailabilityForSelectedSlot}
            disabled={!selectedSlot}
          >
            {isSelectedSlotAvailable ? t('booking.markSlotUnavailable') : t('booking.restoreSlot')}
          </button>
        )}

        <button
          type="button"
          className="profiles-booking-action-btn is-ghost"
          onClick={onResetDay}
        >
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
                <p
                  className={`profiles-booking-appointment-service${
                    isOwner ? " is-with-avatar" : ""
                  }`}
                >
                  {item.service}
                </p>
              </div>
              <div className="profiles-booking-appointment-tail">
                <AppointmentStatusBadge status={item.status} statusLabels={statusLabels} />
                {/* Owner: Accept + Cancel for pending; Cancel for confirmed */}
                {isOwner &&
                ["pending", "confirmed"].includes(String(item.status || "").toLowerCase()) &&
                (typeof onConfirmAppointment === "function" ||
                  typeof onCancelAppointment === "function") ? (
                  <div className="profiles-booking-appointment-actions-inline">
                    {String(item.status || "").toLowerCase() === "pending" && typeof onConfirmAppointment === "function" ? (
                      <button
                        type="button"
                        className="profiles-booking-inline-action-btn is-confirm"
                        onClick={() => onConfirmAppointment(item.id)}
                        disabled={confirmingAppointmentId === item.id}
                      >
                        {confirmingAppointmentId === item.id ? "..." : t('booking.accept')}
                      </button>
                    ) : null}
                    {typeof onCancelAppointment === "function" ? (
                      <button
                        type="button"
                        className="profiles-booking-inline-action-btn"
                        onClick={() => onCancelAppointment(item.id)}
                        disabled={cancellingAppointmentId === item.id}
                      >
                        {cancellingAppointmentId === item.id ? "..." : t('actions.cancel')}
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {/* Customer: Cancel for pending or confirmed */}
                {!isOwner &&
                viewerActorId &&
                String(item.customerActorId) === String(viewerActorId) &&
                ["pending", "confirmed"].includes(String(item.status || "").toLowerCase()) &&
                typeof onCancelAppointment === "function" ? (
                  <div className="profiles-booking-appointment-actions-inline">
                    <button
                      type="button"
                      className="profiles-booking-inline-action-btn"
                      onClick={() => onCancelAppointment(item.id)}
                      disabled={cancellingAppointmentId === item.id}
                    >
                      {cancellingAppointmentId === item.id ? "..." : t('actions.cancel')}
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <div className="profiles-booking-empty-appointments">
            {t('booking.noAppointmentsForDate')}
          </div>
        )}
      </div>
    </section>
  );
}
