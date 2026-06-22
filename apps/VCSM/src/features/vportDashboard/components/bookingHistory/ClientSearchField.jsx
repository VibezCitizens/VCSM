import { useState } from "react";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import useCustomerSearch from "@/features/vportDashboard/dashboard/cards/bookings/hooks/useCustomerSearch";

// Searchable client selector for the New Booking modal. Reuses the shared actor-search
// pipeline (searchActorsAdapter) via useCustomerSearch — the same search used by /explore.
// Direct reuse of explore/ui/ActorSearchResultRow was not possible (it hardcodes
// navigation to /profile and depends on explore CSS), so the Explore result layout
// (square avatar + display name + @username + actor type) is mirrored with modal styling.
//
// Walk-in entry stays available until a citizen is selected; selecting one disables it.

const labelStyle = { fontSize: 11, fontWeight: 700, color: "rgba(148,163,184,.45)", letterSpacing: ".06em", marginBottom: 6, display: "block" };
const inputStyle = {
  width: "100%", height: 44, borderRadius: 10, boxSizing: "border-box",
  border: "1px solid rgba(148,163,184,.18)", background: "rgba(2,6,23,.8)",
  color: "#f8fafc", fontSize: 14, padding: "0 14px", outline: "none",
};
const avatarStyle = {
  width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0,
  border: "1px solid rgba(255,255,255,.12)", background: "rgba(2,6,23,.8)",
};

function actorTypeLabel(kind) {
  return kind === "vport" ? "Vport" : "Citizen";
}

function ActorIdentity({ client }) {
  return (
    <>
      <img
        src={client.avatarUrl || "/avatar.jpg"}
        alt={client.displayName || client.username || "avatar"}
        style={avatarStyle}
        onError={(e) => { e.currentTarget.src = "/avatar.jpg"; }}
      />
      <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.92)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {client.displayName || client.username || "Unknown"}
        </div>
        {client.username && (
          <div style={{ fontSize: 12, color: "rgba(148,163,184,.7)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            @{client.username}
          </div>
        )}
        <div style={{ fontSize: 11, color: "rgba(167,139,250,.8)", fontWeight: 600, marginTop: 1 }}>
          {actorTypeLabel(client.kind)}
        </div>
      </div>
    </>
  );
}

export default function ClientSearchField({
  selectedClient,
  walkInName,
  onSelectClient,
  onClearClient,
  onWalkInChange,
}) {
  const { identity } = useIdentity();
  const viewerActorId = identity?.actorId ?? null;

  const [query, setQuery] = useState("");
  const { results, loading } = useCustomerSearch({
    query,
    viewerActorId,
    enabled: !selectedClient,
  });

  // Selected citizen — show identity card + Remove.
  if (selectedClient) {
    return (
      <div>
        <label style={labelStyle}>CLIENT</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 12, border: "1px solid rgba(139,92,246,.3)", background: "rgba(139,92,246,.1)", padding: "10px 12px" }}>
          <ActorIdentity client={selectedClient} />
          <button
            type="button"
            onClick={() => { onClearClient(); setQuery(""); }}
            style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.7)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  // No selection — search + walk-in fallback.
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <label style={labelStyle}>CLIENT</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search citizens by name, username, handle"
          style={inputStyle}
        />

        {loading && (
          <div style={{ fontSize: 12, color: "rgba(148,163,184,.5)", marginTop: 8 }}>Searching…</div>
        )}

        {!loading && results.length > 0 && (
          <div style={{ marginTop: 8, display: "grid", gap: 6, maxHeight: 240, overflowY: "auto" }}>
            {results.map((r) => (
              <button
                key={r.actorId}
                type="button"
                onClick={() => { onSelectClient(r); setQuery(""); }}
                style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 10, border: "1px solid rgba(148,163,184,.12)", background: "rgba(15,23,42,.7)", padding: "8px 10px", cursor: "pointer", textAlign: "left" }}
              >
                <ActorIdentity client={r} />
              </button>
            ))}
          </div>
        )}

        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <div style={{ fontSize: 12, color: "rgba(148,163,184,.45)", marginTop: 8 }}>No citizens found.</div>
        )}
      </div>

      <div>
        <label style={labelStyle}>WALK-IN NAME</label>
        <input
          type="text"
          value={walkInName}
          onChange={(e) => onWalkInChange(e.target.value)}
          placeholder="John Doe"
          style={inputStyle}
        />
      </div>
    </div>
  );
}
