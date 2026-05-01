import React, { useState } from "react";

export function BarberPickerModal({ actorId, adding, addError, findEligibleBarbers, onSelect, onClose }) {
  const [barbers, setBarbers] = useState([]);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  React.useEffect(() => {
    let cancelled = false;
    setLoadingBarbers(true);
    findEligibleBarbers()
      .then((data) => { if (!cancelled) setBarbers(data ?? []); })
      .catch((e) => { if (!cancelled) setLoadError(e?.message || "Failed to load barbers."); })
      .finally(() => { if (!cancelled) setLoadingBarbers(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = search.trim()
    ? barbers.filter((b) => b.name.toLowerCase().includes(search.trim().toLowerCase()))
    : barbers;

  function handleConfirm() {
    if (!selected) return;
    onSelect(selected.actorId, selected.name);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#111",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: isMobile ? "20px 20px 0 0" : 20,
          padding: "20px 0 0",
          width: "100%",
          maxWidth: 480,
          maxHeight: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "0 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div className="text-sm font-semibold text-zinc-100 mb-1">Select a barber</div>
          <div className="text-xs text-zinc-500">Only barbers who follow this shop are shown.</div>
        </div>

        <div style={{ padding: "12px 20px 8px", flexShrink: 0 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="w-full rounded-xl px-3 py-2 text-sm text-zinc-100 bg-zinc-900 border border-white/10 focus:outline-none focus:border-white/20"
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 12px", minHeight: 0 }}>
          {loadingBarbers && <div className="py-8 text-center text-xs text-zinc-500">Loading…</div>}
          {!loadingBarbers && loadError && <div className="py-8 text-center text-xs text-rose-400">{loadError}</div>}
          {!loadingBarbers && !loadError && filtered.length === 0 && (
            <div className="py-8 text-center">
              <div className="text-sm text-zinc-500 mb-1">No barbers found.</div>
              <div className="text-xs text-zinc-600">
                {search ? "Try a different search." : "No followers with an active Barber VPORT."}
              </div>
            </div>
          )}
          {!loadingBarbers && !loadError && filtered.map((b) => {
            const isSelected = selected?.actorId === b.actorId;
            return (
              <button
                key={b.actorId}
                type="button"
                onClick={() => setSelected(isSelected ? null : b)}
                className="w-full text-left px-3 py-3 rounded-xl mb-1 transition-colors"
                style={{
                  background: isSelected ? "rgba(255,255,255,0.1)" : "transparent",
                  border: isSelected ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    {b.avatar ? (
                      <img
                        src={b.avatar}
                        alt={b.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
                      />
                    ) : null}
                    <div
                      className="w-full h-full flex items-center justify-center text-sm font-semibold text-zinc-300"
                      style={{ display: b.avatar ? "none" : "flex" }}
                    >
                      {String(b.name || "?")[0].toUpperCase()}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-zinc-100 truncate">{b.name}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">Barber · Follows this shop</div>
                  </div>
                  {isSelected && (
                    <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                      <span className="text-xs text-zinc-100">✓</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div
          style={{
            padding: "12px 20px",
            paddingBottom: isMobile ? "max(20px, env(safe-area-inset-bottom, 20px))" : 20,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          {addError && <p className="text-xs text-rose-400 mb-2">{addError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm text-zinc-400 hover:text-zinc-200 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selected || adding}
              className="flex-1 text-sm font-semibold py-2.5 rounded-xl text-zinc-100 disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              {adding ? "Sending…" : "Send invitation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
