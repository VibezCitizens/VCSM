import { useCallback, useEffect, useMemo, useState } from "react";
import listOwnerBookingResourcesController from "@/features/booking/controller/listOwnerBookingResources.controller";

export default function useOwnerBookingResources({
  ownerActorId = null,
  includeInactive = false,
  enabled = true,
} = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!enabled || !ownerActorId) {
      setItems([]);
      setLoading(false);
      setError(null);
      return { ok: false, data: [], error: null };
    }

    setLoading(true);
    setError(null);

    try {
      const data = await listOwnerBookingResourcesController({
        ownerActorId,
        includeInactive,
      });

      setItems(Array.isArray(data) ? data : []);
      return { ok: true, data: Array.isArray(data) ? data : [], error: null };
    } catch (e) {
      setError(e);
      setItems([]);
      return { ok: false, data: [], error: e };
    } finally {
      setLoading(false);
    }
  }, [enabled, ownerActorId, includeInactive]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const primary = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return null;
    return (
      items.find((x) => x?.resourceType === "primary") ??
      items.find((x) => x?.isActive) ??
      items[0]
    );
  }, [items]);

  return {
    loading,
    error,
    items,
    primary,
    refresh,
  };
}
