import { useCallback, useEffect, useState } from "react";
import {
  getBarberTeamRequestsController,
  acceptTeamRequestController,
  declineTeamRequestController,
} from "@/features/dashboard/vport/controller/vportTeamInvite.controller";
import { hydrateActorsByIds } from "@hydration";

export function useBarberTeamRequests(barberVportActorId) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [workError, setWorkError] = useState("");

  useEffect(() => {
    if (!barberVportActorId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getBarberTeamRequestsController(barberVportActorId)
      .then((data) => {
        if (!cancelled) {
          const rows = data ?? [];
          setRequests(rows);
          const actorIds = rows.map((r) => r.barbershop?.actor_id).filter(Boolean);
          if (actorIds.length) hydrateActorsByIds(actorIds);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Failed to load requests.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [barberVportActorId]);

  const accept = useCallback(async (resourceId) => {
    setWorking(true);
    setWorkError("");
    try {
      await acceptTeamRequestController(barberVportActorId, resourceId);
      setRequests((prev) => prev.filter((r) => r.id !== resourceId));
    } catch (e) {
      setWorkError(e?.message || "Failed to accept.");
      throw e;
    } finally {
      setWorking(false);
    }
  }, [barberVportActorId]);

  const decline = useCallback(async (resourceId) => {
    setWorking(true);
    setWorkError("");
    try {
      await declineTeamRequestController(barberVportActorId, resourceId);
      setRequests((prev) => prev.filter((r) => r.id !== resourceId));
    } catch (e) {
      setWorkError(e?.message || "Failed to decline.");
      throw e;
    } finally {
      setWorking(false);
    }
  }, [barberVportActorId]);

  return { requests, loading, error, working, workError, accept, decline };
}
