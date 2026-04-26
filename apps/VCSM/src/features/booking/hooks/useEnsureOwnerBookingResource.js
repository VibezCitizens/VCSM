import { useCallback, useState } from "react";
import { ensureOwnerBookingResource } from "@booking";

export default function useEnsureOwnerBookingResource() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const ensure = useCallback(async (payload) => {
    setIsPending(true);
    setError(null);

    try {
      const data = await ensureOwnerBookingResource(payload ?? {});
      return { ok: true, data, error: null };
    } catch (e) {
      setError(e);
      return { ok: false, data: null, error: e };
    } finally {
      setIsPending(false);
    }
  }, []);

  return { isPending, error, ensure };
}
