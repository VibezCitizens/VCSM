import { useCallback, useEffect, useState } from "react";
import getVportPublicMenuController from "@/features/public/vportMenu/controller/getVportPublicMenu.controller";

const EMPTY = Object.freeze({
  ok: true,
  actorId: null,
  error: null,
  categories: [],
  itemsOrphaned: [],
});

export function useVportPublicMenu({ actorId } = {}) {
  const [result, setResult] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!actorId) return;
    setLoading(true);
    setError(null);

    try {
      const next = await getVportPublicMenuController({ actorId });
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
    categories: result?.categories ?? [],
    loading,
    error,
    refresh,
    rpcErrorCode: result?.ok === false ? result?.error ?? "unavailable" : null,
  };
}

export default useVportPublicMenu;
