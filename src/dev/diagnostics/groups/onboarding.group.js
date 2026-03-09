import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import {
  ensureOnboardingStepSeed,
  ensureVibeTagSeed,
} from "@/dev/diagnostics/helpers/ensureSeedData";
import {
  isMissingColumn,
  isMissingRelation,
  isSeedMissingError,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";

export const GROUP_ID = "onboarding";
export const GROUP_LABEL = "Onboarding";

const TESTS = [
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

async function readActorProgress({ actorId }) {
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

async function writeActorProgress({ actorId, stepKey }) {
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

export async function runOnboardingGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "load_onboarding_steps"),
      name: "load vc.onboarding_steps",
      run: async ({ shared: localShared }) => {
        const seed = await ensureOnboardingStepSeed(localShared);

        const { data, error } = await supabase
          .schema("vc")
          .from("onboarding_steps")
          .select("key,label,description,cta_label,cta_path,sort_order,is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .limit(200);

        if (error) throw error;

        return {
          seededStep: seed,
          count: Array.isArray(data) ? data.length : 0,
          sample: data?.slice(0, 5) ?? [],
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "load_actor_progress"),
      name: "load vc.actor_onboarding_steps",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);

        try {
          const data = await readActorProgress({ actorId });
          return {
            actorId,
            count: data.rows.length,
            rows: data.rows,
            query: data.query,
          };
        } catch (error) {
          if (isMissingRelation(error) || isMissingColumn(error)) {
            return makeSkipped("actor_onboarding_steps table/columns not present", { actorId });
          }
          throw error;
        }
      },
    },
    {
      id: buildTestId(GROUP_ID, "save_actor_progress"),
      name: "save/update actor onboarding progress",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        let step;
        try {
          step = await ensureOnboardingStepSeed(localShared);
        } catch (error) {
          if (isSeedMissingError(error)) {
            return makeSkipped("save actor progress blocked: onboarding step catalog missing", {
              actorId,
              error,
            });
          }
          throw error;
        }
        const stepKey = step?.key;

        if (!stepKey) {
          return makeSkipped("No seeded onboarding step available for actor onboarding save probe", {
            actorId,
          });
        }

        try {
          const write = await writeActorProgress({ actorId, stepKey });
          const read = await readActorProgress({ actorId });

          return {
            actorId,
            stepKey,
            write,
            readBackCount: read.rows.length,
            readBackSample: read.rows.slice(0, 5),
          };
        } catch (error) {
          if (isMissingRelation(error) || isMissingColumn(error)) {
            return makeSkipped("actor_onboarding_steps write path unavailable", { actorId, stepKey });
          }
          throw error;
        }
      },
    },
    {
      id: buildTestId(GROUP_ID, "load_vibe_catalog"),
      name: "load vc.vibe_tags catalog",
      run: async ({ shared: localShared }) => {
        const seededTag = await ensureVibeTagSeed(localShared);

        const { data, error } = await supabase
          .schema("vc")
          .from("vibe_tags")
          .select("key,label,description,icon,category,sort_order,is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .limit(250);

        if (error) throw error;

        return {
          seededTag,
          count: Array.isArray(data) ? data.length : 0,
          sample: data?.slice(0, 8) ?? [],
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "load_actor_vibe_tags"),
      name: "load vc.vibe_actor_tags for actor",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);

        const { data, error } = await supabase
          .schema("vc")
          .from("vibe_actor_tags")
          .select("actor_id,vibe_tag_key,is_void,created_at,created_by_actor_id")
          .eq("actor_id", actorId)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;

        return {
          actorId,
          count: Array.isArray(data) ? data.length : 0,
          rows: data ?? [],
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "save_vibe_tags"),
      name: "save selected vibe tags",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        let seededTag;
        try {
          seededTag = await ensureVibeTagSeed(localShared);
        } catch (error) {
          if (isSeedMissingError(error)) {
            return makeSkipped("save vibe tags blocked: vibe tag catalog missing", {
              actorId,
              error,
            });
          }
          throw error;
        }

        const { error: voidError } = await supabase
          .schema("vc")
          .from("vibe_actor_tags")
          .update({ is_void: true })
          .eq("actor_id", actorId);

        if (voidError) throw voidError;

        const { data, error } = await supabase
          .schema("vc")
          .from("vibe_actor_tags")
          .upsert(
            {
              actor_id: actorId,
              vibe_tag_key: seededTag.key,
              created_by_actor_id: actorId,
              is_void: false,
            },
            { onConflict: "actor_id,vibe_tag_key" }
          )
          .select("actor_id,vibe_tag_key,is_void,created_at,created_by_actor_id")
          .maybeSingle();

        if (error) throw error;

        return {
          actorId,
          tagKey: seededTag.key,
          row: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "verify_vibe_tags_reload"),
      name: "reload selected vibe tags persistence",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);

        const { data, error } = await supabase
          .schema("vc")
          .from("vibe_actor_tags")
          .select("actor_id,vibe_tag_key,is_void,created_at,created_by_actor_id")
          .eq("actor_id", actorId)
          .eq("is_void", false)
          .order("created_at", { ascending: false });

        if (error) throw error;

        return {
          actorId,
          activeTagCount: Array.isArray(data) ? data.length : 0,
          tags: data ?? [],
        };
      },
    },
  ];

  return runDiagnosticsTests({
    group: GROUP_ID,
    tests,
    onTestUpdate,
    shared,
  });
}
