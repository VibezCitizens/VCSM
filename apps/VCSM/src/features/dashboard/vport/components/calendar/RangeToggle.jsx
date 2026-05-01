export default function RangeToggle({ mode, onChange }) {
  return (
    <div style={{ display: "flex", borderRadius: 7, border: "1px solid rgba(148,163,184,.18)", overflow: "hidden" }}>
      {[["standard", "5 AM–12 AM"], ["full", "24h"]].map(([v, lbl]) => (
        <button key={v} type="button" onClick={() => onChange(v)} style={{
          fontSize: 10, fontWeight: 600, padding: "4px 8px", cursor: "pointer",
          background: mode === v ? "rgba(139,92,246,.28)" : "rgba(15,23,42,.7)",
          color: mode === v ? "rgba(255,255,255,.9)" : "rgba(148,163,184,.65)",
          border: "none", whiteSpace: "nowrap",
        }}>{lbl}</button>
      ))}
    </div>
  );
}
