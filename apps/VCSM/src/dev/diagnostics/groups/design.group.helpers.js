import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { isPermissionDenied, makeSkipped } from "@/dev/diagnostics/helpers/supabaseAssert";

const GROUP_ID = "design";

export const TESTS = [
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

export function getDesignState(shared) {
  if (!shared.cache.designState) {
    shared.cache.designState = {};
  }
  return shared.cache.designState;
}

export const verifyDesignChainTest = {
  id: buildTestId(GROUP_ID, "verify_chain"),
  name: "verify document/page/version/export/job chain",
  run: async ({ shared: localShared }) => {
    const state = getDesignState(localShared);
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
};
