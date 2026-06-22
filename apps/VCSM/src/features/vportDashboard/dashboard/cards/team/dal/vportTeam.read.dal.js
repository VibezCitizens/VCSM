import { vc } from "@/services/supabase/vcClient";
import vportSchema from "@/services/supabase/vportClient";
import { listValidMemberActorIdsDAL } from "@/features/vportDashboard/dal/read/actorValidity.read.dal";

export async function fetchTeamMembersByProfileId(profileId) {
  if (!profileId) return [];

  const { data, error } = await vportSchema
    .from("resources")
    .select("id, name, resource_type, is_active, member_actor_id, sort_order, meta")
    .eq("profile_id", profileId)
    .eq("resource_type", "staff")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = data ?? [];

  // Exclude staff resources whose linked member actor has been deleted, voided,
  // or no longer exists in vc.actors — the same validity gate applied by
  // loadDaySchedule.controller — so dashboard team counts stay consistent with
  // the Book tab, schedule lanes, and operational schedule view. Rows with no
  // member_actor_id (manual / non-linked staff) are kept unchanged.
  const memberActorIds = rows.map((r) => r.member_actor_id).filter(Boolean);
  const validMemberActorIds = await listValidMemberActorIdsDAL({ actorIds: memberActorIds });
  return rows.filter((r) => !r.member_actor_id || validMemberActorIds.has(r.member_actor_id));
}

export async function findEligibleBarberActorIdsDAL(barbershopActorId) {
  if (!barbershopActorId) return [];

  // Step 1: get all active followers of the barbershop
  const { data: follows, error: followsError } = await vc
    .from("actor_follows")
    .select("follower_actor_id")
    .eq("followed_actor_id", barbershopActorId)
    .eq("is_active", true);

  if (followsError || !follows?.length) return [];

  const followerActorIds = follows.map((f) => f.follower_actor_id);

  // Step 2: split followers by actor kind
  const { data: actors, error: actorsError } = await vc
    .from("actors")
    .select("id, kind")
    .in("id", followerActorIds)
    .eq("is_void", false);

  if (actorsError || !actors?.length) return [];

  const userActorIds = actors.filter((a) => a.kind === "user").map((a) => a.id);
  const vportActorIds = actors.filter((a) => a.kind === "vport").map((a) => a.id);

  const barberActorIds = [];

  // Step 3a: user-kind followers → resolve their barber VPORT actor via actor_owners (canonical)
  if (userActorIds.length > 0) {
    const { data: userOwners } = await vc
      .from("actor_owners")
      .select("actor_id, user_id")
      .in("actor_id", userActorIds);

    if (userOwners?.length) {
      const userIds = userOwners.map((o) => o.user_id);

      // Canonical: find all VPORT actors owned by these users via actor_owners
      const { data: vportOwnerships } = await vc
        .from("actor_owners")
        .select("actor_id, actor:actors!inner(id, kind, is_void, is_deleted)")
        .in("user_id", userIds)
        .eq("is_void", false);

      const ownedVportActorIds = (vportOwnerships ?? [])
        .filter((o) => o.actor?.kind === "vport" && !o.actor?.is_void && !o.actor?.is_deleted)
        .map((o) => o.actor_id);

      if (ownedVportActorIds.length > 0) {
        const { data: barberProfiles } = await vportSchema
          .from("profile_categories")
          .select("profile:profiles!inner(actor_id, is_active)")
          .eq("category_key", "barber")
          .eq("is_primary", true)
          .eq("profile.is_active", true)
          .in("profile.actor_id", ownedVportActorIds);

        barberProfiles?.forEach((pc) => {
          if (pc.profile?.actor_id) barberActorIds.push(pc.profile.actor_id);
        });
      }
    }
  }

  // Step 3b: vport-kind followers → check if the VPORT itself is a barber VPORT
  if (vportActorIds.length > 0) {
    const { data: barberProfiles } = await vportSchema
      .from("profile_categories")
      .select("profile:profiles!inner(actor_id, is_active)")
      .eq("category_key", "barber")
      .eq("is_primary", true)
      .eq("profile.is_active", true)
      .in("profile.actor_id", vportActorIds);

    barberProfiles?.forEach((pc) => {
      if (pc.profile?.actor_id) barberActorIds.push(pc.profile.actor_id);
    });
  }

  return [...new Set(barberActorIds)];
}
