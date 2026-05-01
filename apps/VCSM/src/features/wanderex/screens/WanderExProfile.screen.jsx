import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useWanderExProfile } from "@/features/wanderex/hooks/useWanderExProfile";
import { useWanderExSeo } from "@/features/wanderex/hooks/useWanderExSeo";
import { useWanderExAnalytics } from "@/features/wanderex/hooks/useWanderExAnalytics";
import {
  composeDirectionsUrl,
  timeFromMinutes,
} from "@/features/wanderex/model/wanderexPublic.model";
import { WanderExLeadActionModal } from "@/features/wanderex/components/WanderExLeadActionModal";
import { WanderExTopNav } from "@/features/wanderex/components/WanderExTopNav";
import { WanderExHeroCard } from "@/features/wanderex/components/WanderExHeroCard";
import { normalizeWebsite, prettifyDate } from "@/features/wanderex/screens/wanderexProfileScreen.model";
import "@/features/wanderex/styles/wanderex-public.css";

export function WanderExProfileScreen() {
  const { slug, barberId } = useParams();
  const navigate = useNavigate();
  const track = useWanderExAnalytics({ page: "profile", slug });

  const { loading, error, bundle, refresh } = useWanderExProfile(slug);

  const [leadAction, setLeadAction] = useState(null);

  const profile = bundle?.profile || null;
  const services = bundle?.services || [];
  const team = bundle?.team || [];
  const reviews = bundle?.reviews || [];
  const hasBookable = Boolean(bundle?.hasBookable && bundle?.bookableServices?.length);

  const focusedBarber = useMemo(() => {
    if (!barberId) return null;
    return (
      team.find((member) => String(member.actorId) === String(barberId)) ||
      team.find((member) => String(member.id) === String(barberId)) ||
      null
    );
  }, [barberId, team]);

  useEffect(() => {
    if (!profile?.slug) return;

    const id = setInterval(() => {
      refresh();
    }, 45_000);

    return () => clearInterval(id);
  }, [profile?.slug, refresh]);

  useEffect(() => {
    if (!profile?.slug) return;
    track("profile_view", { profileSlug: profile.slug, profileId: profile.profileId });
  }, [profile?.profileId, profile?.slug, track]);

  useWanderExSeo({
    title: profile?.name ? `${profile.name} | WanderEx` : "Provider | WanderEx",
    description:
      profile?.bio ||
      "Public provider profile for WanderEx. View services, availability, reviews, and send booking requests.",
    canonicalPath: profile?.slug ? `/p/${profile.slug}` : `/p/${slug || ""}`,
    imageUrl: profile?.logoUrl || profile?.avatarUrl || "",
  });

  function openLeadAction(payload) {
    setLeadAction(payload);
    track("cta_click", { cta: payload.type });
  }

  function handleLeadSubmitted() {
    const followup = leadAction?.followup;
    setLeadAction(null);
    if (typeof followup === "function") followup();
  }

  function openShareLink() {
    const targetUrl = `${window.location.origin}/p/${profile.slug}`;
    const sharePayload = {
      title: profile.name,
      text: `Check out ${profile.name} on WanderEx`,
      url: targetUrl,
    };

    if (navigator.share) {
      navigator.share(sharePayload).catch(() => null);
      return;
    }

    navigator.clipboard?.writeText(targetUrl).catch(() => null);
  }

  if (loading) {
    return (
      <div className="wx-page">
        <WanderExTopNav />
        <main className="wx-container">
          <p className="wx-empty">Loading profile...</p>
        </main>
      </div>
    );
  }

  if (error || !bundle || !profile) {
    if (slug) {
      return <Navigate to={`/vport/${encodeURIComponent(slug)}/card`} replace />;
    }
    return (
      <div className="wx-page">
        <WanderExTopNav />
        <main className="wx-container">
          <div className="wx-section">
            <h1 className="wx-section-title">Profile unavailable</h1>
            <p className="wx-empty">
              {error?.message || "This provider is hidden or unavailable in the public directory."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const websiteUrl = normalizeWebsite(profile.websiteUrl);
  const directionsUrl = composeDirectionsUrl(profile);

  return (
    <div className="wx-page">
      <WanderExTopNav />
      <main className="wx-container">
        <WanderExHeroCard
          profile={profile}
          hasBookable={hasBookable}
          focusedBarber={focusedBarber}
          directionsUrl={directionsUrl}
          websiteUrl={websiteUrl}
          openLeadAction={openLeadAction}
          openShareLink={openShareLink}
          track={track}
        />

        <section className="wx-section">
          <h2 className="wx-section-title">Services</h2>
          {services.length === 0 ? (
            <p className="wx-empty">No public services yet.</p>
          ) : (
            <div className="wx-service-list">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className="wx-service-btn"
                  onClick={() => {
                    track("booking_started", { source: "service_click", serviceId: service.id });
                    navigate(`/p/${profile.slug}/book?service=${encodeURIComponent(service.id)}`);
                  }}
                >
                  <div className="wx-space-between">
                    <strong>{service.label}</strong>
                    <span className="wx-price">{service.priceLabel || "Price on request"}</span>
                  </div>
                  <div className="wx-muted">
                    {service.durationMinutes} min
                    {service.description ? ` · ${service.description}` : ""}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="wx-section">
          <h2 className="wx-section-title">Availability preview</h2>
          {team.length === 0 ? (
            <p className="wx-empty">No team members are currently linked for booking.</p>
          ) : (
            <div className="wx-team-list">
              {(focusedBarber ? [focusedBarber] : team).map((member) => (
                <article key={member.id} className="wx-team-card">
                  <div className="wx-space-between">
                    <strong>{member.name}</strong>
                    <span className={`wx-tag ${member.isOpenNow ? "open" : ""}`}>
                      {member.isOpenNow ? "Open now" : "Next openings"}
                    </span>
                  </div>

                  <div className="wx-chip-row" style={{ marginTop: 8 }}>
                    {member.nextSlots?.length ? (
                      member.nextSlots.map((slot) => (
                        <Link
                          key={`${member.id}-${slot.iso}`}
                          to={`/p/${profile.slug}/book?barber=${encodeURIComponent(
                            member.actorId || member.id
                          )}&date=${encodeURIComponent(slot.dateKey)}&time=${encodeURIComponent(
                            timeFromMinutes(slot.startMinutes)
                          )}`}
                          className="wx-chip"
                        >
                          {prettifyDate(slot.iso)}
                        </Link>
                      ))
                    ) : (
                      <span className="wx-empty">No slots in the next 14 days</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="wx-section">
          <h2 className="wx-section-title">Team</h2>
          {team.length === 0 ? (
            <p className="wx-empty">No team listed.</p>
          ) : (
            <div className="wx-team-list">
              {team.map((member) => (
                <article key={member.id} className="wx-team-card">
                  <div className="wx-space-between">
                    <div>
                      <strong>{member.name}</strong>
                      <div className="wx-muted">Barber lane</div>
                    </div>
                    <Link to={`/p/${profile.slug}/${member.actorId || member.id}`} className="wx-secondary-btn">
                      View lane
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="wx-section">
          <h2 className="wx-section-title">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="wx-empty">No reviews yet.</p>
          ) : (
            <div className="wx-review-list">
              {reviews.map((review) => (
                <article key={review.id} className="wx-review-card">
                  <div className="wx-space-between">
                    <strong>{review.authorDisplayName}</strong>
                    <span className="wx-rating">{Number(review.overallRating || 0).toFixed(1)} ★</span>
                  </div>
                  <p className="wx-muted" style={{ marginTop: 6 }}>
                    {review.body || "No written review."}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

      </main>

      <div className="wx-sticky-cta">
        {hasBookable ? (
          <Link
            to={`/p/${profile.slug}/book${focusedBarber?.actorId ? `?barber=${encodeURIComponent(focusedBarber.actorId)}` : ""}`}
            className="wx-primary-btn wx-sticky-book-btn"
            onClick={() => track("booking_started", { source: "sticky_cta" })}
          >
            Book Now
          </Link>
        ) : (
          <button
            type="button"
            className="wx-primary-btn wx-sticky-book-btn"
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
      </div>

      <WanderExLeadActionModal
        open={Boolean(leadAction)}
        slug={profile.slug}
        actionType={leadAction?.type}
        actionTitle={leadAction?.title}
        actionSubtitle={leadAction?.subtitle}
        defaultMessage={leadAction?.message}
        submitLabel={leadAction?.submitLabel}
        onClose={() => setLeadAction(null)}
        onSubmitted={handleLeadSubmitted}
      />
    </div>
  );
}

export default WanderExProfileScreen;
