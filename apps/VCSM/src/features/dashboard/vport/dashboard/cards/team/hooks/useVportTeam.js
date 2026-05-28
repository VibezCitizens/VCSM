import { useCallback, useEffect, useState } from "react";
import { hydrateActorsByIds } from "@hydration";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import {
  getTeamMembersController,
  findEligibleBarbersController,
  sendTeamRequestController,
  removeTeamMemberController,
} from "@/features/dashboard/vport/dashboard/cards/team/controller/vportTeam.controller";

export function useVportTeam(actorId) {
  const { identity } = useIdentity();
  const callerActorId = identity?.actorId ?? null;

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
    getTeamMembersController(actorId, callerActorId)
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
        const newMember = await sendTeamRequestController(callerActorId, actorId, barberVportActorId, barberVportName);
        setMembers((prev) => [...prev, newMember]);
        return newMember;
      } catch (e) {
        setAddError(e?.message || "Failed to send request.");
        throw e;
      } finally {
        setAdding(false);
      }
    },
    [callerActorId, actorId]
  );

  const removeMember = useCallback(async (resourceId) => {
    await removeTeamMemberController(callerActorId, resourceId);
    setMembers((prev) => prev.filter((m) => m.id !== resourceId));
  }, [callerActorId]);

  return { members, loading, error, adding, addError, findEligibleBarbers, sendRequest, removeMember };
}
