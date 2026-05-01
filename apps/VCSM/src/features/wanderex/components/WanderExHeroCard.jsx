import { Link } from "react-router-dom";
import { WanderExStarRating } from "@/features/wanderex/components/WanderExTopNav";

export function WanderExHeroCard({
  profile,
  hasBookable,
  focusedBarber,
  directionsUrl,
  websiteUrl,
  openLeadAction,
  openShareLink,
  track,
}) {
  return (
    <section className="wx-hero-card">
      <div
        className="wx-hero-banner"
        style={{
          backgroundImage: profile.bannerUrl
            ? `linear-gradient(180deg, rgba(3,5,7,0.1), rgba(3,5,7,0.85)), url(${profile.bannerUrl})`
            : "linear-gradient(135deg, rgba(20,184,166,0.18), rgba(245,158,11,0.16))",
        }}
      />

      <div className="wx-hero-content">
        <div className="wx-row">
          <img
            className="wx-avatar"
            src={profile.logoUrl || profile.avatarUrl || "/avatar.jpg"}
            alt={profile.name}
          />
          <div>
            <div className="wx-name">{profile.name}</div>
            <div className="wx-handle">@{profile.slug}</div>
            <div className="wx-muted">
              {profile.locationText || profile.city || "Location not set"}
            </div>
            <WanderExStarRating value={profile.ratingAverage} count={profile.ratingCount} />
          </div>
        </div>

        {profile.bio ? <p className="wx-hero-subtitle">{profile.bio}</p> : null}

        {hasBookable ? (
          <Link
            to={`/p/${profile.slug}/book${focusedBarber?.actorId ? `?barber=${encodeURIComponent(focusedBarber.actorId)}` : ""}`}
            className="wx-primary-btn"
            onClick={() => track("booking_started", { source: "profile_primary_cta" })}
          >
            Book now
          </Link>
        ) : (
          <button
            type="button"
            className="wx-primary-btn"
            onClick={() =>
              openLeadAction({
                type: "message",
                title: "Message provider",
                subtitle: "Send your request and get contacted quickly.",
                message: `Hi ${profile.name}, I would like to ask about your services.`,
                submitLabel: "Send message",
              })
            }
          >
            Message
          </button>
        )}

        <div className="wx-quick-actions">
          {profile.phone ? (
            <a
              className="wx-quick-btn"
              href={`tel:${profile.phone.replace(/[^\d+]/g, "")}`}
            >
              <span className="wx-quick-icon">📞</span>
              <span className="wx-quick-label">Call</span>
            </a>
          ) : (
            <span className="wx-quick-btn wx-quick-btn--off">
              <span className="wx-quick-icon">📞</span>
              <span className="wx-quick-label">Call</span>
            </span>
          )}

          {directionsUrl ? (
            <a
              className="wx-quick-btn"
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="wx-quick-icon">📍</span>
              <span className="wx-quick-label">Directions</span>
            </a>
          ) : (
            <span className="wx-quick-btn wx-quick-btn--off">
              <span className="wx-quick-icon">📍</span>
              <span className="wx-quick-label">Directions</span>
            </span>
          )}

          {websiteUrl ? (
            <a
              className="wx-quick-btn"
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="wx-quick-icon">🌐</span>
              <span className="wx-quick-label">Website</span>
            </a>
          ) : (
            <span className="wx-quick-btn wx-quick-btn--off">
              <span className="wx-quick-icon">🌐</span>
              <span className="wx-quick-label">Website</span>
            </span>
          )}

          <button type="button" className="wx-quick-btn" onClick={openShareLink}>
            <span className="wx-quick-icon">🔗</span>
            <span className="wx-quick-label">Share</span>
          </button>
        </div>
      </div>
    </section>
  );
}
