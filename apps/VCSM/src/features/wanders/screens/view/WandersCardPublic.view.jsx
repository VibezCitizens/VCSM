// src/features/wanders/screens/view/WandersCardPublic.view.jsx
// Contract: Domain experience composition (hooks + UI).
// - no DAL, no Supabase, no controllers directly

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
import { readCardCta } from "@/features/wanders/screens/view/wandersCardCta.model";
import { wandersCardPublicStyles as S } from "@/features/wanders/screens/view/WandersCardPublic.styles";

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
          } catch (_ERR) { void _ERR; }
          return "";
        })(),
      },
    });
  };

  const visibleReplies = useMemo(() => {
    const list = Array.isArray(replies) ? replies : [];
    return list.filter((r) => !r?.is_deleted);
  }, [replies]);

  const orderedReplies = useMemo(() => visibleReplies.slice().reverse(), [visibleReplies]);

  const canSubmit = Boolean(hasCard && cardId && !replying);
  const cardCta = useMemo(() => readCardCta(card), [card]);

  const handleReplySubmit = async ({ body }) => {
    if (!canSubmit) return;
    const trimmed = String(body || "").trim();
    if (!trimmed || !cardId) return;

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
    } catch (_ERR) { void _ERR; }
    finally { setCtaBusy(false); }

    if (cardCta.isExternal) {
      try { window.open(cardCta.url, "_blank", "noopener,noreferrer"); } catch (_ERR) { void _ERR; }
      return;
    }
    navigate(cardCta.url);
  }, [cardCta, ctaBusy, navigate, trackCtaClick]);

  if (loading) return <WandersLoading />;

  if (!publicId) {
    return <WandersEmptyState title="Missing card id" description="We couldn't find a card public id in the URL." />;
  }

  if (!card) {
    return (
      <WandersEmptyState
        title="Card not found"
        description={loadError ? String(loadError?.message || loadError) : "This card link is invalid or the card is unavailable."}
      />
    );
  }

  const visibleRepliesCount = orderedReplies.length;

  return (
    <div className={C.shell}>
      <div aria-hidden className={C.bgGlow} />

      <main className={C.main}>
        <div style={S.stack}>
          {/* CARD */}
          <div className={C.dashBox}>
            <div aria-hidden className={C.glowTL} />
            <div aria-hidden className={C.glowBR} />

            <div style={S.panelHeader}>
              <div style={S.panelTitle}>Card</div>
            </div>

            <div style={S.panelBody}>
              <WandersCardPreview card={card} draftPayload={card} />

              {cardCta ? (
                <>
                  <div style={S.divider} />
                  <div style={S.ctaWrap}>
                    <div style={S.ctaMeta}>
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
                      style={{ ...S.ctaBtn, ...(ctaBusy ? S.ctaBtnBusy : null) }}
                    >
                      <span aria-hidden style={S.btnSheenSoft} />
                      <span aria-hidden style={S.btnInnerRingSoft} />
                      <span style={S.btnText}>{ctaBusy ? "Opening…" : cardCta.label}</span>
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

            <div style={S.panelHeader}>
              <div style={S.panelTitle}>Reply</div>
              <div style={S.panelMeta}>{repliesLoading ? "Loading…" : String(visibleRepliesCount)}</div>
            </div>

            <div style={S.panelBody}>
              <WandersReplyComposer
                onSubmit={handleReplySubmit}
                onSent={refreshReplies}
                loading={replying}
                disabled={!hasCard || !cardId}
                placeholder="Write a reply…"
                buttonLabel="Reply"
              />

              {replyError || repliesError ? (
                <div style={S.error}>
                  {String(replyError?.message || replyError || repliesError?.message || repliesError || "Something went wrong.")}
                </div>
              ) : null}

              <div style={S.divider} />

              <WandersRepliesList
                replies={orderedReplies}
                labelMode="neutral"
                emptyComponent={!repliesLoading ? <div style={S.mutedSmall}>No replies yet.</div> : null}
              />
            </div>
          </div>

          {/* FOOTER */}
          <div style={S.footer}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {footerInboxLink ? (
                <button style={S.footerBtn} onClick={handleSendAnother} type="button">
                  <span aria-hidden style={S.btnSheenSoft} />
                  <span aria-hidden style={S.btnInnerRingSoft} />
                  <span style={S.btnText}>Send another</span>
                </button>
              ) : (
                <div style={S.muted}> </div>
              )}

              <WandersShowLoveCTA
                onClick={handleCreateYourOwn}
                label="✨ SHOW LOVE TO MORE PEOPLE ✨"
                style={S.showLoveBtn}
                sheenStyle={S.showLoveSheen}
                innerRingStyle={S.showLoveInnerRing}
                textStyle={S.showLoveText}
              />
            </div>

            <div style={S.brand}>Wanders</div>
          </div>
        </div>
      </main>
    </div>
  );
}
