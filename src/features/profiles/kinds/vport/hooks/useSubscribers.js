import { useEffect, useState, useCallback } from "react";
import { dalCountSubscribers } from "@/features/profiles/kinds/vport/dal/subscribersCount.dal";
import { dalListSubscribers } from "@/features/profiles/kinds/vport/dal/subscribersList.dal";

export function useSubscribers(actorId) {
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!actorId) {
      setLoading(false);
      setCount(0);
      setRows([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [c, list] = await Promise.all([
        dalCountSubscribers(actorId),
        dalListSubscribers({ actorId, limit: 50, offset: 0 }),
      ]);

      setCount(c ?? 0);
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message || "Failed to load subscribers");
      setCount(0);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [actorId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { loading, count, rows, error, reload };
}
