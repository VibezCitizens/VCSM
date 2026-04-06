import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { makeSkipped } from "@/dev/diagnostics/helpers/supabaseAssert";
import { ctrlGetActorPrivacy, ctrlSetActorPrivacy } from "@/features/settings/privacy/controller/actorPrivacy.controller";
import {
  ctrlBlockActor,
  ctrlListMyBlocks,
  ctrlSearchActors,
  ctrlUnblockActor,
} from "@/features/settings/privacy/controller/Blocks.controller";
import { dalGetActorPrivacy, dalSetActorPrivacy } from "@/features/settings/privacy/dal/visibility.dal";
import {
  dalDeleteBlockByTarget,
  dalInsertBlock,
  dalListMyBlocks,
  dalReadActorKindAndVportId,
} from "@/features/settings/privacy/dal/blocks.dal";
import { modelActorRows, modelBlockRows } from "@/features/settings/privacy/models/blocks.model";
import PrivacyTabView from "@/features/settings/privacy/ui/PrivacyTab.view";
import ProfilePrivacyToggle from "@/features/settings/privacy/ui/ProfilePrivacyToggle";
import UserLookup from "@/features/settings/privacy/ui/UserLookup";
import BlockedUsersSimple from "@/features/settings/privacy/ui/BlockedUsersSimple";
import PendingFollowRequests from "@/features/settings/privacy/ui/PendingFollowRequests";
import { useActorPrivacy } from "@/features/settings/privacy/hooks/useActorPrivacy";
import { useActorLookup } from "@/features/settings/privacy/hooks/useActorLookup";
import { usePendingFollowRequestActions } from "@/features/settings/privacy/hooks/usePendingFollowRequestActions";
import { MyBlocksProvider, useMyBlocks } from "@/features/settings/privacy/hooks/useMyBlocks";
import {
  failWithData,
  getSettingsPrivacyEntries,
  withSettingsPrivacyContext,
} from "@/dev/diagnostics/groups/settingsPrivacyFeature.group.helpers";

export const GROUP_ID = "settingsPrivacyFeature";
export const GROUP_LABEL = "Settings Privacy Feature";

const TEST_CATALOG = [
  { key: "feature_inventory", name: "settings privacy file inventory" },
  { key: "import_path_contract", name: "settings privacy import path contract check" },
  { key: "surface_contract", name: "settings privacy export surface contract" },
  { key: "privacy_context", name: "resolve settings privacy diagnostics context" },
  { key: "privacy_read_controller_dal", name: "privacy read controller/DAL consistency" },
  { key: "privacy_write_reversible", name: "privacy write path reversible probe" },
  { key: "blocks_read_controller_dal", name: "blocks read controller/DAL consistency" },
  { key: "actor_lookup_search", name: "actor lookup search controller" },
  { key: "block_unblock_reversible", name: "block/unblock reversible probe" },
];

