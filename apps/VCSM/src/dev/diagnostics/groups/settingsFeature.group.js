import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { auditFeature } from "@/dev/diagnostics/helpers/featureAudit";
import {
  isPermissionDenied,
  isRlsDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import {
  extractImportSpecifiers,
  failWithData,
  getDerivedProfileActorId,
  getSettingsEntries,
  getRootDomain,
  getSettingsSource,
  hasAllTabImports,
  hasAllTabKeys,
  isCrossFeatureBoundaryViolation,
  trimAudit,
  withSettingsFeatureContext,
} from "@/dev/diagnostics/groups/settingsFeature.group.helpers";
import SettingsScreen from "@/features/settings/screen/SettingsScreen";
import Card from "@/features/settings/ui/Card";
import Row from "@/features/settings/ui/Row";
import OmdView from "@/features/settings/sponsored/ui/Omd.view";
import VportsTabView from "@/features/settings/vports/ui/VportsTab.view";
import VportsTabIndex from "@/features/settings/vports";
import {
  MAX_IMAGE_BYTES,
  TYPE_OPTIONS,
  UPLOAD_ENDPOINT,
  cx,
} from "@/features/settings/constants";
import { ctrlGetAuthedUserId } from "@/features/settings/vports/controller/getAuthedUserId.controller";
import { ctrlGetProfileActorId } from "@/features/settings/vports/controller/getProfileActorId.controller";
import { readAuthedUserDAL } from "@/features/settings/vports/dal/auth.read.dal";
import { readActorOwnersByUserDAL } from "@/features/settings/vports/dal/actorOwners.read.dal";
import { readMyVports } from "@/features/settings/vports/dal/vports.read.dal";
import { mapVport, mapVports } from "@/features/settings/vports/model/vport.mapper";

export const GROUP_ID = "settingsFeature";
export const GROUP_LABEL = "Settings Feature";

const TEST_CATALOG = [
  { key: "feature_inventory", name: "settings file inventory" },
  { key: "feature_architecture", name: "settings architecture audit" },
  { key: "import_path_contract", name: "settings import path contract check" },
  { key: "cross_feature_boundary", name: "settings cross-feature boundary check" },
  { key: "surface_contract", name: "settings export surface contract" },
  { key: "screen_tab_contract", name: "settings screen tab contract" },
  { key: "vports_context", name: "settings vports context resolution" },
  { key: "vports_controller_dal_consistency", name: "settings vports controller/DAL consistency" },
  { key: "vports_read_map_pipeline", name: "settings vports read/map pipeline" },
];

const SETTINGS_DEPS = {
  ctrlGetAuthedUserId,
  ctrlGetProfileActorId,
  readAuthedUserDAL,
  readActorOwnersByUserDAL,
};

export function getSettingsFeatureTests() {
  return TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export async function runSettingsFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "feature_inventory"),
      name: "settings file inventory",
      run: async () => {
        const entries = getSettingsEntries();
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
      name: "settings architecture audit",
      run: async () => {
        const audit = trimAudit(auditFeature("settings"));
        if (audit.issueCount > 0) {
          return failWithData(`Settings feature has ${audit.issueCount} architecture issues`, audit);
        }
        return audit;
      },
    },
    {
      id: buildTestId(GROUP_ID, "import_path_contract"),
      name: "settings import path contract check",
      run: async () => {
        const entries = getSettingsEntries();
        const importPattern = /(?:from\s+["'](\.{1,2}\/[^"']+)["']|import\s*\(\s*["'](\.{1,2}\/[^"']+)["']\s*\))/g;
        const violations = [];

        for (const entry of entries) {
          const source = entry.source ?? "";
          const hits = [];
          let match = importPattern.exec(source);
          while (match) {
            hits.push(match[1] ?? match[2]);
            match = importPattern.exec(source);
          }
          if (hits.length) {
            violations.push({ path: entry.path, imports: hits });
          }
          importPattern.lastIndex = 0;
        }

        if (violations.length > 0) {
          return failWithData("Relative imports detected in settings source.", {
            count: violations.length,
            sample: violations.slice(0, 20),
          });
        }

        return { checkedFiles: entries.length, violations: 0 };
      },
    },
    {
      id: buildTestId(GROUP_ID, "cross_feature_boundary"),
      name: "settings cross-feature boundary check",
      run: async () => {
        const entries = getSettingsEntries();
        const violations = [];

        for (const entry of entries) {
          const specifiers = extractImportSpecifiers(entry.source);
          const bad = specifiers.filter((specifier) =>
            isCrossFeatureBoundaryViolation("settings", specifier)
          );
          if (bad.length) {
            violations.push({ path: entry.path, imports: bad });
          }
        }

        if (violations.length > 0) {
          return failWithData("Cross-feature internal imports detected in settings feature.", {
            count: violations.length,
            sample: violations.slice(0, 20),
          });
        }

        return { checkedFiles: entries.length, violations: 0 };
      },
    },
    {
      id: buildTestId(GROUP_ID, "surface_contract"),
      name: "settings export surface contract",
      run: async () => ({
        hasSettingsScreen: typeof SettingsScreen === "function",
        hasCard: typeof Card === "function",
        hasRow: typeof Row === "function",
        hasOmdView: typeof OmdView === "function",
        hasVportsTabView: typeof VportsTabView === "function",
        hasVportsTabIndex: typeof VportsTabIndex === "function",
        uploadEndpointIsString: typeof UPLOAD_ENDPOINT === "string",
        maxImageBytesIsNumber: typeof MAX_IMAGE_BYTES === "number",
        typeOptionsIsArray: Array.isArray(TYPE_OPTIONS),
        hasCxHelper: typeof cx === "function",
        settingsIndexAutoGenerated: getSettingsSource("src/features/settings/index.js").includes("auto-generated"),
      }),
    },
    {
      id: buildTestId(GROUP_ID, "screen_tab_contract"),
      name: "settings screen tab contract",
      run: async () => {
        const screenSource = getSettingsSource("src/features/settings/screen/SettingsScreen.jsx");
        const tabCountMatch = screenSource.match(/key:\s*['"][a-z]+['"]/g) ?? [];
        const payload = {
          hasAllTabKeys: hasAllTabKeys(screenSource),
          hasAllTabImports: hasAllTabImports(screenSource),
          hasTablistRole: screenSource.includes('role="tablist"'),
          hasSuspenseFallback: screenSource.includes("<Suspense"),
          tabKeyCountDetected: tabCountMatch.length,
        };

        if (!payload.hasAllTabKeys || !payload.hasAllTabImports) {
          return failWithData("Settings screen tab registry is missing expected tabs/imports.", payload);
        }
        return payload;
      },
    },
    {
      id: buildTestId(GROUP_ID, "vports_context"),
      name: "settings vports context resolution",
      run: ({ shared: localShared }) =>
        withSettingsFeatureContext(
          localShared,
          "Settings vports context is blocked by policy or RPC constraints.",
          async (context) => ({
            userId: context.userId,
            actorId: context.actorId,
            actorKind: context.actorKind,
            controllerUserId: context.controllerUserId,
            dalUserId: context.dalUserId,
            profileActorId: context.profileActorId,
            ownerRowCount: context.ownerRows.length,
          }),
          SETTINGS_DEPS
        ),
    },
    {
      id: buildTestId(GROUP_ID, "vports_controller_dal_consistency"),
      name: "settings vports controller/DAL consistency",
      run: ({ shared: localShared }) =>
        withSettingsFeatureContext(
          localShared,
          "Settings vports controller/DAL checks are blocked by policy or RPC constraints.",
          async (context) => {
            const derivedProfileActorId = getDerivedProfileActorId(context.ownerRows);
            return {
              userIdMatch: context.controllerUserId === context.dalUserId && context.userId === context.dalUserId,
              profileActorMatch: context.profileActorId === derivedProfileActorId,
              controllerUserId: context.controllerUserId,
              dalUserId: context.dalUserId,
              contextUserId: context.userId,
              profileActorId: context.profileActorId,
              derivedProfileActorId,
            };
          },
          SETTINGS_DEPS
        ),
    },
    {
      id: buildTestId(GROUP_ID, "vports_read_map_pipeline"),
      name: "settings vports read/map pipeline",
      run: ({ shared: localShared }) =>
        withSettingsFeatureContext(
          localShared,
          "Settings vports read/map pipeline is blocked by policy.",
          async (context) => {
            try {
              const rows = await readMyVports();
              const mapped = mapVports(rows);
              const sample = rows[0] ? mapVport(rows[0]) : null;
              return {
                userId: context.userId,
                rawCount: Array.isArray(rows) ? rows.length : 0,
                mappedCount: Array.isArray(mapped) ? mapped.length : 0,
                sample,
              };
            } catch (error) {
              if (isPermissionDenied(error) || isRlsDenied(error)) {
                return makeSkipped("readMyVports is intentionally RLS-restricted for this actor context.", {
                  userId: context.userId,
                  error,
                });
              }
              throw error;
            }
          },
          SETTINGS_DEPS
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
