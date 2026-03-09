import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { auditFeature } from "@/dev/diagnostics/helpers/featureAudit";
import {
  isMissingRelation,
  isPermissionDenied,
  isRlsDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import {
  extractImportSpecifiers,
  failWithData,
  getRootDomain,
  getVportEntries,
  getVportSource,
  isCrossFeatureBoundaryViolation,
  trimAudit,
  VPORT_FEATURE_TEST_CATALOG,
  withVportFeatureContext,
} from "@/dev/diagnostics/groups/vportFeature.group.helpers";
import CreateVportForm from "@/features/vport/CreateVportForm";
import getVportServiceCatalogController from "@/features/vport/controller/getVportServiceCatalog.controller";
import useVportServiceCatalog from "@/features/vport/hooks/useVportServiceCatalog";
import vportModel, {
  createVport,
  getVportById,
  getVportBySlug,
  getVportsByIds,
  listMyVports as listMyVportsModel,
  updateVport,
} from "@/features/vport/model/vport.model";
import { listMyVports as listMyVportsRecords } from "@/features/vport/model/vport.read.vportRecords";

export const GROUP_ID = "vportFeature";
export const GROUP_LABEL = "Vport Feature";

function toSortedIdList(rows) {
  return (rows ?? [])
    .map((row) => row?.id)
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b)));
}

