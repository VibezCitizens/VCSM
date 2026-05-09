import React, { useEffect, useRef, useState } from "react";
import { useActorSummary } from "@hydration";

const ROLE_LABELS = { owner: "Owner", manager: "Manager", staff: "Staff" };
const VALID_ROLES = ["owner", "manager", "staff"];

function CandidateRow({ result, selectedId, onSelect }) {
  const summary     = useActorSummary(result.actor_id);
  const displayName = summary.displayName || result.display_name || result.actor_id;
  const username    = result.username ? `@${result.username}` : null;
  const isSelected  = selectedId === result.actor_id;

  return (
    <button
      type="button"
      onClick={() => onSelect(result)}
      style={{
        display: "flex", alignItems: "center", gap: 11, width: "100%",
        padding: "10px 12px", borderRadius: 10, cursor: "pointer", textAlign: "left",
        border: isSelected ? "1px solid rgba(139,92,246,.4)" : "1px solid transparent",
        background: isSelected ? "rgba(139,92,246,.1)" : "rgba(255,255,255,.03)",
        transition: "all .12s",
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0, overflow: "hidden",
        background: "rgba(255,255,255,.07)",
      }}>
        {summary.avatar && summary.avatar !== "/avatar.jpg" ? (
          <img src={summary.avatar} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.5)",
          }}>
            {String(displayName)[0].toUpperCase()}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.88)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName}
        </div>
        {username && (
          <div style={{ fontSize: 11, color: "rgba(148,163,184,.4)", marginTop: 1 }}>{username}</div>
        )}
      </div>
      {isSelected && (
        <div style={{
          width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
          background: "rgba(139,92,246,.8)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>✓</span>
        </div>
      )}
    </button>
  );
}

export function AddTeamMemberSheet({ onAdd, onClose, searchCandidates, adding, isDesktop }) {
  const [query,          setQuery]          = useState("");
  const [results,        setResults]        = useState([]);
  const [searching,      setSearching]      = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [role,           setRole]           = useState("staff");
  const [error,          setError]          = useState("");
  const inputRef    = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        setResults((await searchCandidates(query)) ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 320);
    return () => clearTimeout(debounceRef.current);
  }, [query, searchCandidates]);

  async function handleAdd() {
    if (!selectedResult) return;
    setError("");
    try {
      await onAdd({
        memberActorId: selectedResult.actor_id,
        role,
        displayName: selectedResult.display_name || selectedResult.actor_id,
      });
      onClose();
    } catch (e) {
      setError(e?.message || "Failed to add member.");
    }
  }

  const overlayStyle = {
    position: "fixed", inset: 0, zIndex: 10000,
    background: "rgba(0,0,0,.65)",
    display: "flex",
    alignItems: isDesktop ? "center" : "flex-end",
    justifyContent: isDesktop ? "center" : "stretch",
  };

  const panelStyle = isDesktop
    ? {
        width: 480, maxHeight: "80vh",
        background: "rgba(9,13,27,.98)",
        borderRadius: 20,
        border: "1px solid rgba(148,163,184,.12)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }
    : {
        width: "100%", maxWidth: 560, margin: "0 auto",
        background: "rgba(9,13,27,.97)",
        borderRadius: "20px 20px 0 0",
        border: "1px solid rgba(148,163,184,.1)", borderBottom: "none",
        maxHeight: "82dvh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={panelStyle}>
        {/* Handle — mobile only */}
        {!isDesktop && (
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,.12)" }} />
          </div>
        )}

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isDesktop ? "20px 20px 14px" : "8px 18px 14px",
          borderBottom: "1px solid rgba(148,163,184,.08)",
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,.9)" }}>Add Team Member</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: "none", background: "rgba(255,255,255,.07)",
              color: "rgba(255,255,255,.5)", fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 0" }}>
          {/* Search */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedResult(null); }}
              placeholder="Search by name or username…"
              style={{
                width: "100%", height: 44, borderRadius: 10, boxSizing: "border-box",
                border: "1px solid rgba(148,163,184,.18)",
                background: "rgba(2,6,23,.8)", color: "#f8fafc", fontSize: 14,
                padding: "0 14px", outline: "none",
              }}
            />
            {searching && (
              <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "rgba(148,163,184,.5)" }}>
                Searching…
              </div>
            )}
          </div>

          {results.length > 0 && (
            <div style={{ display: "grid", gap: 3, marginBottom: 12 }}>
              {results.map((r) => (
                <CandidateRow
                  key={r.actor_id}
                  result={r}
                  selectedId={selectedResult?.actor_id}
                  onSelect={setSelectedResult}
                />
              ))}
            </div>
          )}

          {query.trim() && !searching && results.length === 0 && (
            <div style={{ textAlign: "center", padding: "18px 0", fontSize: 13, color: "rgba(148,163,184,.38)" }}>
              No citizens found for "{query}"
            </div>
          )}

          {selectedResult && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(148,163,184,.45)", letterSpacing: ".06em", marginBottom: 7 }}>ASSIGN ROLE</div>
              <div style={{ display: "flex", gap: 6 }}>
                {VALID_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    style={{
                      flex: 1, height: 38, borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      border: role === r ? "1px solid rgba(139,92,246,.5)" : "1px solid rgba(255,255,255,.08)",
                      background: role === r ? "rgba(139,92,246,.2)" : "rgba(255,255,255,.03)",
                      color: role === r ? "rgba(167,139,250,.9)" : "rgba(148,163,184,.55)",
                      transition: "all .12s",
                    }}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ fontSize: 12, color: "#fca5a5", marginBottom: 10 }}>{error}</div>
          )}
        </div>

        {/* Add button */}
        <div style={{
          padding: isDesktop ? "14px 16px 16px" : "12px 16px",
          paddingBottom: isDesktop ? 16 : "calc(env(safe-area-inset-bottom, 0px) + 16px)",
          borderTop: "1px solid rgba(148,163,184,.07)",
        }}>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedResult || adding}
            style={{
              width: "100%", height: 50, borderRadius: 13, border: "none",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              background: !selectedResult || adding
                ? "rgba(139,92,246,.18)"
                : "linear-gradient(135deg,rgba(139,92,246,.95),rgba(109,40,217,.95))",
              color: !selectedResult || adding ? "rgba(167,139,250,.35)" : "#fff",
              transition: "all .15s",
            }}
          >
            {adding ? "Adding…" : selectedResult ? `Add ${ROLE_LABELS[role]}` : "Select a Member First"}
          </button>
        </div>
      </div>
    </div>
  );
}
