import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import {
  isMissingRelation,
  isMissingRpc,
  isPermissionDenied,
  isRlsDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import { getFeatureSourceEntries } from "@/dev/diagnostics/helpers/featureSourceIndex";

export const FEED_FEATURE_TEST_CATALOG = [
  { key: "feature_inventory", name: "feed file inventory" },
  { key: "feature_architecture", name: "feed architecture audit" },
  { key: "import_path_contract", name: "feed import path contract check" },
  { key: "cross_feature_boundary", name: "feed cross-feature boundary check" },
  { key: "folder_shape_contract", name: "feed folder shape contract" },
  { key: "surface_contract", name: "feed export surface contract" },
  { key: "pure_model_contract", name: "feed pure model contract checks" },
  { key: "viewer_context_controller", name: "feed viewer context controller read path" },
  { key: "list_actor_posts_controller", name: "feed list actor posts controller read path" },
  { key: "feed_page_pipeline", name: "feed page pipeline read path" },
  { key: "legacy_feed_posts_dal", name: "feed legacy listFeedPosts DAL read path" },
  { key: "source_contract", name: "feed source contract checks" },
];

export function failWithData(message, data) {
  return {
    skipped: false,
    data,
    error: {
      name: "FeedFeatureViolation",
      message,
    },
  };
}

export function getFeedEntries() {
  return getFeatureSourceEntries().filter((entry) =>
    entry.path.startsWith("src/features/feed/")
  );
}

export function getFeedSource(path) {
  const entry = getFeedEntries().find((row) => row.path === path);
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

function isPolicyOrSchemaBound(error) {
  return (
    isPermissionDenied(error) ||
    isRlsDenied(error) ||
    isMissingRpc(error) ||
    isMissingRelation(error)
  );
}

function getState(shared) {
  if (!shared.cache.feedFeatureState) {
    shared.cache.feedFeatureState = {};
  }
  return shared.cache.feedFeatureState;
}

export async function ensureFeedFeatureContext(shared) {
  const state = getState(shared);
  if (state.ready) return state;

  const actorContext = await ensureActorContext(shared);
  state.ready = true;
  state.userId = actorContext.userId;
  state.actorId = actorContext.actorId;
  state.actorKind = actorContext.actor?.kind ?? null;
  return state;
}

export async function withFeedFeatureContext(shared, reason, run) {
  let context;
  try {
    context = await ensureFeedFeatureContext(shared);
    return await run(context);
  } catch (error) {
    if (error?.skipped) return error;
    if (isPolicyOrSchemaBound(error)) {
      return makeSkipped(reason, { context, error });
    }
    throw error;
  }
}
