import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureReportableObject } from "@/dev/diagnostics/helpers/ensureSeedData";
import { isPermissionDenied, isRlsDenied, makeSkipped } from "@/dev/diagnostics/helpers/supabaseAssert";
import {
  getReportsState,
  skipIfSeedMissing,
  deleteReportBlockedTest,
  deleteModerationActionBlockedTest,
} from "@/dev/diagnostics/groups/reports.group.helpers";
export { getReportsTests } from "@/dev/diagnostics/groups/reports.group.helpers";

export const GROUP_ID = "reports";
export const GROUP_LABEL = "Reporting / Moderation";

export async function runReportsGroup({ onTestUpdate, shared }) {
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
        const state = getReportsState(localShared);

        const dedupeKey = `diag-report-${String(userId).replace(/-/g, "").slice(0, 10)}-${Date.now()}`;

        const { data, error } = await supabase
          .schema("moderation")
          .from("reports")
          .insert({
            reporter_domain: "vc",
            reporter_actor_id: actorId,
            target_domain: "vc",
            target_type: "post",
            target_id: reportable.postId,
            reason_code: "spam",
            reason_text: "Diagnostics report smoke test",
            status: "open",
            priority: 3,
            dedupe_key: dedupeKey,
            meta: { postId: reportable.postId },
          })
          .select(
            "id,reporter_domain,reporter_actor_id,target_domain,target_type,target_id,reason_code,reason_text,status,priority,dedupe_key,meta,created_at,updated_at"
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
        const state = getReportsState(localShared);
        const reportId = state.report?.id;

        if (!reportId) {
          return makeSkipped("Report must be created before creating report event.");
        }

        const payload = {
          report_id: reportId,
          actor_domain: "vc",
          actor_id: actorId,
          event_type: "note_added",
          data: {
            source: "dev-diagnostics",
            ts: new Date().toISOString(),
          },
        };

        const { data, error } = await supabase
          .schema("moderation")
          .from("report_events")
          .insert(payload)
          .select("id,report_id,actor_domain,actor_id,event_type,data,created_at")
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
        const state = getReportsState(localShared);
        const reportId = state.report?.id;

        if (!reportId) {
          return makeSkipped("Report must be created before read_report.");
        }

        const { data, error } = await supabase
          .schema("moderation")
          .from("reports")
          .select(
            "id,reporter_domain,reporter_actor_id,target_domain,target_type,target_id,reason_code,reason_text,status,priority,meta,created_at,updated_at"
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
        const state = getReportsState(localShared);
        const reportId = state.report?.id;

        if (!reportId) {
          return makeSkipped("Report must be created before read_report_events.");
        }

        const { data, error } = await supabase
          .schema("moderation")
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
    deleteReportBlockedTest,
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
        const state = getReportsState(localShared);
        const reportId = state.report?.id ?? null;

        const { data, error } = await supabase
          .schema("moderation")
          .from("actions")
          .insert({
            actor_domain: "vc",
            actor_id: actorId,
            report_id: reportId,
            target_domain: "vc",
            target_type: "post",
            target_id: reportable.postId,
            action_type: "hide",
            reason: "Diagnostics moderation action",
            meta: {},
          })
          .select("id,actor_domain,actor_id,report_id,target_domain,target_type,target_id,action_type,reason,meta,created_at")
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
    deleteModerationActionBlockedTest,
    {
      id: buildTestId(GROUP_ID, "rls_signal"),
      name: "surface moderation permission boundaries",
      run: async ({ shared: localShared }) => {
        const { actorId } = await ensureActorContext(localShared);

        const { data, error } = await supabase
          .schema("moderation")
          .from("actions")
          .select("id,actor_id,target_type,target_id,action_type,created_at")
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
