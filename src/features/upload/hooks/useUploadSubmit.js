// src/features/upload/hooks/useUploadSubmit.js
import { useCallback, useState } from "react";
import { useIdentity } from "@/state/identity/identityContext";
import { uploadMedia } from "../api/uploadMedia";
import { createPostController } from "../controllers/createPostController";

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

        if (form.files && form.files.length) {
          const res = await uploadMedia(form.files, identity.actorId, form.mode);
          mediaUrls = res.mediaUrls;
          mediaTypes = res.mediaTypes;
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
