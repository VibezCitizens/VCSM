import { useState, useCallback } from "react";
import { shareNative } from "@/shared/lib/shareNative";
import {
  useDeletePostAction,
  useReportFlow,
} from "@/features/profiles/adapters/ui/actorProfileScreenDependencies.adapter";

export function useActorProfileActions({
  viewerActorId,
  navigate,
  onPostDeleted,
}) {
  const deletePost = useDeletePostAction({ actorId: viewerActorId });
  const reportFlow = useReportFlow({ reporterActorId: viewerActorId });

  const [shareState, setShareState] = useState({
    open: false,
    url: "",
    postId: null,
  });

  const [postMenu, setPostMenu] = useState(null);

  const closeShare = useCallback(() => {
    setShareState({ open: false, url: "", postId: null });
  }, []);

  const handleShare = useCallback(async (postId) => {
    if (!postId) return;

    const url = `${window.location.origin}/post/${postId}`;
    const res = await shareNative({
      title: "Spread",
      text: "",
      url,
    });

    if (!res.ok) {
      setShareState({ open: true, url, postId });
    }
  }, []);

  const openPostMenu = useCallback(
    ({ postId, postActorId, anchorRect }) => {
      if (!postId || !anchorRect) return;

      setPostMenu({
        postId,
        postActorId: postActorId ?? null,
        isOwn: (postActorId ?? null) === (viewerActorId ?? null),
        anchorRect,
      });
    },
    [viewerActorId]
  );

  const closePostMenu = useCallback(() => {
    setPostMenu(null);
  }, []);

  const handleReportPost = useCallback(() => {
    if (!viewerActorId) return;
    if (!postMenu?.postId) return;

    reportFlow.start({
      objectType: "post",
      objectId: postMenu.postId,
      postId: postMenu.postId,
      dedupeKey: `report:post:${postMenu.postId}`,
      title: "Report Vibe",
      subtitle: "Tell us what is wrong with this Vibe.",
    });

    closePostMenu();
  }, [viewerActorId, postMenu, reportFlow, closePostMenu]);

  const handleEditPost = useCallback(() => {
    if (!postMenu?.postId) return;
    closePostMenu();
    navigate(`/post/${postMenu.postId}/edit`);
  }, [postMenu, navigate, closePostMenu]);

  const handleDeletePost = useCallback(async () => {
    if (!viewerActorId) return;
    if (!postMenu?.postId) return;

    const okConfirm = window.confirm("Delete this Vibe?");
    if (!okConfirm) return;

    const res = await deletePost({
      postId: postMenu.postId,
    });

    if (!res.ok) {
      window.alert(res.error?.message ?? "Failed to delete Vibe");
      return;
    }

    onPostDeleted?.();
    closePostMenu();
  }, [viewerActorId, postMenu, closePostMenu, deletePost, onPostDeleted]);

  return {
    reportFlow,
    shareState,
    closeShare,
    handleShare,
    postMenu,
    openPostMenu,
    closePostMenu,
    handleReportPost,
    handleEditPost,
    handleDeletePost,
  };
}
