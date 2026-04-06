// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\post\screens\hooks\usePostDetailMenus.js

import { useCallback, useState } from "react";

export default function usePostDetailMenus({
  actorId,
  postId,
  thread,
  onReportPost,
  onEditPost,         // ✅ add
  onDeletePost,       // ✅ add
  onReportComment,
  onEditComment,
  onDeleteComment,
}) {
  // ============================
  // POST MENU
  // ============================
  const [postMenu, setPostMenu] = useState(null);

  const openPostMenu = useCallback(
    ({ postId: pid, postActorId, anchorRect }) => {
      if (!pid || !anchorRect) return;
      setPostMenu({
        postId: pid,
        postActorId: postActorId ?? null,
        isOwn: (postActorId ?? null) === (actorId ?? null),
        anchorRect,
      });
    },
    [actorId]
  );

  const closePostMenu = useCallback(() => {
    setPostMenu(null);
  }, []);

  const handleReportPostClick = useCallback(() => {
    if (!actorId) return;
    if (!postMenu?.postId) return;

    onReportPost?.({ postId: postMenu.postId });
    closePostMenu();
  }, [actorId, postMenu, onReportPost, closePostMenu]);

  // ✅ MISSING: edit post
  const handleEditPostClick = useCallback(() => {
    if (!postMenu?.postId) return;

    onEditPost?.({ postId: postMenu.postId });
    closePostMenu();
  }, [postMenu, onEditPost, closePostMenu]);

  // ✅ MISSING: delete post
  const handleDeletePostClick = useCallback(async () => {
    if (!actorId) return;
    if (!postMenu?.postId) return;

    await onDeletePost?.({ postId: postMenu.postId });
    closePostMenu();
  }, [actorId, postMenu, onDeletePost, closePostMenu]);

  // ============================
  // COMMENT MENU
  // ============================
  const [commentMenu, setCommentMenu] = useState(null);

  const openCommentMenu = useCallback(
    ({ commentId, commentActorId, anchorRect }) => {
      if (!commentId || !anchorRect) return;

      setCommentMenu({
        commentId,
        commentActorId: commentActorId ?? null,
        isOwn: (commentActorId ?? null) === (actorId ?? null),
        anchorRect,
      });
    },
    [actorId]
  );

  const closeCommentMenu = useCallback(() => {
    setCommentMenu(null);
  }, []);

  const handleReportCommentClick = useCallback(() => {
    if (!actorId) return;
    if (!commentMenu?.commentId) return;

    onReportComment?.({ commentId: commentMenu.commentId, postId });
    closeCommentMenu();
  }, [actorId, commentMenu, onReportComment, closeCommentMenu, postId]);

  const handleEditCommentClick = useCallback(() => {
    if (!commentMenu?.commentId) return;

    onEditComment?.(commentMenu.commentId);
    closeCommentMenu();
  }, [commentMenu, onEditComment, closeCommentMenu]);

  const handleDeleteCommentClick = useCallback(async () => {
    if (!actorId) return;
    if (!commentMenu?.commentId) return;

    await onDeleteComment?.(commentMenu.commentId);
    await thread.reload?.();
    closeCommentMenu();
  }, [actorId, commentMenu, onDeleteComment, thread, closeCommentMenu]);

  return {
    postMenu,
    commentMenu,

    openPostMenu,
    closePostMenu,
    handleReportPostClick,
    handleEditPostClick,     // ✅ return
    handleDeletePostClick,   // ✅ return

    openCommentMenu,
    closeCommentMenu,
    handleReportCommentClick,
    handleEditCommentClick,
    handleDeleteCommentClick,
  };
}
