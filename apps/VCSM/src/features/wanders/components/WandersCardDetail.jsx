// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersCardDetail.jsx
// ============================================================================
// WANDERS COMPONENT — CARD DETAIL
// UI-only card detail renderer + replies slot.
// No DAL, no controllers, no business rules.
// ============================================================================

import React, { useMemo } from "react";
import WandersCardPreview from "@/features/wanders/components/WandersCardPreview";

/**
 * @param {{
 *   card: any,
 *   replies?: React.ReactNode,
 *   actions?: React.ReactNode,
 *   className?: string,
 * }} props
 */
export function WandersCardDetail({ card, replies = null, actions = null, className = "" }) {
  const meta = useMemo(() => {
    if (!card) return null;

    const sentAt = card?.sentAt ?? card?.sent_at ?? null;
    const createdAt = card?.createdAt ?? card?.created_at ?? null;

    // ✅ Prefer last_opened_at when present (your DB uses it)
    const openedAt =
      card?.lastOpenedAt ??
      card?.last_opened_at ??
      card?.openedAt ??
      card?.opened_at ??
      null;

    // ✅ open_count sometimes arrives as string from PostgREST — normalize
    const rawOpenCount = card?.openCount ?? card?.open_count ?? 0;
    const openCount = Number.isFinite(Number(rawOpenCount)) ? Number(rawOpenCount) : 0;

    const status = card?.status ?? "draft";

    const formatDate = (v) => {
      if (!v) return null;
      try {
        return new Date(v).toLocaleString();
      } catch {
        return null;
      }
    };

    return {
      status,
      createdAtLabel: formatDate(createdAt),
      sentAtLabel: formatDate(sentAt),
      openedAtLabel: formatDate(openedAt),
      openCount,
    };
  }, [card]);

  const normalizedCard = useMemo(() => {
    if (!card) return card;

    // Parse customization if it arrived as JSON string
    let customization = card?.customization ?? null;
    if (typeof customization === "string") {
      try {
        customization = JSON.parse(customization);
      } catch {
        customization = null;
      }
    }

    return {
      ...card,

      // Keep both shapes to make all components happy
      templateKey: card?.templateKey ?? card?.template_key,
      template_key: card?.template_key ?? card?.templateKey,

      messageText: card?.messageText ?? card?.message_text,
      message_text: card?.message_text ?? card?.messageText,

      // If you ever store these later, keep both
      toName: card?.toName ?? customization?.toName ?? customization?.to_name,
      fromName: card?.fromName ?? customization?.fromName ?? customization?.from_name,

      customization: customization ?? {},
    };
  }, [card]);

  // ✅ Sent theme styles (NO tailwind dependency)
  const styles = {
    empty: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(0,0,0,0.40)",
      color: "rgba(255,255,255,0.65)",
      padding: 32,
      fontSize: 13,
      fontWeight: 700,
      boxShadow: "0 10px 26px rgba(0,0,0,0.55)",
      boxSizing: "border-box",
    },

    box: {
      position: "relative",
      width: "100%",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(0,0,0,0.55)",
      color: "#fff",
      padding: 16,
      boxSizing: "border-box",
      overflow: "hidden",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      boxShadow: "0 16px 40px rgba(0,0,0,0.55), 0 0 36px rgba(124,58,237,0.10)",
    },

    glowTL: {
      pointerEvents: "none",
      position: "absolute",
      top: -64,
      left: -64,
      width: 224,
      height: 224,
      borderRadius: 9999,
      background: "rgba(139,92,246,0.10)",
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

    inner: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: 14,
    },

    metaGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      columnGap: 12,
      rowGap: 10,
      fontSize: 12,
      color: "rgba(255,255,255,0.65)",
    },

    metaLabel: {
      fontSize: 11,
      fontWeight: 800,
      opacity: 0.65,
      letterSpacing: "0.01em",
      marginBottom: 4,
    },

    metaValueStrong: {
      fontSize: 12,
      fontWeight: 800,
      color: "rgba(255,255,255,0.92)",
    },

    metaValue: {
      fontSize: 12,
      fontWeight: 700,
      color: "rgba(255,255,255,0.86)",
    },

    actions: { paddingTop: 6 },

    replies: {
      paddingTop: 12,
      borderTop: "1px solid rgba(255,255,255,0.10)",
    },
  };

  // small responsive bump (2 -> 4 columns) without tailwind
  const isWide = typeof window !== "undefined" ? window.innerWidth >= 640 : false;
  const metaGridStyle = isWide
    ? { ...styles.metaGrid, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }
    : styles.metaGrid;

  if (!card) {
    return (
      <div className={className} style={styles.empty}>
        No card selected.
      </div>
    );
  }

  return (
    <div className={className} style={styles.box}>
      <div aria-hidden style={styles.glowTL} />
      <div aria-hidden style={styles.glowBR} />

      <div style={styles.inner}>
        {/* CARD PREVIEW */}
        <WandersCardPreview card={normalizedCard} />

        {/* META */}
        {meta && (
          <div style={metaGridStyle}>
            <div>
              <div style={styles.metaLabel}>Status</div>
              <div style={styles.metaValueStrong}>{meta.status}</div>
            </div>

            {meta.createdAtLabel ? (
              <div>
                <div style={styles.metaLabel}>Created</div>
                <div style={styles.metaValue}>{meta.createdAtLabel}</div>
              </div>
            ) : null}

            {meta.sentAtLabel ? (
              <div>
                <div style={styles.metaLabel}>Sent</div>
                <div style={styles.metaValue}>{meta.sentAtLabel}</div>
              </div>
            ) : null}

            {meta.openedAtLabel ? (
              <div>
                <div style={styles.metaLabel}>Last opened</div>
                <div style={styles.metaValue}>{meta.openedAtLabel}</div>
              </div>
            ) : null}

            <div>
              <div style={styles.metaLabel}>Opens</div>
              <div style={styles.metaValue}>{meta.openCount}</div>
            </div>
          </div>
        )}

        {/* ACTION SLOT */}
        {actions ? <div style={styles.actions}>{actions}</div> : null}

        {/* REPLIES SLOT */}
        {replies ? <div style={styles.replies}>{replies}</div> : null}
      </div>
    </div>
  );
}

export default WandersCardDetail;
