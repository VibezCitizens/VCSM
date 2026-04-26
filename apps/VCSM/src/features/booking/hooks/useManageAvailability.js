import { useCallback, useState } from "react";
import {
  cancelBooking,
  confirmBooking,
  completeBooking,
  markNoShow,
  setResourceSlotDuration,
  setAvailabilityException,
  setAvailabilityRule,
} from "@booking";

export default function useManageAvailability() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const runMutation = useCallback(async (fn, payload) => {
    setIsPending(true);
    setError(null);
    try {
      const data = await fn(payload ?? {});
      return { ok: true, data, error: null };
    } catch (e) {
      setError(e);
      return { ok: false, data: null, error: e };
    } finally {
      setIsPending(false);
    }
  }, []);

  const setAvailabilityRuleFn     = useCallback((p) => runMutation(setAvailabilityRule, p),     [runMutation]);
  const setAvailabilityExceptionFn= useCallback((p) => runMutation(setAvailabilityException, p),[runMutation]);
  const cancelBookingFn           = useCallback((p) => runMutation(cancelBooking, p),            [runMutation]);
  const confirmBookingFn          = useCallback((p) => runMutation(confirmBooking, p),           [runMutation]);
  const completeBookingFn         = useCallback((p) => runMutation(completeBooking, p),          [runMutation]);
  const markNoShowFn              = useCallback((p) => runMutation(markNoShow, p),               [runMutation]);
  const setResourceSlotDurationFn = useCallback((p) => runMutation(setResourceSlotDuration, p), [runMutation]);

  return {
    isPending,
    error,
    setAvailabilityRule:      setAvailabilityRuleFn,
    setAvailabilityException:  setAvailabilityExceptionFn,
    cancelBooking:            cancelBookingFn,
    confirmBooking:           confirmBookingFn,
    completeBooking:          completeBookingFn,
    markNoShow:               markNoShowFn,
    setResourceSlotDuration:  setResourceSlotDurationFn,
  };
}
