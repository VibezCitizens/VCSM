import { useCallback, useEffect, useState } from "react";
import { hydrateActorsByIds } from "@hydration";
import {
  getTeamMembersController,
  findEligibleBarbersController,
  sendTeamRequestController,
  removeTeamMemberController,
} from "@/features/dashboard/vport/controller/vportTeam.controller";

export function useVportTeam(actorId) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    if (!actorId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getTeamMembersController(actorId)
      .then((data) => {
        if (!cancelled) {
          const rows = data ?? [];
          setMembers(rows);
          const actorIds = rows.map((m) => m.member_actor_id).filter(Boolean);
          if (actorIds.length) hydrateActorsByIds(actorIds);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Failed to load team.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [actorId]);

  const findEligibleBarbers = useCallback(async () => {
    if (!actorId) return [];
    return findEligibleBarbersController(actorId);
  }, [actorId]);

  const sendRequest = useCallback(
    async (barberVportActorId, barberVportName) => {
      setAdding(true);
      setAddError("");
      try {
        const newMember = await sendTeamRequestController(actorId, barberVportActorId, barberVportName);
        setMembers((prev) => [...prev, newMember]);
        return newMember;
      } catch (e) {
        setAddError(e?.message || "Failed to send request.");
        throw e;
      } finally {
        setAdding(false);
      }
    },
    [actorId]
  );

  const removeMember = useCallback(async (resourceId) => {
    await removeTeamMemberController(resourceId);
    setMembers((prev) => prev.filter((m) => m.id !== resourceId));
  }, []);

  return { members, loading, error, adding, addError, findEligibleBarbers, sendRequest, removeMember };
}
