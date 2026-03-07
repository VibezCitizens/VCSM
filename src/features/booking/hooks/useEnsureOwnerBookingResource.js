import { useCallback, useState } from "react";
import ensureOwnerBookingResourceController from "@/features/booking/controller/ensureOwnerBookingResource.controller";

export default function useEnsureOwnerBookingResource() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const ensure = useCallback(async (payload) => {
    setIsPending(true);
    setError(null);

    try {
      const data = await ensureOwnerBookingResourceController(payload ?? {});
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
    ensure,
  };
}
