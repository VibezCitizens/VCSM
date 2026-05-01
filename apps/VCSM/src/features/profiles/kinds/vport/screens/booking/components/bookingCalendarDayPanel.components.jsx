import { useEffect } from "react";
import ActorLink from "@/shared/components/ActorLink";
import { useActorSummary } from "@/state/actors/useActorSummary";
import { hydrateActorsFromRows } from "@/state/actors/hydrateActors";

export function AppointmentStatusBadge({ status, statusLabels }) {
  const label = statusLabels[status] || "Pending";
  return (
    <span className={`profiles-booking-status-badge is-${status || "pending"}`}>
      {label}
    </span>
  );
}

export function AppointmentClientIdentity({ item, isOwner }) {
  const customerActorId = item?.customerActorId ?? null;

  useEffect(() => {
    if (!customerActorId) return;
    hydrateActorsFromRows([{ actor_id: customerActorId }]).catch(() => {});
  }, [customerActorId]);

  const actorSummary = useActorSummary({ actorId: customerActorId, displayName: item?.clientName });
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
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/avatar.jpg"; }}
        className="profiles-booking-appointment-client-fallback-avatar"
      />
      <p className="profiles-booking-appointment-client">
        {actorSummary?.displayName || item?.clientName || "Citizen"}
      </p>
    </div>
  );
}

export function OwnerCustomerPicker({
  t,
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
            <button type="button" className="profiles-booking-owner-selected-follower-clear" onClick={onClearOwnerFollower}>
              {t('actions.clear')}
            </button>
          ) : null}
        </div>
      ) : null}

      {showMatches ? (
        <div className="profiles-booking-owner-follower-results" role="listbox" aria-label="Follower matches">
          {ownerFollowerMatches.map((follower) => (
            <button key={follower.actorId} type="button" className="profiles-booking-owner-follower-option" onClick={() => onSelectOwnerFollower(follower)}>
              <img src={follower.avatar || "/avatar.jpg"} alt={follower.displayName || "Follower"} loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/avatar.jpg"; }} className="profiles-booking-owner-follower-option-avatar" />
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
        <p className="profiles-booking-owner-picker-meta">{t('booking.noFollowerMatch')}</p>
      ) : null}

      {ownerFollowersError ? (
        <p className="profiles-booking-owner-picker-meta is-error">{t('booking.followersError')}</p>
      ) : null}
    </div>
  );
}
