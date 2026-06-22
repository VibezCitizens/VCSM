import { useEffect, useRef, useState } from "react";
import { LANE_COLORS, TOTAL_HEIGHT, TOTAL_HOURS, DAY_START, HOUR_HEIGHT } from "./scheduleConstants";
import { getCurrentTimePx, pxToTimeSnapped, timeToPx, formatHour } from "./scheduleTimeUtils";
import { WorkingZone, CurrentTimeLine, BookingBlock } from "./ScheduleLaneElements";
import BarberLaneHeader from "./BarberLaneHeader";

export function MobileBarberSelector({ lanes, activeIdx, onSelect }) {
  return (
    <div className="sched-mobile-tabs">
      {lanes.map((lane, i) => {
        const color = LANE_COLORS[i % LANE_COLORS.length];
        const isActive = i === activeIdx;
        return (
          <button
            key={lane.resource.id}
            type="button"
            className={`sched-mobile-tab${isActive ? " is-active" : ""}`}
            style={isActive ? { background: color.bg, borderColor: color.border, color: color.text } : {}}
            onClick={() => onSelect(i)}
          >
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color.dot, flexShrink: 0 }} />
            {lane.resource.name || `Barber ${i + 1}`}
          </button>
        );
      })}
    </div>
  );
}

function LaneColumn({ lane, colorIdx, onSlotClick, onBookingClick }) {
  return (
    <div className="sched-lane-body" style={{ height: TOTAL_HEIGHT }}>
      {lane.dayRules.map((rule, ri) => <WorkingZone key={ri} rule={rule} colorIdx={colorIdx} />)}
      {(!lane.hasRules || !lane.isWorking) && <div className="sched-closed-overlay" />}
      {!lane.hasRules && (
        <div className="sched-no-rules-banner">
          <span className="sched-no-rules-text">Schedule not set</span>
        </div>
      )}
      <div className="sched-click-layer" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); onSlotClick(lane.resource.id, pxToTimeSnapped(e.clientY - rect.top)); }} style={{ height: TOTAL_HEIGHT }} />
      {lane.bookings.map((b) => <BookingBlock key={b.id} booking={b} colorIdx={colorIdx} onClick={onBookingClick} />)}
    </div>
  );
}

export function ScheduleGrid({ lanes, isToday, onSlotClick, onBookingClick }) {
  const [nowPx, setNowPx] = useState(getCurrentTimePx);
  const scrollRef = useRef(null);
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => DAY_START + i);

  useEffect(() => {
    const id = setInterval(() => setNowPx(getCurrentTimePx()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = nowPx !== null ? Math.max(0, nowPx - 80) : timeToPx("08:00");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="sched-scroll-area" ref={scrollRef}>
      <div className="sched-lane-header-row">
        <div className="sched-corner" style={{ height: 70 }} />
        {lanes.map((lane, i) => <BarberLaneHeader key={lane.resource.id} lane={lane} colorIdx={i} />)}
      </div>
      <div className="sched-body-row">
        <div className="sched-time-col" style={{ height: TOTAL_HEIGHT }}>
          {hours.map((h) => (
            <div key={h} className="sched-time-label" style={{ height: HOUR_HEIGHT }}>
              <span className="sched-time-label-text">{formatHour(h)}</span>
            </div>
          ))}
        </div>
        <div className="sched-lanes-container" style={{ height: TOTAL_HEIGHT }}>
          {lanes.map((lane, i) => (
            <LaneColumn key={lane.resource.id} lane={lane} colorIdx={i} onSlotClick={onSlotClick} onBookingClick={onBookingClick} />
          ))}
          {isToday && nowPx !== null && <CurrentTimeLine pxTop={nowPx} />}
        </div>
      </div>
    </div>
  );
}

export function MobileScheduleGrid({ lane, colorIdx, isToday, onSlotClick, onBookingClick }) {
  const [nowPx, setNowPx] = useState(getCurrentTimePx);
  const scrollRef = useRef(null);
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => DAY_START + i);

  useEffect(() => {
    const id = setInterval(() => setNowPx(getCurrentTimePx()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = nowPx !== null ? Math.max(0, nowPx - 80) : timeToPx("08:00");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ flex: 1, overflow: "auto", position: "relative" }} ref={scrollRef}>
      <div className="sched-body-row">
        <div className="sched-time-col" style={{ height: TOTAL_HEIGHT }}>
          {hours.map((h) => (
            <div key={h} className="sched-time-label" style={{ height: HOUR_HEIGHT }}>
              <span className="sched-time-label-text">{formatHour(h)}</span>
            </div>
          ))}
        </div>
        <div className="sched-lanes-container" style={{ height: TOTAL_HEIGHT }}>
          <div className="sched-lane-body" style={{ height: TOTAL_HEIGHT, flex: 1 }}>
            {lane.dayRules.map((rule, ri) => <WorkingZone key={ri} rule={rule} colorIdx={colorIdx} />)}
            {(!lane.hasRules || !lane.isWorking) && <div className="sched-closed-overlay" />}
            {!lane.hasRules && (
              <div className="sched-no-rules-banner">
                <span className="sched-no-rules-text">Schedule not set</span>
              </div>
            )}
            <div className="sched-click-layer" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); onSlotClick(lane.resource.id, pxToTimeSnapped(e.clientY - rect.top)); }} style={{ height: TOTAL_HEIGHT }} />
            {lane.bookings.map((b) => <BookingBlock key={b.id} booking={b} colorIdx={colorIdx} onClick={onBookingClick} />)}
          </div>
          {isToday && nowPx !== null && <CurrentTimeLine pxTop={nowPx} />}
        </div>
      </div>
    </div>
  );
}

export function ScheduleSkeleton() {
  return (
    <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="sched-skeleton-bar" style={{ height: 60, borderRadius: 14 }} />
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="sched-skeleton-bar" style={{ flex: 1, height: 400, borderRadius: 14 }} />
        ))}
      </div>
    </div>
  );
}
