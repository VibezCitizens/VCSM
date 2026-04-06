import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { getFeatureSourceEntries } from "@/dev/diagnostics/helpers/featureSourceIndex";
import {
  isMissingRpc,
  isPermissionDenied,
  isRlsDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";

export function failWithData(message, data) {
  return {
    skipped: false,
    data,
    error: {
      name: "SettingsFeatureViolation",
      message,
    },
  };
}

export function getSettingsEntries() {
  return getFeatureSourceEntries().filter((entry) =>
    entry.path.startsWith("src/features/settings/")
  );
}

export function getSettingsSource(path) {
  const entry = getSettingsEntries().find((row) => row.path === path);
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

export function hasAllTabKeys(screenSource) {
  const keys = ["privacy", "profile", "account", "vports"];
  return keys.every((key) => screenSource.includes(`key: '${key}'`) || screenSource.includes(`key: "${key}"`));
}

export function hasAllTabImports(screenSource) {
  return [
    "../privacy/ui/PrivacyTab.view",
    "../profile/adapter/ProfileTab",
    "../account/ui/AccountTab.view",
    "../vports/ui/VportsTab.view",
  ].every((importPath) => screenSource.includes(importPath));
}

export function getDerivedProfileActorId(ownerRows) {
  return (ownerRows ?? [])
    .map((row) => row?.actor)
    .find((actor) => actor?.kind === "user")?.id ?? null;
}

function isPolicyOrRpc(error) {
  return isPermissionDenied(error) || isRlsDenied(error) || isMissingRpc(error);
}

function getState(shared) {
  if (!shared.cache.settingsFeatureState) {
    shared.cache.settingsFeatureState = {};
  }
  return shared.cache.settingsFeatureState;
}

export async function ensureSettingsFeatureContext(shared, deps) {
  const state = getState(shared);
  if (state.ready) return state;

  const actorContext = await ensureActorContext(shared);
  const [controllerUserId, dalUser] = await Promise.all([
    deps.ctrlGetAuthedUserId(),
    deps.readAuthedUserDAL(),
  ]);
  const ownerRows = await deps.readActorOwnersByUserDAL({
    userId: actorContext.userId,
  });
  const profileActorId = await deps.ctrlGetProfileActorId({
    userId: actorContext.userId,
  });

  state.ready = true;
  state.userId = actorContext.userId;
  state.actorId = actorContext.actorId;
  state.actorKind = actorContext.actor?.kind ?? null;
  state.controllerUserId = controllerUserId ?? null;
  state.dalUserId = dalUser?.id ?? null;
  state.profileActorId = profileActorId ?? null;
  state.ownerRows = Array.isArray(ownerRows) ? ownerRows : [];
  return state;
}

export async function withSettingsFeatureContext(shared, reason, run, deps) {
  let context;
  try {
    context = await ensureSettingsFeatureContext(shared, deps);
    return await run(context);
  } catch (error) {
    if (error?.skipped) return error;
    if (isPolicyOrRpc(error)) {
      return makeSkipped(reason, { context, error });
    }
    throw error;
  }
}
