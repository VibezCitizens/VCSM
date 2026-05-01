import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { isPermissionDenied, makeSkipped } from "@/dev/diagnostics/helpers/supabaseAssert";
import {
  getDesignState,
  verifyDesignChainTest,
} from "@/dev/diagnostics/groups/design.group.helpers";
export { getDesignTests } from "@/dev/diagnostics/groups/design.group.helpers";

export const GROUP_ID = "design";
export const GROUP_LABEL = "Design";

export async function runDesignGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "create_document"),
      name: "create design document",
      run: async ({ shared: localShared }) => {
        const { actorId, userId } = await ensureActorContext(localShared);
        const state = getDesignState(localShared);

        const { data, error } = await supabase
          .schema("vc")
          .from("design_documents")
          .insert({
            owner_actor_id: actorId,
            title: `Diagnostics Design ${String(userId).slice(0, 8)} ${Date.now()}`,
            kind: "flyer",
            is_deleted: false,
          })
          .select("id,owner_actor_id,title,kind,is_deleted,created_at,updated_at")
          .maybeSingle();

        if (error) {
          if (isPermissionDenied(error)) {
            return makeSkipped("design_documents write blocked by RLS/policy", { error });
          }
          throw error;
        }

        state.documentId = data?.id ?? null;

        return {
          document: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_page"),
      name: "create design page",
      run: async ({ shared: localShared }) => {
        const state = getDesignState(localShared);
        if (!state.documentId) {
          return makeSkipped("Document missing before create_page test.");
        }

        const { data, error } = await supabase
          .schema("vc")
          .from("design_pages")
          .insert({
            document_id: state.documentId,
            page_order: 1,
            width: 1080,
            height: 1920,
            background: "#111111",
          })
          .select("id,document_id,page_order,width,height,background,current_version_id,created_at,updated_at")
          .maybeSingle();

        if (error) {
          if (isPermissionDenied(error)) {
            return makeSkipped("design_pages write blocked by RLS/policy", { error });
          }
          throw error;
        }

        state.pageId = data?.id ?? null;

        return {
          page: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_page_version"),
      name: "create design page version",
      run: async ({ shared: localShared }) => {
        const state = getDesignState(localShared);
        const { actorId } = await ensureActorContext(localShared);

        if (!state.pageId) {
          return makeSkipped("Page missing before create_page_version test.");
        }

        const { data, error } = await supabase
          .schema("vc")
          .from("design_page_versions")
          .insert({
            page_id: state.pageId,
            version: 1,
            content: {
              nodes: [],
              meta: { source: "diagnostics" },
            },
            created_by_actor_id: actorId,
          })
          .select("id,page_id,version,content,created_by_actor_id,created_at")
          .maybeSingle();

        if (error) {
          if (isPermissionDenied(error)) {
            return makeSkipped("design_page_versions write blocked by RLS/policy", { error });
          }
          throw error;
        }

        state.versionId = data?.id ?? null;

        await supabase
          .schema("vc")
          .from("design_pages")
          .update({ current_version_id: state.versionId })
          .eq("id", state.pageId);

        return {
          version: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_export"),
      name: "create design export row",
      run: async ({ shared: localShared }) => {
        const state = getDesignState(localShared);
        const { actorId } = await ensureActorContext(localShared);

        if (!state.documentId) {
          return makeSkipped("Document missing before create_export test.");
        }

        const { data, error } = await supabase
          .schema("vc")
          .from("design_exports")
          .insert({
            document_id: state.documentId,
            page_id: state.pageId ?? null,
            format: "png",
            status: "queued",
            requested_by_actor_id: actorId,
          })
          .select(
            "id,document_id,page_id,format,status,url,mime,size_bytes,width,height,page_count,error,requested_by_actor_id,created_at,updated_at"
          )
          .maybeSingle();

        if (error) {
          if (isPermissionDenied(error)) {
            return makeSkipped("design_exports write blocked by RLS/policy", { error });
          }
          throw error;
        }

        state.exportId = data?.id ?? null;

        return {
          exportRow: data,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_render_job"),
      name: "create design render job row",
      run: async ({ shared: localShared }) => {
        const state = getDesignState(localShared);

        if (!state.documentId || !state.exportId) {
          return makeSkipped("Document/export missing before create_render_job test.");
        }

        const { data, error } = await supabase
          .schema("vc")
          .from("design_render_jobs")
          .insert({
            export_id: state.exportId,
            document_id: state.documentId,
            page_id: state.pageId ?? null,
            version_id: state.versionId ?? null,
            priority: 5,
            status: "queued",
            attempts: 0,
            max_attempts: 3,
            run_after: new Date().toISOString(),
          })
          .select(
            "id,export_id,document_id,page_id,version_id,priority,status,attempts,max_attempts,locked_at,locked_by,run_after,error,created_at,updated_at"
          )
          .maybeSingle();

        if (error) {
          if (isPermissionDenied(error)) {
            return makeSkipped("design_render_jobs write blocked by RLS/policy", { error });
          }
          throw error;
        }

        state.jobId = data?.id ?? null;

        return {
          renderJob: data,
        };
      },
    },
    verifyDesignChainTest,
  ];

  return runDiagnosticsTests({
    group: GROUP_ID,
    tests,
    onTestUpdate,
    shared,
  });
}
