import { readVportProfileByActorIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import { fetchTeamMembersByProfileId } from "@/features/dashboard/vport/dal/read/vportTeam.read.dal";
import {
  insertLinkedTeamMemberDAL,
  updateTeamMemberRoleDAL,
  setTeamMemberActiveDAL,
  deleteTeamMemberByIdDAL,
} from "@/features/dashboard/vport/dal/write/vportTeam.write.dal";
import { searchActorsDAL } from "@/features/actors/dal/searchActors.dal";

const VALID_ROLES = ["owner", "manager", "staff"];

function assertCallerOwns(callerActorId, ownerActorId, op) {
  if (!callerActorId) throw new Error(`${op}: callerActorId required`);
  if (String(callerActorId) !== String(ownerActorId)) {
    throw new Error(`${op}: caller does not own this vport`);
  }
}

async function resolveProfileId(actorId) {
  const profile = await readVportProfileByActorIdDAL({ actorId });
  const id = profile?.id ?? null;
  if (!id) throw new Error("Could not resolve vport profile.");
  return id;
}

function roleOf(row) {
  return row.meta?.role ?? "staff";
}

function isActiveOwner(row) {
  return roleOf(row) === "owner" && row.is_active === true;
}

function assertOwnerRemains(rows, excludeResourceId, operation) {
  const remaining = rows.filter(
    (r) => isActiveOwner(r) && String(r.id) !== String(excludeResourceId)
  );
  if (remaining.length === 0) {
    throw new Error(`Cannot ${operation}: at least one active owner must remain.`);
  }
}

export async function getTeamAccessController(actorId, callerActorId) {
  assertCallerOwns(callerActorId, actorId, "getTeamAccessController");
  if (!actorId) return [];
  const profileId = await resolveProfileId(actorId);
  return fetchTeamMembersByProfileId(profileId);
}

export async function addTeamMemberController(actorId, { memberActorId, role, displayName }, callerActorId) {
  assertCallerOwns(callerActorId, actorId, "addTeamMemberController");
  if (!memberActorId) throw new Error("Member actor is required.");
  if (!VALID_ROLES.includes(role)) throw new Error(`Invalid role. Must be: ${VALID_ROLES.join(", ")}`);
  if (String(actorId) === String(memberActorId)) throw new Error("Cannot add yourself as a team member.");

  const profileId = await resolveProfileId(actorId);
  const existing  = await fetchTeamMembersByProfileId(profileId);

  const alreadyMember = existing.some(
    (r) => r.member_actor_id && String(r.member_actor_id) === String(memberActorId)
      && r.meta?.status !== "declined"
  );
  if (alreadyMember) throw new Error("This actor is already a team member.");

  return insertLinkedTeamMemberDAL({ profileId, memberActorId, name: displayName ?? memberActorId, role });
}

export async function updateTeamMemberRoleController(actorId, { resourceId, role }, callerActorId) {
  assertCallerOwns(callerActorId, actorId, "updateTeamMemberRoleController");
  if (!resourceId) throw new Error("Resource ID is required.");
  if (!VALID_ROLES.includes(role)) throw new Error("Invalid role.");

  const profileId = await resolveProfileId(actorId);
  const existing  = await fetchTeamMembersByProfileId(profileId);
  const target    = existing.find((r) => String(r.id) === String(resourceId));
  if (!target) throw new Error("Team member not found.");

  if (roleOf(target) === "owner" && role !== "owner") {
    assertOwnerRemains(existing, resourceId, "demote the last owner");
  }

  return updateTeamMemberRoleDAL({ resourceId, meta: target.meta, role });
}

export async function setTeamMemberStatusController(actorId, { resourceId, status }, callerActorId) {
  assertCallerOwns(callerActorId, actorId, "setTeamMemberStatusController");
  if (!resourceId) throw new Error("Resource ID is required.");
  if (!["active", "inactive"].includes(status)) throw new Error("Status must be active or inactive.");

  const profileId = await resolveProfileId(actorId);
  const existing  = await fetchTeamMembersByProfileId(profileId);
  const target    = existing.find((r) => String(r.id) === String(resourceId));
  if (!target) throw new Error("Team member not found.");

  if (target.member_actor_id && String(target.member_actor_id) === String(actorId) && status === "inactive") {
    throw new Error("Cannot deactivate yourself.");
  }

  if (status === "inactive" && roleOf(target) === "owner") {
    assertOwnerRemains(existing, resourceId, "deactivate the last owner");
  }

  return setTeamMemberActiveDAL({ resourceId, isActive: status === "active" });
}

export async function removeTeamMemberController(actorId, { resourceId }, callerActorId) {
  assertCallerOwns(callerActorId, actorId, "removeTeamMemberController");
  if (!resourceId) throw new Error("Resource ID is required.");

  const profileId = await resolveProfileId(actorId);
  const existing  = await fetchTeamMembersByProfileId(profileId);
  const target    = existing.find((r) => String(r.id) === String(resourceId));

  if (target?.member_actor_id && String(target.member_actor_id) === String(actorId)) {
    throw new Error("Cannot remove yourself from the team.");
  }
  if (target && roleOf(target) === "owner") {
    assertOwnerRemains(existing, resourceId, "remove the last owner");
  }

  await deleteTeamMemberByIdDAL(resourceId);
}

export async function searchTeamCandidatesController({ query, viewerActorId }) {
  if (!query?.trim()) return [];
  return searchActorsDAL({ query, limit: 12, viewerActorId });
}
