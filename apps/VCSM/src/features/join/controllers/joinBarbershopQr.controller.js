import { findBarberVportForUserDAL } from "@/features/join/dal/barberVport.read.dal";
import { fetchJoinResourceByIdDAL, acceptJoinResourceDAL } from "@/features/join/dal/joinInvite.dal";
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

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

export async function acceptQrJoin(token, barberVportActorId, callerActorId) {
  if (!callerActorId) throw new Error("acceptQrJoin: callerActorId required");
  await assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: barberVportActorId,
  });

  // ELEK-001: verify resource state before write — controller-layer guard.
  // The hook/UI layer checks join_token_used_at and member_actor_id but those are
  // not sufficient; the controller must enforce independently so the DAL is never
  // called against a stale or already-claimed resource.
  const resource = await fetchJoinResourceByIdDAL(token);
  if (!resource) throw new Error("join resource not found");
  if (resource.meta?.status !== "pending_onboarding") {
    throw new Error("join resource is no longer available");
  }
  if (resource.member_actor_id) {
    throw new Error("join resource is no longer available");
  }
  if (resource.meta?.join_expires_at && new Date(resource.meta.join_expires_at) < new Date()) {
    throw new Error("QR join link has expired");
  }

  return acceptJoinResourceDAL(token, barberVportActorId, {
    join_token_used_at: new Date().toISOString(),
  });
}

export async function createBarberVportAndAcceptQr(token, vportName, { createVport, callerActorId } = {}) {
  if (!vportName || !String(vportName).trim()) throw new Error("VPORT name is required.");
  if (!callerActorId) throw new Error("createBarberVportAndAcceptQr: callerActorId required");

  const vportResult = await createVport?.({
    name: String(vportName).trim(),
    vportType: "barber",
    directoryVisible: true,
  });

  await assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: vportResult.actorId,
  });

  await acceptJoinResourceDAL(token, vportResult.actorId, {
    join_token_used_at: new Date().toISOString(),
  });

  return { barberVportActorId: vportResult.actorId, vportName: String(vportName).trim() };
}
