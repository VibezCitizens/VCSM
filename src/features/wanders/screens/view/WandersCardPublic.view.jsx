// src/features/wanders/screens/view/WandersCardPublic.view.jsx
// ============================================================================
// WANDERS VIEW SCREEN — PUBLIC CARD
// Contract: Domain experience composition (hooks + UI).
// - no DAL, no Supabase
// - no controllers directly
// - navigation only as UI intent handlers
// ============================================================================

import React, { useMemo, useState } from "react";
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

export default function WandersCardPublicView({ publicId }) {
  const navigate = useNavigate();

  const { card, cardId, loading, error: loadError } = useWandersPublicCardExperience({ publicId });

  const [replying, setReplying] = useState(false);
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
          } catch {}
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
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.22)",
  },

  panelTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "rgba(255,255,255,0.92)",
    letterSpacing: 0.2,
  },

  panelMeta: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.78)",
  },

  panelBody: {
    position: "relative",
    padding: 12,
    boxSizing: "border-box",
  },

  divider: {
    height: 1,
    background: "rgba(255,255,255,0.10)",
    marginTop: 12,
    marginBottom: 12,
  },

  error: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(252,165,165,0.95)",
  },

  mutedSmall: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.70)",
    opacity: 0.9,
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
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.30)",
    color: "rgba(255,255,255,0.92)",
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
    color: "rgba(255,255,255,0.85)",
    opacity: 0.9,
  },

  muted: {
    fontSize: 13,
    opacity: 0.55,
    color: "rgba(255,255,255,0.75)",
  },
};
