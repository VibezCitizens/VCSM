import { findBarberVportForUserDAL } from "@/features/join/dal/barberVport.read.dal";
import { fetchJoinResourceByIdDAL, acceptJoinResourceDAL } from "@/features/join/dal/joinInvite.dal";

export async function loadQrJoin(token) {
  if (!token) return null;
  const resource = await fetchJoinResourceByIdDAL(token);
  if (!resource) return null;
  if (resource.meta?.status !== "pending_onboarding") return null;
  return resource;
}

export async function findCurrentUserBarberVport({ readCurrentAuthUserDAL } = {}) {
  const user = await readCurrentAuthUserDAL?.().catch(() => null);
  if (!user) return null;
  return findBarberVportForUserDAL(user.id);
}

export async function acceptQrJoin(token, barberVportActorId) {
  return acceptJoinResourceDAL(token, barberVportActorId, {
    join_token_used_at: new Date().toISOString(),
  });
}

export async function createBarberVportAndAcceptQr(token, vportName, { createVport } = {}) {
  if (!vportName || !String(vportName).trim()) throw new Error("VPORT name is required.");

  const vportResult = await createVport?.({
    name: String(vportName).trim(),
    vportType: "barber",
    directoryVisible: true,
  });

  await acceptJoinResourceDAL(token, vportResult.actorId, {
    join_token_used_at: new Date().toISOString(),
  });

  return { barberVportActorId: vportResult.actorId, vportName: String(vportName).trim() };
}
