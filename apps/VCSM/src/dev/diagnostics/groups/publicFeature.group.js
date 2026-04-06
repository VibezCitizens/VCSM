import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { auditFeature } from "@/dev/diagnostics/helpers/featureAudit";
import { readVportPublicMenuRpcDAL } from "@/features/public/vportMenu/dal/readVportPublicMenu.rpc.dal";
import { readVportPublicDetailsRpcDAL } from "@/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal";
import { mapVportPublicMenuRpcResult } from "@/features/public/vportMenu/model/vportPublicMenu.model";
import { mapVportPublicDetailsRpcResult } from "@/features/public/vportMenu/model/vportPublicDetails.model";
import getVportPublicMenuController from "@/features/public/vportMenu/controller/getVportPublicMenu.controller";
import getVportPublicDetailsController from "@/features/public/vportMenu/controller/getVportPublicDetails.controller";
import {
  filterMenuCategories,
  formatMenuItemPrice,
} from "@/features/public/vportMenu/model/vportPublicMenuPanel.model";
import VportPublicMenuPanel from "@/features/public/vportMenu/components/VportPublicMenuPanel";
import VportPublicMenuView from "@/features/public/vportMenu/view/VportPublicMenuView";
import VportPublicMenuQrView from "@/features/public/vportMenu/view/VportPublicMenuQrView";
import VportPublicMenuScreen from "@/features/public/vportMenu/screen/VportPublicMenuScreen";
import VportPublicMenuQrScreen from "@/features/public/vportMenu/screen/VportPublicMenuQrScreen";
import VportPublicMenuRedirectScreen from "@/features/public/vportMenu/screen/VportPublicMenuRedirectScreen";
import VportMenuRedirect from "@/features/public/screens/VportMenuRedirect";
import {
  failWithData,
  getPublicEntries,
  trimAudit,
  withPublicContext,
} from "@/dev/diagnostics/groups/publicFeature.group.helpers";

export const GROUP_ID = "publicFeature";
export const GROUP_LABEL = "Public Feature";

const TEST_CATALOG = [
  { key: "feature_inventory", name: "public feature file inventory" },
  { key: "feature_architecture", name: "public feature architecture audit" },
  { key: "component_surface", name: "public feature component/screen surface" },
  { key: "public_context", name: "resolve actor context for public flow" },
  { key: "menu_rpc_raw", name: "public menu RPC raw payload" },
  { key: "details_rpc_raw", name: "public details RPC raw payload" },
  { key: "menu_controller", name: "public menu controller mapping" },
  { key: "details_controller", name: "public details controller mapping" },
  { key: "panel_model_ops", name: "public panel model filter/price operations" },
];

