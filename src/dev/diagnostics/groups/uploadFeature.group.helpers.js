import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import {
  isMissingRpc,
  isPermissionDenied,
  isRlsDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import { getFeatureSourceEntries } from "@/dev/diagnostics/helpers/featureSourceIndex";

export const UPLOAD_TEST_CATALOG = [
  { key: "feature_inventory", name: "upload file inventory" },
  { key: "feature_architecture", name: "upload architecture audit" },
  { key: "import_path_contract", name: "upload import path contract check" },
  { key: "cross_feature_boundary", name: "upload cross-feature boundary check" },
  { key: "folder_shape_contract", name: "upload folder shape contract" },
  { key: "surface_contract", name: "upload export surface contract" },
  { key: "pure_contract", name: "upload pure helper/model contract" },
  { key: "mention_search_controller", name: "upload mention search controller path" },
  { key: "handles_resolution_read", name: "upload handle resolution read path" },
  { key: "mentions_read_empty", name: "upload post mention read empty-input contract" },
  { key: "create_post_source_contract", name: "upload create post source contract checks" },
  { key: "destructive_write_skipped", name: "upload create post write path intentionally skipped" },
];

export function failWithData(message, data) {
  return {
    skipped: false,
    data,
    error: {
      name: "UploadFeatureViolation",
      message,
    },
  };
}

export function getUploadEntries() {
  return getFeatureSourceEntries().filter((entry) =>
    entry.path.startsWith("src/features/upload/")
  );
}

export function getUploadSource(path) {
  const entry = getUploadEntries().find((row) => row.path === path);
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
  if (!shared.cache.uploadFeatureState) {
    shared.cache.uploadFeatureState = {};
  }
  return shared.cache.uploadFeatureState;
}

export async function ensureUploadFeatureContext(shared) {
  const state = getState(shared);
  if (state.ready) return state;

  const actorContext = await ensureActorContext(shared);
  const username = String(actorContext?.profile?.username ?? "")
    .trim()
    .toLowerCase();

  state.ready = true;
  state.userId = actorContext.userId;
  state.actorId = actorContext.actorId;
  state.actorKind = actorContext.actor?.kind ?? null;
  state.username = username || null;
  return state;
}

export async function withUploadFeatureContext(shared, reason, run) {
  let context;
  try {
    context = await ensureUploadFeatureContext(shared);
    return await run(context);
  } catch (error) {
    if (error?.skipped) return error;
    if (isPolicyOrRpc(error)) {
      return makeSkipped(reason, { context, error });
    }
    throw error;
  }
}
