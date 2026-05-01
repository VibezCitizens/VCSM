/**
 * Constructs a validated booking payload ready for the booking engine.
 *
 * Always computes endsAt from startsAt + durationMinutes so the engine's
 * endsAt-required guard is never triggered.
 */
export function buildBookingPayload({
  resourceId,
  serviceId = null,
  serviceLabel = null,
  durationMinutes,
  selectedDate,     // YYYY-MM-DD
  selectedTime,     // HH:mm
  requestActorId = null,
  customerName = null,
  customerNote = null,
} = {}) {
  if (!resourceId) {
    throw new Error("Booking is not yet available for this profile.");
  }

  if (!durationMinutes || !Number.isFinite(Number(durationMinutes)) || Number(durationMinutes) <= 0) {
    throw new Error("durationMinutes is required and must be a positive number.");
  }

  if (!selectedDate || typeof selectedDate !== "string") {
    throw new Error("selectedDate is required (YYYY-MM-DD).");
  }

  if (!selectedTime || typeof selectedTime !== "string") {
    throw new Error("selectedTime is required (HH:mm).");
  }

  const dateParts = selectedDate.split("-").map(Number);
  const timeParts = selectedTime.split(":").map(Number);

  if (dateParts.length < 3 || dateParts.some((n) => !Number.isFinite(n))) {
    throw new Error(`Invalid date format: "${selectedDate}". Expected YYYY-MM-DD.`);
  }

  if (timeParts.length < 2 || timeParts.some((n) => !Number.isFinite(n))) {
    throw new Error(`Invalid time format: "${selectedTime}". Expected HH:mm.`);
  }

  const [year, month, day] = dateParts;
  const [hours, minutes] = timeParts;

  const slotDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (Number.isNaN(slotDate.getTime())) {
    throw new Error("Could not construct a valid start time from the provided date and time.");
  }

  const dur = Number(durationMinutes);
  const startsAt = slotDate.toISOString();
  const endsAt = new Date(slotDate.getTime() + dur * 60 * 1000).toISOString();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  return {
    resourceId,
    serviceId: serviceId || null,
    startsAt,
    endsAt,
    timezone,
    durationMinutes: dur,
    serviceLabelSnapshot: serviceLabel || "General appointment",
    status: "pending",
    source: "public",
    requestActorId: requestActorId || null,
    customerActorId: requestActorId || null,
    customerName: customerName || null,
    customerNote: customerNote || null,
  };
}
