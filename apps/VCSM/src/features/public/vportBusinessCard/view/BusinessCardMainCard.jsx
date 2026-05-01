import { Phone, MessageSquare, ExternalLink, MapPin, Send, Globe } from "lucide-react";
import CS from "@/features/public/vportBusinessCard/view/businessCardCardStyles";
import { formatPhone } from "@/features/public/vportBusinessCard/view/businessCardHelpers.jsx";

export default function BusinessCardMainCard({
  card,
  cs,
  avatarSrc,
  callHref,
  smsHref,
  profileHref,
  locationText,
  hasContacts,
  visibleCallBtn,
  visibleTextBtn,
  visibleProfileBtn,
  hasCta,
  directionsHref,
  scrollToLeadForm,
}) {
  return (
    <section style={CS.card}>

      <div style={CS.cardBand} />

      <div style={CS.cardBody}>

        {cs.identity?.show_avatar !== false ? (
          <div style={CS.logoWrap}>
            <img
              src={avatarSrc}
              alt={card.businessName}
              style={CS.logo}
              onError={(e) => { e.currentTarget.src = "/avatar.jpg"; }}
            />
          </div>
        ) : null}

        <div style={CS.identity}>
          {cs.identity?.show_business_name !== false ? (
            <div style={CS.businessName}>{card.businessName}</div>
          ) : null}
          {cs.identity?.show_handle !== false && card.slug ? (
            <div style={CS.handle}>@{card.slug}</div>
          ) : null}
          {cs.identity?.show_category_badge !== false && card.categoryKey ? (
            <div style={CS.categoryBadgeRow}>
              <span style={CS.categoryBadge}>{card.categoryKey.replace(/_/g, " ")}</span>
            </div>
          ) : null}
          {cs.identity?.show_reviews !== false && card.reviewCount > 0 && card.averageRating != null ? (
            <div style={CS.reviewRow}>
              <span style={CS.reviewScore}>{Number(card.averageRating).toFixed(1)}</span>
              <span style={CS.reviewStars}>
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} style={{ color: i < Math.round(card.averageRating) ? "#f59e0b" : "rgba(255,255,255,0.18)" }}>★</span>
                ))}
              </span>
              <span style={CS.reviewCount}>({card.reviewCount})</span>
            </div>
          ) : null}
        </div>

        {cs.identity?.show_description !== false && card.description ? (
          <p style={CS.description}>{card.description}</p>
        ) : null}

        {cs.contact?.show_contact_section !== false && hasContacts ? (
          <>
            <div style={CS.separator} />
            <div style={CS.contactList}>
              {cs.contact?.show_phone !== false && card.phone ? (
                <div style={CS.contactRow}>
                  <span style={CS.contactIconWrap}>
                    <Phone size={13} />
                  </span>
                  <a href={`tel:${encodeURIComponent(card.phone)}`} style={CS.contactLink}>
                    {formatPhone(card.phone)}
                  </a>
                </div>
              ) : null}
              {cs.contact?.show_address !== false && locationText ? (
                <div style={CS.contactRow}>
                  <span style={CS.contactIconWrap}>
                    <MapPin size={13} />
                  </span>
                  {directionsHref ? (
                    <a href={directionsHref} target="_blank" rel="noopener noreferrer" style={CS.contactLink}>
                      {locationText}
                    </a>
                  ) : (
                    <span style={CS.contactText}>{locationText}</span>
                  )}
                </div>
              ) : null}
              {cs.contact?.show_email && card.email ? (
                <div style={CS.contactRow}>
                  <span style={CS.contactIconWrap}>
                    <Globe size={13} />
                  </span>
                  <a href={`mailto:${card.email}`} style={CS.contactLink}>
                    {card.email}
                  </a>
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        <div style={CS.separator} />

        {hasCta && (
          <div style={{ ...CS.ctaRow, gridTemplateColumns: `repeat(${[visibleCallBtn, visibleTextBtn, visibleProfileBtn].filter(Boolean).length}, minmax(0, 1fr))` }}>
            {visibleCallBtn && (
              <a href={callHref} style={CS.ghostBtn}>
                <Phone size={13} />
                Call
              </a>
            )}
            {visibleTextBtn && (
              <a href={smsHref} style={CS.ghostBtn}>
                <MessageSquare size={13} />
                Text
              </a>
            )}
            {visibleProfileBtn && (
              <a href={profileHref} target="_blank" rel="noopener noreferrer" style={CS.ghostBtn}>
                <ExternalLink size={13} />
                Profile
              </a>
            )}
          </div>
        )}

        {cs.actions?.show_request_btn !== false ? (
          <button type="button" onClick={scrollToLeadForm} style={CS.primaryCta}>
            <Send size={15} />
            Send a request
          </button>
        ) : null}

      </div>
    </section>
  );
}
