import React, { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";

import { useVportBusinessCardExperience } from "@/features/wanders/core/hooks/useVportBusinessCardExperience.hook";
import { useVportBusinessCardLeadForm } from "@/features/wanders/core/hooks/useVportBusinessCardLeadForm.hook";

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
    if (created) {
      el.remove();
      return;
    }

    if (prev == null) {
      el.removeAttribute("content");
    } else {
      el.setAttribute("content", prev);
    }
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

  return parts.join(" • ");
}

function ghostButton(disabled = false) {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    padding: "11px 14px",
    border: disabled
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid rgba(255,255,255,0.18)",
    background: disabled
      ? "rgba(255,255,255,0.03)"
      : "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
    color: disabled ? "rgba(255,255,255,0.40)" : "#ffffff",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: 0.2,
    cursor: disabled ? "not-allowed" : "pointer",
    minHeight: 42,
    boxSizing: "border-box",
  };
}

function UnavailableState({ title, subtitle }) {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.unavailableBox}>
          <div style={styles.unavailableTitle}>{title}</div>
          <div style={styles.unavailableSubtitle}>{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

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

    document.title = title;

    // SPA note: these meta tags are runtime-only. Some social crawlers require
    // server-rendered metadata for reliable previews.
    const cleanups = [
      upsertMetaTag({ name: "description", content: description }),
      upsertMetaTag({ property: "og:title", content: title }),
      upsertMetaTag({ property: "og:description", content: description }),
      upsertMetaTag({ property: "og:type", content: "website" }),
      upsertMetaTag({ property: "og:url", content: publicCardUrl || window.location.href }),
    ];

    if (avatarSrc) {
      cleanups.push(upsertMetaTag({ property: "og:image", content: avatarSrc }));
    }

    return () => {
      document.title = prevTitle;
      for (let i = cleanups.length - 1; i >= 0; i -= 1) {
        try {
          cleanups[i]?.();
        } catch {
          // no-op
        }
      }
    };
  }, [avatarSrc, card, publicCardUrl]);

  const scrollToLeadForm = () => {
    leadFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <section style={styles.cardShell}>
          <div style={styles.headerRow}>
            <img src={avatarSrc} alt="VPORT logo" style={styles.avatar} />
            <div style={{ minWidth: 0 }}>
              <div style={styles.businessName}>{card.businessName}</div>
              {card.slug ? <div style={styles.handle}>@{card.slug}</div> : null}
            </div>
          </div>

          {card.description ? <p style={styles.description}>{card.description}</p> : null}

          {card.locationLabel ? (
            <div style={styles.metaRow}>
              <span style={styles.metaLabel}>Location</span>
              <span style={styles.metaValue}>{card.locationLabel}</span>
            </div>
          ) : null}

          {addressLabel ? (
            <div style={styles.metaRow}>
              <span style={styles.metaLabel}>Address</span>
              <span style={styles.metaValue}>{addressLabel}</span>
            </div>
          ) : null}

          {card.phone ? (
            <div style={styles.metaRow}>
              <span style={styles.metaLabel}>Phone</span>
              <span style={styles.metaValue}>{card.phone}</span>
            </div>
          ) : null}

          <div style={styles.ctaGrid}>
            {callHref ? (
              <a href={callHref} style={ghostButton(false)}>
                Call
              </a>
            ) : (
              <button type="button" style={ghostButton(true)} disabled>
                Call
              </button>
            )}

            {smsHref ? (
              <a href={smsHref} style={ghostButton(false)}>
                Text
              </a>
            ) : (
              <button type="button" style={ghostButton(true)} disabled>
                Text
              </button>
            )}

            {profileHref ? (
              <Link to={profileHref} style={ghostButton(false)}>
                View full profile
              </Link>
            ) : (
              <button type="button" style={ghostButton(true)} disabled>
                View full profile
              </button>
            )}

            <button type="button" onClick={scrollToLeadForm} style={ghostButton(false)}>
              Send message / request help
            </button>
          </div>
        </section>

        <section ref={leadFormRef} style={styles.formShell}>
          <h2 style={styles.formTitle}>Request Help</h2>
          <p style={styles.formSubtitle}>
            Tell {card.businessName} what you need. No signup required.
          </p>

          <form onSubmit={submit} noValidate>
            <div style={styles.fieldStack}>
              <label style={styles.label} htmlFor="lead-name">Name</label>
              <input
                id="lead-name"
                value={values.name}
                onChange={(e) => setField("name", e.target.value)}
                style={styles.input}
                placeholder="Your name"
                autoComplete="name"
              />
              {fieldErrors.name ? <div style={styles.errorText}>{fieldErrors.name}</div> : null}
            </div>

            <div style={styles.twoCol}>
              <div style={styles.fieldStack}>
                <label style={styles.label} htmlFor="lead-phone">Phone</label>
                <input
                  id="lead-phone"
                  value={values.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  style={styles.input}
                  placeholder="(555) 555-5555"
                  autoComplete="tel"
                />
              </div>

              <div style={styles.fieldStack}>
                <label style={styles.label} htmlFor="lead-email">Email</label>
                <input
                  id="lead-email"
                  value={values.email}
                  onChange={(e) => setField("email", e.target.value)}
                  style={styles.input}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {fieldErrors.email ? <div style={styles.errorText}>{fieldErrors.email}</div> : null}
              </div>
            </div>

            {fieldErrors.contact ? <div style={styles.errorText}>{fieldErrors.contact}</div> : null}

            <div style={styles.fieldStack}>
              <label style={styles.label} htmlFor="lead-message">Message</label>
              <textarea
                id="lead-message"
                value={values.message}
                onChange={(e) => setField("message", e.target.value)}
                style={{ ...styles.input, ...styles.textarea }}
                placeholder="How can we help?"
              />
              {fieldErrors.message ? <div style={styles.errorText}>{fieldErrors.message}</div> : null}
            </div>

            {formError ? <div style={styles.formError}>{formError}</div> : null}

            {submitted ? <div style={styles.successText}>Your message was sent.</div> : null}

            <button type="submit" disabled={submitting} style={styles.submitBtn}>
              {submitting ? "Sending…" : "Submit"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background:
      "radial-gradient(950px 550px at 12% 8%, rgba(108,77,246,0.18), transparent 60%), " +
      "radial-gradient(820px 440px at 88% 92%, rgba(59,130,246,0.14), transparent 60%), " +
      "#0b0b0f",
    color: "#fff",
    padding: "16px 14px 42px",
    boxSizing: "border-box",
  },

  container: {
    width: "100%",
    maxWidth: 540,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  unavailableBox: {
    borderRadius: 18,
    border: "1px solid rgba(139,92,246,0.24)",
    background: "linear-gradient(180deg, rgba(20,20,26,0.97), rgba(20,20,26,0.92))",
    boxShadow: "0 20px 44px rgba(0,0,0,0.42)",
    padding: 20,
    minHeight: 220,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    gap: 10,
  },

  unavailableTitle: {
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: 0.2,
  },

  unavailableSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.68)",
    maxWidth: 380,
    lineHeight: 1.5,
  },

  cardShell: {
    borderRadius: 18,
    border: "1px solid rgba(139,92,246,0.24)",
    background: "linear-gradient(180deg, rgba(20,20,26,0.97), rgba(20,20,26,0.92))",
    boxShadow: "0 20px 44px rgba(0,0,0,0.42)",
    padding: 16,
  },

  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 15,
    objectFit: "cover",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    flexShrink: 0,
  },

  businessName: {
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1.15,
    wordBreak: "break-word",
  },

  handle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(255,255,255,0.56)",
  },

  description: {
    marginTop: 14,
    marginBottom: 0,
    fontSize: 14,
    lineHeight: 1.55,
    color: "rgba(255,255,255,0.85)",
    whiteSpace: "pre-wrap",
  },

  metaRow: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "88px minmax(0, 1fr)",
    gap: 10,
    alignItems: "start",
  },

  metaLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.2,
    color: "rgba(255,255,255,0.52)",
    textTransform: "uppercase",
    paddingTop: 2,
  },

  metaValue: {
    fontSize: 13,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 1.45,
    wordBreak: "break-word",
  },

  ctaGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
  },

  formShell: {
    borderRadius: 18,
    border: "1px solid rgba(139,92,246,0.24)",
    background: "linear-gradient(180deg, rgba(20,20,26,0.96), rgba(20,20,26,0.90))",
    boxShadow: "0 20px 44px rgba(0,0,0,0.36)",
    padding: 16,
  },

  formTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 900,
    letterSpacing: 0.2,
  },

  formSubtitle: {
    margin: "8px 0 0",
    fontSize: 13,
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.66)",
  },

  fieldStack: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 12,
  },

  twoCol: {
    display: "grid",
    gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
    gap: 10,
  },

  label: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.78)",
    letterSpacing: 0.2,
  },

  input: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    padding: "10px 12px",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
  },

  textarea: {
    minHeight: 108,
    resize: "vertical",
    lineHeight: 1.45,
  },

  errorText: {
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(252,165,165,0.96)",
  },

  formError: {
    marginTop: 10,
    borderRadius: 10,
    padding: "8px 10px",
    border: "1px solid rgba(251,113,133,0.38)",
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
    marginTop: 12,
    width: "100%",
    borderRadius: 12,
    border: "1px solid rgba(139,92,246,0.52)",
    background: "linear-gradient(90deg, rgba(139,92,246,0.92), rgba(167,139,250,0.88))",
    color: "#fff",
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: 0.2,
    padding: "11px 14px",
    cursor: "pointer",
  },
};
