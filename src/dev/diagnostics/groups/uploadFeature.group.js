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
  getRootDomain,
  UPLOAD_TEST_CATALOG,
  getUploadEntries,
  getUploadSource,
  isCrossFeatureBoundaryViolation,
  trimAudit,
  withUploadFeatureContext,
} from "@/dev/diagnostics/groups/uploadFeature.group.helpers";
import UploadScreen from "@/features/upload/screens/UploadScreen";
import UploadScreenModern from "@/features/upload/screens/UploadScreenModern";
import UploadCard from "@/features/upload/ui/UploadCard";
import CaptionCard from "@/features/upload/ui/CaptionCard";
import UploadHeader from "@/features/upload/ui/UploadHeader";
import PrimaryActionButton from "@/features/upload/ui/PrimaryActionButton";
import MentionTypeahead from "@/features/upload/ui/MentionTypeahead";
import MentionAutocompleteList from "@/features/upload/ui/MentionAutocompleteList";
import { useUploadSubmit } from "@/features/upload/hooks/useUploadSubmit";
import { useMentionAutocomplete } from "@/features/upload/hooks/useMentionAutocomplete";
import { useMediaSelection, MAX_VIBES_PHOTOS } from "@/features/upload/hooks/useMediaSelection";
import { useResolvedActor } from "@/features/upload/hooks/useResolvedActor";
import { ctrlSearchMentionSuggestions } from "@/features/upload/controller/searchMentionSuggestions.controller";
import { createPostController } from "@/features/upload/controllers/createPostController";
import { searchMentionSuggestions } from "@/features/upload/dal/searchMentionSuggestions";
import { findActorsByHandles } from "@/features/upload/dal/findActorsByHandles";
import { findPostMentionsByPostIds } from "@/features/upload/dal/findPostMentionsByPostIds";
import { insertPost } from "@/features/upload/dal/insertPost";
import { insertPostMedia } from "@/features/upload/dal/insertPostMedia";
import { insertPostMentions } from "@/features/upload/dal/insertPostMentions";
import { uploadMedia } from "@/features/upload/api/uploadMedia";
import { resolveRealm } from "@/features/upload/model/resolveRealm";
import { createInitialPostPayload, MediaType, Visibility } from "@/features/upload/model/uploadTypes";
import { extractHashtags } from "@/features/upload/lib/extractHashtags";
import { extractMentions } from "@/features/upload/lib/extractMentions";
import { classifyFile } from "@/features/upload/lib/classifyFile";
import { compressIfNeeded } from "@/features/upload/lib/compressIfNeeded";

export const GROUP_ID = "uploadFeature";
export const GROUP_LABEL = "Upload Feature";

