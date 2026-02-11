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

  const readByPublicIdStable = useCallback(
    (id) => Promise.resolve(readByPublicId?.(id)),
    [readByPublicId]
  );

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
    const inboxPublicId =
      card?.inboxPublicId || card?.inbox?.publicId || card?.inboxPublic?.id || card?.inbox?.id;

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
    return Boolean(hasCard && text && !replying);
  }, [hasCard, replyBody, replying]);

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

    setReplying(true);
    setReplyError(null);

    try {
      console.log("[PublicCard] submitting reply:", { cardId, body });
      const created = await createReply({ body });
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
    return <WandersEmptyState title="Missing card id" subtitle="We couldn’t find a card public id in the URL." />;
  }

  if (!card) {
    return (
      <WandersEmptyState
        title="Card not found"
        subtitle={loadError ? String(loadError?.message || loadError) : "This card link is invalid or the card is unavailable."}
      />
    );
  }

  const visibleRepliesCount = (replies ?? []).filter((r) => !r?.is_deleted).length;

  return (
    <div className="wanders-card-public" style={styles.page}>
      {/* TOP: make both panels feel “parallel” */}
      <div style={styles.stack}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}>Card</div>
          </div>
          <div style={styles.panelBody}>
            <WandersCardPreview card={card} draftPayload={card} />
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}>Reply</div>
            <div style={styles.panelMeta}>{repliesLoading ? "Loading…" : String(visibleRepliesCount)}</div>
          </div>

          <div style={styles.panelBody}>
            {/* iOS zoom fix: fontSize >= 16 */}
            <textarea
              style={styles.textarea}
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
                {replying ? "Sending…" : "Reply"}
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
                Clear
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

              {!repliesLoading && !visibleRepliesCount ? (
                <div style={styles.mutedSmall}>No replies yet.</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {footerInboxLink ? (
            <button style={styles.footerBtn} onClick={handleSendAnother} type="button">
              Send another
            </button>
          ) : (
            <div style={styles.muted}> </div>
          )}

          <button style={styles.footerBtn} onClick={handleCreateYourOwn} type="button">
            Create your own
          </button>
        </div>

        <div style={styles.brand}>Wanders</div>
      </div>
    </div>
  );
}

const styles = {
  page: {
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

  // Keeps the two “boxes” aligned and consistent
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  // ✅ Parallel panel style (contrast for dark page)
  panel: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.30)",
    overflow: "hidden",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: 800,
    opacity: 0.95,
    color: "rgba(255,255,255,0.92)",
  },
  panelMeta: {
    fontSize: 12,
    fontWeight: 800,
    opacity: 0.8,
    color: "rgba(255,255,255,0.78)",
  },
  panelBody: {
    padding: 12,
    boxSizing: "border-box",
  },

  // ✅ More contrast + iOS zoom fix (fontSize 16)
  textarea: {
    width: "100%",
    resize: "vertical",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.35)",
    color: "rgba(255,255,255,0.92)",
    padding: 12,
    boxSizing: "border-box",
    fontSize: 16, // ✅ prevents iOS focus zoom
    lineHeight: 1.35,
    outline: "none",
    WebkitTextSizeAdjust: "100%",
  },

  replyActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },

  primaryBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 800,
    minWidth: 92,
  },
  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.22)",
    color: "rgba(255,255,255,0.86)",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 800,
    opacity: 0.95,
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
    color: "rgba(255,190,190,0.95)",
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
    opacity: 0.75,
    fontWeight: 800,
    color: "rgba(255,255,255,0.78)",
  },
  replyItemBody: {
    fontSize: 13,
    whiteSpace: "pre-wrap",
    lineHeight: 1.35,
    color: "rgba(255,255,255,0.90)",
  },
  mutedSmall: {
    fontSize: 12,
    opacity: 0.7,
    fontWeight: 800,
    color: "rgba(255,255,255,0.70)",
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
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 700,
  },
  brand: {
    fontSize: 13,
    opacity: 0.8,
    fontWeight: 700,
    color: "rgba(255,255,255,0.85)",
  },
  muted: {
    fontSize: 13,
    opacity: 0.55,
    color: "rgba(255,255,255,0.75)",
  },
};
