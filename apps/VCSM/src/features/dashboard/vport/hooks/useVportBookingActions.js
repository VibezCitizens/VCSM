import { useCallback, useState } from "react";
import { updateBookingStatusController } from "@/features/dashboard/vport/controller/updateVportBooking.controller";

export default function useVportBookingActions({ onSuccess } = {}) {
  const [working, setWorking] = useState(false);
  const [error, setError]     = useState(null);

  const runAction = useCallback(async (fn) => {
    setWorking(true);
    setError(null);
    try {
      await fn();
      onSuccess?.();
    } catch (e) {
      setError(e?.message || "Action failed.");
    } finally {
      setWorking(false);
    }
  }, [onSuccess]);

  const confirm  = useCallback((bookingId) => runAction(() => updateBookingStatusController({ bookingId, status: "confirmed" })),  [runAction]);
  const cancel   = useCallback((bookingId) => runAction(() => updateBookingStatusController({ bookingId, status: "cancelled" })),  [runAction]);
  const complete = useCallback((bookingId) => runAction(() => updateBookingStatusController({ bookingId, status: "completed" })),  [runAction]);
  const noShow   = useCallback((bookingId) => runAction(() => updateBookingStatusController({ bookingId, status: "no_show" })),    [runAction]);

  return { working, error, confirm, cancel, complete, noShow };
}
