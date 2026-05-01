import { useCallback, useEffect, useMemo, useState } from "react";
import { timeFromMinutes } from "@/features/wanderex/model/wanderexPublic.model";
import {
  buildBookableStartTimes,
  findFirstBookableStartInRange,
} from "@/features/wanderex/model/wanderexAvailability.model";
import {
  STEP_KEYS,
  clampStep,
  createDefaultDateOrder,
} from "@/features/wanderex/hooks/useWanderExBookingFlow.helpers";
import { useWanderExBookingSubmit } from "@/features/wanderex/hooks/useWanderExBookingSubmit";

export function useWanderExBookingFlow({
  slug,
  profile,
  services,
  team,
  availabilityCalendarByResource,
  initialServiceId,
  initialBarberActorId,
  onBookingStarted,
  onBookingCompleted,
}) {
  const serviceOptions = useMemo(
    () => (Array.isArray(services) ? services.filter((service) => service.isBookable !== false) : []),
    [services]
  );

  const teamOptions = useMemo(() => (Array.isArray(team) ? team : []), [team]);

  const teamByActorId = useMemo(() => {
    return teamOptions.reduce((acc, member) => {
      if (member.actorId) acc[member.actorId] = member;
      if (member.id) acc[member.id] = member;
      return acc;
    }, {});
  }, [teamOptions]);

  const [stepIndex, setStepIndex] = useState(0);
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId || null);
  const [selectedBarberActorId, setSelectedBarberActorId] = useState(initialBarberActorId || null);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [selectedStartMinutes, setSelectedStartMinutes] = useState(null);
  const [selectionError, setSelectionError] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  const selectedService = useMemo(() => {
    return serviceOptions.find((service) => service.id === selectedServiceId) || null;
  }, [selectedServiceId, serviceOptions]);

  const durationMinutes = Number(selectedService?.durationMinutes) || 30;

  const selectedBarber = useMemo(() => {
    if (!selectedBarberActorId) return null;
    return teamByActorId[selectedBarberActorId] || null;
  }, [selectedBarberActorId, teamByActorId]);

  useEffect(() => {
    if (!selectedServiceId && serviceOptions.length > 0) {
      setSelectedServiceId(serviceOptions[0].id);
    }
  }, [selectedServiceId, serviceOptions]);

  useEffect(() => {
    if (!initialBarberActorId) return;
    if (!selectedBarberActorId && teamByActorId[initialBarberActorId]) {
      setSelectedBarberActorId(initialBarberActorId);
    }
  }, [initialBarberActorId, selectedBarberActorId, teamByActorId]);

  const activeResources = useMemo(() => {
    if (selectedBarber?.id) return [selectedBarber];
    return teamOptions;
  }, [selectedBarber, teamOptions]);

  const dateStrip = useMemo(() => createDefaultDateOrder(14), []);

  const hasBookableSlotsForResourceDate = useCallback(
    (resourceId, dateKey) => {
      const calendar = availabilityCalendarByResource?.[resourceId]?.[dateKey];
      if (!calendar) return false;
      const starts = buildBookableStartTimes({
        openIntervals: calendar.openIntervals || [],
        durationMinutes,
        stepMinutes: 15,
      });
      return starts.some((start) => {
        const date = new Date();
        const [y, mo, d] = dateKey.split("-").map(Number);
        date.setFullYear(y, mo - 1, d);
        date.setHours(Math.floor(start / 60), start % 60, 0, 0);
        return date.getTime() >= Date.now();
      });
    },
    [availabilityCalendarByResource, durationMinutes]
  );

  const isDateBookable = useCallback(
    (dateKey) => activeResources.some((resource) => hasBookableSlotsForResourceDate(resource.id, dateKey)),
    [activeResources, hasBookableSlotsForResourceDate]
  );

  useEffect(() => {
    if (selectedDateKey) return;
    const first = dateStrip.find((day) => isDateBookable(day.key));
    if (first) setSelectedDateKey(first.key);
  }, [dateStrip, isDateBookable, selectedDateKey]);

  const canProceed = useMemo(() => {
    const step = STEP_KEYS[stepIndex];
    if (step === "service") return Boolean(selectedServiceId);
    if (step === "barber") return true;
    if (step === "time") return Boolean(selectedDateKey) && Number.isFinite(selectedStartMinutes);
    if (step === "details") {
      const hasName = String(customerName || "").trim().length > 0;
      const hasPhoneOrEmail =
        String(customerPhone || "").trim().length > 0 || String(customerEmail || "").trim().length > 0;
      return hasName && hasPhoneOrEmail;
    }
    return true;
  }, [
    stepIndex,
    selectedServiceId,
    selectedDateKey,
    selectedStartMinutes,
    customerName,
    customerPhone,
    customerEmail,
  ]);

  const goNext = useCallback(() => {
    if (!canProceed) return;
    if (stepIndex === 1 && typeof onBookingStarted === "function") {
      onBookingStarted({
        slug,
        serviceId: selectedServiceId,
        barberActorId: selectedBarberActorId,
      });
    }
    setStepIndex((prev) => clampStep(prev + 1));
  }, [canProceed, onBookingStarted, selectedBarberActorId, selectedServiceId, slug, stepIndex]);

  const goBack = useCallback(() => {
    setStepIndex((prev) => clampStep(prev - 1));
  }, []);

  const setService = useCallback((serviceId) => {
    setSelectedServiceId(serviceId || null);
    setSelectedStartMinutes(null);
    setSelectionError("");
  }, []);

  const setBarber = useCallback((barberActorId) => {
    setSelectedBarberActorId(barberActorId || null);
    setSelectedResourceId(null);
    setSelectedStartMinutes(null);
    setSelectionError("");
  }, []);

  const chooseDate = useCallback((dateKey) => {
    setSelectedDateKey(dateKey);
    setSelectedStartMinutes(null);
    setSelectionError("");
  }, []);

  const selectLaneRange = useCallback(
    ({ resourceId, dateKey, startMinutes, endMinutes }) => {
      const calendar = availabilityCalendarByResource?.[resourceId]?.[dateKey];
      const openIntervals = calendar?.openIntervals || [];

      const pickedStart = findFirstBookableStartInRange({
        openIntervals,
        rangeStartMinutes: startMinutes,
        rangeEndMinutes: endMinutes,
        durationMinutes,
        stepMinutes: 15,
      });

      if (!Number.isFinite(pickedStart)) {
        setSelectionError(
          "That time range has a conflict. Try another slot or drag a wider range."
        );
        return false;
      }

      const member = teamOptions.find((item) => item.id === resourceId) || null;

      setSelectedDateKey(dateKey);
      setSelectedStartMinutes(pickedStart);
      setSelectedResourceId(resourceId);
      setSelectionError("");

      if (member?.actorId) {
        setSelectedBarberActorId(member.actorId || member.id);
      }

      return true;
    },
    [availabilityCalendarByResource, durationMinutes, teamOptions]
  );

  const selectedTimeLabel = useMemo(() => {
    if (!selectedDateKey || !Number.isFinite(selectedStartMinutes)) return "";
    const start = timeFromMinutes(selectedStartMinutes);
    const end = timeFromMinutes(selectedStartMinutes + durationMinutes);
    return `${selectedDateKey} ${start} - ${end}`;
  }, [selectedDateKey, selectedStartMinutes, durationMinutes]);

  const { submitError, submitting, submitted, submitLeadRequest } = useWanderExBookingSubmit({
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
  });

  return {
    steps: STEP_KEYS,
    stepIndex,
    stepKey: STEP_KEYS[stepIndex],
    setStepIndex,
    canProceed,
    goNext,
    goBack,

    serviceOptions,
    selectedService,
    selectedServiceId,
    setService,

    teamOptions,
    selectedBarber,
    selectedBarberActorId,
    setBarber,

    dateStrip,
    selectedDateKey,
    chooseDate,
    isDateBookable,

    availabilityCalendarByResource,
    activeResources,
    selectedResourceId,
    selectedStartMinutes,
    selectedTimeLabel,
    durationMinutes,
    selectionError,
    selectLaneRange,

    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerEmail,
    setCustomerEmail,
    customerNote,
    setCustomerNote,

    submitLeadRequest,
    submitError,
    submitting,
    submitted,
  };
}

export default useWanderExBookingFlow;
