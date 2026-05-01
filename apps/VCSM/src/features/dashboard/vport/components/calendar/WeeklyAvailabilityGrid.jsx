import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SNAP, CELL_H, TIME_COL_W, WEEKDAYS, DAY_LABELS, MONTH_SHORT,
  gridOf, minsToTime, rulesToBlocks, detectMode, dayHoursSummary,
  getWeekStart, addDays, tBtn, uid,
} from "./calendarUtils";
import TimeLabelsColumn from "./TimeLabelsColumn";
import DayHeader from "./DayHeader";
import DayBody, { DayPills } from "./DayBody";
import RangeToggle from "./RangeToggle";

export default function WeeklyAvailabilityGrid({
  resourceId,
  viewerActorId,
  resourceTz,
  rules,
  manageAvailability,
  availabilityRefresh,
  isMobile,
}) {
  const [blocks, setBlocks]         = useState(() => rulesToBlocks(rules));
  const [closedDays, setClosedDays] = useState(() => {
    const open = new Set(rulesToBlocks(rules).map(b => b.weekday));
    return new Set([0, 1, 2, 3, 4, 5, 6].filter(d => !open.has(d)));
  });
  const [mode, setMode]           = useState(() => detectMode(rules));
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState(null);
  const [applyMsg, setApplyMsg]   = useState(null);
  const [activeDay, setActiveDay] = useState(() => new Date().getDay());
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  useEffect(() => {
    const next = rulesToBlocks(rules);
    setBlocks(next);
    const open = new Set(next.map(b => b.weekday));
    setClosedDays(new Set([0, 1, 2, 3, 4, 5, 6].filter(d => !open.has(d))));
    setMode(detectMode(rules));
  }, [rules]);

  const grid       = useMemo(() => gridOf(mode), [mode]);
  const todayDate  = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const weekDates  = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const isThisWeek = useMemo(() => getWeekStart(todayDate).toDateString() === weekStart.toDateString(), [todayDate, weekStart]);
  const tz         = resourceTz || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const ticks = useMemo(() => Array.from({ length: grid.slots + 1 }, (_, i) => {
    const mins = grid.s + i * SNAP;
    return { mins, y: i * CELL_H, isHour: mins % 60 === 0 };
  }), [grid]);

  function setDayBlocks(wd, dbs) {
    setBlocks(prev => [...prev.filter(b => b.weekday !== wd), ...dbs]);
    setSaveMsg(null);
  }

  function toggleDay(wd) {
    const wasOpen = !closedDays.has(wd);
    if (wasOpen) {
      setBlocks(prev => prev.filter(b => b.weekday !== wd));
      setClosedDays(prev => new Set([...prev, wd]));
    } else {
      setClosedDays(prev => { const s = new Set(prev); s.delete(wd); return s; });
    }
    setSaveMsg(null);
  }

  function applyMonToWeekdays() {
    setApplyMsg(null);
    if (closedDays.has(1)) { setApplyMsg({ ok: false, text: "Monday is closed — toggle it open first." }); return; }
    const mon = blocks.filter(b => b.weekday === 1);
    if (!mon.length) { setApplyMsg({ ok: false, text: "Set Monday hours first." }); return; }
    const next = blocks.filter(b => !WEEKDAYS.includes(b.weekday));
    for (const wd of WEEKDAYS) mon.forEach(b => next.push({ ...b, id: uid(), weekday: wd }));
    setBlocks(next);
    setClosedDays(prev => { const s = new Set(prev); WEEKDAYS.forEach(d => s.delete(d)); return s; });
    setSaveMsg(null);
    setApplyMsg({ ok: true, text: "Copied Mon → Tue–Fri." });
    if (import.meta.env.DEV) console.log("[ScheduleEditor] Applied Monday blocks to weekdays");
  }

  function set9to5() {
    const next = blocks.filter(b => !WEEKDAYS.includes(b.weekday));
    WEEKDAYS.forEach(wd => next.push({ id: uid(), weekday: wd, startMinutes: 9 * 60, endMinutes: 17 * 60 }));
    setBlocks(next);
    setClosedDays(prev => { const s = new Set(prev); WEEKDAYS.forEach(d => s.delete(d)); return s; });
    setSaveMsg(null); setApplyMsg(null);
  }

  function clearAll() {
    setBlocks([]);
    setClosedDays(new Set([0, 1, 2, 3, 4, 5, 6]));
    setSaveMsg(null); setApplyMsg(null);
  }

  async function save() {
    if (!resourceId || !viewerActorId) return;
    setSaving(true); setSaveMsg(null);
    const existingByDay = new Map();
    (Array.isArray(rules) ? rules : []).forEach(r => {
      const wd = Number(r.weekday);
      if (!existingByDay.has(wd)) existingByDay.set(wd, []);
      existingByDay.get(wd).push(r);
    });
    try {
      for (let wd = 0; wd < 7; wd++) {
        const dbs      = blocks.filter(b => b.weekday === wd).sort((a, b) => a.startMinutes - b.startMinutes);
        const existing = existingByDay.get(wd) ?? [];
        if (!dbs.length) {
          for (const rule of existing) {
            if (rule.isActive === false) continue;
            const res = await manageAvailability.setAvailabilityRule({ requestActorId: viewerActorId, ruleId: rule.id, resourceId, ruleType: "weekly", weekday: wd, startTime: rule.startTime, endTime: rule.endTime, isActive: false });
            if (!res?.ok) throw new Error(`${DAY_LABELS[wd]}: ${res?.error?.message ?? "Failed."}`);
          }
          continue;
        }
        for (let i = 0; i < dbs.length; i++) {
          const blk = dbs[i], er = existing[i] ?? null;
          const res = await manageAvailability.setAvailabilityRule({ requestActorId: viewerActorId, ruleId: er?.id ?? undefined, resourceId, ruleType: "weekly", weekday: wd, startTime: minsToTime(blk.startMinutes), endTime: minsToTime(blk.endMinutes), isActive: true });
          if (!res?.ok) throw new Error(`${DAY_LABELS[wd]}: ${res?.error?.message ?? "Failed."}`);
        }
        for (let i = dbs.length; i < existing.length; i++) {
          const rule = existing[i];
          if (rule.isActive === false) continue;
          const res = await manageAvailability.setAvailabilityRule({ requestActorId: viewerActorId, ruleId: rule.id, resourceId, ruleType: "weekly", weekday: wd, startTime: rule.startTime, endTime: rule.endTime, isActive: false });
          if (!res?.ok) throw new Error(`${DAY_LABELS[wd]}: ${res?.error?.message ?? "Failed."}`);
        }
      }
      await availabilityRefresh();
      setSaveMsg({ ok: true, text: "Saved." });
      setApplyMsg(null);
    } catch (err) {
      setSaveMsg({ ok: false, text: String(err?.message ?? err) });
    } finally {
      setSaving(false);
    }
  }

  const weekLabel = (() => {
    const s = weekDates[0], e = weekDates[6];
    return `${MONTH_SHORT[s.getMonth()]} ${s.getDate()} – ${MONTH_SHORT[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
  })();

  const weekNav = (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <button type="button" onClick={() => setWeekStart(d => addDays(d, -7))} style={tBtn({ padding: "5px 7px" })}>‹</button>
      <button type="button" onClick={() => setWeekStart(getWeekStart(new Date()))} disabled={isThisWeek} style={tBtn({ opacity: isThisWeek ? 0.4 : 1, cursor: isThisWeek ? "default" : "pointer" })}>This week</button>
      <button type="button" onClick={() => setWeekStart(d => addDays(d, 7))} style={tBtn({ padding: "5px 7px" })}>›</button>
      <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(148,163,184,.5)", whiteSpace: "nowrap" }}>{weekLabel}</span>
    </div>
  );

  const toolbar = (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <button type="button" onClick={applyMonToWeekdays} disabled={saving} style={tBtn()}>Apply Mon → Weekdays</button>
      <button type="button" onClick={set9to5} disabled={saving} style={tBtn()}>Set 9–5 Weekdays</button>
      <button type="button" onClick={clearAll} disabled={saving} style={tBtn({ borderColor: "rgba(239,68,68,.28)", color: "rgba(252,165,165,.75)" })}>Clear All</button>
      {applyMsg && <span style={{ fontSize: 11, fontWeight: 600, color: applyMsg.ok ? "rgba(134,239,172,.85)" : "rgba(252,165,165,.8)" }}>{applyMsg.text}</span>}
    </div>
  );

  const saveRow = (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button type="button" disabled={saving} onClick={save} style={{ borderRadius: 9, border: "1px solid rgba(139,92,246,.5)", background: saving ? "rgba(109,40,217,.2)" : "rgba(109,40,217,.42)", color: "#f8fafc", fontSize: 13, fontWeight: 700, padding: "9px 18px", cursor: saving ? "wait" : "pointer", transition: "background .15s" }}>
        {saving ? "Saving…" : "Save Working Hours"}
      </button>
      {saveMsg && <span style={{ fontSize: 12, fontWeight: 600, color: saveMsg.ok ? "#86efac" : "#fca5a5" }}>{saveMsg.text}</span>}
    </div>
  );

  const tzRow = <div style={{ fontSize: 10, color: "rgba(148,163,184,.5)", fontWeight: 600, letterSpacing: ".04em" }}>Timezone: {tz}</div>;

  if (isMobile) {
    const dbs    = blocks.filter(b => b.weekday === activeDay);
    const isOpen = !closedDays.has(activeDay);
    return (
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          {weekNav}
          <RangeToggle mode={mode} onChange={setMode} />
        </div>
        <div style={{ fontSize: 10, color: "rgba(148,163,184,.45)", fontWeight: 600 }}>{tz}</div>
        <DayPills active={activeDay} closedDays={closedDays} blocks={blocks} onChange={setActiveDay} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: weekDates[activeDay].toDateString() === todayDate.toDateString() ? "rgba(167,139,250,.9)" : "rgba(255,255,255,.85)" }}>{DAY_LABELS[activeDay]}</div>
          <button type="button" onClick={() => toggleDay(activeDay)} style={{ borderRadius: 5, border: `1px solid ${isOpen ? "rgba(34,197,94,.3)" : "rgba(239,68,68,.2)"}`, background: isOpen ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.06)", color: isOpen ? "rgba(134,239,172,.9)" : "rgba(252,165,165,.6)", fontSize: 10, fontWeight: 700, padding: "3px 7px", cursor: "pointer" }}>
            {isOpen ? "OPEN" : "CLOSED"}
          </button>
          {isOpen && dbs.length > 0 && <div style={{ fontSize: 11, color: "rgba(167,139,250,.7)" }}>{dayHoursSummary(dbs)}</div>}
        </div>
        {!isOpen ? (
          <div style={{ padding: "16px 0", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.28)" }}>Tap CLOSED to open this day</div>
        ) : (
          <>
            {dbs.length === 0 && <div style={{ borderRadius: 8, border: "1px dashed rgba(139,92,246,.2)", padding: "8px 12px", fontSize: 11, color: "rgba(203,213,225,.4)", textAlign: "center" }}>Drag to set hours for {DAY_LABELS[activeDay]}</div>}
            <div style={{ borderRadius: 10, border: "1px solid rgba(148,163,184,.12)", background: "rgba(2,6,23,.72)", overflow: "hidden" }}>
              <div style={{ display: "flex", maxHeight: "min(420px,calc(100vh - 380px))", overflowY: "auto" }}>
                <div style={{ position: "sticky", left: 0, flexShrink: 0, zIndex: 3, background: "rgba(2,6,23,.9)" }}>
                  <TimeLabelsColumn gs={grid.s} gh={grid.h} ticks={ticks} />
                </div>
                <DayBody wd={activeDay} isOpen={isOpen} isToday={weekDates[activeDay].toDateString() === todayDate.toDateString()} blocks={dbs} gs={grid.s} ge={grid.e} gh={grid.h} ticks={ticks} onBlocksChange={dbs2 => setDayBlocks(activeDay, dbs2)} />
              </div>
            </div>
          </>
        )}
        {toolbar}
        {saveRow}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        {toolbar}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {weekNav}
          {tzRow}
          <RangeToggle mode={mode} onChange={setMode} />
        </div>
      </div>
      {blocks.length === 0 && (
        <div style={{ borderRadius: 8, border: "1px dashed rgba(139,92,246,.2)", padding: "8px 12px", fontSize: 11, color: "rgba(203,213,225,.4)", textAlign: "center" }}>
          Drag vertically on any day column to set working hours
        </div>
      )}
      <div style={{ borderRadius: 10, border: "1px solid rgba(148,163,184,.14)", background: "rgba(2,6,23,.72)", overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,.07)", background: "rgba(2,6,23,.92)" }}>
          <div style={{ width: TIME_COL_W, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,.06)" }} />
          {[0,1,2,3,4,5,6].map(wd => (
            <DayHeader key={wd} wd={wd} isOpen={!closedDays.has(wd)} isToday={weekDates[wd].toDateString() === todayDate.toDateString()} date={weekDates[wd]} dayBlocks={blocks.filter(b => b.weekday === wd)} onToggle={() => toggleDay(wd)} />
          ))}
        </div>
        <div style={{ display: "flex", maxHeight: "min(460px,calc(100vh - 360px))", minHeight: 200, overflowY: "auto" }}>
          <div style={{ position: "sticky", left: 0, flexShrink: 0, zIndex: 3, background: "rgba(2,6,23,.92)" }}>
            <TimeLabelsColumn gs={grid.s} gh={grid.h} ticks={ticks} />
          </div>
          {[0,1,2,3,4,5,6].map(wd => (
            <div key={wd} style={{ flex: "1 1 0", minWidth: 0 }}>
              <DayBody wd={wd} isOpen={!closedDays.has(wd)} isToday={weekDates[wd].toDateString() === todayDate.toDateString()} blocks={blocks.filter(b => b.weekday === wd)} gs={grid.s} ge={grid.e} gh={grid.h} ticks={ticks} onBlocksChange={dbs => setDayBlocks(wd, dbs)} />
            </div>
          ))}
        </div>
      </div>
      {saveRow}
    </div>
  );
}
