import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { makeSkipped } from "@/dev/diagnostics/helpers/supabaseAssert";
import ProfileTab from "@/features/settings/profile/adapter/ProfileTab";
import UserProfileTab from "@/features/settings/profile/adapter/UserProfileTab";
import VportProfileTab from "@/features/settings/profile/adapter/VportProfileTab";
import ProfileTabView from "@/features/settings/profile/ui/ProfileTab.view";
import VportAboutDetailsView from "@/features/settings/profile/ui/VportAboutDetails.view";
import HoursEditor from "@/features/settings/profile/ui/HoursEditor";
import ProfessionalAccessButton from "@/features/settings/profile/ui/ProfessionalAccessButton";
import { useProfileController } from "@/features/settings/profile/hooks/useProfileController";
import { useProfileUploads } from "@/features/settings/profile/hooks/useProfileUploads";
import { ctrlGetCurrentAuthUserId } from "@/features/settings/profile/controller/authSession.controller";
import { ctrlResolveVportIdByActorId } from "@/features/settings/profile/controller/resolveVportIdByActorId.controller";
import { loadProfileCore, saveProfileCore } from "@/features/settings/profile/controller/Profile.controller.core";
import { saveProfile } from "@/features/settings/profile/controller/saveProfile.controller";
import { dalGetCurrentAuthUserId } from "@/features/settings/profile/dal/auth.read.dal";
import { dalReadVportIdByActorId } from "@/features/settings/profile/dal/actors.read.dal";
import { fetchProfile } from "@/features/settings/profile/dal/profile.read.dal";
import { updateProfile } from "@/features/settings/profile/dal/profile.write.dal";
import { fetchVportPublicDetails } from "@/features/settings/profile/dal/vportPublicDetails.read.dal";
import { upsertVportPublicDetails } from "@/features/settings/profile/dal/vportPublicDetails.write.dal";
import { mapProfileToView, mapProfileUpdate } from "@/features/settings/profile/model/profile.mapper";
import {
  mapVportPublicDetailsToView,
  mapVportPublicDetailsUpdate,
} from "@/features/settings/profile/model/vportPublicDetails.mapper";
import {
  failWithData,
  getSettingsProfileEntries,
  withSettingsProfileContext,
} from "@/dev/diagnostics/groups/settingsProfileFeature.group.helpers";

export const GROUP_ID = "settingsProfileFeature";
export const GROUP_LABEL = "Settings Profile Feature";

const TEST_CATALOG = [
  { key: "feature_inventory", name: "settings profile file inventory" },
  { key: "import_path_contract", name: "settings profile import path contract check" },
  { key: "surface_contract", name: "settings profile export surface contract" },
  { key: "source_contract", name: "settings profile source contract checks" },
  { key: "profile_context", name: "resolve settings profile diagnostics context" },
  { key: "auth_session_consistency", name: "auth session controller/DAL consistency" },
  { key: "user_profile_read_core", name: "user profile read core path" },
  { key: "user_profile_save_noop", name: "user profile save no-op probe" },
  { key: "vport_actor_resolution", name: "vport id resolution for active actor" },
  { key: "vport_profile_read_core", name: "owned vport profile read core path" },
  { key: "vport_profile_save_noop", name: "owned vport profile save no-op probe" },
  { key: "vport_public_details_read_map", name: "vport public details read + mapper path" },
  { key: "vport_public_details_upsert_noop", name: "vport public details upsert no-op probe" },
];

function getSource(path) {
  return getSettingsProfileEntries().find((entry) => entry.path === path)?.source ?? "";
}

