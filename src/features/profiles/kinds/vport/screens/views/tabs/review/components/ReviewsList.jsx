// src/features/profiles/kinds/vport/screens/views/tabs/review/components/ReviewsList.jsx
import React from "react";

function formatDateSafe(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

export default function ReviewsList({ loading, list }) {
  return (
    <div style={{ marginTop: 14 }}>
      {loading ? (
        <div className="text-sm text-neutral-300">Loading reviews…</div>
      ) : list?.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map((r) => {
            const dateText = formatDateSafe(r.createdAt ?? r.created_at ?? null);

            return (
              <div
                key={r.id}
                style={{
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 900 }}>
                    {r.rating}★
                  </div>

                  <div
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontSize: 12,
                      fontWeight: 750,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {dateText || ""}
                  </div>
                </div>

                {r.body ? (
                  <div
                    style={{
                      marginTop: 8,
                      color: "rgba(255,255,255,0.70)",
                      fontSize: 13,
                      lineHeight: "18px",
                      wordBreak: "break-word",
                    }}
                  >
                    {r.body}
                  </div>
                ) : (
                  <div style={{ marginTop: 8, color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
                    (no comment)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-neutral-300">No reviews yet.</div>
      )}
    </div>
  );
}
