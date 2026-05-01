import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";

const GROUP_ID = "onboarding";

export const TESTS = [
  { key: "load_onboarding_steps", name: "load vc.onboarding_steps" },
  { key: "load_actor_progress", name: "load vc.actor_onboarding_steps" },
  { key: "save_actor_progress", name: "save/update actor onboarding progress" },
  { key: "load_vibe_catalog", name: "load vc.vibe_tags catalog" },
  { key: "load_actor_vibe_tags", name: "load vc.vibe_actor_tags for actor" },
  { key: "save_vibe_tags", name: "save selected vibe tags" },
  { key: "verify_vibe_tags_reload", name: "reload selected vibe tags persistence" },
];

export function getOnboardingTests() {
  return TESTS.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export async function readActorProgress({ actorId }) {
  const query = {
    select:
      "actor_id,step_key,status,progress,completed_at,last_evaluated_at,meta,updated_at,created_at",
    orderColumn: "updated_at",
  };

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_onboarding_steps")
    .select(query.select)
    .eq("actor_id", actorId)
    .order(query.orderColumn, { ascending: false })
    .limit(20);

  if (error) throw error;

  return {
    rows: data ?? [],
    query,
  };
}

export async function writeActorProgress({ actorId, stepKey }) {
  const nowIso = new Date().toISOString();
  const candidate = {
    conflict: "actor_id,step_key",
    payload: {
      actor_id: actorId,
      step_key: stepKey,
      status: "completed",
      progress: 1,
      completed_at: nowIso,
      last_evaluated_at: nowIso,
      updated_at: nowIso,
      meta: { source: "dev-diagnostics" },
    },
    select:
      "actor_id,step_key,status,progress,completed_at,last_evaluated_at,meta,updated_at,created_at",
  };

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_onboarding_steps")
    .upsert(candidate.payload, { onConflict: candidate.conflict })
    .select(candidate.select)
    .maybeSingle();

  if (error) throw error;

  return {
    row: data ?? null,
    candidate,
  };
}
