import {
  readActorOwnerUserDAL,
  readActorPrivacyDAL,
  readProfileIdentityDAL,
  readVportIdentityDAL,
} from "./dal/vcsmActorHydration.read.dal";
import {
  mapProfileActor,
  mapVportActor,
} from "./model/vcsmActorMappers.model";
// Identity-runtime reads owned by features/identity (post IDENTITY-BOUNDARY-006;
// shared with the identity controller / self-heal). The adapter contract forbids
// exporting DALs/controllers, so these cannot route through the identity adapter.
// IDENTITY-BOUNDARY-007 decision (C5): sanctioned boundary exception. The proper
// fix is to source the actor-row reads from features/actors' public surface during
// the actor-row consolidation program; realm resolution stays identity-runtime.
// eslint-disable-next-line vcsm-architecture/adapter-boundary -- IB-007 C5: identity-runtime actor-row reads; fix in actors-consolidation program
import {
  readIdentityActorByIdDAL,
  readUserActorByProfileIdDAL,
} from "@/features/identity/identity.read.dal";
// eslint-disable-next-line vcsm-architecture/adapter-boundary -- IB-007 C5: identity-runtime realm resolution
import {
  resolveRealmId,
} from "@/features/identity/identity.controller";
import { supabase as supabaseClient } from "@/services/supabase/supabaseClient";

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

    if (!ownerActorId && vport?.id) {
      const { data: accessRow } = await supabaseClient
        .schema("vport")
        .from("profile_actor_access")
        .select("actor_id")
        .eq("profile_id", vport.id)
        .eq("is_primary", true)
        .maybeSingle();
      ownerActorId = accessRow?.actor_id ?? null;
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
