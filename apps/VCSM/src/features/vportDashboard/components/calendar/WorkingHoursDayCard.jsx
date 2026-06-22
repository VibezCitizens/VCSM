import { fmtHM, uid, overlaps, SNAP } from "./calendarUtils";

const FULL_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ALL_TIMES = [];
for (let m = 5 * 60; m <= 24 * 60; m += SNAP) {
  ALL_TIMES.push(m);
}

const selStyle = {
  flex: "1 1 0",
  minWidth: 0,
  background: "rgba(2,6,23,.95)",
  border: "1px solid rgba(148,163,184,.14)",
  borderRadius: 9,
  color: "rgba(203,213,225,.95)",
  fontSize: 14,
  fontWeight: 600,
  padding: "9px 10px",
  cursor: "pointer",
  outline: "none",
  height: 44,
  WebkitAppearance: "none",
  appearance: "none",
};

function TimeRangeRow({ block, onUpdate, onRemove }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <select
        value={block.startMinutes}
        onChange={e => {
          const s = Number(e.target.value);
          onUpdate({ ...block, startMinutes: s, endMinutes: Math.max(s + SNAP, block.endMinutes) });
        }}
        style={selStyle}
      >
        {ALL_TIMES.filter(m => m < 24 * 60).map(m => (
          <option key={m} value={m} style={{ background: "#0f172a" }}>{fmtHM(m)}</option>
        ))}
      </select>
      <span style={{ color: "rgba(255,255,255,.2)", fontSize: 15, flexShrink: 0 }}>–</span>
      <select
        value={block.endMinutes}
        onChange={e => onUpdate({ ...block, endMinutes: Number(e.target.value) })}
        style={selStyle}
      >
        {ALL_TIMES.filter(m => m > block.startMinutes).map(m => (
          <option key={m} value={m} style={{ background: "#0f172a" }}>{fmtHM(m)}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onRemove(block.id)}
        aria-label="Remove time slot"
        style={{
          flexShrink: 0,
          width: 38,
          height: 44,
          borderRadius: 9,
          border: "1px solid rgba(239,68,68,.14)",
          background: "none",
          color: "rgba(252,165,165,.4)",
          fontSize: 22,
          fontWeight: 300,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        ×
      </button>
    </div>
  );
}

export default function WorkingHoursDayCard({ weekday, isToday, isOpen, blocks, onToggle, onBlocksChange }) {
  const dayName = FULL_DAY_NAMES[weekday];
  const sorted  = [...blocks].sort((a, b) => a.startMinutes - b.startMinutes);
  const hasHours = isOpen && blocks.length > 0;

  function addBlock() {
    const lastEnd = sorted.length ? sorted[sorted.length - 1].endMinutes : null;
    const s = lastEnd !== null ? lastEnd : 9 * 60;
    const e = Math.min(s + 60, 24 * 60);
    if (s >= 24 * 60 || s >= e) return;
    if (blocks.some(b => overlaps(s, e, b.startMinutes, b.endMinutes))) return;
    onBlocksChange([...blocks, { id: uid(), weekday, startMinutes: s, endMinutes: e }]);
  }

  function updateBlock(updated) {
    onBlocksChange(blocks.map(b => b.id === updated.id ? updated : b));
  }

  function removeBlock(id) {
    onBlocksChange(blocks.filter(b => b.id !== id));
  }

  return (
    <div style={{
      borderRadius: 14,
      border: `1px solid ${hasHours ? "rgba(139,92,246,.2)" : "rgba(255,255,255,.07)"}`,
      background: isToday ? "rgba(109,40,217,.05)" : "rgba(15,23,42,.6)",
      overflow: "hidden",
      transition: "border-color .15s",
    }}>
      {/* Day header — tapping toggles open/closed */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={e => (e.key === "Enter" || e.key === " ") && onToggle()}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "15px 16px",
          cursor: "pointer",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 16,
            fontWeight: 700,
            color: isToday
              ? "rgba(167,139,250,.95)"
              : (isOpen ? "rgba(255,255,255,.88)" : "rgba(255,255,255,.3)"),
          }}>
            {dayName}
          </span>
          {isToday && (
            <span style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".07em",
              background: "rgba(139,92,246,.15)",
              border: "1px solid rgba(139,92,246,.25)",
              borderRadius: 4,
              color: "rgba(167,139,250,.85)",
              padding: "2px 5px",
            }}>
              TODAY
            </span>
          )}
        </div>
        {/* Open / Closed pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          borderRadius: 20,
          border: isOpen ? "1px solid rgba(134,239,172,.2)" : "1px solid rgba(255,255,255,.08)",
          background: isOpen ? "rgba(34,197,94,.08)" : "transparent",
          padding: "5px 11px",
          transition: "all .15s",
        }}>
          {isOpen && (
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "rgba(134,239,172,.7)",
            }} />
          )}
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".05em",
            color: isOpen ? "rgba(134,239,172,.8)" : "rgba(255,255,255,.2)",
          }}>
            {isOpen ? "Open" : "Closed"}
          </span>
        </div>
      </div>

      {/* Time slots */}
      {isOpen && (
        <div style={{ padding: "0 16px 16px", display: "grid", gap: 8 }}>
          {sorted.length === 0 && (
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.22)", paddingBottom: 2 }}>
              No hours set — add a time slot.
            </div>
          )}
          {sorted.map(block => (
            <TimeRangeRow
              key={block.id}
              block={block}
              blocks={blocks}
              onUpdate={updateBlock}
              onRemove={removeBlock}
            />
          ))}
          <button
            type="button"
            onClick={addBlock}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: "none",
              border: "1px dashed rgba(139,92,246,.2)",
              borderRadius: 9,
              color: "rgba(167,139,250,.5)",
              fontSize: 13,
              fontWeight: 600,
              padding: "9px 12px",
              cursor: "pointer",
              minHeight: 44,
              marginTop: 2,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
            Add time slot
          </button>
        </div>
      )}
    </div>
  );
}
