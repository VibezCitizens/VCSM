import { useEffect, useMemo, useRef, useState } from "react";
import { timeFromMinutes } from "@/features/wanderex/model/wanderexPublic.model";

const START_MINUTES = 6 * 60;
const END_MINUTES = 22 * 60;
const STEP_MINUTES = 15;
const PX_PER_STEP = 16;

function formatHourLabel(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12} ${period}`;
}

function isMinuteWithinIntervals(intervals, minute) {
  return (intervals || []).some((range) => minute >= range.start && minute < range.end);
}

function buildRows() {
  const rows = [];
  for (let minute = START_MINUTES; minute < END_MINUTES; minute += STEP_MINUTES) {
    rows.push({
      minute,
      label: minute % 60 === 0 ? formatHourLabel(minute) : "",
    });
  }
  return rows;
}

export function WanderExBookingLaneCalendar({
  resources,
  dateKey,
  calendarByResource,
  durationMinutes,
  selectedResourceId,
  selectedStartMinutes,
  onSelectRange,
}) {
  const rows = useMemo(buildRows, []);
  const [dragState, setDragState] = useState(null);
  const dragRef = useRef(null);

  useEffect(() => {
    function handleMouseUp() {
      const drag = dragRef.current;
      if (!drag) return;

      dragRef.current = null;
      setDragState(null);

      if (typeof onSelectRange !== "function") return;

      const start = Math.min(drag.startMinutes, drag.endMinutes);
      const end = Math.max(drag.startMinutes, drag.endMinutes) + STEP_MINUTES;

      onSelectRange({
        resourceId: drag.resourceId,
        dateKey,
        startMinutes: start,
        endMinutes: end,
      });
    }

    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [dateKey, onSelectRange]);

  function beginDrag(resourceId, minute) {
    const next = {
      resourceId,
      startMinutes: minute,
      endMinutes: minute,
    };
    dragRef.current = next;
    setDragState(next);
  }

  function updateDrag(resourceId, minute) {
    if (!dragRef.current) return;
    if (dragRef.current.resourceId !== resourceId) return;

    const next = {
      ...dragRef.current,
      endMinutes: minute,
    };

    dragRef.current = next;
    setDragState(next);
  }

  function handleCellClick(resourceId, minute) {
    if (dragRef.current) return;
    onSelectRange?.({
      resourceId,
      dateKey,
      startMinutes: minute,
      endMinutes: minute + Math.max(15, Number(durationMinutes) || 30),
    });
  }

  return (
    <div className="wx-lane-calendar">
      <div className="wx-lane-header-row">
        <div className="wx-lane-time-header">Time</div>
        {resources.map((resource) => (
          <div key={resource.id} className="wx-lane-header">
            <div className="wx-lane-name">{resource.name}</div>
            <div className="wx-lane-meta">{resource.nextSlots?.length ? "Available" : "No open slots"}</div>
          </div>
        ))}
      </div>

      <div className="wx-lane-grid-wrap">
        <div className="wx-lane-time-col" style={{ height: rows.length * PX_PER_STEP }}>
          {rows.map((row) => (
            <div key={row.minute} className="wx-lane-time-row" style={{ height: PX_PER_STEP }}>
              {row.label}
            </div>
          ))}
        </div>

        <div className="wx-lane-columns">
          {resources.map((resource) => {
            const day = calendarByResource?.[resource.id]?.[dateKey] || {};
            const openIntervals = day.openIntervals || [];
            const bookings = day.bookings || [];

            return (
              <div key={resource.id} className="wx-lane-column" style={{ height: rows.length * PX_PER_STEP }}>
                {day.ruleWindows?.map((window, index) => {
                  const top = ((window.start - START_MINUTES) / STEP_MINUTES) * PX_PER_STEP;
                  const height = ((window.end - window.start) / STEP_MINUTES) * PX_PER_STEP;
                  return (
                    <div
                      key={`${resource.id}-rule-${index}`}
                      className="wx-lane-rule-window"
                      style={{ top, height }}
                    />
                  );
                })}

                {bookings.map((booking) => {
                  const top = ((booking.startMinutes - START_MINUTES) / STEP_MINUTES) * PX_PER_STEP;
                  const height = Math.max(
                    10,
                    ((booking.endMinutes - booking.startMinutes) / STEP_MINUTES) * PX_PER_STEP
                  );

                  return (
                    <div
                      key={booking.id}
                      className="wx-lane-booking"
                      style={{ top, height }}
                      title={`${booking.serviceLabel} · ${booking.customerName}`}
                    >
                      {booking.serviceLabel}
                    </div>
                  );
                })}

                <div className="wx-lane-cell-layer">
                  {rows.map((row) => {
                    const isAvailable = isMinuteWithinIntervals(openIntervals, row.minute);

                    const dragActive =
                      dragState &&
                      dragState.resourceId === resource.id &&
                      row.minute >= Math.min(dragState.startMinutes, dragState.endMinutes) &&
                      row.minute <= Math.max(dragState.startMinutes, dragState.endMinutes);

                    const selectedActive =
                      selectedResourceId === resource.id &&
                      Number.isFinite(selectedStartMinutes) &&
                      row.minute >= selectedStartMinutes &&
                      row.minute < selectedStartMinutes + Math.max(15, Number(durationMinutes) || 30);

                    return (
                      <button
                        key={`${resource.id}-${row.minute}`}
                        type="button"
                        className={[
                          "wx-lane-cell",
                          isAvailable ? "is-open" : "is-closed",
                          dragActive ? "is-drag" : "",
                          selectedActive ? "is-selected" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={{ height: PX_PER_STEP }}
                        onMouseDown={() => beginDrag(resource.id, row.minute)}
                        onMouseEnter={() => updateDrag(resource.id, row.minute)}
                        onClick={() => handleCellClick(resource.id, row.minute)}
                        aria-label={`${resource.name} ${timeFromMinutes(row.minute)}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="wx-lane-help">
        Drag across a barber lane to request a time range. We auto-snap to the first conflict-free slot.
      </p>
    </div>
  );
}

export default WanderExBookingLaneCalendar;
