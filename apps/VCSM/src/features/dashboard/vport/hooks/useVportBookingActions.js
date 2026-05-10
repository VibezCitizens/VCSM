import { useCallback, useState } from "react";
import { updateBookingStatusController } from "@/features/dashboard/vport/controller/updateVportBooking.controller";

export default function useVportBookingActions({ onSuccess, actorId = null } = {}) {
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

  const confirm  = useCallback((bookingId) => runAction(() => updateBookingStatusController({ bookingId, status: "confirmed", actorId })),  [runAction, actorId]);
  const cancel   = useCallback((bookingId) => runAction(() => updateBookingStatusController({ bookingId, status: "cancelled", actorId })),  [runAction, actorId]);
  const complete = useCallback((bookingId) => runAction(() => updateBookingStatusController({ bookingId, status: "completed", actorId })),  [runAction, actorId]);
  const noShow   = useCallback((bookingId) => runAction(() => updateBookingStatusController({ bookingId, status: "no_show",   actorId })),  [runAction, actorId]);

  return { working, error, confirm, cancel, complete, noShow };
}
