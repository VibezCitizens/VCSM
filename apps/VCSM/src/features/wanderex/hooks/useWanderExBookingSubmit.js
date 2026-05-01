import { useCallback, useState } from "react";
import { useWandersBusinessCardOps } from "@/features/wanders/core/adapters/wanders.adapter";
import { buildBookingLeadMessage } from "@/features/wanderex/model/wanderexAvailability.model";

export function useWanderExBookingSubmit({
  slug,
  profile,
  selectedService,
  selectedBarber,
  selectedResourceId,
  selectedDateKey,
  selectedStartMinutes,
  durationMinutes,
  teamOptions,
  customerName,
  customerPhone,
  customerEmail,
  customerNote,
  onBookingCompleted,
}) {
  const { submitLead } = useWandersBusinessCardOps();
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitLeadRequest = useCallback(async () => {
    if (submitting) return false;

    const cleanName = String(customerName || "").trim();
    const cleanPhone = String(customerPhone || "").trim();
    const cleanEmail = String(customerEmail || "").trim();

    if (!cleanName || (!cleanPhone && !cleanEmail)) {
      setSubmitError("Name and a phone/email are required.");
      return false;
    }

    if (!selectedDateKey || !Number.isFinite(selectedStartMinutes)) {
      setSubmitError("Please choose a valid time slot.");
      return false;
    }

    const barber =
      (selectedResourceId && teamOptions.find((item) => item.id === selectedResourceId)) ||
      selectedBarber ||
      null;

    const message = buildBookingLeadMessage({
      profile,
      service: selectedService,
      barber,
      dateKey: selectedDateKey,
      startMinutes: selectedStartMinutes,
      durationMinutes,
      customerName: cleanName,
      customerPhone: cleanPhone,
      customerEmail: cleanEmail,
      note: String(customerNote || "").trim(),
    });

    setSubmitting(true);
    setSubmitError("");

    try {
      await submitLead({
        slug,
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        message,
        source: "wanderex_booking_request",
        userAgent:
          typeof navigator !== "undefined" && navigator.userAgent
            ? navigator.userAgent
            : null,
      });

      setSubmitted(true);
      if (typeof onBookingCompleted === "function") {
        onBookingCompleted({
          slug,
          serviceId: selectedService?.id || null,
          barberActorId: barber?.actorId || null,
          dateKey: selectedDateKey,
          startMinutes: selectedStartMinutes,
        });
      }
      return true;
    } catch (error) {
      setSubmitError(error?.message || "Could not submit booking request.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [
    customerEmail,
    customerName,
    customerNote,
    customerPhone,
    durationMinutes,
    onBookingCompleted,
    profile,
    selectedBarber,
    selectedDateKey,
    selectedResourceId,
    selectedService,
    selectedStartMinutes,
    slug,
    submitting,
    teamOptions,
    submitLead,
  ]);

  return { submitError, submitting, submitted, submitLeadRequest };
}
