import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { isPermissionDenied, makeSkipped } from "@/dev/diagnostics/helpers/supabaseAssert";

export const GROUP_ID = "design";
export const GROUP_LABEL = "Design";

const TESTS = [
  { key: "create_document", name: "create design document" },
  { key: "create_page", name: "create design page" },
  { key: "create_page_version", name: "create design page version" },
  { key: "create_export", name: "create design export row" },
  { key: "create_render_job", name: "create design render job row" },
  { key: "verify_chain", name: "verify document/page/version/export/job chain" },
];

export function getDesignTests() {
  return TESTS.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

function getState(shared) {
  if (!shared.cache.designState) {
    shared.cache.designState = {};
  }
  return shared.cache.designState;
}

export async function runDesignGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "create_document"),
      name: "create design document",
      run: async ({ shared: localShared }) => {
        const { actorId, userId } = await ensureActorContext(localShared);
        const state = getState(localShared);

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
        const state = getState(localShared);
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
        const state = getState(localShared);
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
        const state = getState(localShared);
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
        const state = getState(localShared);

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
    {
      id: buildTestId(GROUP_ID, "verify_chain"),
      name: "verify document/page/version/export/job chain",
      run: async ({ shared: localShared }) => {
        const state = getState(localShared);
        if (!state.documentId) {
          return makeSkipped("Document missing before verify_chain test.");
        }

        const [docRes, pageRes, versionRes, exportRes, jobRes] = await Promise.all([
          supabase
            .schema("vc")
            .from("design_documents")
            .select("id,owner_actor_id,title,kind,is_deleted,created_at,updated_at")
            .eq("id", state.documentId)
            .maybeSingle(),
          state.pageId
            ? supabase
                .schema("vc")
                .from("design_pages")
                .select("id,document_id,page_order,width,height,background,current_version_id,created_at,updated_at")
                .eq("id", state.pageId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          state.versionId
            ? supabase
                .schema("vc")
                .from("design_page_versions")
                .select("id,page_id,version,content,created_by_actor_id,created_at")
                .eq("id", state.versionId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          state.exportId
            ? supabase
                .schema("vc")
                .from("design_exports")
                .select(
                  "id,document_id,page_id,format,status,url,mime,size_bytes,width,height,page_count,error,requested_by_actor_id,created_at,updated_at"
                )
                .eq("id", state.exportId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          state.jobId
            ? supabase
                .schema("vc")
                .from("design_render_jobs")
                .select(
                  "id,export_id,document_id,page_id,version_id,priority,status,attempts,max_attempts,locked_at,locked_by,run_after,error,created_at,updated_at"
                )
                .eq("id", state.jobId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        const readChecks = [
          { key: "design_documents", res: docRes },
          { key: "design_pages", res: pageRes },
          { key: "design_page_versions", res: versionRes },
          { key: "design_exports", res: exportRes },
          { key: "design_render_jobs", res: jobRes },
        ];

        for (const check of readChecks) {
          if (!check.res?.error) continue;
          if (isPermissionDenied(check.res.error)) {
            return makeSkipped(`${check.key} read blocked by RLS/policy`, { error: check.res.error });
          }
          throw check.res.error;
        }

        return {
          document: docRes.data,
          page: pageRes.data,
          version: versionRes.data,
          exportRow: exportRes.data,
          renderJob: jobRes.data,
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
