import React from "react";
import { CommentReplyModal, CommentComposeModal } from "@/features/post/commentcard/adapters/commentcard.adapter";
import PostActionsMenu from "@/features/post/postcard/components/PostActionsMenu";
import ReportModal from "@/features/moderation/adapters/components/ReportModal.adapter";
import PostConfirmModal from "@/features/post/postcard/components/PostConfirmModal";
import ReportedObjectCover from "@/features/moderation/adapters/components/ReportedObjectCover.adapter";

export function PostDetailModals({
  replyRef,
  replyModalOpen,
  submitting,
  closeReplyModal,
  submitReplyFromModal,
  composeRef,
  composeOpen,
  closeCompose,
  submitCompose,
  menus,
  reporting,
  confirmState,
  closeConfirm,
  isCovered,
  navigate,
}) {
  return (
    <>
      <CommentReplyModal
        ref={replyRef}
        open={replyModalOpen}
        submitting={submitting}
        onClose={closeReplyModal}
        onSubmit={submitReplyFromModal}
      />

      <CommentComposeModal
        ref={composeRef}
        open={composeOpen}
        submitting={submitting}
        onClose={closeCompose}
        onSubmit={submitCompose}
      />

      <PostActionsMenu
        open={!!menus.postMenu}
        anchorRect={menus.postMenu?.anchorRect}
        isOwn={!!menus.postMenu?.isOwn}
        onClose={menus.closePostMenu}
        onReport={menus.handleReportPostClick}
        onEdit={menus.handleEditPostClick}
        onDelete={menus.handleDeletePostClick}
      />

      <PostActionsMenu
        open={!!menus.commentMenu}
        anchorRect={menus.commentMenu?.anchorRect}
        isOwn={!!menus.commentMenu?.isOwn}
        onClose={menus.closeCommentMenu}
        onEdit={menus.handleEditCommentClick}
        onDelete={menus.handleDeleteCommentClick}
        onReport={menus.handleReportCommentClick}
      />

      <ReportModal
        open={reporting.reportFlow.open}
        title={reporting.reportFlow.context?.title ?? "Report"}
        subtitle={reporting.reportFlow.context?.subtitle ?? null}
        loading={reporting.reportFlow.loading}
        onClose={reporting.reportFlow.close}
        onSubmit={async (payload) => {
          try {
            await reporting.handleReportSubmit(payload);
          } catch {
            reporting.clearReportedPost?.();
          }
        }}
      />

      <PostConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        tone={confirmState.tone}
        onCancel={() => closeConfirm(false)}
        onConfirm={() => closeConfirm(true)}
      />

      <ReportedObjectCover
        open={isCovered}
        title="Report sent"
        subtitle="You reported this Vibe. It's now hidden for you while we review it."
        primaryLabel="Back To Central Citizen"
        onPrimary={() => navigate(-1)}
        secondaryLabel="Close"
        onSecondary={reporting.clearReportedPost}
      />
    </>
  );
}
