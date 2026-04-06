// src/features/chat/conversation/hooks/conversation/useConversationActionsMenu.js
// ============================================================
// MIGRATED: markConversationSpam now uses shared chat engine.
// Authority: chat.* (via engine) for spam/report actions.
// Archive/unarchive delegated through inboxActions (already migrated).
// ============================================================

import { useCallback, useState } from "react";
import { markConversationSpam } from "@chat";

export default function useConversationActionsMenu({
  actorId,
  conversationId,
  inboxActions,
  navigate,
  reportFlow,
  setConversationCovered,
  undoConversationCover,
  closeMessageMenu,
}) {
  const [convMenu, setConvMenu] = useState(null);

  const openConvMenu = useCallback((anchorRect) => {
    if (!anchorRect) return;
    setConvMenu({ anchorRect });
  }, []);

  const closeConvMenu = useCallback(() => {
    setConvMenu(null);
  }, []);

  const handleReportConversation = useCallback(() => {
    if (!actorId || !conversationId) return;

    reportFlow.start({
      objectType: "conversation",
      objectId: conversationId,
      conversationId,
      dedupeKey: `report:conversation:${conversationId}`,
      title: "Report conversation",
      subtitle: "Tell us what's wrong with this conversation.",
    });

    closeConvMenu();
  }, [actorId, conversationId, reportFlow, closeConvMenu]);

  const handleMarkSpamConversation = useCallback(async () => {
    if (!actorId || !conversationId) return;

    try {
      await markConversationSpam({
        reporterActorId: actorId,
        conversationId,
        reasonText: null,
      });

      setConversationCovered(true);
      closeMessageMenu?.();
    } catch (e) {
      console.error("[markConversationSpam] failed", e);
    } finally {
      closeConvMenu();
    }
  }, [actorId, conversationId, setConversationCovered, closeConvMenu, closeMessageMenu, navigate]);

  const handleArchiveConversation = useCallback(async () => {
    if (!actorId || !conversationId) return;
    if (typeof inboxActions?.archive !== "function") return;

    try {
      await inboxActions.archive(conversationId);
      navigate("/chat/archived", { replace: true });
    } catch (e) {
      console.error("[archiveConversation] failed", e);
    } finally {
      closeConvMenu();
    }
  }, [actorId, conversationId, inboxActions, navigate, closeConvMenu]);

  const handleUnarchiveConversation = useCallback(async () => {
    if (!actorId || !conversationId) return;
    if (typeof inboxActions?.unarchive !== "function") return;

    try {
      await inboxActions.unarchive(conversationId);
      navigate("/chat");
    } catch (e) {
      console.error("[unarchiveConversation] failed", e);
    } finally {
      closeConvMenu();
    }
  }, [actorId, conversationId, inboxActions, navigate, closeConvMenu]);

  const handleUndoSpam = useCallback(async () => {
    await undoConversationCover();
  }, [undoConversationCover]);

  return {
    convMenu,
    openConvMenu,
    closeConvMenu,
    handleArchiveConversation,
    handleUnarchiveConversation,
    handleReportConversation,
    handleMarkSpamConversation,
    handleUndoSpam,
  };
}
