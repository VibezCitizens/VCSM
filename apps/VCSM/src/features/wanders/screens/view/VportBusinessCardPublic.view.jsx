import React, { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Phone, MessageSquare, ExternalLink, MapPin, Send } from "lucide-react";

import { useVportBusinessCardExperience } from "@/features/wanders/core/hooks/useVportBusinessCardExperience.hook";
import { useVportBusinessCardLeadForm } from "@/features/wanders/core/hooks/useVportBusinessCardLeadForm.hook";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function upsertMetaTag({ name, property, content }) {
  const selector = name
    ? `meta[name="${name}"]`
    : `meta[property="${property}"]`;

  let el = document.head.querySelector(selector);
  const created = !el;

  if (!el) {
    el = document.createElement("meta");
    if (name) el.setAttribute("name", name);
    if (property) el.setAttribute("property", property);
    document.head.appendChild(el);
  }

  const prev = el.getAttribute("content");
  el.setAttribute("content", String(content || ""));

  return () => {
    if (created) { el.remove(); return; }
    if (prev == null) { el.removeAttribute("content"); }
    else { el.setAttribute("content", prev); }
  };
}

function composeAddressLabel(card) {
  if (!card?.address) return "";
  const parts = [
    card.address.line1,
    card.address.line2,
    [card.address.city, card.address.state].filter(Boolean).join(", "),
    card.address.zip,
    card.address.country,
  ].filter(Boolean);
  return parts.join(" · ");
}

// ─── Unavailable state ────────────────────────────────────────────────────────

