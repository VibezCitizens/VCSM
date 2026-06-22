import { minsToY, fmtRange } from "./calendarUtils";

export default function TimeBlock({ block, selected, colW, gs, onSelect, onDelete, onResizeStart }) {
  const top = minsToY(block.startMinutes, gs);
  const h   = minsToY(block.endMinutes, gs) - top;
  return (
    <div
      onMouseDown={e => { if (e.target.dataset.resize) return; e.stopPropagation(); onSelect(block.id); }}
      style={{
        position: "absolute", top, left: 2, right: 2, height: h,
        borderRadius: 6, zIndex: 2, overflow: "hidden",
        background: selected
          ? "linear-gradient(180deg,rgba(139,92,246,.78),rgba(109,40,217,.72))"
          : "linear-gradient(180deg,rgba(109,40,217,.52),rgba(88,28,219,.48))",
        border: `1px solid ${selected ? "rgba(167,139,250,.85)" : "rgba(139,92,246,.5)"}`,
        boxShadow: selected ? "0 0 0 2px rgba(139,92,246,.22)" : "none",
        cursor: "pointer", userSelect: "none",
        transition: "background .1s, border-color .1s",
      }}
    >
      {h >= 34 && colW >= 52 && (
        <div style={{ padding: "3px 5px 0", pointerEvents: "none", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.9)", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {fmtRange(block.startMinutes, block.endMinutes)}
        </div>
      )}
      {selected && (
        <button
          type="button"
          onMouseDown={e => { e.stopPropagation(); onDelete(block.id); }}
          style={{ position: "absolute", top: 2, right: 2, width: 14, height: 14, borderRadius: 3, background: "rgba(239,68,68,.75)", border: "none", color: "#fff", fontSize: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >✕</button>
      )}
      <div
        data-resize="1"
        onMouseDown={e => { e.stopPropagation(); onResizeStart(e, block); }}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 7, cursor: "ns-resize", background: "rgba(139,92,246,.18)", borderRadius: "0 0 5px 5px" }}
      />
    </div>
  );
}
