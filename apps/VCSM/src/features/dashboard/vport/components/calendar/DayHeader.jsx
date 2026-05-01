import { DAY_LABELS, MONTH_SHORT, dayHoursSummary } from "./calendarUtils";

export default function DayHeader({ wd, isOpen, isToday, date, dayBlocks, onToggle }) {
  const hrs       = isOpen ? dayHoursSummary(dayBlocks) : null;
  const dateLabel = date ? `${date.getDate()} ${MONTH_SHORT[date.getMonth()]}` : null;
  return (
    <div style={{ flex: "1 1 0", minWidth: 0, padding: "6px 2px 5px", textAlign: "center", borderRight: "1px solid rgba(255,255,255,.04)", background: isToday ? "rgba(139,92,246,.07)" : "transparent" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: isToday ? "rgba(167,139,250,.9)" : "rgba(255,255,255,.4)", marginBottom: 1 }}>
        {DAY_LABELS[wd]}
      </div>
      {dateLabel && (
        <div style={{ fontSize: 9, fontWeight: 600, color: isToday ? "rgba(167,139,250,.7)" : "rgba(255,255,255,.22)", marginBottom: 4, lineHeight: 1 }}>
          {dateLabel}
        </div>
      )}
      <button
        type="button"
        onClick={onToggle}
        style={{
          borderRadius: 4,
          border: `1px solid ${isOpen ? "rgba(34,197,94,.3)" : "rgba(239,68,68,.2)"}`,
          background: isOpen ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.06)",
          color: isOpen ? "rgba(134,239,172,.9)" : "rgba(252,165,165,.6)",
          fontSize: 8, fontWeight: 700, padding: "2px 4px", cursor: "pointer",
          letterSpacing: ".04em", lineHeight: 1.4, display: "block", margin: "0 auto",
        }}
      >{isOpen ? "OPEN" : "CLOSED"}</button>
      {hrs && (
        <div style={{ marginTop: 3, fontSize: 8, color: "rgba(167,139,250,.65)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", padding: "0 2px" }}>
          {hrs}
        </div>
      )}
    </div>
  );
}
