import vportSchema from "@/services/supabase/vportClient";
import { createTTLCache } from "@/shared/lib/ttlCache";
import { resolveVportProfileId } from "@/shared/lib/vport/resolveVportProfileId";

// Settings change infrequently (only via a dedicated settings UI, not the gas tab).
// 5-minute TTL reduces DB calls on every gas tab mount and every price submit.
const settingsCache = createTTLCache(300_000);

const SETTINGS_SELECT =
  "profile_id,show_community_suggestion,require_sanity_for_suggestion,min_price,max_price,max_delta_abs,max_delta_pct,updated_at";

export async function fetchVportStationPriceSettingsDAL({ targetActorId }) {
  if (!targetActorId) return { data: null, error: null };

  // Settings data may legitimately be null (station with no settings row), so a
  // value check can't distinguish "cached null" from a miss. Use has() to gate the
  // cached return — createTTLCache.get() returns null on a miss, not undefined.
  if (settingsCache.has(targetActorId)) {
    return { data: settingsCache.get(targetActorId), error: null };
  }

  const profileId = await resolveVportProfileId(targetActorId);
  if (!profileId) return { data: null, error: null };

  const result = await vportSchema
    .from("station_price_settings")
    .select(SETTINGS_SELECT)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!result.error) {
    settingsCache.set(targetActorId, result.data);
  }

  return result;
}

// Exported for future use when a settings write path is added to this module.
export function invalidateSettingsCache(actorId) {
  settingsCache.invalidate(actorId);
}
