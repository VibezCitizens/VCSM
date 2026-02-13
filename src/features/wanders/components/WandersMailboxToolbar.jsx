// src/features/wanders/components/WandersMailboxToolbar.jsx
// ============================================================================
// WANDERS COMPONENT — MAILBOX TOOLBAR
// UI-only: folder picker + search box + optional actions slot.
// No DAL, no controllers.
// ============================================================================

import React, { useMemo } from "react";
import WandersShareVCSM from "@/features/wanders/components/WandersShareVCSM";

/**
 * @param {{
 *  currentFolder: 'inbox'|'outbox',
 *  searchQuery?: string,
 *  onFolderChange: (folder: 'inbox'|'outbox') => void,
 *  onSearchChange: (query: string) => void,
 *  extraActions?: React.ReactNode,
 *  disabled?: boolean,
 *  className?: string,
 *
 *  // ✅ optional “push to account” block
 *  showAccountButtons?: boolean,
 *  fromPath?: string,
 *  accountTitle?: string,
 *  accountSubtitle?: string,
 * }} props
 */
export function WandersMailboxToolbar({
  currentFolder,
  searchQuery = "",
  onFolderChange,
  onSearchChange,
  extraActions,
  disabled = false,
  className = "",

  showAccountButtons = false,
  fromPath = "/wanders/mailbox",
  accountTitle = "Save your WVOX forever",
  accountSubtitle =
    "You’re using guest mode right now. Create an account to keep your mailbox across devices and never lose access.",
}) {
  const folders = useMemo(
    () => [
      { key: "inbox", label: "Inbox" },
      { key: "outbox", label: "Outbox" },
    ],
    []
  );

  const styles = useMemo(
    () => ({
      wrap: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxSizing: "border-box",
      },

      // ✅ CTA spacing wrapper
      ctaWrap: {
        width: "100%",
        boxSizing: "border-box",
      },

      // top row
      topRow: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
      },
      actions: {
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: 8,
      },

      // folder pills
      pill: {
        position: "relative",
        overflow: "hidden",
        borderRadius: 999,
        padding: "8px 12px",
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: "0.2px",
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.30)",
        color: "rgba(255,255,255,0.90)",
        cursor: "pointer",
        userSelect: "none",
        transition:
          "transform 120ms ease, background 150ms ease, border-color 150ms ease, box-shadow 150ms ease, opacity 150ms ease",
        boxShadow: "0 10px 22px rgba(0,0,0,0.22)",
      },
      pillActive: {
        border: "1px solid rgba(124,58,237,0.40)",
        background: "rgba(124,58,237,0.16)",
        boxShadow: "0 12px 26px rgba(0,0,0,0.28), 0 0 22px rgba(124,58,237,0.18)",
      },
      pillHover: {
        background: "rgba(0,0,0,0.40)",
        borderColor: "rgba(255,255,255,0.22)",
        boxShadow: "0 14px 28px rgba(0,0,0,0.30), 0 0 24px rgba(124,58,237,0.14)",
      },
      disabled: {
        opacity: 0.6,
        cursor: "not-allowed",
        pointerEvents: "none",
      },

      // sheen + inner ring (matches your Sent buttons vibe)
      sheen: {
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 55%)",
      },
      innerRing: {
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        borderRadius: 999,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)",
      },

      // search row
      searchRow: {
        display: "flex",
        alignItems: "center",
        gap: 10,
      },
      searchWrap: {
        position: "relative",
        flex: 1,
      },
      input: {
        width: "100%",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.30)",
        color: "rgba(255,255,255,0.92)",
        padding: "11px 12px",
        fontSize: 14,
        lineHeight: "18px",
        outline: "none",
        boxSizing: "border-box",
        boxShadow:
          "0 10px 22px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)",
        transition: "border-color 150ms ease, box-shadow 150ms ease, background 150ms ease",
      },
      inputFocus: {
        borderColor: "rgba(124,58,237,0.40)",
        boxShadow:
          "0 12px 28px rgba(0,0,0,0.28), 0 0 0 2px rgba(124,58,237,0.22), inset 0 1px 0 rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.36)",
      },

      // clear button (same family as pills)
      clearBtn: {
        position: "relative",
        overflow: "hidden",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.30)",
        color: "rgba(255,255,255,0.90)",
        padding: "11px 12px",
        fontSize: 13,
        fontWeight: 800,
        cursor: "pointer",
        transition:
          "transform 120ms ease, background 150ms ease, border-color 150ms ease, box-shadow 150ms ease, opacity 150ms ease",
        boxShadow: "0 10px 22px rgba(0,0,0,0.22)",
        whiteSpace: "nowrap",
      },
    }),
    []
  );

  const [focused, setFocused] = React.useState(false);

  return (
    <div className={className} style={styles.wrap}>
      {/* ✅ Push-to-account block (guest only) */}
      {showAccountButtons ? (
        <div style={styles.ctaWrap}>
          <WandersShareVCSM
            fromPath={fromPath}
            title={accountTitle}
            subtitle={accountSubtitle}
          />
        </div>
      ) : null}

      {/* Folder pills */}
      <div style={styles.topRow}>
        {folders.map((f) => {
          const active = currentFolder === f.key;

          return (
            <button
              key={f.key}
              type="button"
              disabled={disabled}
              onClick={() => onFolderChange(f.key)}
              style={{
                ...styles.pill,
                ...(active ? styles.pillActive : null),
                ...(disabled ? styles.disabled : null),
              }}
              onMouseEnter={(e) => {
                if (disabled) return;
                if (!active) Object.assign(e.currentTarget.style, styles.pillHover);
              }}
              onMouseLeave={(e) => {
                if (disabled) return;
                e.currentTarget.style.background = active ? styles.pillActive.background : styles.pill.background;
                e.currentTarget.style.border = active ? styles.pillActive.border : styles.pill.border;
                e.currentTarget.style.boxShadow = active ? styles.pillActive.boxShadow : styles.pill.boxShadow;
              }}
              onMouseDown={(e) => {
                if (disabled) return;
                e.currentTarget.style.transform = "scale(0.99)";
              }}
              onMouseUp={(e) => {
                if (disabled) return;
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <span aria-hidden style={styles.sheen} />
              <span aria-hidden style={styles.innerRing} />
              <span style={{ position: "relative" }}>{f.label}</span>
            </button>
          );
        })}

        {extraActions ? <div style={styles.actions}>{extraActions}</div> : null}
      </div>

      {/* Search */}
      <div style={styles.searchRow}>
        <div style={styles.searchWrap}>
          <input
            type="text"
            value={searchQuery}
            disabled={disabled}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages…"
            style={{
              ...styles.input,
              ...(focused ? styles.inputFocus : null),
              ...(disabled ? styles.disabled : null),
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>

        {searchQuery ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSearchChange("")}
            style={{
              ...styles.clearBtn,
              ...(disabled ? styles.disabled : null),
            }}
            onMouseDown={(e) => {
              if (disabled) return;
              e.currentTarget.style.transform = "scale(0.99)";
            }}
            onMouseUp={(e) => {
              if (disabled) return;
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <span aria-hidden style={styles.sheen} />
            <span aria-hidden style={{ ...styles.innerRing, borderRadius: 14 }} />
            <span style={{ position: "relative" }}>Clear</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default WandersMailboxToolbar;
