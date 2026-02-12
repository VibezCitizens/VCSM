// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersMailboxItemRow.jsx
// ============================================================================
// WANDERS COMPONENT — MAILBOX ITEM ROW
// UI-only row renderer for mailbox item.
// No DAL, no controllers, no domain rules.
// ============================================================================

import React, { useMemo } from "react";

/**
 * NOTE:
 * - No tailwind utility classes here.
 * - Inline styles + minimal className passthrough.
 */

/**
 * @param {{
 *   item: any,
 *   onClick?: (item: any) => void,
 *   isSelected?: boolean,
 *   className?: string,
 * }} props
 */
export function WandersMailboxItemRow({
  item,
  onClick,
  isSelected = false,
  className = "",
}) {
  const view = useMemo(() => {
    const card = item?.card ?? {};

    const templateKey = card?.templateKey ?? card?.template_key ?? "classic";
    const messageText = card?.messageText ?? card?.message_text ?? "";
    const customization = card?.customization ?? card?.customization_json ?? card?.customizationJson ?? {};

    const toName = customization?.toName ?? customization?.to_name ?? null;
    const fromName = customization?.fromName ?? customization?.from_name ?? null;

    const isAnonymous = card?.isAnonymous ?? card?.is_anonymous ?? false;

    const displayFrom = isAnonymous ? "Secret admirer 💌" : fromName || "Someone 💌";

    const previewMessage = String(messageText || "").trim();

    const isRead =
      typeof item?.isRead === "boolean"
        ? item.isRead
        : typeof item?.is_read === "boolean"
        ? item.is_read
        : false;

    return {
      templateKey,
      toName,
      displayFrom,
      previewMessage,
      isRead,
      pinned: !!(item?.pinned ?? false),
      folder: item?.folder ?? "inbox",
      createdAt: item?.createdAt ?? item?.created_at ?? null,
    };
  }, [item]);

  const handleClick = () => {
    if (typeof onClick === "function") onClick(item);
  };

  const dateLabel = useMemo(() => {
    if (!view.createdAt) return "";
    try {
      const d = new Date(view.createdAt);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  }, [view.createdAt]);

  const styles = useMemo(() => {
    const baseBg = "rgba(0,0,0,0)";

    const rowBg = isSelected ? "rgba(255,255,255,0.06)" : baseBg;
    const rowBorder = isSelected ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)";

    return {
      btn: {
        width: "100%",
        textAlign: "left",
        border: `1px solid ${rowBorder}`,
        background: rowBg,
        color: "rgba(255,255,255,0.92)",
        borderRadius: 14,
        padding: "12px 12px",
        cursor: "pointer",
        transition: "transform 120ms ease, background 120ms ease, border-color 120ms ease",
        boxSizing: "border-box",
      },
      btnHover: {
        background: isSelected ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.14)",
      },
      row: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      },
      left: {
        minWidth: 0,
        flex: 1,
      },
      topLine: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 0,
      },
      unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: "rgba(236,72,153,0.95)", // pink-ish dot
        flexShrink: 0,
        boxShadow: "0 0 0 3px rgba(236,72,153,0.10)",
      },
      from: {
        fontSize: 13,
        fontWeight: 800,
        color: "rgba(255,255,255,0.92)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        minWidth: 0,
      },
      pin: {
        fontSize: 12,
        opacity: 0.65,
        flexShrink: 0,
      },
      preview: {
        marginTop: 6,
        fontSize: 13,
        color: "rgba(255,255,255,0.65)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
      right: {
        flexShrink: 0,
        fontSize: 12,
        color: "rgba(255,255,255,0.45)",
      },
    };
  }, [isSelected]);

  const [isHover, setIsHover] = React.useState(false);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      style={{
        ...styles.btn,
        ...(isHover ? styles.btnHover : null),
      }}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <div style={styles.row}>
        {/* LEFT */}
        <div style={styles.left}>
          {/* Top line */}
          <div style={styles.topLine}>
            {!view.isRead ? <span aria-hidden style={styles.unreadDot} /> : null}

            <div style={styles.from} title={view.displayFrom}>
              {view.displayFrom}
            </div>

            {view.pinned ? (
              <span aria-hidden style={styles.pin}>
                📌
              </span>
            ) : null}
          </div>

          {/* Message preview */}
          <div style={styles.preview} title={view.previewMessage || "No message"}>
            {view.previewMessage || "No message"}
          </div>
        </div>

        {/* RIGHT */}
        <div style={styles.right}>{dateLabel}</div>
      </div>
    </button>
  );
}

export default WandersMailboxItemRow;
