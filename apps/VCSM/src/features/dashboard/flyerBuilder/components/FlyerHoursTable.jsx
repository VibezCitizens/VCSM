export function FlyerHoursTable({ days, hoursValue, input, hoursRow, setHoursDay }) {
  return (
    <div
      style={{
        borderRadius: 15,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.03)",
        padding: 10,
        display: "grid",
        gap: 10,
      }}
    >
      {days.map((d) => {
        const day = hoursValue?.[d.key] || {};
        const closed = !!day.closed;
        const open = typeof day.open === "string" ? day.open : "";
        const close = typeof day.close === "string" ? day.close : "";

        return (
          <div key={d.key} className="flyer-hours-row" style={hoursRow}>
            <div
              className="flyer-hours-day"
              style={{ fontSize: 12, fontWeight: 950, opacity: 0.85 }}
            >
              {d.label}
            </div>

            <input
              className="flyer-hours-open"
              type="time"
              style={{ ...input, padding: "8px 10px", fontWeight: 900 }}
              value={open}
              disabled={closed}
              onChange={(e) => setHoursDay(d.key, { open: e.target.value })}
            />

            <input
              className="flyer-hours-close"
              type="time"
              style={{ ...input, padding: "8px 10px", fontWeight: 900 }}
              value={close}
              disabled={closed}
              onChange={(e) => setHoursDay(d.key, { close: e.target.value })}
            />

            <label
              className="flyer-hours-closed"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 12,
                fontWeight: 900,
                opacity: 0.9,
                cursor: "pointer",
                userSelect: "none",
                justifyContent: "flex-end",
                minHeight: 36,
              }}
            >
              <input
                type="checkbox"
                checked={closed}
                onChange={(e) => {
                  const nextClosed = e.target.checked;
                  setHoursDay(d.key, {
                    closed: nextClosed,
                    ...(nextClosed ? { open: "", close: "" } : {}),
                  });
                }}
                style={{ width: 18, height: 18 }}
              />
              Closed
            </label>
          </div>
        );
      })}
    </div>
  );
}
