import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import {
  isMissingColumn,
  isPermissionDenied,
  isRlsDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";

export const GROUP_ID = "notifications";
export const GROUP_LABEL = "Notifications";

const TESTS = [
  { key: "read_owned", name: "read notifications for owned actor" },
  { key: "create_if_allowed", name: "create notification if allowed" },
  { key: "recipient_scope", name: "verify recipient ownership scoping" },
];

export function getNotificationsTests() {
  return TESTS.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

function getState(shared) {
  if (!shared.cache.notificationsState) {
    shared.cache.notificationsState = {};
  }
  return shared.cache.notificationsState;
}

async function resolveForeignActorId(actorId) {
  const { data, error } = await supabase
    .schema("vc")
    .from("actor_presentation")
    .select("actor_id")
    .neq("actor_id", actorId)
    .limit(1);

  if (error) throw error;
  return data?.[0]?.actor_id ?? null;
}

async function createNotificationProbe({ actorId }) {
  const candidates = [
    {
      payload: {
        recipient_actor_id: actorId,
        actor_id: actorId,
        kind: "diagnostics",
        data: { source: "dev-diagnostics", ts: new Date().toISOString() },
      },
      select: "id,recipient_actor_id,actor_id,kind,data,created_at,is_read",
    },
    {
      payload: {
        recipient_actor_id: actorId,
        actor_id: actorId,
        kind: "diagnostics",
        data: { source: "dev-diagnostics", ts: new Date().toISOString() },
      },
      select: "id,recipient_actor_id,actor_id,kind,data,created_at,is_read",
    },
    {
      payload: {
        recipient_actor_id: actorId,
        actor_id: actorId,
        kind: "diagnostics",
      },
      select: "id,recipient_actor_id,actor_id,kind,data,created_at,is_read",
    },
  ];

  let lastError = null;

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .schema("vc")
      .from("notifications")
      .insert(candidate.payload)
      .select(candidate.select)
      .maybeSingle();

    if (!error) {
      return {
        row: data,
        candidate,
      };
    }

    lastError = error;

    if (!isMissingColumn(error)) {
      break;
    }
  }

  throw lastError ?? new Error("Unable to insert diagnostics notification with known payload shapes.");
}

export async function runNotificationsGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "read_owned"),
      name: "read notifications for owned actor",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);

        const { data, error } = await supabase
          .schema("vc")
          .from("notifications")
          .select("id,recipient_actor_id,actor_id,kind,data,created_at,is_read")
          .eq("recipient_actor_id", actorId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) {
          if (isPermissionDenied(error) || isRlsDenied(error)) {
            return makeSkipped("notifications read blocked by RLS/policy", {
              actorId,
              error,
            });
          }
          throw error;
        }

        return {
          actorId,
          count: Array.isArray(data) ? data.length : 0,
          rows: data ?? [],
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_if_allowed"),
      name: "create notification if allowed",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        const state = getState(localShared);

        try {
          const created = await createNotificationProbe({ actorId });
          state.notificationId = created.row?.id ?? null;

          return {
            actorId,
            created,
          };
        } catch (error) {
          if (isPermissionDenied(error) || isRlsDenied(error)) {
            return makeSkipped("notifications insert blocked by RLS/policy", {
              actorId,
              error,
            });
          }
          throw error;
        }
      },
    },
    {
      id: buildTestId(GROUP_ID, "recipient_scope"),
      name: "verify recipient ownership scoping",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        const foreignActorId = await resolveForeignActorId(actorId);

        if (!foreignActorId) {
          return makeSkipped("No foreign actor available for recipient scope probe");
        }

        const { data, error } = await supabase
          .schema("vc")
          .from("notifications")
          .select("id,recipient_actor_id,actor_id,kind,data,created_at,is_read")
          .eq("recipient_actor_id", foreignActorId)
          .limit(5);

        if (error) {
          if (isPermissionDenied(error) || isRlsDenied(error)) {
            return {
              boundaryRespected: true,
              foreignActorId,
              error,
            };
          }
          throw error;
        }

        if (Array.isArray(data) && data.length > 0) {
          throw new Error(
            `Recipient scope boundary failed: diagnostics can read ${data.length} notifications for non-owned actor ${foreignActorId}.`
          );
        }

        return {
          boundaryRespected: true,
          foreignActorId,
          rowsVisible: 0,
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
