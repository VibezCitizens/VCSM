// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersRepliesList.jsx
// ============================================================================
// WANDERS COMPONENT — REPLIES LIST
// UI-only. Displays ordered replies for a card.
// No DAL, no controller logic.
// ============================================================================

import React, { useMemo } from "react";

/**
 * @param {{
 *  replies?: Array<{
 *    id: string,
 *    body?: string | null,
 *    body_ciphertext?: string | null,
 *    created_at?: string,
 *    author_actor_id?: string | null,
 *    author_anon_id?: string | null,
 *    is_deleted?: boolean,
 *  }>,
 *  currentActorId?: string | null,
 *  currentAnonId?: string | null,
 *  labelMode?: 'classic' | 'neutral' | 'fully-neutral',
 *  emptyComponent?: React.ReactNode,
 *  className?: string,
 * }} props
 */
export function WandersRepliesList({
  replies = [],
  currentActorId = null,
  currentAnonId = null,
  labelMode = "classic",
  emptyComponent = null,
  className = "",
}) {
  const styles = useMemo(
    () => ({
      wrap: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxSizing: "border-box",
      },

      empty: {
        padding: "18px 0",
        textAlign: "center",
        fontSize: 13,
        color: "rgba(255,255,255,0.55)",
      },

      bubbleBase: {
        maxWidth: "85%",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        padding: "10px 12px",
        fontSize: 13,
        lineHeight: 1.4,
        boxShadow: "0 10px 22px rgba(0,0,0,0.22)",
        boxSizing: "border-box",
        background: "rgba(0,0,0,0.26)",
        color: "rgba(255,255,255,0.92)",
        overflow: "hidden",
      },

      bubbleOwn: {
        marginLeft: "auto",
        borderColor: "rgba(124,58,237,0.28)",
        background:
          "linear-gradient(180deg, rgba(124,58,237,0.14), rgba(0,0,0,0.26))",
        boxShadow:
          "0 12px 26px rgba(0,0,0,0.28), 0 0 22px rgba(124,58,237,0.12)",
      },

      bubbleOther: {
        marginRight: "auto",
        borderColor: "rgba(255,255,255,0.12)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.26))",
      },

      body: {
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      },

      deleted: {
        fontStyle: "italic",
        color: "rgba(255,255,255,0.45)",
      },

      meta: {
        marginTop: 8,
        fontSize: 11,
        color: "rgba(255,255,255,0.55)",
        fontWeight: 700,
        opacity: 0.95,
      },
    }),
    []
  );

  if (!replies?.length) {
    return (
      emptyComponent || (
        <div className={className} style={styles.empty}>
          No replies yet.
        </div>
      )
    );
  }

  const getLabel = (isOwn) => {
    if (labelMode === "fully-neutral") return "Message";
    if (labelMode === "neutral") return isOwn ? "You" : "Reply";
    return isOwn ? "You" : "Them";
  };

  return (
    <div className={className} style={styles.wrap}>
      {replies.map((reply) => {
        const isOwn =
          (reply.author_actor_id &&
            currentActorId &&
            reply.author_actor_id === currentActorId) ||
          (reply.author_anon_id &&
            currentAnonId &&
            reply.author_anon_id === currentAnonId);

        const deleted = reply.is_deleted === true;

        const createdAt = reply.created_at
          ? new Date(reply.created_at).toLocaleString()
          : null;

        return (
          <div
            key={reply.id}
            style={{
              ...styles.bubbleBase,
              ...(isOwn ? styles.bubbleOwn : styles.bubbleOther),
            }}
          >
            {/* BODY */}
            <div style={styles.body}>
              {deleted ? (
                <span style={styles.deleted}>Message deleted</span>
              ) : (
                reply.body || "Encrypted message"
              )}
            </div>

            {/* META */}
            <div style={styles.meta}>
              {getLabel(isOwn)}
              {createdAt ? ` • ${createdAt}` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default WandersRepliesList;
