import { supabase } from "@/services/supabase/supabaseClient";
import vportSchema from "@/services/supabase/vportClient";

const DEDUP_WINDOW_MS = 60 * 60 * 1000;

export async function resolveVportLocksmithNameDAL(actorId) {
  if (!actorId) return null;
  const { data } = await vportSchema
    .from("profiles")
    .select("name")
    .eq("actor_id", actorId)
    .maybeSingle();
  return data?.name ?? null;
}

export async function hasRecentLocksmithServiceAreaPostDAL({ actorId, windowMs = DEDUP_WINDOW_MS }) {
  if (!actorId) return false;
  const since = new Date(Date.now() - windowMs).toISOString();
  const { data, error } = await supabase
    .schema("vc")
    .from("posts")
    .select("id")
    .eq("actor_id", actorId)
    .eq("post_type", "locksmith_service_area_update")
    .is("deleted_at", null)
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function hasRecentLocksmithHoursPostDAL({ actorId, windowMs = DEDUP_WINDOW_MS }) {
  if (!actorId) return false;
  const since = new Date(Date.now() - windowMs).toISOString();
  const { data, error } = await supabase
    .schema("vc")
    .from("posts")
    .select("id")
    .eq("actor_id", actorId)
    .eq("post_type", "locksmith_hours_update")
    .is("deleted_at", null)
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function hasRecentLocksmithPortfolioPostDAL({ actorId, windowMs = DEDUP_WINDOW_MS }) {
  if (!actorId) return false;
  const since = new Date(Date.now() - windowMs).toISOString();
  const { data, error } = await supabase
    .schema("vc")
    .from("posts")
    .select("id")
    .eq("actor_id", actorId)
    .eq("post_type", "locksmith_portfolio_update")
    .is("deleted_at", null)
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}
