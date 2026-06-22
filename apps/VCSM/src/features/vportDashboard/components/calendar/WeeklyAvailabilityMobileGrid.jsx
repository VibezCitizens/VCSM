import WorkingHoursDayCard from "./WorkingHoursDayCard";

export default function WeeklyAvailabilityMobileGrid({
  closedDays,
  blocks,
  saving,
  applyMsg,
  saveMsg,
  tz,
  onToggleDay,
  onDayBlocksChange,
  onApplyMonToWeekdays,
  onSet9to5,
  onClearAll,
  onSave,
}) {
  const todayWd = new Date().getDay();

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {[0, 1, 2, 3, 4, 5, 6].map(wd => (
        <WorkingHoursDayCard
          key={wd}
          weekday={wd}
          isToday={wd === todayWd}
          isOpen={!closedDays.has(wd)}
          blocks={blocks.filter(b => b.weekday === wd)}
          onToggle={() => onToggleDay(wd)}
          onBlocksChange={dbs => onDayBlocksChange(wd, dbs)}
        />
      ))}

      <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={onApplyMonToWeekdays}
            disabled={saving}
            style={{
              flex: 1, minHeight: 44, borderRadius: 10,
              border: "1px solid rgba(148,163,184,.16)",
              background: "rgba(15,23,42,.6)",
              color: "rgba(203,213,225,.75)",
              fontSize: 12, fontWeight: 600,
              cursor: saving ? "default" : "pointer",
              padding: "10px 8px",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Apply Mon → Weekdays
          </button>
          <button
            type="button"
            onClick={onSet9to5}
            disabled={saving}
            style={{
              flex: 1, minHeight: 44, borderRadius: 10,
              border: "1px solid rgba(148,163,184,.16)",
              background: "rgba(15,23,42,.6)",
              color: "rgba(203,213,225,.75)",
              fontSize: 12, fontWeight: 600,
              cursor: saving ? "default" : "pointer",
              padding: "10px 8px",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Set 9–5 Weekdays
          </button>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          disabled={saving}
          style={{
            minHeight: 44, borderRadius: 10,
            border: "1px solid rgba(239,68,68,.13)",
            background: "none",
            color: "rgba(252,165,165,.38)",
            fontSize: 12, fontWeight: 600,
            cursor: saving ? "default" : "pointer",
            padding: "10px 12px",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Clear All
        </button>
        {applyMsg && (
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: applyMsg.ok ? "rgba(134,239,172,.8)" : "rgba(252,165,165,.75)",
            textAlign: "center", padding: "2px 0",
          }}>
            {applyMsg.text}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          style={{
            width: "100%", minHeight: 52, borderRadius: 12,
            border: saving ? "1px solid rgba(139,92,246,.3)" : "1px solid rgba(139,92,246,.5)",
            background: saving
              ? "rgba(109,40,217,.2)"
              : "linear-gradient(135deg, rgba(109,40,217,.65) 0%, rgba(139,92,246,.5) 100%)",
            color: "#f8fafc",
            fontSize: 15, fontWeight: 700,
            cursor: saving ? "wait" : "pointer",
            letterSpacing: ".01em",
            transition: "background .15s",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {saving ? "Saving…" : "Save Working Hours"}
        </button>
        {saveMsg && (
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: saveMsg.ok ? "rgba(134,239,172,.8)" : "rgba(252,165,165,.75)",
            textAlign: "center",
          }}>
            {saveMsg.text}
          </div>
        )}
        <div style={{ fontSize: 11, color: "rgba(148,163,184,.3)", textAlign: "center", fontWeight: 500 }}>
          {tz}
        </div>
      </div>
    </div>
  );
}
