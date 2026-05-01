import { useCallback, useEffect, useState } from "react";
import {
  fetchBarbershopInviteController,
  acceptBarbershopInviteController,
} from "@/features/dashboard/vport/controller/vportTeamInvite.controller";

export function useAcceptBarbershopInvite(token) {
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    fetchBarbershopInviteController(token)
      .then((data) => {
        if (cancelled) return;
        if (!data) setLoadError("Invite not found or already used.");
        else setInvite(data);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e?.message || "Failed to load invite.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  const accept = useCallback(
    async (actorId) => {
      setAccepting(true);
      setAcceptError("");
      try {
        await acceptBarbershopInviteController(token, actorId);
        setAccepted(true);
      } catch (e) {
        setAcceptError(e?.message || "Failed to accept invite.");
        throw e;
      } finally {
        setAccepting(false);
      }
    },
    [token]
  );

  return { invite, loading, loadError, accepting, acceptError, accepted, accept };
}
