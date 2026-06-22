export default function ResourceDropdown({ resources, selectedId, onSelect }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(148,163,184,.65)", whiteSpace: "nowrap" }}>
        Schedule for
      </span>
      <select
        value={selectedId ?? ""}
        onChange={e => onSelect(e.target.value || null)}
        style={{
          flex: "1 1 auto", maxWidth: 300,
          borderRadius: 7,
          border: "1px solid rgba(148,163,184,.22)",
          background: "rgba(15,23,42,.85)",
          color: "rgba(203,213,225,.92)",
          fontSize: 16, fontWeight: 600,
          padding: "5px 10px",
          cursor: "pointer", outline: "none",
        }}
      >
        {resources.map(r => {
          const role = r.resourceType && r.resourceType !== "staff" ? ` · ${r.resourceType}` : "";
          return (
            <option key={r.id} value={r.id} style={{ background: "#0f172a" }}>
              {r.name}{role}
            </option>
          );
        })}
      </select>
    </div>
  );
}
