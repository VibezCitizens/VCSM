import { useCallback, useState } from "react";
import cancelBookingController from "@/features/booking/controller/cancelBooking.controller";
import confirmBookingController from "@/features/booking/controller/confirmBooking.controller";
import setResourceSlotDurationController from "@/features/booking/controller/setResourceSlotDuration.controller";
import setAvailabilityExceptionController from "@/features/booking/controller/setAvailabilityException.controller";
import setAvailabilityRuleController from "@/features/booking/controller/setAvailabilityRule.controller";

export default function useManageAvailability() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const setAvailabilityRule = useCallback(async (payload) => {
    setIsPending(true);
    setError(null);

    try {
      const data = await setAvailabilityRuleController(payload ?? {});
      return { ok: true, data, error: null };
    } catch (e) {
      setError(e);
      return { ok: false, data: null, error: e };
    } finally {
      setIsPending(false);
    }
  }, []);

  const setAvailabilityException = useCallback(async (payload) => {
    setIsPending(true);
    setError(null);

    try {
      const data = await setAvailabilityExceptionController(payload ?? {});
      return { ok: true, data, error: null };
    } catch (e) {
      setError(e);
      return { ok: false, data: null, error: e };
    } finally {
      setIsPending(false);
    }
  }, []);

  const cancelBooking = useCallback(async (payload) => {
    setIsPending(true);
    setError(null);

    try {
      const data = await cancelBookingController(payload ?? {});
      return { ok: true, data, error: null };
    } catch (e) {
      setError(e);
      return { ok: false, data: null, error: e };
    } finally {
      setIsPending(false);
    }
  }, []);

  const confirmBooking = useCallback(async (payload) => {
    setIsPending(true);
    setError(null);

    try {
      const data = await confirmBookingController(payload ?? {});
      return { ok: true, data, error: null };
    } catch (e) {
      setError(e);
      return { ok: false, data: null, error: e };
    } finally {
      setIsPending(false);
    }
  }, []);

  const setResourceSlotDuration = useCallback(async (payload) => {
    setIsPending(true);
    setError(null);

    try {
      const data = await setResourceSlotDurationController(payload ?? {});
      return { ok: true, data, error: null };
    } catch (e) {
      setError(e);
      return { ok: false, data: null, error: e };
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    isPending,
    error,
    setAvailabilityRule,
    setAvailabilityException,
    cancelBooking,
    confirmBooking,
    setResourceSlotDuration,
  };
}
