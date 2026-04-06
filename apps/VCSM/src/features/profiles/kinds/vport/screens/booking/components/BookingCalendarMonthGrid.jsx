export function BookingCalendarMonthGrid({
  monthLabel,
  weekdayLabels,
  monthCells,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}) {
  return (
    <section className="profiles-booking-month-shell" aria-label="Appointment calendar">
      <div className="profiles-booking-month-head">
        <button
          type="button"
          className="profiles-booking-month-nav"
          onClick={onPrevMonth}
          aria-label="Previous month"
        >
          <span aria-hidden="true">‹</span>
        </button>

        <h4 className="profiles-booking-month-title">{monthLabel}</h4>

        <button
          type="button"
          className="profiles-booking-month-nav"
          onClick={onNextMonth}
          aria-label="Next month"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="profiles-booking-weekdays">
        {weekdayLabels.map((label) => (
          <span key={label} className="profiles-booking-weekday">
            {label}
          </span>
        ))}
      </div>

      <div className="profiles-booking-grid">
        {monthCells.map((cell) =>
          cell.isPlaceholder ? (
            <div key={cell.key} className="profiles-booking-day-placeholder" aria-hidden="true" />
          ) : (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => onSelectDate(cell.dateKey)}
              disabled={cell.isDisabled}
              className={[
                "profiles-booking-day",
                cell.isSelected ? "is-selected" : "",
                cell.isToday ? "is-today" : "",
                cell.isDisabled ? "is-disabled" : "",
                cell.appointmentCount > 0 ? "has-appointments" : "",
                `availability-${cell.availabilityLevel}`,
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={cell.ariaLabel}
              aria-current={cell.isSelected ? "date" : undefined}
              aria-disabled={cell.isDisabled ? "true" : undefined}
            >
              <span className="profiles-booking-day-number">{cell.dayNumber}</span>
              <span className="profiles-booking-day-metrics">
                {cell.isPast
                  ? "Past"
                  : cell.isClosed
                    ? "Closed"
                    : cell.appointmentCount > 0
                      ? `${cell.appointmentCount} appt`
                      : "Open"}
              </span>

              <span className="profiles-booking-dot-row" aria-hidden="true">
                {!cell.isClosed && <span className="profiles-booking-dot is-open" />}
                {cell.confirmedCount > 0 && <span className="profiles-booking-dot is-confirmed" />}
                {cell.pendingCount > 0 && <span className="profiles-booking-dot is-pending" />}
              </span>
            </button>
          )
        )}
      </div>
    </section>
  );
}
