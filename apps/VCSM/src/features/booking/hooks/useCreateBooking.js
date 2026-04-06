import { useCallback, useState } from "react";
import createBookingController from "@/features/booking/controller/createBooking.controller";

export default function useCreateBooking() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const [lastCreated, setLastCreated] = useState(null);

  const createBooking = useCallback(async (payload) => {
    setIsPending(true);
    setError(null);

    try {
      const data = await createBookingController(payload ?? {});
      setLastCreated(data ?? null);
      return { ok: true, data, error: null };
    } catch (e) {
      setError(e);
      return { ok: false, data: null, error: e };
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    createBooking,
    isPending,
    error,
    lastCreated,
  };
}
