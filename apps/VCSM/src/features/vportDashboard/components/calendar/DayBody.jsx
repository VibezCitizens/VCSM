import { useEffect, useRef, useState } from "react";
import { SNAP, CELL_H, DAY_LABELS, minsToY, yToMins, overlaps, uid } from "./calendarUtils";
import TimeBlock from "./TimeBlock";

export default function DayBody({ wd, isOpen, isToday, blocks, gs, ge, gh, ticks, onBlocksChange }) {
  const ref      = useRef(null);
  const colWRef  = useRef(60);
  const slots    = (ge - gs) / SNAP;
  const [selId, setSelId]     = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => { if (ref.current) colWRef.current = ref.current.offsetWidth; });
  useEffect(() => {
    function od(e) { if (ref.current && !ref.current.contains(e.target)) setSelId(null); }
    document.addEventListener("mousedown", od);
    return () => document.removeEventListener("mousedown", od);
  }, []);

  function ry(cy) { const r = ref.current?.getBoundingClientRect(); return r ? cy - r.top : 0; }

  function onBodyDown(e) {
    if (!isOpen || e.target.closest("[data-bid]")) return;
    setSelId(null);
    const sm = yToMins(ry(e.clientY), gs, slots);
    const drag = { sm, em: Math.min(sm + SNAP, ge) };
    setPreview({ s: drag.sm, e: drag.em });

    function mv(me) {
      const raw = yToMins(ry(me.clientY), gs, slots);
      const snp = gs + Math.round((raw - gs) / SNAP) * SNAP;
      drag.em = Math.max(drag.sm + SNAP, Math.min(ge, snp + SNAP));
      drag.sm = Math.min(drag.sm, Math.max(gs, snp));
      setPreview({ s: drag.sm, e: drag.em });
    }
    function up() {
      window.removeEventListener("mousemove", mv);
      window.removeEventListener("mouseup", up);
      if (drag.em > drag.sm) {
        const ok = !blocks.some(b => overlaps(drag.sm, drag.em, b.startMinutes, b.endMinutes));
        if (ok) onBlocksChange([...blocks, { id: uid(), weekday: wd, startMinutes: drag.sm, endMinutes: drag.em }]);
      }
      setPreview(null);
    }
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
    e.preventDefault();
  }

  function onResizeStart(e, block) {
    if (!isOpen) return;
    const drag = { em: block.endMinutes };
    setSelId(block.id);
    setPreview({ s: block.startMinutes, e: block.endMinutes });
    function mv(me) {
      const raw = yToMins(ry(me.clientY), gs, slots);
      drag.em = Math.max(block.startMinutes + SNAP, Math.min(ge, raw + SNAP));
      setPreview({ s: block.startMinutes, e: drag.em });
    }
    function up() {
      window.removeEventListener("mousemove", mv);
      window.removeEventListener("mouseup", up);
      const ok = !blocks.filter(b => b.id !== block.id).some(b => overlaps(block.startMinutes, drag.em, b.startMinutes, b.endMinutes));
      if (ok && drag.em !== block.endMinutes)
        onBlocksChange(blocks.map(b => b.id === block.id ? { ...b, endMinutes: drag.em } : b));
      setPreview(null);
    }
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
    e.preventDefault();
  }

  const nowM  = (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); })();
  const nowY  = minsToY(nowM, gs);
  const showN = isToday && nowM >= gs && nowM <= ge;

  return (
    <div
      ref={ref}
      onMouseDown={onBodyDown}
      style={{
        position: "relative", height: gh, flex: "1 1 0",
        borderRight: "1px solid rgba(255,255,255,.04)",
        background: isOpen ? "transparent" : "rgba(0,0,0,.15)",
        cursor: isOpen ? "crosshair" : "default",
        overflow: "hidden",
      }}
    >
      {ticks.map(({ mins, y, isHour }) => (
        <div key={mins} style={{ position: "absolute", left: 0, right: 0, top: y, height: 1, background: isHour ? "rgba(255,255,255,.065)" : "rgba(255,255,255,.02)", pointerEvents: "none" }} />
      ))}
      {isOpen && blocks.map(b => (
        <div key={b.id} data-bid={b.id}>
          <TimeBlock block={b} selected={selId === b.id} colW={colWRef.current} gs={gs}
            onSelect={setSelId}
            onDelete={id => { setSelId(null); onBlocksChange(blocks.filter(x => x.id !== id)); }}
            onResizeStart={onResizeStart}
          />
        </div>
      ))}
      {isOpen && preview && (
        <div style={{ position: "absolute", top: minsToY(preview.s, gs), left: 2, right: 2, height: minsToY(preview.e, gs) - minsToY(preview.s, gs), borderRadius: 6, background: "rgba(139,92,246,.13)", border: "1px dashed rgba(139,92,246,.4)", zIndex: 1, pointerEvents: "none" }} />
      )}
      {showN && (
        <div style={{ position: "absolute", left: 0, right: 0, top: nowY, height: 2, background: "rgba(239,68,68,.5)", zIndex: 4, pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: -3, top: -3, width: 7, height: 7, borderRadius: "50%", background: "rgba(239,68,68,.7)" }} />
        </div>
      )}
    </div>
  );
}

export function DayPills({ active, closedDays, blocks, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2 }}>
      {DAY_LABELS.map((label, wd) => {
        const on     = wd === active;
        const closed = closedDays.has(wd);
        const dot    = !closed && blocks.some(b => b.weekday === wd);
        return (
          <button key={wd} type="button" onClick={() => onChange(wd)} style={{
            flexShrink: 0, borderRadius: 8, padding: "5px 10px",
            border: `1px solid ${on ? "rgba(139,92,246,.6)" : "rgba(255,255,255,.1)"}`,
            background: on ? "rgba(139,92,246,.22)" : "rgba(255,255,255,.04)",
            color: on ? "rgba(255,255,255,.95)" : (closed ? "rgba(255,255,255,.28)" : "rgba(255,255,255,.65)"),
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          }}>
            {label}
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: dot ? "rgba(139,92,246,.8)" : "transparent" }} />
          </button>
        );
      })}
    </div>
  );
}
