import { TIME_COL_W, fmtHour } from "./calendarUtils";

export default function TimeLabelsColumn({ gs, gh, ticks }) {
  return (
    <div style={{ width: TIME_COL_W, flexShrink: 0, position: "relative", height: gh, borderRight: "1px solid rgba(255,255,255,.06)" }}>
      {ticks.filter(t => t.isHour).map(({ mins, y }) => (
        <div key={mins} style={{ position: "absolute", right: 6, top: y - 6, fontSize: 9, fontWeight: 600, color: "rgba(148,163,184,.5)", textAlign: "right", lineHeight: 1, userSelect: "none", whiteSpace: "nowrap", pointerEvents: "none" }}>
          {fmtHour(mins)}
        </div>
      ))}
    </div>
  );
}
