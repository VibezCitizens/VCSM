import { BookingCalendarAgendaPanel } from "@/features/profiles/kinds/vport/screens/booking/components/BookingCalendarAgendaPanel";
import { BookingCalendarDayPanel } from "@/features/profiles/kinds/vport/screens/booking/components/BookingCalendarDayPanel";
import { BookingCalendarMonthGrid } from "@/features/profiles/kinds/vport/screens/booking/components/BookingCalendarMonthGrid";
import { useVportBookingView } from "@/features/profiles/kinds/vport/screens/booking/hooks/useVportBookingView";
import {
  DURATION_OPTIONS,
  SEGMENT_LABELS,
  STATUS_LABELS,
  VISITOR_SLOT_DURATION_MINUTES,
  WEEKDAY_LABELS,
} from "@/features/profiles/kinds/vport/screens/booking/model/bookingCalendar.model";
import "@/features/profiles/styles/profiles-booking-modern.css";
import "@/features/profiles/styles/profiles-booking-daypanel-modern.css";

function BookingError({ error }) {
  if (!error) return null;
  return (
    <div className="profiles-error mt-3 rounded-2xl p-3 text-sm">
      {String(error?.message ?? error)}
    </div>
  );
}

export default function VportBookingView({ profile, isOwner = false }) {
  const {
    resources,
    availability,
    createBooking,
    manageAvailability,
    monthLabel,
    monthCells,
    monthStats,
    viewMode,
    selectedDateLabel,
    selectedSlot,
    selectedSlotsBySegment,
    selectedAppointments,
    ownerCustomerName,
    slotDurationMinutes,
    canRequestSelectedSlot,
    isSelectedSlotAvailable,
    hasSelectedAvailableDay,
    upcomingAppointments,
    weeklyAvailabilityDays,
    agendaWeekLabel,
    confirmingAppointmentId,
    cancellingAppointmentId,
    onPrevMonth,
    onNextMonth,
    onSelectDate,
    onSelectSlot,
    onChangeViewMode,
    onChangeDuration,
    onOwnerCustomerNameChange,
    onCreateAppointmentFromSelectedSlot,
    onConfirmSelectedAppointment,
    onCancelSelectedAppointment,
    onResetDay,
  } = useVportBookingView({ profile, isOwner });

  return (
    <section className="profiles-card profiles-booking-shell p-4 sm:p-5">
      <header className="profiles-booking-header">
        <div>
          <p className="profiles-booking-kicker">Appointments & Availability</p>
          <h3 className="profiles-booking-title">Calendar</h3>
          <p className="profiles-booking-subtitle">
            Booking availability for @{profile?.username || "barber"}.
          </p>
        </div>
      </header>

      <BookingError error={resources.error} />
      <BookingError error={availability.error} />
      <BookingError error={createBooking.error} />
      <BookingError error={manageAvailability.error} />

      <div className="profiles-booking-stats-grid">
        <article className="profiles-booking-stat-card">
          <p className="profiles-booking-stat-label">Open Slots</p>
          <p className="profiles-booking-stat-value">{monthStats.openSlots}</p>
        </article>

        <article className="profiles-booking-stat-card">
          <p className="profiles-booking-stat-label">Booked</p>
          <p className="profiles-booking-stat-value">{monthStats.bookedCount}</p>
        </article>

        <article className="profiles-booking-stat-card">
          <p className="profiles-booking-stat-label">Pending</p>
          <p className="profiles-booking-stat-value">{monthStats.pendingCount}</p>
        </article>
      </div>

      {isOwner ? (
        <div className="profiles-booking-duration-switch" role="radiogroup" aria-label="Appointment duration">
          <span className="profiles-booking-duration-label">Duration</span>
          {DURATION_OPTIONS.map((durationOption) => {
            const isActive = slotDurationMinutes === durationOption;
            return (
              <button
                key={durationOption}
                type="button"
                className={`profiles-booking-duration-btn ${isActive ? "is-active" : ""}`}
                onClick={() => onChangeDuration(durationOption)}
                role="radio"
                aria-checked={isActive}
              >
                {durationOption} min
              </button>
            );
          })}
        </div>
      ) : (
        <div className="profiles-booking-duration-switch" aria-label="Appointment duration">
          <span className="profiles-booking-duration-label">Duration</span>
          <button type="button" className="profiles-booking-duration-btn is-active" disabled>
            {VISITOR_SLOT_DURATION_MINUTES} min
          </button>
        </div>
      )}

      <div className="profiles-booking-view-switch" role="tablist" aria-label="Calendar view mode">
        <button
          type="button"
          className={`profiles-booking-view-btn ${viewMode === "calendar" ? "is-active" : ""}`}
          onClick={() => onChangeViewMode("calendar")}
          role="tab"
          aria-selected={viewMode === "calendar"}
        >
          Calendar
        </button>

        {isOwner ? (
          <button
            type="button"
            className={`profiles-booking-view-btn ${viewMode === "agenda" ? "is-active" : ""}`}
            onClick={() => onChangeViewMode("agenda")}
            role="tab"
            aria-selected={viewMode === "agenda"}
          >
            Agenda
          </button>
        ) : null}
      </div>

      {viewMode === "calendar" ? (
        <BookingCalendarMonthGrid
          monthLabel={monthLabel}
          weekdayLabels={WEEKDAY_LABELS}
          monthCells={monthCells}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onSelectDate={onSelectDate}
        />
      ) : null}

      {viewMode === "calendar" && hasSelectedAvailableDay ? (
        <BookingCalendarDayPanel
          isOwner={isOwner}
          canRequestSelectedSlot={canRequestSelectedSlot}
          showOwnerSlotActions={false}
          selectedDateLabel={selectedDateLabel}
          selectedSlot={selectedSlot}
          selectedSlotsBySegment={selectedSlotsBySegment}
          selectedAppointments={selectedAppointments}
          segmentLabels={SEGMENT_LABELS}
          statusLabels={STATUS_LABELS}
          isSelectedSlotAvailable={isSelectedSlotAvailable}
          primaryActionLabel={isOwner ? "Add appointment from selected slot" : "Request selected slot"}
          ownerCustomerName={ownerCustomerName}
          onOwnerCustomerNameChange={onOwnerCustomerNameChange}
          onSelectSlot={onSelectSlot}
          onCreateAppointmentFromSelectedSlot={onCreateAppointmentFromSelectedSlot}
          onToggleAvailabilityForSelectedSlot={() => {}}
          onConfirmAppointment={onConfirmSelectedAppointment}
          confirmingAppointmentId={confirmingAppointmentId}
          onCancelAppointment={onCancelSelectedAppointment}
          cancellingAppointmentId={cancellingAppointmentId}
          onResetDay={onResetDay}
        />
      ) : null}

      {isOwner && viewMode === "agenda" ? (
        <BookingCalendarAgendaPanel
          upcomingAppointments={upcomingAppointments}
          weeklyAvailabilityDays={weeklyAvailabilityDays}
          weekLabel={agendaWeekLabel}
          segmentLabels={SEGMENT_LABELS}
          statusLabels={STATUS_LABELS}
          isOwner={isOwner}
        />
      ) : null}
    </section>
  );
}
