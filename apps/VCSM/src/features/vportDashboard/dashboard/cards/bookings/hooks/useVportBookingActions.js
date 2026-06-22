import { useCallback, useState } from "react";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { updateBookingStatusController } from "@/features/vportDashboard/dashboard/cards/bookings/controller/updateVportBooking.controller";

export default function useVportBookingActions({ onSuccess } = {}) {
  const { identity } = useIdentity();
  const callerActorId = identity?.actorId ?? null;

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

  const confirm  = useCallback((bookingId) => runAction(() => updateBookingStatusController({ bookingId, status: "confirmed",  callerActorId })), [runAction, callerActorId]);
  const cancel   = useCallback((bookingId) => runAction(() => updateBookingStatusController({ bookingId, status: "cancelled",  callerActorId })), [runAction, callerActorId]);
  const complete = useCallback((bookingId) => runAction(() => updateBookingStatusController({ bookingId, status: "completed",  callerActorId })), [runAction, callerActorId]);
  const noShow   = useCallback((bookingId) => runAction(() => updateBookingStatusController({ bookingId, status: "no_show",    callerActorId })), [runAction, callerActorId]);

  return { working, error, confirm, cancel, complete, noShow };
}