export function getVportFeatureTests() {
  return VPORT_FEATURE_TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export async function runVportFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "feature_inventory"),
      name: "vport file inventory",
      run: async () => {
        const entries = getVportEntries();
        const byDomain = entries.reduce((acc, entry) => {
          const domain = getRootDomain(entry.path);
          acc[domain] = (acc[domain] ?? 0) + 1;
          return acc;
        }, {});
        return { fileCount: entries.length, byDomain };
      },
    },
    {
      id: buildTestId(GROUP_ID, "feature_architecture"),
      name: "vport architecture audit",
      run: async () => {
        const audit = trimAudit(auditFeature("vport"));
        if (audit.issueCount > 0) {
          return failWithData(`Vport feature has ${audit.issueCount} architecture issues`, audit);
        }
        return audit;
      },
    },
    {
      id: buildTestId(GROUP_ID, "import_path_contract"),
      name: "vport import path contract check",
      run: async () => {
        const entries = getVportEntries();
        const importPattern = /(?:from\s+["'](\.{1,2}\/[^"']+)["']|import\s*\(\s*["'](\.{1,2}\/[^"']+)["']\s*\))/g;
        const violations = [];

        for (const entry of entries) {
          const hits = [];
          let match = importPattern.exec(entry.source ?? "");
          while (match) {
            hits.push(match[1] ?? match[2]);
            match = importPattern.exec(entry.source ?? "");
          }
          importPattern.lastIndex = 0;

          if (hits.length) {
            violations.push({ path: entry.path, imports: hits });
          }
        }

        if (violations.length > 0) {
          return failWithData("Relative imports detected in vport source.", {
            count: violations.length,
            sample: violations.slice(0, 20),
          });
        }

        return { checkedFiles: entries.length, violations: 0 };
      },
    },
    {
      id: buildTestId(GROUP_ID, "cross_feature_boundary"),
      name: "vport cross-feature boundary check",
      run: async () => {
        const entries = getVportEntries();
        const violations = [];

        for (const entry of entries) {
          const specifiers = extractImportSpecifiers(entry.source);
          const bad = specifiers.filter((specifier) =>
            isCrossFeatureBoundaryViolation("vport", specifier)
          );
          if (bad.length) {
            violations.push({ path: entry.path, imports: bad });
          }
        }

        if (violations.length > 0) {
          return failWithData("Cross-feature internal imports detected in vport feature.", {
            count: violations.length,
            sample: violations.slice(0, 20),
          });
        }

        return { checkedFiles: entries.length, violations: 0 };
      },
    },
    {
      id: buildTestId(GROUP_ID, "folder_shape_contract"),
      name: "vport folder shape contract",
      run: async () => {
        const entries = getVportEntries();
        const domains = new Set(entries.map((entry) => getRootDomain(entry.path)));
        const payload = {
          domains: Array.from(domains).sort((a, b) => a.localeCompare(b)),
          hasAdapter: domains.has("adapter"),
          hasAdapters: domains.has("adapters"),
          hasController: domains.has("controller"),
          hasModel: domains.has("model"),
          hasHooks: domains.has("hooks"),
        };

        if (payload.hasAdapter && payload.hasAdapters) {
          return failWithData("Vport feature contains both adapter/ and adapters/ folders.", payload);
        }
        return payload;
      },
    },
    {
      id: buildTestId(GROUP_ID, "surface_contract"),
      name: "vport export surface contract",
      run: async () => ({
        hasCreateVportForm: typeof CreateVportForm === "function",
        hasCatalogController: typeof getVportServiceCatalogController === "function",
        hasUseVportServiceCatalogHook: typeof useVportServiceCatalog === "function",
        hasCreateVportModelFn: typeof createVport === "function",
        hasListMyVportsModelFn: typeof listMyVportsModel === "function",
        hasListMyVportsRecordsFn: typeof listMyVportsRecords === "function",
        hasGetVportByIdFn: typeof getVportById === "function",
        hasGetVportBySlugFn: typeof getVportBySlug === "function",
        hasGetVportsByIdsFn: typeof getVportsByIds === "function",
        hasUpdateVportFn: typeof updateVport === "function",
        hasDefaultModelExport: typeof vportModel === "object",
      }),
    },
    {
      id: buildTestId(GROUP_ID, "source_contract"),
      name: "vport source contract checks",
      run: async () => {
        const createFormSource = getVportSource("src/features/vport/CreateVportForm.jsx");
        const modelSource = getVportSource("src/features/vport/model/vport.model.js");
        const readSource = getVportSource("src/features/vport/model/vport.read.vportRecords.js");

        return {
          createFormUsesRelativeImports: createFormSource.includes("../"),
          createFormUsesHardcodedUploadEndpoint: createFormSource.includes("upload.vibezcitizens.com"),
          modelCallsCreateVportRpc: modelSource.includes("rpc('create_vport'"),
          modelHasRequireUserGuard: modelSource.includes("requireUser"),
          modelImportsSupabaseClient: modelSource.includes("supabaseClient"),
          readModelHasRequireUserGuard: readSource.includes("requireUser"),
          readModelUsesVcClient: readSource.includes("vcClient"),
          readModelSelectsActorJoin: readSource.includes("actor:actors"),
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "service_catalog_controller_read"),
      name: "vport service catalog controller read path",
      run: ({ shared: localShared }) =>
        withVportFeatureContext(
          localShared,
          "Vport service catalog read is blocked by policy or schema constraints.",
          async () => {
            try {
              const result = await getVportServiceCatalogController({ vportType: "barber" });
              return {
                vportType: result?.vportType ?? null,
                count: Array.isArray(result?.services) ? result.services.length : 0,
                sample: (result?.services ?? []).slice(0, 10),
              };
            } catch (error) {
              if (isPermissionDenied(error) || isRlsDenied(error) || isMissingRelation(error)) {
                return makeSkipped("Service catalog read blocked for current environment.", { error });
              }
              throw error;
            }
          }
        ),
    },
    {
      id: buildTestId(GROUP_ID, "list_my_vports_consistency"),
      name: "vport listMyVports consistency between model files",
      run: ({ shared: localShared }) =>
        withVportFeatureContext(
          localShared,
          "listMyVports vport reads are blocked by policy/RLS.",
          async () => {
            try {
              const [rowsA, rowsB] = await Promise.all([
                listMyVportsModel(),
                listMyVportsRecords(),
              ]);

              const idsA = toSortedIdList(rowsA);
              const idsB = toSortedIdList(rowsB);
              return {
                modelCount: rowsA?.length ?? 0,
                recordsCount: rowsB?.length ?? 0,
                sameIds: JSON.stringify(idsA) === JSON.stringify(idsB),
                modelSample: (rowsA ?? []).slice(0, 5),
                recordsSample: (rowsB ?? []).slice(0, 5),
              };
            } catch (error) {
              if (isPermissionDenied(error) || isRlsDenied(error)) {
                return makeSkipped("Owned vport listing blocked by policy for current actor context.", {
                  error,
                });
              }
              throw error;
            }
          }
        ),
    },
    {
      id: buildTestId(GROUP_ID, "create_vport_write_skipped"),
      name: "vport create write path intentionally skipped",
      run: async () =>
        makeSkipped(
          "Diagnostics does not auto-create vports in feature-level tests to avoid leaving database/storage garbage."
        ),
    },
  ];

  return runDiagnosticsTests({
    group: GROUP_ID,
    tests,
    onTestUpdate,
    shared,
  });
}
