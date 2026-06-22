import { useMemo } from "react";
import {
  addDays,
  fromDateKey,
  startOfWeek,
  buildWeeklyAvailabilityDays,
  buildUpcomingAppointments,
  buildMonthStats,
} from "@/features/booking/adapters/booking.adapter";

export function useAgendaCalendarValues({
  selectedDateKey,
  rules,
  exceptions,
  occupiedIntervalsByDate,
  slotDurationMinutes,
  bookingsByDate,
  slotsByDate,
}) {
  const agendaWeekAnchor = useMemo(() => {
    const selectedDate = selectedDateKey ? fromDateKey(selectedDateKey) : null;
    if (selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime())) return selectedDate;
    return new Date();
  }, [selectedDateKey]);

  const agendaWeekStart = useMemo(() => startOfWeek(agendaWeekAnchor), [agendaWeekAnchor]);

  const agendaWeekLabel = useMemo(() => {
    const weekEnd = addDays(agendaWeekStart, 6);
    const startLabel = agendaWeekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const endLabel = weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${startLabel} - ${endLabel}`;
  }, [agendaWeekStart]);

  const weeklyAvailabilityDays = useMemo(
    () =>
      buildWeeklyAvailabilityDays({
        agendaWeekStart,
        rules,
        exceptions,
        occupiedIntervalsByDate,
        slotDurationMinutes,
      }),
    [agendaWeekStart, rules, exceptions, occupiedIntervalsByDate, slotDurationMinutes]
  );

  const upcomingAppointments = useMemo(
    () => buildUpcomingAppointments(bookingsByDate),
    [bookingsByDate]
  );

  const monthStats = useMemo(
    () => buildMonthStats({ slotsByDate, bookingsByDate }),
    [slotsByDate, bookingsByDate]
  );

  return { agendaWeekLabel, weeklyAvailabilityDays, upcomingAppointments, monthStats };
}
