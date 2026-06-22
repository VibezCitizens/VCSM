// Two schema selectors from the same Supabase connection — not two separate projects.
//   vportSchema → vport.* tables (station profiles, settings, fuel prices)
//   supabase    → vc.* tables (posts, actors, feeds)
import { supabase } from "@/services/supabase/supabaseClient";
import vportSchema from "@/services/supabase/vportClient";

const DEDUP_SELECT = "id";
const DEDUP_WINDOW_MS = 60 * 60 * 1000;

export async function resolveVportStationNameDAL(actorId) {
  if (!actorId) return null;
  const { data } = await vportSchema
    .from("profiles")
    .select("name")
    .eq("actor_id", actorId)
    .maybeSingle();
  return data?.name ?? null;
}

export async function hasRecentFuelPricePostDAL({ actorId, windowMs = DEDUP_WINDOW_MS }) {
  if (!actorId) return false;

  const since = new Date(Date.now() - windowMs).toISOString();

  const { data, error } = await supabase
    .schema("vc")
    .from("posts")
    .select(DEDUP_SELECT)
    .eq("actor_id", actorId)
    .eq("post_type", "fuel_price_update")
    .is("deleted_at", null)
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
