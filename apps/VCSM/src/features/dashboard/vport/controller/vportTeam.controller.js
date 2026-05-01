import { readVportProfileByActorIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import {
  fetchTeamMembersByProfileId,
  findEligibleBarbersDAL,
} from "@/features/dashboard/vport/dal/read/vportTeam.read.dal";
import { insertTeamMemberDAL } from "@/features/dashboard/vport/dal/write/vportTeam.write.dal";
import {
  insertTeamRequestDAL,
  deleteTeamResourceDAL,
} from "@/features/dashboard/vport/dal/write/vportTeamInvite.write.dal";
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";

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

export async function addTeamMemberController(actorId, { name }) {
  if (!actorId) throw new Error("addTeamMemberController: actorId required");
  if (!name || !String(name).trim()) throw new Error("Name is required.");
  const profileId = await resolveProfileId(actorId);
  return insertTeamMemberDAL({ profileId, name: String(name).trim() });
}

export async function findEligibleBarbersController(actorId) {
  if (!actorId) return [];

  const profileId = await resolveProfileId(actorId);
  const [allEligible, existingMembers] = await Promise.all([
    findEligibleBarbersDAL(actorId),
    fetchTeamMembersByProfileId(profileId),
  ]);

  const excludedActorIds = new Set([
    // the barbershop can't invite itself
    actorId,
    // already on the team (not declined)
    ...existingMembers
      .filter((m) => m.member_actor_id && m.meta?.status !== "declined")
      .map((m) => m.member_actor_id),
  ]);

  return allEligible.filter((b) => !excludedActorIds.has(b.actorId));
}

export async function sendTeamRequestController(actorId, barberVportActorId, barberVportName) {
  if (!actorId) throw new Error("sendTeamRequestController: actorId required");
  if (!barberVportActorId) throw new Error("Barber VPORT required.");
  if (!barberVportName?.trim()) throw new Error("Barber name is required.");

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
    requestedByActorId: actorId,
  });

  // Notify the barber so they can accept or decline
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

export async function removeTeamMemberController(resourceId) {
  if (!resourceId) throw new Error("removeTeamMemberController: resourceId required");
  return deleteTeamResourceDAL(resourceId);
}
