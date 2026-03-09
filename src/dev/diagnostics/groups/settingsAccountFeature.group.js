import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { getFeatureSourceEntries } from "@/dev/diagnostics/helpers/featureSourceIndex";
import {
  ctrlDeleteAccount,
  ctrlDeleteVport,
  ctrlResolveVportIdByActorId,
} from "@/features/settings/account/controller/account.controller";
import { dalReadVportIdByActorId } from "@/features/settings/account/dal/account.read.dal";
import {
  dalDeleteMyAccount,
  dalDeleteMyVport,
  dalDeleteOwnedVportById,
} from "@/features/settings/account/dal/account.write.dal";
import AccountTabView from "@/features/settings/account/ui/AccountTab.view";
import { useAccountController } from "@/features/settings/account/hooks/useAccountController";
import {
  failWithData,
  getSettingsAccountEntries,
  withSettingsAccountContext,
} from "@/dev/diagnostics/groups/settingsAccountFeature.group.helpers";
import { makeSkipped } from "@/dev/diagnostics/helpers/supabaseAssert";

export const GROUP_ID = "settingsAccountFeature";
export const GROUP_LABEL = "Settings Account Feature";

const TEST_CATALOG = [
  { key: "feature_inventory", name: "settings account file inventory" },
  { key: "import_path_contract", name: "settings account import path contract check" },
  { key: "surface_contract", name: "settings account export surface contract" },
  { key: "source_contract", name: "settings account source contract checks" },
  { key: "account_context", name: "resolve settings account diagnostics context" },
  { key: "resolve_vport_id_active_actor", name: "resolve vport id for active actor" },
  { key: "resolve_vport_id_owned_vport_actor", name: "resolve vport id for owned vport actor" },
  { key: "read_controller_dal_consistency", name: "account controller vs DAL consistency" },
  { key: "danger_delete_account_skipped", name: "delete account path intentionally skipped" },
  { key: "danger_delete_vport_skipped", name: "delete vport paths intentionally skipped" },
];

export function getSettingsAccountFeatureTests() {
  return TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

function getAccountSource(pathSuffix) {
  const path = `src/features/settings/account/${pathSuffix}`;
  const entry = getFeatureSourceEntries().find((row) => row.path === path);
  return entry?.source ?? "";
}

export async function runSettingsAccountFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "feature_inventory"),
      name: "settings account file inventory",
      run: async () => {
        const entries = getSettingsAccountEntries();
        const byDomain = entries.reduce((acc, entry) => {
          const domain = entry.path.split("/")[4] ?? "(root)";
          acc[domain] = (acc[domain] ?? 0) + 1;
          return acc;
        }, {});
        return { fileCount: entries.length, byDomain };
      },
    },
    {
      id: buildTestId(GROUP_ID, "import_path_contract"),
      name: "settings account import path contract check",
      run: async () => {
        const entries = getSettingsAccountEntries();
        const pattern = /from\s+["'](\.{1,2}\/[^"']+)["']/g;
        const violations = [];

        for (const entry of entries) {
          const hits = [...(entry.source ?? "").matchAll(pattern)].map((match) => match[1]);
          if (hits.length) {
            violations.push({ path: entry.path, imports: hits });
          }
        }

        if (violations.length > 0) {
          return failWithData("Relative imports detected in settings/account source.", {
            count: violations.length,
            sample: violations.slice(0, 20),
          });
        }

        return { checkedFiles: entries.length, violations: 0 };
      },
    },
    {
      id: buildTestId(GROUP_ID, "surface_contract"),
      name: "settings account export surface contract",
      run: async () => ({
        hasAccountView: typeof AccountTabView === "function",
        hasUseAccountControllerHook: typeof useAccountController === "function",
        hasCtrlResolveVportIdByActorId: typeof ctrlResolveVportIdByActorId === "function",
        hasCtrlDeleteAccount: typeof ctrlDeleteAccount === "function",
        hasCtrlDeleteVport: typeof ctrlDeleteVport === "function",
        hasDalReadVportIdByActorId: typeof dalReadVportIdByActorId === "function",
        hasDalDeleteMyAccount: typeof dalDeleteMyAccount === "function",
        hasDalDeleteMyVport: typeof dalDeleteMyVport === "function",
        hasDalDeleteOwnedVportById: typeof dalDeleteOwnedVportById === "function",
      }),
    },
    {
      id: buildTestId(GROUP_ID, "source_contract"),
      name: "settings account source contract checks",
      run: async () => {
        const writeDalSource = getAccountSource("dal/account.write.dal.js");
        const hookSource = getAccountSource("hooks/useAccountController.js");

        return {
          hasDeleteMyAccountRpc: writeDalSource.includes("rpc('delete_my_account'"),
          hasDeleteMyVportRpc: writeDalSource.includes("rpc('delete_my_vport'"),
          hasOwnedVportFallbackDelete: writeDalSource.includes(".from('vports')") && writeDalSource.includes(".delete()"),
          hookUsesIdentityActorFirst: hookSource.includes("identity?.actorId") && hookSource.includes("identity?.kind"),
          hookReferencesLegacyProfileKind: hookSource.includes("actor_kind', 'profile'"),
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "account_context"),
      name: "resolve settings account diagnostics context",
      run: ({ shared: localShared }) =>
        withSettingsAccountContext(localShared, "Unable to resolve settings account diagnostics context.", async (context) => ({
          userId: context.userId,
          actorId: context.actorId,
          actorKind: context.actorKind,
          ownedVportActorId: context.ownedVportActorId,
        })),
    },
    {
      id: buildTestId(GROUP_ID, "resolve_vport_id_active_actor"),
      name: "resolve vport id for active actor",
      run: ({ shared: localShared }) =>
        withSettingsAccountContext(localShared, "Actor->vport resolution blocked by policy.", async (context) => ({
          actorId: context.actorId,
          vportId: await ctrlResolveVportIdByActorId(context.actorId),
        })),
    },
    {
      id: buildTestId(GROUP_ID, "resolve_vport_id_owned_vport_actor"),
      name: "resolve vport id for owned vport actor",
      run: ({ shared: localShared }) =>
        withSettingsAccountContext(localShared, "Owned vport actor lookup blocked by policy.", async (context) => {
          if (!context.ownedVportActorId) {
            return makeSkipped("No owned vport actor found for settings account test.");
          }

          const vportId = await ctrlResolveVportIdByActorId(context.ownedVportActorId);
          return {
            actorId: context.ownedVportActorId,
            vportId,
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "read_controller_dal_consistency"),
      name: "account controller vs DAL consistency",
      run: ({ shared: localShared }) =>
        withSettingsAccountContext(localShared, "Account read consistency test blocked by policy.", async (context) => {
          const actorId = context.ownedVportActorId ?? context.actorId;
          const [controllerValue, dalValue] = await Promise.all([
            ctrlResolveVportIdByActorId(actorId),
            dalReadVportIdByActorId(actorId),
          ]);

          return {
            actorId,
            controllerValue,
            dalValue,
            match: controllerValue === dalValue,
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "danger_delete_account_skipped"),
      name: "delete account path intentionally skipped",
      run: async () =>
        makeSkipped(
          "Destructive account deletion is intentionally skipped in diagnostics to avoid deleting real dev identities."
        ),
    },
    {
      id: buildTestId(GROUP_ID, "danger_delete_vport_skipped"),
      name: "delete vport paths intentionally skipped",
      run: async () =>
        makeSkipped(
          "Destructive vport deletion paths are intentionally skipped in diagnostics to avoid data loss in shared/dev DB."
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
