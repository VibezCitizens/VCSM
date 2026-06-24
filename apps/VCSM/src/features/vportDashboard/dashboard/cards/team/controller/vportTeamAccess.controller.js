import { readVportProfileByActorIdDAL } from "@/features/vportDashboard/dal/read/vportProfile.read.dal";
import { fetchTeamMembersByProfileId } from "@/features/vportDashboard/dashboard/cards/team/dal/vportTeam.read.dal";
import {
  insertLinkedTeamMemberDAL,
  updateTeamMemberRoleDAL,
  setTeamMemberActiveDAL,
  deleteTeamMemberByIdDAL,
} from "@/features/vportDashboard/dashboard/cards/team/dal/vportTeam.write.dal";
import { searchActorsAdapter } from "@/features/actors/adapters/actors.adapter";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';
import { useIdentitySelectionStore } from '@/features/identity/adapters/identity.adapter';

const VALID_ROLES = ["owner", "manager", "staff"];

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

function toTeamCandidateRow(actor) {
  return {
    actor_id: actor.actorId,
    kind: actor.kind ?? null,
    display_name: actor.displayName ?? null,
    username: actor.username ?? null,
    photo_url: actor.avatarUrl ?? null,
    vport_name: actor.kind === "vport" ? actor.displayName ?? null : null,
    vport_slug: actor.kind === "vport" ? actor.username ?? null : null,
    vport_avatar_url: actor.kind === "vport" ? actor.avatarUrl ?? null : null,
  };
}

export async function getTeamAccessController(actorId, callerActorId) {
  try {
    // Session-derived ownership (IDENTITY-BOUNDARY-006): caller identity comes from
    // the auth session, not the active actor. A VPORT-acting session (identity.actorId
    // === vport) is the only way to reach this dashboard, so the actor gate's user-kind
    // requirement (ELEK-004) cannot be satisfied here. The session gate verifies the
    // authenticated user owns this vport via actor_owners.
    await assertSessionOwnsActorController({ targetActorId: actorId });
    if (!actorId) return [];
    const profileId = await resolveProfileId(actorId);
    return fetchTeamMembersByProfileId(profileId);
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'team.vportTeamAccess.controller', severity: 'error', message: `getTeamAccessController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'getTeamAccess', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export async function addTeamMemberController(actorId, { memberActorId, role, displayName }, callerActorId) {
  try {
    await assertSessionOwnsActorController({ targetActorId: actorId });
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

    return insertLinkedTeamMemberDAL({ profileId, ownerActorId: actorId, memberActorId, name: displayName ?? memberActorId, role });
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'team.vportTeamAccess.controller', severity: 'error', message: `addTeamMemberController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'addTeamMember', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export async function updateTeamMemberRoleController(actorId, { resourceId, role }, callerActorId) {
  try {
    await assertSessionOwnsActorController({ targetActorId: actorId });
    if (!resourceId) throw new Error("Resource ID is required.");
    if (!VALID_ROLES.includes(role)) throw new Error("Invalid role.");

    const profileId = await resolveProfileId(actorId);
    const existing  = await fetchTeamMembersByProfileId(profileId);
    const target    = existing.find((r) => String(r.id) === String(resourceId));
    if (!target) throw new Error("Team member not found.");

    if (roleOf(target) === "owner" && role !== "owner") {
      assertOwnerRemains(existing, resourceId, "demote the last owner");
    }

    return updateTeamMemberRoleDAL({ resourceId, profileId, meta: target.meta, role });
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'team.vportTeamAccess.controller', severity: 'error', message: `updateTeamMemberRoleController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'updateTeamMemberRole', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export async function setTeamMemberStatusController(actorId, { resourceId, status }, callerActorId) {
  try {
    await assertSessionOwnsActorController({ targetActorId: actorId });
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

    return setTeamMemberActiveDAL({ resourceId, profileId, isActive: status === "active" });
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'team.vportTeamAccess.controller', severity: 'error', message: `setTeamMemberStatusController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'setTeamMemberStatus', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export async function removeTeamMemberController(actorId, { resourceId }, callerActorId) {
  try {
    await assertSessionOwnsActorController({ targetActorId: actorId });
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

    await deleteTeamMemberByIdDAL({ resourceId, profileId });
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'team.vportTeamAccess.controller', severity: 'error', message: `removeTeamMemberController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'removeTeamMember', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export async function searchTeamCandidatesController({ query }) {
  try {
    if (!query?.trim()) return [];
    const viewerActorId = useIdentitySelectionStore.getState().activeActorId ?? null
    const actors = await searchActorsAdapter({ query, limit: 12, viewerActorId });
    return actors.map(toTeamCandidateRow);
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'team.vportTeamAccess.controller', severity: 'error', message: `searchTeamCandidatesController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'searchTeamCandidates', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}
