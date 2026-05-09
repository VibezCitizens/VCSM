import { useCallback, useEffect, useState } from "react";
import {
  loadClaimQueue,
  approveClaimRequest,
  rejectClaimRequest,
  flagClaimForReview,
} from "@/features/dashboard/traze/controllers/intake.controller";

export function useClaimRequests() {
  const [state, setState] = useState({ status: "loading", claims: [], error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const claims = await loadClaimQueue();
      setState({ status: "ready", claims, error: null });
    } catch (error) {
      setState({ status: "error", claims: [], error });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function approve(id) {
    await approveClaimRequest(id);
    await load();
  }

  async function reject(id) {
    await rejectClaimRequest(id);
    await load();
  }

  async function flagForReview(id) {
    await flagClaimForReview(id);
    await load();
  }

  return { ...state, approve, reject, flagForReview, reload: load };
}
