import vportSchema from "@/services/supabase/vportClient";

const COLS = "id, name, resource_type, is_active, member_actor_id, sort_order, meta, profile_id";
const COLS_WITH_SHOP = `${COLS}, barbershop:profiles!profile_id(id, name, actor_id)`;

export async function fetchResourceByIdDAL(resourceId) {
  if (!resourceId) return null;

  const { data, error } = await vportSchema
    .from("resources")
    .select(COLS)
    .eq("id", resourceId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function fetchPendingTeamRequestsForBarberDAL(barberVportActorId) {
  if (!barberVportActorId) return [];

  const { data, error } = await vportSchema
    .from("resources")
    .select(COLS_WITH_SHOP)
    .eq("member_actor_id", barberVportActorId)
    .filter("meta->>status", "eq", "pending_acceptance")
    .eq("resource_type", "staff");

  if (error) throw error;
  return data ?? [];
}

export async function fetchAllTeamRequestsForBarberDAL(barberVportActorId) {
  if (!barberVportActorId) return [];

  const { data, error } = await vportSchema
    .from("resources")
    .select(COLS_WITH_SHOP)
    .eq("member_actor_id", barberVportActorId)
    .eq("resource_type", "staff");

  if (error) throw error;
  return data ?? [];
}
