import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import {
  isMissingRpc,
  isPermissionDenied,
  isRlsDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import { getFeatureSourceEntries } from "@/dev/diagnostics/helpers/featureSourceIndex";

export const VPORT_FEATURE_TEST_CATALOG = [
  { key: "feature_inventory", name: "vport file inventory" },
  { key: "feature_architecture", name: "vport architecture audit" },
  { key: "import_path_contract", name: "vport import path contract check" },
  { key: "cross_feature_boundary", name: "vport cross-feature boundary check" },
  { key: "folder_shape_contract", name: "vport folder shape contract" },
  { key: "surface_contract", name: "vport export surface contract" },
  { key: "source_contract", name: "vport source contract checks" },
  { key: "service_catalog_controller_read", name: "vport service catalog controller read path" },
  { key: "list_my_vports_consistency", name: "vport listMyVports consistency between model files" },
  { key: "create_vport_write_skipped", name: "vport create write path intentionally skipped" },
];

export function failWithData(message, data) {
  return {
    skipped: false,
    data,
    error: {
      name: "VportFeatureViolation",
      message,
    },
  };
}

export function getVportEntries() {
  return getFeatureSourceEntries().filter((entry) =>
    entry.path.startsWith("src/features/vport/")
  );
}

export function getVportSource(path) {
  const entry = getVportEntries().find((row) => row.path === path);
  return entry?.source ?? "";
}

export function trimAudit(audit, maxItems = 30) {
  return {
    ...audit,
    issues: {
      ...audit.issues,
      oversizedFiles: audit.issues.oversizedFiles.slice(0, maxItems),
      depthViolations: audit.issues.depthViolations.slice(0, maxItems),
      relativeImports: audit.issues.relativeImports.slice(0, maxItems),
      crossFeatureImports: audit.issues.crossFeatureImports.slice(0, maxItems),
      namingViolations: audit.issues.namingViolations.slice(0, maxItems),
    },
  };
}

export function extractImportSpecifiers(source) {
  const pattern = /(?:import\s+[^"']*from\s+|import\s*\()\s*["']([^"']+)["']/g;
  const rows = [];
  let match = pattern.exec(source ?? "");
  while (match) {
    rows.push(match[1]);
    match = pattern.exec(source ?? "");
  }
  return rows;
}

export function getRootDomain(path) {
  const parts = path.split("/");
  return parts[3] ?? "(root)";
}

export function isCrossFeatureBoundaryViolation(currentFeature, specifier) {
  if (!specifier?.startsWith("@/features/")) return false;
  const rest = specifier.replace("@/features/", "");
  const targetFeature = rest.split("/")[0] ?? null;
  if (!targetFeature || targetFeature === currentFeature) return false;

  if (
    rest === targetFeature ||
    rest === `${targetFeature}/index` ||
    rest === `${targetFeature}/index.js` ||
    rest.startsWith(`${targetFeature}/adapter/`) ||
    rest.startsWith(`${targetFeature}/adapters/`)
  ) {
    return false;
  }

  return true;
}

function isPolicyOrRpc(error) {
  return isPermissionDenied(error) || isRlsDenied(error) || isMissingRpc(error);
}

function getState(shared) {
  if (!shared.cache.vportFeatureState) {
    shared.cache.vportFeatureState = {};
  }
  return shared.cache.vportFeatureState;
}

export async function ensureVportFeatureContext(shared) {
  const state = getState(shared);
  if (state.ready) return state;

  const actorContext = await ensureActorContext(shared);
  state.ready = true;
  state.userId = actorContext.userId;
  state.actorId = actorContext.actorId;
  state.actorKind = actorContext.actor?.kind ?? null;
  return state;
}

export async function withVportFeatureContext(shared, reason, run) {
  let context;
  try {
    context = await ensureVportFeatureContext(shared);
    return await run(context);
  } catch (error) {
    if (error?.skipped) return error;
    if (isPolicyOrRpc(error)) {
      return makeSkipped(reason, { context, error });
    }
    throw error;
  }
}
