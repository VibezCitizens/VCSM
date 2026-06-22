import { useCallback, useEffect, useState } from "react";
import { hydrateActorsByIds } from "@hydration";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import {
  getTeamAccessController,
  addTeamMemberController,
  updateTeamMemberRoleController,
  setTeamMemberStatusController,
  removeTeamMemberController,
  searchTeamCandidatesController,
} from "@/features/vportDashboard/dashboard/cards/team/controller/vportTeamAccess.controller";

function normalizeRow(row) {
  const metaStatus = row.meta?.status ?? null;
  let status = "active";
  if (metaStatus === "pending_acceptance") status = "pending";
  else if (metaStatus === "declined")       status = "declined";
  else if (!row.is_active)                  status = "inactive";

  return {
    resource_id: row.id,
    actor_id:    row.member_actor_id ?? null,
    name:        row.name,
    role:        row.meta?.role ?? "staff",
    status,
    meta:        row.meta ?? {},
  };
}

export function useVportTeamAccess(actorId, isOwner) {
  const { identity } = useIdentity();
  const sessionActorId = identity?.actorId ?? null;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const loadMembers = useCallback(async () => {
    if (!actorId || !isOwner) { setMembers([]); return; }
    setLoading(true);
    setError("");
    try {
      const raw  = await getTeamAccessController(actorId, sessionActorId);
      const rows = (raw ?? []).map(normalizeRow);
      setMembers(rows);
      const ids  = rows.map((m) => m.actor_id).filter(Boolean);
      if (ids.length) hydrateActorsByIds(ids);
    } catch (e) {
      setError(e?.message || "Failed to load team.");
    } finally {
      setLoading(false);
    }
  }, [actorId, isOwner, sessionActorId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const addMember = useCallback(async ({ memberActorId, role, displayName }) => {
    const raw = await addTeamMemberController(actorId, { memberActorId, role, displayName }, sessionActorId);
    const row = normalizeRow(raw);
    setMembers((prev) => [...prev, row]);
    if (row.actor_id) hydrateActorsByIds([row.actor_id]);
    return row;
  }, [actorId, sessionActorId]);

  const updateRole = useCallback(async ({ resourceId, role }) => {
    const raw = await updateTeamMemberRoleController(actorId, { resourceId, role }, sessionActorId);
    const row = normalizeRow(raw);
    setMembers((prev) => prev.map((m) => m.resource_id === resourceId ? row : m));
    return row;
  }, [actorId, sessionActorId]);

  const setStatus = useCallback(async ({ resourceId, status }) => {
    const raw = await setTeamMemberStatusController(actorId, { resourceId, status }, sessionActorId);
    const row = normalizeRow(raw);
    setMembers((prev) => prev.map((m) => m.resource_id === resourceId ? row : m));
    return row;
  }, [actorId, sessionActorId]);

  const removeMember = useCallback(async ({ resourceId }) => {
    await removeTeamMemberController(actorId, { resourceId }, sessionActorId);
    setMembers((prev) => prev.filter((m) => m.resource_id !== resourceId));
  }, [actorId, sessionActorId]);

  const searchCandidates = useCallback(async (query) => {
    return searchTeamCandidatesController({ query, viewerActorId: sessionActorId });
  }, [sessionActorId]);

  return { members, loading, error, loadMembers, addMember, updateRole, setStatus, removeMember, searchCandidates };
}