export function getSettingsPrivacyFeatureTests() {
  return TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export async function runSettingsPrivacyFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "feature_inventory"),
      name: "settings privacy file inventory",
      run: async () => {
        const entries = getSettingsPrivacyEntries();
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
      name: "settings privacy import path contract check",
      run: async () => {
        const entries = getSettingsPrivacyEntries();
        const importPattern = /from\s+["'](\.{1,2}\/[^"']+)["']/g;
        const violations = [];

        for (const entry of entries) {
          const hits = [...(entry.source ?? "").matchAll(importPattern)].map((match) => match[1]);
          if (hits.length) {
            violations.push({ path: entry.path, imports: hits });
          }
        }

        if (violations.length) {
          return failWithData("Relative imports detected in settings/privacy source.", {
            count: violations.length,
            sample: violations.slice(0, 20),
          });
        }

        return { checkedFiles: entries.length, violations: 0 };
      },
    },
    {
      id: buildTestId(GROUP_ID, "surface_contract"),
      name: "settings privacy export surface contract",
      run: async () => ({
        hasPrivacyTabView: typeof PrivacyTabView === "function",
        hasProfilePrivacyToggle: typeof ProfilePrivacyToggle === "function",
        hasUserLookup: typeof UserLookup === "function",
        hasBlockedUsersSimple: typeof BlockedUsersSimple === "function",
        hasPendingFollowRequests: typeof PendingFollowRequests === "function",
        hasUseActorPrivacy: typeof useActorPrivacy === "function",
        hasUseActorLookup: typeof useActorLookup === "function",
        hasUsePendingFollowRequestActions: typeof usePendingFollowRequestActions === "function",
        hasMyBlocksProvider: typeof MyBlocksProvider === "function",
        hasUseMyBlocks: typeof useMyBlocks === "function",
        hasCtrlGetActorPrivacy: typeof ctrlGetActorPrivacy === "function",
        hasCtrlSetActorPrivacy: typeof ctrlSetActorPrivacy === "function",
        hasCtrlListMyBlocks: typeof ctrlListMyBlocks === "function",
        hasCtrlBlockActor: typeof ctrlBlockActor === "function",
        hasCtrlUnblockActor: typeof ctrlUnblockActor === "function",
        hasCtrlSearchActors: typeof ctrlSearchActors === "function",
        hasDalGetActorPrivacy: typeof dalGetActorPrivacy === "function",
        hasDalSetActorPrivacy: typeof dalSetActorPrivacy === "function",
        hasDalListMyBlocks: typeof dalListMyBlocks === "function",
        hasDalInsertBlock: typeof dalInsertBlock === "function",
        hasDalDeleteBlockByTarget: typeof dalDeleteBlockByTarget === "function",
        hasDalReadActorKindAndVportId: typeof dalReadActorKindAndVportId === "function",
        hasModelBlockRows: typeof modelBlockRows === "function",
        hasModelActorRows: typeof modelActorRows === "function",
      }),
    },
    {
      id: buildTestId(GROUP_ID, "privacy_context"),
      name: "resolve settings privacy diagnostics context",
      run: ({ shared: localShared }) =>
        withSettingsPrivacyContext(localShared, "Unable to resolve settings privacy context.", async (context) => ({
          userId: context.userId,
          actorId: context.actorId,
          kind: context.kind,
          scope: context.scope,
          username: context.username,
          candidateActorId: context.candidateActorId,
          existingBlockedCount: context.blockedIds?.size ?? 0,
        })),
    },
    {
      id: buildTestId(GROUP_ID, "privacy_read_controller_dal"),
      name: "privacy read controller/DAL consistency",
      run: ({ shared: localShared }) =>
        withSettingsPrivacyContext(localShared, "Privacy read path blocked by policy.", async (context) => {
          const [controllerValue, dalValue] = await Promise.all([
            ctrlGetActorPrivacy(context.actorId),
            dalGetActorPrivacy(context.actorId),
          ]);
          return { actorId: context.actorId, controllerValue, dalValue, match: controllerValue === dalValue };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "privacy_write_reversible"),
      name: "privacy write path reversible probe",
      run: ({ shared: localShared }) =>
        withSettingsPrivacyContext(localShared, "Privacy write path blocked by policy.", async (context) => {
          const before = await ctrlGetActorPrivacy(context.actorId);
          await ctrlSetActorPrivacy({ actorId: context.actorId, isPrivate: before });
          const after = await ctrlGetActorPrivacy(context.actorId);
          return { actorId: context.actorId, before, after, match: before === after };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "blocks_read_controller_dal"),
      name: "blocks read controller/DAL consistency",
      run: ({ shared: localShared }) =>
        withSettingsPrivacyContext(localShared, "Blocks read path blocked by policy.", async (context) => {
          const [controllerRows, dalRows] = await Promise.all([
            ctrlListMyBlocks({ actorId: context.actorId, scope: context.scope }),
            dalListMyBlocks({ actorId: context.actorId }),
          ]);
          return {
            actorId: context.actorId,
            scope: context.scope,
            controllerCount: controllerRows?.length ?? 0,
            dalCount: dalRows?.length ?? 0,
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "actor_lookup_search"),
      name: "actor lookup search controller",
      run: ({ shared: localShared }) =>
        withSettingsPrivacyContext(localShared, "Actor lookup search blocked by policy.", async (context) => {
          const query = String(context.username || context.displayName || "a").slice(0, 8).trim();
          if (!query) return makeSkipped("No query available for actor lookup search.");
          const rows = await ctrlSearchActors({ query });
          return { query, count: rows.length, sample: rows.slice(0, 5) };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "block_unblock_reversible"),
      name: "block/unblock reversible probe",
      run: ({ shared: localShared }) =>
        withSettingsPrivacyContext(localShared, "Block/unblock flow blocked by policy.", async (context) => {
          const targetActorId = context.candidateActorId;
          if (!targetActorId) {
            return makeSkipped("No unblocked candidate actor found for block/unblock probe.");
          }

          const startSet = new Set((await ctrlListMyBlocks({
            actorId: context.actorId,
            scope: context.scope,
          })).map((row) => row.blockedActorId));

          let changed = false;
          try {
            await ctrlBlockActor({
              actorId: context.actorId,
              blockedActorId: targetActorId,
              scope: context.scope,
              existingBlockedIds: startSet,
            });
            changed = !startSet.has(targetActorId);

            const midSet = new Set((await ctrlListMyBlocks({
              actorId: context.actorId,
              scope: context.scope,
            })).map((row) => row.blockedActorId));

            await ctrlUnblockActor({
              actorId: context.actorId,
              blockedActorId: targetActorId,
              scope: context.scope,
              existingBlockedIds: midSet,
            });

            const endSet = new Set((await ctrlListMyBlocks({
              actorId: context.actorId,
              scope: context.scope,
            })).map((row) => row.blockedActorId));

            return {
              actorId: context.actorId,
              targetActorId,
              changed,
              blockedAfterInsert: midSet.has(targetActorId),
              blockedAfterCleanup: endSet.has(targetActorId),
            };
          } finally {
            if (changed) {
              await ctrlUnblockActor({
                actorId: context.actorId,
                blockedActorId: targetActorId,
                scope: context.scope,
                existingBlockedIds: new Set([targetActorId]),
              }).catch(() => null);
            }
          }
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
