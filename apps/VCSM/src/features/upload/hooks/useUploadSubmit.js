// src/features/upload/hooks/useUploadSubmit.js
import { useCallback, useState } from "react";
import { useIdentity } from "@/state/identity/identityContext";
import { uploadMedia } from "../api/uploadMedia";
import { createPostController } from "../controllers/createPost.controller";
import { recordPostMediaController } from "@/features/upload/controller/recordPostMedia.controller";
import { bugBunnyUploadStep, bugBunnyUploadError } from "@debuggers/media/bugBunnyUploadDebugger";

/**
 * Hook Contract:
 * - owns orchestration timing + UI lifecycle state (loading/error)
 * - calls controllers (authoritative)
 * - NEVER imports supabase or DAL
 */
export function useUploadSubmit() {
  const { identity } = useIdentity();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = useCallback(
    async (form) => {
      if (!identity) throw new Error("Identity not ready");

      setLoading(true);
      setError("");

      try {
        // UI -> upload adapter -> controller
        let mediaUrls = [];
        let mediaTypes = [];
        let uploadResults = [];

        if (form.files && form.files.length) {
          bugBunnyUploadStep('vibe_post', 'upload:start', { actorId: identity.actorId, mode: form.mode, fileCount: form.files.length })
          const res = await uploadMedia(form.files, identity.actorId, form.mode);
          mediaUrls     = res.mediaUrls;
          mediaTypes    = res.mediaTypes;
          uploadResults = res.uploadResults ?? [];
          bugBunnyUploadStep('vibe_post', 'upload:done', { count: uploadResults.length })
        }

        const result = await createPostController({
          identity,
          input: {
            caption: form.caption,
            visibility: form.visibility,
            mode: form.mode,

            // media
            mediaUrls,
            mediaTypes,

            // UI-only (controller may choose to trust or recompute)
            mentions: form.mentions || [],
            mentionsResolved: Array.isArray(form.mentionsResolved) ? form.mentionsResolved : [],
            locationText: form.locationText || "",

            // backward compat
            mediaUrl: mediaUrls[0] || "",
            mediaType: mediaTypes[0] || null,
          },
        });

        if (uploadResults.length > 0 && result?.postId) {
          bugBunnyUploadStep('vibe_post', 'writeback:dispatch', { postId: result.postId, postMediaIds: result.postMediaIds, uploadCount: uploadResults.length })
          recordPostMediaController({
            actorId:       identity.actorId,
            mode:          form.mode,
            postId:        result.postId,
            uploadResults,
            postMediaIds:  result.postMediaIds ?? [],
          }).catch((e) => {
            bugBunnyUploadError('vibe_post', 'writeback:record-failed', e, { postId: result.postId })
            if (import.meta.env?.DEV) console.warn('[useUploadSubmit] media_assets record failed (non-fatal):', e?.message)
          })
        }

        return result; // { actorId, tags, postId, mentions }
      } catch (e) {
        const msg = e?.message || "Failed to create post";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [identity]
  );

  return { submit, loading, error, setError };
}
