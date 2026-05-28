import { useMemo } from "react";
import { useTranslation } from "@i18n";
import { BookingCalendarAgendaPanel } from "@/features/profiles/kinds/vport/screens/booking/components/BookingCalendarAgendaPanel";
import { BookingCalendarDayPanel } from "@/features/profiles/kinds/vport/screens/booking/components/BookingCalendarDayPanel";
import { BookingCalendarMonthGrid } from "@/features/profiles/kinds/vport/screens/booking/components/BookingCalendarMonthGrid";
import { useVportBookingView } from "@/features/profiles/kinds/vport/screens/booking/hooks/useVportBookingView";
import VportPublicBookingFlow from "@/features/profiles/kinds/vport/screens/booking/view/VportPublicBookingFlow";
import {
  DURATION_OPTIONS,
  STATUS_LABELS,
} from "@/features/booking/model/bookingCalendar.model";
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
  if (!isOwner) return <VportPublicBookingFlow profile={profile} />;

  return <VportOwnerBookingView profile={profile} />;
}

function VportOwnerBookingView({ profile }) {
  const isOwner = true;
  const { t } = useTranslation();

  const weekdayLabels = useMemo(() => [
    t('vport.bookingView.weekdaySun'),
    t('vport.bookingView.weekdayMon'),
    t('vport.bookingView.weekdayTue'),
    t('vport.bookingView.weekdayWed'),
    t('vport.bookingView.weekdayThu'),
    t('vport.bookingView.weekdayFri'),
    t('vport.bookingView.weekdaySat'),
  ], [t]);

  const segmentLabels = useMemo(() => ({
    morning: t('vport.bookingView.segmentMorning'),
    afternoon: t('vport.bookingView.segmentAfternoon'),
    evening: t('vport.bookingView.segmentEvening'),
  }), [t]);

  const {
    viewerActorId,
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
    ownerFollowerMatches,
    ownerFollowersLoading,
    ownerFollowersError,
    selectedOwnerFollower,
    slotDurationMinutes,
    viewerCanBook,
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
    onSelectOwnerFollower,
    onClearOwnerFollower,
    onCreateAppointmentFromSelectedSlot,
    onConfirmSelectedAppointment,
    onCancelSelectedAppointment,
    onResetDay,
  } = useVportBookingView({ profile, isOwner });

  return (
    <section className="profiles-card profiles-booking-shell p-4 sm:p-5">
      <header className="profiles-booking-header">
        <div>
          <p className="profiles-booking-kicker">{t('vport.bookingView.kicker')}</p>
          <h3 className="profiles-booking-title">{t('vport.bookingView.title')}</h3>
          <p className="profiles-booking-subtitle">
            {t('vport.bookingView.subtitle', { username: profile?.username || 'barber' })}
          </p>
        </div>
      </header>

      <BookingError error={resources.error} />
      <BookingError error={availability.error} />
      <BookingError error={createBooking.error} />
      <BookingError error={manageAvailability.error} />

      <div className="profiles-booking-stats-grid">
        <article className="profiles-booking-stat-card">
          <p className="profiles-booking-stat-label">{t('vport.bookingView.openSlots')}</p>
          <p className="profiles-booking-stat-value">{monthStats.openSlots}</p>
        </article>

        <article className="profiles-booking-stat-card">
          <p className="profiles-booking-stat-label">{t('vport.bookingView.booked')}</p>
          <p className="profiles-booking-stat-value">{monthStats.bookedCount}</p>
        </article>

        <article className="profiles-booking-stat-card">
          <p className="profiles-booking-stat-label">{t('vport.bookingView.pending')}</p>
          <p className="profiles-booking-stat-value">{monthStats.pendingCount}</p>
        </article>
      </div>

      <div
        className="rounded-xl mb-3"
        style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "12px 14px 14px" }}
      >
        <div
          className="text-[9px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          {t('vport.bookingView.ownerTools')}
        </div>

        <div className="profiles-booking-duration-switch" role="radiogroup" aria-label="Appointment duration">
          <span className="profiles-booking-duration-label">{t('vport.bookingView.duration')}</span>
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

        <div className="profiles-booking-view-switch mt-2" role="tablist" aria-label="Calendar view mode">
          <button
            type="button"
            className={`profiles-booking-view-btn ${viewMode === "calendar" ? "is-active" : ""}`}
            onClick={() => onChangeViewMode("calendar")}
            role="tab"
            aria-selected={viewMode === "calendar"}
          >
            {t('vport.bookingView.viewCalendar')}
          </button>
          <button
            type="button"
            className={`profiles-booking-view-btn ${viewMode === "agenda" ? "is-active" : ""}`}
            onClick={() => onChangeViewMode("agenda")}
            role="tab"
            aria-selected={viewMode === "agenda"}
          >
            {t('vport.bookingView.viewAgenda')}
          </button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <BookingCalendarMonthGrid
          monthLabel={monthLabel}
          weekdayLabels={weekdayLabels}
          monthCells={monthCells}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onSelectDate={onSelectDate}
        />
      ) : null}

      {viewMode === "calendar" && hasSelectedAvailableDay ? (
        <BookingCalendarDayPanel
          isOwner={isOwner}
          viewerActorId={viewerActorId}
          viewerCanBook={viewerCanBook}
          canRequestSelectedSlot={canRequestSelectedSlot}
          showOwnerSlotActions={false}
          selectedDateLabel={selectedDateLabel}
          selectedSlot={selectedSlot}
          selectedSlotsBySegment={selectedSlotsBySegment}
          selectedAppointments={selectedAppointments}
          segmentLabels={segmentLabels}
          statusLabels={STATUS_LABELS}
          isSelectedSlotAvailable={isSelectedSlotAvailable}
          primaryActionLabel={isOwner ? "Add appointment from selected slot" : "Request selected slot"}
          ownerCustomerName={ownerCustomerName}
          ownerFollowerMatches={ownerFollowerMatches}
          ownerFollowersLoading={ownerFollowersLoading}
          ownerFollowersError={ownerFollowersError}
          selectedOwnerFollower={selectedOwnerFollower}
          onOwnerCustomerNameChange={onOwnerCustomerNameChange}
          onSelectOwnerFollower={onSelectOwnerFollower}
          onClearOwnerFollower={onClearOwnerFollower}
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
          segmentLabels={segmentLabels}
          statusLabels={STATUS_LABELS}
          isOwner={isOwner}
        />
      ) : null}
    </section>
  );
}
