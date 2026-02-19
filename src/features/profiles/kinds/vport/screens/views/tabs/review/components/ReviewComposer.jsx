// src/features/profiles/kinds/vport/screens/views/tabs/review/components/ReviewComposer.jsx
import React from "react";
import { starBtn } from "../styles/reviewStyles";

export default function ReviewComposer({
  viewerActorId,
  tabLabel,
  isServiceTab,
  serviceId,
  myLoading,
  myExists,
  rating,
  setRating,
  body,
  setBody,
  saving,
  handleSave,
  msg,
  disabledBecauseSelf,
  tab,
}) {
  // ✅ Overall is READ-ONLY (dashboard handles it). No composer.
  if (tab === "overall") return null;

  return (
    <div
      style={{
        marginTop: 14,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        padding: 14,
      }}
    >
      {disabledBecauseSelf ? (
        <div className="text-sm text-neutral-300">You can’t review your own vport.</div>
      ) : !viewerActorId ? (
        <div className="text-sm text-neutral-300">
          Sign in to leave a {tabLabel.toLowerCase()} review.
        </div>
      ) : isServiceTab && !serviceId ? (
        <div className="text-sm text-neutral-300">Select a service to review.</div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div
              className="text-sm text-neutral-200"
              style={{ fontWeight: 900, letterSpacing: 0.2 }}
            >
              {myLoading
                ? "Loading your review…"
                : myExists
                  ? "Your review (this week)"
                  : "Leave a Vibez review"}
            </div>

            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 850 }}>
              {rating} / 5
            </div>
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                style={starBtn(n <= rating)}
                onClick={() => setRating(n)}
                aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
              >
                ★
              </button>
            ))}
          </div>

          {/* ✅ Clean modern input box (no corner handle, no decorative corner) */}
          <div style={{ marginTop: 14 }}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Write a quick note about ${tabLabel.toLowerCase()}…`}
              style={{
                width: "100%",
                minHeight: 130,
                outline: "none",

                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.35)",

                padding: "16px",
                color: "rgba(255,255,255,0.95)",
                fontWeight: 520,
                fontSize: 14,
                lineHeight: "22px",
                letterSpacing: 0.2,

                resize: "none",
                transition: "border-color 120ms ease, box-shadow 120ms ease",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.22)";
                e.target.style.boxShadow =
                  "0 0 0 3px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.10)";
                e.target.style.boxShadow =
                  "inset 0 1px 0 rgba(255,255,255,0.04)";
              }}
            />
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave?.()}
              style={{
                borderRadius: 14,
                padding: "10px 12px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: saving
                  ? "rgba(255,255,255,0.06)"
                  : "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
                color: "#fff",
                fontWeight: 950,
                fontSize: 12,
                letterSpacing: 0.5,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.75 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {saving ? "Submitting…" : "Submit review"}
            </button>
          </div>

          {msg ? (
            <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.70)" }}>
              {msg}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
