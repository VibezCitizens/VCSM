import {
  readActorOwnerUserDAL,
  readActorPrivacyDAL,
  readIdentityActorByIdDAL,
  readProfileIdentityDAL,
  readUserActorByProfileIdDAL,
  readVportIdentityDAL,
} from "@/state/identity/identity.read.dal";
import {
  mapProfileActor,
  mapVportActor,
  resolveRealmId,
} from "@/state/identity/identity.controller";

export async function hydrateVcsmActor({
  actorId,
  actorSource,
  appKey,
  supabase,
  context,
}) {
  if (!actorId) return null;

  // The shared engine passes these fields for contract consistency.
  // VCSM currently hydrates vc actors through app-owned DAL helpers.
  void actorSource;
  void appKey;
  void supabase;

  const actor = context?.actor ?? (await readIdentityActorByIdDAL(actorId));
  if (!actor?.id) return null;

  const realmId = await resolveRealmId(actor);

  if (actor.kind === "user") {
    const [profile, privacy] = await Promise.all([
      readProfileIdentityDAL(actor.profile_id),
      readActorPrivacyDAL(actor.id),
    ]);

    return {
      ...mapProfileActor(actor, profile, realmId),
      private: privacy?.is_private ?? false,
    };
  }

  if (actor.kind === "vport") {
    const [vport, privacy, ownerRow] = await Promise.all([
      readVportIdentityDAL(actor.vport_id),
      readActorPrivacyDAL(actor.id),
      readActorOwnerUserDAL(actor.id),
    ]);

    let ownerActorId = null;

    if (ownerRow?.user_id) {
      const ownerActor = await readUserActorByProfileIdDAL(ownerRow.user_id);
      ownerActorId = ownerActor?.id ?? null;
    }

    return {
      ...mapVportActor(actor, vport, realmId),
      private: privacy?.is_private ?? false,
      ownerActorId,
    };
  }

  return null;
}

export default hydrateVcsmActor;
