import { readVportProfileByActorIdDAL, getVportActorIdByProfileIdDAL } from "@/features/vportDashboard/dal/read/vportProfile.read.dal";
import {
  fetchTeamMembersByProfileId,
  findEligibleBarberActorIdsDAL,
} from "@/features/vportDashboard/dashboard/cards/team/dal/vportTeam.read.dal";
import { hydrateAndReturnSummaries } from "@hydration";
import { insertTeamMemberDAL } from "@/features/vportDashboard/dashboard/cards/team/dal/vportTeam.write.dal";
import {
  insertTeamRequestDAL,
  deleteTeamResourceDAL,
} from "@/features/vportDashboard/dashboard/cards/team/dal/vportTeamInvite.write.dal";
import { fetchResourceByIdDAL } from "@/features/vportDashboard/dashboard/cards/team/dal/vportTeamInvite.read.dal";
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';

async function resolveProfileId(actorId) {
  const profile = await readVportProfileByActorIdDAL({ actorId });
  const id = profile?.id ?? null;
  if (!id) throw new Error("Could not resolve vport profile.");
  return id;
}

export async function getTeamMembersController(actorId, callerActorId) {
  try {
    if (!actorId) return [];
    if (!callerActorId) throw new Error("getTeamMembersController: callerActorId required");
    // Session-derived ownership (IDENTITY-BOUNDARY-006 / ELEK-004): the active actor
    // is the VPORT itself, so ownership is resolved from the auth session via
    // actor_owners rather than trusting the UI-passed caller actor id.
    await assertSessionOwnsActorController({ targetActorId: actorId });
    const profileId = await resolveProfileId(actorId);
    return fetchTeamMembersByProfileId(profileId);
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'team.vportTeam.controller', severity: 'error', message: `getTeamMembersController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'getTeamMembers', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export async function addTeamMemberController(callerActorId, actorId, { name }) {
  try {
    if (!callerActorId) throw new Error("addTeamMemberController: callerActorId required");
    if (!actorId) throw new Error("addTeamMemberController: actorId required");
    if (!name || !String(name).trim()) throw new Error("Name is required.");

    // Session-derived ownership (IDENTITY-BOUNDARY-006 / ELEK-004): the active actor
    // is the VPORT itself, so ownership is resolved from the auth session via
    // actor_owners rather than trusting the UI-passed caller actor id.
    await assertSessionOwnsActorController({ targetActorId: actorId });

    const profileId = await resolveProfileId(actorId);
    return insertTeamMemberDAL({ profileId, ownerActorId: actorId, name: String(name).trim() });
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'team.vportTeam.controller', severity: 'error', message: `addTeamMemberController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'addTeamMember', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export async function findEligibleBarbersController(actorId) {
  try {
    if (!actorId) return [];

    const profileId = await resolveProfileId(actorId);
    const [eligibleActorIds, existingMembers] = await Promise.all([
      findEligibleBarberActorIdsDAL(actorId),
      fetchTeamMembersByProfileId(profileId),
    ]);

    const excludedActorIds = new Set([
      actorId,
      ...existingMembers
        .filter((m) => m.member_actor_id && m.meta?.status !== "declined")
        .map((m) => m.member_actor_id),
    ]);

    const uniqueActorIds = eligibleActorIds.filter((id) => !excludedActorIds.has(id));
    if (!uniqueActorIds.length) return [];

    const { rows } = await hydrateAndReturnSummaries({ actorIds: uniqueActorIds });
    const summaryMap = Object.fromEntries(rows.map((r) => [r.actor_id ?? r.id, r]));

    return uniqueActorIds.map((id) => {
      const s = summaryMap[id];
      return {
        actorId: id,
        name:   s?.display_name ?? s?.vport_name ?? "Unknown",
        avatar: s?.photo_url ?? s?.vport_avatar_url ?? null,
      };
    });
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'team.vportTeam.controller', severity: 'error', message: `findEligibleBarbersController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'findEligibleBarbers', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export async function sendTeamRequestController(callerActorId, actorId, barberVportActorId, barberVportName) {
  try {
    if (!callerActorId) throw new Error("sendTeamRequestController: callerActorId required");
    if (!actorId) throw new Error("sendTeamRequestController: actorId required");
    if (!barberVportActorId) throw new Error("Barber VPORT required.");
    if (!barberVportName?.trim()) throw new Error("Barber name is required.");

    // Session-derived ownership (IDENTITY-BOUNDARY-006 / ELEK-004): the active actor
    // is the VPORT itself, so ownership is resolved from the auth session via
    // actor_owners rather than trusting the UI-passed caller actor id.
    await assertSessionOwnsActorController({ targetActorId: actorId });

    const profileId = await resolveProfileId(actorId);

    const existing = await fetchTeamMembersByProfileId(profileId);
    const alreadyExists = existing.some(
      (m) => m.member_actor_id === barberVportActorId && m.meta?.status !== "declined"
    );
    if (alreadyExists) throw new Error("A request for this barber already exists.");

    const resource = await insertTeamRequestDAL({
      profileId,
      name:               String(barberVportName).trim(),
      memberActorId:      barberVportActorId,
      ownerActorId:       actorId,
      requestedByActorId: callerActorId,
    });

    await publishVcsmNotification({
      recipientActorId: barberVportActorId,
      actorId,
      kind: "team_invite",
      objectType: "team_request",
      objectId: resource?.id ? String(resource.id) : null,
      linkPath: `/actor/${barberVportActorId}/dashboard/team-requests`,
      context: {},
    });

    return resource;
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'team.vportTeam.controller', severity: 'error', message: `sendTeamRequestController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'sendTeamRequest', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export async function removeTeamMemberController(callerActorId, resourceId) {
  try {
    if (!callerActorId) throw new Error("removeTeamMemberController: callerActorId required");
    if (!resourceId) throw new Error("removeTeamMemberController: resourceId required");

    const resource = await fetchResourceByIdDAL(resourceId);
    if (!resource) throw new Error("Resource not found.");

    const vportActorId = resource.owner_actor_id
      ?? await getVportActorIdByProfileIdDAL({ profileId: resource.profile_id });

    if (!vportActorId) throw new Error("Could not resolve VPORT ownership.");

    await assertSessionOwnsActorController({ targetActorId: vportActorId });

    return deleteTeamResourceDAL({ resourceId, profileId: resource.profile_id });
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'team.vportTeam.controller', severity: 'error', message: `removeTeamMemberController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'removeTeamMember', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}