export function getPublicFeatureTests() {
  return TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export async function runPublicFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "feature_inventory"),
      name: "public feature file inventory",
      run: async () => {
        const entries = getPublicEntries();
        const byDomain = entries.reduce((acc, entry) => {
          const domain = entry.path.split("/")[3] ?? "(root)";
          acc[domain] = (acc[domain] ?? 0) + 1;
          return acc;
        }, {});
        return { fileCount: entries.length, byDomain };
      },
    },
    {
      id: buildTestId(GROUP_ID, "feature_architecture"),
      name: "public feature architecture audit",
      run: async () => {
        const audit = trimAudit(auditFeature("public"));
        if (audit.issueCount > 0) {
          return failWithData(`Public feature has ${audit.issueCount} architecture issues`, audit);
        }
        return audit;
      },
    },
    {
      id: buildTestId(GROUP_ID, "component_surface"),
      name: "public feature component/screen surface",
      run: async () => ({
        hasPanelComponent: typeof VportPublicMenuPanel === "function",
        hasMenuView: typeof VportPublicMenuView === "function",
        hasQrView: typeof VportPublicMenuQrView === "function",
        hasMenuScreen: typeof VportPublicMenuScreen === "function",
        hasQrScreen: typeof VportPublicMenuQrScreen === "function",
        hasRedirectScreen: typeof VportPublicMenuRedirectScreen === "function",
        hasLegacyRedirect: typeof VportMenuRedirect === "function",
      }),
    },
    {
      id: buildTestId(GROUP_ID, "public_context"),
      name: "resolve actor context for public flow",
      run: ({ shared: localShared }) =>
        withPublicContext(localShared, "Unable to resolve context for public feature diagnostics.", async (context) => ({
          source: context.source,
          actorId: context.actorId,
          viewerActorId: context.viewerActorId,
        })),
    },
    {
      id: buildTestId(GROUP_ID, "menu_rpc_raw"),
      name: "public menu RPC raw payload",
      run: ({ shared: localShared }) =>
        withPublicContext(localShared, "get_vport_public_menu RPC blocked or missing.", async (context) => {
          const raw = await readVportPublicMenuRpcDAL({ actorId: context.actorId });
          const mapped = mapVportPublicMenuRpcResult(raw);
          return {
            actorId: context.actorId,
            rawOk: raw?.ok === true,
            mappedOk: mapped?.ok === true,
            errorCode: mapped?.ok ? null : mapped?.error ?? null,
            categoryCount: mapped?.categories?.length ?? 0,
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "details_rpc_raw"),
      name: "public details RPC raw payload",
      run: ({ shared: localShared }) =>
        withPublicContext(localShared, "get_vport_public_details RPC blocked or missing.", async (context) => {
          const raw = await readVportPublicDetailsRpcDAL({ actorId: context.actorId });
          const mapped = mapVportPublicDetailsRpcResult(raw);
          return {
            actorId: context.actorId,
            rawOk: raw?.ok === true,
            mappedOk: mapped?.ok === true,
            errorCode: mapped?.ok ? null : mapped?.error ?? null,
            hasDisplayName: Boolean(mapped?.details?.displayName),
            hasUsername: Boolean(mapped?.details?.username),
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "menu_controller"),
      name: "public menu controller mapping",
      run: ({ shared: localShared }) =>
        withPublicContext(localShared, "Public menu controller blocked by policy/RPC.", async (context) => {
          const result = await getVportPublicMenuController({ actorId: context.actorId });
          return {
            actorId: context.actorId,
            ok: result?.ok === true,
            errorCode: result?.ok ? null : result?.error ?? null,
            categoryCount: result?.categories?.length ?? 0,
            orphanItemCount: result?.itemsOrphaned?.length ?? 0,
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "details_controller"),
      name: "public details controller mapping",
      run: ({ shared: localShared }) =>
        withPublicContext(localShared, "Public details controller blocked by policy/RPC.", async (context) => {
          const result = await getVportPublicDetailsController({ actorId: context.actorId });
          return {
            actorId: context.actorId,
            ok: result?.ok === true,
            errorCode: result?.ok ? null : result?.error ?? null,
            details: result?.details ?? null,
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "panel_model_ops"),
      name: "public panel model filter/price operations",
      run: ({ shared: localShared }) =>
        withPublicContext(localShared, "Public panel model smoke test blocked by policy/RPC.", async (context) => {
          const menu = await getVportPublicMenuController({ actorId: context.actorId });
          const categories = menu?.categories ?? [];
          const filtered = filterMenuCategories(categories, "a");
          const sampleItem = filtered?.[0]?.__filteredItems?.[0] ?? categories?.[0]?.items?.[0] ?? null;
          const priceLabel = formatMenuItemPrice(sampleItem);

          return {
            actorId: context.actorId,
            inputCategories: categories.length,
            filteredCategories: filtered.length,
            hasSampleItem: Boolean(sampleItem),
            samplePriceLabel: priceLabel,
            fallbackPriceLabel: formatMenuItemPrice({
              priceCents: 1999,
              currencyCode: "USD",
            }),
          };
        }),
    },
  ];

  return runDiagnosticsTests({
    group: GROUP_ID,
    tests,
    onTestUpdate,
    shared,
  });
}
