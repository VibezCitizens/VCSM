// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\post\postcard\hooks\usePostDetailReporting.js

import { useCallback, useState } from "react";
import useReportFlow from "@/features/moderation/hooks/useReportFlow";
import { hideCommentForActor } from "@/features/moderation/controllers/commentVisibility.controller";
import { hidePostForActor } from "@/features/moderation/controllers/postVisibility.controller";

export default function usePostDetailReporting({ actorId, postId, commentCovers }) {
  const reportFlow = useReportFlow({ reporterActorId: actorId });

  const [reportedPostId, setReportedPostId] = useState(null);

  const clearReportedPost = useCallback(() => {
    setReportedPostId(null);
  }, []);

  const openReportPost = useCallback(
    ({ postId: pid }) => {
      if (!actorId) return;
      if (!pid) return;

      reportFlow.start({
        objectType: "post",
        objectId: pid,
        postId: pid,
        dedupeKey: `report:post:${pid}`,
        title: "Report post",
        subtitle: "Tell us what’s wrong with this post.",
      });
    },
    [actorId, reportFlow]
  );

  const openReportComment = useCallback(
    ({ commentId, postId: pid }) => {
      if (!actorId) return;
      if (!commentId) return;

      reportFlow.start({
        objectType: "comment",
        objectId: commentId,
        postId: pid ?? postId,
        dedupeKey: `report:comment:${commentId}`,
        title: "Report comment",
        subtitle: "Tell us what’s wrong with this comment.",
      });
    },
    [actorId, reportFlow, postId]
  );

  const handleReportSubmit = useCallback(
    async (payload) => {
      // ✅ snapshot BEFORE submit() clears context
      const ctx = reportFlow.context;
      const objectType = ctx?.objectType ?? null;
      const objectId = ctx?.objectId ?? null;

      try {
        await reportFlow.submit?.(payload);

        // ✅ POST: show overlay + persist hide for actor
        if (objectType === "post" && objectId) {
          setReportedPostId(objectId);

          if (actorId) {
            try {
              await hidePostForActor({
                actorId,
                postId: objectId,
                reportId: null, // useReportFlow doesn't return reportId
                reason: "user_reported_post",
              });
            } catch (e) {
              console.warn("[PostDetail] hidePostForActor failed:", e);
            }
          }

          return;
        }

        // ✅ COMMENT: cover + persist + refresh
        if (objectType === "comment" && objectId) {
          commentCovers.coverNow?.(objectId);

          if (actorId) {
            try {
              await hideCommentForActor({
                actorId,
                commentId: objectId,
                reportId: null,
                reason: "user_reported_comment",
              });
            } catch (e) {
              console.warn("[PostDetail] hideCommentForActor failed:", e);
            }
          }

          await commentCovers.refresh?.();
        }
      } catch (err) {
        console.error("[PostDetail] report submit failed:", err);
      }
    },
    [reportFlow, commentCovers, actorId]
  );

  return {
    reportFlow,
    reportedPostId,
    clearReportedPost,
    openReportPost,
    openReportComment,
    handleReportSubmit,
  };
}
