import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useActorSummary } from "@hydration";
import { useVportTeam } from "@/features/dashboard/vport/adapters/vport.adapter";
import "@/features/profiles/styles/profiles-team-modern.css";
import "@/features/profiles/styles/barbershop-owner-mode.css";

function BarberSkeleton() {
  return (
    <li className="barber-skeleton">
      <div className="barber-skeleton-pulse" style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="barber-skeleton-pulse" style={{ height: 13, width: 120, borderRadius: 6 }} />
        <div className="barber-skeleton-pulse" style={{ height: 11, width: 72, borderRadius: 6 }} />
      </div>
    </li>
  );
}

function BarberCard({ member, shopSlug, isOwner = false, shopActorId }) {
  const navigate = useNavigate();
  const actorSummary = useActorSummary(member.member_actor_id);
  const name = actorSummary?.displayName ?? member.name ?? "Barber";
  const avatar = (!actorSummary?.missing && actorSummary?.avatar && actorSummary.avatar !== "/avatar.jpg")
    ? actorSummary.avatar
    : null;
  const route = actorSummary?.route ?? null;
  const role = member.meta?.role ?? member.meta?.title ?? "Barber";
  const initial = String(name)[0].toUpperCase();

  function handleCardClick() {
    if (route) navigate(route);
  }

  function handleView(e) {
    e.stopPropagation();
    if (route) navigate(route);
  }

  function handleBook(e) {
    e.stopPropagation();
    if (shopSlug) navigate(`/profile/${shopSlug}?tab=booking`);
  }

  function handleViewSchedule(e) {
    e.stopPropagation();
    if (shopActorId) navigate(`/actor/${shopActorId}/dashboard/schedule`);
  }

  function handleEditHours(e) {
    e.stopPropagation();
    if (shopActorId) navigate(`/actor/${shopActorId}/dashboard/team`);
  }

  return (
    <li>
      <div
        className="barber-card"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleCardClick(); }}
        aria-label={`View ${name}'s profile`}
      >
        {/* Avatar */}
        <div className="barber-avatar-wrap">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="barber-avatar-img"
              onError={(e) => { e.currentTarget.src = "/avatar.jpg"; }}
            />
          ) : (
            <div className="barber-avatar-initial">{initial}</div>
          )}
        </div>

        {/* Name + role */}
        <div className="barber-card-body">
          <div className="barber-name">{name}</div>
          <div className="barber-role">{role}</div>
        </div>

        {/* Actions — owner sees management controls, customers see book/view */}
        {isOwner ? (
          <div className="barber-owner-actions">
            <button
              type="button"
              className="barber-owner-btn barber-owner-btn--schedule"
              onClick={handleViewSchedule}
              aria-label={`View ${name}'s schedule`}
            >
              Schedule
            </button>
            <button
              type="button"
              className="barber-owner-btn barber-owner-btn--hours"
              onClick={handleEditHours}
              aria-label={`Edit ${name}'s hours`}
            >
              Hours
            </button>
          </div>
        ) : (
          <div className="barber-actions">
            <button
              type="button"
              className="barber-action-btn barber-action-btn--book"
              onClick={handleBook}
              aria-label={`Book ${name}`}
            >
              Book
            </button>
            <button
              type="button"
              className="barber-action-btn barber-action-btn--view"
              onClick={handleView}
              aria-label={`View ${name}'s profile`}
            >
              View
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export default function VportBarberShopTeamView({ profile, isOwner = false }) {
  const actorId = profile?.actorId ?? profile?.actor_id ?? null;
  const shopSlug = profile?.vportSlug ?? profile?.slug ?? null;
  const navigate = useNavigate();

  const { members: allMembers, loading, error } = useVportTeam(actorId);
  const members = useMemo(
    () => (allMembers ?? []).filter((m) => m.meta?.status === "linked" && m.is_active !== false),
    [allMembers]
  );

  if (loading) {
    return (
      <div className="team-section">
        <ul className="team-list" aria-hidden="true">
          <BarberSkeleton />
          <BarberSkeleton />
        </ul>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="team-empty">
        <span className="team-empty-icon">✂️</span>
        <div className="team-empty-title">
          {isOwner ? "No barbers added yet" : "No barbers listed yet"}
        </div>
        <div className="team-empty-body">
          {isOwner
            ? "Add your first barber so customers can choose who to book with."
            : "Check back soon — the team roster isn't set up yet."}
        </div>
        {isOwner && actorId && (
          <button
            type="button"
            className="team-add-btn"
            onClick={() => navigate(`/actor/${actorId}/dashboard/team`)}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
            Add team member
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="team-section">
      <div className="team-section-header">
        <div className="team-section-title">
          {isOwner ? "Your Barbers" : "The Team"}
        </div>
        {isOwner ? (
          <button
            type="button"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.38)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
            onClick={() => navigate(`/actor/${actorId}/dashboard/team`)}
          >
            Manage →
          </button>
        ) : members.length === 1 ? (
          <div className="team-section-subtitle">
            Choose who to book with
          </div>
        ) : null}
      </div>

      <ul className="team-list">
        {members.map((m) => (
          <BarberCard
            key={m.id}
            member={m}
            shopSlug={shopSlug}
            isOwner={isOwner}
            shopActorId={actorId}
          />
        ))}
      </ul>
    </div>
  );
}
