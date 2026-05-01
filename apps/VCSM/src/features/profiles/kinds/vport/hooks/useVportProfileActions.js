import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { shareNative } from "@/shared/lib/shareNative";
import useReportFlow from "@/features/moderation/adapters/hooks/useReportFlow.adapter";
import { useDeletePostAction } from "@/features/post/adapters/postcard/hooks/useDeletePostAction.adapter";

export function useVportProfileActions({ viewerActorId, onPostDeleted }) {
  const navigate = useNavigate();
  const deletePost = useDeletePostAction({ actorId: viewerActorId });
  const reportFlow = useReportFlow({ reporterActorId: viewerActorId });

  const [shareState, setShareState] = useState({ open: false, url: "", postId: null });
  const [postMenu, setPostMenu] = useState(null);

  const closeShare = useCallback(() => setShareState({ open: false, url: "", postId: null }), []);

  const handleShare = useCallback(async (postId) => {
    if (!postId) return;
    const url = `${window.location.origin}/post/${postId}`;
    const res = await shareNative({ title: "Spread", text: "", url });
    if (!res.ok) setShareState({ open: true, url, postId });
  }, []);

  const openPostMenu = useCallback(({ postId, postActorId, anchorRect }) => {
    if (!postId || !anchorRect) return;
    setPostMenu({ postId, postActorId: postActorId ?? null, isOwn: (postActorId ?? null) === (viewerActorId ?? null), anchorRect });
  }, [viewerActorId]);

  const closePostMenu = useCallback(() => setPostMenu(null), []);

  const handleReportPost = useCallback(() => {
    if (!viewerActorId || !postMenu?.postId) return;
    reportFlow.start({
      objectType: "post",
      objectId: postMenu.postId,
      postId: postMenu.postId,
      dedupeKey: `report:post:${postMenu.postId}`,
      title: "Report Vibe",
      subtitle: "Tell us what's wrong with this Vibe.",
    });
    closePostMenu();
  }, [viewerActorId, postMenu, reportFlow, closePostMenu]);

  const handleEditPost = useCallback(() => {
    if (!postMenu?.postId) return;
    closePostMenu();
    navigate(`/post/${postMenu.postId}/edit`);
  }, [postMenu, navigate, closePostMenu]);

  const handleDeletePost = useCallback(async () => {
    if (!viewerActorId || !postMenu?.postId) return;
    if (!window.confirm("Delete this Vibe?")) return;
    const res = await deletePost({ postId: postMenu.postId });
    if (!res.ok) { window.alert(res.error?.message ?? "Failed to delete Vibe"); return; }
    onPostDeleted?.();
    closePostMenu();
  }, [viewerActorId, postMenu, closePostMenu, deletePost, onPostDeleted]);

  return {
    shareState, closeShare, handleShare,
    postMenu, openPostMenu, closePostMenu,
    handleReportPost, handleEditPost, handleDeletePost,
    reportFlow,
  };
}
