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
  disabledBecauseSelf, // ✅ NEW
}) {
  return (
    <div
      style={{
        marginTop: 14,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        padding: 14,
      }}
    >
      {disabledBecauseSelf ? (
        <div className="text-sm text-neutral-300">
          You can’t review your own vport.
        </div>
      ) : !viewerActorId ? (
        <div className="text-sm text-neutral-300">
          Sign in to leave a {tabLabel.toLowerCase()} review.
        </div>
      ) : isServiceTab && !serviceId ? (
        <div className="text-sm text-neutral-300">Select a service to review.</div>
      ) : (
        <>
          <div className="text-sm text-neutral-200" style={{ fontWeight: 800 }}>
            {myLoading ? "Loading your review…" : myExists ? "Your review (this week)" : "Leave a review (this week)"}
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" style={starBtn(n <= rating)} onClick={() => setRating(n)}>
                ★
              </button>
            ))}

            <div style={{ marginLeft: 6, color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 800 }}>
              {rating} / 5
            </div>
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Say something about the ${tabLabel.toLowerCase()}…`}
            className="
              w-full px-4 py-2 pr-10
              rounded-2xl bg-neutral-900 text-white
              border border-purple-700
              focus:ring-2 focus:ring-purple-500
            "
            style={{
              marginTop: 10,
              minHeight: 88,
              outline: "none",
              resize: "vertical",
              fontWeight: 650,
            }}
          />

          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
              1 review per week. Edit anytime this week.
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              style={{
                borderRadius: 14,
                padding: "10px 12px",
                border: "1px solid rgba(255,255,255,0.14)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                color: "#fff",
                fontWeight: 900,
                fontSize: 12,
                letterSpacing: 0.5,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {saving ? "Saving…" : "Save review"}
            </button>
          </div>

          {msg ? <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.70)" }}>{msg}</div> : null}
        </>
      )}
    </div>
  );
}
