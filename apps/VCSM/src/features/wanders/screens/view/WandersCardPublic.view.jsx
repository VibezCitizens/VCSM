// src/features/wanders/screens/view/WandersCardPublic.view.jsx
// ============================================================================
// WANDERS VIEW SCREEN — PUBLIC CARD
// Contract: Domain experience composition (hooks + UI).
// - no DAL, no Supabase
// - no controllers directly
// - navigation only as UI intent handlers
// ============================================================================

import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import WandersCardPreview from "@/features/wanders/components/WandersCardPreview";
import WandersLoading from "@/features/wanders/components/WandersLoading";
import WandersEmptyState from "@/features/wanders/components/WandersEmptyState";
import WandersShowLoveCTA from "@/features/wanders/components/WandersShowLoveCTA";
import WandersRepliesList from "@/features/wanders/components/WandersRepliesList";
import WandersReplyComposer from "@/features/wanders/components/WandersReplyComposer";

import { useWandersReplies } from "@/features/wanders/core/hooks/useWandersReplies";
import { useWandersPublicCardExperience } from "@/features/wanders/core/hooks/useWandersPublicCardExperience.hook";

import { WANDERS_CHROME as C } from "@/features/wanders/utils/wandersChrome";

const ALLOWED_INTERNAL_CTA_ROUTES = [
  /^\/vport\/[a-z0-9][a-z0-9-]*\/card\/?(?:[?#].*)?$/i,
  /^\/profile\/[a-z0-9][a-z0-9-]*\/menu\/?(?:[?#].*)?$/i,
  /^\/profile\/[a-z0-9][a-z0-9-]*\/reviews\/?(?:[?#].*)?$/i,
];

function safeTrim(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function safeParseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;

  const source = value.trim();
  if (!source) return null;

  try {
    const parsed = JSON.parse(source);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeCtaType(value) {
  const raw = safeTrim(value).toLowerCase();
  if (raw === "visit_vport" || raw === "call" || raw === "message") return raw;
  return "none";
}

function defaultCtaLabel(type) {
  if (type === "visit_vport") return "View full profile";
  if (type === "call") return "Call now";
  if (type === "message") return "Send message";
  return "Open";
}

function sanitizeCtaUrl(rawUrl) {
  const value = safeTrim(rawUrl);
  if (!value) return null;

  if (value.startsWith("/")) {
    const allowed = ALLOWED_INTERNAL_CTA_ROUTES.some((pattern) => pattern.test(value));
    if (!allowed) return null;
    return {
      url: value,
      isExternal: false,
    };
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return {
      url: parsed.toString(),
      isExternal: true,
    };
  } catch {
    return null;
  }
}

function readCardCta(card) {
  if (!card) return null;

  const customizationRaw =
    card?.customization ??
    card?.customization_json ??
    card?.customizationJson ??
    null;

  const customization =
    safeParseJson(customizationRaw) ??
    (customizationRaw && typeof customizationRaw === "object" ? customizationRaw : {});

  const ctaRaw = customization?.cta && typeof customization.cta === "object" ? customization.cta : null;
  if (!ctaRaw) return null;

  const ctaType = normalizeCtaType(ctaRaw?.type);
  if (ctaType === "none") return null;

  const vportSlug = safeTrim(customization?.vport_slug ?? customization?.vportSlug)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

  const rawUrl =
    safeTrim(ctaRaw?.url) ||
    (ctaType === "visit_vport" && vportSlug ? `/vport/${vportSlug}/card` : "");

  const safeUrl = sanitizeCtaUrl(rawUrl);
  if (!safeUrl) return null;

  return {
    type: ctaType,
    label: safeTrim(ctaRaw?.label) || defaultCtaLabel(ctaType),
    url: safeUrl.url,
    isExternal: safeUrl.isExternal,
    templateKey: safeTrim(card?.template_key ?? card?.templateKey) || null,
    campaign: safeTrim(customization?.campaign) || null,
  };
}

export default function WandersCardPublicView({ publicId }) {
  const navigate = useNavigate();

  const { card, cardId, loading, error: loadError, trackCtaClick } = useWandersPublicCardExperience({ publicId });

  const [replying, setReplying] = useState(false);
  const [ctaBusy, setCtaBusy] = useState(false);
  const [replyError, setReplyError] = useState(null);

  const {
    replies,
    loading: repliesLoading,
    error: repliesError,
    refresh: refreshReplies,
    create: createReply,
    hasCard,
  } = useWandersReplies({ cardId, auto: true, limit: 200 });

  const footerInboxLink = useMemo(() => {
    const inboxPublicId =
      card?.inboxPublicId || card?.inbox?.publicId || card?.inboxPublic?.id || card?.inbox?.id;
    if (!inboxPublicId) return "";
    return `/wanders/i/${inboxPublicId}`;
  }, [card]);

  const handleSendAnother = () => {
    if (footerInboxLink) navigate(footerInboxLink);
  };

  const handleCreateYourOwn = () => {
    const realmId = card?.realmId || card?.realm_id || null;

    navigate("/wanders/create", {
      state: {
        realmId,
        baseUrl: (() => {
          try {
            if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
          } catch (_ERR) {
            void _ERR;
          }
          return "";
        })(),
      },
    });
  };

  const visibleReplies = useMemo(() => {
    const list = Array.isArray(replies) ? replies : [];
    return list.filter((r) => !r?.is_deleted);
  }, [replies]);

  const orderedReplies = useMemo(() => {
    // Keep your existing behavior: newest first
    return visibleReplies.slice().reverse();
  }, [visibleReplies]);

  const canSubmit = Boolean(hasCard && cardId && !replying);
  const cardCta = useMemo(() => readCardCta(card), [card]);

  const handleReplySubmit = async ({ body }) => {
    if (!canSubmit) return;
    const trimmed = String(body || "").trim();
    if (!trimmed) return;
    if (!cardId) return;

    setReplying(true);
    setReplyError(null);

    try {
      await Promise.resolve(createReply?.({ cardId, body: trimmed }));
      await Promise.resolve(refreshReplies?.());
    } catch (e) {
      setReplyError(e);
      throw e;
    } finally {
      setReplying(false);
    }
  };

  const handleCardCtaClick = useCallback(async () => {
    if (!cardCta || ctaBusy) return;

    setCtaBusy(true);

    try {
      await Promise.resolve(
        trackCtaClick?.({
          ctaType: cardCta.type,
          ctaUrl: cardCta.url,
          templateKey: cardCta.templateKey,
          campaign: cardCta.campaign,
        })
      );
    } catch (_ERR) {
      // best-effort analytics; do not block CTA navigation
      void _ERR;
    } finally {
      setCtaBusy(false);
    }

    if (cardCta.isExternal) {
      try {
        window.open(cardCta.url, "_blank", "noopener,noreferrer");
      } catch (_ERR) {
        void _ERR;
      }
      return;
    }

    navigate(cardCta.url);
  }, [cardCta, ctaBusy, navigate, trackCtaClick]);

  if (loading) return <WandersLoading />;

  if (!publicId) {
    return (
      <WandersEmptyState
        title="Missing card id"
        description="We couldn’t find a card public id in the URL."
      />
    );
  }

  if (!card) {
    return (
      <WandersEmptyState
        title="Card not found"
        description={
          loadError ? String(loadError?.message || loadError) : "This card link is invalid or the card is unavailable."
        }
      />
    );
  }

  const visibleRepliesCount = orderedReplies.length;

  return (
    <div className={C.shell}>
      <div aria-hidden className={C.bgGlow} />

      <main className={C.main}>
        <div style={styles.stack}>
          {/* CARD */}
          <div className={C.dashBox}>
            <div aria-hidden className={C.glowTL} />
            <div aria-hidden className={C.glowBR} />

            <div style={styles.panelHeader}>
              <div style={styles.panelTitle}>Card</div>
            </div>

            <div style={styles.panelBody}>
              <WandersCardPreview card={card} draftPayload={card} />

              {cardCta ? (
                <>
                  <div style={styles.divider} />

                  <div style={styles.ctaWrap}>
                    <div style={styles.ctaMeta}>
                      {cardCta.type === "call"
                        ? "Call to Connect"
                        : cardCta.type === "message"
                        ? "Quick Message"
                        : cardCta.campaign?.startsWith("teacher_appreciation")
                        ? "Teacher Appreciation Special"
                        : "Special Offer"}
                    </div>

                    <button
                      type="button"
                      onClick={handleCardCtaClick}
                      disabled={ctaBusy}
                      style={{
                        ...styles.ctaBtn,
                        ...(ctaBusy ? styles.ctaBtnBusy : null),
                      }}
                    >
                      <span aria-hidden style={styles.btnSheenSoft} />
                      <span aria-hidden style={styles.btnInnerRingSoft} />
                      <span style={styles.btnText}>{ctaBusy ? "Opening…" : cardCta.label}</span>
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* REPLY */}
          <div className={C.dashBox}>
            <div aria-hidden className={C.glowTL} />
            <div aria-hidden className={C.glowBR} />

            <div style={styles.panelHeader}>
              <div style={styles.panelTitle}>Reply</div>
              <div style={styles.panelMeta}>{repliesLoading ? "Loading…" : String(visibleRepliesCount)}</div>
            </div>

            <div style={styles.panelBody}>
              <WandersReplyComposer
                onSubmit={handleReplySubmit}
                onSent={refreshReplies}
                loading={replying}
                disabled={!hasCard || !cardId}
                placeholder="Write a reply…"
                buttonLabel="Reply"
              />

              {replyError || repliesError ? (
                <div style={styles.error}>
                  {String(
                    replyError?.message ||
                      replyError ||
                      repliesError?.message ||
                      repliesError ||
                      "Something went wrong."
                  )}
                </div>
              ) : null}

              <div style={styles.divider} />

              <WandersRepliesList
                replies={orderedReplies}
                labelMode="neutral"
                emptyComponent={!repliesLoading ? <div style={styles.mutedSmall}>No replies yet.</div> : null}
              />
            </div>
          </div>

          {/* FOOTER */}
          <div style={styles.footer}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {footerInboxLink ? (
                <button style={styles.footerBtn} onClick={handleSendAnother} type="button">
                  <span aria-hidden style={styles.btnSheenSoft} />
                  <span aria-hidden style={styles.btnInnerRingSoft} />
                  <span style={styles.btnText}>Send another</span>
                </button>
              ) : (
                <div style={styles.muted}> </div>
              )}

              <WandersShowLoveCTA
                onClick={handleCreateYourOwn}
                label="✨ SHOW LOVE TO MORE PEOPLE ✨"
                style={styles.showLoveBtn}
                sheenStyle={styles.showLoveSheen}
                innerRingStyle={styles.showLoveInnerRing}
                textStyle={styles.showLoveText}
              />
            </div>

            <div style={styles.brand}>Wanders</div>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 12px",
    borderBottom: "1px solid var(--vc-border)",
    background: "rgba(0,0,0,0.22)",
  },

  panelTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "var(--vc-text)",
    letterSpacing: 0.2,
  },

  panelMeta: {
    fontSize: 12,
    fontWeight: 800,
    color: "var(--vc-text-soft)",
  },

  panelBody: {
    position: "relative",
    padding: 12,
    boxSizing: "border-box",
  },

  divider: {
    height: 1,
    background: "var(--vc-border)",
    marginTop: 12,
    marginBottom: 12,
  },

  error: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 800,
    color: "var(--vc-error)",
  },

  mutedSmall: {
    fontSize: 12,
    fontWeight: 800,
    color: "var(--vc-text-soft)",
    opacity: 0.9,
  },

  ctaWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  ctaMeta: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.55,
    textTransform: "uppercase",
    color: "var(--vc-text-muted)",
  },

  ctaBtn: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,105,198,0.42)",
    background: "linear-gradient(135deg, rgba(139,92,246,0.38), rgba(255,105,198,0.38))",
    color: "var(--vc-text)",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 900,
    boxShadow: "0 10px 24px rgba(0,0,0,0.45), 0 0 28px rgba(255,105,198,0.18)",
    transition: "transform 120ms ease, box-shadow 180ms ease, opacity 120ms ease",
  },

  ctaBtnBusy: {
    opacity: 0.85,
    cursor: "wait",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 4,
    opacity: 0.95,
  },

  footerBtn: {
    position: "relative",
    overflow: "hidden",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--vc-border)",
    background: "var(--vc-surface)",
    color: "var(--vc-text)",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 8px 20px rgba(0,0,0,0.55)",
    transition: "transform 120ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease",
  },

  btnSheenSoft: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(255,255,255,0.08), transparent 60%)",
  },

  btnInnerRingSoft: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    borderRadius: 12,
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
  },

  btnText: {
    position: "relative",
    zIndex: 1,
  },

  showLoveBtn: {
    position: "relative",
    overflow: "hidden",
    padding: "12px 18px",
    borderRadius: 12,
    border: "0px solid transparent",
    background: "linear-gradient(135deg, #ec4899, #ef4444)",
    color: "#fff",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 900,
    boxShadow: "0 10px 30px rgba(239,68,68,0.35), 0 0 40px rgba(236,72,153,0.25)",
    transition: "transform 120ms ease, box-shadow 180ms ease",
  },

  showLoveSheen: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(255,255,255,0.18), transparent 55%)",
  },

  showLoveInnerRing: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    borderRadius: 12,
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22)",
  },

  showLoveText: {
    position: "relative",
    zIndex: 1,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },

  brand: {
    fontSize: 13,
    fontWeight: 800,
    color: "var(--vc-text-soft)",
    opacity: 0.9,
  },

  muted: {
    fontSize: 13,
    opacity: 0.55,
    color: "var(--vc-text-soft)",
  },
};
