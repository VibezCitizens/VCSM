import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureAuthContext } from "@/dev/diagnostics/helpers/ensureAuthContext";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureOnboardingStepSeed } from "@/dev/diagnostics/helpers/ensureSeedData";
import {
  isMissingColumn,
  isMissingRelation,
  isSeedMissingError,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";

export const GROUP_ID = "actorSystem";
export const GROUP_LABEL = "Actor System";

const TESTS = [
  { key: "resolve_auth_user", name: "resolve authenticated user" },
  { key: "ensure_profile_actor", name: "ensure user profile + actor exists" },
  { key: "ensure_actor_ownership", name: "verify actor ownership row exists" },
  { key: "actor_presentation_read", name: "verify actor presentation hydration source" },
  { key: "actor_privacy_read", name: "verify actor privacy row can be read" },
  { key: "actor_onboarding_rw", name: "verify actor onboarding rows read/write" },
];

export function getActorSystemTests() {
  return TESTS.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

async function upsertActorOnboardingProgress({ actorId, stepKey }) {
  const nowIso = new Date().toISOString();
  const payload = {
    actor_id: actorId,
    step_key: stepKey,
    status: "completed",
    progress: 1,
    completed_at: nowIso,
    last_evaluated_at: nowIso,
    updated_at: nowIso,
    meta: { source: "dev-diagnostics" },
  };

  const selectFields =
    "actor_id,step_key,status,progress,completed_at,last_evaluated_at,meta,created_at,updated_at";

  const { data: writeRow, error: writeError } = await supabase
    .schema("vc")
    .from("actor_onboarding_steps")
    .upsert(payload, { onConflict: "actor_id,step_key" })
    .select(selectFields)
    .maybeSingle();

  if (writeError) throw writeError;

  const { data: readRow, error: readError } = await supabase
    .schema("vc")
    .from("actor_onboarding_steps")
    .select(selectFields)
    .eq("actor_id", actorId)
    .eq("step_key", stepKey)
    .maybeSingle();

  if (readError) throw readError;

  return {
    writeRow,
    readRow,
    candidate: {
      conflict: "actor_id,step_key",
      select: selectFields,
      readEq: { column: "step_key", value: stepKey },
    },
  };
}

export async function runActorSystemGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "resolve_auth_user"),
      name: "resolve authenticated user",
      run: async ({ shared: localShared }) => {
        const auth = await ensureAuthContext(localShared);
        return {
          userId: auth.userId,
          email: auth.email,
          hasSession: Boolean(auth.session),
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "ensure_profile_actor"),
      name: "ensure user profile + actor exists",
      run: async ({ shared: localShared }) => {
        const ctx = await ensureActorContext(localShared);

        return {
          userId: ctx.userId,
          profileId: ctx.profile?.id ?? null,
          actorId: ctx.actorId,
          actorKind: ctx.actor?.kind ?? null,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "ensure_actor_ownership"),
      name: "verify actor ownership row exists",
      run: async ({ shared: localShared }) => {
        const ctx = await ensureActorContext(localShared);

        const { data, error } = await supabase
          .schema("vc")
          .from("actor_owners")
          .select("actor_id,user_id,is_primary,created_at")
          .eq("actor_id", ctx.actorId)
          .eq("user_id", ctx.userId)
          .maybeSingle();

        if (error) throw error;

        return {
          actorOwnerRow: data,
          exists: Boolean(data?.actor_id),
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "actor_presentation_read"),
      name: "verify actor presentation hydration source",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);

        const { data, error } = await supabase
          .schema("vc")
          .from("actor_presentation")
          .select(
            "actor_id,kind,display_name,username,photo_url,vport_name,vport_slug,vport_avatar_url"
          )
          .eq("actor_id", actorId)
          .maybeSingle();

        if (error) throw error;

        return {
          actorId,
          actorPresentation: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "actor_privacy_read"),
      name: "verify actor privacy row can be read",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);

        const { data, error } = await supabase
          .schema("vc")
          .from("actor_privacy_settings")
          .select("actor_id,is_private,updated_at")
          .eq("actor_id", actorId)
          .maybeSingle();

        if (error) throw error;

        return {
          actorId,
          row: data ?? null,
          resolvedPrivate: data?.is_private ?? false,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "actor_onboarding_rw"),
      name: "verify actor onboarding rows read/write",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        let step;
        try {
          step = await ensureOnboardingStepSeed(localShared);
        } catch (error) {
          if (isSeedMissingError(error)) {
            return makeSkipped("actor onboarding read/write blocked: onboarding step catalog missing", {
              actorId,
              error,
            });
          }
          throw error;
        }
        const stepKey = step?.key;

        if (!stepKey) {
          return makeSkipped("No seeded onboarding step available for actor onboarding write probe");
        }

        try {
          const payload = await upsertActorOnboardingProgress({ actorId, stepKey });
          return {
            actorId,
            stepKey,
            ...payload,
          };
        } catch (error) {
          if (isMissingRelation(error) || isMissingColumn(error)) {
            return makeSkipped("actor_onboarding_steps table/columns not present in this environment", {
              actorId,
              stepKey,
            });
          }
          throw error;
        }
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
