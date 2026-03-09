import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureReportableObject } from "@/dev/diagnostics/helpers/ensureSeedData";
import {
  isPermissionDenied,
  isRlsDenied,
  isSeedMissingError,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";

export const GROUP_ID = "reports";
export const GROUP_LABEL = "Reporting / Moderation";

const TESTS = [
  { key: "create_report", name: "create report in vc.reports" },
  { key: "create_report_event", name: "create report event in vc.report_events" },
  { key: "read_report", name: "read created report" },
  { key: "read_report_events", name: "read created report events" },
  { key: "delete_report_blocked", name: "verify report delete is blocked for authenticated client" },
  { key: "create_moderation_action", name: "create moderation action if allowed" },
  { key: "delete_moderation_action_blocked", name: "verify moderation action delete is blocked for authenticated client" },
  { key: "rls_signal", name: "surface moderation permission boundaries" },
];

export function getReportsTests() {
  return TESTS.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

function getState(shared) {
  if (!shared.cache.reportsState) {
    shared.cache.reportsState = {};
  }
  return shared.cache.reportsState;
}

export async function runReportsGroup({ onTestUpdate, shared }) {
  function skipIfSeedMissing(error, reason, extra = null) {
    if (!isSeedMissingError(error)) {
      throw error;
    }
    return makeSkipped(reason, {
      ...extra,
      error,
    });
  }

  const tests = [
    {
      id: buildTestId(GROUP_ID, "create_report"),
      name: "create report in vc.reports",
      run: async ({ shared: localShared }) => {
        const { actorId, userId } = await ensureActorContext(localShared);
        let reportable;
        try {
          reportable = await ensureReportableObject(localShared);
        } catch (error) {
          return skipIfSeedMissing(error, "create report blocked: required realm seed is missing", {
            actorId,
          });
        }
        const state = getState(localShared);

        const dedupeKey = `diag-report-${String(userId).replace(/-/g, "").slice(0, 10)}-${Date.now()}`;

        const { data, error } = await supabase
          .schema("vc")
          .from("reports")
          .insert({
            reporter_actor_id: actorId,
            object_type: "post",
            object_id: reportable.postId,
            post_id: reportable.postId,
            reason_code: "spam",
            reason_text: "Diagnostics report smoke test",
            status: "open",
            priority: 3,
            dedupe_key: dedupeKey,
          })
          .select(
            "id,reporter_actor_id,object_type,object_id,post_id,reason_code,reason_text,status,priority,dedupe_key,created_at,updated_at"
          )
          .maybeSingle();

        if (error) throw error;

        state.report = data;

        return {
          report: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_report_event"),
      name: "create report event in vc.report_events",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        const state = getState(localShared);
        const reportId = state.report?.id;

        if (!reportId) {
          return makeSkipped("Report must be created before creating report event.");
        }

        const payload = {
          report_id: reportId,
          actor_id: actorId,
          event_type: "note_added",
          data: {
            source: "dev-diagnostics",
            ts: new Date().toISOString(),
          },
        };

        const { data, error } = await supabase
          .schema("vc")
          .from("report_events")
          .insert(payload)
          .select("id,report_id,actor_id,event_type,data,created_at")
          .maybeSingle();

        if (error) {
          if (isRlsDenied(error) || isPermissionDenied(error)) {
            return makeSkipped("report_events insert blocked by RLS/policy", {
              reportId,
              actorId,
              error,
            });
          }
          throw error;
        }

        state.reportEvent = data;

        return {
          reportEvent: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "read_report"),
      name: "read created report",
      run: async ({ shared: localShared }) => {
        const state = getState(localShared);
        const reportId = state.report?.id;

        if (!reportId) {
          return makeSkipped("Report must be created before read_report.");
        }

        const { data, error } = await supabase
          .schema("vc")
          .from("reports")
          .select(
            "id,reporter_actor_id,object_type,object_id,post_id,reason_code,reason_text,status,priority,created_at,updated_at"
          )
          .eq("id", reportId)
          .maybeSingle();

        if (error) throw error;

        return {
          reportId,
          report: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "read_report_events"),
      name: "read created report events",
      run: async ({ shared: localShared }) => {
        const state = getState(localShared);
        const reportId = state.report?.id;

        if (!reportId) {
          return makeSkipped("Report must be created before read_report_events.");
        }

        const { data, error } = await supabase
          .schema("vc")
          .from("report_events")
          .select("id,report_id,actor_id,event_type,data,created_at")
          .eq("report_id", reportId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) {
          if (isRlsDenied(error) || isPermissionDenied(error)) {
            return makeSkipped("report_events read blocked by RLS/policy", {
              reportId,
              error,
            });
          }
          throw error;
        }

        return {
          reportId,
          count: Array.isArray(data) ? data.length : 0,
          events: data ?? [],
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "delete_report_blocked"),
      name: "verify report delete is blocked for authenticated client",
      run: async ({ shared: localShared }) => {
        const state = getState(localShared);
        const reportId = state.report?.id;

        if (!reportId) {
          return makeSkipped("Report must be created before delete_report_blocked.");
        }

        const { data: deleteRow, error: deleteError } = await supabase
          .schema("vc")
          .from("reports")
          .delete()
          .eq("id", reportId)
          .select("id")
          .maybeSingle();

        if (deleteError) {
          if (isRlsDenied(deleteError) || isPermissionDenied(deleteError)) {
            return {
              reportId,
              deleteBlocked: true,
              permissionDenied: true,
              error: deleteError,
            };
          }
          throw deleteError;
        }

        const { data: afterRow, error: afterError } = await supabase
          .schema("vc")
          .from("reports")
          .select("id")
          .eq("id", reportId)
          .maybeSingle();

        if (afterError) throw afterError;

        if (afterRow?.id) {
          return {
            reportId,
            deleteBlocked: true,
            permissionDenied: false,
            deleteRow: deleteRow ?? null,
            existsAfterAttempt: true,
          };
        }

        throw new Error(
          `Delete boundary failed: authenticated client deleted report ${reportId}. Expected service-only delete.`
        );
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_moderation_action"),
      name: "create moderation action if allowed",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);
        let reportable;
        try {
          reportable = await ensureReportableObject(localShared);
        } catch (error) {
          return skipIfSeedMissing(
            error,
            "create moderation action blocked: required realm seed is missing",
            { actorId }
          );
        }
        const state = getState(localShared);
        const reportId = state.report?.id ?? null;

        const { data, error } = await supabase
          .schema("vc")
          .from("moderation_actions")
          .insert({
            actor_id: actorId,
            report_id: reportId,
            object_type: "post",
            object_id: reportable.postId,
            action_type: "hide",
            reason: "Diagnostics moderation action",
          })
          .select("id,actor_id,report_id,object_type,object_id,action_type,reason,created_at")
          .maybeSingle();

        if (error) {
          if (isRlsDenied(error) || isPermissionDenied(error)) {
            return makeSkipped("moderation_actions insert blocked by RLS/policy", {
              actorId,
              reportId,
              error,
            });
          }
          throw error;
        }

        state.moderationAction = data;

        return {
          moderationAction: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "delete_moderation_action_blocked"),
      name: "verify moderation action delete is blocked for authenticated client",
      run: async ({ shared: localShared }) => {
        const state = getState(localShared);
        const moderationActionId = state.moderationAction?.id;

        if (!moderationActionId) {
          return makeSkipped(
            "Moderation action must be created before delete_moderation_action_blocked."
          );
        }

        const { data: deleteRow, error: deleteError } = await supabase
          .schema("vc")
          .from("moderation_actions")
          .delete()
          .eq("id", moderationActionId)
          .select("id")
          .maybeSingle();

        if (deleteError) {
          if (isRlsDenied(deleteError) || isPermissionDenied(deleteError)) {
            return {
              moderationActionId,
              deleteBlocked: true,
              permissionDenied: true,
              error: deleteError,
            };
          }
          throw deleteError;
        }

        const { data: afterRow, error: afterError } = await supabase
          .schema("vc")
          .from("moderation_actions")
          .select("id")
          .eq("id", moderationActionId)
          .maybeSingle();

        if (afterError) throw afterError;

        if (afterRow?.id) {
          return {
            moderationActionId,
            deleteBlocked: true,
            permissionDenied: false,
            deleteRow: deleteRow ?? null,
            existsAfterAttempt: true,
          };
        }

        throw new Error(
          `Delete boundary failed: authenticated client deleted moderation action ${moderationActionId}. Expected service-only delete.`
        );
      },
    },
    {
      id: buildTestId(GROUP_ID, "rls_signal"),
      name: "surface moderation permission boundaries",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);

        const { data, error } = await supabase
          .schema("vc")
          .from("moderation_actions")
          .select("id,actor_id,object_type,object_id,action_type,created_at")
          .neq("actor_id", actorId)
          .limit(5);

        if (error) {
          if (isRlsDenied(error) || isPermissionDenied(error)) {
            return {
              permissionBoundaryVisible: true,
              readBlocked: true,
              error,
            };
          }

          throw error;
        }

        return {
          permissionBoundaryVisible: false,
          sampleCount: Array.isArray(data) ? data.length : 0,
          sample: data ?? [],
          note:
            "Cross-actor moderation rows were readable from current context. Confirm this matches intended RLS behavior.",
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
