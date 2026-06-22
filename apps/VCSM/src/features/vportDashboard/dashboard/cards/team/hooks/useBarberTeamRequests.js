import { useCallback, useEffect, useState } from "react";
import {
  getBarberTeamRequestsController,
  acceptTeamRequestController,
  declineTeamRequestController,
} from "@/features/vportDashboard/dashboard/cards/team/controller/vportTeamInvite.controller";
import { hydrateActorsByIds } from "@hydration";

export function useBarberTeamRequests(barberVportActorId, viewerActorId) {
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
    getBarberTeamRequestsController(viewerActorId, barberVportActorId)
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
  }, [barberVportActorId, viewerActorId]);

  const accept = useCallback(async (resourceId) => {
    setWorking(true);
    setWorkError("");
    try {
      await acceptTeamRequestController(viewerActorId, resourceId);
      setRequests((prev) => prev.filter((r) => r.id !== resourceId));
    } catch (e) {
      setWorkError(e?.message || "Failed to accept.");
      throw e;
    } finally {
      setWorking(false);
    }
  }, [viewerActorId]);

  const decline = useCallback(async (resourceId) => {
    setWorking(true);
    setWorkError("");
    try {
      // ELEK-002: pass viewerActorId so declineTeamRequestController can verify
      // that the session user owns the barber VPORT on the isInvitedBarber path.
      await declineTeamRequestController(barberVportActorId, resourceId, viewerActorId);
      setRequests((prev) => prev.filter((r) => r.id !== resourceId));
    } catch (e) {
      setWorkError(e?.message || "Failed to decline.");
      throw e;
    } finally {
      setWorking(false);
    }
  }, [barberVportActorId, viewerActorId]);

  return { requests, loading, error, working, workError, accept, decline };
}
