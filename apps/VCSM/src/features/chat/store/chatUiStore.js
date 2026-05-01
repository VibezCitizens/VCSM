// src/features/chat/store/chatUiStore.js
// ============================================================
// Chat UI Store
// ------------------------------------------------------------
// Zustand owns ONLY client-side UI state for chat.
// Server data (inbox entries, messages, participants) lives in
// React Query — never here.
// ============================================================

import { create } from 'zustand'

export const useChatUiStore = create((set) => ({
  selectedConversationId: null,
  isNewChatModalOpen: false,
  composerDraftByConversationId: {},
  activeChatFilter: 'all',

  setSelectedConversationId: (id) => set({ selectedConversationId: id }),

  setIsNewChatModalOpen: (open) => set({ isNewChatModalOpen: Boolean(open) }),

  setComposerDraft: (conversationId, draft) =>
    set((state) => ({
      composerDraftByConversationId: {
        ...state.composerDraftByConversationId,
        [conversationId]: draft,
      },
    })),

  clearComposerDraft: (conversationId) =>
    set((state) => {
      const { [conversationId]: _removed, ...rest } = state.composerDraftByConversationId
      return { composerDraftByConversationId: rest }
    }),

  setActiveChatFilter: (filter) => set({ activeChatFilter: filter }),
}))
