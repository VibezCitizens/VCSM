import { readVportProfileByActorIdDAL, getVportActorIdByProfileIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import {
  fetchTeamMembersByProfileId,
  findEligibleBarberActorIdsDAL,
} from "@/features/dashboard/vport/dal/read/vportTeam.read.dal";
import { hydrateAndReturnSummaries } from "@hydration";
import { insertTeamMemberDAL } from "@/features/dashboard/vport/dal/write/vportTeam.write.dal";
import {
  insertTeamRequestDAL,
  deleteTeamResourceDAL,
} from "@/features/dashboard/vport/dal/write/vportTeamInvite.write.dal";
import { fetchResourceByIdDAL } from "@/features/dashboard/vport/dal/read/vportTeamInvite.read.dal";
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

async function resolveProfileId(actorId) {
  const profile = await readVportProfileByActorIdDAL({ actorId });
  const id = profile?.id ?? null;
  if (!id) throw new Error("Could not resolve vport profile.");
  return id;
}

export async function getTeamMembersController(actorId) {
  if (!actorId) return [];
  const profileId = await resolveProfileId(actorId);
  return fetchTeamMembersByProfileId(profileId);
}

export async function addTeamMemberController(callerActorId, actorId, { name }) {
  if (!callerActorId) throw new Error("addTeamMemberController: callerActorId required");
  if (!actorId) throw new Error("addTeamMemberController: actorId required");
  if (!name || !String(name).trim()) throw new Error("Name is required.");

  await assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: actorId,
  });

  const profileId = await resolveProfileId(actorId);
  return insertTeamMemberDAL({ profileId, ownerActorId: actorId, name: String(name).trim() });
}

export async function findEligibleBarbersController(actorId) {
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
}

export async function sendTeamRequestController(callerActorId, actorId, barberVportActorId, barberVportName) {
  if (!callerActorId) throw new Error("sendTeamRequestController: callerActorId required");
  if (!actorId) throw new Error("sendTeamRequestController: actorId required");
  if (!barberVportActorId) throw new Error("Barber VPORT required.");
  if (!barberVportName?.trim()) throw new Error("Barber name is required.");

  await assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: actorId,
  });

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
    context: {
      barbershopActorId: actorId,
      resourceId: resource?.id ?? null,
    },
  });

  return resource;
}

export async function removeTeamMemberController(callerActorId, resourceId) {
  if (!callerActorId) throw new Error("removeTeamMemberController: callerActorId required");
  if (!resourceId) throw new Error("removeTeamMemberController: resourceId required");

  const resource = await fetchResourceByIdDAL(resourceId);
  if (!resource) throw new Error("Resource not found.");

  const vportActorId = resource.owner_actor_id
    ?? await getVportActorIdByProfileIdDAL({ profileId: resource.profile_id });

  if (!vportActorId) throw new Error("Could not resolve VPORT ownership.");

  await assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: vportActorId,
  });

  return deleteTeamResourceDAL(resourceId);
}
