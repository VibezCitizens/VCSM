// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersReplyComposer.jsx
// ============================================================================
// WANDERS COMPONENT — REPLY COMPOSER
// UI-only: controlled textarea + submit.
// No DAL, no controllers.
// ============================================================================

import React, { useMemo, useState } from "react";

/**
 * @param {{
 *  onSubmit: (input: { body: string }) => (void | Promise<void>),
 *  onSent?: () => (void | Promise<void>),
 *  loading?: boolean,
 *  disabled?: boolean,
 *  placeholder?: string,
 *  buttonLabel?: string,
 *  className?: string,
 * }} props
 */
export function WandersReplyComposer({
  onSubmit,
  onSent,
  loading = false,
  disabled = false,
  placeholder = "Write a reply…",
  buttonLabel = "Send",
  className = "",
}) {
  const [body, setBody] = useState("");

  const canSubmit = useMemo(() => {
    return !!body.trim() && !loading && !disabled;
  }, [body, loading, disabled]);

  const styles = useMemo(
    () => ({
      form: {
        width: "100%",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.30)",
        padding: 12,
        boxSizing: "border-box",
      },

      row: {
        marginTop: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      },

      counter: {
        fontSize: 12,
        color: "rgba(255,255,255,0.55)",
        fontWeight: 700,
      },

      btn: {
        position: "relative",
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(24,24,27,0.90)", // zinc-900/90
        color: "rgba(255,255,255,0.95)",
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 800,
        cursor: "pointer",
        boxShadow: "0 10px 26px rgba(0,0,0,0.75)",
        transition: "transform 120ms ease",
      },

      btnDisabled: {
        opacity: 0.5,
        cursor: "not-allowed",
      },

      sheen: {
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.10), transparent 55%)",
      },

      innerRing: {
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        borderRadius: 12,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)",
      },

      btnText: {
        position: "relative",
      },
    }),
    []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    if (typeof onSubmit !== "function") return;

    try {
      await Promise.resolve(onSubmit({ body: trimmed }));
      setBody("");
      await Promise.resolve(onSent?.());
    } catch {
      // screen/controller should surface errors if desired
    }
  };

  const inputBarClassName = `
    w-full px-4 py-2 pr-10
    rounded-2xl bg-neutral-900 text-white
    border border-purple-700
    focus:ring-2 focus:ring-purple-500
    outline-none
    disabled:opacity-60 disabled:cursor-not-allowed
    placeholder:text-white/40
    resize-none
    text-[14px] leading-[22px]
  `.trim();

  return (
    <form onSubmit={handleSubmit} className={className} style={styles.form}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={3}
        disabled={disabled || loading}
        className={inputBarClassName}
      />

      <div style={styles.row}>
        <div style={styles.counter}>
          {body.trim().length ? `${body.trim().length} chars` : ""}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            ...styles.btn,
            ...(!canSubmit ? styles.btnDisabled : null),
          }}
        >
          <span aria-hidden style={styles.sheen} />
          <span aria-hidden style={styles.innerRing} />
          <span style={styles.btnText}>{loading ? "Sending…" : buttonLabel}</span>
        </button>
      </div>
    </form>
  );
}

export default WandersReplyComposer;