export function getUploadFeatureTests() {
  return UPLOAD_TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export async function runUploadFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "feature_inventory"),
      name: "upload file inventory",
      run: async () => {
        const entries = getUploadEntries();
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
      name: "upload architecture audit",
      run: async () => {
        const audit = trimAudit(auditFeature("upload"));
        if (audit.issueCount > 0) {
          return failWithData(`Upload feature has ${audit.issueCount} architecture issues`, audit);
        }
        return audit;
      },
    },
    {
      id: buildTestId(GROUP_ID, "import_path_contract"),
      name: "upload import path contract check",
      run: async () => {
        const entries = getUploadEntries();
        const importPattern = /(?:from\s+["'](\.{1,2}\/[^"']+)["']|import\s*\(\s*["'](\.{1,2}\/[^"']+)["']\s*\))/g;
        const violations = [];

        for (const entry of entries) {
          const hits = [];
          let match = importPattern.exec(entry.source ?? "");
          while (match) {
            hits.push(match[1] ?? match[2]);
            match = importPattern.exec(entry.source ?? "");
          }
          importPattern.lastIndex = 0;
          if (hits.length) {
            violations.push({ path: entry.path, imports: hits });
          }
        }

        if (violations.length > 0) {
          return failWithData("Relative imports detected in upload source.", {
            count: violations.length,
            sample: violations.slice(0, 20),
          });
        }

        return { checkedFiles: entries.length, violations: 0 };
      },
    },
    {
      id: buildTestId(GROUP_ID, "cross_feature_boundary"),
      name: "upload cross-feature boundary check",
      run: async () => {
        const entries = getUploadEntries();
        const violations = [];
        for (const entry of entries) {
          const specifiers = extractImportSpecifiers(entry.source);
          const bad = specifiers.filter((specifier) =>
            isCrossFeatureBoundaryViolation("upload", specifier)
          );
          if (bad.length) {
            violations.push({ path: entry.path, imports: bad });
          }
        }

        if (violations.length > 0) {
          return failWithData("Cross-feature internal imports detected in upload feature.", {
            count: violations.length,
            sample: violations.slice(0, 20),
          });
        }

        return { checkedFiles: entries.length, violations: 0 };
      },
    },
    {
      id: buildTestId(GROUP_ID, "folder_shape_contract"),
      name: "upload folder shape contract",
      run: async () => {
        const entries = getUploadEntries();
        const domains = new Set(entries.map((entry) => getRootDomain(entry.path)));
        const hasController = domains.has("controller");
        const hasControllers = domains.has("controllers");
        const payload = {
          domains: Array.from(domains).sort((a, b) => a.localeCompare(b)),
          hasController,
          hasControllers,
          mixedControllerFolders: hasController && hasControllers,
        };

        if (payload.mixedControllerFolders) {
          return failWithData("Upload feature mixes controller/ and controllers/ folders.", payload);
        }
        return payload;
      },
    },
    {
      id: buildTestId(GROUP_ID, "surface_contract"),
      name: "upload export surface contract",
      run: async () => ({
        hasUploadScreen: typeof UploadScreen === "function",
        hasUploadScreenModern: typeof UploadScreenModern === "function",
        hasUploadHeader: typeof UploadHeader === "function",
        hasUploadCard: typeof UploadCard === "function",
        hasCaptionCard: typeof CaptionCard === "function",
        hasPrimaryActionButton: typeof PrimaryActionButton === "function",
        hasMentionTypeahead: typeof MentionTypeahead === "function",
        hasMentionAutocompleteList: typeof MentionAutocompleteList === "function",
        hasUseUploadSubmit: typeof useUploadSubmit === "function",
        hasUseMentionAutocomplete: typeof useMentionAutocomplete === "function",
        hasUseMediaSelection: typeof useMediaSelection === "function",
        hasUseResolvedActor: typeof useResolvedActor === "function",
        hasCreatePostController: typeof createPostController === "function",
        hasCtrlSearchMentionSuggestions: typeof ctrlSearchMentionSuggestions === "function",
        hasSearchMentionSuggestionsDal: typeof searchMentionSuggestions === "function",
        hasFindActorsByHandlesDal: typeof findActorsByHandles === "function",
        hasFindPostMentionsByPostIdsDal: typeof findPostMentionsByPostIds === "function",
        hasInsertPostDal: typeof insertPost === "function",
        hasInsertPostMediaDal: typeof insertPostMedia === "function",
        hasInsertPostMentionsDal: typeof insertPostMentions === "function",
      }),
    },
    {
      id: buildTestId(GROUP_ID, "pure_contract"),
      name: "upload pure helper/model contract",
      run: async () => ({
        maxVibesPhotos: MAX_VIBES_PHOTOS,
        realmUser: resolveRealm(false),
        realmVoid: resolveRealm(true),
        uploadMediaEmpty: await uploadMedia([], "diag-actor", "post"),
        initialPayload: createInitialPostPayload(),
        mediaTypeText: MediaType.TEXT,
        visibilityPublic: Visibility.PUBLIC,
        hashtagExtract: extractHashtags("Hello #Dev #dev #UI"),
        mentionExtract: extractMentions("Hi @Alice and @alice and @bob"),
        classifyFileNoFile: classifyFile(null),
        compressNoFile: await compressIfNeeded(null),
      }),
    },
    {
      id: buildTestId(GROUP_ID, "mention_search_controller"),
      name: "upload mention search controller path",
      run: ({ shared: localShared }) =>
        withUploadFeatureContext(
          localShared,
          "Upload mention search is blocked by policy/RLS.",
          async (context) => {
            const query = (context.username || "a").slice(0, 8);
            try {
              const rows = await ctrlSearchMentionSuggestions({ query, limit: 8 });
              return {
                query,
                count: rows.length,
                sample: rows.slice(0, 5),
              };
            } catch (error) {
              if (isPermissionDenied(error) || isRlsDenied(error)) {
                return makeSkipped("Mention search blocked by policy for current actor context.", {
                  query,
                  error,
                });
              }
              throw error;
            }
          }
        ),
    },
    {
      id: buildTestId(GROUP_ID, "handles_resolution_read"),
      name: "upload handle resolution read path",
      run: ({ shared: localShared }) =>
        withUploadFeatureContext(
          localShared,
          "Upload handle->actor resolution is blocked by policy/RLS.",
          async (context) => {
            if (!context.username) {
              return makeSkipped("No username available on authenticated profile for handle resolution test.");
            }
            try {
              const rows = await findActorsByHandles([context.username]);
              return {
                username: context.username,
                count: rows.length,
                hasSelfActor: rows.some((row) => row.actor_id === context.actorId),
                sample: rows.slice(0, 5),
              };
            } catch (error) {
              if (isPermissionDenied(error) || isRlsDenied(error)) {
                return makeSkipped("Handle resolution blocked by policy for current actor context.", {
                  username: context.username,
                  error,
                });
              }
              throw error;
            }
          }
        ),
    },
    {
      id: buildTestId(GROUP_ID, "mentions_read_empty"),
      name: "upload post mention read empty-input contract",
      run: async () => {
        const rows = await findPostMentionsByPostIds([]);
        return { count: rows.length, rows };
      },
    },
    {
      id: buildTestId(GROUP_ID, "create_post_source_contract"),
      name: "upload create post source contract checks",
      run: async () => {
        const source = getUploadSource("src/features/upload/controllers/createPostController.js");
        return {
          hasAuthGetUserGuard: source.includes("supabase.auth.getUser"),
          hasActorGuard: source.includes("No actor identity"),
          hasResolveRealmModel: source.includes("resolveRealm("),
          hasInsertPostCall: source.includes("insertPost("),
          hasInsertPostMediaCall: source.includes("insertPostMedia("),
          hasMentionPipeline: source.includes("extractMentions") && source.includes("insertPostMentions"),
          hasRollbackDelete: source.includes(".from(\"posts\").delete()") || source.includes(".from('posts').delete()"),
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "destructive_write_skipped"),
      name: "upload create post write path intentionally skipped",
      run: async () =>
        makeSkipped(
          "Diagnostics does not auto-create posts/media in upload feature group to avoid leaving database/storage garbage."
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
