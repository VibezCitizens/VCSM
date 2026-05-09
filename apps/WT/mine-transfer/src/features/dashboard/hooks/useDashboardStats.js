import { useEffect, useState } from "react";
import { loadDashboardStats } from "@/features/dashboard/controllers/dashboardStats.controller";

export function useDashboardStats() {
  const [state, setState] = useState({ status: "loading", data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", data: null, error: null });

    loadDashboardStats()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: "error", data: null, error });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
