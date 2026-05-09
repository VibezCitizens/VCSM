import { useCallback, useEffect, useState } from "react";
import {
  readTripointDashboardAccess,
  signOutTripointDashboard,
  subscribeToTripointDashboardAuth,
} from "@/features/dashboard/auth/tripointDashboardAccess";

export function useTripointDashboardAccess() {
  const [access, setAccess] = useState({ status: "checking", user: null, error: null });

  const retry = useCallback(async () => {
    setAccess((c) => ({ ...c, status: "checking", error: null }));
    try {
      const result = await readTripointDashboardAccess();
      setAccess({ ...result, error: null });
    } catch (error) {
      setAccess({ status: "error", user: null, error });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const result = await readTripointDashboardAccess();
        if (!cancelled) setAccess({ ...result, error: null });
      } catch (error) {
        if (!cancelled) setAccess({ status: "error", user: null, error });
      }
    }

    run();
    const unsubscribe = subscribeToTripointDashboardAuth(run);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { access, retry, signOut: signOutTripointDashboard };
}
