// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\screens\WandersCardPublic.screen.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useWandersCards } from "@/features/wanders/core/hooks/useWandersCards.hook";
import { useWandersReplies } from "@/features/wanders/core/hooks/useWandersReplies";

import WandersCardPreview from "../components/WandersCardPreview";
import WandersLoading from "../components/WandersLoading";
import WandersEmptyState from "../components/WandersEmptyState";

export default function WandersCardPublicScreen() {
  const navigate = useNavigate();
  const { publicId } = useParams();

  const { readByPublicId, markOpened } = useWandersCards();

  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState(null);

  const readByPublicIdStable = useCallback((id) => Promise.resolve(readByPublicId?.(id)), [readByPublicId]);

  useEffect(() => {
    console.log("[PublicCard] route publicId:", publicId);

    if (!publicId) {
      setLoading(false);
      setCard(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);

      try {
        console.log("[PublicCard] readByPublicId start:", publicId);
        const result = await readByPublicIdStable(publicId);
        console.log("[PublicCard] readByPublicId result:", result);

        if (cancelled) return;
        setCard(result || null);
      } catch (e) {
        console.log("[PublicCard] readByPublicId error:", e);
        if (cancelled) return;
        setCard(null);
        setLoadError(e);
      } finally {
        if (!cancelled) setLoading(false);
        console.log("[PublicCard] readByPublicId done. cancelled?", cancelled);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicId, readByPublicIdStable]);

  const cardId = useMemo(() => card?.id || card?._id || card?.card_id || null, [card]);

  useEffect(() => {
    console.log("[PublicCard] card state changed:", card);
  }, [card]);

  useEffect(() => {
    console.log("[PublicCard] computed cardId:", cardId);
  }, [cardId]);

  const {
    replies,
    loading: repliesLoading,
    error: repliesError,
    refresh: refreshReplies,
    create: createReply,
    hasCard,
  } = useWandersReplies({ cardId, auto: true, limit: 200 });

  useEffect(() => {
    console.log("[PublicCard] replies hook state:", {
      hasCard,
      repliesLoading,
      repliesError,
      repliesCount: Array.isArray(replies) ? replies.length : null,
    });
  }, [hasCard, repliesLoading, repliesError, replies]);

  useEffect(() => {
    if (!cardId) return;

    let cancelled = false;

    (async () => {
      try {
        console.log("[PublicCard] markOpened start:", cardId);
        const res = await Promise.resolve(markOpened?.(cardId));
        console.log("[PublicCard] markOpened result:", res);
      } catch (e) {
        console.log("[PublicCard] markOpened error:", e);
      }
    })();

    return () => {
      cancelled = true;
      console.log("[PublicCard] markOpened cleanup. cancelled?", cancelled);
    };
  }, [cardId, markOpened]);

  const footerInboxLink = useMemo(() => {
    const inboxPublicId = card?.inboxPublicId || card?.inbox?.publicId || card?.inboxPublic?.id || card?.inbox?.id;
    if (!inboxPublicId) return "";
    return `/wanders/i/${inboxPublicId}`;
  }, [card]);

  useEffect(() => {
    console.log("[PublicCard] footerInboxLink:", footerInboxLink);
  }, [footerInboxLink]);

  const handleSendAnother = () => {
    console.log("[PublicCard] sendAnother clicked. footerInboxLink:", footerInboxLink);
    if (footerInboxLink) navigate(footerInboxLink);
  };

  const handleCreateYourOwn = () => {
    const realmId = card?.realmId || card?.realm_id || null;
    console.log("[PublicCard] createYourOwn clicked. realmId:", realmId);

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

  const canSubmitReply = useMemo(() => {
    const text = String(replyBody ?? "").trim();
    return Boolean(hasCard && cardId && text && !replying);
  }, [hasCard, cardId, replyBody, replying]);

  useEffect(() => {
    console.log("[PublicCard] reply state:", {
      replyBodyLen: String(replyBody ?? "").length,
      replying,
      canSubmitReply,
      replyError,
      repliesError,
      hasCard,
      cardId,
    });
  }, [replyBody, replying, canSubmitReply, replyError, repliesError, hasCard, cardId]);

  const handleSubmitReply = async () => {
    console.log("[PublicCard] Reply button clicked.");
    if (!canSubmitReply) return;

    const body = String(replyBody ?? "").trim();
    if (!body) return;

    if (!cardId) {
      const err = new Error("Missing card id (cardId is null).");
      setReplyError(err);
      return;
    }

    setReplying(true);
    setReplyError(null);

    try {
      console.log("[PublicCard] submitting reply:", { cardId, body });

      const created = await Promise.resolve(createReply?.({ cardId, body }));

      console.log("[PublicCard] reply created OK:", created);

      setReplyBody("");

      console.log("[PublicCard] refreshing replies…");
      await Promise.resolve(refreshReplies?.());
      console.log("[PublicCard] refreshReplies OK");
    } catch (e) {
      console.log("[PublicCard] reply create error:", e);
      setReplyError(e);
    } finally {
      setReplying(false);
      console.log("[PublicCard] submit flow done.");
    }
  };

  if (loading) return <WandersLoading />;

  if (!publicId) {
    return <WandersEmptyState title="Missing card id" description="We couldn’t find a card public id in the URL." />;
  }

  if (!card) {
    return (
      <WandersEmptyState
        title="Card not found"
        description={
          loadError
            ? String(loadError?.message || loadError)
            : "This card link is invalid or the card is unavailable."
        }
      />
    );
  }

  const visibleRepliesCount = (replies ?? []).filter((r) => !r?.is_deleted).length;

  const replyInputClassName = `
    w-full px-4 py-2 pr-10
    rounded-2xl bg-neutral-900 text-white
    border border-purple-700
    focus:ring-2 focus:ring-purple-500
  `.trim();

  return (
    <div className="wanders-card-public" style={styles.pageOuter}>
      <div aria-hidden style={styles.bgGlow} />

      <div style={styles.page}>
        <div style={styles.stack}>
          <div style={styles.panel}>
            <div aria-hidden style={styles.glowTL} />
            <div aria-hidden style={styles.glowBR} />

            <div style={styles.panelHeader}>
              <div style={styles.panelTitle}>Card</div>
            </div>
            <div style={styles.panelBody}>
              <WandersCardPreview card={card} draftPayload={card} />
            </div>
          </div>

          <div style={styles.panel}>
            <div aria-hidden style={styles.glowTL} />
            <div aria-hidden style={styles.glowBR} />

            <div style={styles.panelHeader}>
              <div style={styles.panelTitle}>Reply</div>
              <div style={styles.panelMeta}>{repliesLoading ? "Loading…" : String(visibleRepliesCount)}</div>
            </div>

            <div style={styles.panelBody}>
              <textarea
                className={replyInputClassName}
                placeholder="Write a reply…"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={4}
                inputMode="text"
                autoCapitalize="sentences"
                autoCorrect="on"
                spellCheck
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

              <div style={styles.replyActions}>
                <button
                  style={{
                    ...styles.primaryBtn,
                    opacity: canSubmitReply ? 1 : 0.55,
                    cursor: canSubmitReply ? "pointer" : "not-allowed",
                  }}
                  onClick={handleSubmitReply}
                  type="button"
                  disabled={!canSubmitReply}
                >
                  <span aria-hidden style={styles.btnSheen} />
                  <span aria-hidden style={styles.btnInnerRing} />
                  <span style={styles.btnText}>{replying ? "Sending…" : "Reply"}</span>
                </button>

                <button
                  style={styles.secondaryBtn}
                  onClick={() => {
                    console.log("[PublicCard] Clear clicked.");
                    setReplyBody("");
                    setReplyError(null);
                  }}
                  type="button"
                >
                  <span aria-hidden style={styles.btnSheenSoft} />
                  <span aria-hidden style={styles.btnInnerRingSoft} />
                  <span style={styles.btnText}>{replying ? "…" : "Clear"}</span>
                </button>
              </div>

              <div style={styles.divider} />

              <div style={styles.repliesList}>
                {(replies ?? [])
                  .filter((r) => !r?.is_deleted)
                  .slice()
                  .reverse()
                  .map((r) => (
                    <div key={r.id} style={styles.replyItem}>
                      <div style={styles.replyItemMeta}>
                        <span style={styles.replyItemDate}>
                          {r?.created_at ? new Date(r.created_at).toLocaleString() : ""}
                        </span>
                      </div>
                      <div style={styles.replyItemBody}>{r?.body || ""}</div>
                    </div>
                  ))}

                {!repliesLoading && !visibleRepliesCount ? <div style={styles.mutedSmall}>No replies yet.</div> : null}
              </div>
            </div>
          </div>
        </div>

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

            <button style={styles.footerBtn} onClick={handleCreateYourOwn} type="button">
              <span aria-hidden style={styles.btnSheenSoft} />
              <span aria-hidden style={styles.btnInnerRingSoft} />
              <span style={styles.btnText}>Create your own</span>
            </button>
          </div>

          <div style={styles.brand}>Wanders</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageOuter: {
    position: "relative",
    width: "100%",
    minHeight: "100dvh",
    background: "#000",
    color: "#fff",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  },

  bgGlow: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    background: "radial-gradient(600px 200px at 50% -80px, rgba(168,85,247,0.15), transparent)",
  },

  page: {
    position: "relative",
    width: "100%",
    minHeight: "100%",
    padding: 16,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    maxWidth: 960,
    margin: "0 auto",
  },

  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  panel: {
    position: "relative",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.55), 0 0 36px rgba(124,58,237,0.10)",
    overflow: "hidden",
  },

  glowTL: {
    pointerEvents: "none",
    position: "absolute",
    top: -64,
    left: -64,
    width: 224,
    height: 224,
    borderRadius: 9999,
    background: "rgba(124,58,237,0.10)",
    filter: "blur(48px)",
  },

  glowBR: {
    pointerEvents: "none",
    position: "absolute",
    right: -80,
    bottom: -80,
    width: 288,
    height: 288,
    borderRadius: 9999,
    background: "rgba(217,70,239,0.08)",
    filter: "blur(56px)",
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

  replyActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },

  primaryBtn: {
    position: "relative",
    overflow: "hidden",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(24,24,27,0.92)",
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    fontWeight: 800,
    minWidth: 92,
    boxShadow: "0 10px 26px rgba(0,0,0,0.75)",
    transition: "transform 120ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease",
  },

  secondaryBtn: {
    position: "relative",
    overflow: "hidden",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.28)",
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontWeight: 800,
    boxShadow: "0 8px 20px rgba(0,0,0,0.55)",
    transition: "transform 120ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease",
  },

  btnSheen: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(255,255,255,0.10), transparent 55%)",
  },

  btnInnerRing: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    borderRadius: 12,
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)",
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

  repliesList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  replyItem: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    padding: 10,
    boxSizing: "border-box",
    background: "rgba(0,0,0,0.22)",
  },

  replyItemMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },

  replyItemDate: {
    fontSize: 11,
    fontWeight: 800,
    color: "rgba(255,255,255,0.78)",
    opacity: 0.9,
  },

  replyItemBody: {
    fontSize: 13,
    whiteSpace: "pre-wrap",
    lineHeight: 1.35,
    color: "rgba(255,255,255,0.90)",
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
