import { useEffect, useState, useCallback } from "react";
import { getSubscribersController } from "@/features/profiles/kinds/vport/controller/subscribers/getSubscribers.controller";

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
      const result = await getSubscribersController({
        actorId,
        limit: 50,
        offset: 0,
      });

      setCount(result.count ?? 0);
      setRows(Array.isArray(result.rows) ? result.rows : []);
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