export function getSettingsProfileFeatureTests() {
  return TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export async function runSettingsProfileFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "feature_inventory"),
      name: "settings profile file inventory",
      run: async () => {
        const entries = getSettingsProfileEntries();
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
      name: "settings profile import path contract check",
      run: async () => {
        const entries = getSettingsProfileEntries();
        const importPattern = /from\s+["'](\.{1,2}\/[^"']+)["']/g;
        const violations = [];

        for (const entry of entries) {
          const hits = [...(entry.source ?? "").matchAll(importPattern)].map((m) => m[1]);
          if (hits.length) violations.push({ path: entry.path, imports: hits });
        }

        if (violations.length) {
          return failWithData("Relative imports detected in settings/profile source.", {
            count: violations.length,
            sample: violations.slice(0, 20),
          });
        }
        return { checkedFiles: entries.length, violations: 0 };
      },
    },
    {
      id: buildTestId(GROUP_ID, "surface_contract"),
      name: "settings profile export surface contract",
      run: async () => ({
        hasProfileTab: typeof ProfileTab === "function",
        hasUserProfileTab: typeof UserProfileTab === "function",
        hasVportProfileTab: typeof VportProfileTab === "function",
        hasProfileTabView: typeof ProfileTabView === "function",
        hasVportAboutDetailsView: typeof VportAboutDetailsView === "function",
        hasHoursEditor: typeof HoursEditor === "function",
        hasProfessionalAccessButton: typeof ProfessionalAccessButton === "function",
        hasUseProfileController: typeof useProfileController === "function",
        hasUseProfileUploads: typeof useProfileUploads === "function",
        hasLoadProfileCore: typeof loadProfileCore === "function",
        hasSaveProfileCore: typeof saveProfileCore === "function",
        hasLegacySaveProfile: typeof saveProfile === "function",
        hasFetchProfile: typeof fetchProfile === "function",
        hasUpdateProfile: typeof updateProfile === "function",
        hasFetchVportPublicDetails: typeof fetchVportPublicDetails === "function",
        hasUpsertVportPublicDetails: typeof upsertVportPublicDetails === "function",
        hasMapProfileToView: typeof mapProfileToView === "function",
        hasMapProfileUpdate: typeof mapProfileUpdate === "function",
        hasMapVportPublicDetailsToView: typeof mapVportPublicDetailsToView === "function",
        hasMapVportPublicDetailsUpdate: typeof mapVportPublicDetailsUpdate === "function",
      }),
    },
    {
      id: buildTestId(GROUP_ID, "source_contract"),
      name: "settings profile source contract checks",
      run: async () => {
        const legacySource = getSource("src/features/settings/profile/controller/saveProfile.controller.js");
        const aboutSource = getSource("src/features/settings/profile/ui/VportAboutDetails.view.jsx");
        const readDalSource = getSource("src/features/settings/profile/dal/vportPublicDetails.read.dal.js");
        const writeDalSource = getSource("src/features/settings/profile/dal/vportPublicDetails.write.dal.js");
        const indexSource = getSource("src/features/settings/profile/index.js");

        return {
          legacyControllerImportsSupabase: legacySource.includes("supabaseClient"),
          legacyControllerWritesProfilesDirectly: legacySource.includes(".from('profiles')"),
          vportAboutImportsDashboardBreakpointHook: aboutSource.includes("features/dashboard/vport"),
          vportPublicDetailsReadDalReturnsCamelAliases: readDalSource.includes("camelCase aliases"),
          vportPublicDetailsWriteDalMapsPayloadShape: writeDalSource.includes("mapPayloadToRow"),
          indexFileIsEmpty: indexSource.trim().length === 0,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "profile_context"),
      name: "resolve settings profile diagnostics context",
      run: ({ shared: localShared }) =>
        withSettingsProfileContext(localShared, "Unable to resolve settings profile diagnostics context.", async (context) => ({
          userId: context.userId,
          actorId: context.actorId,
          kind: context.kind,
          activeVportId: context.activeVportId,
          ownedVportActorId: context.ownedVportActorId,
          ownedVportId: context.ownedVportId,
        })),
    },
    {
      id: buildTestId(GROUP_ID, "auth_session_consistency"),
      name: "auth session controller/DAL consistency",
      run: ({ shared: localShared }) =>
        withSettingsProfileContext(localShared, "Auth session read blocked.", async () => {
          const [controllerUserId, dalUserId] = await Promise.all([
            ctrlGetCurrentAuthUserId(),
            dalGetCurrentAuthUserId(),
          ]);
          return { controllerUserId, dalUserId, match: controllerUserId === dalUserId };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "user_profile_read_core"),
      name: "user profile read core path",
      run: ({ shared: localShared }) =>
        withSettingsProfileContext(localShared, "User profile read core path blocked by policy.", async (context) => {
          const raw = await fetchProfile(context.userId, "user");
          const mapped = mapProfileToView(raw, "user");
          const core = await loadProfileCore({ subjectId: context.userId, mode: "user" });
          return {
            userId: context.userId,
            mappedDisplayName: mapped?.displayName ?? null,
            coreDisplayName: core?.displayName ?? null,
            sameUsername: mapped?.username === core?.username,
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "user_profile_save_noop"),
      name: "user profile save no-op probe",
      run: ({ shared: localShared }) =>
        withSettingsProfileContext(localShared, "User profile save path blocked by policy.", async (context) => {
          const current = await loadProfileCore({ subjectId: context.userId, mode: "user" });
          const next = await saveProfileCore({
            subjectId: context.userId,
            mode: "user",
            draft: { ...current, __avatarFile: null, __bannerFile: null },
            uploads: { uploadAvatar: async () => null, uploadBanner: async () => null },
          });

          return {
            userId: context.userId,
            beforeDisplayName: current?.displayName ?? null,
            afterDisplayName: next?.displayName ?? null,
            beforePhotoUrl: current?.photoUrl ?? null,
            afterPhotoUrl: next?.photoUrl ?? null,
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "vport_actor_resolution"),
      name: "vport id resolution for active actor",
      run: ({ shared: localShared }) =>
        withSettingsProfileContext(localShared, "Actor->vport resolution blocked by policy.", async (context) => {
          const [controllerVportId, dalVportId] = await Promise.all([
            ctrlResolveVportIdByActorId(context.actorId),
            dalReadVportIdByActorId(context.actorId),
          ]);
          return { actorId: context.actorId, controllerVportId, dalVportId, match: controllerVportId === dalVportId };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "vport_profile_read_core"),
      name: "owned vport profile read core path",
      run: ({ shared: localShared }) =>
        withSettingsProfileContext(localShared, "Owned vport profile read path blocked by policy.", async (context) => {
          const vportId = context.ownedVportId ?? context.activeVportId;
          if (!vportId) return makeSkipped("No owned/active vport id available for vport profile read.");
          const raw = await fetchProfile(vportId, "vport");
          const mapped = mapProfileToView(raw, "vport");
          const core = await loadProfileCore({ subjectId: vportId, mode: "vport" });
          return { vportId, mappedDisplayName: mapped?.displayName ?? null, coreDisplayName: core?.displayName ?? null };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "vport_profile_save_noop"),
      name: "owned vport profile save no-op probe",
      run: ({ shared: localShared }) =>
        withSettingsProfileContext(localShared, "Owned vport profile save path blocked by policy.", async (context) => {
          const vportId = context.ownedVportId ?? context.activeVportId;
          if (!vportId) return makeSkipped("No owned/active vport id available for vport profile save probe.");
          const current = await loadProfileCore({ subjectId: vportId, mode: "vport" });
          const next = await saveProfileCore({
            subjectId: vportId,
            mode: "vport",
            draft: { ...current, __avatarFile: null, __bannerFile: null },
            uploads: { uploadAvatar: async () => null, uploadBanner: async () => null },
          });
          return { vportId, beforeDisplayName: current?.displayName ?? null, afterDisplayName: next?.displayName ?? null };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "vport_public_details_read_map"),
      name: "vport public details read + mapper path",
      run: ({ shared: localShared }) =>
        withSettingsProfileContext(localShared, "Vport public details read blocked by policy.", async (context) => {
          const vportId = context.ownedVportId ?? context.activeVportId;
          if (!vportId) return makeSkipped("No owned/active vport id available for vport public details read.");
          const row = await fetchVportPublicDetails(vportId);
          const view = mapVportPublicDetailsToView(row);
          const patch = mapVportPublicDetailsUpdate(view);
          return { vportId, hasView: Boolean(view), patchKeys: Object.keys(patch).sort() };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "vport_public_details_upsert_noop"),
      name: "vport public details upsert no-op probe",
      run: ({ shared: localShared }) =>
        withSettingsProfileContext(localShared, "Vport public details upsert blocked by policy.", async (context) => {
          const vportId = context.ownedVportId ?? context.activeVportId;
          if (!vportId) return makeSkipped("No owned/active vport id available for vport public details upsert.");

          const before = await fetchVportPublicDetails(vportId);
          const patch = mapVportPublicDetailsUpdate(mapVportPublicDetailsToView(before));
          const upserted = await upsertVportPublicDetails(vportId, patch);
          return {
            vportId,
            beforeWebsiteUrl: before?.website_url ?? null,
            afterWebsiteUrl: upserted?.website_url ?? null,
            hasRow: Boolean(upserted?.vport_id),
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
