import { useEffect, useState } from "react";
import { getDebugPrivacyRowsController } from "@/features/feed/controllers/getDebugPrivacyRows.controller";

export function useDebugPrivacyRows({ actorId, postIds, enabled }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!enabled || !actorId || !Array.isArray(postIds) || postIds.length === 0) {
        setRows([]);
        return;
      }

      try {
        const nextRows = await getDebugPrivacyRowsController({ actorId, postIds });
        if (!cancelled) setRows(nextRows);
      } catch (error) {
        if (!cancelled) setRows([{ error: error?.message ?? String(error) }]);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [actorId, postIds, enabled]);

  return rows;
}

