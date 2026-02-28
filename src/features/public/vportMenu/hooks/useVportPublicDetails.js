import { useCallback, useEffect, useState } from "react";
import getVportPublicDetailsController from "@/features/public/vportMenu/controller/getVportPublicDetails.controller";

const EMPTY = Object.freeze({
  ok: true,
  actorId: null,
  error: null,
  details: null,
});

export function useVportPublicDetails({ actorId } = {}) {
  const [result, setResult] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!actorId) return;
    setLoading(true);
    setError(null);

    try {
      const next = await getVportPublicDetailsController({ actorId });
      setResult(next || EMPTY);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [actorId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    result,
    details: result?.details ?? null,
    loading,
    error,
    refresh,
    rpcErrorCode: result?.ok === false ? result?.error ?? "unavailable" : null,
  };
}

export default useVportPublicDetails;
