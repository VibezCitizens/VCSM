// src/features/settings/vports/hooks/useVportsList.js
import { useEffect, useState } from "react";
import { listMyVportsDAL } from "@/features/settings/vports/dal/vports.read.dal";

export function useVportsList() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const list = await listMyVportsDAL();
        if (alive) setItems(list ?? []);
      } catch (e) {
        console.error("[useVportsList] failed", e);
        if (alive) setItems([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { items, setItems };
}
