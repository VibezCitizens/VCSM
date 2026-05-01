import { vc } from "@/services/supabase/vcClient";
import vportSchema from "@/services/supabase/vportClient";
import { hydrateAndReturnSummaries } from "@hydration";

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
  return data ?? [];
}

export async function findEligibleBarbersDAL(barbershopActorId) {
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

  // Step 3a: user-kind followers → resolve their barber VPORT actor
  if (userActorIds.length > 0) {
    const { data: owners } = await vc
      .from("actor_owners")
      .select("actor_id, user_id")
      .in("actor_id", userActorIds);

    if (owners?.length) {
      const userIds = owners.map((o) => o.user_id);

      const { data: barberProfiles } = await vportSchema
        .from("profile_categories")
        .select("profile:profiles!inner(actor_id, owner_user_id, is_active)")
        .eq("category_key", "barber")
        .eq("is_primary", true)
        .eq("profile.is_active", true)
        .in("profile.owner_user_id", userIds);

      barberProfiles?.forEach((pc) => {
        if (pc.profile?.actor_id) barberActorIds.push(pc.profile.actor_id);
      });
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

  const uniqueActorIds = [...new Set(barberActorIds)];
  if (!uniqueActorIds.length) return [];

  // Step 4: hydration engine resolves display data — no manual profile selects
  const { rows } = await hydrateAndReturnSummaries({ actorIds: uniqueActorIds });

  const summaryMap = Object.fromEntries(
    rows.map((r) => [r.actor_id ?? r.id, r])
  );

  return uniqueActorIds.map((actorId) => {
    const s = summaryMap[actorId];
    return {
      actorId,
      name: s?.display_name ?? s?.vport_name ?? "Unknown",
      avatar: s?.photo_url ?? s?.vport_avatar_url ?? null,
    };
  });
}
