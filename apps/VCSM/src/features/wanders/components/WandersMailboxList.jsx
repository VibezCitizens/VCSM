// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersMailboxList.jsx
// ============================================================================
// WANDERS COMPONENT — MAILBOX LIST
// UI-only: renders a list of mailbox items.
// No DAL, no controllers.
// ============================================================================

import React, { useMemo } from "react";
import WandersMailboxItemRow from "@/features/wanders/components/WandersMailboxItemRow";

/**
 * @param {{
 *  items: Array<any>,
 *  loading?: boolean,
 *  empty?: React.ReactNode,
 *  onItemClick?: (item: any) => void,
 *  selectedItemId?: string|null,
 *  className?: string,
 * }} props
 */
export function WandersMailboxList({
  items,
  loading = false,
  empty = null,
  onItemClick,
  selectedItemId = null,
  className = "",
}) {
  const styles = useMemo(
    () => ({
      shell: {
        width: "100%",
        boxSizing: "border-box",
      },
      listCard: {
        width: "100%",
        boxSizing: "border-box",
        padding: 12,
      },
      dividerWrap: {
        display: "flex",
        flexDirection: "column",
        gap: 10,
      },
      // Loading skeleton card (matches dark/glass vibe)
      loadingCard: {
        width: "100%",
        boxSizing: "border-box",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.30)",
        padding: 12,
      },
      skeletonLine: {
        height: 10,
        borderRadius: 10,
        background: "rgba(255,255,255,0.12)",
        overflow: "hidden",
        position: "relative",
      },
      skeletonBlock: {
        height: 56,
        borderRadius: 14,
        background: "rgba(255,255,255,0.10)",
        overflow: "hidden",
        position: "relative",
      },
      shimmer: {
        position: "absolute",
        inset: 0,
        transform: "translateX(-60%)",
        background:
          "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0) 100%)",
        animation: "wandersShimmer 1.2s ease-in-out infinite",
      },
    }),
    []
  );

  // Inject keyframes once (no tailwind)
  const Keyframes = (
    <style>
      {`
        @keyframes wandersShimmer {
          0% { transform: translateX(-60%); }
          100% { transform: translateX(60%); }
        }
      `}
    </style>
  );

  if (loading) {
    return (
      <div className={className} style={styles.shell}>
        {Keyframes}
        <div style={styles.loadingCard}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ ...styles.skeletonLine, width: "55%" }}>
              <div style={styles.shimmer} />
            </div>

            <div style={styles.skeletonBlock}>
              <div style={styles.shimmer} />
            </div>
            <div style={styles.skeletonBlock}>
              <div style={styles.shimmer} />
            </div>
            <div style={styles.skeletonBlock}>
              <div style={styles.shimmer} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return <div className={className}>{empty}</div>;
  }

  return (
    <div className={className} style={styles.shell}>
      <div style={styles.listCard}>
        <div style={styles.dividerWrap}>
          {items.map((item) => (
            <WandersMailboxItemRow
              key={String(item?.id)}
              item={item}
              onClick={onItemClick}
              isSelected={selectedItemId ? String(selectedItemId) === String(item?.id) : false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default WandersMailboxList;
