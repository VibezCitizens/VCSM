import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { PROFILE_KIND_REGISTRY } from "@/features/profiles/kinds/profileKindRegistry";
import { getVportTabsByType } from "@/features/profiles/kinds/vport/vportTypeRegistry";
import {
  getAllVportTypes,
  isValidVportType,
} from "@/features/profiles/kinds/vport/config/vportTypes.config";
import { getVportPublicDetailsController } from "@/features/profiles/kinds/vport/controller/getVportPublicDetails.controller";
import getVportServicesController from "@/features/profiles/kinds/vport/controller/services/getVportServices.controller";
import getVportRatesController from "@/features/profiles/kinds/vport/controller/rates/getVportRates.controller";
import { getSubscribersController } from "@/features/profiles/kinds/vport/controller/subscribers/getSubscribers.controller";
import { getVportActorMenuController } from "@/features/profiles/kinds/vport/controller/menu/getVportActorMenu.controller";
import { getVportGasPricesController } from "@/features/profiles/kinds/vport/controller/gas/getVportGasPrices.controller";
import {
  ctrlGetOfficialStats,
  ctrlGetReviewFormConfig,
  ctrlListReviews,
} from "@/features/profiles/kinds/vport/controller/review/VportReviews.controller";
import {
  ctrlListReviewServices,
  ctrlListServiceReviews,
} from "@/features/profiles/kinds/vport/controller/review/VportServiceReviews.controller";
import {
  failWithData,
  getKindsEntries,
  withKindsContext,
} from "@/dev/diagnostics/groups/profilesKindsFeature.group.helpers";

export const GROUP_ID = "profilesKindsFeature";
export const GROUP_LABEL = "Profiles Kinds Feature";

const TEST_CATALOG = [
  { key: "kinds_inventory", name: "profiles kinds file inventory" },
  { key: "kinds_import_path_contract", name: "profiles kinds import path contract check" },
  { key: "profile_kind_registry_surface", name: "profile kind registry surface" },
  { key: "vport_type_config_surface", name: "vport type config surface" },
  { key: "vport_tabs_registry_surface", name: "vport tabs registry surface" },
  { key: "resolve_vport_context", name: "resolve vport actor context for kinds tests" },
  { key: "vport_public_details_read", name: "kinds vport public details read" },
  { key: "vport_services_read", name: "kinds vport services read" },
  { key: "vport_rates_read", name: "kinds vport rates read" },
  { key: "vport_subscribers_read", name: "kinds vport subscribers read" },
  { key: "vport_menu_read", name: "kinds vport menu read" },
  { key: "vport_gas_read", name: "kinds vport gas read" },
  { key: "vport_reviews_read_bundle", name: "kinds vport reviews read bundle" },
];

