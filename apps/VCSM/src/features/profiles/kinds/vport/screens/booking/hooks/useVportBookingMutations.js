import { useCallback, useState } from "react";

import { fromDateKey } from "@/features/profiles/kinds/vport/screens/booking/model/bookingCalendarDate.model";

export function useVportBookingMutations({
  isOwner,
  viewerActorId,
  viewerIdentityKind,
  resourceId,
  locationId = null,
  selectedSlot,
  selectedDateKey,
  selectedSlots,
  slotDurationMinutes,
  ownerCustomerName,
  ownerCustomerActorId,
  setOwnerCustomerName,
  setOwnerCustomerActorId,
  createBooking,
  manageAvailability,
  availability,
  setOptimisticCancelledIds,
  setOptimisticConfirmedIds,
}) {
  const [confirmingAppointmentId, setConfirmingAppointmentId] = useState(null);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState(null);

  const onCreateAppointmentFromSelectedSlot = useCallback(async () => {
    if (!resourceId && !locationId) return;
    if (!selectedSlot || !selectedDateKey) return;
    if (!selectedSlots.includes(selectedSlot)) return;
    if (isOwner && !viewerActorId) return;
    if (!isOwner && viewerIdentityKind !== "user") return;

    const startsAtDate = fromDateKey(selectedDateKey);
    const [hours = "0", minutes = "0"] = String(selectedSlot).split(":");
    startsAtDate.setHours(Number(hours), Number(minutes), 0, 0);
    if (startsAtDate.getTime() <= Date.now()) return;
    const endsAtDate = new Date(startsAtDate.getTime() + slotDurationMinutes * 60 * 1000);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    const basePayload = {
      resourceId: resourceId ?? undefined,
      locationId: locationId ?? undefined,
      startsAt: startsAtDate.toISOString(),
      endsAt: endsAtDate.toISOString(),
      timezone,
      durationMinutes: slotDurationMinutes,
    };

    const payload = isOwner
      ? {
        ...basePayload,
        requestActorId: viewerActorId,
        customerActorId: ownerCustomerActorId ?? null,
        source: "owner",
        status: "confirmed",
        serviceLabelSnapshot: "Owner scheduled appointment",
        customerName: String(ownerCustomerName || "").trim() || null,
        customerNote: null,
      }
      : {
        ...basePayload,
        requestActorId: viewerActorId ?? null,
        customerActorId: viewerActorId ?? null,
        source: "public",
        status: "pending",
        serviceLabelSnapshot: "Requested appointment",
        customerName: null,
        customerNote: null,
      };

    const result = await createBooking.createBooking(payload);
    if (!result?.ok) return;
    if (isOwner) {
      setOwnerCustomerName("");
      setOwnerCustomerActorId(null);
    }
    await availability.refresh();
  }, [
    resourceId,
    locationId,
    selectedSlot,
    selectedDateKey,
    selectedSlots,
    isOwner,
    viewerActorId,
    viewerIdentityKind,
    slotDurationMinutes,
    ownerCustomerName,
    ownerCustomerActorId,
    setOwnerCustomerName,
    setOwnerCustomerActorId,
    createBooking,
    availability,
  ]);

  const onCancelSelectedAppointment = useCallback(
    async (bookingId) => {
      if (!bookingId || !viewerActorId) return;

      setOptimisticCancelledIds?.((prev) => [...prev, bookingId]);
      setCancellingAppointmentId(bookingId);
      try {
        const result = await manageAvailability.cancelBooking({
          bookingId,
          requestActorId: viewerActorId,
          cancelNote: isOwner
            ? "Cancelled by owner from profile booking panel."
            : "Cancelled by customer from profile booking panel.",
        });
        if (result?.ok) {
          await availability.refresh();
          setOptimisticCancelledIds?.([]);
        } else {
          setOptimisticCancelledIds?.((prev) => prev.filter((id) => id !== bookingId));
        }
      } catch {
        setOptimisticCancelledIds?.((prev) => prev.filter((id) => id !== bookingId));
      } finally {
        setCancellingAppointmentId(null);
      }
    },
    [isOwner, viewerActorId, manageAvailability, availability, setOptimisticCancelledIds]
  );

  const onConfirmSelectedAppointment = useCallback(
    async (bookingId) => {
      if (!isOwner || !bookingId || !viewerActorId) return;

      setOptimisticConfirmedIds?.((prev) => [...prev, bookingId]);
      setConfirmingAppointmentId(bookingId);
      try {
        const result = await manageAvailability.confirmBooking({
          bookingId,
          requestActorId: viewerActorId,
          internalNote: "Confirmed by owner from profile booking panel.",
        });
        if (result?.ok) {
          await availability.refresh();
          setOptimisticConfirmedIds?.([]);
        } else {
          setOptimisticConfirmedIds?.((prev) => prev.filter((id) => id !== bookingId));
        }
      } catch {
        setOptimisticConfirmedIds?.((prev) => prev.filter((id) => id !== bookingId));
      } finally {
        setConfirmingAppointmentId(null);
      }
    },
    [isOwner, viewerActorId, manageAvailability, availability, setOptimisticConfirmedIds]
  );

  return {
    confirmingAppointmentId,
    cancellingAppointmentId,
    onCreateAppointmentFromSelectedSlot,
    onCancelSelectedAppointment,
    onConfirmSelectedAppointment,
  };
}
