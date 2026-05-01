import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import {
  isPermissionDenied,
  isRlsDenied,
  isSeedMissingError,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";

const GROUP_ID = "reports";

export const TESTS = [
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

export function getReportsState(shared) {
  if (!shared.cache.reportsState) {
    shared.cache.reportsState = {};
  }
  return shared.cache.reportsState;
}

export function skipIfSeedMissing(error, reason, extra = null) {
  if (!isSeedMissingError(error)) {
    throw error;
  }
  return makeSkipped(reason, {
    ...extra,
    error,
  });
}

export const deleteReportBlockedTest = {
  id: buildTestId(GROUP_ID, "delete_report_blocked"),
  name: "verify report delete is blocked for authenticated client",
  run: async ({ shared: localShared }) => {
    const state = getReportsState(localShared);
    const reportId = state.report?.id;

    if (!reportId) {
      return makeSkipped("Report must be created before delete_report_blocked.");
    }

    const { data: deleteRow, error: deleteError } = await supabase
      .schema("moderation")
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
      .schema("moderation")
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
};

export const deleteModerationActionBlockedTest = {
  id: buildTestId(GROUP_ID, "delete_moderation_action_blocked"),
  name: "verify moderation action delete is blocked for authenticated client",
  run: async ({ shared: localShared }) => {
    const state = getReportsState(localShared);
    const moderationActionId = state.moderationAction?.id;

    if (!moderationActionId) {
      return makeSkipped(
        "Moderation action must be created before delete_moderation_action_blocked."
      );
    }

    const { data: deleteRow, error: deleteError } = await supabase
      .schema("moderation")
      .from("actions")
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
      .schema("moderation")
      .from("actions")
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
};