export function getProfilesKindsFeatureTests() {
  return TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export async function runProfilesKindsFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "kinds_inventory"),
      name: "profiles kinds file inventory",
      run: async () => {
        const entries = getKindsEntries();
        const byTopFolder = entries.reduce((acc, entry) => {
          const relative = entry.path.replace("src/features/profiles/kinds/", "");
          const top = relative.split("/")[0] ?? "(root)";
          acc[top] = (acc[top] ?? 0) + 1;
          return acc;
        }, {});

        return { fileCount: entries.length, byTopFolder };
      },
    },
    {
      id: buildTestId(GROUP_ID, "kinds_import_path_contract"),
      name: "profiles kinds import path contract check",
      run: async () => {
        const entries = getKindsEntries();
        const violations = [];
        const importPattern = /from\s+["'](\.{1,2}\/[^"']+)["']/g;

        for (const entry of entries) {
          const source = entry.source ?? "";
          const hits = [...source.matchAll(importPattern)].map((match) => match[1]);
          if (!hits.length) continue;

          violations.push({ path: entry.path, imports: hits });
        }

        if (violations.length > 0) {
          return failWithData("Relative imports detected in profiles/kinds source.", {
            count: violations.length,
            sample: violations.slice(0, 20),
          });
        }

        return { checkedFiles: entries.length, violations: 0 };
      },
    },
    {
      id: buildTestId(GROUP_ID, "profile_kind_registry_surface"),
      name: "profile kind registry surface",
      run: async () => {
        const keys = Object.keys(PROFILE_KIND_REGISTRY ?? {}).sort();
        const hasUser = typeof PROFILE_KIND_REGISTRY?.user === "function";
        const hasVport = typeof PROFILE_KIND_REGISTRY?.vport === "function";
        if (!hasUser || !hasVport) {
          return failWithData("PROFILE_KIND_REGISTRY missing required kind mapping(s).", { keys, hasUser, hasVport });
        }
        return { keys, hasUser, hasVport };
      },
    },
    {
      id: buildTestId(GROUP_ID, "vport_type_config_surface"),
      name: "vport type config surface",
      run: async () => {
        const allTypes = getAllVportTypes();
        return {
          totalTypes: allTypes.length,
          hasGasStation: isValidVportType("gas station"),
          hasBarber: isValidVportType("barber"),
          hasExchange: isValidVportType("exchange"),
          sample: allTypes.slice(0, 20),
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "vport_tabs_registry_surface"),
      name: "vport tabs registry surface",
      run: async () => {
        const sample = {
          gasStation: getVportTabsByType("gas station").map((tab) => tab.key),
          barber: getVportTabsByType("barber").map((tab) => tab.key),
          exchange: getVportTabsByType("exchange").map((tab) => tab.key),
          other: getVportTabsByType("other").map((tab) => tab.key),
        };

        const hasEmpty = Object.values(sample).some((tabs) => !Array.isArray(tabs) || tabs.length === 0);
        if (hasEmpty) {
          return failWithData("vport tab registry returned an empty layout for at least one type.", sample);
        }
        return sample;
      },
    },
    {
      id: buildTestId(GROUP_ID, "resolve_vport_context"),
      name: "resolve vport actor context for kinds tests",
      run: ({ shared: localShared }) =>
        withKindsContext(localShared, "Unable to resolve vport actor context for profiles kinds diagnostics.", async (context) => ({
          userId: context.userId,
          primaryActorId: context.primaryActorId,
          vportActorId: context.vportActorId,
          vportId: context.vportId,
          vportType: context.vportType,
          vportName: context.vportName,
          selectionSource: context.selectionSource,
        })),
    },
    {
      id: buildTestId(GROUP_ID, "vport_public_details_read"),
      name: "kinds vport public details read",
      run: ({ shared: localShared }) =>
        withKindsContext(localShared, "getVportPublicDetailsController blocked by policy.", async (context) => {
          const details = await getVportPublicDetailsController(context.vportActorId);
          return { vportActorId: context.vportActorId, hasDetails: Boolean(details), details };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "vport_services_read"),
      name: "kinds vport services read",
      run: ({ shared: localShared }) =>
        withKindsContext(localShared, "getVportServicesController blocked by policy.", async (context) => {
          const [viewer, owner] = await Promise.all([
            getVportServicesController({ targetActorId: context.vportActorId, vportType: context.vportType, asOwner: false }),
            context.isOwned
              ? getVportServicesController({ targetActorId: context.vportActorId, vportType: context.vportType, asOwner: true })
              : Promise.resolve(null),
          ]);

          return {
            vportActorId: context.vportActorId,
            viewerMode: viewer?.mode ?? null,
            viewerServiceCount: viewer?.services?.length ?? 0,
            ownerServiceCount: owner?.services?.length ?? null,
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "vport_rates_read"),
      name: "kinds vport rates read",
      run: ({ shared: localShared }) =>
        withKindsContext(localShared, "getVportRatesController blocked by policy.", async (context) => {
          const rates = await getVportRatesController({ targetActorId: context.vportActorId });
          return { vportActorId: context.vportActorId, rateCount: rates?.rates?.length ?? 0, lastUpdated: rates?.lastUpdated ?? null };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "vport_subscribers_read"),
      name: "kinds vport subscribers read",
      run: ({ shared: localShared }) =>
        withKindsContext(localShared, "getSubscribersController blocked by policy.", async (context) => {
          const response = await getSubscribersController({ actorId: context.vportActorId, limit: 20, offset: 0 });
          return { vportActorId: context.vportActorId, count: response?.count ?? 0, rows: response?.rows?.length ?? 0 };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "vport_menu_read"),
      name: "kinds vport menu read",
      run: ({ shared: localShared }) =>
        withKindsContext(localShared, "getVportActorMenuController blocked by policy.", async (context) => {
          const menu = await getVportActorMenuController({ actorId: context.vportActorId, includeInactive: false });
          return {
            vportActorId: context.vportActorId,
            categories: menu?.categories?.length ?? 0,
            items: menu?.items?.length ?? 0,
            sections: menu?.sections?.length ?? 0,
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "vport_gas_read"),
      name: "kinds vport gas read",
      run: ({ shared: localShared }) =>
        withKindsContext(localShared, "getVportGasPricesController blocked by policy.", async (context) => {
          const gas = await getVportGasPricesController({ actorId: context.vportActorId });
          return {
            vportActorId: context.vportActorId,
            officialPriceCount: gas?.official?.length ?? 0,
            suggestionCount: Object.keys(gas?.communitySuggestionByFuelKey ?? {}).length,
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "vport_reviews_read_bundle"),
      name: "kinds vport reviews read bundle",
      run: ({ shared: localShared }) =>
        withKindsContext(localShared, "Vport reviews read controllers blocked by policy.", async (context) => {
          const [formConfig, officialStats, reviews, reviewServices] = await Promise.all([
            ctrlGetReviewFormConfig(context.vportActorId),
            ctrlGetOfficialStats(context.vportActorId),
            ctrlListReviews(context.vportActorId, 20),
            ctrlListReviewServices(context.vportActorId),
          ]);

          const firstServiceId = reviewServices?.[0]?.id ?? null;
          const scoped =
            firstServiceId
              ? await ctrlListServiceReviews({
                  targetActorId: context.vportActorId,
                  serviceId: firstServiceId,
                  limit: 20,
                })
              : [];

          return {
            vportActorId: context.vportActorId,
            dimensionsCount: formConfig?.length ?? 0,
            reviewCount: reviews?.length ?? 0,
            reviewServicesCount: reviewServices?.length ?? 0,
            scopedReviewCount: scoped?.length ?? 0,
            officialStats,
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
