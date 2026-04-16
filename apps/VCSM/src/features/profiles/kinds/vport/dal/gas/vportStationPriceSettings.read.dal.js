import vportSchema from "@/services/supabase/vportClient";

const SETTINGS_SELECT =
  "profile_id,show_community_suggestion,require_sanity_for_suggestion,min_price,max_price,max_delta_abs,max_delta_pct,updated_at";

async function resolveProfileId(actorId) {
  const { data } = await vportSchema
    .from("profiles")
    .select("id")
    .eq("actor_id", actorId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function fetchVportStationPriceSettingsDAL({ targetActorId }) {
  if (!targetActorId) return { data: null, error: null };

  const profileId = await resolveProfileId(targetActorId);
  if (!profileId) return { data: null, error: null };

  return vportSchema
    .from("station_price_settings")
    .select(SETTINGS_SELECT)
    .eq("profile_id", profileId)
    .maybeSingle();
}
