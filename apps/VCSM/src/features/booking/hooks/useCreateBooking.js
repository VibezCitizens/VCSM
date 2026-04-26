import { useCallback, useState } from "react";
import { createBooking } from "@booking";

export default function useCreateBooking() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const [lastCreated, setLastCreated] = useState(null);

  const createBookingFn = useCallback(async (payload) => {
    setIsPending(true);
    setError(null);

    try {
      const data = await createBooking(payload ?? {});
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
    createBooking: createBookingFn,
    isPending,
    error,
    lastCreated,
  };
}