function UnavailableState({ title, subtitle }) {
  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.unavailableBox}>
          <div style={S.unavailableTitle}>{title}</div>
          <div style={S.unavailableSubtitle}>{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function VportBusinessCardPublicView({ slug }) {
  const leadFormRef = useRef(null);

  const { card, loading, error, unavailable } = useVportBusinessCardExperience({ slug });

  const {
    values,
    setField,
    fieldErrors,
    formError,
    submitting,
    submitted,
    submit,
  } = useVportBusinessCardLeadForm({ slug });

  const profileHref = useMemo(() => {
    if (!card?.slug) return "";
    return `/profile/${card.slug}/menu`;
  }, [card?.slug]);

  const callHref = useMemo(() => {
    if (!card?.phone) return "";
    return `tel:${encodeURIComponent(card.phone)}`;
  }, [card?.phone]);

  const smsHref = useMemo(() => {
    if (!card?.phone) return "";
    return `sms:${encodeURIComponent(card.phone)}`;
  }, [card?.phone]);

  const avatarSrc = useMemo(
    () => card?.logoUrl || card?.avatarUrl || "/avatar.jpg",
    [card?.avatarUrl, card?.logoUrl],
  );

  // Always absolute — og:image must never be a relative path for crawlers
  const ogImageUrl = useMemo(() => {
    const src = card?.logoUrl || card?.avatarUrl || "";
    if (!src) return "https://vibezcitizens.com/VportBusinnesCard.jpeg";
    if (src.startsWith("http://") || src.startsWith("https://")) return src;
    return `${window.location.origin}${src}`;
  }, [card?.avatarUrl, card?.logoUrl]);

  const addressLabel = useMemo(() => composeAddressLabel(card), [card]);

  const publicCardUrl = useMemo(() => {
    if (!slug) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/vport/${slug}/card`;
  }, [slug]);

  useEffect(() => {
    if (!card) return;

    const prevTitle = document.title;

    const title = `${card.businessName} Business Card | Vibez Citizens`;
    const description = card.description
      ? `${card.businessName} on Vibez Citizens. ${card.description}`
      : `${card.businessName} business card on Vibez Citizens.`;
    const canonicalUrl = publicCardUrl || window.location.href;

    document.title = title;

    let canonicalEl = document.head.querySelector('link[rel="canonical"]');
    const canonicalCreated = !canonicalEl;
    const prevCanonical = canonicalEl?.getAttribute("href") ?? null;
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", canonicalUrl);

    const cleanups = [
      upsertMetaTag({ name: "description",         content: description }),
      upsertMetaTag({ property: "og:title",         content: title }),
      upsertMetaTag({ property: "og:description",   content: description }),
      upsertMetaTag({ property: "og:type",          content: "website" }),
      upsertMetaTag({ property: "og:url",           content: canonicalUrl }),
      upsertMetaTag({ property: "og:image",         content: ogImageUrl }),
      upsertMetaTag({ name: "twitter:card",         content: "summary_large_image" }),
      upsertMetaTag({ name: "twitter:title",        content: title }),
      upsertMetaTag({ name: "twitter:description",  content: description }),
      upsertMetaTag({ name: "twitter:image",        content: ogImageUrl }),
    ];

    return () => {
      document.title = prevTitle;
      if (canonicalCreated) { canonicalEl.remove(); }
      else if (prevCanonical !== null) { canonicalEl.setAttribute("href", prevCanonical); }
      for (let i = cleanups.length - 1; i >= 0; i -= 1) {
        try { cleanups[i]?.(); } catch { /* no-op */ }
      }
    };
  }, [card, ogImageUrl, publicCardUrl]);

  const scrollToLeadForm = () => {
    leadFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ─── Loading / unavailable guards ─────────────────────────────────────────

  if (loading) {
    return <UnavailableState title="Loading card…" subtitle="Please wait a moment." />;
  }

  if (!slug) {
    return (
      <UnavailableState
        title="Card unavailable"
        subtitle="This business card link is missing a slug."
      />
    );
  }

  if (unavailable) {
    return (
      <UnavailableState
        title="Card unavailable"
        subtitle={
          error?.message
            ? String(error.message)
            : "This business card is not published or no longer available."
        }
      />
    );
  }

  const hasDetails = card.locationLabel || addressLabel || card.phone;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>
      <div style={S.container}>

        {/* ── Digital Business Card ───────────────────────────────────────── */}
        <section style={S.card}>
          {/* Coloured header strip — gives card-like branding at a glance */}
          <div style={S.cardStrip} />

          <div style={S.cardBody}>
            {/* Avatar floats up over the strip */}
            <div style={S.avatarWrap}>
              <img
                src={avatarSrc}
                alt={card.businessName}
                style={S.avatar}
                onError={(e) => { e.currentTarget.src = "/avatar.jpg"; }}
              />
            </div>

            {/* Identity */}
            <div style={S.identity}>
              <div style={S.businessName}>{card.businessName}</div>
              {card.slug ? <div style={S.handle}>@{card.slug}</div> : null}
            </div>

            {/* Description */}
            {card.description ? (
              <p style={S.description}>{card.description}</p>
            ) : null}

            {/* Contact details: phone + location */}
            {hasDetails ? (
              <div style={S.detailsStrip}>
                {card.phone ? (
                  <div style={S.detailRow}>
                    <Phone size={13} style={S.detailIcon} />
                    <span>{card.phone}</span>
                  </div>
                ) : null}
                {card.locationLabel ? (
                  <div style={S.detailRow}>
                    <MapPin size={13} style={S.detailIcon} />
                    <span>{card.locationLabel}</span>
                  </div>
                ) : !card.locationLabel && addressLabel ? (
                  <div style={S.detailRow}>
                    <MapPin size={13} style={S.detailIcon} />
                    <span>{addressLabel}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Divider */}
            <div style={S.divider} />

            {/* Secondary CTAs: Call · Text · Profile */}
            <div style={S.ctaRow}>
              {callHref ? (
                <a href={callHref} style={S.ghostBtn}>
                  <Phone size={14} />
                  Call
                </a>
              ) : (
                <button type="button" style={S.ghostBtnOff} disabled>
                  <Phone size={14} />
                  Call
                </button>
              )}

              {smsHref ? (
                <a href={smsHref} style={S.ghostBtn}>
                  <MessageSquare size={14} />
                  Text
                </a>
              ) : (
                <button type="button" style={S.ghostBtnOff} disabled>
                  <MessageSquare size={14} />
                  Text
                </button>
              )}

              {profileHref ? (
                <Link to={profileHref} style={S.ghostBtn}>
                  <ExternalLink size={14} />
                  Profile
                </Link>
              ) : (
                <button type="button" style={S.ghostBtnOff} disabled>
                  <ExternalLink size={14} />
                  Profile
                </button>
              )}
            </div>

            {/* Primary CTA */}
            <button type="button" onClick={scrollToLeadForm} style={S.primaryCta}>
              <Send size={15} />
              Send a request
            </button>
          </div>
        </section>

        {/* ── Lead Form ───────────────────────────────────────────────────── */}
        <section ref={leadFormRef} style={S.formCard}>
          <h2 style={S.formTitle}>Send a request</h2>
          <p style={S.formSubtitle}>
            Tell {card.businessName} what you need. No signup required.
          </p>

          <form onSubmit={submit} noValidate>
            <div style={S.field}>
              <label style={S.label} htmlFor="lead-name">Name</label>
              <input
                id="lead-name"
                value={values.name}
                onChange={(e) => setField("name", e.target.value)}
                style={S.input}
                placeholder="Your name"
                autoComplete="name"
              />
              {fieldErrors.name ? <div style={S.errorText}>{fieldErrors.name}</div> : null}
            </div>

            <div style={S.field}>
              <label style={S.label} htmlFor="lead-phone">Phone</label>
              <input
                id="lead-phone"
                value={values.phone}
                onChange={(e) => setField("phone", e.target.value)}
                style={S.input}
                placeholder="(555) 555-5555"
                autoComplete="tel"
                inputMode="tel"
              />
            </div>

            <div style={S.field}>
              <label style={S.label} htmlFor="lead-email">Email</label>
              <input
                id="lead-email"
                value={values.email}
                onChange={(e) => setField("email", e.target.value)}
                style={S.input}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
              />
              {fieldErrors.email ? <div style={S.errorText}>{fieldErrors.email}</div> : null}
            </div>

            {fieldErrors.contact ? <div style={S.errorText}>{fieldErrors.contact}</div> : null}

            <div style={S.field}>
              <label style={S.label} htmlFor="lead-message">Message</label>
              <textarea
                id="lead-message"
                value={values.message}
                onChange={(e) => setField("message", e.target.value)}
                style={{ ...S.input, ...S.textarea }}
                placeholder="How can this business help you?"
              />
              {fieldErrors.message ? <div style={S.errorText}>{fieldErrors.message}</div> : null}
            </div>

            {formError ? <div style={S.formError}>{formError}</div> : null}

            {submitted ? (
              <div style={S.successText}>Your message was sent successfully.</div>
            ) : null}

            <button type="submit" disabled={submitting} style={S.submitBtn}>
              {submitting ? "Sending…" : "Submit request"}
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background:
      "radial-gradient(900px 500px at 10% 5%, rgba(108,77,246,0.20), transparent 58%), " +
      "radial-gradient(700px 380px at 88% 90%, rgba(59,130,246,0.11), transparent 55%), " +
      "#0b0b0f",
    color: "#fff",
    padding: "20px 14px 60px",
    boxSizing: "border-box",
  },

  container: {
    width: "100%",
    maxWidth: 460,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  // ── Business card ──────────────────────────────────────────────────────────

  card: {
    borderRadius: 20,
    border: "1px solid rgba(139,92,246,0.30)",
    background: "linear-gradient(180deg, rgba(22,18,44,0.98), rgba(15,13,26,0.97))",
    boxShadow:
      "0 0 0 1px rgba(139,92,246,0.10) inset, " +
      "0 24px 56px rgba(0,0,0,0.55), " +
      "0 0 70px rgba(108,77,246,0.08)",
    overflow: "hidden",
  },

  cardStrip: {
    height: 68,
    background:
      "linear-gradient(135deg, rgba(108,77,246,0.60) 0%, rgba(139,92,246,0.40) 55%, rgba(30,20,52,0.55) 100%)",
  },

  cardBody: {
    padding: "0 18px 22px",
  },

  avatarWrap: {
    marginTop: -40,
    marginBottom: 14,
    display: "flex",
    justifyContent: "center",
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 16,
    objectFit: "cover",
    border: "2.5px solid rgba(139,92,246,0.55)",
    background: "rgba(20,18,36,0.90)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.60), 0 0 0 4px rgba(139,92,246,0.10)",
    flexShrink: 0,
  },

  identity: {
    textAlign: "center",
  },

  businessName: {
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1.15,
    letterSpacing: 0.2,
    wordBreak: "break-word",
  },

  handle: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.3,
    color: "rgba(255,255,255,0.45)",
  },

  description: {
    margin: "12px 0 0",
    fontSize: 13,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.70)",
    textAlign: "center",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },

  detailsStrip: {
    marginTop: 14,
    padding: "11px 13px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  detailRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.4,
  },

  detailIcon: {
    color: "#8b5cf6",
    flexShrink: 0,
  },

  divider: {
    margin: "16px 0 0",
    height: 1,
    background: "rgba(255,255,255,0.08)",
  },

  ctaRow: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  },

  ghostBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 11,
    padding: "10px 6px",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.2,
    cursor: "pointer",
    minHeight: 42,
    boxSizing: "border-box",
  },

  ghostBtnOff: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 11,
    padding: "10px 6px",
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.02)",
    color: "rgba(255,255,255,0.25)",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.2,
    cursor: "not-allowed",
    minHeight: 42,
    boxSizing: "border-box",
  },

  primaryCta: {
    marginTop: 10,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 13,
    border: "1px solid rgba(139,92,246,0.50)",
    background: "linear-gradient(90deg, rgba(108,77,246,0.96), rgba(139,92,246,0.90))",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 0.3,
    padding: "13px 16px",
    cursor: "pointer",
    boxSizing: "border-box",
    boxShadow: "0 8px 22px rgba(108,77,246,0.32)",
  },

  // ── Lead form ──────────────────────────────────────────────────────────────

  formCard: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.09)",
    background: "rgba(18,15,30,0.94)",
    boxShadow: "0 16px 36px rgba(0,0,0,0.38)",
    padding: "18px 18px 26px",
  },

  formTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: 0.2,
    color: "rgba(255,255,255,0.88)",
  },

  formSubtitle: {
    margin: "5px 0 0",
    fontSize: 12,
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.44)",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    marginTop: 14,
  },

  label: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.50)",
  },

  input: {
    width: "100%",
    borderRadius: 11,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    padding: "10px 12px",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
  },

  textarea: {
    minHeight: 100,
    resize: "vertical",
    lineHeight: 1.5,
  },

  errorText: {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(252,165,165,0.96)",
  },

  formError: {
    marginTop: 10,
    borderRadius: 10,
    padding: "8px 10px",
    border: "1px solid rgba(251,113,133,0.36)",
    background: "rgba(127,29,29,0.22)",
    color: "#ffd6de",
    fontSize: 12,
    fontWeight: 700,
  },

  successText: {
    marginTop: 10,
    borderRadius: 10,
    padding: "8px 10px",
    border: "1px solid rgba(110,231,183,0.34)",
    background: "rgba(6,78,59,0.32)",
    color: "#d1fae5",
    fontSize: 12,
    fontWeight: 700,
  },

  submitBtn: {
    marginTop: 14,
    width: "100%",
    borderRadius: 12,
    border: "1px solid rgba(139,92,246,0.50)",
    background: "linear-gradient(90deg, rgba(108,77,246,0.96), rgba(139,92,246,0.88))",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 0.2,
    padding: "12px 16px",
    cursor: "pointer",
    boxSizing: "border-box",
    boxShadow: "0 6px 18px rgba(108,77,246,0.28)",
  },

  // ── Unavailable ────────────────────────────────────────────────────────────

  unavailableBox: {
    borderRadius: 20,
    border: "1px solid rgba(139,92,246,0.24)",
    background: "linear-gradient(180deg, rgba(22,18,44,0.98), rgba(15,13,26,0.96))",
    boxShadow: "0 20px 44px rgba(0,0,0,0.44)",
    padding: 24,
    minHeight: 220,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    gap: 10,
  },

  unavailableTitle: {
    fontSize: 20,
    fontWeight: 900,
    letterSpacing: 0.2,
  },

  unavailableSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.58)",
    maxWidth: 360,
    lineHeight: 1.55,
  },
};
